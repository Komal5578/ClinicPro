const express = require('express');
const multer = require('multer');
const router = express.Router();
const { lookupMedicine, ocrMedicine } = require('../controllers/medicine.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post('/lookup', lookupMedicine);
router.post('/ocr', upload.single('image'), ocrMedicine);

module.exports = router;
