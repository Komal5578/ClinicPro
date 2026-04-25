const express = require('express');
const { symptomTriage } = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/symptom', symptomTriage);

module.exports = router;
