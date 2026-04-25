USE clinic_db;

CREATE TABLE Staff (
  staff_id    INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id   INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15),
  email       VARCHAR(100),
  role        ENUM('ADMIN','RECEPTIONIST') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id)
);