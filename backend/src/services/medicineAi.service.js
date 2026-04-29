const https = require('https');
const { GROQ_API_KEY } = require('../config/env');

const postJson = ({ hostname, path, headers, body }) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body);
  const req = https.request(
    {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    },
    (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Groq API error (${res.statusCode}): ${responseBody}`));
          return;
        }
        try {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } catch (err) {
          reject(new Error('Groq returned non-JSON response'));
        }
      });
    }
  );
  req.on('error', reject);
  req.write(payload);
  req.end();
});

const normalizeImageAnalysis = (result) => ({
  success: true,
  extracted_text: result?.medicine_name || null,
  analysis: {
    medicine_name: result?.medicine_name || null,
    what_for: result?.what_for || 'Not clear from the image.',
    strength: result?.strength || 'Unknown',
    common_dose: result?.common_dose || 'Consult your doctor/pharmacist for the exact dose.',
    how_many_doses: result?.how_many_doses || 'As prescribed by the doctor.',
    side_effects: result?.side_effects || 'Not available.',
    prescription_required: Boolean(result?.prescription_required),
    confidence: result?.confidence || 'low',
    summary: result?.summary || 'I could not confidently interpret the medicine image.',
    warnings: result?.warnings || 'This is general information only. Please confirm with a doctor or pharmacist before taking any medicine.',
  },
});

const parseJsonFromText = (text) => {
  if (!text) return null;
  const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { return null; }
    }
    return null;
  }
};

const analyzeMedicineImage = async ({ imageBase64, mimeType = 'image/jpeg' }) => {
  if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY in .env');

  const prompt = `You are a medicine photo assistant for a clinic app.
The user has uploaded a medicine image as base64. Analyze it and return STRICT JSON only in this exact shape:
{"medicine_name":"string|null","what_for":"string","strength":"string","common_dose":"string","how_many_doses":"string","side_effects":"string","prescription_required":true,"confidence":"high|medium|low","summary":"string","warnings":"string"}
Rules:
- If the image is unclear, set medicine_name to null and confidence to low.
- Do not diagnose a disease.
- Give general medicine information only, not personal medical advice.`;

  const body = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.2,
  };

  const raw = await postJson({
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body,
  });

  const text = raw?.choices?.[0]?.message?.content || '';
  const parsed = parseJsonFromText(text);
  if (!parsed) throw new Error('Unable to parse Groq medicine analysis output');

  return normalizeImageAnalysis(parsed);
};

module.exports = { analyzeMedicineImage };