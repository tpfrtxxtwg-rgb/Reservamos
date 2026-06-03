-- Migration: Add company profile fields and vehicle image presets
-- For TiDB Cloud - run this manually if needed

-- Add profile fields to clients table
ALTER TABLE clients ADD COLUMN website VARCHAR(255);
ALTER TABLE clients ADD COLUMN phone VARCHAR(50);
ALTER TABLE clients ADD COLUMN description TEXT;

-- Create vehicle_images table for vehicle type → image URL mapping
CREATE TABLE IF NOT EXISTS vehicle_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX vehicle_image_client_type_idx (client_id, vehicle_type)
);
