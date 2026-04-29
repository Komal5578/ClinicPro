const express = require('express');
const { checkMedicineAiSetup } = require('../controllers/debug.controller');

const router = express.Router();

router.get('/medicine-ai-setup', checkMedicineAiSetup);

module.exports = router;
