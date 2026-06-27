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

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const buildPreview = ({
  morningStart,
  morningEnd,
  eveningStart,
  eveningEnd,
  bookedDuration,
  walkinDuration,
  ratio,
  bookedTokenCount,
  bufferTokenCount,
}) => {
  const rows = [];
  let token = 1;
  
  const bookedDur = Number(bookedDuration) || 20;
  const walkinDur = Number(walkinDuration) || 15;
  const tokenDuration = gcd(bookedDur, walkinDur);
  const derivedBookedTokens = Math.ceil(bookedDur / tokenDuration);
  const derivedBufferTokens = Math.ceil(walkinDur / tokenDuration);
  const tokensPerBooked = Math.max(1, Number(bookedTokenCount) || derivedBookedTokens);
  const tokensPerBuffer = Math.max(1, Number(bufferTokenCount) || derivedBufferTokens);
  
  const pattern = [...Array(Math.max(1, Number(ratio) || 3)).fill('BOOKED'), 'BUFFER'];

  const addRange = (start, end) => {
    let cursor = parseMinutes(start);
    const limit = parseMinutes(end);
    let idx = 0;
    while (cursor + Math.min(bookedDur, walkinDur) <= limit) {
      const type = pattern[idx % pattern.length];
      const duration = type === 'BUFFER' ? walkinDur : bookedDur;
      if (cursor + duration > limit) break;
      
      const numTokens = type === 'BUFFER' ? tokensPerBuffer : tokensPerBooked;
      const time = formatMinutes(cursor);
      const groupId = `${time}-${type}`;
      
      for (let i = 0; i < numTokens; i += 1) {
        rows.push({ token, type, time, groupId, isFirst: i === 0, isLast: i === numTokens - 1, duration });
        token += 1;
      }
      
      cursor += duration;
      idx += 1;
    }
  };

  addRange(morningStart, morningEnd);

  if (eveningStart && eveningEnd) {
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
  const [bookedTokenCount, setBookedTokenCount] = useState(1);
  const [bufferTokenCount, setBufferTokenCount] = useState(1);
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
    bookedTokenCount: Number(bookedTokenCount) || 1,
    bufferTokenCount: Number(bufferTokenCount) || 1,
  }), [morningStart, morningEnd, eveningStart, eveningEnd, bookedDuration, walkinDuration, ratio, bookedTokenCount, bufferTokenCount]);

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
        booked_token_count: Number(bookedTokenCount) || 1,
        buffer_token_count: Number(bufferTokenCount) || 1,
      });
      console.log('API response:', res.data);
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

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Booked Tokens Per Slot</label>
                    <input type="number" className="form-input" min={1} value={bookedTokenCount} onChange={(e) => setBookedTokenCount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Buffer Tokens Per Slot</label>
                    <input type="number" className="form-input" min={1} value={bufferTokenCount} onChange={(e) => setBufferTokenCount(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Walk-in to Booked Ratio</label>
                  <input type="number" className="form-input" min={1} value={ratio} onChange={(e) => setRatio(e.target.value)} />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>For every {ratio} booked slots, 1 walk-in slot will be inserted.</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Doctor controls tokens: {bookedTokenCount || 1} token(s) for each {bookedDuration || 20} min booked slot, {bufferTokenCount || 1} token(s) for each {walkinDuration || 15} min buffer.
                  </div>
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
              <span className="badge badge-primary">{preview.length} tokens</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {preview.reduce((groups, slot) => {
                const lastGroup = groups[groups.length - 1];
                if (lastGroup && lastGroup[0].groupId === slot.groupId) {
                  lastGroup.push(slot);
                } else {
                  groups.push([slot]);
                }
                return groups;
              }, []).map((group) => (
                <div key={group[0].groupId} style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: group[0].type === 'BUFFER' ? '#f8fafc' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {group.map((slot) => (
                      <div key={slot.token} style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: slot.type === 'BUFFER' ? '#e2e8f0' : '#dbeafe',
                        fontSize: 12,
                        fontWeight: 800,
                        fontFamily: 'DM Mono, monospace',
                        whiteSpace: 'nowrap',
                        border: `1px solid ${slot.type === 'BUFFER' ? '#cbd5e1' : '#bfdbfe'}`,
                      }}>
                        T-{slot.token}
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    <div>{group[0].time}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                      {group[0].type} • {group[0].duration} min
                    </div>
                  </div>
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