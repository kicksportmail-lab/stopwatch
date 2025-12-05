-- Create a table for daily time goals
CREATE TABLE public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  target_ms BIGINT NOT NULL DEFAULT 3600000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for access (matching existing pattern)
CREATE POLICY "Anyone can view goals" 
ON public.daily_goals 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert goals" 
ON public.daily_goals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update goals" 
ON public.daily_goals 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete goals" 
ON public.daily_goals 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_daily_goals_updated_at
BEFORE UPDATE ON public.daily_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_stopwatch_updated_at();