-- Migration: Add depositFixedAmount column and copy data from depositPercentage
-- This is a non-breaking migration that adds the new column while keeping the old one

-- Add the new depositFixedAmount column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS depositFixedAmount DECIMAL(10,2) NOT NULL DEFAULT '50.00';

-- Copy existing depositPercentage values to depositFixedAmount (convert percentage to fixed amount)
-- For existing clients, we use the percentage value as a starting fixed amount
UPDATE clients SET depositFixedAmount = depositPercentage WHERE depositFixedAmount = '50.00' AND depositPercentage != '30.00';
