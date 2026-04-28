require('dotenv').config();

module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  AI_API_KEY: process.env.AI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GST_MODE: process.env.GST_MODE || 'dummy',
  GST_API_KEY: process.env.GST_API_KEY,
  GST_API_HOST: process.env.GST_API_HOST,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  TWILIO_CONTENT_SID: process.env.TWILIO_CONTENT_SID,
  PORT: process.env.PORT || 5000,
};