const express = require('express');
const router = express.Router();
const { gstVerify } = require('../controllers/gst.controller');

router.post('/verify', gstVerify);

module.exports = router;
