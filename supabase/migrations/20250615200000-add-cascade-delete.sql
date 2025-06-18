-- Add CASCADE constraints to ensure related data is deleted when an event is deleted

-- First, check if the foreign key constraints exist and drop them if they do
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_event_id_fkey' 
    AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses DROP CONSTRAINT expenses_event_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'participants_event_id_fkey' 
    AND table_name = 'participants'
  ) THEN
    ALTER TABLE public.participants DROP CONSTRAINT participants_event_id_fkey;
  END IF;
END $$;

-- Re-create the foreign key constraints with CASCADE delete
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.events(id)
  ON DELETE CASCADE;

ALTER TABLE public.participants
  ADD CONSTRAINT participants_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.events(id)
  ON DELETE CASCADE;

-- Add an index on expenses.created_at for faster queries
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON public.expenses (created_at);

-- Add an index on events.created_at for faster queries
CREATE INDEX IF NOT EXISTS events_created_at_idx ON public.events (created_at); 