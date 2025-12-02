-- Create tasks table for time tracking
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_time_ms bigint NOT NULL,
  total_time_spent_ms bigint NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for now, similar to stopwatch)
CREATE POLICY "Anyone can view tasks"
ON public.tasks
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert tasks"
ON public.tasks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
ON public.tasks
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete tasks"
ON public.tasks
FOR DELETE
USING (true);

-- Add task_id to stopwatch_state to link active task
ALTER TABLE public.stopwatch_state
ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add task_id to stopwatch_sessions for history tracking
ALTER TABLE public.stopwatch_sessions
ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;