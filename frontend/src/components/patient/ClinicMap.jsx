import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ─── COLORS ───────────────────────────────────────────────────────────────────
const sectorColors = {
  GENERAL: "#0d9488",
  AYURVEDIC: "#d97706",
  DENTAL: "#7c3aed",
  SKIN: "#db2777",
};

const getColor = (sector) =>
  sectorColors[(sector || "GENERAL").toUpperCase()] || "#0d9488";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const createClinicMarker = (color) =>
  L.divIcon({
    className: "",
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
  className: "",
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
    className: "",
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

// ─── RECENTER MAP ─────────────────────────────────────────────────────────────
const RecenterMap = ({ lat, lng, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);
  return null;
};

// ─── FIT BOUNDS FOR ROUTE ─────────────────────────────────────────────────────
const FitRoute = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points?.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [points]);
  return null;
};

// ─── OSRM ROUTE FETCH ─────────────────────────────────────────────────────────
const fetchRoute = async (from, to) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (_) {}
  // Fallback: straight line
  return [[from.lat, from.lng], [to.lat, to.lng]];
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
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ClinicMap = ({ clinics = [], sectorFilter, onClinicSelect, routeTarget }) => {
  const [userLocation, setUserLocation] = useState({ lat: 19.076, lng: 72.8777 });
  const [search, setSearch] = useState("");
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // { duration, distance, clinicName }
  const [routeColor, setRouteColor] = useState("#0d9488");
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef(null);

  // Get user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 19.076, lng: 72.8777 })
      );
    }
  }, []);

  // Draw route when routeTarget prop changes (passed from chatbot)
  useEffect(() => {
    if (routeTarget && routeTarget.latitude && routeTarget.longitude) {
      drawRoute(routeTarget);
    }
  }, [routeTarget]);

  const drawRoute = async (clinic) => {
    if (!clinic.latitude || !clinic.longitude) return;
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
      }
    } catch (_) {
      // Fallback straight line
      setRoutePoints([[userLocation.lat, userLocation.lng], [dest.lat, dest.lng]]);
      setRouteInfo({ duration: '–', distance: '–', clinicName: clinic.clinic_name });
      setRouteColor(getColor(clinic.sector));
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    setRoutePoints(null);
    setRouteInfo(null);
  };

  // Filter clinics
  const RADIUS_KM = 10; // show clinics within 10km

