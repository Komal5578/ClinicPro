USE clinic_db;

-- Doctor
INSERT INTO Doctor (name, specialization, registration_no, phone, email, digital_signature_path, password_hash)
VALUES ('Dr. Rahul Sharma', 'General Physician', 'MH12345', '9876543210', 'rahul@clinic.com', '/signatures/rahul.png', '$2b$10$hashedpassword');

-- Clinic
INSERT INTO Clinic (doctor_id, clinic_name, address, morning_start, morning_end, evening_start, evening_end, booked_slot_duration, buffer_duration)
VALUES (1, 'Sharma Clinic', 'Andheri West, Mumbai', '09:00:00', '13:00:00', '17:00:00', '21:00:00', 20, 15);

-- DoctorClinic mapping
INSERT INTO DoctorClinic (doctor_id, clinic_id)
VALUES (1, 1);

-- Staff (receptionists)
INSERT INTO Staff (clinic_id, name, phone, email, role, password_hash)
VALUES (1, 'Priya Sharma', '9876500001', 'priya@clinic.com', 'RECEPTIONIST', '123456');

INSERT INTO Staff (clinic_id, name, phone, email, role, password_hash)
VALUES (1, 'Anjali Verma', '9876512345', 'anjali@clinic.com', 'RECEPTIONIST', '123456');

-- Patients
INSERT INTO Patient (name, age, phone, email)
VALUES 
('Amit Shah', 35, '9000000001', 'amit@gmail.com'),
('Sunita Mehta', 52, '9000000002', 'sunita@gmail.com'),
('Ravi Kumar', 28, '9000000003', 'ravi@gmail.com');

-- Inventory Categories
INSERT INTO InventoryCategory (category_name)
VALUES ('Medicine'), ('Consumable'), ('Equipment'), ('Lab_supply');

-- Inventory Items
INSERT INTO InventoryItem (clinic_id, category_id, item_name, quantity, threshold_quantity, unit, last_updated_by)
VALUES
(1, 1, 'Paracetamol', 100, 20, 'strip', 1),
(1, 1, 'Amoxicillin', 50, 10, 'strip', 1),
(1, 2, 'Gloves', 200, 50, 'pieces', 1),
(1, 2, 'Syringes', 150, 30, 'pieces', 1);

-- Slots
INSERT INTO Slot (clinic_id, slot_date, slot_start_time, slot_type, status)
VALUES
(1, CURDATE(), '09:00:00', 'BOOKED', 'OPEN'),
(1, CURDATE(), '09:20:00', 'BOOKED', 'OPEN'),
(1, CURDATE(), '09:40:00', 'BOOKED', 'OPEN'),
(1, CURDATE(), '10:00:00', 'WALKIN', 'OPEN');

-- Book an appointment using stored procedure
CALL book_appointment(1, 1, 1, 1, @appt_id, @msg);
SELECT @appt_id, @msg;

-- WalkIn
INSERT INTO WalkIn (patient_id, doctor_id, clinic_id, token_number, priority, status, chief_complaint)
VALUES (2, 1, 1, 1, 'REGULAR', 'WAITING', 'Fever and cold');

-- Consultation
INSERT INTO Consultation (patient_id, doctor_id, clinic_id, appointment_id, chief_complaint, diagnosis_note, consultation_type)
VALUES (1, 1, 1, 1, 'Headache', 'Tension headache, prescribed paracetamol', 'BOOKED');

-- Prescription
INSERT INTO Prescription (consultation_id, doctor_id, patient_id)
VALUES (1, 1, 1);

-- PrescriptionItem (this fires the inventory trigger)
INSERT INTO PrescriptionItem (prescription_id, medicine_name, dosage, frequency, duration_days)
VALUES (1, 'Paracetamol', '500mg', 'Twice daily', 5);

-- Check everything
SELECT * FROM Patient;
SELECT * FROM Slot;
SELECT * FROM Appointment;
SELECT * FROM WalkIn;
SELECT * FROM Consultation;
SELECT * FROM Prescription;
SELECT * FROM PrescriptionItem;
SELECT * FROM InventoryAlert;
SELECT * FROM ReorderSuggestion;
SELECT * FROM Reminder;