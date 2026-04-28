import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);

// Patients
export const searchPatient = (phone) => api.get(`/patients/search?phone=${phone}`);
export const searchPatientPublic = (phone) => api.get(`/patients/search/public?phone=${phone}`);
export const registerPatient = (data) => api.post('/patients/register', data);

// Doctor
export const getDoctorProfile = () => api.get('/doctors/profile');
export const getTodaySlots = (clinic_id) => api.get(`/doctors/slots/today?clinic_id=${clinic_id}`);
export const generateSlots = (data) => api.post('/doctors/slots/generate', data);
export const setDoctorStatus = (data) => api.post('/doctors/status', data);
export const insertUrgentPatient = (data) => api.post('/doctors/urgent', data);
export const getClinicStatus = (clinic_id) => api.get(`/doctors/clinic-status?clinic_id=${clinic_id}`);

// Appointments
export const getTodayAppointments = (clinic_id) => api.get(`/appointments/today?clinic_id=${clinic_id}`);
export const bookAppointment = (data) => api.post('/appointments/book', data);

// Walk-ins
export const registerWalkIn = (data) => api.post('/walkins/register', data);
export const getTodayWalkIns = (clinic_id) => api.get(`/walkins/today?clinic_id=${clinic_id}`);
export const updateWalkInStatus = (walkin_id, status) => api.patch(`/walkins/${walkin_id}/status`, { status });

// Consultation
export const getPatientHistory = (patient_id) => api.get(`/consultations/history/${patient_id}`);
export const getPatientHistoryPublic = (patient_id) => api.get(`/consultations/history/public/${patient_id}`);
export const saveConsultation = (data) => api.post('/consultations/save', data);

// Prescription
export const generatePrescription = (data) => api.post('/prescriptions/generate', data);
export const getPrescription = (id) => api.get(`/prescriptions/${id}`);

// Inventory
export const getInventory = () => api.get('/inventory');
export const getLowStock = () => api.get('/inventory/low-stock');
export const addInventoryItem = (data) => api.post('/inventory/add', data);
export const updateStock = (item_id, quantity) => api.patch(`/inventory/${item_id}/stock`, { quantity });

// Staff
export const getAllStaff = () => api.get('/staff');
export const addStaff = (data) => api.post('/staff/add', data);

// Clinics (public)
export const getPublicClinics = () => api.get('/clinics/public');
export const getNearbyClinics = (lat, lng, radius = 10) => api.get(`/clinics/public/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);

// GST Verification
export const verifyGst = (gst_number) => api.post('/gst/verify', { gst_number });

// Medicine
export const lookupMedicine = (name) => api.post('/medicine/lookup', { name });

// Chatbot
export const getSymptomRecommendation = (answers) => api.post('/chatbot/symptom', answers);

export default api;