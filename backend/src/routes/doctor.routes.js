const express = require('express');
const router = express.Router();
const { getDoctorProfile, getTodaySlots } = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/profile', authenticate, authorizeRoles('doctor'), getDoctorProfile);
router.get('/slots/today', authenticate, authorizeRoles('doctor', 'receptionist'), getTodaySlots);

module.exports = router;