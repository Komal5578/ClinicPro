import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import {
  aiAutofillPrescription,
  createDraftPrescription,
  finalizePrescription,
  getDraftPrescriptionByConsultation,
  updateDraftPrescription,
  transcribeAudio,
} from '../../services/api';
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
  const [voiceStatus, setVoiceStatus] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const isTranscribing = voiceStatus === 'Transcribing...';

  // Load existing draft (a 404 simply means "no draft yet")
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

  // Stop the mic if the user leaves the page
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
        setDraftId(res.prescription_id || res.data?.prescription_id);
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
        finalDraftId = draftRes.prescription_id || draftRes.data?.prescription_id;
        setDraftId(finalDraftId);
      }

      const res = await finalizePrescription(finalDraftId, { items });
      setPdfUrl(res.pdf_url || res.data?.pdf_url || '');

      // Clear localStorage after finalization
      localStorage.removeItem('current_walkin_id');
      localStorage.removeItem('current_patient_id');

      setSuccess(true);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to finalize prescription');
    } finally {
      setLoading(false);
    }
  };

  // Voice dictation via MediaRecorder + Groq (same approach as Consultation page)
  const startVoiceDictation = async () => {
    // Second click = stop recording
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsListening(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          setVoiceStatus('No audio captured. Tap Voice Dictation and speak clearly.');
          return;
        }

        setVoiceStatus('Transcribing...');
        try {
          const res = await transcribeAudio(blob);
          const text = (res?.text || '').trim();
          if (text) {
            setDictationText((prev) => [prev, text].filter(Boolean).join(' ').trim());
            setVoiceStatus('Captured voice text');
          } else {
            setVoiceStatus('Could not hear anything. Try again.');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setVoiceStatus(`Transcription failed: ${err.message}`);
        }
      };

      recorder.start();
      setIsListening(true);
      setVoiceStatus('Recording... tap again to stop');
    } catch (err) {
      setVoiceStatus(
        err.name === 'NotAllowedError'
          ? 'Mic permission denied. Allow microphone access.'
          : 'No microphone detected by browser.'
      );
      setIsListening(false);
    }
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
      const aiItems = Array.isArray(res?.items) ? res.items :
                      Array.isArray(res?.data?.items) ? res.data.items : [];
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
      setError(err.message || 'Failed to auto-fill prescription using AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackToQueue = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
    navigate('/doctor/queue');
  };

  const handleShareToChemist = async () => {
    if (!pdfUrl) return;
    const shareData = {
      title: 'ClinicPro Prescription',
      text: 'Prescription PDF generated by ClinicPro',
      url: pdfUrl,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(pdfUrl);
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
                  disabled={aiLoading || loading || isTranscribing}
                >
                  {isListening ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice Dictation'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAiAutofill}
                  disabled={aiLoading || loading || draftLoading || isListening || isTranscribing}
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