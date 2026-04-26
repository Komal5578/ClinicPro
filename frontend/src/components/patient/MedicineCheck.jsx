import { useState } from 'react';

const MedicineCheck = ({ onClose }) => {
  const [tab, setTab] = useState('text'); // text | photo
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (medicineName) => {
    if (!medicineName?.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/medicine/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: medicineName }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Failed to look up medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('http://localhost:5000/api/medicine/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.extracted_text) {
        setName(data.extracted_text);
        handleLookup(data.extracted_text);
      } else {
        setError(data.message || 'Could not read medicine name from photo. Please type it instead.');
      }
    } catch {
      setError('Photo processing failed. Please type the medicine name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'white', borderRadius: 22,
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
          maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}> Medicine Check</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Look up medicine information</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#f1f5f9', border: 'none',
              fontSize: 16, cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ></button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, padding: 4, background: '#f1f5f9',
          borderRadius: 10, marginBottom: 20,
        }}>
          {[
            { id: 'text', label: ' Type Name' },
            { id: 'photo', label: ' Upload Photo' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 8,
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#0d9488' : '#64748b',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        {tab === 'text' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup(name)}
              placeholder="e.g. Paracetamol, Dolo 650, Amoxicillin..."
              style={{
                flex: 1, padding: '11px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            <button
              onClick={() => handleLookup(name)}
              disabled={loading || !name.trim()}
              style={{
                padding: '11px 20px',
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
        )}

        {/* Photo upload */}
        {tab === 'photo' && (
          <div
            style={{
              border: '2px dashed #e2e8f0', borderRadius: 14,
              padding: 28, textAlign: 'center', marginBottom: 16,
              cursor: 'pointer', background: '#fafbfc',
              transition: 'all 0.15s',
            }}
            onClick={() => document.getElementById('med-photo').click()}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}></div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
              {loading ? 'Processing...' : 'Click to upload photo of medicine strip'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Supports JPG, PNG
            </div>
            <input id="med-photo" type="file" accept="image/*" hidden onChange={handlePhoto} />
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef3c7', color: '#92400e', padding: '10px 14px',
            borderRadius: 10, fontSize: 13, marginBottom: 16,
            border: '1px solid #fde68a',
          }}>ℹ {error}</div>
        )}

        {/* Result */}
        {result?.found && (
          <div style={{
            background: '#f8fafb', borderRadius: 14,
            border: '1px solid #e2e8f0', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                {result.medicine.generic}
              </div>
              <div style={{
                display: 'inline-flex', marginTop: 6,
                padding: '3px 10px', borderRadius: 20,
                background: result.medicine.prescription ? '#fee2e2' : '#d1fae5',
                color: result.medicine.prescription ? '#991b1b' : '#065f46',
                fontSize: 11, fontWeight: 700,
              }}>
                {result.medicine.prescription ? ' Prescription Required' : ' Over the Counter'}
              </div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {[
                { label: 'Used For', value: result.medicine.use, icon: '' },
                { label: 'Common Dosage', value: result.medicine.dosage, icon: '' },
                { label: 'Side Effects', value: result.medicine.sideEffects, icon: '' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !result.found && (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            color: '#64748b', fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            {result.message}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: '#f8fafc', borderRadius: 8,
          fontSize: 11, color: '#94a3b8', lineHeight: 1.6,
          border: '1px solid #f1f5f9',
        }}>
           <strong>Disclaimer:</strong> This information is for reference only. Always consult your doctor before taking any medicine.
        </div>
      </div>
    </div>
  );
};

export default MedicineCheck;
