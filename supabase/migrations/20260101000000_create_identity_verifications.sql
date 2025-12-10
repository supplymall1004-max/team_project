-- Migration: create identity_verifications table
CREATE TABLE IF NOT EXISTS PUBLIC.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  national_id_hash TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'identity_verifications'
  ) THEN
    -- Ensure FK constraint exists
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_name = 'fk_identity_verifications_clerk_user'
        AND tc.table_name = 'identity_verifications'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE public.identity_verifications
        ADD CONSTRAINT fk_identity_verifications_clerk_user
        FOREIGN KEY (clerk_user_id)
        REFERENCES public.users (clerk_id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END
$$;

-- Index to speed up clerk_user_id lookups
CREATE INDEX IF NOT EXISTS idx_identity_verifications_clerk ON public.identity_verifications (clerk_user_id);
