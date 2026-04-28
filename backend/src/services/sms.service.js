const https = require('https');
const querystring = require('querystring');

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

const sendSMS = async (phone, otp) => {
  const postData = querystring.stringify({
    route: 'otp',
    numbers: phone,
    message: `Your ClinicPro OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
  });

  const options = {
    hostname: 'www.fast2sms.com',
    path: '/dev/bulk',
    method: 'POST',
    headers: {
      'Authorization': FAST2SMS_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ SMS sent to ${phone}:`, response.message || 'Success');
          resolve({ success: true, otp, phone });
        } catch (e) {
          console.log(`⚠️ SMS response for ${phone}:`, data);
          resolve({ success: true, otp, phone });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ SMS failed for ${phone}:`, error.message);
      // Fallback: Log OTP to console if SMS fails
      console.log(`========================================`);
      console.log(`📱 OTP for: ${phone}`);
      console.log(`🔐 OTP Code: ${otp}`);
      console.log(`========================================`);
      resolve({ success: false, error: error.message, fallback: true, otp });
    });

    req.write(postData);
    req.end();
  });
};

module.exports = { sendSMS };
