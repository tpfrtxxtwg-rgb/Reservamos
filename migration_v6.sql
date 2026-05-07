
-- Migration: Add client_users table for SaaS tenant authentication
CREATE TABLE IF NOT EXISTS client_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'operator') DEFAULT 'owner' NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  last_sign_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX client_user_email_idx (email),
  INDEX client_user_client_idx (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure clients table has all needed columns
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 16.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2) DEFAULT 30.00 NOT NULL;

-- Ensure bookings table has payment tracking columns
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status ENUM('paid', 'deposit', 'pending', 'balance_due') DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
