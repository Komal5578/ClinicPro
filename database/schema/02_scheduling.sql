USE clinic_db;

CREATE TABLE Slot (
  slot_id     INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id   INT NOT NULL,
  slot_date   DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_type   ENUM('BOOKED', 'WALKIN', 'BUFFER') NOT NULL,
  status      ENUM('OPEN', 'BOOKED', 'CLOSED') DEFAULT 'OPEN',
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);

CREATE TABLE Appointment (
  appointment_id  INT AUTO_INCREMENT PRIMARY KEY,
  slot_id         INT NOT NULL,
  patient_id      INT NOT NULL,
  doctor_id       INT NOT NULL,
  clinic_id       INT NOT NULL,
  booked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status          ENUM('SCHEDULED','ARRIVED','COMPLETE','CANCELLED','RESCHEDULED') DEFAULT 'SCHEDULED',
  FOREIGN KEY (slot_id) REFERENCES Slot(slot_id),
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);

CREATE TABLE WalkIn (
  walkin_id       INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT NOT NULL,
  doctor_id       INT NOT NULL,
  clinic_id       INT NOT NULL,
  arrived_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  token_number    INT NOT NULL,
  priority        ENUM('REGULAR','PRIORITY','URGENT') DEFAULT 'REGULAR',
  status          ENUM('WAITING','IN_CONSULTATION','DONE') DEFAULT 'WAITING',
  chief_complaint TEXT,
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);