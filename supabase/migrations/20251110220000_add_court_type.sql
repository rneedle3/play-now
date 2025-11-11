-- Add court_type column to availability table
-- This distinguishes between tennis and pickleball courts

ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS court_type TEXT;

-- Add comment
COMMENT ON COLUMN availability.court_type IS 'Type of court: tennis or pickleball';

-- Create index for filtering by court type
CREATE INDEX IF NOT EXISTS idx_availability_court_type ON availability(court_type);

