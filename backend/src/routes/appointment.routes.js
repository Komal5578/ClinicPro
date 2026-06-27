const express = require('express');
const router = express.Router();
const { getTodayAppointments, getUpcomingAppointments, bookAppointmentPublic, announceDelay, clearDelay } = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/today', authenticate, authorizeRoles('doctor', 'receptionist'), getTodayAppointments);
router.get('/upcoming', authenticate, authorizeRoles('doctor', 'receptionist'), getUpcomingAppointments);
router.post('/book', authenticate, authorizeRoles('receptionist'), bookAppointmentPublic);
router.post('/book/public', bookAppointmentPublic);
router.post('/announce-delay', authenticate, authorizeRoles('doctor'), announceDelay);
router.post('/clear-delay', authenticate, authorizeRoles('doctor'), clearDelay);

module.exports = router;