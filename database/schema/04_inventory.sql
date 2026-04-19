USE clinic_db;

CREATE TABLE InventoryCategory (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name ENUM('Medicine','Consumable','Equipment','Lab_supply') NOT NULL
);

CREATE TABLE InventoryItem (
  item_id             INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id           INT NOT NULL,
  category_id         INT NOT NULL,
  item_name           VARCHAR(100) NOT NULL,
  quantity            INT DEFAULT 0,
  threshold_quantity  INT DEFAULT 0,
  expiry_date         DATE,
  unit                ENUM('strip','units','pieces') NOT NULL,
  last_updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_updated_by     INT,
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id),
  FOREIGN KEY (category_id) REFERENCES InventoryCategory(category_id),
  FOREIGN KEY (last_updated_by) REFERENCES Staff(staff_id)
);

CREATE TABLE InventoryAlert (
  alert_id      INT AUTO_INCREMENT PRIMARY KEY,
  item_id       INT NOT NULL,
  clinic_id     INT NOT NULL,
  alert_type    ENUM('LOWSTOCK','EMPTY','SOON') NOT NULL,
  triggered_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_resolved   BOOLEAN DEFAULT FALSE,
  resolved_at   TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES InventoryItem(item_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);

CREATE TABLE ReorderSuggestion (
  suggestion_id     INT AUTO_INCREMENT PRIMARY KEY,
  alert_id          INT NOT NULL,
  item_id           INT NOT NULL,
  clinic_id         INT NOT NULL,
  ordered_quantity  INT,
  ordered_by        INT,
  ordered_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received          BOOLEAN DEFAULT FALSE,
  received_at       TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES InventoryAlert(alert_id),
  FOREIGN KEY (item_id) REFERENCES InventoryItem(item_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);

CREATE TABLE StockOrder (
  order_id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id           INT NOT NULL,
  clinic_id         INT NOT NULL,
  ordered_quantity  INT NOT NULL,
  ordered_by        INT,
  ordered_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received          BOOLEAN DEFAULT FALSE,
  received_at       TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES InventoryItem(item_id),
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);

