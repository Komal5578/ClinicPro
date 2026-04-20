const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./src/routes/auth.routes');
const patientRoutes = require('./src/routes/patient.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'ClinicPro API running' });
});

app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
module.exports = app;