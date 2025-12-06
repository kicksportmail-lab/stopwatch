import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const FIXED_GOAL_ID = "00000000-0000-0000-0000-000000000001";

export const useDailyGoal = () => {
  const [dailyGoalMs, setDailyGoalMs] = useState<number>(3600000); // Default 1 hour
  const [weeklyGoalMs, setWeeklyGoalMs] = useState<number>(25200000); // Default 7 hours (7 * 1 hour)
  const [isLoading, setIsLoading] = useState(true);

  // Load initial goal
  useEffect(() => {
    const loadGoal = async () => {
      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("id", FIXED_GOAL_ID)
        .maybeSingle();

      if (data && !error) {
        setDailyGoalMs(data.target_ms);
        // Weekly goal is 7x daily by default, but we can calculate it
        setWeeklyGoalMs(data.target_ms * 7);
      }
      setIsLoading(false);
    };

    loadGoal();
  }, []);

  // Listen to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("daily-goal-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_goals",
          filter: `id=eq.${FIXED_GOAL_ID}`,
        },
        (payload) => {
          if (payload.new && "target_ms" in payload.new) {
            const newMs = payload.new.target_ms as number;
            setDailyGoalMs(newMs);
            setWeeklyGoalMs(newMs * 7);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateDailyGoal = async (newGoalMs: number) => {
    setDailyGoalMs(newGoalMs);
    setWeeklyGoalMs(newGoalMs * 7);

    const { error } = await supabase
      .from("daily_goals")
      .upsert(
        {
          id: FIXED_GOAL_ID,
          target_ms: newGoalMs,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Error updating daily goal:", error);
    }
  };

  return {
    dailyGoalMs,
    weeklyGoalMs,
    updateDailyGoal,
    isLoading,
  };
};
