const express = require('express');
const router = express.Router();
const {
	getDoctorProfile,
	getDoctorClinics,
	getTodaySlots,
	setDoctorStatus,
	insertUrgentPatient,
	getClinicStatus,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/profile', authenticate, authorizeRoles('doctor'), getDoctorProfile);
router.get('/clinics', authenticate, authorizeRoles('doctor'), getDoctorClinics);
router.get('/slots/today', authenticate, authorizeRoles('doctor', 'receptionist'), getTodaySlots);
router.post('/status', authenticate, authorizeRoles('doctor'), setDoctorStatus);
router.post('/urgent', authenticate, authorizeRoles('doctor'), insertUrgentPatient);
router.get('/clinic-status', getClinicStatus);

module.exports = router;