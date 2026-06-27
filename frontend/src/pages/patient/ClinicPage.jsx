import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClinicMap from '../../components/patient/ClinicMap';
import { getClinicStatus, getPublicSlots, searchPatientPublic, registerPatient, bookAppointmentPublic, getPublicClinics } from '../../services/api';

const formatDateInput = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ClinicPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [slots, setSlots] = useState([]);
  const [clinicStatus, setClinicStatus] = useState({ is_delayed: false, delay_message: null });
  const [selectedDate, setSelectedDate] = useState(formatDateInput());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPublicClinics();
        const data = Array.isArray(res) ? res : res?.data || [];
        const found = data.find(c => String(c.clinic_id) === String(clinicId));
        setClinic(found || null);
      } catch (err) {
        console.error('Failed to load clinic', err);
      }
    };
    load();
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const s = await getPublicSlots(clinicId, selectedDate);
        if (!cancelled) setSlots(Array.isArray(s) ? s : s?.data || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setSlots([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clinicId, selectedDate]);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await getClinicStatus(clinicId);
        if (!cancelled) setClinicStatus(res || { is_delayed: false });
      } catch (err) {
        if (!cancelled) setClinicStatus({ is_delayed: false });
      }
    };
    refresh();
    const t = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [clinicId]);

const handleBook = async () => {
  setError(''); setSuccess('');
  if (!name || !phone || !selectedSlot) { setError('Enter name, phone and select a slot'); return; }
  setLoading(true);
  try {
    let patientId;
    try {
      const patientRes = await searchPatientPublic(phone);
      patientId = patientRes?.data?.patient_id;
    } catch (e) { patientId = null; }

    if (!patientId) {
      const reg = await registerPatient({ name, phone });
      patientId = reg?.data?.patient_id;
    }

    await bookAppointmentPublic({ slot_id: selectedSlot, patient_id: patientId, clinic_id: Number(clinicId) });
    setSuccess('Appointment booked successfully!');
    setName(''); setPhone(''); setSelectedSlot(null);

    const refreshed = await getPublicSlots(clinicId, selectedDate);
    setSlots(Array.isArray(refreshed) ? refreshed : refreshed?.data || []);
  } catch (err) {
    setError(err.message || 'Booking failed');
  } finally { setLoading(false); }
};

  if (!clinic) {
    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => navigate('/patient')}>← Back to map</button>
        <div style={{ marginTop: 12 }}>Loading clinic...</div>
      </div>
    );
  }

  const openSlots = slots.filter(s => s.status === 'OPEN');

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f8fafb', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <button onClick={() => navigate('/patient')} style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
        ← Back to map
      </button>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{clinic.clinic_name}</h2>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700 }}>
              {clinic.sector}
            </span>
          </div>
          <div style={{ color: '#475569', marginBottom: 12 }}>{clinic.address}</div>

          {clinicStatus.is_delayed && (
            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#92400E' }}>Doctor is running late</div>
              {clinicStatus.delay_message && <div style={{ color: '#B45309' }}>{clinicStatus.delay_message}</div>}
            </div>
          )}

          <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Available Slots</div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </div>

            {openSlots.length === 0 ? (
              <div style={{ color: '#94a3b8', marginBottom: 16 }}>No slots available for this date</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {openSlots.map(s => (
                  <button
                    key={s.slot_id}
                    onClick={() => setSelectedSlot(s.slot_id)}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: selectedSlot === s.slot_id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                      background: selectedSlot === s.slot_id ? '#ecfdf5' : 'white',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {s.token_number ? `T${s.token_number}` : ''} {s.slot_start_time?.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <input
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ width: 160, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
            </div>

            {error && <div style={{ color: '#b91c1c', marginBottom: 8, fontSize: 13 }}>{error}</div>}
            {success && <div style={{ color: '#065f46', marginBottom: 8, fontSize: 13 }}>{success}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleBook}
                disabled={loading}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#0d9488', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
              <button
                onClick={() => { setName(''); setPhone(''); setSelectedSlot(null); }}
                style={{ padding: '10px 16px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div style={{ width: 400 }}>
          <div style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <ClinicMap clinics={[clinic]} sectorFilter="ALL" />
          </div>
          <div style={{ marginTop: 12, padding: 14, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Clinic Hours</div>
            <div style={{ color: '#475569' }}>Morning: {clinic.morning_start?.slice(0,5)} – {clinic.morning_end?.slice(0,5)}</div>
            {clinic.evening_start && <div style={{ color: '#475569' }}>Evening: {clinic.evening_start?.slice(0,5)} – {clinic.evening_end?.slice(0,5)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicPage;