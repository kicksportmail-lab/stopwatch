import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LapTime {
  id: number;
  time: number;
  split: number;
}

interface StopwatchState {
  id?: string;
  startTimestamp: number | null;
  accumulatedTime: number;
  isRunning: boolean;
  laps: LapTime[];
}

const DEVICE_ID = `device_${Math.random().toString(36).substring(7)}`;

export const useStopwatchSync = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [stateId, setStateId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isUpdatingRef = useRef(false);

  // Load initial state from database
  useEffect(() => {
    const loadState = async () => {
      const { data, error } = await supabase
        .from('stopwatch_state')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setStateId(data.id);
        
        if (data.is_running && data.start_timestamp) {
          const elapsed = Date.now() - data.start_timestamp;
          setTime(data.accumulated_time + elapsed);
          setIsRunning(true);
          startTimeRef.current = data.start_timestamp;
        } else {
          setTime(data.accumulated_time);
        }
        
        setLaps(Array.isArray(data.laps) ? (data.laps as unknown as LapTime[]) : []);
      } else {
        // Create initial state
        const { data: newState, error: insertError } = await supabase
          .from('stopwatch_state')
          .insert({
            accumulated_time: 0,
            is_running: false,
            laps: []
          })
          .select()
          .single();

        if (newState && !insertError) {
          setStateId(newState.id);
        }
      }
    };

    loadState();
  }, []);

  // Main timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const accumulated = time - elapsed;
          setTime(accumulated + elapsed);
        }
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Sync state to database
  const syncState = async (state: Partial<StopwatchState>) => {
    if (!stateId || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const updateData: any = {};
    
    if (state.startTimestamp !== undefined) {
      updateData.start_timestamp = state.startTimestamp;
    }
    if (state.accumulatedTime !== undefined) {
      updateData.accumulated_time = state.accumulatedTime;
    }
    if (state.isRunning !== undefined) {
      updateData.is_running = state.isRunning;
    }
    if (state.laps !== undefined) {
      updateData.laps = state.laps;
    }

    await supabase
      .from('stopwatch_state')
      .update(updateData)
      .eq('id', stateId);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  };

  // Listen to realtime changes
  useEffect(() => {
    if (!stateId) return;

    const channel = supabase
      .channel('stopwatch-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stopwatch_state',
          filter: `id=eq.${stateId}`
        },
        (payload) => {
          if (isUpdatingRef.current) return;

          const data = payload.new as any;
          
          if (data.is_running && data.start_timestamp) {
            const elapsed = Date.now() - data.start_timestamp;
            setTime(data.accumulated_time + elapsed);
            setIsRunning(true);
            startTimeRef.current = data.start_timestamp;
          } else {
            setTime(data.accumulated_time);
            setIsRunning(false);
            startTimeRef.current = null;
          }
          
          setLaps(Array.isArray(data.laps) ? (data.laps as unknown as LapTime[]) : []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stateId]);

  const handleStartStop = async () => {
    if (!isRunning) {
      const timestamp = Date.now();
      startTimeRef.current = timestamp;
      setIsRunning(true);
      
      await syncState({
        startTimestamp: timestamp,
        accumulatedTime: time - (Date.now() - timestamp),
        isRunning: true
      });
    } else {
      const accumulated = time;
      startTimeRef.current = null;
      setIsRunning(false);
      
      await syncState({
        startTimestamp: null,
        accumulatedTime: accumulated,
        isRunning: false
      });
    }
  };

  const handleReset = async (name?: string) => {
    if (time > 0) {
      // Save to history
      await supabase
        .from('stopwatch_sessions')
        .insert({
          time,
          laps: JSON.parse(JSON.stringify(laps)),
          name: name || null
        });
    }

    setIsRunning(false);
    setTime(0);
    setLaps([]);
    startTimeRef.current = null;

    await syncState({
      startTimestamp: null,
      accumulatedTime: 0,
      isRunning: false,
      laps: []
    });
  };

  const handleLap = async () => {
    if (time > 0) {
      const previousLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
      const split = time - previousLapTime;
      const newLaps = [...laps, { id: laps.length + 1, time, split }];
      
      setLaps(newLaps);
      await syncState({ laps: newLaps });
    }
  };

  return {
    time,
    isRunning,
    laps,
    handleStartStop,
    handleReset,
    handleLap,
  };
};