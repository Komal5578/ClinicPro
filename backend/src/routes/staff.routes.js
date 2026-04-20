const express = require('express');
const router = express.Router();
const { getAllStaff, addStaff, toggleStaffStatus } = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('admin'), getAllStaff);
router.post('/add', authenticate, authorizeRoles('admin'), addStaff);
router.patch('/:user_id/toggle', authenticate, authorizeRoles('admin'), toggleStaffStatus);

module.exports = router;