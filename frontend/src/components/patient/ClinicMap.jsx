import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const sectorColors = {
  GENERAL: '#0d9488',
  AYURVEDIC: '#d97706',
  DENTAL: '#7c3aed',
  SKIN: '#db2777',
};

const getColor = (sector) =>
  sectorColors[(sector || 'GENERAL').toUpperCase()] || '#0d9488';

const createClinicMarker = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px;
    background: #ef4444;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(239,68,68,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const routeDestIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 32px; height: 32px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 4px ${color}40;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    ">🏥</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDuration = (seconds) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const ClinicMap = ({ clinics = [], sectorFilter, onClinicSelect, routeTarget, userLocation: externalUserLocation }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(externalUserLocation || { lat: 19.076, lng: 72.8777 });
  const [locationAccuracy, setLocationAccuracy] = useState(externalUserLocation?.accuracy || null);
  const [search, setSearch] = useState('');
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeColor, setRouteColor] = useState('#0d9488');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [selectedClinicCard, setSelectedClinicCard] = useState(null);

  const getFilteredClinics = useMemo(() => {
    const hasSearch = !!(search && search.trim());
    return clinics.filter((clinic) => {
      if (!clinic.latitude || !clinic.longitude) return false;

      const matchesSector = !sectorFilter || sectorFilter === 'ALL'
        || (clinic.sector || '').toUpperCase() === sectorFilter;

      const matchesSearch = !hasSearch
        || clinic.clinic_name?.toLowerCase().includes(search.toLowerCase())
        || clinic.address?.toLowerCase().includes(search.toLowerCase());

      return matchesSector && matchesSearch;
    });
  }, [clinics, sectorFilter, search, userLocation]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!externalUserLocation) {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
            setLocationAccuracy(pos.coords.accuracy);
          }
        },
        () => {
          if (!externalUserLocation) {
            setUserLocation({ lat: 19.076, lng: 72.8777 });
            setLocationAccuracy(null);
          }
        },
      );
    }
  }, [externalUserLocation]);

  useEffect(() => {
    if (externalUserLocation?.accuracy != null) {
      setLocationAccuracy(externalUserLocation.accuracy);
    }
  }, [externalUserLocation]);

  useEffect(() => {
    if (externalUserLocation) {
      setUserLocation(externalUserLocation);
    }
  }, [externalUserLocation]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    const popupText = locationAccuracy != null
      ? `📍 You are here • accuracy ~${Math.round(locationAccuracy)}m`
      : '📍 You are here';

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(popupText);
  }, [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([userLocation.lat, userLocation.lng], 13);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation.lat, userLocation.lng]);

  const drawRoute = async (clinic) => {
    if (!clinic?.latitude || !clinic?.longitude) return;

    setIsLoadingRoute(true);
    setRoutePoints(null);
    setRouteInfo(null);

    const dest = {
      lat: parseFloat(clinic.latitude),
      lng: parseFloat(clinic.longitude),
    };

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const { duration, distance } = data.routes[0];
        setRoutePoints(coords);
        setRouteInfo({
          duration: formatDuration(duration),
          distance: formatDistance(distance),
          clinicName: clinic.clinic_name,
        });
        setRouteColor(getColor(clinic.sector));
        return;
      }
    } catch (_) {
      // fall through to straight line
    }

    setRoutePoints([[userLocation.lat, userLocation.lng], [dest.lat, dest.lng]]);
    setRouteInfo({ duration: '–', distance: '–', clinicName: clinic.clinic_name });
    setRouteColor(getColor(clinic.sector));
    setIsLoadingRoute(false);
  };

  useEffect(() => {
    if (routeTarget?.latitude && routeTarget?.longitude) {
      drawRoute(routeTarget);
    }
  }, [routeTarget, userLocation]);

  const clearRoute = () => {
    setRoutePoints(null);
    setRouteInfo(null);
  };

  const filteredCount = getFilteredClinics.length;

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const bounds = [];

    getFilteredClinics.forEach((clinic) => {
      const lat = parseFloat(clinic.latitude);
      const lng = parseFloat(clinic.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const color = getColor(clinic.sector);
      const isRouteTarget = routeInfo?.clinicName === clinic.clinic_name;
      const marker = L.marker([lat, lng], { icon: isRouteTarget ? routeDestIcon(color) : createClinicMarker(color) }).addTo(map);
      bounds.push([lat, lng]);

      const popupId = `clinic-${clinic.clinic_id}`;
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 210px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};"></div>
            <span style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;">${(clinic.sector || 'General')}</span>
          </div>
          <div style="font-weight:700;font-size:14px;margin-bottom:2px;">${clinic.clinic_name}</div>
          <div style="font-size:12px;color:#555;margin-bottom:2px;">Dr. ${clinic.doctor_name || 'Doctor'}</div>
          ${clinic.specialization ? `<div style="font-size:11px;color:#888;margin-bottom:6px;">${clinic.specialization}</div>` : ''}
          ${clinic.address ? `<div style="font-size:11px;color:#64748b;margin-bottom:6px;">📍 ${clinic.address}</div>` : ''}
          <div style="font-size:11px;color:#444;padding:6px 8px;background:#f8fafc;border-radius:6px;margin-bottom:8px;line-height:1.8;">
            🌅 ${clinic.morning_start?.slice(0, 5) || '09:00'} – ${clinic.morning_end?.slice(0, 5) || '13:00'}<br />
            🌆 ${clinic.evening_start?.slice(0, 5) || '17:00'} – ${clinic.evening_end?.slice(0, 5) || '21:00'}
          </div>
          <div style="display:flex;gap:6px;">
            <button id="route-${popupId}" style="flex:1;padding:7px 0;background:white;border:1.5px solid ${color};border-radius:6px;font-size:12px;font-weight:600;color:${color};cursor:pointer;">🗺️ Route</button>
            <button id="book-${popupId}" style="flex:1;padding:7px 0;background:${color};border:none;border-radius:6px;font-size:12px;font-weight:700;color:white;cursor:pointer;">Book →</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const popup = document.getElementById(`route-${popupId}`);
        const book = document.getElementById(`book-${popupId}`);
        if (popup) popup.onclick = () => drawRoute(clinic);
        // Open the clinic info card instead of navigating directly
        if (book) book.onclick = () => setSelectedClinicCard(clinic);
      });

      marker.on('click', () => {
        // clicking marker opens the clinic card for confirmation before booking
        setSelectedClinicCard(clinic);
      });

      marker.on('popupclose', () => {
        const popup = document.getElementById(`route-${popupId}`);
        const book = document.getElementById(`book-${popupId}`);
        if (popup) popup.onclick = null;
        if (book) book.onclick = null;
      });

      markersRef.current.push(marker);
    });

    if (bounds.length > 0) {
      const boundsObject = L.latLngBounds(bounds);
      map.fitBounds(boundsObject, { padding: [60, 60] });
      if (map.getZoom() > 13) map.setZoom(13);
    }

    if (routePoints?.length >= 2) {
      routeLineRef.current = L.polyline(routePoints, { color: routeColor, weight: 4, opacity: 0.85, dashArray: '8, 4' }).addTo(map);
      L.polyline(routePoints, { color: '#000', weight: 6, opacity: 0.1 }).addTo(map);
      map.fitBounds(L.latLngBounds(routePoints), { padding: [60, 60] });
    }
  }, [getFilteredClinics, routePoints, routeColor, routeInfo, drawRoute, navigate, onClinicSelect]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routePoints?.length >= 2) {
      routeLineRef.current = L.polyline(routePoints, { color: routeColor, weight: 4, opacity: 0.85, dashArray: '8, 4' }).addTo(map);
      L.polyline(routePoints, { color: '#000', weight: 6, opacity: 0.1 }).addTo(map);
      map.fitBounds(L.latLngBounds(routePoints), { padding: [60, 60] });
    }
  }, [routePoints, routeColor]);

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clinics by name or area..."
          style={{
            flex: 1, padding: '10px 14px',
            border: '1.5px solid #e2e8f0', borderRadius: 10,
            fontSize: 13.5, outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {Object.entries(sectorColors).map(([sector, color]) => (
            <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: color, border: '2px solid white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                {sector.charAt(0) + sector.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {sectorFilter && sectorFilter !== 'ALL' && (
        <div style={{
          padding: '8px 14px',
          background: `${getColor(sectorFilter)}18`,
          border: `1px solid ${getColor(sectorFilter)}40`,
          borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          color: getColor(sectorFilter),
        }}>
          Showing {filteredCount} {sectorFilter.toLowerCase()} clinic{filteredCount !== 1 ? 's' : ''}
        </div>
      )}

      {routeInfo && (
        <div style={{
          padding: '10px 14px',
          background: `${routeColor}12`,
          border: `1.5px solid ${routeColor}50`,
          borderRadius: 10, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontWeight: 700, color: routeColor }}>🗺️ Route to {routeInfo.clinicName}</span>
            <span style={{ color: '#475569', marginLeft: 10, fontSize: 12 }}>
              {routeInfo.distance} · ~{routeInfo.duration} by car
            </span>
          </div>
          <button
            onClick={clearRoute}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 700,
              background: 'white', border: `1px solid ${routeColor}60`,
              borderRadius: 6, color: routeColor, cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {userLocation && (
        <div style={{
          padding: '8px 14px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          fontSize: 12.5,
          color: '#1d4ed8',
          fontWeight: 600,
        }}>
          Current location: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
          {locationAccuracy != null ? ` • accuracy ~${Math.round(locationAccuracy)}m` : ''}
        </div>
      )}

      {locationAccuracy != null && locationAccuracy > 1000 && (
        <div style={{
          padding: '8px 14px',
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: 8,
          fontSize: 12.5,
          color: '#92400e',
          fontWeight: 600,
        }}>
          Approximate location detected. Turn on precise device location for better map accuracy.
        </div>
      )}

      {isLoadingRoute && (
        <div style={{
          padding: '8px 14px', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 12.5, color: '#64748b',
        }}>
          ⏳ Calculating route...
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          flex: 1,
          borderRadius: 14,
          overflow: 'hidden',
          minHeight: 400,
          border: '1px solid #e2e8f0',
        }}
      />

      {selectedClinicCard && (
        <div style={{ position: 'absolute', right: 24, top: 120, zIndex: 9999 }}>
          <div style={{ width: 320, borderRadius: 12, background: 'white', boxShadow: '0 8px 30px rgba(2,6,23,0.12)', border: '1px solid #e6eef6', overflow: 'hidden' }}>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{selectedClinicCard.clinic_name}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Dr. {selectedClinicCard.doctor_name || 'Doctor'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  🌅 {selectedClinicCard.morning_start?.slice(0,5) || '09:00'} – {selectedClinicCard.morning_end?.slice(0,5) || '13:00'} · 🌆 {selectedClinicCard.evening_start?.slice(0,5) || '17:00'} – {selectedClinicCard.evening_end?.slice(0,5) || '21:00'}
                </div>
              </div>
              <button onClick={() => setSelectedClinicCard(null)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #f1f7fb', display: 'flex', gap: 8 }}>
              <button onClick={() => { drawRoute(selectedClinicCard); }} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>🗺️ Route</button>
              <button onClick={() => {
                setSelectedClinicCard(null);
                if (onClinicSelect) onClinicSelect(selectedClinicCard);
                else navigate(`/patient/clinic/${selectedClinicCard.clinic_id}`);
              }} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', background: getColor(selectedClinicCard.sector), color: 'white', fontWeight: 800, cursor: 'pointer' }}>Book Appointment →</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, paddingTop: 10, justifyContent: 'center' }}>
        {[
          { label: 'General', color: '#0d9488' },
          { label: 'Ayurvedic', color: '#d97706' },
          { label: 'Dental', color: '#7c3aed' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicMap;