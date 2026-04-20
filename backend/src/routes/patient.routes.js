const express = require('express');
const router = express.Router();
const { searchPatient, registerPatient } = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/search', authenticate, authorizeRoles('doctor', 'receptionist'), searchPatient);
router.post('/register', authenticate, authorizeRoles('receptionist'), registerPatient);

module.exports = router;