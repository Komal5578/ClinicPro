import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { getTodayAppointments, getTodaySlots, searchPatient, bookAppointment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AppointmentBooking = () => {
  const { user } = useAuth();
  const clinic_id = user?.clinic_id || 1;
  const doctor_id = 1;

  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [appt, sl] = await Promise.all([
        getTodayAppointments(clinic_id),
        getTodaySlots(clinic_id),
      ]);
      setAppointments(appt.data);
      setSlots(sl.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = async () => {
    setError(''); setPatient(null);
    try {
      const res = await searchPatient(phone);
      setPatient(res.data);
    } catch {
      setError('Patient not found. Please register them first from Walk-in page.');
    }
  };

  const handleBook = async () => {
    if (!patient || !selectedSlot) { setError('Select a patient and slot'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await bookAppointment({ slot_id: selectedSlot, patient_id: patient.patient_id, doctor_id, clinic_id });
      setSuccess('Appointment booked successfully!');
      setPatient(null); setPhone(''); setSelectedSlot(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  const openSlots = slots.filter(s => s.status === 'OPEN');
  const statusColor = { SCHEDULED: 'badge-primary', ARRIVED: 'badge-warning', COMPLETE: 'badge-success', CANCELLED: 'badge-danger' };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2> Appointment Booking</h2>
          <p>Book slots for patients and view today's schedule</p>
        </div>

        <div className="grid-2">
          {/* Booking form */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Book New Appointment</h3>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Patient search */}
            <div className="form-group">
              <label className="form-label">Search Patient by Phone</label>
              <div className="search-bar" style={{ marginBottom: 8 }}>
                <input className="form-input" placeholder="Phone number"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <button className="btn btn-primary" onClick={handleSearch}>Search</button>
              </div>
              {patient && (
                <div style={{ padding: '10px 14px', background: 'var(--success-light)', borderRadius: 8, fontSize: 13 }}>
                   <strong>{patient.name}</strong> · Age {patient.age} · {patient.phone}
                </div>
              )}
            </div>

            {/* Slot selection */}
            <div className="form-group">
              <label className="form-label">Select Available Slot</label>
              {openSlots.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No open slots today</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {openSlots.map(slot => (
                    <button
                      key={slot.slot_id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.slot_id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: `2px solid ${selectedSlot === slot.slot_id ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedSlot === slot.slot_id ? 'var(--primary-light)' : 'white',
                        color: selectedSlot === slot.slot_id ? 'var(--primary)' : 'var(--text)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        fontFamily: 'DM Mono, monospace',
                        transition: 'all 0.15s'
                      }}
                    >
                      {slot.slot_start_time?.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleBook} disabled={loading || !patient || !selectedSlot}
              style={{ width: '100%' }}>
              {loading ? 'Booking...' : ' Book Appointment'}
            </button>
          </div>

          {/* Today's appointments */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Today's Appointments</h3>
              <span className="badge badge-primary">{appointments.length}</span>
            </div>

            {appointments.length === 0 ? (
              <div className="empty-state"><p>No appointments today</p></div>
            ) : (
              appointments.map(a => (
                <div key={a.appointment_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg)', marginBottom: 8
                }}>
                  <div style={{
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    borderRadius: 8, padding: '6px 10px', fontSize: 12,
                    fontWeight: 700, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap'
                  }}>
                    {a.slot_start_time?.slice(0, 5)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patient_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age {a.age} · {a.phone}</div>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'badge-gray'}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;