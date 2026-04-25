// PatientSearch.jsx
export const PatientSearch = ({ onFound, onNotFound }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!phone || phone.length < 10) { setError('Enter 10-digit phone'); return; }
    setLoading(true); setError('');
    try {
      const { searchPatient } = await import('../../services/api');
      const res = await searchPatient(phone);
      onFound(res.data);
    } catch (err) {
      if (err.response?.status === 404) onNotFound(phone);
      else setError('Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="search-bar">
        <input
          className="form-input"
          placeholder="10-digit phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          maxLength={10}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </div>
    </div>
  );
};