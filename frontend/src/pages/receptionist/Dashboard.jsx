import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { getTodayWalkIns, getTodayAppointments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, selectedClinicId } = useAuth();
  const navigate = useNavigate();
  const clinic_id = selectedClinicId || user?.clinic_id || 1;
  const [walkIns, setWalkIns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wi, appt] = await Promise.all([
          getTodayWalkIns(clinic_id),
          getTodayAppointments(clinic_id),
        ]);
        setWalkIns(wi.data);
        setAppointments(appt.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalToday = walkIns.length + appointments.length;
  const done = walkIns.filter(w => w.status === 'DONE').length +
    appointments.filter(a => a.status === 'COMPLETE').length;
  const waiting = walkIns.filter(w => w.status === 'WAITING').length;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2> Welcome, {user?.name || 'Receptionist'}</h2>
          <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Today</div>
            <div className="stat-value">{totalToday}</div>
            <div className="stat-sub">Appointments + Walk-ins</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Waiting</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{waiting}</div>
            <div className="stat-sub">In walk-in queue</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{done}</div>
            <div className="stat-sub">Seen today</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Appointments</div>
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-sub">Booked slots</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onClick={() => navigate('/receptionist/walkin')}
            onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
            <div style={{ fontSize: 36, marginBottom: 12 }}></div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Register Walk-in</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              Search patient by phone, register if new, add to queue
            </p>
            <div style={{ marginTop: 16 }}>
              <span className="btn btn-primary btn-sm">Open →</span>
            </div>
          </div>

          <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onClick={() => navigate('/receptionist/appointments')}
            onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
            <div style={{ fontSize: 36, marginBottom: 12 }}></div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Book Appointment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              View available slots and book appointments for patients
            </p>
            <div style={{ marginTop: 16 }}>
              <span className="btn btn-primary btn-sm">Open →</span>
            </div>
          </div>
        </div>

        {/* Recent walk-ins */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Walk-ins</h3>
          {loading ? <p>Loading...</p> : walkIns.length === 0 ? (
            <div className="empty-state"><p>No walk-ins registered today</p></div>
          ) : (
            walkIns.slice(0, 5).map(w => (
              <div key={w.walkin_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div className="token-badge">W{w.token_number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{w.patient_name}</div>
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
  );
};

export default Dashboard;