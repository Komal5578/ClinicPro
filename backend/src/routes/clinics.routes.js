const express = require('express');
const router = express.Router();
const { getPublicClinics, getNearbyClinics, getRecentClinics } = require('../controllers/clinics.controller');

router.get('/public', getPublicClinics);
router.get('/public/nearby', getNearbyClinics);
// Debug: list recent clinics (admin/dev)
router.get('/recent', getRecentClinics);

module.exports = router;
