const express = require('express');
const router = express.Router();
const { registerWalkIn, getTodayWalkIns, updateWalkInStatus } = require('../controllers/walkin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/register', authenticate, authorizeRoles('receptionist'), registerWalkIn);
router.get('/today', authenticate, authorizeRoles('doctor', 'receptionist'), getTodayWalkIns);
router.patch('/:walkin_id/status', authenticate, authorizeRoles('doctor', 'receptionist'), updateWalkInStatus);
router.post('/', authenticate, authorizeRoles('receptionist'), registerWalkIn);
router.post('/register', authenticate, authorizeRoles('receptionist'), registerWalkIn);

module.exports = router;