import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  name: string;
  target_time_ms: number;
  total_time_spent_ms: number;
  is_completed: boolean;
  created_at: string;
}

export const useTasksSync = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

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

      setTasks(data || []);
    };

    loadTasks();
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
