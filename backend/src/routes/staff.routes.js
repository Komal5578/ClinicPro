const express = require('express');
const router = express.Router();
const { getAllStaff, addStaff, updateStaffApproval } = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('receptionist','doctor'), getAllStaff);
router.post('/add', authenticate, authorizeRoles('receptionist','doctor'), addStaff);
router.patch('/approve', authenticate, authorizeRoles('doctor'), updateStaffApproval);

module.exports = router;