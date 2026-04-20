const express = require('express');
const router = express.Router();
const { getAllStaff, addStaff } = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('admin'), getAllStaff);
router.post('/add', authenticate, authorizeRoles('admin'), addStaff);

module.exports = router;