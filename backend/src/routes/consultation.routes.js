const express = require('express');
const router = express.Router();
const { getPatientHistory, saveConsultation } = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Public route for patient portal (after OTP verification)
router.get('/history/public/:patient_id', getPatientHistory);

// Authenticated routes for doctors
router.get('/history/:patient_id', authenticate, authorizeRoles('doctor'), getPatientHistory);
router.post('/save', authenticate, authorizeRoles('doctor'), saveConsultation);

module.exports = router;