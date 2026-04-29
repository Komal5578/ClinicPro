-- Supabase PostgreSQL Schema Migration
-- This file converts the MySQL schema to PostgreSQL format

-- Create ENUM types for Clinic sector
CREATE TYPE clinic_sector AS ENUM('GENERAL', 'AYURVEDIC', 'DENTAL');

-- Create ENUM types for Doctor registration type
CREATE TYPE registration_type AS ENUM('MCI', 'CCIM', 'DCI');

-- Create ENUM types for Slot and Appointment statuses
CREATE TYPE slot_type AS ENUM('BOOKED', 'WALKIN', 'BUFFER');
CREATE TYPE slot_status AS ENUM('OPEN', 'BOOKED', 'CLOSED');
CREATE TYPE appointment_status AS ENUM('SCHEDULED', 'ARRIVED', 'COMPLETE', 'CANCELLED', 'RESCHEDULED');

-- Create ENUM types for WalkIn
CREATE TYPE walkin_priority AS ENUM('REGULAR', 'PRIORITY', 'URGENT');
CREATE TYPE walkin_status AS ENUM('WAITING', 'IN_CONSULTATION', 'DONE');

-- Create ENUM types for Consultation
CREATE TYPE consultation_type AS ENUM('BOOKED', 'WALKIN');

-- Create ENUM types for Staff
CREATE TYPE staff_role AS ENUM('ADMIN', 'RECEPTIONIST');
CREATE TYPE approval_status AS ENUM('PENDING', 'APPROVED', 'REJECTED');

-- Create ENUM types for Condition and PatientConditions
CREATE TYPE condition_type AS ENUM('ALLERGY', 'CHRONIC');

-- Create ENUM types for Reminder
CREATE TYPE reminder_type AS ENUM('APPOINTMENT', 'FOLLOWUP', 'MEDICINE');

-- Create ENUM types for Inventory
CREATE TYPE inventory_category_type AS ENUM('Medicine', 'Consumable', 'Equipment', 'Lab_supply');
CREATE TYPE inventory_alert_type AS ENUM('LOWSTOCK', 'EMPTY', 'SOON');
CREATE TYPE inventory_unit AS ENUM('strip', 'units', 'pieces');

