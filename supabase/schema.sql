-- Pongal Games Manager Database Schema
-- Run this in your Supabase SQL editor to create the tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create Years table
CREATE TABLE public.years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year VARCHAR(4) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Contributors table
CREATE TABLE public.contributors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    category VARCHAR(50) DEFAULT 'boys-girls',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) DEFAULT 'Prize',
    date DATE,
    image TEXT, -- Base64 encoded image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Games table
CREATE TABLE public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    reference_link TEXT,
    first_prize_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    second_prize_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    third_prize_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    participants TEXT[], -- Array of participant names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Winners table
CREATE TABLE public.winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(20) NOT NULL, -- '1st', '2nd', '3rd', 'Participation', 'Other'
    prize_given BOOLEAN DEFAULT false,
    prize_given_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_contributors_year_id ON public.contributors(year_id);
CREATE INDEX idx_contributors_category ON public.contributors(category);
CREATE INDEX idx_expenses_year_id ON public.expenses(year_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_games_year_id ON public.games(year_id);
CREATE INDEX idx_winners_year_id ON public.winners(year_id);
CREATE INDEX idx_winners_game_id ON public.winners(game_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_years_updated_at
    BEFORE UPDATE ON public.years
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_contributors_updated_at
    BEFORE UPDATE ON public.contributors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_winners_updated_at
    BEFORE UPDATE ON public.winners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - customize as needed)
CREATE POLICY "Allow all operations on years" ON public.years FOR ALL USING (true);
CREATE POLICY "Allow all operations on contributors" ON public.contributors FOR ALL USING (true);
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations on games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow all operations on winners" ON public.winners FOR ALL USING (true);