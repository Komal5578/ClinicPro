const express = require('express');
const router = express.Router();
const { generateSlots } = require('../controllers/slots.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/generate', authenticate, authorizeRoles('doctor'), generateSlots);

module.exports = router;