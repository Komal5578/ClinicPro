import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const doctorLinks = [
  { to: '/doctor/queue', icon: '', label: 'Queue' },
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/clinic');
  };

  const links = user?.role === 'doctor' ? doctorLinks : receptionistLinks;
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>Clinic<span>Pro</span></h1>
        <div className="sidebar-role">
          {user?.role === 'doctor' ? '🩺 Doctor Portal' : ' Reception Portal'}
        </div>
      </div>

      {/* Nav */}
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

      {/* Bottom user section */}
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