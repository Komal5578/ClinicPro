import { useEffect, useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { getTodayAppointments, getTodayWalkIns, searchPatientPublic, registerPatient, registerWalkIn, updateWalkInStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AppointmentBooking = () => {
  const { user, selectedClinicId } = useAuth();
  const clinic_id = selectedClinicId || user?.clinic_id || 1;

  const [appointments, setAppointments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [walkInStep, setWalkInStep] = useState('search');
  const [walkInPatient, setWalkInPatient] = useState(null);
  const [walkInForm, setWalkInForm] = useState({ name: '', age: '', phone: '', email: '', priority: 'REGULAR', chief_complaint: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [appt, wi] = await Promise.all([
        getTodayAppointments(clinic_id),
        getTodayWalkIns(clinic_id),
      ]);
      setAppointments(appt.data || []);
      setWalkIns(wi.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [clinic_id]);

  const handleSearch = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setError('');
    try {
      const res = await searchPatientPublic(searchPhone);
      setWalkInPatient(res.data);
      setWalkInForm(f => ({ ...f, phone: searchPhone }));
      setWalkInStep('add');
    } catch (err) {
      if (err.response?.status === 404) {
        setWalkInForm(f => ({ ...f, phone: searchPhone }));
        setWalkInStep('register');
      } else {
        setError('Patient search failed');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await registerPatient({
        name: walkInForm.name,
        age: walkInForm.age,
        phone: walkInForm.phone,
        email: walkInForm.email,
      });
      setWalkInPatient({ patient_id: res.data.patient_id, ...walkInForm });
      setWalkInStep('add');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWalkIn = async () => {
    if (!walkInPatient?.patient_id) {
      setError('Select or register a patient first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerWalkIn({
        patient_id: walkInPatient.patient_id,
        clinic_id,
        priority: walkInForm.priority,
        chief_complaint: walkInForm.chief_complaint,
      });
      setSuccess('Walk-in added to queue');
      setWalkInStep('search');
      setWalkInPatient(null);
      setWalkInForm({ name: '', age: '', phone: '', email: '', priority: 'REGULAR', chief_complaint: '' });
      setSearchPhone('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add walk-in');
    } finally {
      setLoading(false);
    }
  };

  const markArrived = async (appointmentId) => {
    try {
      await updateWalkInStatus(appointmentId, 'ARRIVED');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2>Today's Schedule</h2>
          <p>Booked appointments on the left, walk-ins on the right</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Today's Schedule</h3>
              <span className="badge badge-primary">{appointments.length}</span>
            </div>

            {appointments.length === 0 ? (
              <div className="empty-state"><p>No appointments today</p></div>
            ) : (
              appointments.map((a) => (
                <div key={a.appointment_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', marginBottom: 8
                }}>
                  <div style={{
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    borderRadius: 8, padding: '6px 10px', fontSize: 12,
                    fontWeight: 800, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap'
                  }}>
                    {a.token_number ? `T-${a.token_number}` : ''} {a.slot_start_time?.slice(0, 5)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.patient_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age {a.age} · {a.phone}</div>
                  </div>
                  <span className={`badge ${a.status === 'COMPLETE' ? 'badge-success' : a.status === 'ARRIVED' ? 'badge-warning' : 'badge-primary'}`}>
                    {a.status}
                  </span>
                  {a.status === 'SCHEDULED' && (
                    <button className="btn btn-outline btn-sm" onClick={() => markArrived(a.appointment_id)}>
                      ARRIVED
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Add Walk-in</h3>
              <span className="badge badge-primary">{walkInStep.toUpperCase()}</span>
            </div>

            {walkInStep === 'search' && (
              <div className="form-group">
                <label className="form-label">Search by Phone</label>
                <div className="search-bar">
                  <input
                    className="form-input"
                    placeholder="10-digit phone"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                </div>
              </div>
            )}

            {walkInStep === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" value={walkInForm.name} onChange={e => setWalkInForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age *</label>
                    <input type="number" className="form-input" value={walkInForm.age} onChange={e => setWalkInForm(f => ({ ...f, age: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={walkInForm.phone} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={walkInForm.email} onChange={e => setWalkInForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setWalkInStep('search')}>Back</button>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>Register</button>
                </div>
              </form>
            )}

            {walkInStep === 'add' && walkInPatient && (
              <>
                <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <strong>{walkInPatient.name}</strong> · {walkInPatient.phone}
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={walkInForm.priority} onChange={e => setWalkInForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="REGULAR">REGULAR</option>
                    <option value="PRIORITY">PRIORITY</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Chief Complaint</label>
                  <input className="form-input" value={walkInForm.chief_complaint} onChange={e => setWalkInForm(f => ({ ...f, chief_complaint: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={() => { setWalkInPatient(null); setWalkInStep('search'); }}>Back</button>
                  <button type="button" className="btn btn-success" disabled={loading} style={{ flex: 1 }} onClick={handleAddWalkIn}>Add to Queue</button>
                </div>
              </>
            )}

            <div className="card" style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Walk-in Queue</h3>
                <span className="badge badge-primary">{walkIns.length}</span>
              </div>

              {walkIns.length === 0 ? (
                <div className="empty-state"><p>No walk-ins today</p></div>
              ) : (
                walkIns.map((w) => (
                  <div key={w.walkin_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', marginBottom: 8
                  }}>
                    <div className="token-badge">W{w.token_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{w.patient_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.chief_complaint || '—'}</div>
                    </div>
                    <span className={`badge ${w.priority === 'URGENT' ? 'badge-danger' : w.priority === 'PRIORITY' ? 'badge-warning' : 'badge-gray'}`}>
                      {w.priority}
                    </span>
                    <span className={`badge ${w.status === 'DONE' ? 'badge-success' : w.status === 'IN_CONSULTATION' ? 'badge-primary' : 'badge-warning'}`}>
                      {w.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;