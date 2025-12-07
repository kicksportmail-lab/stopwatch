-- Create a table for step tracking data
CREATE TABLE public.step_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  distance_meters DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_burned DECIMAL(10, 2) NOT NULL DEFAULT 0,
  step_goal INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.step_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies (using true for now since app lacks auth)
CREATE POLICY "Allow all access to step_tracking" 
ON public.step_tracking 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.step_tracking;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_step_tracking_updated_at
BEFORE UPDATE ON public.step_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_stopwatch_updated_at();