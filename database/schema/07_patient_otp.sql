CREATE TABLE IF NOT EXISTS otp_verification (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone_created (phone, created_at)
);
