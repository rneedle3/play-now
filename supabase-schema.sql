-- Supabase Schema for SF Court Availability Tracker
-- Run this SQL in your Supabase SQL Editor

-- Locations table: Stores information about tennis/pickleball court locations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    hours_of_operation TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability table: Stores available time slots for courts
CREATE TABLE IF NOT EXISTS availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    court_id UUID NOT NULL,
    court_name TEXT NOT NULL,
    slot_datetime TIMESTAMP NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price_cents INTEGER DEFAULT 0,
    price_type TEXT DEFAULT 'perHour',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(court_id, slot_datetime)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_availability_location_id ON availability(location_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability(date);
CREATE INDEX IF NOT EXISTS idx_availability_court_id ON availability(court_id);
CREATE INDEX IF NOT EXISTS idx_availability_slot_datetime ON availability(slot_datetime);
CREATE INDEX IF NOT EXISTS idx_availability_is_available ON availability(is_available);

-- Create a compound index for common queries
CREATE INDEX IF NOT EXISTS idx_availability_date_location ON availability(date, location_id);

-- Add comments for documentation
COMMENT ON TABLE locations IS 'Tennis and pickleball court locations in San Francisco';
COMMENT ON TABLE availability IS 'Available time slots for court reservations';

COMMENT ON COLUMN availability.slot_datetime IS 'Full datetime of the available slot';
COMMENT ON COLUMN availability.date IS 'Date component for easy filtering';
COMMENT ON COLUMN availability.time IS 'Time component for easy filtering';
COMMENT ON COLUMN availability.price_cents IS 'Price in cents (e.g., 500 = $5.00)';
COMMENT ON COLUMN availability.price_type IS 'Pricing type (e.g., perHour)';

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW availability_with_location AS
SELECT
    a.*,
    l.name as full_location_name,
    l.address,
    l.lat,
    l.lng,
    l.hours_of_operation
FROM availability a
LEFT JOIN locations l ON a.location_id = l.id
WHERE a.is_available = TRUE
ORDER BY a.date, a.time;

-- Optional: Enable Row Level Security (RLS) for public read access
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to locations
CREATE POLICY "Allow public read access on locations"
    ON locations FOR SELECT
    USING (true);

-- Policy: Allow public read access to availability
CREATE POLICY "Allow public read access on availability"
    ON availability FOR SELECT
    USING (true);

-- Note: For write access (your scraper), you'll use the service role key
-- which bypasses RLS policies
