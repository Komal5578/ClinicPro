const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./src/routes/auth.routes');
const patientRoutes = require('./src/routes/patient.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const appointmentRoutes = require('./src/routes/appointment.routes');
const walkinRoutes = require('./src/routes/walkin.routes');
const consultationRoutes = require('./src/routes/consultation.routes');
const prescriptionRoutes = require('./src/routes/prescription.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const staffRoutes = require('./src/routes/staff.routes');
const gstRoutes = require('./src/routes/gst.routes');
const medicalCertificateRoutes = require('./src/routes/medicalCertificate.routes');
const registerRoutes = require('./src/routes/register.routes');
const clinicsRoutes = require('./src/routes/clinics.routes');
const medicineRoutes = require('./src/routes/medicine.routes');
const chatbotRoutes = require('./src/routes/chatbot.routes');
const debugRoutes = require('./src/routes/debug.routes');
const slotsRoutes = require('./src/routes/slots.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/pdfs', express.static(path.join(__dirname, 'generated/pdfs')));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/walkins', walkinRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/medical-certificate', medicalCertificateRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/debug', debugRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'ClinicPro API running' });
});

module.exports = app;