const { getGeminiSymptomRecommendation } = require('../services/gemini.service');

const getFallbackRecommendation = ({ dental, traditional }) => {
  let sector = 'GENERAL';
  let label = 'General Physician';
  let reason = 'Based on your symptoms, a general physician can evaluate and guide next steps.';

  if (String(dental || '').toLowerCase() === 'yes') {
    sector = 'DENTAL';
    label = 'Dentist';
    reason = 'Your answers indicate a teeth or gum concern, so a dentist is the best first specialist.';
  } else if (String(traditional || '').toLowerCase().includes('ayurvedic')) {
    sector = 'AYURVEDIC';
    label = 'Ayurvedic Doctor';
    reason = 'You prefer traditional care, so an Ayurvedic doctor is recommended.';
  }

  return {
    sector,
    label,
    reason,
    response: `I recommend visiting a ${label}. ${reason}`,
    source: 'fallback',
  };
};

const symptomTriage = async (req, res) => {
  const { symptom, duration, dental, traditional } = req.body || {};

  if (!String(symptom || '').trim()) {
    return res.status(400).json({ message: 'symptom is required' });
  }

  try {
    const result = await getGeminiSymptomRecommendation({
      symptom: String(symptom).trim(),
      duration: duration || '',
      dental: dental || '',
      traditional: traditional || '',
    });

    return res.json({ ...result, source: 'gemini' });
  } catch (err) {
    const fallback = getFallbackRecommendation({ dental, traditional });
    return res.status(200).json({
      ...fallback,
      warning: 'Gemini unavailable, fallback recommendation used',
      error: err.message,
    });
  }
};

module.exports = { symptomTriage };
