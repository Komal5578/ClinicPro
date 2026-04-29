const express = require('express');
const router = express.Router();
const { getPublicClinics, getNearbyClinics, getRecentClinics, getPublicSlots, getClinicStatus } = require('../controllers/clinics.controller');

router.get('/public', getPublicClinics);
router.get('/public/nearby', getNearbyClinics);
router.get('/public/slots/today', getPublicSlots);
// Debug: list recent clinics (admin/dev)
router.get('/recent', getRecentClinics);
router.get('/:clinic_id/status', getClinicStatus);

module.exports = router;
