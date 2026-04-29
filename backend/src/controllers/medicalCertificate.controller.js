const { verifyMedicalCertificate } = require('../services/medicalCertificate.service');

const defaultConsentArtifact = () => ({
  consent: {
    consentId: 'ea9c43aa-7f5a-4bf3-a0be-e1caa24737ba',
  },
});

const buildRequestPayload = (body = {}) => {
  if (body.certificateParameters) {
    return {
      txnId: body.txnId || `mc-${Date.now()}`,
      format: body.format || 'xml',
      certificateParameters: body.certificateParameters,
      consentArtifact: body.consentArtifact || defaultConsentArtifact(),
    };
  }

  const applicantName = String(body.applicantName || body.ApplicantName || '').trim() || 'Unknown Applicant';
  const registrationNumber = String(body.registrationNumber || body.RegNo || body.registration_no || '').trim();
  const certificateType = String(body.certificateType || body.CertificateType || 'Permanent').trim();
  const dob = String(body.dob || body.DOB || '01/01/2000').trim();
  const regDate = String(body.regDate || body.RegDate || '01/01/2020').trim();

  return {
    txnId: body.txnId || `mc-${Date.now()}`,
    format: body.format || 'xml',
    certificateParameters: {
      CertificateType: certificateType,
      ApplicantName: applicantName,
      DOB: dob,
      RegNo: registrationNumber,
      RegDate: regDate,
    },
    consentArtifact: body.consentArtifact || defaultConsentArtifact(),
  };
};

const verifyMedicalCertificateController = async (req, res) => {
  const payload = buildRequestPayload(req.body || {});

  if (!payload.certificateParameters.RegNo) {
    return res.status(400).json({
      message: 'registration number is required',
    });
  }

  try {
    const result = await verifyMedicalCertificate(payload);
    return res.json(result);
  } catch (err) {
    return res.status(502).json({
      message: 'Medical certificate verification failed',
      error: err.message,
    });
  }
};

module.exports = { verifyMedicalCertificateController };