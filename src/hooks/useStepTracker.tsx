import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const FIXED_USER_ID = "00000000-0000-0000-0000-000000000001";
const STEP_LENGTH_METERS = 0.762; // Average step length
const CALORIES_PER_STEP = 0.04; // Approximate calories burned per step

interface StepData {
  date: string;
  steps: number;
  distance_meters: number;
  calories_burned: number;
  step_goal: number;
}

interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
}

export const useStepTracker = () => {
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [isTracking, setIsTracking] = useState(false);
  const [weeklyData, setWeeklyData] = useState<StepData[]>([]);
  const [monthlyData, setMonthlyData] = useState<StepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const stepThreshold = useRef(1.2);
  const lastStepTime = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const todayDate = format(new Date(), "yyyy-MM-dd");

  // Calculate distance and calories from steps
  const distance = todaySteps * STEP_LENGTH_METERS;
  const calories = todaySteps * CALORIES_PER_STEP;
  const progressPercentage = stepGoal > 0 ? Math.min((todaySteps / stepGoal) * 100, 100) : 0;

  // Weekly stats
  const weeklySteps = weeklyData.reduce((sum, d) => sum + d.steps, 0);
  const weeklyDistance = weeklyData.reduce((sum, d) => sum + Number(d.distance_meters), 0);
  const weeklyCalories = weeklyData.reduce((sum, d) => sum + Number(d.calories_burned), 0);
  const weeklyAverage = weeklyData.length > 0 ? Math.round(weeklySteps / weeklyData.length) : 0;

  // Monthly stats
  const monthlySteps = monthlyData.reduce((sum, d) => sum + d.steps, 0);
  const monthlyDistance = monthlyData.reduce((sum, d) => sum + Number(d.distance_meters), 0);
  const monthlyCalories = monthlyData.reduce((sum, d) => sum + Number(d.calories_burned), 0);
  const monthlyAverage = monthlyData.length > 0 ? Math.round(monthlySteps / monthlyData.length) : 0;
  const daysGoalMet = monthlyData.filter(d => d.steps >= d.step_goal).length;

  // Load today's data
  const loadTodayData = useCallback(async () => {
    const { data, error } = await supabase
      .from("step_tracking")
      .select("*")
      .eq("user_id", FIXED_USER_ID)
      .eq("date", todayDate)
      .maybeSingle();

    if (data && !error) {
      setTodaySteps(data.steps);
      setStepGoal(data.step_goal);
    }
    setIsLoading(false);
  }, [todayDate]);

  // Load weekly data
  const loadWeeklyData = useCallback(async () => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("step_tracking")
      .select("*")
      .eq("user_id", FIXED_USER_ID)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true });

    if (data && !error) {
      setWeeklyData(data as StepData[]);
    }
  }, []);

  // Load monthly data
  const loadMonthlyData = useCallback(async () => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("step_tracking")
      .select("*")
      .eq("user_id", FIXED_USER_ID)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: true });

    if (data && !error) {
      setMonthlyData(data as StepData[]);
    }
  }, []);

  // Save step data with debounce
  const saveStepData = useCallback(async (steps: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const distanceM = steps * STEP_LENGTH_METERS;
      const caloriesBurned = steps * CALORIES_PER_STEP;

      await supabase
        .from("step_tracking")
        .upsert(
          {
            user_id: FIXED_USER_ID,
            date: todayDate,
            steps,
            distance_meters: distanceM,
            calories_burned: caloriesBurned,
            step_goal: stepGoal,
          },
          { onConflict: "user_id,date" }
        );
    }, 500);
  }, [todayDate, stepGoal]);

  // Update step goal
  const updateStepGoal = async (newGoal: number) => {
    setStepGoal(newGoal);
    
    await supabase
      .from("step_tracking")
      .upsert(
        {
          user_id: FIXED_USER_ID,
          date: todayDate,
          steps: todaySteps,
          distance_meters: distance,
          calories_burned: calories,
          step_goal: newGoal,
        },
        { onConflict: "user_id,date" }
      );
  };

  // Step detection algorithm
  const detectStep = useCallback((acceleration: { x: number; y: number; z: number }) => {
    const now = Date.now();
    const timeSinceLastStep = now - lastStepTime.current;
    
    // Minimum time between steps (prevents double counting)
    if (timeSinceLastStep < 250) return;

    const { x, y, z } = acceleration;
    const last = lastAcceleration.current;
    
    // Calculate magnitude of acceleration change
    const delta = Math.sqrt(
      Math.pow(x - last.x, 2) + 
      Math.pow(y - last.y, 2) + 
      Math.pow(z - last.z, 2)
    );

    if (delta > stepThreshold.current) {
      setTodaySteps(prev => {
        const newSteps = prev + 1;
        saveStepData(newSteps);
        return newSteps;
      });
      lastStepTime.current = now;
    }

    lastAcceleration.current = { x, y, z };
  }, [saveStepData]);

  // Handle device motion
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
      detectStep({ x: acc.x, y: acc.y, z: acc.z });
    }
  }, [detectStep]);

  // Start tracking
  const startTracking = async () => {
    // Check if DeviceMotionEvent is available
    if (!("DeviceMotionEvent" in window)) {
      setSensorAvailable(false);
      return;
    }

    // Request permission on iOS
    const DeviceMotionEventTyped = DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
    if (typeof DeviceMotionEventTyped.requestPermission === "function") {
      try {
        const permission = await DeviceMotionEventTyped.requestPermission();
        if (permission !== "granted") {
          setSensorAvailable(false);
          return;
        }
      } catch {
        setSensorAvailable(false);
        return;
      }
    }

    window.addEventListener("devicemotion", handleMotion);
    setIsTracking(true);
  };

  // Stop tracking
  const stopTracking = () => {
    window.removeEventListener("devicemotion", handleMotion);
    setIsTracking(false);
  };

  // Add steps manually (for testing or manual entry)
  const addStepsManually = (stepsToAdd: number) => {
    setTodaySteps(prev => {
      const newSteps = prev + stepsToAdd;
      saveStepData(newSteps);
      return newSteps;
    });
  };

  // Reset today's steps
  const resetTodaySteps = async () => {
    setTodaySteps(0);
    await supabase
      .from("step_tracking")
      .upsert(
        {
          user_id: FIXED_USER_ID,
          date: todayDate,
          steps: 0,
          distance_meters: 0,
          calories_burned: 0,
          step_goal: stepGoal,
        },
        { onConflict: "user_id,date" }
      );
  };

  // Load data on mount
  useEffect(() => {
    loadTodayData();
    loadWeeklyData();
    loadMonthlyData();
  }, [loadTodayData, loadWeeklyData, loadMonthlyData]);

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("step-tracking-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "step_tracking",
          filter: `user_id=eq.${FIXED_USER_ID}`,
        },
        () => {
          loadTodayData();
          loadWeeklyData();
          loadMonthlyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTodayData, loadWeeklyData, loadMonthlyData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [handleMotion]);

  return {
    todaySteps,
    stepGoal,
    distance,
    calories,
    progressPercentage,
    isTracking,
    isLoading,
    sensorAvailable,
    weeklySteps,
    weeklyDistance,
    weeklyCalories,
    weeklyAverage,
    weeklyData,
    monthlySteps,
    monthlyDistance,
    monthlyCalories,
    monthlyAverage,
    monthlyData,
    daysGoalMet,
    startTracking,
    stopTracking,
    updateStepGoal,
    addStepsManually,
    resetTodaySteps,
  };
};
