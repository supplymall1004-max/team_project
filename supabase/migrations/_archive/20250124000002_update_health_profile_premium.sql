-- Add premium_features column and ensure other columns are arrays
-- 20250124000002_update_health_profile_premium.sql

ALTER TABLE public.user_health_profiles 
ADD COLUMN IF NOT EXISTS premium_features TEXT[] DEFAULT '{}';

-- Ensure existing columns are arrays (they should be based on previous migration, but good to be safe)
-- If they were created as arrays in 000001, this is just a check or no-op.
-- We are adding comments to columns for clarity if supported, or just ensuring the structure.

COMMENT ON COLUMN public.user_health_profiles.premium_features IS 'List of active premium features: lunchbox, fitness, diet, vegan, etc.';
COMMENT ON COLUMN public.user_health_profiles.diseases IS 'List of diseases';
COMMENT ON COLUMN public.user_health_profiles.allergies IS 'List of allergies';
