const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const apiOrigin = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const fetchJSON = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.message || body?.error || `API error: ${res.status}`);
    err.response = { data: body };
    throw err;
  }
  return res.json();
};

// Auth
export const login = (data) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data) => fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(data) });

// Clinics
export const getPublicClinics = () => fetchJSON('/clinics/public');
export const getDoctorClinics = (doctorId) => fetchJSON(`/clinics/doctor/${doctorId}`);
export const getClinicStatus = (clinicId) => fetchJSON(`/clinics/${clinicId}/status`);

// Slots
export const generateSlots = async (data) => {
  const res = await fetchJSON('/slots/generate', { method: 'POST', body: JSON.stringify(data) });
  return { data: res };
};
export const getPublicSlots = (clinicId, date) => fetchJSON(`/slots/public?clinicId=${clinicId}&date=${date}`);



// Appointments — always returns { data: [] }
export const getTodayAppointments = async (clinicId) => {
  const res = await fetchJSON(`/appointments/today?clinicId=${clinicId}`);
  return { data: Array.isArray(res) ? res : res?.data || [] };
};
export const getUpcomingAppointments = async (clinicId) => {
  const res = await fetchJSON(`/appointments/upcoming?clinicId=${clinicId}`);
  return { data: Array.isArray(res) ? res : res?.data || [] };
};

export const bookAppointmentPublic = (data) => fetchJSON('/appointments/book/public', { method: 'POST', body: JSON.stringify(data) });


// Walk-ins — always returns { data: [] }
export const getTodayWalkIns = async (clinicId) => {
  const res = await fetchJSON(`/walkins/today?clinicId=${clinicId}`);
  return { data: Array.isArray(res) ? res : res?.data || [] };
};
export const registerWalkIn = (data) => fetchJSON('/walkins/register', { method: 'POST', body: JSON.stringify(data) });
export const updateWalkInStatus = (id, data) => fetchJSON(`/walkins/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });

export const insertUrgentPatient = (data) => fetchJSON('/walkins/urgent', { method: 'POST', body: JSON.stringify(data) });

// Doctor
export const setDoctorStatus = (data) => fetchJSON('/doctor/status', { method: 'PUT', body: JSON.stringify(data) });

// Patients
export const searchPatient = (query) => fetchJSON(`/patients/search?q=${encodeURIComponent(query)}`);
export const searchPatientPublic = (query) => fetchJSON(`/patients/search/public?q=${encodeURIComponent(query)}`);
export const registerPatient = (data) => fetchJSON('/patients/register/public', { method: 'POST', body: JSON.stringify(data) });

// Consultation & History
export const saveConsultation = (data) => fetchJSON('/consultations', { method: 'POST', body: JSON.stringify(data) });
export const getPatientHistory = (patientId) => fetchJSON(`/consultations/patient/${patientId}`);

// Prescriptions
export const getPatientPrescriptions = (patientId) => fetchJSON(`/prescriptions/patient/${patientId}`);

// OTP
export const sendPatientOtp = (phone) => fetchJSON('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
export const verifyPatientOtp = (phone, otp) => fetchJSON('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) });

// AI
export const aiAutofillPrescription = (data) => fetchJSON('/prescriptions/ai-autofill', { method: 'POST', body: JSON.stringify(data) });

// Symptoms
export const getSymptomRecommendation = (data) => fetchJSON('/symptoms/recommend', { method: 'POST', body: JSON.stringify(data) });

// Inventory
export const getInventory = () => fetchJSON('/inventory');
export const getLowStock = () => fetchJSON('/inventory/low-stock');
export const addInventoryItem = (data) => fetchJSON('/inventory', { method: 'POST', body: JSON.stringify(data) });
export const updateStock = (id, data) => fetchJSON(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Staff
export const getAllStaff = () => fetchJSON('/staff');
export const addStaff = (data) => fetchJSON('/staff', { method: 'POST', body: JSON.stringify(data) });

// Prescription
export const createDraftPrescription = (data) => fetchJSON('/prescriptions/draft', { method: 'POST', body: JSON.stringify(data) });
export const updateDraftPrescription = (id, data) => fetchJSON(`/prescriptions/${id}/draft`, { method: 'PUT', body: JSON.stringify(data) });

export const getDraftPrescriptionByConsultation = (consultationId) => fetchJSON(`/prescriptions/consultation/${consultationId}/draft`);

export const finalizePrescription = (id, data) => fetchJSON(`/prescriptions/${id}/finalize`, { method: 'POST', body: JSON.stringify(data) });

// Analytics
export const getAnalytics = (clinicId) => fetchJSON(`/analytics?clinicId=${clinicId}`);