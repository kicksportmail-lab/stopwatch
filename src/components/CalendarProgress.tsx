import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Flame, Target, Check, CalendarDays, Play, Pause, Plus, Trash2, CheckCircle2, Circle, Edit2, Search, Filter, X, Sparkles, TrendingUp, Zap, Loader2, Star, Copy, MoreVertical, Grid3x3, List, Calendar, BarChart3, Activity, ArrowLeft, ArrowRight, Home, Maximize2, Minimize2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDailyGoal } from "@/hooks/useDailyGoal";
import { Task } from "@/hooks/useTasksSync";
import { useTodos } from "@/hooks/useTodos";
import { ListTodo } from "lucide-react";
import { AnalogClock } from "./AnalogClock";

interface TodoListProps {
  selectedDate: Date | null;
}

const TodoList = ({ selectedDate }: TodoListProps) => {
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo } = useTodos(selectedDate);
  const [newTodo, setNewTodo] = useState("");

  const handleAdd = async () => {
    if (newTodo.trim()) {
      await addTodo(newTodo);
      setNewTodo("");
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2rem]">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <ListTodo className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">To-Do List</h3>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Today"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleAdd} size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-8"
            >
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </motion.div>
          ) : todos.length === 0 ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-muted-foreground py-8 font-medium italic"
            >
              No to-dos for this day
            </motion.p>
          ) : (
            todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                  todo.is_completed
                    ? "bg-secondary/20 border-transparent opacity-60"
                    : "bg-card border-border/50 shadow-sm hover:shadow-md hover:border-primary/20"
                )}
              >
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleTodo(todo.id, !todo.is_completed)}
                  className="flex-shrink-0"
                >
                  {todo.is_completed ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </motion.button>
                <span
                  className={cn(
                    "flex-1 font-semibold tracking-tight text-sm",
                    todo.is_completed && "line-through text-muted-foreground"
                  )}
                >
                  {todo.title}
                </span>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};


interface LapTime {
  id: number;
  time: number;
  split: number;
}

interface HistorySession {
  id: string;
  time: number;
  laps: LapTime[];
  date: string;
  name?: string;
  task_id?: string | null;
}

interface CalendarProgressProps {
  sessions: HistorySession[];
  tasks?: Task[];
  currentStopwatchTime?: number;
  isStopwatchRunning?: boolean;
  currentTaskId?: string | null;
  taskSessionTime?: number;
  onSelectTask?: (taskId: string | null) => void;
  onStartStopwatch?: () => void;
  onCreateTask?: (name: string, targetTimeMs: number) => Promise<void>;
  onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date | null) => void;
  showDayDetails?: boolean;
  onShowDayDetails?: (show: boolean) => void;
}

