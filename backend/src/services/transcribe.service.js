const { GROQ_API_KEY } = require('../config/env');

const transcribeAudio = async (buffer, mimetype = 'audio/webm') => {
  if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY in .env');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimetype }), 'audio.webm');
  form.append('model', 'whisper-large-v3');
  form.append('language', 'en');
  form.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Groq transcription error (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return (data.text || '').trim();
};

module.exports = { transcribeAudio };