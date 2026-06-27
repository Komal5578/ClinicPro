const express = require('express');
const router = express.Router();
const { getPublicClinics, getNearbyClinics, getRecentClinics, getPublicSlots, getClinicStatus, getDoctorClinics } = require('../controllers/clinics.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/public', getPublicClinics);
router.get('/public/nearby', getNearbyClinics);
router.get('/public/slots/today', getPublicSlots);
router.get('/recent', getRecentClinics);
router.get('/doctor/:doctorId', authenticate, getDoctorClinics);
router.get('/:clinic_id/status', getClinicStatus);

module.exports = router;