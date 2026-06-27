const express = require('express');
const router = express.Router();
const { generateSlots, getPublicSlots } = require('../controllers/slots.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/generate', authenticate, authorizeRoles('doctor'), generateSlots);
router.get('/public', getPublicSlots);  // ← add this

module.exports = router;