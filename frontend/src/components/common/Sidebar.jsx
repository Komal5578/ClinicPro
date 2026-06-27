import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDoctorClinics, getPublicClinics } from '../../services/api';

const doctorLinks = [
  { to: '/doctor/queue', icon: '', label: 'Queue' },
  { to: '/doctor/setup-slots', icon: '', label: "Tomorrow's Slots" },
  { to: '/doctor/staff', icon: '', label: 'Manage Staff' },
  { to: '/doctor/followup', icon: '', label: 'Follow-ups' },
  { to: '/doctor/analytics', icon: '', label: 'Analytics' },
];

const receptionistLinks = [
  { to: '/receptionist/dashboard', icon: '', label: 'Dashboard' },
  { to: '/receptionist/walkin', icon: '', label: 'Walk-in Register' },
  { to: '/receptionist/appointments', icon: '', label: 'Appointments' },
  { to: '/receptionist/inventory', icon: '', label: 'Inventory' },
  { to: '/receptionist/staff', icon: '', label: 'Staff' },
];

const Sidebar = () => {
  const {
    user, logout, selectedClinicId, setSelectedClinicId,
    doctorClinics, setDoctorClinics,
  } = useAuth();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    const loadClinics = async () => {
      if (user?.role === 'doctor') {
        if (!user?.id) return;
        try {
          const res = await getDoctorClinics(user.id);
          const clinics = Array.isArray(res) ? res : res?.data || [];
          setDoctorClinics(clinics);
          if (!selectedClinicId && clinics.length > 0) {
            const firstClinicId = clinics[0].clinic_id;
            setSelectedClinicId(firstClinicId);
            localStorage.setItem('selected_clinic_id', String(firstClinicId));
          }
        } catch (err) {
          console.error('Failed to load doctor clinics', err);
        }
      }

      if (user?.role === 'receptionist' && user?.clinic_id) {
        try {
          const res = await getPublicClinics();
          const clinics = Array.isArray(res) ? res : res?.data || [];
          const clinic = clinics.find(c => c.clinic_id === user.clinic_id);
          if (clinic) setClinicName(clinic.clinic_name);
        } catch (err) {
          console.error('Failed to load clinic name', err);
        }
      }
    };

    loadClinics();
  }, [user?.role, user?.id, user?.clinic_id]);

  const handleLogout = () => {
    logout();
    navigate('/clinic');
  };

  const links = user?.role === 'doctor' ? doctorLinks : receptionistLinks;
  const initial = user?.name?.[0]?.toUpperCase() || '?';
  const currentClinic = useMemo(() => {
    if (user?.role !== 'doctor') return null;
    return doctorClinics.find(c => String(c.clinic_id) === String(selectedClinicId)) || doctorClinics[0] || null;
  }, [doctorClinics, selectedClinicId, user?.role]);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Clinic<span>Pro</span></h1>
        <div className="sidebar-role" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>{user?.role === 'doctor' ? '🩺 Doctor Portal' : '🏥 Reception Portal'}</span>

          {user?.role === 'doctor' && currentClinic && (
            doctorClinics.length > 1 ? (
              <select
                value={selectedClinicId || currentClinic.clinic_id}
                onChange={(e) => {
                  setSelectedClinicId(Number(e.target.value));
                  localStorage.setItem('selected_clinic_id', e.target.value);
                }}
                style={{
                  marginTop: 4, padding: '6px 10px', borderRadius: 10,
                  border: '1px solid #dbe4ee', background: '#fff', color: '#0f172a',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%',
                }}
              >
                {doctorClinics.map((clinic) => (
                  <option key={clinic.clinic_id} value={clinic.clinic_id}>
                    📍 {clinic.clinic_name}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ marginTop: 4, fontSize: 12, color: '#334155', fontWeight: 700 }}>
                📍 {currentClinic.clinic_name}
              </div>
            )
          )}

          {user?.role === 'receptionist' && clinicName && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              📍 {clinicName}
            </div>
          )}
        </div>
      </div>

      <nav>
        <div className="sidebar-section-label">Navigation</div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span style={{ fontSize: 15 }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>↩</span> Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;