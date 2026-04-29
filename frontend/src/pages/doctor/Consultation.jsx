import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { saveConsultation, getPatientHistory } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DUMMY_CLINIC_NAME = 'Sunrise Family Clinic';

const Consultation = () => {
  const { patient_id } = useParams();
   console.log("patient_id:", patient_id);
  const { user, selectedClinicId } = useAuth();
  const navigate = useNavigate();
  const clinic_id = selectedClinicId || user?.clinic_id || 1;

  const [form, setForm] = useState({
    chief_complaint: '',
    diagnosis_note: '',
    followup_date: '',
    followup_instructions: '',
    consultation_type: 'WALKIN',
  });
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [consultationId, setConsultationId] = useState(null);
  const [clinicName, setClinicName] = useState(DUMMY_CLINIC_NAME);
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPatientHistory(patient_id);
        setHistory(res.data);
        if (res.data?.consultations?.[0]) {
          const p = res.data.consultations[0];
          setPatient({ name: p.patient_name, age: p.age, phone: p.phone });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [patient_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await saveConsultation({
        ...form,
        patient_id,
        doctor_id: user.id,
        clinic_id,
      });
      setConsultationId(res.data.consultation_id);
      setClinicName(res.data.clinic_name || DUMMY_CLINIC_NAME);
      setSuccess('Consultation saved!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save consultation');
    } finally { setLoading(false); }
  };

  const startVoice = (field) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceStatus('Voice input is not supported in this browser');
      return;
    }

    if (isListening && activeField === field && recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus('Stopped listening');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let hasFinalText = false;
    let hasInterimText = false;

    recognition.onstart = () => {
      setIsListening(true);
      setActiveField(field);
      setVoiceInterim('');
      setVoiceStatus('Listening... speak now');
    };

    recognition.onresult = (e) => {
      let interim = '';
      let finalText = '';

      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const transcript = e.results[i][0]?.transcript || '';
        if (e.results[i].isFinal) {
          finalText += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      setVoiceInterim(interim.trim());
      if (interim.trim()) hasInterimText = true;

      if (finalText.trim()) {
        hasFinalText = true;
        const clean = finalText.trim();
        setForm((f) => ({ ...f, [field]: f[field] ? `${f[field]} ${clean}` : clean }));
        setVoiceStatus('Captured voice text');
      }
    };

    recognition.onerror = (e) => {
      const message = e?.error === 'not-allowed'
        ? 'Mic permission denied. Allow microphone access.'
        : e?.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : e?.error === 'audio-capture'
            ? 'No microphone detected by browser.'
          : 'Voice capture failed. Please try again.';
      setVoiceStatus(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!hasFinalText && !hasInterimText) {
        setVoiceStatus('No speech detected. Tap Voice and speak clearly.');
      }
      recognitionRef.current = null;
      setVoiceInterim('');
      setIsListening(false);
      setActiveField(null);
    };

    recognition.start();
  };

  const lastVisits = history?.consultations?.slice(0, 3) || [];
  const conditions = history?.conditions || [];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>New Consultation</h2>
            {patient && (
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                {patient.name} · Age {patient.age} · {patient.phone}
              </p>
            )}
            <p style={{ color: '#0f6fff', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
              Clinic: {clinicName}
            </p>
          </div>
        </div>

        {pageLoading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#64748b', padding: 24 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 0.7s linear infinite' }} />
            Loading patient data...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* Left: Consultation form */}
            <div>
              {success ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <div style={{
                    width: 72, height: 72,
                    background: 'linear-gradient(135deg, #d1fae5, #6ee7b7)',
                    borderRadius: 18, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, margin: '0 auto 20px',
                  }}>
                    
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Consultation Saved</h3>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
                    What would you like to do next?
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/doctor/prescription/${consultationId}`)}
                    >
                       Write Prescription
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate('/doctor/queue')}
                    >
                      Back to Queue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <form onSubmit={handleSubmit}>
                    {/* Visit type */}
                    <div className="form-group">
                      <label className="form-label">Visit Type</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { val: 'WALKIN', label: ' Walk-in' },
                          { val: 'BOOKED', label: ' Booked Appointment' },
                        ].map(t => (
                          <button
                            key={t.val} type="button"
                            onClick={() => setForm(f => ({ ...f, consultation_type: t.val }))}
                            style={{
                              flex: 1, padding: '9px 14px', borderRadius: 9,
                              border: `1.5px solid ${form.consultation_type === t.val ? '#2563eb' : '#e2e8f0'}`,
                              background: form.consultation_type === t.val ? '#eff6ff' : 'white',
                              color: form.consultation_type === t.val ? '#1d4ed8' : '#64748b',
                              fontWeight: 600, fontSize: 13, cursor: 'pointer',
                              transition: 'all 0.15s',
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chief complaint with voice */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <label className="form-label" style={{ margin: 0 }}>Chief Complaint *</label>
                        <button
                          type="button"
                          onClick={() => startVoice('chief_complaint')}
                          className={`btn btn-sm ${isListening && activeField === 'chief_complaint' ? 'btn-danger' : 'btn-outline'}`}
                          style={{ fontSize: 12 }}
                        >
                          {isListening && activeField === 'chief_complaint' ? ' Stop' : ' Voice'}
                        </button>
                      </div>
                      <textarea
                        className="form-textarea"
                        placeholder="What brings the patient in today?"
                        value={form.chief_complaint}
                        onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))}
                        style={{ minHeight: 90 }}
                        required
                      />
                      {isListening && activeField === 'chief_complaint' && voiceInterim && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}>
                          Hearing: {voiceInterim}
                        </div>
                      )}
                    </div>

                    {/* Diagnosis with voice */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <label className="form-label" style={{ margin: 0 }}>Diagnosis & Clinical Notes</label>
                        <button
                          type="button"
                          onClick={() => startVoice('diagnosis_note')}
                          className={`btn btn-sm ${isListening && activeField === 'diagnosis_note' ? 'btn-danger' : 'btn-outline'}`}
                          style={{ fontSize: 12 }}
                        >
                          {isListening && activeField === 'diagnosis_note' ? ' Stop' : ' Voice'}
                        </button>
                      </div>
                      <textarea
                        className="form-textarea"
                        placeholder="Your diagnosis, observations, and clinical notes..."
                        value={form.diagnosis_note}
                        onChange={e => setForm(f => ({ ...f, diagnosis_note: e.target.value }))}
                        style={{ minHeight: 120 }}
                      />
                      {isListening && activeField === 'diagnosis_note' && voiceInterim && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}>
                          Hearing: {voiceInterim}
                        </div>
                      )}
                    </div>

                    {voiceStatus && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{voiceStatus}</div>
                    )}

                    {/* Follow-up */}
                    <div style={{
                      borderTop: '1px solid #f1f5f9', paddingTop: 20, marginTop: 4
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                         Schedule Follow-up
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>optional</span>
                      </div>
                      <div className="grid-2" style={{ gap: 14 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Follow-up Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={form.followup_date}
                            onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Instructions</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Blood test required"
                            value={form.followup_instructions}
                            onChange={e => setForm(f => ({ ...f, followup_instructions: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                      <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : ' Save Consultation'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right: Patient context */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Conditions / Allergies */}
              {conditions.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b', marginBottom: 12 }}>
                     Known Conditions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {conditions.map(c => (
                      <div key={c.condition_id} style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: c.condition_type === 'ALLERGY' ? '#fee2e2' : '#fef3c7',
                        borderLeft: `3px solid ${c.condition_type === 'ALLERGY' ? '#dc2626' : '#d97706'}`,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.condition_type === 'ALLERGY' ? '#991b1b' : '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {c.condition_type}
                        </div>
                        <div style={{ fontSize: 13, color: '#1e293b', marginTop: 2 }}>{c.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last visits */}
              {lastVisits.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b', marginBottom: 12 }}>
                     Recent Visits
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {lastVisits.map(v => (
                      <div key={v.consultation_id} style={{
                        padding: '10px 12px', borderRadius: 9,
                        background: '#f8fafc', border: '1px solid #f1f5f9',
                      }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                          {new Date(v.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{v.chief_complaint}</div>
                        {v.diagnosis_note && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                            {v.diagnosis_note.slice(0, 80)}{v.diagnosis_note.length > 80 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastVisits.length === 0 && conditions.length === 0 && (
                <div className="card" style={{ padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}></div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>New patient</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>No previous visit history</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultation;