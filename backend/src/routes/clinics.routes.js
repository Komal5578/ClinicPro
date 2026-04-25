const express = require('express');
const router = express.Router();
const { getPublicClinics, getNearbyClinics } = require('../controllers/clinics.controller');

router.get('/public', getPublicClinics);
router.get('/public/nearby', getNearbyClinics);

module.exports = router;
