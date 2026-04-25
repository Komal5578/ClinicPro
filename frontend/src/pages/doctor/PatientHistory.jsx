import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { getPatientHistory } from '../../services/api';

const PatientHistory = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPatientHistory(patient_id);
        setData(res.data);
      } catch (err) {
        setError('Failed to load patient history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [patient_id]);

  const patient = data?.consultations?.[0];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Patient History</h2>
          </div>
        </div>

        {loading ? <p>Loading...</p> : error ? <div className="alert alert-danger">{error}</div> : (
          <>
            {/* Patient Info */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{patient?.patient_name || 'Patient'}</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                    Age {patient?.age} · {patient?.phone}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/doctor/consultation/${patient_id}`)}
                >
                  + New Consultation
                </button>
              </div>

              {/* Conditions */}
              {data?.conditions?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Known Conditions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.conditions.map(c => (
                      <span key={c.condition_id}
                        className={`badge ${c.condition_type === 'ALLERGY' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.condition_type}: {c.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid-2">
              {/* Past Consultations */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Last 3 Consultations</h3>
                {data?.consultations?.length === 0 ? (
                  <div className="empty-state"><p>No consultations yet</p></div>
                ) : (
                  data.consultations.map(c => (
                    <div key={c.consultation_id} style={{
                      padding: 14, borderRadius: 8, background: 'var(--bg)',
                      marginBottom: 10, borderLeft: '3px solid var(--primary)'
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {new Date(c.consultation_date).toLocaleDateString('en-IN')} · {c.consultation_type}
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.chief_complaint}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.diagnosis_note}</div>
                      {c.followup_date && (
                        <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6 }}>
                          📅 Follow-up: {new Date(c.followup_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Past Prescriptions */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💊 Prescription History</h3>
                {data?.prescriptions?.length === 0 ? (
                  <div className="empty-state"><p>No prescriptions yet</p></div>
                ) : (
                  data.prescriptions.map((p, i) => (
                    <div key={i} style={{
                      padding: 14, borderRadius: 8, background: 'var(--bg)',
                      marginBottom: 10
                    }}>
                      <div style={{ fontWeight: 600 }}>{p.medicine_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {p.dosage} · {p.frequency} · {p.duration_days} days
                      </div>
                      {p.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{p.notes}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(p.generated_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;