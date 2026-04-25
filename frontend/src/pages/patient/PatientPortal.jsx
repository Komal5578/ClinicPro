import { useState } from 'react';
import { searchPatient, getPatientHistory } from '../../services/api';

const PatientPortal = () => {
  const [phone, setPhone] = useState('');
  const [otp] = useState('1234'); // simplified for prototype
  const [enteredOtp, setEnteredOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone | otp | dashboard
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState('prescriptions');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await searchPatient(phone);
      setPatient(res.data);
      setStep('otp');
    } catch {
      setError('Phone number not found. Please visit the clinic to register.');
    } finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (enteredOtp !== otp) { setError('Invalid OTP. For demo, use: 1234'); return; }
    setLoading(true);
    try {
      const res = await getPatientHistory(patient.patient_id);
      setHistory(res.data);
      setStep('dashboard');
    } catch { setError('Failed to load records'); }
    finally { setLoading(false); }
  };

  // Build medicine schedule from latest prescription
  const getMedicineSchedule = () => {
    if (!history?.prescriptions?.length) return { morning: [], afternoon: [], night: [] };
    const latest = history.prescriptions.filter(p => {
      const latestDate = history.prescriptions.reduce((max, px) =>
        px.generated_at > max ? px.generated_at : max, '');
      return p.generated_at === latestDate;
    });
    const schedule = { morning: [], afternoon: [], night: [] };
    latest.forEach(p => {
      const freq = (p.frequency || '').toLowerCase();
      if (freq.includes('once') || freq.includes('morning') || freq.includes('daily')) schedule.morning.push(p);
      if (freq.includes('twice') || freq.includes('afternoon')) { schedule.morning.push(p); schedule.night.push(p); }
      if (freq.includes('thrice') || freq.includes('three')) { schedule.morning.push(p); schedule.afternoon.push(p); schedule.night.push(p); }
      if (freq.includes('night') || freq.includes('bedtime')) schedule.night.push(p);
    });
    return schedule;
  };

  const schedule = getMedicineSchedule();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f4f6fb 0%, #e8f0ff 100%)',
      padding: '24px 16px',
      fontFamily: 'DM Sans, sans-serif'
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Clinic<span style={{ color: 'var(--primary, #0f6fff)' }}>Pro</span>
          </h1>
          <p style={{ color: '#718096', marginTop: 4, fontSize: 14 }}>Patient Portal</p>
        </div>

        {step === 'phone' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>View Your Records</h2>
            <p style={{ color: '#718096', fontSize: 13, marginBottom: 24 }}>Enter your registered phone number</p>
            {error && <div style={{ background: '#fff0f0', color: '#ff3b3b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <form onSubmit={handlePhoneSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone Number</label>
                <input
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="10-digit phone number"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  maxLength={10} required
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: 13, background: '#0f6fff', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Checking...' : 'Get OTP →'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Enter OTP</h2>
            <p style={{ color: '#718096', fontSize: 13, marginBottom: 24 }}>OTP sent to {phone} (Demo OTP: 1234)</p>
            {error && <div style={{ background: '#fff0f0', color: '#ff3b3b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <form onSubmit={handleOtpSubmit}>
              <div style={{ marginBottom: 16 }}>
                <input
                  style={{ width: '100%', padding: '16px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 24, fontWeight: 700, textAlign: 'center', letterSpacing: 8, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="0000" value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)} maxLength={4} required
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: 13, background: '#0f6fff', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Verifying...' : 'Verify →'}
              </button>
              <button type="button" onClick={() => setStep('phone')}
                style={{ width: '100%', padding: 12, background: 'transparent', color: '#718096', border: 'none', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                ← Back
              </button>
            </form>
          </div>
        )}

        {step === 'dashboard' && patient && (
          <div>
            {/* Patient card */}
            <div style={{ background: '#0f6fff', borderRadius: 16, padding: 20, color: 'white', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{patient.name}</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Age {patient.age} · {patient.phone}</div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['prescriptions', 'reminders'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: tab === t ? '#0f6fff' : 'white',
                    color: tab === t ? 'white' : '#718096',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                  {t === 'prescriptions' ? '💊 Prescriptions' : '⏰ Reminders'}
                </button>
              ))}
            </div>

            {tab === 'prescriptions' && (
              <div>
                {history?.consultations?.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', color: '#718096' }}>
                    No prescriptions yet
                  </div>
                ) : (
                  history?.consultations?.map(c => (
                    <div key={c.consultation_id} style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
                        {new Date(c.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.chief_complaint}</div>
                      <div style={{ fontSize: 13, color: '#718096' }}>{c.diagnosis_note}</div>
                      {c.followup_date && (
                        <div style={{ marginTop: 10, padding: '6px 10px', background: '#e8f0ff', borderRadius: 6, fontSize: 12, color: '#0f6fff', fontWeight: 600 }}>
                          📅 Follow-up: {new Date(c.followup_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'reminders' && (
              <div>
                {['morning', 'afternoon', 'night'].map(time => (
                  schedule[time].length > 0 && (
                    <div key={time} style={{ background: 'white', borderRadius: 12, padding: 18, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, textTransform: 'capitalize' }}>
                        {time === 'morning' ? '🌅' : time === 'afternoon' ? '☀️' : '🌙'} {time}
                      </div>
                      {schedule[time].map((med, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < schedule[time].length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{med.medicine_name}</div>
                            <div style={{ fontSize: 12, color: '#718096' }}>{med.notes || 'As directed'}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#0f6fff' }}>{med.dosage}</div>
                        </div>
                      ))}
                    </div>
                  )
                ))}
                {!schedule.morning.length && !schedule.afternoon.length && !schedule.night.length && (
                  <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', color: '#718096' }}>
                    No active medicines
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;