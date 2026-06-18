-- Migration 008: Ensure subscription-related columns and indexes exist.
-- Idempotent: safe to re-run.

-- 1. client_subscriptions table
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clientId BIGINT UNSIGNED NOT NULL,
  trial_start TIMESTAMP NULL,
  trial_end TIMESTAMP NULL,
  plan_start TIMESTAMP NULL,
  plan_end TIMESTAMP NULL,
  status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial' NOT NULL,
  annual_price DECIMAL(10,2) DEFAULT 600.00 NOT NULL,
  coupon_code VARCHAR(50),
  discount_applied INT UNSIGNED DEFAULT 0,
  final_amount DECIMAL(10,2),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_payment_method_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY subscriptions_client_idx (clientId),
  INDEX subscriptions_status_idx (status)
);

-- 2. subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clientId BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
  description VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX sub_payments_client_idx (clientId)
);

-- 3. coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent INT UNSIGNED NOT NULL,
  max_uses INT UNSIGNED DEFAULT 1 NOT NULL,
  uses_count INT UNSIGNED DEFAULT 0 NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  description VARCHAR(255),
  valid_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX coupons_code_idx (code)
);

-- 4. Ensure client_users.email has a unique index (for ON DUPLICATE KEY UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS client_user_email_idx ON client_users(email);
