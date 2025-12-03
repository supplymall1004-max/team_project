-- Add UNIQUE constraint to users.clerk_id if not exists
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_clerk_id_key'
    ) THEN
        -- Add UNIQUE constraint
        ALTER TABLE public.users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
        RAISE NOTICE 'UNIQUE constraint added to users.clerk_id';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on users.clerk_id';
    END IF;
END $$;
























