-- ============================================================
-- Migration 008: Fix subscription-related column names
-- Ensures all columns referenced by stripe-subscription-router
-- exist with the correct names.
-- ============================================================

-- 1. client_users: Ensure client_id column exists
-- (The app code references client_id - snake_case)
SET @db = DATABASE();

-- Check and add client_id to client_users if missing
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'client_users'
  AND COLUMN_NAME = 'client_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE client_users ADD COLUMN client_id BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER id',
  'SELECT "client_users.client_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also ensure email is unique (needed for ON DUPLICATE KEY UPDATE)
SELECT COUNT(*) INTO @idx_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'client_users'
  AND INDEX_NAME = 'client_user_email_idx';

SET @sql2 = IF(@idx_exists = 0,
  'ALTER TABLE client_users ADD UNIQUE INDEX client_user_email_idx (email)',
  'SELECT "client_users email index already exists" AS message'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 2. client_subscriptions: Ensure clientId column exists (camelCase as in migration 007)
SELECT COUNT(*) INTO @col_exists2
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'client_subscriptions'
  AND COLUMN_NAME = 'clientId';

SET @sql3 = IF(@col_exists2 = 0,
  'ALTER TABLE client_subscriptions ADD COLUMN clientId BIGINT UNSIGNED NOT NULL AFTER id',
  'SELECT "client_subscriptions.clientId already exists" AS message'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Ensure unique index on clientId exists
SELECT COUNT(*) INTO @idx_exists2
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'client_subscriptions'
  AND INDEX_NAME = 'subscriptions_client_idx';

SET @sql4 = IF(@idx_exists2 = 0,
  'ALTER TABLE client_subscriptions ADD UNIQUE INDEX subscriptions_client_idx (clientId)',
  'SELECT "client_subscriptions clientId index already exists" AS message'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- 3. Ensure client_subscriptions has all needed columns
ALTER TABLE client_subscriptions
  MODIFY COLUMN IF EXISTS trial_start TIMESTAMP NULL,
  MODIFY COLUMN IF EXISTS trial_end TIMESTAMP NULL,
  MODIFY COLUMN IF EXISTS plan_start TIMESTAMP NULL,
  MODIFY COLUMN IF EXISTS plan_end TIMESTAMP NULL,
  MODIFY COLUMN IF EXISTS status ENUM('trial','active','expired','cancelled') DEFAULT 'trial' NOT NULL,
  MODIFY COLUMN IF EXISTS annual_price DECIMAL(10,2) DEFAULT 600.00 NOT NULL,
  MODIFY COLUMN IF EXISTS coupon_code VARCHAR(50),
  MODIFY COLUMN IF EXISTS discount_applied INT UNSIGNED DEFAULT 0,
  MODIFY COLUMN IF EXISTS final_amount DECIMAL(10,2),
  MODIFY COLUMN IF EXISTS stripe_customer_id VARCHAR(255),
  MODIFY COLUMN IF EXISTS stripe_subscription_id VARCHAR(255),
  MODIFY COLUMN IF EXISTS stripe_payment_method_id VARCHAR(255);

-- 4. subscription_payments: Ensure clientId column exists
SELECT COUNT(*) INTO @col_exists3
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'subscription_payments'
  AND COLUMN_NAME = 'clientId';

SET @sql5 = IF(@col_exists3 = 0,
  'ALTER TABLE subscription_payments ADD COLUMN clientId BIGINT UNSIGNED NOT NULL AFTER id',
  'SELECT "subscription_payments.clientId already exists" AS message'
);
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

SELECT 'Migration 008 completed successfully' AS result;
