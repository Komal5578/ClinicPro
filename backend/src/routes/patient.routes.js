const express = require('express');
const router = express.Router();
const { searchPatient, registerPatient } = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Public route for patient portal (no auth needed)
router.get('/search/public', searchPatient);
router.post('/register/public', registerPatient);

// Authenticated routes for staff
router.get('/search', authenticate, authorizeRoles('doctor', 'receptionist'), searchPatient);
router.post('/register', authenticate, authorizeRoles('receptionist'), registerPatient);

module.exports = router;