USE clinic_db;

DELIMITER $$

CREATE PROCEDURE book_appointment(
  IN p_slot_id INT,
  IN p_patient_id INT,
  IN p_doctor_id INT,
  IN p_clinic_id INT,
  OUT p_appointment_id INT,
  OUT p_message VARCHAR(100)
)
BEGIN
  DECLARE v_status VARCHAR(20);

  -- Lock the slot row
  SELECT status INTO v_status
  FROM Slot
  WHERE slot_id = p_slot_id
  FOR UPDATE;

  IF v_status = 'OPEN' THEN
    -- Book the slot
    UPDATE Slot SET status = 'BOOKED' WHERE slot_id = p_slot_id;

    -- Create appointment
    INSERT INTO Appointment (slot_id, patient_id, doctor_id, clinic_id, status)
    VALUES (p_slot_id, p_patient_id, p_doctor_id, p_clinic_id, 'SCHEDULED');

    SET p_appointment_id = LAST_INSERT_ID();
    SET p_message = 'SUCCESS';

    -- Queue reminder
    INSERT INTO Reminder (patient_id, appointment_id, reminder_type, scheduled_for)
    SELECT p_patient_id, p_appointment_id, 'APPOINTMENT',
           DATE_SUB(CONCAT(slot_date, ' ', slot_start_time), INTERVAL 24 HOUR)
    FROM Slot WHERE slot_id = p_slot_id;

  ELSE
    SET p_appointment_id = 0;
    SET p_message = 'SLOT_ALREADY_BOOKED';
  END IF;

END$$

DELIMITER ;