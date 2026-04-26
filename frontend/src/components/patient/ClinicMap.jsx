import { useState, useEffect, useRef } from 'react';

const ClinicMap = ({ clinics, sectorFilter, onClinicSelect }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapError, setMapError] = useState('');
  const [search, setSearch] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey.trim());

  // Filter clinics by sector
  const filteredClinics = clinics.filter(c =>
    !sectorFilter || sectorFilter === 'ALL' || (c.sector || '').toUpperCase() === sectorFilter
  );

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 19.076, lng: 72.8777 }) // Default: Mumbai
      );
    } else {
      setUserLocation({ lat: 19.076, lng: 72.8777 });
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!hasApiKey || !userLocation) return;
    if (window.google?.maps) {
      initMap();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setMapError('Failed to load Google Maps');
    document.head.appendChild(script);
  }, [hasApiKey, userLocation]);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;
    const m = new window.google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 13,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
      mapTypeControl: false,
      fullscreenControl: false,
    });
    setMap(m);
    setInfoWindow(new window.google.maps.InfoWindow());
  };

  // Update markers when clinics or filter changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear old markers
    markers.forEach(m => m.setMap(null));

    const sectorColors = {
      GENERAL: '#0d9488',
      AYURVEDIC: '#d97706',
      DENTAL: '#7c3aed',
    };

    const newMarkers = filteredClinics
      .filter(c => c.latitude && c.longitude)
      .map(clinic => {
        const color = sectorColors[(clinic.sector || 'GENERAL').toUpperCase()] || '#0d9488';
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(clinic.latitude), lng: parseFloat(clinic.longitude) },
          map,
          title: clinic.clinic_name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; min-width: 200px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${clinic.clinic_name}</div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${clinic.doctor_name || 'Doctor'}</div>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; background: ${color}20; color: ${color};">
                ${(clinic.sector || 'General').toUpperCase()}
              </span>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                 ${clinic.morning_start?.slice(0, 5) || '09:00'} - ${clinic.morning_end?.slice(0, 5) || '13:00'} / ${clinic.evening_start?.slice(0, 5) || '17:00'} - ${clinic.evening_end?.slice(0, 5) || '21:00'}
              </div>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds if multiple clinics
    if (newMarkers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(m => bounds.extend(m.getPosition()));
      map.fitBounds(bounds);
    }
  }, [map, filteredClinics, sectorFilter]);

  // Fallback: no API key — show clinic list
  if (!hasApiKey) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 8, padding: '0 0 14px',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder=" Search clinics by name or area..."
            style={{
              flex: 1, padding: '10px 14px',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13.5, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
        </div>

        {/* Map placeholder */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa, #e0f2fe)',
          borderRadius: 14, padding: 32, textAlign: 'center',
          border: '1px solid #e2e8f0', marginBottom: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}></div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#334155', marginBottom: 4 }}>
            Map View Requires API Key
          </div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Add <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
              VITE_GOOGLE_MAPS_API_KEY
            </code> to your <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
              frontend/.env
            </code> file
          </div>
        </div>

        {/* Clinic list fallback */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredClinics
            .filter(c => !search || c.clinic_name?.toLowerCase().includes(search.toLowerCase()) || c.address?.toLowerCase().includes(search.toLowerCase()))
            .map(clinic => {
              const sectorColors = { GENERAL: '#0d9488', AYURVEDIC: '#d97706', DENTAL: '#7c3aed' };
              const color = sectorColors[(clinic.sector || 'GENERAL').toUpperCase()] || '#0d9488';
              return (
                <div key={clinic.clinic_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #f1f5f9', marginBottom: 8,
                  background: 'white', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 2px 12px ${color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${color}15`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, flexShrink: 0,
                  }}>
                    {clinic.sector === 'DENTAL' ? '' : clinic.sector === 'AYURVEDIC' ? '' : '🩺'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{clinic.clinic_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {clinic.doctor_name || 'Doctor'} · {(clinic.sector || 'General')}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                       {clinic.morning_start?.slice(0, 5) || '09:00'}-{clinic.morning_end?.slice(0, 5) || '13:00'} / {clinic.evening_start?.slice(0, 5) || '17:00'}-{clinic.evening_end?.slice(0, 5) || '21:00'}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6,
                    background: `${color}12`, color: color,
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {(clinic.sector || 'GENERAL').toUpperCase()}
                  </span>
                </div>
              );
            })}
          {filteredClinics.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
              No clinics found for this sector
            </div>
          )}
        </div>
      </div>
    );
  }

  // Google Maps view
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: '0 0 14px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder=" Search by area or pincode..."
          style={{
            flex: 1, padding: '10px 14px',
            border: '1.5px solid #e2e8f0', borderRadius: 10,
            fontSize: 13.5, outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
      </div>
      {mapError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
          {mapError}
        </div>
      )}
      <div
        ref={mapRef}
        style={{ flex: 1, borderRadius: 14, overflow: 'hidden', minHeight: 400, border: '1px solid #e2e8f0' }}
      />
    </div>
  );
};

export default ClinicMap;
