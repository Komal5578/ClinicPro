import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { getTodayAppointments, getTodayWalkIns, updateWalkInStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Queue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const clinic_id = user?.clinic_id || 1;

  const [appointments, setAppointments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('walkins');

  const fetchData = async () => {
    try {
      const [appt, wi] = await Promise.all([
        getTodayAppointments(clinic_id),
        getTodayWalkIns(clinic_id),
      ]);
      setAppointments(appt.data);
      setWalkIns(wi.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startConsultation = async (walkin) => {
    try {
      await updateWalkInStatus(walkin.walkin_id, 'IN_CONSULTATION');
      localStorage.setItem('current_patient_id', walkin.patient_id);
      navigate(`/doctor/consultation/${walkin.patient_id}`);
    } catch (err) { console.error(err); }
  };

  const priorityOrder = { URGENT: 0, PRIORITY: 1, REGULAR: 2 };
  const sortedWalkIns = [...walkIns].sort((a, b) =>
    (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );

  const waiting = sortedWalkIns.filter(w => w.status === 'WAITING');
  const inConsult = sortedWalkIns.filter(w => w.status === 'IN_CONSULTATION');
  const done = sortedWalkIns.filter(w => w.status === 'DONE');

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>
              Today's Queue
            </h2>
            <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 3 }}>{today}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchData} style={{ gap: 5 }}>
            <span style={{ fontSize: 13 }}>↻</span> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">Waiting</div>
            <div className="stat-value" style={{ color: '#d97706' }}>{waiting.length}</div>
            <div className="stat-sub">In queue now</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Consultation</div>
            <div className="stat-value" style={{ color: '#2563eb' }}>{inConsult.length}</div>
            <div className="stat-sub">Active session</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Done Today</div>
            <div className="stat-value" style={{ color: '#059669' }}>{done.length}</div>
            <div className="stat-sub">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Appointments</div>
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-sub">Booked slots</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-group">
          <button
            className={`tab-pill ${activeTab === 'walkins' ? 'active' : ''}`}
            onClick={() => setActiveTab('walkins')}
          >
            🚶 Walk-ins
            {waiting.length > 0 && (
              <span style={{
                background: '#dc2626', color: 'white',
                borderRadius: 10, padding: '1px 6px',
                fontSize: 10, fontWeight: 700, marginLeft: 4,
              }}>
                {waiting.length}
              </span>
            )}
          </button>
          <button
            className={`tab-pill ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 Appointments
          </button>
        </div>

        {loading ? (
          <div className="card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#64748b', padding: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 0.7s linear infinite' }} />
              Loading queue...
            </div>
          </div>
        ) : activeTab === 'walkins' ? (
          <div>
            {/* In consultation */}
            {inConsult.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  ● Currently Consulting
                </div>
                {inConsult.map(w => (
                  <WalkInCard
                    key={w.walkin_id}
                    patient={w}
                    onAction={() => navigate(`/doctor/consultation/${w.patient_id}`)}
                    actionLabel="Continue →"
                    actionClass="btn-primary"
                  />
                ))}
              </div>
            )}

            {/* Waiting */}
            {waiting.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>Queue is clear!</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>No patients waiting right now.</p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Waiting · {waiting.length} patient{waiting.length !== 1 ? 's' : ''}
                </div>
                {waiting.map(w => (
                  <WalkInCard
                    key={w.walkin_id}
                    patient={w}
                    onAction={() => startConsultation(w)}
                    actionLabel="▶ Start"
                    actionClass="btn-success"
                  />
                ))}
              </div>
            )}

            {/* Done */}
            {done.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Done · {done.length} seen
                </div>
                {done.map(w => (
                  <WalkInCard
                    key={w.walkin_id}
                    patient={w}
                    onAction={() => navigate(`/doctor/patient/${w.patient_id}`)}
                    actionLabel="History"
                    actionClass="btn-outline"
                    muted
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            {appointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p>No appointments today</p>
              </div>
            ) : (
              appointments.map((a, i) => (
                <div key={a.appointment_id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0',
                  borderBottom: i < appointments.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{
                    background: '#eff6ff', color: '#1d4ed8',
                    borderRadius: 9, padding: '8px 12px',
                    fontSize: 13, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: 'nowrap', minWidth: 62, textAlign: 'center',
                  }}>
                    {a.slot_start_time?.slice(0, 5)}
                  </div>
                  <div className="patient-avatar">{a.patient_name?.[0] || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.patient_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Age {a.age} · {a.phone}</div>
                  </div>
                  <span className={`badge ${a.status === 'COMPLETE' ? 'badge-success' : a.status === 'ARRIVED' ? 'badge-warning' : 'badge-primary'}`}>
                    {a.status}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/doctor/patient/${a.patient_id}`)}
                  >
                    Open
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WalkInCard = ({ patient, onAction, actionLabel, actionClass, muted }) => {
  const priorityBorder = patient.priority === 'URGENT' ? '#dc2626' : patient.priority === 'PRIORITY' ? '#d97706' : '#e2e8f0';

  return (
    <div className={`queue-item ${patient.priority?.toLowerCase()} ${muted ? 'done' : ''}`}
      style={{ borderLeftColor: priorityBorder }}
    >
      <div className="token-badge">W{patient.token_number}</div>
      <div className="patient-avatar">{patient.patient_name?.[0] || '?'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{patient.patient_name}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          Age {patient.age} · {patient.phone}
          {patient.chief_complaint && (
            <span style={{ marginLeft: 8, color: '#475569' }}>
              · "{patient.chief_complaint}"
            </span>
          )}
        </div>
      </div>
      <span className={`badge ${patient.priority === 'URGENT' ? 'badge-danger' : patient.priority === 'PRIORITY' ? 'badge-warning' : 'badge-gray'}`}>
        {patient.priority}
      </span>
      <span className={`badge ${patient.status === 'WAITING' ? 'badge-warning' : patient.status === 'IN_CONSULTATION' ? 'badge-primary' : 'badge-success'}`}>
        {patient.status?.replace('_', ' ')}
      </span>
      <button className={`btn ${actionClass} btn-sm`} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
};

export default Queue;