-- Cleanup script to remove user_profiles table and revert database to original state
-- Run this to clean up after switching to simple email-based role checking

-- Revert RLS policies back to original "allow all" state FIRST
DROP POLICY IF EXISTS "Admins can manage years" ON public.years;
DROP POLICY IF EXISTS "All authenticated users can view years" ON public.years;
DROP POLICY IF EXISTS "Admins can manage contributors" ON public.contributors;
DROP POLICY IF EXISTS "All authenticated users can view contributors" ON public.contributors;
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "All authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can manage games" ON public.games;
DROP POLICY IF EXISTS "All authenticated users can view games" ON public.games;
DROP POLICY IF EXISTS "Admins can manage winners" ON public.winners;
DROP POLICY IF EXISTS "All authenticated users can view winners" ON public.winners;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Recreate the original "allow all" policies
CREATE POLICY "Allow all operations on years" ON public.years FOR ALL USING (true);
CREATE POLICY "Allow all operations on contributors" ON public.contributors FOR ALL USING (true);
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations on games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow all operations on winners" ON public.winners FOR ALL USING (true);

-- Now drop the triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Finally drop the user_profiles table
DROP TABLE IF EXISTS public.user_profiles;
