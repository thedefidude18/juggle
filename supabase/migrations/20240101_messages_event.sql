-- First, let's check if the column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'messages' 
                   AND column_name = 'event_id') THEN
        -- Add event_id column
        ALTER TABLE public.messages 
        ADD COLUMN event_id BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'messages' 
                   AND column_name = 'type') THEN
        -- Add type column
        ALTER TABLE public.messages 
        ADD COLUMN type VARCHAR(50) DEFAULT 'chat_message';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';