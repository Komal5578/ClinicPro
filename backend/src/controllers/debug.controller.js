// Debug endpoint to check if services and env are properly configured

const checkMedicineAiSetup = async (req, res) => {
  try {
    const { GEMINI_API_KEY, GEMINI_MODEL, AI_API_KEY } = require('../config/env');
    const { analyzeMedicineImage } = require('../services/medicineAi.service');

    const diagnostics = {
      gemini_key_set: !!GEMINI_API_KEY,
      gemini_key_length: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
      gemini_model: GEMINI_MODEL || 'not set',
      ai_key_set: !!AI_API_KEY,
      analyzeMedicineImage_exists: typeof analyzeMedicineImage === 'function',
      timestamp: new Date().toISOString(),
    };

    console.log('[DEBUG] Medicine AI Setup Check:', diagnostics);
    res.json({
      status: 'ok',
      message: 'Medicine AI service is properly configured',
      diagnostics,
    });
  } catch (err) {
    console.error('[DEBUG] Setup check failed:', err.message);
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports = {
  checkMedicineAiSetup,
};
