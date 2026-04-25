const Loader = ({ message = 'Loading...', fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: { spinner: 20, stroke: 3, font: 12 },
    md: { spinner: 36, stroke: 4, font: 14 },
    lg: { spinner: 52, stroke: 5, font: 16 },
  };

  const s = sizes[size] || sizes.md;

  const spinner = (
    <div style={{ textAlign: 'center' }}>
      {/* Spinner ring */}
      <div style={{
        width: s.spinner,
        height: s.spinner,
        borderRadius: '50%',
        border: `${s.stroke}px solid var(--border, #e2e8f0)`,
        borderTopColor: 'var(--primary, #0f6fff)',
        animation: 'spin 0.7s linear infinite',
        margin: '0 auto',
      }} />
      {message && (
        <div style={{
          marginTop: 12,
          color: 'var(--text-muted, #718096)',
          fontSize: s.font,
          fontWeight: 500,
        }}>
          {message}
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 20, letterSpacing: -0.5 }}>
            Clinic<span style={{ color: 'var(--primary, #0f6fff)' }}>Pro</span>
          </div>
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {spinner}
    </div>
  );
};

export default Loader;