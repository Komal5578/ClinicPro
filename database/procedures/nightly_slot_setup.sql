USE clinic_db;

DELIMITER $$

CREATE PROCEDURE nightly_slot_setup()
BEGIN
  DECLARE v_clinic_id INT;
  DECLARE v_morning_start TIME;
  DECLARE v_morning_end TIME;
  DECLARE v_evening_start TIME;
  DECLARE v_evening_end TIME;
  DECLARE v_slot_duration INT;
  DECLARE v_current_time TIME;
  DECLARE v_next_date DATE;
  DECLARE done INT DEFAULT 0;

  DECLARE clinic_cursor CURSOR FOR
    SELECT clinic_id, morning_start, morning_end, 
           evening_start, evening_end, booked_slot_duration
    FROM Clinic;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  SET v_next_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY);

  OPEN clinic_cursor;

  clinic_loop: LOOP
    FETCH clinic_cursor INTO v_clinic_id, v_morning_start, v_morning_end,
                             v_evening_start, v_evening_end, v_slot_duration;
    IF done = 1 THEN
      LEAVE clinic_loop;
    END IF;

    -- Morning slots
    SET v_current_time = v_morning_start;
    WHILE v_current_time < v_morning_end DO
      INSERT INTO Slot (clinic_id, slot_date, slot_start_time, slot_type, status)
      VALUES (v_clinic_id, v_next_date, v_current_time, 'BOOKED', 'OPEN');
      SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_duration * 60));
    END WHILE;

    -- Evening slots
    SET v_current_time = v_evening_start;
    WHILE v_current_time < v_evening_end DO
      INSERT INTO Slot (clinic_id, slot_date, slot_start_time, slot_type, status)
      VALUES (v_clinic_id, v_next_date, v_current_time, 'BOOKED', 'OPEN');
      SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME(v_slot_duration * 60));
    END WHILE;

  END LOOP;

  CLOSE clinic_cursor;

  -- Queue reminders for tomorrow's appointments
  INSERT INTO Reminder (patient_id, appointment_id, reminder_type, scheduled_for)
  SELECT a.patient_id, a.appointment_id, 'APPOINTMENT',
         DATE_SUB(CONCAT(v_next_date, ' ', s.slot_start_time), INTERVAL 24 HOUR)
  FROM Appointment a
  JOIN Slot s ON a.slot_id = s.slot_id
  WHERE s.slot_date = v_next_date AND a.status = 'SCHEDULED';

  -- Check inventory thresholds
  INSERT INTO InventoryAlert (item_id, clinic_id, alert_type)
  SELECT item_id, clinic_id, 'LOWSTOCK'
  FROM InventoryItem
  WHERE quantity < threshold_quantity
  AND item_id NOT IN (
    SELECT item_id FROM InventoryAlert WHERE is_resolved = FALSE
  );

END$$

DELIMITER ;