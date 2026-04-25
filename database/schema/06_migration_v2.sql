-- Migration script for existing clinic_db databases
-- Run this on MySQL 8.0+
-- Safely adds new columns (ignores errors if column already exists)

USE clinic_db;

-- Doctor table: add sector
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Doctor' AND COLUMN_NAME = 'sector');
SET @sql = IF(@col_exists = 0, "ALTER TABLE Doctor ADD COLUMN sector ENUM('GENERAL','AYURVEDIC','DENTAL') DEFAULT 'GENERAL'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Doctor table: add registration_type
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Doctor' AND COLUMN_NAME = 'registration_type');
SET @sql = IF(@col_exists = 0, "ALTER TABLE Doctor ADD COLUMN registration_type ENUM('MCI','CCIM','DCI')", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Doctor table: add certificate_url
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Doctor' AND COLUMN_NAME = 'certificate_url');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Doctor ADD COLUMN certificate_url VARCHAR(500)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Doctor table: add nmc_verified
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Doctor' AND COLUMN_NAME = 'nmc_verified');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Doctor ADD COLUMN nmc_verified BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clinic table: add gst_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Clinic' AND COLUMN_NAME = 'gst_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Clinic ADD COLUMN gst_number VARCHAR(15) UNIQUE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clinic table: add sector
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Clinic' AND COLUMN_NAME = 'sector');
SET @sql = IF(@col_exists = 0, "ALTER TABLE Clinic ADD COLUMN sector ENUM('GENERAL','AYURVEDIC','DENTAL') DEFAULT 'GENERAL'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clinic table: add latitude
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Clinic' AND COLUMN_NAME = 'latitude');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Clinic ADD COLUMN latitude DECIMAL(10,8)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clinic table: add longitude
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Clinic' AND COLUMN_NAME = 'longitude');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Clinic ADD COLUMN longitude DECIMAL(11,8)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Staff table: add approval_status
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'clinic_db' AND TABLE_NAME = 'Staff' AND COLUMN_NAME = 'approval_status');
SET @sql = IF(@col_exists = 0, "ALTER TABLE Staff ADD COLUMN approval_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'APPROVED'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Set all existing staff to APPROVED
UPDATE Staff SET approval_status = 'APPROVED' WHERE approval_status IS NULL;

SELECT 'Migration completed successfully!' AS status;
