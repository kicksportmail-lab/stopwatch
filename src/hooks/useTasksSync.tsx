import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Task {
  id: string;
  name: string;
  target_time_ms: number;
  total_time_spent_ms: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  last_reset_date?: string;
}

const TASK_RESET_KEY = 'tasks_last_reset_date';
const STOPWATCH_RESET_KEY = 'stopwatch_last_reset_date';

export const useTasksSync = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Save current stopwatch to history and reset for new day
  const resetStopwatchForNewDay = useCallback(async () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const lastStopwatchReset = localStorage.getItem(STOPWATCH_RESET_KEY);

    if (lastStopwatchReset === todayKey) {
      return; // Already reset today
    }

    // First, get the current stopwatch state to save to history
    const { data: stopwatchState, error: fetchError } = await supabase
      .from('stopwatch_state')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching stopwatch state:', fetchError);
    }

    // Calculate total time and save to history if there was any time tracked
    if (stopwatchState) {
      let totalTime = stopwatchState.accumulated_time || 0;
      
      // If it was running, add elapsed time since start
      if (stopwatchState.is_running && stopwatchState.start_timestamp) {
        totalTime += Date.now() - stopwatchState.start_timestamp;
      }

      // Only save to history if there's time to save
      if (totalTime > 0) {
        const { error: historyError } = await supabase
          .from('stopwatch_sessions')
          .insert({
            time: totalTime,
            laps: stopwatchState.laps || [],
            task_id: stopwatchState.task_id,
            name: 'Auto-saved (day reset)',
          });

        if (historyError) {
          console.error('Error saving to history:', historyError);
        }
      }
    }

    // Reset stopwatch state in database
    const { error } = await supabase
      .from('stopwatch_state')
      .update({
        accumulated_time: 0,
        is_running: false,
        start_timestamp: null,
        laps: [],
        task_id: null,
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      console.error('Error resetting stopwatch:', error);
    }

    localStorage.setItem(STOPWATCH_RESET_KEY, todayKey);
  }, []);

  // Check if tasks need daily reset
  const checkAndResetTasks = useCallback(async (loadedTasks: Task[]) => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const lastResetDate = localStorage.getItem(TASK_RESET_KEY);

    // If already reset today, return tasks as-is
    if (lastResetDate === todayKey) {
      return loadedTasks;
    }

    // Reset ALL tasks for the new day (not just active ones)
    const allTaskIds = loadedTasks.map(t => t.id);

    if (allTaskIds.length > 0) {
      // Reset all tasks in database
      const { error } = await supabase
        .from('tasks')
        .update({
          total_time_spent_ms: 0,
          is_completed: false,
        })
        .in('id', allTaskIds);

      if (error) {
        console.error('Error resetting tasks:', error);
      } else {
        // Update local state - reset ALL tasks
        loadedTasks = loadedTasks.map(task => ({
          ...task,
          total_time_spent_ms: 0,
          is_completed: false,
        }));
      }
    }

    // Also reset stopwatch for new day
    await resetStopwatchForNewDay();

    // Mark today as reset
    localStorage.setItem(TASK_RESET_KEY, todayKey);
    return loadedTasks;
  }, [resetStopwatchForNewDay]);

  // Load initial tasks
  useEffect(() => {
    const loadTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      // Check and reset tasks if new day
      const processedTasks = await checkAndResetTasks(data || []);
      setTasks(processedTasks);
    };

    loadTasks();
  }, [checkAndResetTasks]);

  // Listen for optimistic task time updates (from switching tasks)
  useEffect(() => {
    const handler = (e: CustomEvent<{ taskId: string; newTime: number }>) => {
      const { taskId, newTime } = e.detail;
      setTasks(current =>
        current.map(t =>
          t.id === taskId
            ? { ...t, total_time_spent_ms: newTime }
            : t
        )
      );
    };
    window.addEventListener('task-time-updated', handler as EventListener);
    return () => window.removeEventListener('task-time-updated', handler as EventListener);
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          setTasks((current) => [payload.new as Task, ...current]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          setTasks((current) =>
            current.map((task) =>
              task.id === payload.new.id ? (payload.new as Task) : task
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          setTasks((current) =>
            current.filter((task) => task.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createTask = async (name: string, targetTimeMs: number) => {
    const { error } = await supabase.from('tasks').insert({
      name,
      target_time_ms: targetTimeMs,
      total_time_spent_ms: 0,
      is_completed: false,
    });

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const addTimeToTask = async (taskId: string, timeMs: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, {
      total_time_spent_ms: task.total_time_spent_ms + timeMs,
    });
  };

  return {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    addTimeToTask,
  };
};
