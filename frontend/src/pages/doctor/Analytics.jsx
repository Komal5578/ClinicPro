import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { getTodayAppointments, getTodayWalkIns } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const { user, selectedClinicId } = useAuth();
  const clinic_id = selectedClinicId || user?.clinic_id || 1;
  const [appointments, setAppointments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
    try {
      const [appt, wi] = await Promise.all([
        getTodayAppointments(clinic_id),
        getTodayWalkIns(clinic_id),
      ]);
      setAppointments(Array.isArray(appt) ? appt : appt?.data || []);
      setWalkIns(Array.isArray(wi) ? wi : wi?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [clinic_id]);

  const total = appointments.length + walkIns.length;
  const completed = [
    ...appointments.filter(a => a.status === 'COMPLETE'),
    ...walkIns.filter(w => w.status === 'DONE'),
  ].length;
  const pending = total - completed;
  const urgent = walkIns.filter(w => w.priority === 'URGENT').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2> Today's Analytics</h2>
          <p>Overview of today's clinic activity</p>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Patients</div>
                <div className="stat-value">{total}</div>
                <div className="stat-sub">Today's visits</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{completed}</div>
                <div className="stat-sub">{completionRate}% completion rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pending</div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
                <div className="stat-sub">Still in queue</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Urgent Cases</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{urgent}</div>
                <div className="stat-sub">Walk-in urgent</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Completion Progress</h3>
              <div style={{ background: 'var(--bg)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--success))',
                  borderRadius: 8,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{completed} done</span>
                <span>{completionRate}%</span>
                <span>{total} total</span>
              </div>
            </div>

            <div className="grid-2">
              {/* Appointment breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}> Appointments ({appointments.length})</h3>
                {appointments.length === 0 ? (
                  <div className="empty-state"><p>No appointments today</p></div>
                ) : (
                  ['SCHEDULED', 'ARRIVED', 'COMPLETE', 'CANCELLED'].map(status => {
                    const count = appointments.filter(a => a.status === status).length;
                    if (count === 0) return null;
                    const colors = { SCHEDULED: 'badge-primary', ARRIVED: 'badge-warning', COMPLETE: 'badge-success', CANCELLED: 'badge-danger' };
                    return (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className={`badge ${colors[status]}`}>{status}</span>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>{count}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Walk-in breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}> Walk-ins ({walkIns.length})</h3>
                {walkIns.length === 0 ? (
                  <div className="empty-state"><p>No walk-ins today</p></div>
                ) : (
                  ['WAITING', 'IN_CONSULTATION', 'DONE'].map(status => {
                    const count = walkIns.filter(w => w.status === status).length;
                    if (count === 0) return null;
                    const colors = { WAITING: 'badge-warning', IN_CONSULTATION: 'badge-primary', DONE: 'badge-success' };
                    return (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className={`badge ${colors[status]}`}>{status.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;