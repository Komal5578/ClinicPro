import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEMO_GST_OPTIONS = [
  { gst_number: '27ABCDE1234F1Z5', label: 'ClinicPro Health Services (Mumbai)' },
  { gst_number: '29ABCDE1234F1Z5', label: 'ClinicPro Care Center (Bengaluru)' },
  { gst_number: '07ABCDE1234F1Z5', label: 'ClinicPro Family Clinic (Delhi)' },
  { gst_number: '33ABCDE1234F1Z5', label: 'ClinicPro Dental Studio (Chennai)' },
  { gst_number: '24ABCDE1234F1Z5', label: 'ClinicPro Ayur Wellness (Ahmedabad)' },
  { gst_number: '19ABCDE1234F1Z5', label: 'ClinicPro City Clinic (Kolkata)' },
  { gst_number: '06ABCDE1234F1Z5', label: 'ClinicPro Family Care (Gurugram)' },
  { gst_number: '09ABCDE1234F1Z5', label: 'ClinicPro Metro Health (Lucknow)' },
  { gst_number: '22ABCDE1234F1Z5', label: 'ClinicPro Central Clinic (Raipur)' },
  { gst_number: '08ABCDE1234F1Z5', label: 'ClinicPro Plus Care (Jaipur)' },
];

const ClinicRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [gstMode, setGstMode] = useState('demo');
  const [gst, setGst] = useState('');
  const [gstVerified, setGstVerified] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    sector: 'GENERAL',
    registrationType: 'MCI',
    registrationNumber: '',
    slotDuration: 10,
    morningStart: '09:00',
    morningEnd: '13:00',
    eveningStart: '17:00',
    eveningEnd: '21:00',
  });

  const sectorSlots = { GENERAL: 10, AYURVEDIC: 20, DENTAL: 30 };

  const handleGstVerify = async () => {
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(gst.toUpperCase())) {
      setGstError('Please enter a valid 15-character GST number');
      return;
    }

    setGstLoading(true);
    setGstError('');
    try {
      const res = await fetch('http://localhost:5000/api/gst/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gst_number: gst.toUpperCase(), mode: gstMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.available_demo_gst_numbers?.length) {
          setGstError(`${data.message || 'Verification failed'} Demo GSTs: ${data.available_demo_gst_numbers.join(', ')}`);
        } else {
          setGstError(data.error || data.message || 'Verification failed');
        }
        return;
      }

      setGstVerified(data);
      setClinicName(data.business_name || clinicName);
      setClinicAddress(data.address || clinicAddress);
    } catch {
      setGstError('Server error. Please try again.');
    } finally {
      setGstLoading(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (doctorForm.password !== doctorForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(doctorForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('gst_number', gst.toUpperCase());
      formData.append('clinic_name', clinicName.trim());
      formData.append('address', clinicAddress.trim());
      if (certificateFile) formData.append('certificate', certificateFile);
      if (signatureFile) formData.append('signature', signatureFile);

      const res = await fetch('http://localhost:5000/api/register/doctor', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      setStep(3);
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 7 };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 30%, #e0f2fe 60%, #f0fdfa 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <button
        onClick={() => (step === 1 ? navigate('/clinic') : setStep(step - 1))}
        style={{
          position: 'fixed', top: 24, left: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 9, background: 'white',
          border: '1px solid #e2e8f0', color: '#475569', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        ← Back
      </button>

      <div style={{
        position: 'fixed', top: 24, right: 24, display: 'flex', gap: 6, zIndex: 10,
      }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? 32 : 10,
              height: 10,
              borderRadius: 20,
              background: s <= step ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#e2e8f0',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 560,
        background: 'white', borderRadius: 22,
        padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
      }}>
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Let's verify your clinic first
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
              Use demo GSTs for presentation or a real GST for live verification.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {[
                { key: 'demo', label: 'Demo GST' },
                { key: 'real', label: 'Real GST' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setGstMode(item.key);
                    setGst('');
                    setGstVerified(null);
                    setGstError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${gstMode === item.key ? '#0f766e' : '#e2e8f0'}`,
                    background: gstMode === item.key ? '#ccfbf1' : '#fff',
                    color: '#0f172a',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {gstError && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
                borderRadius: 10, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca',
              }}>
                {gstError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>GST Number</label>
              {gstMode === 'demo' ? (
                <select
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' }}
                  value={gst}
                  onChange={(e) => { setGst(e.target.value.toUpperCase()); setGstVerified(null); }}
                >
                  <option value="">Select a demo GST number</option>
                  {DEMO_GST_OPTIONS.map((item) => (
                    <option key={item.gst_number} value={item.gst_number}>
                      {item.gst_number} — {item.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: 'uppercase' }}
                  placeholder="22AAAAA0000A1Z5"
                  value={gst}
                  onChange={(e) => { setGst(e.target.value.toUpperCase()); setGstVerified(null); }}
                  maxLength={15}
                />
              )}
            </div>

            {!gstVerified ? (
              <button
                onClick={handleGstVerify}
                disabled={gstLoading || gst.length !== 15}
                style={{
                  width: '100%', padding: 13,
                  background: gst.length === 15 ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#e2e8f0',
                  color: gst.length === 15 ? 'white' : '#94a3b8',
                  border: 'none', borderRadius: 11, fontSize: 15,
                  fontWeight: 700, cursor: gst.length === 15 ? 'pointer' : 'not-allowed',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {gstLoading ? 'Verifying...' : 'Verify GST Number'}
              </button>
            ) : (
              <div>
                <div style={{
                  background: '#d1fae5', padding: '14px 18px', borderRadius: 12,
                  border: '1px solid #a7f3d0', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>
                      {gstVerified.business_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#047857' }}>
                      {gstMode === 'demo' ? 'Demo GST Verified' : 'GST Verified'} · {gst}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Business Name</label>
                  <input style={inputStyle} value={clinicName} onChange={e => setClinicName(e.target.value)} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Address</label>
                  <input style={inputStyle} value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} />
                </div>

                <button
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%', padding: 13,
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: 'white', border: 'none', borderRadius: 11,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
                  }}
                >
                  Confirm & Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleDoctorSubmit}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Doctor Registration
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Set up your profile and clinic configuration
            </p>

            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="Dr. Rahul Sharma" value={doctorForm.name} onChange={e => setDoctorForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="doctor@clinic.com" value={doctorForm.email} onChange={e => setDoctorForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="9876543210" maxLength={10} value={doctorForm.phone} onChange={e => setDoctorForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} required />
              </div>
              <div>
                <label style={labelStyle}>Sector *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={doctorForm.sector} onChange={e => setDoctorForm(f => ({ ...f, sector: e.target.value, slotDuration: sectorSlots[e.target.value] }))}>
                  <option value="GENERAL">General Physician</option>
                  <option value="AYURVEDIC">Ayurvedic</option>
                  <option value="DENTAL">Dental</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={doctorForm.password} onChange={e => setDoctorForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={doctorForm.confirmPassword} onChange={e => setDoctorForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
              </div>
            </div>

            <div style={{ margin: '24px 0 0', padding: '20px 0 0', borderTop: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Medical Registration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Registration Type</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={doctorForm.registrationType} onChange={e => setDoctorForm(f => ({ ...f, registrationType: e.target.value }))}>
                    <option value="MCI">MCI (Allopathy)</option>
                    <option value="CCIM">CCIM (Ayurveda)</option>
                    <option value="DCI">DCI (Dental)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Registration Number</label>
                  <input style={inputStyle} placeholder="e.g. MH/12345/2020" value={doctorForm.registrationNumber} onChange={e => setDoctorForm(f => ({ ...f, registrationNumber: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Working Hours</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Slot Duration</label>
                    <input style={inputStyle} type="number" min={5} max={60} value={doctorForm.slotDuration} onChange={e => setDoctorForm(f => ({ ...f, slotDuration: parseInt(e.target.value, 10) || 10 }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Morning</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.morningStart} onChange={e => setDoctorForm(f => ({ ...f, morningStart: e.target.value }))} />
                      <span style={{ color: '#94a3b8' }}>—</span>
                      <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.morningEnd} onChange={e => setDoctorForm(f => ({ ...f, morningEnd: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Evening</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.eveningStart} onChange={e => setDoctorForm(f => ({ ...f, eveningStart: e.target.value }))} />
                      <span style={{ color: '#94a3b8' }}>—</span>
                      <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.eveningEnd} onChange={e => setDoctorForm(f => ({ ...f, eveningEnd: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Doctor Certificate</label>
                  <input
                    style={{ ...inputStyle, padding: 8, background: '#fff' }}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    JPG, PNG, or PDF
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Doctor Signature</label>
                  <input
                    style={{ ...inputStyle, padding: 8, background: '#fff' }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                  />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    PNG/JPG signature image
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, marginTop: 28,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none', borderRadius: 11,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Creating Clinic...' : 'Complete Registration →'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Your clinic is set up!</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
              Login to start managing patients, appointments, and prescriptions.
            </p>
            <button onClick={() => navigate('/clinic')} style={{
              padding: '13px 36px',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none', borderRadius: 11,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
            }}>
              Login Now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicRegister;