const express = require('express');
const router = express.Router();
const {
	aiAutofillPrescription,
	createDraftPrescription,
	finalizePrescription,
	generatePrescription,
	getDraftByConsultation,
	getPrescription,
	getMyPrescriptions,
	updateDraftPrescription,
} = require('../controllers/prescription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('patient'), getMyPrescriptions);
router.get('/consultation/:consultation_id/draft', authenticate, authorizeRoles('doctor'), getDraftByConsultation);
router.post('/ai-autofill', authenticate, authorizeRoles('doctor'), aiAutofillPrescription);
router.post('/draft', authenticate, authorizeRoles('doctor'), createDraftPrescription);
router.put('/:prescription_id/draft', authenticate, authorizeRoles('doctor'), updateDraftPrescription);
router.post('/:prescription_id/finalize', authenticate, authorizeRoles('doctor'), finalizePrescription);
router.post('/generate', authenticate, authorizeRoles('doctor'), generatePrescription);
router.get('/:prescription_id', authenticate, authorizeRoles('doctor', 'receptionist'), getPrescription);

module.exports = router;