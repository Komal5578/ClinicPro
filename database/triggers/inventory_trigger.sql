USE clinic_db;

DELIMITER $$

CREATE TRIGGER after_prescription_insert
AFTER INSERT ON PrescriptionItem
FOR EACH ROW
BEGIN
  DECLARE v_item_id INT;
  DECLARE v_quantity INT;
  DECLARE v_threshold INT;
  DECLARE v_clinic_id INT;

  -- Check if medicine exists in inventory
  SELECT item_id, quantity, threshold_quantity, clinic_id
  INTO v_item_id, v_quantity, v_threshold, v_clinic_id
  FROM InventoryItem
  WHERE item_name = NEW.medicine_name
  LIMIT 1;

  -- If found and stock is low
  IF v_item_id IS NOT NULL AND v_quantity < v_threshold THEN
    INSERT INTO InventoryAlert (item_id, clinic_id, alert_type)
    VALUES (v_item_id, v_clinic_id, 'LOWSTOCK');
  END IF;
END$$

DELIMITER ;