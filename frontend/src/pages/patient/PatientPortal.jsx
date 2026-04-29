import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicMap from '../../components/patient/ClinicMap';
import SymptomChatbot from '../../components/patient/SymptomChatbot';
import MedicineCheck from '../../components/patient/MedicineCheck';
import PrescriptionDrawer from '../../components/patient/PrescriptionDrawer';
import { getPublicClinics } from '../../services/api';


const PatientPortal = () => {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [showMedicineCheck, setShowMedicineCheck] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [routeTarget, setRouteTarget] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location...');

  useEffect(() => {
    fetchClinics();

    if (!navigator.geolocation) {
      setLocationStatus('Location access is not available, showing all clinics.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng, accuracy: position.coords.accuracy });
          setLocationStatus('Showing all clinics from the database on the map.');

        try {
          // Do not replace the full clinics list with nearby-only results.
          // We keep the master list from fetchClinics() so search can match across all clinics.
          await fetchClinics();
        } catch (err) {
          console.error('Failed to refresh clinics:', err);
        }
      },
      async () => {
        setLocationStatus('Location permission was denied, but all clinics are still shown from the database.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const fetchClinics = async () => {
    try {
      const res = await getPublicClinics();
      setClinics(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
      setClinics([]);
    }
  };

  const handleChatbotRecommend = (sector) => {
    if (sector) {
      setSectorFilter(sector);
    }
  };

  const filters = [
    { id: 'ALL', label: 'All', icon: '' },
    { id: 'GENERAL', label: 'General', icon: '🩺' },
    { id: 'AYURVEDIC', label: 'Ayurvedic', icon: '' },
    { id: 'DENTAL', label: 'Dental', icon: '' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafb',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ─── TOP BAR ─── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 900,
          }}>+</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Clinic<span style={{ color: '#0d9488' }}>Pro</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowPrescriptions(true)}
            style={{
              padding: '8px 16px', borderRadius: 9,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
             My Prescriptions
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px', borderRadius: 9,
              background: 'white', color: '#64748b',
              border: '1px solid #e2e8f0',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← Home
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 0, minHeight: 'calc(100vh - 62px)',
      }}>
        {/* LEFT: Map */}
        <div style={{ padding: '20px 20px 20px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            fontSize: 12.5,
            fontWeight: 600,
          }}>
            {locationStatus}
          </div>

          {/* Sector filter pills */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
          }}>
            {filters.map(f => {
              const isActive = sectorFilter === f.id;
              const colors = { ALL: '#0d9488', GENERAL: '#0d9488', AYURVEDIC: '#d97706', DENTAL: '#7c3aed' };
              const color = colors[f.id];
              return (
                <button
                  key={f.id}
                  onClick={() => setSectorFilter(f.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 20,
                    border: `1.5px solid ${isActive ? color : '#e2e8f0'}`,
                    background: isActive ? `${color}10` : 'white',
                    color: isActive ? color : '#64748b',
                    fontSize: 12.5, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {f.icon} {f.label}
                </button>
              );
            })}
            <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>
              {(Array.isArray(clinics) ? clinics : []).filter(c => sectorFilter === 'ALL' || (c.sector || '').toUpperCase() === sectorFilter).length} clinics
            </span>
          </div>

          {/* Map component */}
          <div style={{ flex: 1, minHeight: 400 }}>
            <ClinicMap
              clinics={clinics}
              sectorFilter={sectorFilter}
              routeTarget={routeTarget}
              userLocation={userLocation}
              onClinicSelect={(clinic) => navigate(`/patient/clinic/${clinic.clinic_id}`)}
            />

            
          </div>
        </div>

        {/* RIGHT: Chatbot + Medicine Check */}
        <div style={{
          padding: '20px 28px 20px 0',
          display: 'flex', flexDirection: 'column',
          gap: 12,
          borderLeft: '1px solid #f1f5f9',
        }}>
          {/* Chatbot */}
          <div style={{ flex: 1, minHeight: 300 }}>
            <SymptomChatbot
              clinics={clinics}
              onRecommend={handleChatbotRecommend}
              onRouteRequest={(clinic) => setRouteTarget(clinic)}
              onClinicSelect={(clinic) => navigate(`/patient/clinic/${clinic.clinic_id}`)}
            />
          </div>

          {/* Medicine Check button */}
          <button
            onClick={() => setShowMedicineCheck(true)}
            style={{
              padding: '14px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
              border: '1px solid #a7f3d0',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'all 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'white', border: '1px solid #d1fae5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Check Your Medicine</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Look up medicine info or scan a strip</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#0d9488', fontSize: 18 }}>→</span>
          </button>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {showMedicineCheck && (
        <MedicineCheck onClose={() => setShowMedicineCheck(false)} />
      )}

      {showPrescriptions && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              zIndex: 1400, backdropFilter: 'blur(2px)',
            }}
            onClick={() => setShowPrescriptions(false)}
          />
          <PrescriptionDrawer onClose={() => setShowPrescriptions(false)} />
        </>
      )}

      {/* ─── RESPONSIVE ─── */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.5fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientPortal;