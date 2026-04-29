const express = require('express');
const router = express.Router();
const { verifyMedicalCertificateController } = require('../controllers/medicalCertificate.controller');

router.post('/verify', verifyMedicalCertificateController);

module.exports = router;