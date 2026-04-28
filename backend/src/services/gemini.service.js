const https = require('https');
const {
  AI_API_KEY,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
} = require('../config/env');

let cachedResolvedModel = null;

const parseJsonFromText = (text) => {
  if (!text) return null;

  // Remove optional markdown code fences before parsing.
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = cleaned.slice(first, last + 1);
      try {
        return JSON.parse(candidate);
      } catch (innerErr) {
        return null;
      }
    }
    return null;
  }
};

const postJson = ({ hostname, path, body, headers = {}, providerName = 'AI' }) => new Promise((resolve, reject) => {
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
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        let json;
        try {
          json = responseBody ? JSON.parse(responseBody) : {};
        } catch (err) {
          reject(new Error('Gemini returned non-JSON response'));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${providerName} API error (${res.statusCode}): ${responseBody}`));
          return;
        }

        resolve(json);
      });
    }
  );

  req.on('error', reject);
  req.write(payload);
  req.end();
});

const getJson = ({ hostname, path }) => new Promise((resolve, reject) => {
  const req = https.request(
    {
      hostname,
      port: 443,
      path,
      method: 'GET',
    },
    (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        let json;
        try {
          json = responseBody ? JSON.parse(responseBody) : {};
        } catch (err) {
          reject(new Error('Gemini returned non-JSON response'));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Gemini API error (${res.statusCode}): ${responseBody}`));
          return;
        }

        resolve(json);
      });
    }
  );

  req.on('error', reject);
  req.end();
});

const normalizeModelPath = (modelName) => {
  const m = String(modelName || '').trim();
  if (!m) return null;
  return m.startsWith('models/') ? m : `models/${m}`;
};

const resolveGeminiModel = async (key) => {
  if (cachedResolvedModel) return cachedResolvedModel;

  if (GEMINI_MODEL && GEMINI_MODEL.trim()) {
    cachedResolvedModel = normalizeModelPath(GEMINI_MODEL);
    return cachedResolvedModel;
  }

  try {
    const raw = await getJson({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models?key=${encodeURIComponent(key)}`,
    });

    const models = Array.isArray(raw?.models) ? raw.models : [];
    const compatible = models.filter((m) =>
      Array.isArray(m?.supportedGenerationMethods)
      && m.supportedGenerationMethods.includes('generateContent')
    );

    const preferred = [
      'models/gemini-2.5-flash',
      'models/gemini-2.5-flash-lite',
      'models/gemini-2.0-flash-lite',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
    ];
    for (const name of preferred) {
      const match = compatible.find((m) => m.name === name);
      if (match) {
        cachedResolvedModel = match.name;
        return cachedResolvedModel;
      }
    }

    if (compatible.length > 0) {
      cachedResolvedModel = compatible[0].name;
      return cachedResolvedModel;
    }
  } catch (err) {
    if (String(err.message).includes('API_KEY_INVALID')) {
      throw new Error('Gemini API key is invalid or not enabled for Generative Language API');
    }
    throw err;
  }

  cachedResolvedModel = 'models/gemini-2.5-flash';
  return cachedResolvedModel;
};

const normalizeRecommendation = (result) => {
  const allowed = new Set(['GENERAL', 'AYURVEDIC', 'DENTAL']);
  const sector = allowed.has(String(result?.sector || '').toUpperCase())
    ? String(result.sector).toUpperCase()
    : 'GENERAL';

  const defaults = {
    GENERAL: 'General Physician',
    AYURVEDIC: 'Ayurvedic Doctor',
    DENTAL: 'Dentist',
  };

  return {
    sector,
    label: result?.label || defaults[sector],
    reason: result?.reason || 'This recommendation is based on your symptom answers.',
    response: result?.response || `I recommend visiting a ${defaults[sector]}.`,
  };
};

const getOpenAiSymptomRecommendation = async (answers) => {
  const key = OPENAI_API_KEY || (String(AI_API_KEY || '').startsWith('sk-') ? AI_API_KEY : '');
  if (!key) {
    throw new Error('Missing OpenAI key: set OPENAI_API_KEY (or AI_API_KEY with sk- prefix) in backend .env');
  }

  const model = OPENAI_MODEL || 'gpt-4o-mini';
  const prompt = [
    'You are a medical triage assistant for a clinic finder app.',
    'Using the patient answers, recommend only one sector from GENERAL, AYURVEDIC, DENTAL.',
    'Do not diagnose disease. Provide short practical guidance.',
    'Return STRICT JSON only in this exact shape:',
    '{"sector":"GENERAL|AYURVEDIC|DENTAL","label":"string","reason":"string","response":"string"}',
    'Patient answers:',
    JSON.stringify(answers),
  ].join('\n');

  const raw = await postJson({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    providerName: 'OpenAI',
    body: {
      model,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
  });

  const text = raw?.choices?.[0]?.message?.content || '';
  const parsed = parseJsonFromText(text);
  if (!parsed) {
    throw new Error('Unable to parse OpenAI JSON output');
  }

  return {
    ...normalizeRecommendation(parsed),
    provider: 'openai',
  };
};

const getGeminiSymptomRecommendation = async (answers) => {
  const key = GEMINI_API_KEY || (String(AI_API_KEY || '').startsWith('sk-') ? '' : AI_API_KEY);
  if (!key) {
    throw new Error('Missing Gemini key: set GEMINI_API_KEY or AI_API_KEY in backend .env');
  }

  const model = await resolveGeminiModel(key);
  const prompt = [
    'You are a medical triage assistant for a clinic finder app.',
    'Using the patient answers, recommend only one sector from GENERAL, AYURVEDIC, DENTAL.',
    'Do not diagnose disease. Provide short practical guidance.',
    'Return STRICT JSON only in this exact shape:',
    '{"sector":"GENERAL|AYURVEDIC|DENTAL","label":"string","reason":"string","response":"string"}',
    'Patient answers:',
    JSON.stringify(answers),
  ].join('\n');

  const path = `/v1beta/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 220,
      responseMimeType: 'application/json',
    },
  };

  const raw = await postJson({
    hostname: 'generativelanguage.googleapis.com',
    path,
    body: payload,
  });

  const text = raw?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  const parsed = parseJsonFromText(text);
  if (!parsed) {
    throw new Error('Unable to parse Gemini JSON output');
  }

  return {
    ...normalizeRecommendation(parsed),
    provider: 'gemini',
  };
};

const getSymptomRecommendation = async (answers) => {
  const hasOpenAiKey = Boolean(OPENAI_API_KEY) || String(AI_API_KEY || '').startsWith('sk-');
  if (hasOpenAiKey) {
    return getOpenAiSymptomRecommendation(answers);
  }
  return getGeminiSymptomRecommendation(answers);
};

module.exports = { getGeminiSymptomRecommendation: getSymptomRecommendation };
