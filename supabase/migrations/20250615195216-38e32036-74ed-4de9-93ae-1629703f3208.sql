
-- Enable real-time for participants table
ALTER TABLE public.participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;

-- Enable real-time for expenses table  
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
