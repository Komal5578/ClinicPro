const sendSMS = async (phone, otp) => {
  try {
    const response = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=q&message=Your ClinicPro OTP is ${otp}. Valid for 5 minutes.&language=english&numbers=${phone}`,
      { method: 'GET' }
    );
    const data = await response.json();
    console.log('Fast2SMS response:', data);
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return { success: true };
  } catch (err) {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return { success: true };
  }
};

module.exports = { sendSMS };