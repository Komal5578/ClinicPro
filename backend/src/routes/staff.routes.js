const express = require('express');
const router = express.Router();
const { getAllStaff, addStaff } = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('receptionist'), getAllStaff);
router.post('/add', authenticate, authorizeRoles('receptionist'), addStaff);


module.exports = router;