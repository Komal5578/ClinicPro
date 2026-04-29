const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerDoctor, registerReceptionist } = require('../controllers/register.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/doctor', upload.fields([
	{ name: 'certificate', maxCount: 1 },
	{ name: 'signature', maxCount: 1 },
]), registerDoctor);
router.post('/receptionist', registerReceptionist);

module.exports = router;
