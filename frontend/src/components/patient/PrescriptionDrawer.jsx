import { useState } from 'react';
import { apiOrigin, sendPatientOtp, verifyPatientOtp, getPatientPrescriptions } from '../../services/api';

const PrescriptionDrawer = ({ onClose }) => {
  const [phone, setPhone] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState('prescriptions');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPdfUrlForConsultation = (consultationId) => {
    const prescription = history?.prescriptions?.find((item) =>
      Number(item.consultation_id) === Number(consultationId)
    );

    return prescription?.pdf_path ? `${apiOrigin}/pdfs/${prescription.pdf_path}` : '';
  };

const handlePhoneSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const res = await sendPatientOtp(phone);
    if (res.otp) setError(`Your OTP is: ${res.otp}`); // shows OTP on screen
    setStep('otp');
  } catch (err) {
    setError(err.message || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
};

const handleOtpSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const verifyRes = await verifyPatientOtp(phone, enteredOtp);
    const patientData = verifyRes.patient;
    const token = verifyRes.token;

    // Store token for authenticated requests
    localStorage.setItem('patient_token', token);

    // Fetch consultation history
    try {
      const historyRes = await fetch(
        `http://localhost:5000/api/consultations/patient/${patientData.patient_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const historyData = await historyRes.json();
      setHistory(historyData);
    } catch (e) {
      setHistory({ consultations: [], prescriptions: [] });
    }

    setPatient(patientData);
    setStep('dashboard');
  } catch (err) {
    setError(err.message || 'Failed to verify OTP');
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '100%', maxWidth: 420, zIndex: 1500,
      background: 'white',
      boxShadow: '-8px 0 30px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideIn 0.3s ease',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}> My Records</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>View prescriptions & reminders</div>
        </div>
        <button onClick={onClose} style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'white', border: '1px solid #e2e8f0',
          fontSize: 15, cursor: 'pointer', color: '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-label="Close" title="Close">×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
            borderRadius: 10, fontSize: 13, marginBottom: 16, border: '1px solid #fecaca',
          }}> {error}</div>
        )}

        {/* Phone step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Enter Phone Number</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              We'll send you an OTP to verify your identity
            </p>
            <input
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 15, outline: 'none', marginBottom: 14,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1, boxSizing: 'border-box',
              }}
              placeholder="10-digit phone"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
            <button type="submit" disabled={loading || phone.length < 10} style={{
              width: '100%', padding: 12,
              background: phone.length === 10 ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#e2e8f0',
              color: phone.length === 10 ? 'white' : '#94a3b8',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
            }}>
              {loading ? 'Checking...' : 'Get OTP →'}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Verify OTP</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              OTP sent to {phone}
            </p>
            <input
              style={{
                width: '100%', padding: '14px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 24, fontWeight: 700, textAlign: 'center',
                letterSpacing: 8, outline: 'none', marginBottom: 14,
                boxSizing: 'border-box',
              }}
              placeholder="000000" value={enteredOtp}
              onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6} required
            />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 12,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Verifying...' : 'Verify →'}
            </button>
            <button type="button" onClick={() => setStep('phone')} style={{
              width: '100%', padding: 10, marginTop: 8,
              background: 'transparent', color: '#64748b',
              border: 'none', fontSize: 13, cursor: 'pointer',
            }}>← Change Number</button>
          </form>
        )}

        {/* Dashboard step */}
        {step === 'dashboard' && patient && (
          <div>
            {/* Patient card */}
            <div style={{
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              borderRadius: 14, padding: '18px 20px', color: 'white', marginBottom: 20,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{patient.name}</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                Age {patient.age} · {patient.phone}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['prescriptions', 'reminders'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: 9, borderRadius: 8, border: 'none',
                  background: tab === t ? '#0d9488' : '#f1f5f9',
                  color: tab === t ? 'white' : '#64748b',
                  fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}>
                  {t === 'prescriptions' ? ' Prescriptions' : ' Reminders'}
                </button>
              ))}
            </div>

            {tab === 'prescriptions' && (
              history?.consultations?.length ? (
                history.consultations.map(c => {
                  const pdfUrl = getPdfUrlForConsultation(c.consultation_id);

                  return (
                  <div key={c.consultation_id} style={{
                    background: '#f8fafb', borderRadius: 12, padding: 16,
                    marginBottom: 10, border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
                      {new Date(c.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      Reason
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>
                      {c.chief_complaint || 'Not specified'}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      Diagnosis
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
                      {c.diagnosis_note || 'Not specified'}
                    </div>

                    {pdfUrl ? (
                      <button
                        type="button"
                        onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                        style={{
                          border: '1px solid #0d9488',
                          background: '#0d9488',
                          color: 'white',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Download / Open PDF
                      </button>
                    ) : (
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        PDF pending
                      </div>
                    )}
                    {c.followup_date && (
                      <div style={{
                        marginTop: 8, padding: '4px 10px', background: '#f0fdfa',
                        borderRadius: 6, fontSize: 11, color: '#0d9488', fontWeight: 600,
                        display: 'inline-block',
                      }}>
                         Follow-up: {new Date(c.followup_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: 13 }}>
                  No prescriptions yet
                </div>
              )
            )}

            {tab === 'reminders' && (
              <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: 13 }}>
                No active reminders
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionDrawer;
