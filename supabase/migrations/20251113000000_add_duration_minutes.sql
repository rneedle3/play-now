-- Add duration_minutes column to availability table
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add comment
COMMENT ON COLUMN availability.duration_minutes IS 'Duration of the booking slot in minutes (e.g., 30, 60, 90)';

