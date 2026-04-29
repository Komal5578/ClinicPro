const { GST_MODE } = require('../config/env');
const { getDemoGstProfile, demoGstProfiles } = require('../config/demoGst');
const { verifyGstReal } = require('../services/gst.service');

const gstVerify = async (req, res) => {
  const { gst_number, mode } = req.body;
  const normalizedGst = String(gst_number || '').toUpperCase().trim();
  const selectedMode = String(mode || GST_MODE || 'demo').toLowerCase();

  if (!normalizedGst || normalizedGst.length !== 15) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstPattern.test(normalizedGst)) {
    return res.status(400).json({ message: 'GST number format is invalid' });
  }

  if (selectedMode === 'real') {
    try {
      const result = await verifyGstReal(normalizedGst);
      if (!result?.verified) {
        return res.status(422).json({
          message: 'GST number is not verified',
        });
      }
      return res.json(result);
    } catch (err) {
      return res.status(502).json({
        message: 'GST verification API failed',
        error: err.message,
      });
    }
  }

  // Demo mode — only allow a fixed list of hardcoded GSTs for the presentation
  const demoProfile = getDemoGstProfile(normalizedGst);
  if (!demoProfile) {
    return res.status(404).json({
      message: 'Demo GST number not found. Switch to Real GST mode or choose one of the demo GST numbers.',
      available_demo_gst_numbers: demoGstProfiles.map((item) => item.gst_number),
    });
  }

  return res.json({
    ...demoProfile,
    verified: true,
    mode: 'demo',
    source: 'hardcoded-demo-list',
  });
};

module.exports = { gstVerify };
