const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getPatientHistory,
  saveConsultation,
  transcribeVoice,
} = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.get('/history/:patient_id', authenticate, authorizeRoles('doctor', 'patient'), getPatientHistory);
router.post('/save', authenticate, authorizeRoles('doctor'), saveConsultation);
router.get('/patient/:patient_id', authenticate, authorizeRoles('doctor', 'patient'), getPatientHistory);
router.post('/transcribe', authenticate, authorizeRoles('doctor'), upload.single('audio'), transcribeVoice);
router.post('/', authenticate, authorizeRoles('doctor'), saveConsultation);

module.exports = router;