const filteredClinics = clinics.filter((c) => {
  if (!c.latitude || !c.longitude) return false;

  const dist = getDistance(
    userLocation.lat, userLocation.lng,
    parseFloat(c.latitude), parseFloat(c.longitude)
  );

  const withinRadius = dist <= RADIUS_KM;
  const matchesSector = !sectorFilter || sectorFilter === "ALL" || (c.sector || "").toUpperCase() === sectorFilter;
  const matchesSearch = !search ||
    c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase());

  return withinRadius && matchesSector && matchesSearch;
});

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Search + Legend */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clinics by name or area..."
          style={{
            flex: 1, padding: "10px 14px",
            border: "1.5px solid #e2e8f0", borderRadius: 10,
            fontSize: 13.5, outline: "none",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {Object.entries(sectorColors).map(([sector, color]) => (
            <div key={sector} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color, border: "2px solid white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                {sector.charAt(0) + sector.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter banner */}
      {sectorFilter && sectorFilter !== "ALL" && (
        <div style={{
          padding: "8px 14px",
          background: `${getColor(sectorFilter)}18`,
          border: `1px solid ${getColor(sectorFilter)}40`,
          borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          color: getColor(sectorFilter),
        }}>
          Showing {filteredClinics.length}{" "}
          {sectorFilter.toLowerCase()} clinic{filteredClinics.length !== 1 ? "s" : ""} near you
        </div>
      )}

      {/* Route info banner */}
      {routeInfo && (
        <div style={{
          padding: "10px 14px",
          background: `${routeColor}12`,
          border: `1.5px solid ${routeColor}50`,
          borderRadius: 10, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <span style={{ fontWeight: 700, color: routeColor }}>🗺️ Route to {routeInfo.clinicName}</span>
            <span style={{ color: "#475569", marginLeft: 10, fontSize: 12 }}>
              {routeInfo.distance} &nbsp;·&nbsp; ~{routeInfo.duration} by car
            </span>
          </div>
          <button
            onClick={clearRoute}
            style={{
              padding: "4px 10px", fontSize: 11, fontWeight: 700,
              background: "white", border: `1px solid ${routeColor}60`,
              borderRadius: 6, color: routeColor, cursor: "pointer",
            }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {isLoadingRoute && (
        <div style={{
          padding: "8px 14px", background: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: 8,
          fontSize: 12.5, color: "#64748b",
        }}>
          ⏳ Calculating route...
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        style={{
          flex: 1, borderRadius: 14,
          overflow: "hidden", minHeight: 400,
          border: "1px solid #e2e8f0",
        }}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />

        {/* Route polyline */}
        {routePoints && (
          <>
            <FitRoute points={routePoints} />
            {/* Shadow */}
            <Polyline
              positions={routePoints}
              pathOptions={{ color: "#000", weight: 6, opacity: 0.1 }}
            />
            {/* Main route */}
            <Polyline
              positions={routePoints}
              pathOptions={{ color: routeColor, weight: 4, opacity: 0.85, dashArray: "8, 4" }}
            />
          </>
        )}

        {/* User marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>📍 You are here</Popup>
        </Marker>

        {/* Clinic markers */}
        {filteredClinics.map((clinic) => {
          if (!clinic.latitude || !clinic.longitude) return null;
          const color = getColor(clinic.sector);
          const isRouteTarget =
            routeInfo?.clinicName === clinic.clinic_name;

          return (
            <Marker
              key={clinic.clinic_id}
              position={[parseFloat(clinic.latitude), parseFloat(clinic.longitude)]}
              icon={isRouteTarget ? routeDestIcon(color) : createClinicMarker(color)}
              eventHandlers={{
                click: () => onClinicSelect && onClinicSelect(clinic),
              }}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: 210 }}>
                  {/* Sector badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" }}>
                      {clinic.sector || "General"}
                    </span>
                  </div>

                  {/* Name & doctor */}
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                    {clinic.clinic_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                    Dr. {clinic.doctor_name || "Doctor"}
                  </div>
                  {clinic.specialization && (
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                      {clinic.specialization}
                    </div>
                  )}

                  {/* Address */}
                  {clinic.address && (
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                      📍 {clinic.address}
                    </div>
                  )}

                  {/* Timings */}
                  <div style={{
                    fontSize: 11, color: "#444", padding: "6px 8px",
                    background: "#f8fafc", borderRadius: 6, marginBottom: 8,
                    lineHeight: 1.8,
                  }}>
                    🌅 {clinic.morning_start?.slice(0, 5) || "09:00"} – {clinic.morning_end?.slice(0, 5) || "13:00"}
                    <br />
                    🌆 {clinic.evening_start?.slice(0, 5) || "17:00"} – {clinic.evening_end?.slice(0, 5) || "21:00"}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => drawRoute(clinic)}
                      style={{
                        flex: 1, padding: "7px 0",
                        background: "white", border: `1.5px solid ${color}`,
                        borderRadius: 6, fontSize: 12, fontWeight: 600,
                        color, cursor: "pointer",
                      }}
                    >
                      🗺️ Route
                    </button>
                    <button
                      onClick={() => onClinicSelect && onClinicSelect(clinic)}
                      style={{
                        flex: 1, padding: "7px 0",
                        background: color, border: "none",
                        borderRadius: 6, fontSize: 12, fontWeight: 700,
                        color: "white", cursor: "pointer",
                      }}
                    >
                      Book →
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ClinicMap;