export const CalendarProgress = ({
  sessions,
  tasks = [],
  currentStopwatchTime = 0,
  isStopwatchRunning = false,
  currentTaskId = null,
  taskSessionTime = 0,
  onSelectTask,
  onStartStopwatch,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onDateSelect,
  onShowDayDetails
}: CalendarProgressProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const { weeklyGoalMs } = useDailyGoal();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskHours, setEditTaskHours] = useState('');
  const [editTaskMinutes, setEditTaskMinutes] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState<string | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Calculate daily goal automatically from tasks
  const dailyGoalMs = useMemo(() => {
    return tasks.reduce((acc, task) => acc + task.target_time_ms, 0);
  }, [tasks]);

  // Aggregate time by day
  const timeByDay = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      const dayKey = format(new Date(session.date), "yyyy-MM-dd");
      map.set(dayKey, (map.get(dayKey) || 0) + session.time);
    });
    return map;
  }, [sessions]);

  // Get sessions for selected date
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((session) =>
      isSameDay(new Date(session.date), selectedDate)
    );
  }, [sessions, selectedDate]);

  // Calculate max time for color intensity
  const maxTime = useMemo(() => {
    return Math.max(...Array.from(timeByDay.values()), 1);
  }, [timeByDay]);

  // Calculate streak (only counts days where goal was met)
  const currentStreak = useMemo(() => {
    // If no daily goal set, streak is 0
    if (dailyGoalMs === 0) return 0;

    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dayKey = format(checkDate, "yyyy-MM-dd");
      const dayTime = timeByDay.get(dayKey) || 0;
      if (dayTime >= dailyGoalMs) {
        streak++;
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      } else if (streak === 0 && !isToday(checkDate)) {
        // If today hasn't met goal yet, check yesterday
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      } else {
        break;
      }
    }
    return streak;
  }, [timeByDay, dailyGoalMs]);

  // Count days goal was met this month
  const daysGoalMet = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let count = 0;
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= monthStart && sessionDate <= monthEnd) {
        const dayKey = format(sessionDate, "yyyy-MM-dd");
        const dayTime = timeByDay.get(dayKey) || 0;
        if (dayTime >= dailyGoalMs) {
          // Only count each day once
          const alreadyCounted = sessions.some(
            (s) =>
              format(new Date(s.date), "yyyy-MM-dd") === dayKey &&
              sessions.indexOf(s) < sessions.indexOf(session)
          );
          if (!alreadyCounted) count++;
        }
      }
    });
    // Recalculate properly
    let uniqueDays = 0;
    const counted = new Set<string>();
    timeByDay.forEach((time, dayKey) => {
      const date = new Date(dayKey);
      if (date >= monthStart && date <= monthEnd && time >= dailyGoalMs) {
        if (!counted.has(dayKey)) {
          counted.add(dayKey);
          uniqueDays++;
        }
      }
    });
    return uniqueDays;
  }, [sessions, currentMonth, timeByDay, dailyGoalMs]);

  // Get total time this month
  const monthTotal = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let total = 0;
    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= monthStart && sessionDate <= monthEnd) {
        total += session.time;
      }
    });
    return total;
  }, [sessions, currentMonth]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTimeShort = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Today's progress - use tasks' total_time_spent_ms (which resets daily) + current stopwatch time
  const todayTime = useMemo(() => {
    // Sum all tasks' current time (tasks reset daily)
    const tasksTime = tasks.reduce((sum, task) => sum + task.total_time_spent_ms, 0);
    // Add current stopwatch time if running
    return tasksTime + currentStopwatchTime;
  }, [tasks, currentStopwatchTime]);

  const todayProgress = dailyGoalMs > 0 ? Math.min((todayTime / dailyGoalMs) * 100, 100) : 0;

  // Get task breakdown for today - show all tasks with their progress
  const todayTaskBreakdown = useMemo(() => {
    const breakdown: { taskId: string | null; taskName: string; time: number; targetTime: number }[] = [];

    // Show all tasks (including those with 0 time spent)
    tasks.forEach((task) => {
      breakdown.push({
        taskId: task.id,
        taskName: task.name,
        time: task.total_time_spent_ms,
        targetTime: task.target_time_ms,
      });
    });

    // Sort by time descending (tasks with time first, then by name)
    return breakdown.sort((a, b) => {
      if (a.time !== b.time) return b.time - a.time;
      return a.taskName.localeCompare(b.taskName);
    });
  }, [tasks]);

  // Weekly progress - cumulative from start of current week (includes current stopwatch time)
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let totalWeekTime = 0;
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      totalWeekTime += timeByDay.get(dayKey) || 0;
    });

    // Add current stopwatch time to week total
    totalWeekTime += currentStopwatchTime;

    return {
      time: totalWeekTime,
      percentage: Math.min((totalWeekTime / weeklyGoalMs) * 100, 100),
      daysTracked: weekDays.filter(day => {
        const dayKey = format(day, "yyyy-MM-dd");
        const dayTime = timeByDay.get(dayKey) || 0;
        // Include today if stopwatch is running
        if (dayKey === todayKey && currentStopwatchTime > 0) return true;
        return dayTime > 0;
      }).length,
    };
  }, [timeByDay, weeklyGoalMs, currentStopwatchTime]);



  const handleCreateTask = async () => {
    if (!newTaskName.trim() || !onCreateTask) {
      toast({
        title: "Validation Error",
        description: "Please enter a task name",
        variant: "destructive",
      });
      return;
    }

    const hours = parseInt(targetHours) || 0;
    const minutes = parseInt(targetMinutes) || 0;
    const targetTimeMs = (hours * 3600 + minutes * 60) * 1000;

    if (targetTimeMs === 0) {
      toast({
        title: "Validation Error",
        description: "Please set a target time (hours or minutes)",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate task name
    const duplicateTask = tasks.find(
      t => t.name.toLowerCase().trim() === newTaskName.toLowerCase().trim()
    );
    if (duplicateTask) {
      toast({
        title: "Duplicate Task",
        description: `A task named "${duplicateTask.name}" already exists`,
        variant: "destructive",
      });
      return;
    }

    if (isCreatingTask) return; // Prevent duplicate submissions

    setIsCreatingTask(true);
    try {
      await onCreateTask(newTaskName.trim(), targetTimeMs);
      toast({
        title: "Task Created",
        description: `"${newTaskName.trim()}" has been created successfully`,
      });
      setNewTaskName('');
      setTargetHours('');
      setTargetMinutes('');
      setShowCreateTaskDialog(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error Creating Task",
        description: error?.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!onUpdateTask) return;

    try {
      await onUpdateTask(task.id, { is_completed: !task.is_completed });
      toast({
        title: task.is_completed ? "Task Reopened" : "Task Completed",
        description: `"${task.name}" has been ${task.is_completed ? 'reopened' : 'marked as completed'}`,
      });
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!onDeleteTask) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (isDeletingTask) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingTask(taskId);
    try {
      await onDeleteTask(taskId);
      toast({
        title: "Task Deleted",
        description: `"${task.name}" has been deleted`,
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error Deleting Task",
        description: error?.message || "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTask(null);
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!onCreateTask) return;

    setIsCreatingTask(true);
    try {
      await onCreateTask(`${task.name} (Copy)`, task.target_time_ms);
      toast({
        title: "Task Duplicated",
        description: `"${task.name}" has been duplicated`,
      });
    } catch (error: any) {
      console.error('Error duplicating task:', error);
      toast({
        title: "Error Duplicating Task",
        description: error?.message || "Failed to duplicate task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleBulkComplete = async () => {
    if (!onUpdateTask || selectedTasks.size === 0) return;

    try {
      const promises = Array.from(selectedTasks).map(taskId =>
        onUpdateTask(taskId, { is_completed: true })
      );
      await Promise.all(promises);
      toast({
        title: "Tasks Completed",
        description: `${selectedTasks.size} task(s) marked as completed`,
      });
      setSelectedTasks(new Set());
    } catch (error: any) {
      console.error('Error completing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to complete tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!onDeleteTask || selectedTasks.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedTasks).map(taskId => onDeleteTask(taskId));
      await Promise.all(promises);
      toast({
        title: "Tasks Deleted",
        description: `${selectedTasks.size} task(s) deleted`,
      });
      setSelectedTasks(new Set());
    } catch (error: any) {
      console.error('Error deleting tasks:', error);
      toast({
        title: "Error",
        description: "Failed to delete tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    const hours = Math.floor(task.target_time_ms / 3600000);
    const minutes = Math.floor((task.target_time_ms % 3600000) / 60000);
    setEditTaskHours(hours.toString());
    setEditTaskMinutes(minutes.toString());
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!onUpdateTask) return;

    if (!editTaskName.trim()) {
      toast({
        title: "Validation Error",
        description: "Task name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const hours = parseInt(editTaskHours) || 0;
    const minutes = parseInt(editTaskMinutes) || 0;
    const targetTimeMs = (hours * 3600 + minutes * 60) * 1000;

    if (targetTimeMs === 0) {
      toast({
        title: "Validation Error",
        description: "Please set a target time",
        variant: "destructive",
      });
      return;
    }

    if (isUpdatingTask) return;

    setIsUpdatingTask(taskId);
    try {
      await onUpdateTask(taskId, {
        name: editTaskName.trim(),
        target_time_ms: targetTimeMs,
      });
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
      setEditingTaskId(null);
      setEditTaskName('');
      setEditTaskHours('');
      setEditTaskMinutes('');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error Updating Task",
        description: error?.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTask(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTaskName('');
    setEditTaskHours('');
    setEditTaskMinutes('');
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(task => !task.is_completed);
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(task => task.is_completed);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(query)
      );
    }

    // Sort: active tasks first, then by progress, then by name
    return filtered.sort((a, b) => {
      const aIsActive = currentTaskId === a.id && isStopwatchRunning;
      const bIsActive = currentTaskId === b.id && isStopwatchRunning;
      if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;

      const aProgress = (a.total_time_spent_ms / a.target_time_ms) * 100;
      const bProgress = (b.total_time_spent_ms / b.target_time_ms) * 100;
      if (Math.abs(aProgress - bProgress) > 1) return bProgress - aProgress;

      return a.name.localeCompare(b.name);
    });
  }, [tasks, searchQuery, filterStatus, currentTaskId, isStopwatchRunning]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const active = tasks.filter(t => !t.is_completed).length;
    const totalTime = tasks.reduce((sum, t) => sum + t.total_time_spent_ms, 0);
    const totalTarget = tasks.reduce((sum, t) => sum + t.target_time_ms, 0);
    const overallProgress = totalTarget > 0 ? (totalTime / totalTarget) * 100 : 0;

    return { total, completed, active, totalTime, totalTarget, overallProgress };
  }, [tasks]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getIntensity = (time: number) => {
    const ratio = time / maxTime;
    if (ratio >= 0.75) return "bg-primary/90";
    if (ratio >= 0.5) return "bg-primary/60";
    if (ratio >= 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get week view days
  const weekViewDays = useMemo(() => {
    if (calendarView !== 'week') return [];
    const weekStart = startOfWeek(currentMonth);
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart) });
  }, [currentMonth, calendarView]);

  // Get day view
  const dayViewDate = useMemo(() => {
    if (calendarView !== 'day') return null;
    return currentMonth;
  }, [currentMonth, calendarView]);

  // Heatmap data for last 12 months
  const heatmapData = useMemo(() => {
    const data: { date: string; value: number }[] = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = format(date, "yyyy-MM-dd");
      const time = timeByDay.get(dayKey) || 0;
      data.push({ date: dayKey, value: time });
    }
    return data;
  }, [timeByDay]);

  // Activity timeline for selected date
  const activityTimeline = useMemo(() => {
    if (!selectedDate) return [];
    const daySessions = selectedDateSessions;
    return daySessions.map(session => ({
      time: new Date(session.date),
      duration: session.time,
      name: session.name || 'Session',
    })).sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [selectedDate, selectedDateSessions]);

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Task Management Section */}
      <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Task Manager
              </h2>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Track and manage your tasks efficiently</p>
            </div>
          </div>
          <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="gap-2 h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-border/50 backdrop-blur-2xl bg-card/80">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">Create New Task</DialogTitle>
                <DialogDescription>
                  Set a task name and target time to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label htmlFor="task-name" className="text-sm font-bold ml-1">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="e.g., Study React, Workout, Read Book"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                    className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold ml-1">Target Time</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Hours"
                        min="0"
                        value={targetHours}
                        onChange={(e) => setTargetHours(e.target.value)}
                        className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Minutes"
                        min="0"
                        max="59"
                        value={targetMinutes}
                        onChange={(e) => setTargetMinutes(e.target.value)}
                        className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest ml-1">Quick Time Presets</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[15, 30, 45, 60, 90, 120].map((mins) => {
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        return (
                          <motion.div key={mins} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs rounded-lg border-border/50 hover:bg-secondary/50 h-9 px-3"
                              onClick={() => {
                                setTargetHours(h.toString());
                                setTargetMinutes(m.toString());
                              }}
                            >
                              {h > 0 ? `${h}h ` : ''}{m > 0 ? `${m}m` : ''}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest ml-1">Task Templates</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Study Session', hours: 2, minutes: 0 },
                        { name: 'Workout', hours: 1, minutes: 0 },
                        { name: 'Reading', hours: 1, minutes: 30 },
                        { name: 'Coding', hours: 3, minutes: 0 },
                      ].map((template) => (
                        <motion.div key={template.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            key={template.name}
                            variant="outline"
                            size="sm"
                            className="text-xs justify-start rounded-xl border-border/50 hover:bg-secondary/50 h-10 w-full px-3"
                            onClick={() => {
                              setNewTaskName(template.name);
                              setTargetHours(template.hours.toString());
                              setTargetMinutes(template.minutes.toString());
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {template.name}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCreateTask}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div >

        {/* Task Statistics */}
        {
          tasks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <motion.div whileHover={{ y: -5 }} className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Tasks</span>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{taskStats.total}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Completed</span>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{taskStats.completed}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Active</span>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{taskStats.active}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Progress</span>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{Math.round(taskStats.overallProgress)}%</p>
              </motion.div>
            </div>
          )
        }

        {/* Search and Filter */}
        {
          tasks.length > 0 && (
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-2xl bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-secondary/50"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 p-1 bg-secondary/30 rounded-2xl border border-border/50">
                  {(['all', 'active', 'completed'] as const).map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={cn(
                        "capitalize rounded-xl h-10 px-4 transition-all duration-300",
                        filterStatus === status
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={bulkSelectMode ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "h-12 px-6 rounded-2xl gap-2 transition-all duration-300",
                      bulkSelectMode ? "bg-primary shadow-lg shadow-primary/20" : "border-border/50 hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setBulkSelectMode(!bulkSelectMode);
                      if (bulkSelectMode) {
                        setSelectedTasks(new Set());
                      }
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Select
                  </Button>
                </motion.div>
              </div>
              {/* Bulk Actions */}
              <AnimatePresence>
                {bulkSelectMode && selectedTasks.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5"
                  >
                    <span className="text-sm font-bold text-foreground">
                      {selectedTasks.size} task(s) selected
                    </span>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkComplete}
                        className="gap-2 rounded-xl border-border/50 hover:bg-secondary/50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="gap-2 rounded-xl border-border/50 hover:bg-destructive/10 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTasks(new Set());
                          setBulkSelectMode(false);
                        }}
                        className="rounded-xl"
                      >
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        }

        {
          tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-[2.5rem] bg-secondary/10"
            >
              <div className="p-6 rounded-full bg-primary/10 mb-6">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-foreground mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm font-medium">
                Create your first task to start tracking your time and achieving your goals!
              </p>
              <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="gap-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
                      <Plus className="h-5 w-5" />
                      Create Your First Task
                    </Button>
                  </motion.div>
                </DialogTrigger>
              </Dialog>
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-[2.5rem]"
            >
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No tasks match your search criteria</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-xl border-border/50 hover:bg-secondary/50"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredTasks.map((task) => {
                const isActiveTask = currentTaskId === task.id;
                const currentTaskTime = isActiveTask ? taskSessionTime : 0;
                const displayTime = task.total_time_spent_ms + currentTaskTime;
                const progress = Math.min((displayTime / task.target_time_ms) * 100, 100);
                const overtime = displayTime > task.target_time_ms;

                return (
                  <motion.div
                    key={task.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className={cn(
                      "group p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden",
                      task.is_completed
                        ? "bg-secondary/20 border-transparent opacity-60"
                        : "bg-card border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20",
                      isActiveTask && isStopwatchRunning && "ring-2 ring-primary ring-offset-4 ring-offset-background bg-primary/5 shadow-2xl shadow-primary/10"
                    )}
                  >
                    {isActiveTask && isStopwatchRunning && (
                      <motion.div
                        layoutId="active-task-glow"
                        className="absolute inset-0 bg-primary/5 animate-pulse-glow pointer-events-none"
                      />
                    )}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {bulkSelectMode && (
                          <button
                            onClick={() => toggleTaskSelection(task.id)}
                            className="flex-shrink-0"
                          >
                            <div className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                              selectedTasks.has(task.id)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/50 hover:border-primary"
                            )}>
                              {selectedTasks.has(task.id) && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className={cn(
                            "hover:scale-110 transition-all flex-shrink-0",
                            task.is_completed && "opacity-60"
                          )}
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        {editingTaskId === task.id ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              value={editTaskName}
                              onChange={(e) => setEditTaskName(e.target.value)}
                              className="text-base font-medium"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(task.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Hours"
                                value={editTaskHours}
                                onChange={(e) => setEditTaskHours(e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                placeholder="Minutes"
                                value={editTaskMinutes}
                                onChange={(e) => setEditTaskMinutes(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(task.id)}
                                className="gap-1"
                                disabled={isUpdatingTask === task.id}
                              >
                                {isUpdatingTask === task.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="gap-1"
                                disabled={isUpdatingTask === task.id}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={cn(
                              "font-semibold text-base truncate",
                              task.is_completed && "line-through text-muted-foreground"
                            )}>
                              {task.name}
                            </span>
                            {isActiveTask && isStopwatchRunning && (
                              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent animate-pulse gap-1.5 flex-shrink-0 shadow-md">
                                <Play className="h-3 w-3" />
                                Running
                              </Badge>
                            )}
                            {isActiveTask && !isStopwatchRunning && currentStopwatchTime > 0 && (
                              <Badge variant="secondary" className="gap-1.5 flex-shrink-0">
                                <Pause className="h-3 w-3" />
                                Paused
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      {editingTaskId !== task.id && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!task.is_completed && (
                            <Button
                              variant={isActiveTask ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isActiveTask && isStopwatchRunning) {
                                  onStartStopwatch?.();
                                } else if (isActiveTask && !isStopwatchRunning) {
                                  onStartStopwatch?.();
                                } else {
                                  onSelectTask?.(task.id);
                                  if (!isStopwatchRunning) {
                                    onStartStopwatch?.();
                                  }
                                }
                              }}
                              className={cn(
                                "gap-1.5 h-8 transition-all",
                                isActiveTask && "bg-gradient-to-r from-primary to-accent shadow-md"
                              )}
                            >
                              {isActiveTask && isStopwatchRunning ? (
                                <><Pause className="h-3.5 w-3.5" /> Pause</>
                              ) : isActiveTask ? (
                                <><Play className="h-3.5 w-3.5" /> Resume</>
                              ) : currentTaskId ? (
                                <><Play className="h-3.5 w-3.5" /> Switch</>
                              ) : (
                                <><Play className="h-3.5 w-3.5" /> Start</>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(task)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={isDeletingTask === task.id || isUpdatingTask === task.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateTask(task)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={isDeletingTask === task.id || isUpdatingTask === task.id || isCreatingTask}
                            title="Duplicate task"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={isDeletingTask === task.id || isUpdatingTask === task.id}
                          >
                            {isDeletingTask === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {isActiveTask && isStopwatchRunning && (
                      <div className="bg-primary/10 rounded-lg p-3 text-center mb-3 flex flex-col items-center gap-2">
                        <AnalogClock
                          time={taskSessionTime}
                          isRunning={true}
                          size={120}
                          showDigital={false}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Session</p>
                          <p className="font-mono text-2xl font-bold text-primary">{formatTime(taskSessionTime)}</p>
                        </div>
                      </div>
                    )}

                    {editingTaskId !== task.id && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Progress</span>
                            <Badge
                              variant={overtime ? "destructive" : progress >= 100 ? "default" : "secondary"}
                              className={cn(
                                "text-xs font-semibold",
                                progress >= 100 && "bg-gradient-to-r from-green-500 to-emerald-500"
                              )}
                            >
                              {Math.round(progress)}%
                            </Badge>
                          </div>
                          <span className="font-mono text-sm font-semibold">
                            {formatTime(displayTime)} / {formatTime(task.target_time_ms)}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress
                            value={Math.min(progress, 100)}
                            className={cn(
                              "h-3 transition-all duration-500",
                              overtime && "bg-destructive/20",
                              progress >= 100 && "bg-gradient-to-r from-green-500 to-emerald-500"
                            )}
                          />
                          {progress > 100 && (
                            <div
                              className="absolute top-0 left-0 h-3 bg-destructive/30 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {overtime && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Clock className="h-3 w-3" />
                              +{formatTime(displayTime - task.target_time_ms)} overtime
                            </Badge>
                          )}
                          {!task.is_completed && progress < 100 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                              <Target className="h-3 w-3" />
                              {formatTime(task.target_time_ms - displayTime)} remaining
                            </Badge>
                          )}
                          {task.is_completed && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )
        }
      </Card >

      {/* To-Do List Section */}
      < TodoList selectedDate={selectedDate} />

      {/* Today's Progress */}
      <motion.div whileHover={{ y: -5 }} className="transition-all duration-500">
        <Card className="p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="h-32 w-32 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Today's Goal</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {formatTime(todayTime)} <span className="text-muted-foreground/30">/</span> {formatTime(dailyGoalMs)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-4 bg-secondary/30 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full shadow-lg",
                todayProgress >= 100 ? "bg-green-500" : "bg-primary"
              )}
            />
            {todayProgress >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow-sm"
              >
                <Check className="h-2 w-2 text-green-500" />
              </motion.div>
            )}
          </div>
          <p className="text-sm font-bold text-muted-foreground/60 text-center">
            {todayProgress >= 100
              ? "Goal achieved! Great job!"
              : `${Math.round(todayProgress)}% complete`}
          </p>
        </Card>
      </motion.div>

      {/* Weekly Progress Card */}
      <motion.div whileHover={{ y: -5 }} className="transition-all duration-500">
        <Card className="p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CalendarDays className="h-32 w-32 text-accent" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-accent/10">
                <CalendarDays className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">This Week</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {formatTime(weeklyProgress.time)} <span className="text-muted-foreground/30">/</span> {formatTime(weeklyGoalMs)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-muted-foreground/60">{weeklyProgress.daysTracked}/7 days</p>
            </div>
          </div>

          {/* Weekly progress bar */}
          <div className="relative h-4 bg-secondary/30 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyProgress.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full shadow-lg",
                weeklyProgress.percentage >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-primary to-primary/70"
              )}
            />
            {weeklyProgress.percentage >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 shadow-sm"
              >
                <Check className="h-2 w-2 text-green-500" />
              </motion.div>
            )}
          </div>
          <p className="text-sm font-bold text-muted-foreground/60 text-center">
            {weeklyProgress.percentage >= 100
              ? "Weekly goal achieved! Amazing work!"
              : `${Math.round(weeklyProgress.percentage)}% of weekly goal`}
          </p>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-6 rounded-[2rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-xl flex flex-col items-center text-center group">
            <div className="p-3 rounded-2xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Streak</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{currentStreak}</p>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-6 rounded-[2rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-xl flex flex-col items-center text-center group">
            <div className="p-3 rounded-2xl bg-green-500/10 mb-3 group-hover:bg-green-500/20 transition-colors">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Goals Met</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{daysGoalMet}</p>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-6 rounded-[2rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-xl flex flex-col items-center text-center group">
            <div className="p-3 rounded-2xl bg-accent/10 mb-3 group-hover:bg-accent/20 transition-colors">
              <Clock className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">This Month</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{formatTimeShort(monthTotal)}</p>
          </Card>
        </motion.div>
      </div>

      {/* Calendar Section - Integrated with History */}
      <Card className="p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Calendar View
                </h2>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                  {calendarView === 'month' && `${daysGoalMet} days goal met this month`}
                  {calendarView === 'week' && 'Weekly view'}
                  {calendarView === 'day' && format(currentMonth, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (calendarView === 'month') {
                    setCurrentMonth(subMonths(currentMonth, 1));
                  } else if (calendarView === 'week') {
                    setCurrentMonth(subMonths(currentMonth, 0.25));
                  } else {
                    setCurrentMonth(subMonths(currentMonth, 1 / 30));
                  }
                }}
                className="h-9 w-9 rounded-lg hover:bg-secondary/50"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (calendarView === 'month') {
                    setCurrentMonth(addMonths(currentMonth, 1));
                  } else if (calendarView === 'week') {
                    setCurrentMonth(addMonths(currentMonth, 0.25));
                  } else {
                    setCurrentMonth(addMonths(currentMonth, 1 / 30));
                  }
                }}
                className="h-9 w-9 rounded-lg hover:bg-secondary/50"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-secondary/30 rounded-2xl p-1 border border-border/50 flex-1 sm:flex-initial">
              {(['month', 'week', 'day'] as const).map((view) => (
                <Button
                  key={view}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarView(view)}
                  className={cn(
                    "h-10 px-6 rounded-xl flex-1 sm:flex-initial text-xs font-bold transition-all duration-300",
                    calendarView === view
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {view === 'month' && <Grid3x3 className="h-4 w-4 mr-2" />}
                  {view === 'week' && <List className="h-4 w-4 mr-2" />}
                  {view === 'day' && <Calendar className="h-4 w-4 mr-2" />}
                  <span className="capitalize">{view}</span>
                </Button>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-initial">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="gap-2 h-12 px-6 rounded-2xl border-border/50 hover:bg-secondary/50 font-bold w-full"
              >
                <Home className="h-4 w-4" />
                Today
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Week days header */}
        < div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2" >
          {
            weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 1)}</span>
              </div>
            ))
          }
        </div >

        {/* Calendar grid */}
        {
          calendarView === 'month' && (
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {days.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayTime = timeByDay.get(dayKey) || 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const goalMet = dayTime >= dailyGoalMs;
                const isHovered = hoveredDate && isSameDay(day, hoveredDate);
                const progressPercent = dailyGoalMs > 0 ? Math.min((dayTime / dailyGoalMs) * 100, 100) : 0;

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedDate(isSelected ? null : day);
                      setShowDayDetails(true);
                    }}
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={cn(
                      "relative aspect-square p-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 group touch-manipulation",
                      !isCurrentMonth && "opacity-20",
                      isSelected && "ring-2 ring-primary ring-offset-4 ring-offset-background shadow-xl bg-primary/5",
                      isTodayDate && !isSelected && "ring-1 ring-primary/30 bg-primary/5",
                      goalMet && "bg-green-500/10",
                      "hover:bg-secondary/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] sm:text-sm font-medium transition-colors leading-none",
                        isTodayDate && "text-primary font-bold",
                        goalMet && !isTodayDate && "text-green-500",
                        !isTodayDate && !goalMet && "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTime > 0 && (
                      <div className="w-full flex flex-col items-center gap-0.5">
                        {goalMet ? (
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                        ) : (
                          <>
                            <div
                              className={cn(
                                "w-full h-0.5 sm:h-1 rounded-full transition-all",
                                getIntensity(dayTime)
                              )}
                            />
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity hidden sm:block">
                              {formatTimeShort(dayTime)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {/* Progress indicator ring - hidden on mobile for better performance */}
                    {dailyGoalMs > 0 && dayTime > 0 && !goalMet && (
                      <div className="absolute inset-0 rounded-xl hidden sm:block">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-primary/10"
                          />
                          <motion.circle
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progressPercent / 100 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-primary"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div >
          )
        }

        {/* Week View */}
        {
          calendarView === 'week' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-7 gap-4"
            >
              {weekViewDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayTime = timeByDay.get(dayKey) || 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const goalMet = dayTime >= dailyGoalMs;
                const progress = dailyGoalMs > 0 ? Math.min((dayTime / dailyGoalMs) * 100, 100) : 0;

                return (
                  <motion.div
                    key={dayKey}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedDate(isSelected ? null : day);
                      setShowDayDetails(true);
                    }}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                      isSelected ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" : "bg-secondary/10 border-transparent",
                      isTodayDate && !isSelected && "border-primary/30",
                      goalMet && "bg-green-500/5 border-green-500/20"
                    )}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      {format(day, "EEE")}
                    </span>
                    <span className={cn(
                      "text-lg font-bold mb-3 tracking-tight",
                      isTodayDate ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="w-full h-16 relative flex items-end justify-center bg-secondary/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "w-full rounded-t-full shadow-sm",
                          goalMet ? "bg-green-500" : "bg-primary"
                        )}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/60 mt-2">
                      {formatTimeShort(dayTime)}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )
        }

        {/* Day View */}
        {
          calendarView === 'day' && dayViewDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row items-stretch gap-6">
                <Card className="flex-1 p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar className="h-32 w-32 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Selected Day</p>
                    <h3 className="text-3xl font-bold text-foreground tracking-tight mb-6">
                      {format(dayViewDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Time</p>
                        <p className="text-3xl font-bold text-primary tracking-tight">
                          {formatTime(timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Sessions</p>
                        <p className="text-3xl font-bold text-foreground tracking-tight">
                          {sessions.filter(s => isSameDay(new Date(s.date), dayViewDate)).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="w-full md:w-80 p-8 rounded-[2.5rem] bg-card/50 backdrop-blur-xl border-border/50 shadow-xl flex flex-col justify-center items-center text-center">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Goal Progress</h4>
                  <div className="relative w-24 h-24 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-secondary"
                      />
                      <motion.circle
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: Math.min(((timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0) / dailyGoalMs), 1) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-primary"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-foreground">
                        {Math.round(Math.min(((timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0) / dailyGoalMs) * 100, 100))}%
                      </span>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDate(dayViewDate);
                        setShowDayDetails(true);
                      }}
                      className="h-10 px-6 rounded-xl border-border/50 hover:bg-secondary/50 font-bold text-xs"
                    >
                      View Details
                    </Button>
                  </motion.div>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-2">Activity Timeline</h4>
                {activityTimeline.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activityTimeline.map((activity, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{activity.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            {format(activity.time, "h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-primary">{formatTime(activity.duration)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 rounded-[2.5rem] border-2 border-dashed border-border/50 bg-secondary/10 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-secondary/30 mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">No activity recorded for this day</p>
                  </Card>
                )}
              </div>
            </motion.div>
          )
        }

        {/* Legend and Heatmap */}
        <div className="mt-12 space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-6 p-4 rounded-2xl bg-secondary/10 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Goal met</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/20" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md border-2 border-primary/50" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today</span>
            </div>
          </div>

          {/* Activity Heatmap */}
          {calendarView === 'month' && (
            <div className="pt-8 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">Activity Heatmap</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Less</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "w-3 h-3 rounded-sm transition-all duration-300",
                          level === 0 ? "bg-secondary/20" :
                            level === 1 ? "bg-primary/20" :
                              level === 2 ? "bg-primary/40" :
                                level === 3 ? "bg-primary/70" :
                                  "bg-primary"
                        )}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {heatmapData.slice(-365).map((item, idx) => {
                  const intensity = maxTime > 0 ? Math.min((item.value / maxTime) * 4, 4) : 0;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.5, zIndex: 10 }}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-all cursor-pointer border border-transparent hover:border-primary/50",
                        intensity === 0 && "bg-secondary/20",
                        intensity > 0 && intensity <= 1 && "bg-primary/20",
                        intensity > 1 && intensity <= 2 && "bg-primary/40",
                        intensity > 2 && intensity <= 3 && "bg-primary/70",
                        intensity > 3 && "bg-primary"
                      )}
                      title={`${format(new Date(item.date), "MMM d, yyyy")}: ${formatTime(item.value)}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card >

      {/* Selected Day Details - Enhanced with History Integration */}
      {
        selectedDate && showDayDetails && (
          <Card className="p-4 sm:p-6 animate-scale-in bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-base sm:text-xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isToday(selectedDate) ? "default" : "outline"} className="text-xs">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, "EEEE")}
                  </Badge>
                  {selectedDateSessions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {(selectedDateSessions.reduce((acc, s) => acc + s.time, 0) >= dailyGoalMs) && (
                    <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-emerald-500">
                      <Check className="h-3 w-3 mr-1" />
                      Goal Met
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowDayDetails(false);
                  setSelectedDate(null);
                }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedDateSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No sessions recorded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start tracking time to see sessions here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Time</p>
                    <p className="text-sm sm:text-lg font-bold text-primary">
                      {formatTime(
                        selectedDateSessions.reduce((acc, s) => acc + s.time, 0)
                      )}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Sessions</p>
                    <p className="text-sm sm:text-lg font-bold text-accent">
                      {selectedDateSessions.length}
                    </p>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-3 rounded-lg border",
                    (selectedDateSessions.reduce((acc, s) => acc + s.time, 0) >= dailyGoalMs)
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-secondary/30 border-border/30"
                  )}>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Goal Status</p>
                    <p className={cn(
                      "text-sm sm:text-lg font-bold",
                      (selectedDateSessions.reduce((acc, s) => acc + s.time, 0) >= dailyGoalMs)
                        ? "text-green-500"
                        : "text-muted-foreground"
                    )}>
                      {(selectedDateSessions.reduce((acc, s) => acc + s.time, 0) >= dailyGoalMs) ? '✓ Met' : 'Not Met'}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Activity Timeline
                  </h4>
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {selectedDateSessions.map((session, idx) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {session.name && (
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {session.name}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(new Date(session.date), "h:mm a")}
                          </p>
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-foreground flex-shrink-0">
                          {formatTime(session.time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      }
    </motion.div>
  );
};
