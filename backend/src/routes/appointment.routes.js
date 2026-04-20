const express = require('express');
const router = express.Router();
const { getTodayAppointments, bookAppointment } = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/today', authenticate, authorizeRoles('doctor', 'receptionist'), getTodayAppointments);
router.post('/book', authenticate, authorizeRoles('receptionist'), bookAppointment);

module.exports = router;