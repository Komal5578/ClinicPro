const axios = require('axios');
const {
  MEDICAL_CERT_MODE,
  MEDICAL_CERT_API_URL,
  MEDICAL_CERT_API_KEY,
  MEDICAL_CERT_CLIENT_ID,
  MEDICAL_CERT_CONSENT_ID,
} = require('../config/env');

const buildDummyResponse = (payload) => ({
  verified: true,
  status: 'success',
  message: 'Mock medical certificate verification completed',
  mode: 'dummy',
  request: payload,
  raw: {
    status: 'success',
    message: 'Dummy mode enabled',
  },
});

const buildConsentArtifact = () => ({
  consent: {
    consentId: MEDICAL_CERT_CONSENT_ID,
  },
});

const buildRequestBody = (payload) => ({
  txnId: payload.txnId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mc-${Date.now()}`),
  format: payload.format || 'xml',
  certificateParameters: payload.certificateParameters,
  consentArtifact: payload.consentArtifact || buildConsentArtifact(),
});

const normalizeRealResponse = (responseData, payload) => ({
  verified: true,
  status: 'success',
  message: responseData?.message || 'Medical certificate verified',
  mode: 'real',
  request: payload,
  raw: responseData,
});

const verifyMedicalCertificateReal = async (payload) => {
  if (!MEDICAL_CERT_API_URL) {
    throw new Error('MEDICAL_CERT_API_URL is missing. Add the API Setu endpoint to backend .env');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (MEDICAL_CERT_API_KEY) {
    headers['X-APISETU-APIKEY'] = MEDICAL_CERT_API_KEY;
  }

  if (MEDICAL_CERT_CLIENT_ID) {
    headers['X-APISETU-CLIENTID'] = MEDICAL_CERT_CLIENT_ID;
  }

  headers.Accept = 'application/json';

  const requestBody = buildRequestBody(payload);

  const response = await axios.post(MEDICAL_CERT_API_URL, requestBody, {
    headers,
    timeout: 15000,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Medical certificate API error (${response.status})`);
  }

  return normalizeRealResponse(response.data, requestBody);
};

const verifyMedicalCertificate = async (payload) => {
  if (MEDICAL_CERT_MODE !== 'real') {
    return buildDummyResponse(buildRequestBody(payload));
  }

  return verifyMedicalCertificateReal(payload);
};

module.exports = { verifyMedicalCertificate };