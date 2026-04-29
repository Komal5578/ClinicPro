import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { generateSlots } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const parseMinutes = (value) => {
  const [hours = 0, minutes = 0] = String(value || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (minutesTotal) => {
  const h = Math.floor(minutesTotal / 60);
  const m = minutesTotal % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
};

const buildPreview = ({ morningStart, morningEnd, eveningStart, eveningEnd, bookedDuration, walkinDuration, ratio }) => {
  const rows = [];
  let token = 1;
  const pattern = [...Array(Math.max(1, Number(ratio) || 3)).fill('BOOKED'), 'WALKIN'];

  const addRange = (start, end) => {
    let cursor = parseMinutes(start);
    const limit = parseMinutes(end);
    let idx = 0;
    while (cursor + Math.min(bookedDuration, walkinDuration) <= limit) {
      const type = pattern[idx % pattern.length];
      const duration = type === 'WALKIN' ? walkinDuration : bookedDuration;
      if (cursor + duration > limit) break;
      rows.push({ token, type, time: formatMinutes(cursor) });
      token += 1;
      cursor += duration;
      idx += 1;
    }
  };

  addRange(morningStart, morningEnd);

  if (eveningStart && eveningEnd) {
    let cursor = parseMinutes(morningEnd);
    const limit = parseMinutes(eveningStart);
    while (cursor + 15 <= limit) {
      rows.push({ token, type: 'BUFFER', time: formatMinutes(cursor) });
      token += 1;
      cursor += 15;
    }
    addRange(eveningStart, eveningEnd);
  }

  return rows;
};

const DoctorSetupSlots = () => {
  const { selectedClinicId } = useAuth();
  const [date, setDate] = useState(tomorrowDate());
  const [available, setAvailable] = useState(true);
  const [morningStart, setMorningStart] = useState('09:00');
  const [morningEnd, setMorningEnd] = useState('13:00');
  const [eveningStart, setEveningStart] = useState('17:00');
  const [eveningEnd, setEveningEnd] = useState('21:00');
  const [bookedDuration, setBookedDuration] = useState(20);
  const [walkinDuration, setWalkinDuration] = useState(15);
  const [ratio, setRatio] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preview = useMemo(() => buildPreview({
    morningStart: `${morningStart}:00`,
    morningEnd: `${morningEnd}:00`,
    eveningStart: eveningStart ? `${eveningStart}:00` : '',
    eveningEnd: eveningEnd ? `${eveningEnd}:00` : '',
    bookedDuration: Number(bookedDuration) || 20,
    walkinDuration: Number(walkinDuration) || 15,
    ratio: Number(ratio) || 3,
  }), [morningStart, morningEnd, eveningStart, eveningEnd, bookedDuration, walkinDuration, ratio]);

  const handleSubmit = async () => {
    if (!selectedClinicId) {
      setError('No clinic selected');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await generateSlots({
        clinic_id: selectedClinicId,
        date,
        available,
        morning_start: `${morningStart}:00`,
        morning_end: `${morningEnd}:00`,
        evening_start: eveningStart ? `${eveningStart}:00` : null,
        evening_end: eveningEnd ? `${eveningEnd}:00` : null,
        booked_duration: Number(bookedDuration) || 20,
        walkin_duration: Number(walkinDuration) || 15,
        walkin_to_booked_ratio: Number(ratio) || 3,
      });
      if (res.data?.available === false) {
        setSuccess('Marked as not available for the selected date.');
      } else {
        setSuccess(`Generated ${res.data?.slots?.length || 0} slots for ${date}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save slots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2>Tomorrow's Slots</h2>
          <p>Set availability and generate booked / walk-in slots for the selected clinic</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-2">
          <div className="card">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className={`btn ${available ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAvailable(true)}>Available</button>
                <button type="button" className={`btn ${!available ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAvailable(false)}>Not Available</button>
              </div>
            </div>

            {available && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Morning Start</label>
                    <input type="time" className="form-input" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Morning End</label>
                    <input type="time" className="form-input" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Evening Start</label>
                    <input type="time" className="form-input" value={eveningStart} onChange={(e) => setEveningStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Evening End</label>
                    <input type="time" className="form-input" value={eveningEnd} onChange={(e) => setEveningEnd(e.target.value)} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Booked Slot Duration</label>
                    <input type="number" className="form-input" min={5} value={bookedDuration} onChange={(e) => setBookedDuration(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Walk-in Slot Duration</label>
                    <input type="number" className="form-input" min={5} value={walkinDuration} onChange={(e) => setWalkinDuration(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Walk-in to Booked Ratio</label>
                  <input type="number" className="form-input" min={1} value={ratio} onChange={(e) => setRatio(e.target.value)} />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>For every {ratio} booked slots, 1 walk-in slot will be inserted.</div>
                </div>
              </>
            )}

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Save Tomorrow Slots'}
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Preview</h3>
              <span className="badge badge-primary">{preview.length} slots</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {preview.map((slot) => (
                <div key={`${slot.token}-${slot.time}`} style={{
                  padding: '10px 12px', borderRadius: 12,
                  border: '1px solid #e2e8f0', background: slot.type === 'BUFFER' ? '#f8fafc' : 'white',
                  minWidth: 100,
                }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>T-{slot.token}</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{slot.time}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{slot.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSetupSlots;