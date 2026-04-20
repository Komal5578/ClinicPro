const express = require('express');
const router = express.Router();
const { generatePrescription, getPrescription } = require('../controllers/prescription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/generate', authenticate, authorizeRoles('doctor'), generatePrescription);
router.get('/:prescription_id', authenticate, authorizeRoles('doctor', 'receptionist'), getPrescription);

module.exports = router;