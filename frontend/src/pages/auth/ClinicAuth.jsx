import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../services/api';

const ClinicAuth = () => {
  const [form, setForm] = useState({ email: '', password: '', role: 'receptionist' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ ...form, role: form.role.toLowerCase() });
      loginUser(res.user, res.token);
      if (res.user.role === 'doctor') navigate('/doctor/queue');
      else navigate('/receptionist/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 30%, #e0f2fe 60%, #f0fdfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', top: 24, left: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 9,
          background: 'white', border: '1px solid #e2e8f0',
          color: '#475569', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        ← Back to Home
      </button>

      <div style={{
        width: '100%', maxWidth: 960,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 28, alignItems: 'stretch',
      }}>

        {/* ─── LEFT: Login Card ─── */}
        <div style={{
          background: 'white',
          borderRadius: 22,
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 22, fontWeight: 900, marginBottom: 24,
          }}>+</div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Already registered?
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            Sign in to your clinic dashboard
          </p>

          {error && (
            <div style={{
              background: '#fee2e2', color: '#991b1b',
              padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 18,
              border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
               {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                I am a
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'doctor', label: '‍ Doctor', color: '#0d9488' },
                  { id: 'receptionist', label: '‍ Receptionist', color: '#0d9488' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.id }))}
                    style={{
                      flex: 1, padding: '10px 14px',
                      borderRadius: 10,
                      border: `2px solid ${form.role === r.id ? r.color : '#e2e8f0'}`,
                      background: form.role === r.id ? '#f0fdfa' : 'white',
                      color: form.role === r.id ? r.color : '#64748b',
                      fontWeight: 700, fontSize: 13.5,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 7 }}>
                Email address
              </label>
              <input
                style={{
                  width: '100%', padding: '11px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'border-color 0.15s', color: '#0f172a',
                  boxSizing: 'border-box',
                }}
                type="email" placeholder="you@clinic.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 7 }}>
                Password
              </label>
              <input
                style={{
                  width: '100%', padding: '11px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'border-color 0.15s', color: '#0f172a',
                  boxSizing: 'border-box',
                }}
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: 13,
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                color: 'white', border: 'none', borderRadius: 11,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              <div style={{
                padding: '10px 14px', background: '#f8fafb',
                borderRadius: 9, fontSize: 12, color: '#64748b',
                border: '1px solid #f1f5f9',
              }}>
                <strong style={{ color: '#475569' }}>Demo:</strong>{' '}
                Receptionist → anjali@iyer.com / 123456
              </div>
            </div>
          </form>
        </div>

        {/* ─── RIGHT: Register Card ─── */}
        <div style={{
          background: 'white',
          borderRadius: 22,
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 28,
          }}>
            
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            New clinic?
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 12, maxWidth: 280 }}>
            Get your clinic on ClinicPro in 3 easy steps
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, width: '100%', maxWidth: 260 }}>
            {[
              { num: '1', label: 'Verify with GST number' },
              { num: '2', label: 'Add doctor or staff details' },
              { num: '3', label: 'Start managing patients' },
            ].map(s => (
              <div key={s.num} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: '#f8fafb', border: '1px solid #f1f5f9',
                textAlign: 'left',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>
                  {s.num}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/clinic/register')}
            style={{
              width: '100%', maxWidth: 280, padding: 13,
              background: 'white',
              color: '#0d9488',
              border: '2px solid #0d9488',
              borderRadius: 11,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.background = '#f0fdfa';
              e.target.style.boxShadow = '0 4px 14px rgba(13,148,136,0.15)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'white';
              e.target.style.boxShadow = 'none';
            }}
          >
            Get Started →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClinicAuth;