import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ClinicRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=GST, 2=Role, 3=Form, 4=Success
  const [gst, setGst] = useState('');
  const [gstVerified, setGstVerified] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState('');
  const [role, setRole] = useState(''); // doctor | receptionist
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [doctorForm, setDoctorForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    sector: 'GENERAL', registrationType: 'MCI', registrationNumber: '',
    certificate: null, slotDuration: 10,
    morningStart: '09:00', morningEnd: '13:00',
    eveningStart: '17:00', eveningEnd: '21:00',
  });

  const [receptionistForm, setReceptionistForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  const [nmcStatus, setNmcStatus] = useState('idle'); // idle | checking | verified | failed
  const [certPreview, setCertPreview] = useState(null);

  // Auto-suggest slot duration based on sector
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
        body: JSON.stringify({ gst_number: gst.toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setGstVerified(data);
      } else {
        setGstError(data.message || 'Verification failed');
      }
    } catch {
      setGstError('Server error. Please try again.');
    } finally {
      setGstLoading(false);
    }
  };

  const handleNmcCheck = async (regNo) => {
    if (!regNo || regNo.length < 4) return;
    setNmcStatus('checking');
    // Dummy NMC check — always verifies after short delay
    setTimeout(() => setNmcStatus('verified'), 1500);
  };

  const handleCertUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDoctorForm(f => ({ ...f, certificate: file }));
      setCertPreview(URL.createObjectURL(file));
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
      Object.entries(doctorForm).forEach(([k, v]) => {
        if (v !== null) formData.append(k, v);
      });
      formData.append('gst_number', gst.toUpperCase());
      formData.append('clinic_name', gstVerified?.business_name || '');
      formData.append('address', gstVerified?.address || '');

      const res = await fetch('http://localhost:5000/api/register/doctor', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceptionistSubmit = async (e) => {
    e.preventDefault();
    if (receptionistForm.password !== receptionistForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/register/receptionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receptionistForm,
          gst_number: gst.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, outline: 'none', color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'border-color 0.15s',
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
        onClick={() => step === 1 ? navigate('/clinic') : setStep(step - 1)}
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

      {/* Step indicator */}
      <div style={{
        position: 'fixed', top: 24, right: 24, display: 'flex', gap: 6, zIndex: 10,
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width: s === step ? 32 : 10, height: 10, borderRadius: 20,
            background: s <= step ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#e2e8f0',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 560,
        background: 'white', borderRadius: 22,
        padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
      }}>
        {/* ─── STEP 1: GST ─── */}
        {step === 1 && (
          <div>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: '#f0fdfa', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 26, marginBottom: 24,
            }}></div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Let's verify your clinic first
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
              We use your GST number to confirm your clinic exists. This helps build trust with patients.
            </p>

            {gstError && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
                borderRadius: 10, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca',
              }}> {gstError}</div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>GST Number</label>
              <input
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: 'uppercase' }}
                placeholder="22AAAAA0000A1Z5"
                value={gst}
                onChange={e => { setGst(e.target.value.toUpperCase()); setGstVerified(null); }}
                maxLength={15}
              />
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
                  transition: 'all 0.2s',
                }}
              >
                {gstLoading ? ' Verifying...' : ' Verify GST Number'}
              </button>
            ) : (
              <div>
                {/* Success banner */}
                <div style={{
                  background: '#d1fae5', padding: '14px 18px', borderRadius: 12,
                  border: '1px solid #a7f3d0', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 22 }}></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>
                      {gstVerified.business_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#047857' }}>
                      GST Verified · {gst}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Business Name</label>
                  <input style={{ ...inputStyle, background: '#f8fafb', color: '#64748b' }}
                    value={gstVerified.business_name} readOnly />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(editable)</span></label>
                  <input style={inputStyle}
                    value={gstVerified.address}
                    onChange={e => setGstVerified(v => ({ ...v, address: e.target.value }))}
                  />
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

        {/* ─── STEP 2: Role Selection ─── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Who is setting this up?
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
              Choose your role to get the right registration form
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { id: 'doctor', icon: '🩺', title: 'I am the Doctor', desc: 'Full clinic setup with NMC verification' },
                { id: 'receptionist', icon: '‍', title: 'I am the Receptionist', desc: 'Link to an existing verified clinic' },
              ].map(r => (
                <div
                  key={r.id}
                  onClick={() => { setRole(r.id); setStep(3); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '20px 22px', borderRadius: 14,
                    border: '2px solid #e2e8f0', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'white',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#0d9488';
                    e.currentTarget.style.background = '#f0fdfa';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: '#f0fdfa', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, flexShrink: 0,
                  }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{r.desc}</div>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 20 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 3a: Doctor Form ─── */}
        {step === 3 && role === 'doctor' && (
          <form onSubmit={handleDoctorSubmit}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Doctor Registration
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Set up your profile and clinic configuration
            </p>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca' }}> {error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="Dr. Rahul Sharma" value={doctorForm.name} onChange={e => setDoctorForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="doctor@clinic.com" value={doctorForm.email} onChange={e => setDoctorForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="9876543210" maxLength={10} value={doctorForm.phone} onChange={e => setDoctorForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} required /></div>
              <div><label style={labelStyle}>Sector *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={doctorForm.sector}
                  onChange={e => setDoctorForm(f => ({ ...f, sector: e.target.value, slotDuration: sectorSlots[e.target.value] }))}>
                  <option value="GENERAL">General Physician</option>
                  <option value="AYURVEDIC">Ayurvedic</option>
                  <option value="DENTAL">Dental</option>
                </select></div>
              <div><label style={labelStyle}>Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={doctorForm.password} onChange={e => setDoctorForm(f => ({ ...f, password: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Confirm Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={doctorForm.confirmPassword} onChange={e => setDoctorForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
            </div>

            {/* Registration details */}
            <div style={{ margin: '24px 0 0', padding: '20px 0 0', borderTop: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Medical Registration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                <div><label style={labelStyle}>Registration Type</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={doctorForm.registrationType}
                    onChange={e => setDoctorForm(f => ({ ...f, registrationType: e.target.value }))}>
                    <option value="MCI">MCI (Allopathy)</option>
                    <option value="CCIM">CCIM (Ayurveda)</option>
                    <option value="DCI">DCI (Dental)</option>
                  </select></div>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Registration Number</label>
                  <input style={inputStyle}
                    placeholder="e.g. MH/12345/2020"
                    value={doctorForm.registrationNumber}
                    onChange={e => {
                      setDoctorForm(f => ({ ...f, registrationNumber: e.target.value }));
                      handleNmcCheck(e.target.value);
                    }}
                  />
                  {nmcStatus !== 'idle' && (
                    <span style={{
                      position: 'absolute', right: 12, top: 36,
                      fontSize: 12, fontWeight: 700,
                      color: nmcStatus === 'verified' ? '#059669' : nmcStatus === 'failed' ? '#dc2626' : '#d97706',
                    }}>
                      {nmcStatus === 'checking' ? ' Checking...' : nmcStatus === 'verified' ? ' Verified' : ' Failed'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Certificate Upload</label>
                <div style={{
                  border: '2px dashed #e2e8f0', borderRadius: 12, padding: 20,
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                  background: certPreview ? '#f8fafb' : 'white',
                }} onClick={() => document.getElementById('cert-upload').click()}>
                  {certPreview ? (
                    <img src={certPreview} alt="Certificate" style={{ maxHeight: 100, borderRadius: 8 }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 6 }}></div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Click to upload certificate</div>
                    </div>
                  )}
                  <input id="cert-upload" type="file" accept="image/*,.pdf" hidden onChange={handleCertUpload} />
                </div>
              </div>
            </div>

            {/* Working hours */}
            <div style={{ margin: '24px 0 0', padding: '20px 0 0', borderTop: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Working Hours</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Slot Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input style={{ ...inputStyle, width: 70 }} type="number" min={5} max={60}
                      value={doctorForm.slotDuration}
                      onChange={e => setDoctorForm(f => ({ ...f, slotDuration: parseInt(e.target.value) || 10 }))} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>mins</span>
                  </div>
                </div>
                <div><label style={labelStyle}>Morning</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.morningStart} onChange={e => setDoctorForm(f => ({ ...f, morningStart: e.target.value }))} />
                    <span style={{ color: '#94a3b8' }}>—</span>
                    <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.morningEnd} onChange={e => setDoctorForm(f => ({ ...f, morningEnd: e.target.value }))} />
                  </div>
                </div>
                <div><label style={labelStyle}>Evening</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.eveningStart} onChange={e => setDoctorForm(f => ({ ...f, eveningStart: e.target.value }))} />
                    <span style={{ color: '#94a3b8' }}>—</span>
                    <input style={{ ...inputStyle, width: 90 }} type="time" value={doctorForm.eveningEnd} onChange={e => setDoctorForm(f => ({ ...f, eveningEnd: e.target.value }))} />
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

        {/* ─── STEP 3b: Receptionist Form ─── */}
        {step === 3 && role === 'receptionist' && (
          <form onSubmit={handleReceptionistSubmit}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Receptionist Registration
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Your account will be linked to the verified clinic
            </p>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca' }}> {error}</div>}

            {/* GST badge */}
            <div style={{
              background: '#d1fae5', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, color: '#065f46', marginBottom: 20,
              border: '1px solid #a7f3d0', fontWeight: 600,
            }}>
               Linked to: {gstVerified?.business_name} ({gst})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} placeholder="Your full name" value={receptionistForm.name} onChange={e => setReceptionistForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="you@clinic.com" value={receptionistForm.email} onChange={e => setReceptionistForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="9876543210" maxLength={10} value={receptionistForm.phone} onChange={e => setReceptionistForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} required /></div>
              <div></div>
              <div><label style={labelStyle}>Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={receptionistForm.password} onChange={e => setReceptionistForm(f => ({ ...f, password: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Confirm Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={receptionistForm.confirmPassword} onChange={e => setReceptionistForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
            </div>

            <div style={{
              marginTop: 20, padding: '12px 16px', background: '#fef3c7',
              borderRadius: 10, border: '1px solid #fde68a',
              fontSize: 13, color: '#92400e', lineHeight: 1.6,
            }}>
               <strong>Important:</strong> Your account will be sent to the clinic doctor for approval.
              You will receive a notification when approved.
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, marginTop: 24,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none', borderRadius: 11,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Submitting...' : 'Submit Registration →'}
            </button>
          </form>
        )}

        {/* ─── STEP 4: Success ─── */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 22,
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, margin: '0 auto 24px',
              animation: 'fadeUp 0.5s ease',
            }}></div>

            {role === 'doctor' ? (
              <>
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
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Request submitted!</h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12, lineHeight: 1.7 }}>
                  Your account request has been sent to the clinic doctor for approval.
                </p>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 32 }}>
                  You will receive a WhatsApp message when approved.
                </p>
                <button onClick={() => navigate('/')} style={{
                  padding: '13px 36px', background: 'white',
                  color: '#0d9488', border: '2px solid #0d9488',
                  borderRadius: 11, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  Back to Home
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ClinicRegister;
