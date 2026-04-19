USE clinic_db;

DELIMITER $$

CREATE TRIGGER after_inventory_alert_insert
AFTER INSERT ON InventoryAlert
FOR EACH ROW
BEGIN
  INSERT INTO ReorderSuggestion (alert_id, item_id, clinic_id)
  VALUES (NEW.alert_id, NEW.item_id, NEW.clinic_id);
END$$

DELIMITER ;