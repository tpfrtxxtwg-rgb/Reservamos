-- Add client_payment_settings table
CREATE TABLE IF NOT EXISTS client_payment_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clientId BIGINT UNSIGNED NOT NULL,
  test_mode BOOLEAN DEFAULT TRUE NOT NULL,
  stripe_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  stripe_secret_key VARCHAR(255),
  stripe_publishable_key VARCHAR(255),
  stripe_webhook_secret VARCHAR(255),
  paypal_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  paypal_client_id VARCHAR(255),
  paypal_client_secret VARCHAR(255),
  paypal_webhook_id VARCHAR(255),
  accepted_methods ENUM('card', 'paypal', 'cash', 'card_paypal', 'all') DEFAULT 'cash' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX payment_settings_client_idx (clientId)
);
