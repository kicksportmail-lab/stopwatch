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
  const accumulatedTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const lastUpdateTime = useRef(0);

  // Load initial state from database
  useEffect(() => {
    const loadState = async () => {
      // First try to get existing state
      const { data: existingState, error } = await supabase
        .from('stopwatch_state')
        .select('*')
        .limit(1)
        .maybeSingle();

      let stateData = existingState;

      // If no state exists, create one with a known ID
      if (!existingState || error) {
        const { data: newState, error: insertError } = await supabase
          .from('stopwatch_state')
          .upsert({
            id: '00000000-0000-0000-0000-000000000001', // Fixed ID so all devices use same state
            accumulated_time: 0,
            is_running: false,
            laps: [],
            start_timestamp: null
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        stateData = newState || null;
      }

      if (stateData) {
        setStateId(stateData.id);
        accumulatedTimeRef.current = stateData.accumulated_time;
        
        if (stateData.is_running && stateData.start_timestamp) {
          const elapsed = Date.now() - stateData.start_timestamp;
          setTime(stateData.accumulated_time + elapsed);
          setIsRunning(true);
          startTimeRef.current = stateData.start_timestamp;
        } else {
          setTime(stateData.accumulated_time);
          setIsRunning(false);
        }
        
        setLaps(Array.isArray(stateData.laps) ? (stateData.laps as unknown as LapTime[]) : []);
      }
    };

    loadState();
  }, []);

  // Main timer effect
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current!;
        setTime(accumulatedTimeRef.current + elapsed);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Sync state to database with debouncing
  const syncState = async (state: Partial<StopwatchState>) => {
    if (!stateId) return;
    
    const now = Date.now();
    // Prevent rapid-fire updates (debounce)
    if (now - lastUpdateTime.current < 50) return;
    
    isUpdatingRef.current = true;
    lastUpdateTime.current = now;

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
    }, 200);
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
          // Ignore updates we just made
          if (isUpdatingRef.current) return;
          
          const now = Date.now();
          // Ignore if we just updated
          if (now - lastUpdateTime.current < 100) return;

          const data = payload.new as any;
          
          accumulatedTimeRef.current = data.accumulated_time;
          
          if (data.is_running && data.start_timestamp) {
            // Only update if not already running or if timestamp changed
            if (!isRunning || startTimeRef.current !== data.start_timestamp) {
              const elapsed = Date.now() - data.start_timestamp;
              setTime(data.accumulated_time + elapsed);
              setIsRunning(true);
              startTimeRef.current = data.start_timestamp;
            }
          } else {
            // Stopwatch was stopped remotely
            if (isRunning) {
              setTime(data.accumulated_time);
              setIsRunning(false);
              startTimeRef.current = null;
            }
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
      accumulatedTimeRef.current = time;
      setIsRunning(true);
      
      await syncState({
        startTimestamp: timestamp,
        accumulatedTime: time,
        isRunning: true
      });
    } else {
      const currentTime = time;
      accumulatedTimeRef.current = currentTime;
      startTimeRef.current = null;
      setIsRunning(false);
      setTime(currentTime);
      
      await syncState({
        startTimestamp: null,
        accumulatedTime: currentTime,
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
    accumulatedTimeRef.current = 0;

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