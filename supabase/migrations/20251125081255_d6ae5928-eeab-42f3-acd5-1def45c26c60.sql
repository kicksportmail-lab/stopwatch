-- Create stopwatch_state table to store active stopwatch state
CREATE TABLE public.stopwatch_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  start_timestamp BIGINT,
  accumulated_time BIGINT NOT NULL DEFAULT 0,
  is_running BOOLEAN NOT NULL DEFAULT false,
  laps JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_stopwatch_state_user_id ON public.stopwatch_state(user_id);

-- Enable Row Level Security
ALTER TABLE public.stopwatch_state ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Anyone can view stopwatch state" 
ON public.stopwatch_state 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert stopwatch state" 
ON public.stopwatch_state 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update stopwatch state" 
ON public.stopwatch_state 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete stopwatch state" 
ON public.stopwatch_state 
FOR DELETE 
USING (true);

-- Create stopwatch_sessions table to store history
CREATE TABLE public.stopwatch_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  time BIGINT NOT NULL,
  laps JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_stopwatch_sessions_user_id ON public.stopwatch_sessions(user_id);
CREATE INDEX idx_stopwatch_sessions_date ON public.stopwatch_sessions(date DESC);

-- Enable Row Level Security
ALTER TABLE public.stopwatch_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view sessions" 
ON public.stopwatch_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert sessions" 
ON public.stopwatch_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.stopwatch_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sessions" 
ON public.stopwatch_sessions 
FOR DELETE 
USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stopwatch_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stopwatch_sessions;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_stopwatch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stopwatch_state_updated_at
BEFORE UPDATE ON public.stopwatch_state
FOR EACH ROW
EXECUTE FUNCTION public.update_stopwatch_updated_at();