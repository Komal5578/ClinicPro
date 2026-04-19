USE clinic_db;

CREATE TABLE Consultation (
  consultation_id       INT AUTO_INCREMENT PRIMARY KEY,
  patient_id            INT NOT NULL,
  doctor_id             INT NOT NULL,
  clinic_id             INT NOT NULL,
  appointment_id        INT,
  walkin_id             INT,
  consultation_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chief_complaint       TEXT,
  diagnosis_note        TEXT,
  followup_date         DATE,
  followup_instructions TEXT,
  consultation_type     ENUM('BOOKED','WALKIN') NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id),
  FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id),
  FOREIGN KEY (walkin_id) REFERENCES WalkIn(walkin_id)
);

CREATE TABLE Prescription (
  prescription_id   INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id   INT NOT NULL,
  doctor_id         INT NOT NULL,
  patient_id        INT NOT NULL,
  generated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path          VARCHAR(255),
  qr_code_token     VARCHAR(255),
  FOREIGN KEY (consultation_id) REFERENCES Consultation(consultation_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
);

CREATE TABLE PrescriptionItem (
  item_id           INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id   INT NOT NULL,
  medicine_name     VARCHAR(100) NOT NULL,
  dosage            VARCHAR(50),
  frequency         VARCHAR(50),
  duration_days     INT,
  notes             TEXT,
  FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id)
);

CREATE TABLE PatientConditions (
  condition_id      INT AUTO_INCREMENT PRIMARY KEY,
  patient_id        INT NOT NULL,
  condition_type    ENUM('ALLERGY','CHRONIC') NOT NULL,
  description       TEXT,
  added_by          INT,
  added_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
  FOREIGN KEY (added_by) REFERENCES Doctor(doctor_id)
);

CREATE TABLE Reminder (
  reminder_id       INT AUTO_INCREMENT PRIMARY KEY,
  patient_id        INT NOT NULL,
  consultation_id   INT,
  appointment_id    INT,
  reminder_type     ENUM('APPOINTMENT','FOLLOWUP','MEDICINE') NOT NULL,
  message_txt       TEXT,
  scheduled_for     DATETIME NOT NULL,
  sent              BOOLEAN DEFAULT FALSE,
  sent_at           TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
  FOREIGN KEY (consultation_id) REFERENCES Consultation(consultation_id),
  FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id)
);