-- Create Patient table
CREATE TABLE patient (
  patient_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create Doctor table
CREATE TABLE doctor (
  doctor_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  registration_no VARCHAR(50),
  phone VARCHAR(15),
  email VARCHAR(100) UNIQUE NOT NULL,
  digital_signature_path VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  sector clinic_sector DEFAULT 'GENERAL',
  registration_type registration_type,
  certificate_url VARCHAR(500),
  nmc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Clinic table
CREATE TABLE clinic (
  clinic_id BIGSERIAL PRIMARY KEY,
  doctor_id BIGINT,
  clinic_name VARCHAR(100) NOT NULL,
  address TEXT,
  gst_number VARCHAR(15) UNIQUE,
  sector clinic_sector DEFAULT 'GENERAL',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  morning_start TIME,
  morning_end TIME,
  evening_start TIME,
  evening_end TIME,
  booked_slot_duration INTEGER DEFAULT 20,
  buffer_duration INTEGER DEFAULT 15,
  is_delayed BOOLEAN DEFAULT FALSE,
  delay_minutes INTEGER DEFAULT 0,
  delay_message VARCHAR(255),
  delay_announced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE SET NULL
);

-- Create DoctorClinic junction table
CREATE TABLE doctor_clinic (
  doctor_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  PRIMARY KEY (doctor_id, clinic_id),
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create Staff table
CREATE TABLE staff (
  staff_id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100),
  role staff_role NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  approval_status approval_status DEFAULT 'APPROVED',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create Slot table
CREATE TABLE slot (
  slot_id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  slot_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_type slot_type NOT NULL,
  status slot_status DEFAULT 'OPEN',
  token_number INTEGER NOT NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create ClinicDailyAvailability table
CREATE TABLE clinic_daily_availability (
  availability_id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  available_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinic_id, available_date),
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create Appointment table
CREATE TABLE appointment (
  appointment_id BIGSERIAL PRIMARY KEY,
  slot_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  booked_at TIMESTAMP DEFAULT NOW(),
  status appointment_status DEFAULT 'SCHEDULED',
  FOREIGN KEY (slot_id) REFERENCES slot(slot_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create WalkIn table
CREATE TABLE walk_in (
  walkin_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  arrived_at TIMESTAMP DEFAULT NOW(),
  token_number INTEGER NOT NULL,
  priority walkin_priority DEFAULT 'REGULAR',
  status walkin_status DEFAULT 'WAITING',
  chief_complaint TEXT,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create Consultation table
CREATE TABLE consultation (
  consultation_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  appointment_id BIGINT,
  walkin_id BIGINT,
  consultation_date TIMESTAMP DEFAULT NOW(),
  chief_complaint TEXT,
  diagnosis_note TEXT,
  followup_date DATE,
  followup_instructions TEXT,
  consultation_type consultation_type NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE SET NULL,
  FOREIGN KEY (walkin_id) REFERENCES walk_in(walkin_id) ON DELETE SET NULL
);

-- Create Prescription table
CREATE TABLE prescription (
  prescription_id BIGSERIAL PRIMARY KEY,
  consultation_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  pdf_path VARCHAR(255),
  qr_code_token VARCHAR(255),
  FOREIGN KEY (consultation_id) REFERENCES consultation(consultation_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE
);

-- Create PrescriptionItem table
CREATE TABLE prescription_item (
  item_id BIGSERIAL PRIMARY KEY,
  prescription_id BIGINT NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50),
  frequency VARCHAR(50),
  duration_days INTEGER,
  notes TEXT,
  FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id) ON DELETE CASCADE
);

-- Create PatientConditions table
CREATE TABLE patient_conditions (
  condition_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  condition_type condition_type NOT NULL,
  description TEXT,
  added_by BIGINT,
  added_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES doctor(doctor_id) ON DELETE SET NULL
);

-- Create Reminder table
CREATE TABLE reminder (
  reminder_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  consultation_id BIGINT,
  appointment_id BIGINT,
  reminder_type reminder_type NOT NULL,
  message_txt TEXT,
  scheduled_for TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (consultation_id) REFERENCES consultation(consultation_id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE SET NULL
);

-- Create InventoryCategory table
CREATE TABLE inventory_category (
  category_id BIGSERIAL PRIMARY KEY,
  category_name inventory_category_type NOT NULL
);

-- Create InventoryItem table
CREATE TABLE inventory_item (
  item_id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 0,
  threshold_quantity INTEGER DEFAULT 0,
  expiry_date DATE,
  unit inventory_unit NOT NULL,
  last_updated_at TIMESTAMP DEFAULT NOW(),
  last_updated_by BIGINT,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES inventory_category(category_id),
  FOREIGN KEY (last_updated_by) REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- Create InventoryAlert table
CREATE TABLE inventory_alert (
  alert_id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  alert_type inventory_alert_type NOT NULL,
  triggered_at TIMESTAMP DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_item(item_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create ReorderSuggestion table
CREATE TABLE reorder_suggestion (
  suggestion_id BIGSERIAL PRIMARY KEY,
  alert_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  ordered_quantity INTEGER,
  ordered_by BIGINT,
  ordered_at TIMESTAMP DEFAULT NOW(),
  received BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES inventory_alert(alert_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_item(item_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create StockOrder table
CREATE TABLE stock_order (
  order_id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  ordered_quantity INTEGER NOT NULL,
  ordered_by BIGINT,
  ordered_at TIMESTAMP DEFAULT NOW(),
  received BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_item(item_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

-- Create OTP verification table
CREATE TABLE otp_verification (
  otp_id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_otp_phone_created (phone, created_at)
);

-- Create indexes for performance
CREATE INDEX idx_patient_phone ON patient(phone);
CREATE INDEX idx_doctor_email ON doctor(email);
CREATE INDEX idx_clinic_doctor ON clinic(doctor_id);
CREATE INDEX idx_slot_clinic_date ON slot(clinic_id, slot_date);
CREATE INDEX idx_appointment_clinic_date ON appointment(clinic_id, booked_at);
CREATE INDEX idx_appointment_patient ON appointment(patient_id);
CREATE INDEX idx_appointment_status ON appointment(status);
CREATE INDEX idx_walkin_clinic_date ON walk_in(clinic_id, arrived_at);
CREATE INDEX idx_consultation_patient ON consultation(patient_id);
CREATE INDEX idx_prescription_consultation ON prescription(consultation_id);
CREATE INDEX idx_reminder_patient ON reminder(patient_id);
CREATE INDEX idx_reminder_scheduled ON reminder(scheduled_for, sent);
CREATE INDEX idx_inventory_clinic ON inventory_item(clinic_id);
CREATE INDEX idx_inventory_alert_clinic ON inventory_alert(clinic_id);
CREATE INDEX idx_staff_clinic ON staff(clinic_id);
