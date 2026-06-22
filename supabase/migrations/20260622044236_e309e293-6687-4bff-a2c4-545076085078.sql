ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_location text,
ADD COLUMN IF NOT EXISTS default_lat double precision,
ADD COLUMN IF NOT EXISTS default_lon double precision,
ADD COLUMN IF NOT EXISTS voice_enabled boolean NOT NULL DEFAULT true;