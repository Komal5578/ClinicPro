const { GST_MODE } = require('../config/env');
const { verifyGstReal } = require('../services/gst.service');

const gstVerify = async (req, res) => {
  const { gst_number } = req.body;
  const normalizedGst = String(gst_number || '').toUpperCase().trim();

  if (!normalizedGst || normalizedGst.length !== 15) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstPattern.test(normalizedGst)) {
    return res.status(400).json({ message: 'GST number format is invalid' });
  }

  if (GST_MODE === 'real') {
    try {
      const result = await verifyGstReal(normalizedGst);
      return res.json(result);
    } catch (err) {
      return res.status(502).json({
        message: 'GST verification API failed',
        error: err.message,
      });
    }
  }

  // Dummy mode — return mock data for any valid format GST
  const stateCode = normalizedGst.substring(0, 2);
  const states = {
    '27': 'Maharashtra', '29': 'Karnataka', '07': 'Delhi',
    '33': 'Tamil Nadu', '22': 'Chhattisgarh', '06': 'Haryana',
    '09': 'Uttar Pradesh', '24': 'Gujarat', '19': 'West Bengal',
  };

  res.json({
    gst_number: normalizedGst,
    business_name: `ClinicPro Health Services`,
    address: `Medical Plaza, Sector 12, ${states[stateCode] || 'Mumbai'}, India`,
    state: states[stateCode] || 'Maharashtra',
    status: 'Active',
    verified: true,
  });
};

module.exports = { gstVerify };
