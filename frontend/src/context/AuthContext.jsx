import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [doctorClinics, setDoctorClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on app start
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      const savedSelectedClinicId = localStorage.getItem('selected_clinic_id');
      if (savedSelectedClinicId) {
        setSelectedClinicId(Number(savedSelectedClinicId));
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    if (userData?.clinic_id) {
      setSelectedClinicId(userData.clinic_id);
      localStorage.setItem('selected_clinic_id', String(userData.clinic_id));
    }
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSelectedClinicId(null);
    setDoctorClinics([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selected_clinic_id');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      loginUser,
      logout,
      selectedClinicId,
      setSelectedClinicId,
      doctorClinics,
      setDoctorClinics,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);