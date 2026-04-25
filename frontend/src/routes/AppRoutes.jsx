import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth
import Login from '../pages/auth/Login';

// Doctor pages
import DoctorQueue from '../pages/doctor/Queue';
import PatientHistory from '../pages/doctor/PatientHistory';
import Consultation from '../pages/doctor/Consultation';
import Prescription from '../pages/doctor/Prescription';
import Analytics from '../pages/doctor/Analytics';
import FollowUp from '../pages/doctor/FollowUp';

// Receptionist pages
import Dashboard from '../pages/receptionist/Dashboard';
import WalkInRegister from '../pages/receptionist/WalkInRegister';
import AppointmentBooking from '../pages/receptionist/AppointmentBooking';
import StaffManager from '../pages/receptionist/StaffManager';
import InventoryManagement from '../pages/receptionist/InventoryManagement';

// Patient page
import PatientPortal from '../pages/patient/PatientPortal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/patient" element={<PatientPortal />} />

      {/* Doctor routes */}
      <Route path="/doctor/queue" element={
        <ProtectedRoute allowedRoles={['doctor']}><DoctorQueue /></ProtectedRoute>
      } />
      <Route path="/doctor/patient/:patient_id" element={
        <ProtectedRoute allowedRoles={['doctor']}><PatientHistory /></ProtectedRoute>
      } />
      <Route path="/doctor/consultation/:patient_id" element={
        <ProtectedRoute allowedRoles={['doctor']}><Consultation /></ProtectedRoute>
      } />
      <Route path="/doctor/prescription/:consultation_id" element={
        <ProtectedRoute allowedRoles={['doctor']}><Prescription /></ProtectedRoute>
      } />
      <Route path="/doctor/analytics" element={
        <ProtectedRoute allowedRoles={['doctor']}><Analytics /></ProtectedRoute>
      } />
      <Route path="/doctor/followup" element={
        <ProtectedRoute allowedRoles={['doctor']}><FollowUp /></ProtectedRoute>
      } />

      {/* Receptionist routes */}
      <Route path="/receptionist/dashboard" element={
        <ProtectedRoute allowedRoles={['receptionist']}><Dashboard /></ProtectedRoute>
      } />
      <Route path="/receptionist/walkin" element={
        <ProtectedRoute allowedRoles={['receptionist']}><WalkInRegister /></ProtectedRoute>
      } />
      <Route path="/receptionist/appointments" element={
        <ProtectedRoute allowedRoles={['receptionist']}><AppointmentBooking /></ProtectedRoute>
      } />
      <Route path="/receptionist/staff" element={
        <ProtectedRoute allowedRoles={['receptionist']}><StaffManager /></ProtectedRoute>
      } />
      <Route path="/receptionist/inventory" element={
        <ProtectedRoute allowedRoles={['receptionist']}><InventoryManagement /></ProtectedRoute>
      } />

      {/* Default redirect based on role */}
      <Route path="/" element={
        user?.role === 'doctor'
          ? <Navigate to="/doctor/queue" replace />
          : user?.role === 'receptionist'
          ? <Navigate to="/receptionist/dashboard" replace />
          : <Navigate to="/login" replace />
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;