const sendSMS = async (phone, otp) => {
  console.log('========================================');
  console.log(`📱 OTP Sent to: ${phone}`);
  console.log(`🔐 OTP Code: ${otp}`);
  console.log('========================================');

  return { success: true, otp, phone, message: 'OTP logged to console (dev mode)' };
};

module.exports = { sendSMS };
