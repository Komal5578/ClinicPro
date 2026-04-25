const express = require('express');
const router = express.Router();
const { lookupMedicine, ocrMedicine } = require('../controllers/medicine.controller');

router.post('/lookup', lookupMedicine);
router.post('/ocr', ocrMedicine);

module.exports = router;
