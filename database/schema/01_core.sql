CREATE DATABASE IF NOT EXISTS clinic_db;
USE clinic_db;

CREATE TABLE Patient (
  patient_id    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  age           INT,
  phone         VARCHAR(15) UNIQUE NOT NULL,
  email         VARCHAR(100),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE Doctor (
  doctor_id             INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  specialization        VARCHAR(100),
  registration_no       VARCHAR(50),
  phone                 VARCHAR(15),
  email                 VARCHAR(100) UNIQUE NOT NULL,
  digital_signature_path VARCHAR(255),
  password_hash         VARCHAR(255) NOT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Clinic (
  clinic_id         INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id         INT,
  clinic_name       VARCHAR(100) NOT NULL,
  address           TEXT,
  morning_start     TIME,
  morning_end       TIME,
  evening_start     TIME,
  evening_end       TIME,
  booked_slot_duration  INT DEFAULT 20,
  buffer_duration   INT DEFAULT 15,
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
);

CREATE TABLE DoctorClinic (
  doctor_id   INT NOT NULL,
  clinic_id   INT NOT NULL,
  PRIMARY KEY (doctor_id, clinic_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);
