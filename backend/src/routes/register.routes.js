const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerDoctor, registerReceptionist } = require('../controllers/register.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/doctor', upload.single('certificate'), registerDoctor);
router.post('/receptionist', registerReceptionist);

module.exports = router;
