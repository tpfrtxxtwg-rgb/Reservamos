-- Migration: Add departure information fields to bookings table
-- For TiDB Cloud - run this manually if needed

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departureAirline VARCHAR(100) AFTER departureTime,
  ADD COLUMN IF NOT EXISTS departureFlightNumber VARCHAR(50) AFTER departureAirline,
  ADD COLUMN IF NOT EXISTS hotelPickupTime VARCHAR(10) AFTER departureFlightNumber;

-- Alternative for TiDB Cloud (if IF NOT EXISTS is not supported):
-- ALTER TABLE bookings ADD COLUMN departureAirline VARCHAR(100);
-- ALTER TABLE bookings ADD COLUMN departureFlightNumber VARCHAR(50);
-- ALTER TABLE bookings ADD COLUMN hotelPickupTime VARCHAR(10);
