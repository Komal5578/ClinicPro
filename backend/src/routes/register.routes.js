const express = require('express');
const router = express.Router();
const { registerDoctor, registerReceptionist } = require('../controllers/register.controller');

router.post('/doctor', registerDoctor);
router.post('/receptionist', registerReceptionist);

module.exports = router;
