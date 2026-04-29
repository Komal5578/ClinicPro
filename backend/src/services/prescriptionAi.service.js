const https = require('https');
const { GROQ_API_KEY } = require('../config/env');

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

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
        } catch {
          reject(new Error('Groq returned non-JSON response'));
        }
      });
    }
  );

  req.on('error', reject);
  req.write(payload);
  req.end();
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
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const normalizeItems = (items = []) => items
  .filter((item) => item && (item.medicine_name || item.dosage))
  .map((item) => ({
    medicine_name: String(item.medicine_name || '').trim(),
    dosage: String(item.dosage || '').trim(),
    frequency: String(item.frequency || '').trim(),
    duration_days: Number.isFinite(Number(item.duration_days)) && Number(item.duration_days) > 0
      ? Number(item.duration_days)
      : '',
    notes: String(item.notes || '').trim(),
  }))
  .filter((item) => item.medicine_name && item.dosage);

const buildPrompt = (dictationText) => `You are assisting a doctor writing a prescription.
Convert the spoken dictation into STRICT JSON only.

Output format:
{"items":[{"medicine_name":"string","dosage":"string","frequency":"string","duration_days":number,"notes":"string"}]}

Rules:
- Extract only medicines actually prescribed.
- Keep dosage concise, examples: "1 tablet", "5 ml".
- If duration is missing, set duration_days to 0.
- If frequency is missing, set frequency to "".
- If notes are missing, set notes to "".
- Return valid JSON only, no markdown.

Doctor dictation:
${dictationText}`;

const parsePrescriptionFromDictation = async ({ dictationText }) => {
  if (!String(dictationText || '').trim()) {
    throw new Error('dictationText is required');
  }

  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in .env');
  }

  const body = {
    model: process.env.GROQ_MODEL || DEFAULT_MODEL,
    temperature: 0.1,
    max_tokens: 1200,
    messages: [
      {
        role: 'user',
        content: buildPrompt(dictationText),
      },
    ],
  };

  const raw = await postJson({
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body,
  });

  const text = raw?.choices?.[0]?.message?.content || '';
  const parsed = parseJsonFromText(text);
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('Unable to parse AI prescription output');
  }

  return normalizeItems(parsed.items);
};

module.exports = { parsePrescriptionFromDictation };
