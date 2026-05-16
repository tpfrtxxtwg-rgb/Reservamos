-- Migration: Add departure information fields to bookings table
-- For TiDB Cloud - run this manually if needed

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departureAirline VARCHAR(100) AFTER departureTime,
  ADD COLUMN IF NOT EXISTS departureFlightNumber VARCHAR(50) AFTER departureAirline,
  ADD COLUMN IF NOT EXISTS hotelPickupTime VARCHAR(10) AFTER departureFlightNumber;
