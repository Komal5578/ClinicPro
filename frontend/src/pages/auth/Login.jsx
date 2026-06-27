import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../services/api';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: 'DOCTOR',
      label: 'Doctor',
      desc: 'Consult & manage patients',
      icon: '‍',
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      id: 'RECEPTIONIST',
      label: 'Receptionist',
      desc: 'Manage appointments & walk-ins',
      icon: '‍',
      color: '#059669',
      bg: '#d1fae5',
    },
    {
      id: 'PATIENT',
      label: 'Patient',
      desc: 'Book appointments & view records',
      icon: '',
      color: '#7c3aed',
      bg: '#ede9fe',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { setError('Please select a role first'); return; }
    if (form.role === 'PATIENT') { navigate('/patient'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await login({ ...form, role: form.role.toLowerCase() });
      // api.js uses fetch (not axios), so response is plain object — no .data wrapper
      loginUser(res.user, res.token);
      if (res.user.role === 'doctor') navigate('/doctor/queue');
      else navigate('/receptionist/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === form.role);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdf4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 920, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

        {/* Left side - hero */}
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 38, height: 38,
              background: '#2563eb',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 20, fontWeight: 900,
            }}>+</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Clinic<span style={{ color: '#2563eb' }}>Pro</span>
            </span>
          </div>

          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.25,
            letterSpacing: '-0.8px',
            marginBottom: 16,
          }}>
            Smart Clinic Management{' '}
            <span style={{ fontFamily: 'Instrument Serif, Georgia, serif', fontStyle: 'italic', color: '#2563eb' }}>
              Simplified
            </span>
          </h1>

          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, marginBottom: 36, maxWidth: 360 }}>
            Manage appointments, consultations, prescriptions, inventory and more — all in one platform built for Indian clinics.
          </p>

          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { val: '1200+', label: 'Appointments Today' },
              { val: '98%', label: 'Satisfaction Rate' },
              { val: '50+', label: 'Happy Clinics' },
            ].map(s => (
              <div key={s.val}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{s.val}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - login card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Welcome back </h2>
          <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 28 }}>Select your role and sign in</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => {
                  setForm(f => ({ ...f, role: role.id }));
                  setError('');
                  if (role.id === 'PATIENT') navigate('/patient');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${form.role === role.id ? role.color : '#e2e8f0'}`,
                  background: form.role === role.id ? role.bg : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: form.role === role.id ? `0 0 0 3px ${role.color}20` : 'none',
                }}
                onMouseEnter={e => {
                  if (form.role !== role.id) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={e => {
                  if (form.role !== role.id) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: role.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{role.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{role.desc}</div>
                </div>
                {role.id === 'patient' ? (
                  <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, background: '#ede9fe', padding: '3px 8px', borderRadius: 6 }}>
                    No login →
                  </span>
                ) : form.role === role.id ? (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: role.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #cbd5e1' }} />
                )}
              </div>
            ))}
          </div>

          {(form.role === 'DOCTOR' || form.role === 'RECEPTIONIST') && (
            <form onSubmit={handleSubmit} style={{ animation: 'fadeUp 0.2s ease' }}>
              {error && (
                <div style={{
                  background: '#fee2e2', color: '#991b1b',
                  padding: '10px 14px', borderRadius: 9,
                  fontSize: 13, marginBottom: 16,
                  border: '1px solid #fecaca',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 7 }}>
                  Email address
                </label>
                <input
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 9,
                    fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                    outline: 'none', transition: 'border-color 0.15s',
                    color: '#0f172a', boxSizing: 'border-box',
                  }}
                  type="email"
                  placeholder="you@clinic.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = selectedRole?.color || '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  required
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 7 }}>
                  Password
                </label>
                <input
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 9,
                    fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                    outline: 'none', transition: 'border-color 0.15s',
                    color: '#0f172a', boxSizing: 'border-box',
                  }}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = selectedRole?.color || '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedRole?.color || '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  boxShadow: `0 4px 14px ${selectedRole?.color || '#2563eb'}40`,
                  transition: 'all 0.15s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing in...' : `Sign in as ${selectedRole?.label} →`}
              </button>

              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: '#f8fafc', borderRadius: 9,
                fontSize: 12, color: '#64748b',
                border: '1px solid #f1f5f9',
              }}>
                <strong style={{ color: '#475569' }}>Demo:</strong>{' '}
                Doctor → rahul@clinic.com / 123456
              </div>
            </form>
          )}

          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap');
          `}</style>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;