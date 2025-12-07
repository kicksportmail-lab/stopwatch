import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const FIXED_USER_ID = "00000000-0000-0000-0000-000000000001";
const STEP_LENGTH_METERS = 0.762; // Average step length
const CALORIES_PER_STEP = 0.04; // Approximate calories burned per step

// Step detection constants - calibrated for realistic walking
const STEP_THRESHOLD = 10.5; // Higher threshold for real walking motion
const MIN_STEP_INTERVAL = 400; // Minimum 400ms between steps (max ~150 steps/min)
const MAX_STEP_INTERVAL = 2000; // Maximum 2s between steps for continuous walking
const SMOOTHING_FACTOR = 0.3; // Low-pass filter for noise reduction

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

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export const useStepTracker = () => {
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [isTracking, setIsTracking] = useState(false);
  const [weeklyData, setWeeklyData] = useState<StepData[]>([]);
  const [monthlyData, setMonthlyData] = useState<StepData[]>([]);
  const [allTimeData, setAllTimeData] = useState<StepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  
  // Improved step detection refs
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const smoothedMagnitude = useRef(0);
  const lastStepTime = useRef(0);
  const isPeakPhase = useRef(false);
  const peakValue = useRef(0);
  const valleyValue = useRef(Infinity);
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

  // Load all-time data for achievements
  const loadAllTimeData = useCallback(async () => {
    const { data, error } = await supabase
      .from("step_tracking")
      .select("*")
      .eq("user_id", FIXED_USER_ID)
      .order("date", { ascending: true });

    if (data && !error) {
      setAllTimeData(data as StepData[]);
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

  // Improved step detection algorithm using peak detection
  const detectStep = useCallback((acceleration: { x: number; y: number; z: number }) => {
    const now = Date.now();
    const timeSinceLastStep = now - lastStepTime.current;
    
    // Calculate magnitude of acceleration vector
    const { x, y, z } = acceleration;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Apply low-pass filter to smooth out noise
    smoothedMagnitude.current = 
      SMOOTHING_FACTOR * magnitude + 
      (1 - SMOOTHING_FACTOR) * smoothedMagnitude.current;
    
    const smoothed = smoothedMagnitude.current;
    
    // Peak detection algorithm
    if (isPeakPhase.current) {
      // Looking for peak
      if (smoothed > peakValue.current) {
        peakValue.current = smoothed;
      } else if (smoothed < peakValue.current - 1.5) {
        // Found peak, now looking for valley
        isPeakPhase.current = false;
        valleyValue.current = smoothed;
      }
    } else {
      // Looking for valley
      if (smoothed < valleyValue.current) {
        valleyValue.current = smoothed;
      } else if (smoothed > valleyValue.current + 1.5) {
        // Found valley, check if this constitutes a valid step
        const peakToValley = peakValue.current - valleyValue.current;
        
        // Valid step: sufficient amplitude and timing
        if (
          peakToValley > STEP_THRESHOLD &&
          timeSinceLastStep > MIN_STEP_INTERVAL &&
          timeSinceLastStep < MAX_STEP_INTERVAL
        ) {
          setTodaySteps(prev => {
            const newSteps = prev + 1;
            saveStepData(newSteps);
            return newSteps;
          });
          lastStepTime.current = now;
        } else if (timeSinceLastStep >= MAX_STEP_INTERVAL && peakToValley > STEP_THRESHOLD) {
          // First step after pause - more lenient timing
          setTodaySteps(prev => {
            const newSteps = prev + 1;
            saveStepData(newSteps);
            return newSteps;
          });
          lastStepTime.current = now;
        }
        
        // Reset for next cycle
        isPeakPhase.current = true;
        peakValue.current = smoothed;
        valleyValue.current = Infinity;
      }
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

  // Calculate achievements
  const totalAllTimeSteps = allTimeData.reduce((sum, d) => sum + d.steps, 0) + todaySteps;
  
  // Calculate current streak (consecutive days meeting goal)
  const calculateStreak = useCallback(() => {
    const sortedData = [...allTimeData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Check if today's goal is met
    if (todaySteps >= stepGoal) {
      streak = 1;
    }
    
    // Count consecutive days before today
    for (let i = 0; i < sortedData.length; i++) {
      const data = sortedData[i];
      if (data.date === today) continue;
      
      if (data.steps >= data.step_goal) {
        // Check if this day is consecutive
        const expectedDate = format(
          new Date(Date.now() - (streak + 1) * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        );
        if (data.date === expectedDate) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  }, [allTimeData, todaySteps, stepGoal]);

  const currentStreak = calculateStreak();

  // Generate achievements
  const achievements: Achievement[] = [
    {
      id: "first_steps",
      name: "First Steps",
      description: "Track your first 100 steps",
      icon: "👶",
      unlocked: totalAllTimeSteps >= 100,
      progress: Math.min(totalAllTimeSteps, 100),
      target: 100,
    },
    {
      id: "daily_goal",
      name: "Goal Getter",
      description: "Reach your daily step goal",
      icon: "🎯",
      unlocked: todaySteps >= stepGoal,
      progress: todaySteps,
      target: stepGoal,
    },
    {
      id: "streak_3",
      name: "3-Day Streak",
      description: "Meet your goal 3 days in a row",
      icon: "🔥",
      unlocked: currentStreak >= 3,
      progress: currentStreak,
      target: 3,
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "Meet your goal 7 days in a row",
      icon: "⚡",
      unlocked: currentStreak >= 7,
      progress: currentStreak,
      target: 7,
    },
    {
      id: "streak_30",
      name: "Monthly Master",
      description: "Meet your goal 30 days in a row",
      icon: "👑",
      unlocked: currentStreak >= 30,
      progress: currentStreak,
      target: 30,
    },
    {
      id: "steps_10k",
      name: "10K Club",
      description: "Walk 10,000 total steps",
      icon: "🏃",
      unlocked: totalAllTimeSteps >= 10000,
      progress: Math.min(totalAllTimeSteps, 10000),
      target: 10000,
    },
    {
      id: "steps_50k",
      name: "50K Explorer",
      description: "Walk 50,000 total steps",
      icon: "🌟",
      unlocked: totalAllTimeSteps >= 50000,
      progress: Math.min(totalAllTimeSteps, 50000),
      target: 50000,
    },
    {
      id: "steps_100k",
      name: "Century Walker",
      description: "Walk 100,000 total steps",
      icon: "💎",
      unlocked: totalAllTimeSteps >= 100000,
      progress: Math.min(totalAllTimeSteps, 100000),
      target: 100000,
    },
    {
      id: "steps_500k",
      name: "Half Million",
      description: "Walk 500,000 total steps",
      icon: "🏆",
      unlocked: totalAllTimeSteps >= 500000,
      progress: Math.min(totalAllTimeSteps, 500000),
      target: 500000,
    },
    {
      id: "steps_1m",
      name: "Million Steps",
      description: "Walk 1,000,000 total steps",
      icon: "🌈",
      unlocked: totalAllTimeSteps >= 1000000,
      progress: Math.min(totalAllTimeSteps, 1000000),
      target: 1000000,
    },
  ];

  // Load data and auto-start tracking on mount
  useEffect(() => {
    loadTodayData();
    loadWeeklyData();
    loadMonthlyData();
    loadAllTimeData();
    
    // Auto-start step tracking
    startTracking();
  }, [loadTodayData, loadWeeklyData, loadMonthlyData, loadAllTimeData]);

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
  }, [loadTodayData, loadWeeklyData, loadMonthlyData, loadAllTimeData]);

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
    currentStreak,
    totalAllTimeSteps,
    achievements,
    startTracking,
    stopTracking,
    updateStepGoal,
    addStepsManually,
    resetTodaySteps,
  };
};
