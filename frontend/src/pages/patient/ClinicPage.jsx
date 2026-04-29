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
  const [clinicStatus, setClinicStatus] = useState({ doctor_status: 'ON_TIME', delay_message: null });
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
        const data = res.data || [];
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
        if (!cancelled) setSlots(s.data || []);
      } catch (err) { console.error(err); if (!cancelled) setSlots([]); }
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
        if (!cancelled) setClinicStatus(res.data);
      } catch (err) { if (!cancelled) setClinicStatus({ doctor_status: 'ON_TIME', delay_message: null }); }
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
      let patientRes;
      try { patientRes = await searchPatientPublic(phone); } catch(e) { patientRes = null; }
      let patientId = patientRes?.data?.patient_id;
      if (!patientId) {
        const reg = await registerPatient({ name, phone });
        patientId = reg.data.patient_id;
      }
      await bookAppointmentPublic({ slot_id: selectedSlot, patient_id: patientId, clinic_id: clinicId });
      setSuccess('Appointment booked — check your phone for confirmation');
      setName(''); setPhone(''); setSelectedSlot(null);
      const refreshed = await getPublicSlots(clinicId, selectedDate);
      setSlots(refreshed.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  if (!clinic) {
    return (
      <div style={{ padding: 28 }}>
        <button onClick={() => navigate('/patient')} style={{ marginBottom: 12 }}>← Back to map</button>
        <div>Loading clinic...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f8fafb' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{clinic.clinic_name}</h2>
            <div style={{ color: '#64748b' }}>{clinic.sector}</div>
          </div>
          <div style={{ color: '#475569', marginBottom: 12 }}>{clinic.address}</div>
          <div style={{ marginBottom: 12 }}>
            <strong>Doctor:</strong> {clinic.doctor_name || 'Doctor'} {clinic.nmc_verified ? '· Verified' : ''}
          </div>
          {clinicStatus.doctor_status === 'DELAYED' && (
            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#92400E' }}>Doctor is running late</div>
              {clinicStatus.delay_message && <div style={{ color: '#B45309' }}>{clinicStatus.delay_message}</div>}
            </div>
          )}

          <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #eef2f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>Available slots</div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e6eef6', background: 'white' }}
              />
            </div>
            {slots.filter(s => s.status === 'OPEN').length === 0 ? (
              <div style={{ color: '#94a3b8' }}>No slots available for this date</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {slots.filter(s => s.status === 'OPEN').map(s => (
                  <button key={s.slot_id} onClick={() => setSelectedSlot(s.slot_id)} style={{ padding: '8px 12px', borderRadius: 8, border: selectedSlot === s.slot_id ? '2px solid #0d9488' : '1px solid #e6eef6', background: selectedSlot === s.slot_id ? '#ecfdf5' : 'white', cursor: 'pointer' }}>
                    {s.token_number ? `T${s.token_number}` : ''} {s.slot_start_time?.slice(0,5)}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e6eef6' }} />
              <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: 160, padding: 8, borderRadius: 8, border: '1px solid #e6eef6' }} />
            </div>
            {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: '#065f46', marginBottom: 8 }}>{success}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleBook} disabled={loading} style={{ padding: '10px 14px', borderRadius: 10, background: '#0d9488', color: 'white', border: 'none', cursor: 'pointer' }}>{loading ? 'Booking...' : 'Book Appointment'}</button>
              <button onClick={() => { setName(''); setPhone(''); setSelectedSlot(null); }} style={{ padding: '10px 14px', borderRadius: 10, background: 'white', border: '1px solid #e6eef6' }}>Clear</button>
            </div>
          </div>
        </div>

        <div style={{ width: 420 }}>
          <div style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid #e6eef7' }}>
            <ClinicMap clinics={[clinic]} sectorFilter={'ALL'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicPage;
