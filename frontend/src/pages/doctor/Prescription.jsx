import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import {
  aiAutofillPrescription,
  createDraftPrescription,
  finalizePrescription,
  getDraftPrescriptionByConsultation,
  updateDraftPrescription,
} from '../../services/api';
import { apiOrigin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyMedicine = () => ({
  medicine_name: '', dosage: '', frequency: '', duration_days: '', notes: ''
});

const Prescription = () => {
  const { consultation_id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient_id] = useState(localStorage.getItem('current_patient_id') || '');
  const [items, setItems] = useState([emptyMedicine()]);
  const [draftId, setDraftId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [dictationText, setDictationText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadDraft = async () => {
      try {
        const res = await getDraftPrescriptionByConsultation(consultation_id);
        if (!mounted) return;
        const draftItems = res.data?.items || [];
        setDraftId(res.data?.prescription?.prescription_id || null);
        setItems(draftItems.length ? draftItems.map((item) => ({
          medicine_name: item.medicine_name || '',
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          duration_days: item.duration_days || '',
          notes: item.notes || '',
        })) : [emptyMedicine()]);
        setInfo('Existing draft loaded. You can edit and finalize.');
      } catch (_err) {
        if (mounted) {
          setInfo('Start by adding medicines, then save draft or finalize PDF.');
        }
      } finally {
        if (mounted) setDraftLoading(false);
      }
    };

    loadDraft();

    return () => {
      mounted = false;
    };
  }, [consultation_id]);

  const addMedicine = () => setItems(i => [...i, emptyMedicine()]);
  const removeMedicine = (idx) => setItems(i => i.filter((_, j) => j !== idx));

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, j) =>
      j === idx ? { ...item, [field]: value } : item
    ));
  };

  const validateItems = () => {
    if (items.some(i => !i.medicine_name || !i.dosage)) {
      setError('Please fill medicine name and dosage for all items');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateItems()) return;

    setLoading(true);
    setError('');
    try {
      if (draftId) {
        await updateDraftPrescription(draftId, { items });
      } else {
        const res = await createDraftPrescription({
          consultation_id,
          patient_id: patient_id || 1,
          doctor_id: user.id,
          items,
        });
        setDraftId(res.data.prescription_id);
      }
      setInfo('Draft saved. You can keep editing before final PDF generation.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!validateItems()) return;

    setLoading(true);
    setError('');
    try {
      let finalDraftId = draftId;

      if (!finalDraftId) {
        const draftRes = await createDraftPrescription({
          consultation_id,
          patient_id: patient_id || 1,
          doctor_id: user.id,
          items,
        });
        finalDraftId = draftRes.data.prescription_id;
        setDraftId(finalDraftId);
      }

      const res = await finalizePrescription(finalDraftId, { items });
      setPdfUrl(res.data.pdf_url || '');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize prescription');
    } finally {
      setLoading(false);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus('Stopped listening');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let hasFinalText = false;
    let hasInterimText = false;

    setIsListening(true);
    setVoiceInterim('');
    setVoiceStatus('Listening... speak now');
    recognition.start();

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalText += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      setVoiceInterim(interim.trim());
      if (interim.trim()) hasInterimText = true;

      if (finalText.trim()) {
        hasFinalText = true;
        setDictationText((prev) => [prev, finalText.trim()].filter(Boolean).join(' ').trim());
        setVoiceStatus('Captured voice text');
      }
    };

    recognition.onerror = (event) => {
      const message = event?.error === 'not-allowed'
        ? 'Mic permission denied. Allow microphone access.'
        : event?.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : event?.error === 'audio-capture'
            ? 'No microphone detected by browser.'
          : 'Voice capture failed. Please try again.';
      setVoiceStatus(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!hasFinalText && !hasInterimText) {
        setVoiceStatus('No speech detected. Tap Voice Dictation and speak clearly.');
      }
      recognitionRef.current = null;
      setVoiceInterim('');
      setIsListening(false);
    };
  };

  const handleAiAutofill = async () => {
    if (!String(dictationText || '').trim()) {
      setError('Please dictate or type prescription text first');
      return;
    }

    setAiLoading(true);
    setError('');
    try {
      const res = await aiAutofillPrescription({ dictation_text: dictationText });
      const aiItems = Array.isArray(res.data?.items) ? res.data.items : [];
      if (!aiItems.length) {
        setError('AI could not detect medicines from dictation. Please edit manually.');
      } else {
        setItems(aiItems.map((item) => ({
          medicine_name: item.medicine_name || '',
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          duration_days: item.duration_days || '',
          notes: item.notes || '',
        })));
        setInfo('Form auto-filled from doctor dictation. Please verify and save draft/finalize.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-fill prescription using AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(`${apiOrigin}${pdfUrl}`, '_blank', 'noopener,noreferrer');
  };

  const handleBackToQueue = () => {
    if (pdfUrl) {
      window.open(`${apiOrigin}${pdfUrl}`, '_blank', 'noopener,noreferrer');
    }
    navigate('/doctor/queue');
  };

  const handleShareToChemist = async () => {
    if (!pdfUrl) return;
    const shareData = {
      title: 'ClinicPro Prescription',
      text: 'Prescription PDF generated by ClinicPro',
      url: `${apiOrigin}${pdfUrl}`,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(`${apiOrigin}${pdfUrl}`);
    alert('Prescription link copied. Share it with the chemist.');
  };

  const frequencies = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'At bedtime', 'As needed'];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Write Prescription</h2>
            <p>Consultation #{consultation_id} · Editable draft before final PDF</p>
          </div>
        </div>

        {draftLoading && <div className="alert alert-info">Loading saved draft...</div>}
        {!draftLoading && info && <div className="alert alert-info">{info}</div>}

        {success ? (
          <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Prescription Saved!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>
              The prescription has been saved and a PDF has been generated with clinic and doctor details.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={handleDownloadPdf} disabled={!pdfUrl}>
                Download PDF
              </button>
              <button className="btn btn-success" onClick={handleShareToChemist} disabled={!pdfUrl}>
                Share to Chemist
              </button>
              <button className="btn btn-primary" onClick={handleBackToQueue}>
                Back to Queue
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} style={{ maxWidth: 800 }}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Doctor Dictation (AI Auto-fill)</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
                Speak or type: medicine name, dosage, frequency, duration, and notes. Then click Auto-fill.
              </p>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Example: Tab Azithromycin 500 mg once daily for 3 days after food, Paracetamol 650 mg SOS for fever"
                value={dictationText}
                onChange={(e) => setDictationText(e.target.value)}
              />
              {isListening && voiceInterim && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#0f766e' }}>
                  Hearing: {voiceInterim}
                </div>
              )}
              {voiceStatus && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                  {voiceStatus}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`}
                  onClick={startVoiceDictation}
                  disabled={aiLoading || loading}
                >
                  {isListening ? 'Listening...' : 'Voice Dictation'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAiAutofill}
                  disabled={aiLoading || loading || draftLoading}
                >
                  {aiLoading ? 'Auto-filling...' : 'Auto-fill with AI'}
                </button>
              </div>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700 }}>Medicine #{idx + 1}</h4>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMedicine(idx)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Medicine Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Paracetamol 500mg"
                      value={item.medicine_name}
                      onChange={e => updateItem(idx, 'medicine_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosage *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 1 tablet"
                      value={item.dosage}
                      onChange={e => updateItem(idx, 'dosage', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select
                      className="form-select"
                      value={item.frequency}
                      onChange={e => updateItem(idx, 'frequency', e.target.value)}
                    >
                      <option value="">Select frequency</option>
                      {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (days)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5"
                      min="1"
                      value={item.duration_days}
                      onChange={e => updateItem(idx, 'duration_days', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Special Instructions</label>
                  <input
                    className="form-input"
                    placeholder="e.g. After food, with warm water"
                    value={item.notes}
                    onChange={e => updateItem(idx, 'notes', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline" onClick={addMedicine} style={{ marginBottom: 20 }}>
              + Add Another Medicine
            </button>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveDraft} disabled={loading || draftLoading}>
                {loading ? 'Saving...' : draftId ? 'Update Draft' : 'Save Draft'}
              </button>
              <button type="button" className="btn btn-success" onClick={handleFinalize} disabled={loading || draftLoading}>
                {loading ? 'Finalizing...' : 'Finalize & Generate PDF'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Prescription;