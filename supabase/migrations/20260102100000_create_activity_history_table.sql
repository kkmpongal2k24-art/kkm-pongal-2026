-- Create activity_history table to track all user activities
CREATE TABLE IF NOT EXISTS public.activity_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(50) NOT NULL, -- 'contributor', 'expense', 'game', 'winner'
    entity_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}', -- Additional metadata about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_history_year_id ON public.activity_history(year_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_created_at ON public.activity_history(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_history_username ON public.activity_history(username);
CREATE INDEX IF NOT EXISTS idx_activity_history_entity_type ON public.activity_history(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_history_action ON public.activity_history(action);

-- Enable RLS (Row Level Security)
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow authenticated users to read/write activity history
CREATE POLICY "Allow authenticated users to read activity history"
    ON public.activity_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert activity history"
    ON public.activity_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Optional: Policy to allow users to delete their own activities (if needed)
CREATE POLICY "Allow users to delete their own activities"
    ON public.activity_history FOR DELETE
    TO authenticated
    USING (user_email = auth.email());

-- Grant necessary permissions
GRANT ALL ON public.activity_history TO authenticated;
GRANT ALL ON public.activity_history TO service_role;