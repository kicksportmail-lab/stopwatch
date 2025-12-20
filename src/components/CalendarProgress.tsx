import { useState, useMemo } from "react";
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
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <ListTodo className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">To-Do List</p>
          <p className="text-sm text-muted-foreground">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Today"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No to-dos for this day</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-border/50 transition-all",
                todo.is_completed && "bg-secondary/30 opacity-60"
              )}
            >
              <button
                onClick={() => toggleTodo(todo.id, !todo.is_completed)}
                className="flex-shrink-0"
              >
                {todo.is_completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 font-medium",
                  todo.is_completed && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTodo(todo.id)}
                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
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
    <div className="space-y-4 animate-fade-in">
      {/* Task Management Section */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-md">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Task Manager
              </p>
              <p className="text-sm text-muted-foreground">Track and manage your tasks efficiently</p>
            </div>
          </div>
          <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Create New Task</DialogTitle>
                <DialogDescription>
                  Set a task name and target time to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="e.g., Study React, Workout, Read Book"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Time</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Hours"
                        min="0"
                        value={targetHours}
                        onChange={(e) => setTargetHours(e.target.value)}
                        className="text-base"
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
                        className="text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick Time Presets</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[15, 30, 45, 60, 90, 120].map((mins) => {
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        return (
                          <Button
                            key={mins}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setTargetHours(h.toString());
                              setTargetMinutes(m.toString());
                            }}
                          >
                            {h > 0 ? `${h}h ` : ''}{m > 0 ? `${m}m` : ''}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Task Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Study Session', hours: 2, minutes: 0 },
                        { name: 'Workout', hours: 1, minutes: 0 },
                        { name: 'Reading', hours: 1, minutes: 30 },
                        { name: 'Coding', hours: 3, minutes: 0 },
                      ].map((template) => (
                        <Button
                          key={template.name}
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start"
                          onClick={() => {
                            setNewTaskName(template.name);
                            setTargetHours(template.hours.toString());
                            setTargetMinutes(template.minutes.toString());
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCreateTask}
                  className="w-full bg-gradient-to-r from-primary to-accent"
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
        </div>

        {/* Task Statistics */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-lg font-bold text-foreground">{taskStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Done</span>
              </div>
              <p className="text-lg font-bold text-foreground">{taskStats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <p className="text-lg font-bold text-foreground">{taskStats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Progress</span>
              </div>
              <p className="text-lg font-bold text-foreground">{Math.round(taskStats.overallProgress)}%</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {tasks.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {status}
                  </Button>
                ))}
                <Button
                  variant={bulkSelectMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setBulkSelectMode(!bulkSelectMode);
                    if (bulkSelectMode) {
                      setSelectedTasks(new Set());
                    }
                  }}
                  title="Bulk select mode"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Select
                </Button>
              </div>
            </div>
            {/* Bulk Actions */}
            {bulkSelectMode && selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-in slide-in-from-top-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedTasks.size} task(s) selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkComplete}
                    className="gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTasks(new Set());
                      setBulkSelectMode(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-gradient-to-br from-background to-secondary/20">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Create your first task to start tracking your time and achieving your goals!
            </p>
            <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4" />
                  Create Your First Task
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tasks match your search criteria</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isActiveTask = currentTaskId === task.id;
              const currentTaskTime = isActiveTask ? taskSessionTime : 0;
              const displayTime = task.total_time_spent_ms + currentTaskTime;
              const progress = Math.min((displayTime / task.target_time_ms) * 100, 100);
              const overtime = displayTime > task.target_time_ms;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "group p-5 rounded-xl border transition-all duration-300 hover:shadow-lg",
                    task.is_completed
                      ? "bg-secondary/30 border-border/30 opacity-70"
                      : "bg-gradient-to-br from-card to-card/80 border-primary/20 hover:border-primary/40",
                    isActiveTask && isStopwatchRunning && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 shadow-lg shadow-primary/20"
                  )}
                >
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
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* To-Do List Section */}
      <TodoList selectedDate={selectedDate} />

      {/* Today's Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Goal</p>
              <p className="text-lg font-bold text-foreground">
                {formatTime(todayTime)} / {formatTime(dailyGoalMs)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                todayProgress >= 100 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          {todayProgress >= 100 && (
            <div className="absolute -right-1 -top-1 bg-green-500 rounded-full p-0.5">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {todayProgress >= 100
            ? "Goal achieved! Great job!"
            : `${Math.round(todayProgress)}% complete`}
        </p>
      </Card>

      {/* Weekly Progress Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20">
              <CalendarDays className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-lg font-bold text-foreground">
                {formatTime(weeklyProgress.time)} / {formatTime(weeklyGoalMs)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{weeklyProgress.daysTracked}/7 days tracked</p>
          </div>
        </div>

        {/* Weekly progress bar */}
        <div className="relative">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                weeklyProgress.percentage >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-primary to-primary/70"
              )}
              style={{ width: `${weeklyProgress.percentage}%` }}
            />
          </div>
          {weeklyProgress.percentage >= 100 && (
            <div className="absolute -right-1 -top-1 bg-green-500 rounded-full p-0.5">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {weeklyProgress.percentage >= 100
            ? "Weekly goal achieved! Amazing work!"
            : `${Math.round(weeklyProgress.percentage)}% of weekly goal`}
        </p>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/20 mb-1 sm:mb-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Streak</p>
            <p className="text-base sm:text-xl font-bold text-foreground">{currentStreak}</p>
          </div>
        </Card>

        <Card className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-green-500/20 mb-1 sm:mb-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Goals Met</p>
            <p className="text-base sm:text-xl font-bold text-foreground">{daysGoalMet}</p>
          </div>
        </Card>

        <Card className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-accent/20 mb-1 sm:mb-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">This Month</p>
            <p className="text-base sm:text-xl font-bold text-foreground">{formatTimeShort(monthTotal)}</p>
          </div>
        </Card>
      </div>

      {/* Calendar Section - Integrated with History */}
      <Card className="p-3 sm:p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Calendar View
                </h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {calendarView === 'month' && `${daysGoalMet} days goal met this month`}
                  {calendarView === 'week' && 'Weekly view'}
                  {calendarView === 'day' && format(currentMonth, "EEEE, MMMM d, yyyy")}
                  {selectedDate && ` • Selected: ${format(selectedDate, "MMM d")}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
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
                className="h-9 w-9 sm:h-8 sm:w-8"
              >
                <ChevronLeft className="h-4 w-4" />
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
                className="h-9 w-9 sm:h-8 sm:w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 sm:p-1 flex-1 sm:flex-initial">
              <Button
                variant={calendarView === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('month')}
                className="h-8 sm:h-7 px-2 sm:px-3 flex-1 sm:flex-initial text-xs"
              >
                <Grid3x3 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Month</span>
              </Button>
              <Button
                variant={calendarView === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('week')}
                className="h-8 sm:h-7 px-2 sm:px-3 flex-1 sm:flex-initial text-xs"
              >
                <List className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Week</span>
              </Button>
              <Button
                variant={calendarView === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('day')}
                className="h-8 sm:h-7 px-2 sm:px-3 flex-1 sm:flex-initial text-xs"
              >
                <Calendar className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Day</span>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="gap-1 h-8 sm:h-7 text-xs sm:text-sm"
            >
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Today</span>
              <span className="sm:hidden">Now</span>
            </Button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendarView === 'month' && (
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
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(isSelected ? null : day);
                    setShowDayDetails(true);
                  }}
                  onMouseEnter={() => setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    "relative aspect-square p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5 sm:gap-1 group touch-manipulation",
                    !isCurrentMonth && "opacity-30",
                    isSelected && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background shadow-md sm:shadow-lg",
                    isTodayDate && !isSelected && "ring-1 sm:ring-2 ring-primary/50 bg-primary/5",
                    goalMet && "bg-green-500/10",
                    isHovered && "scale-105 shadow-md",
                    "active:scale-95 hover:bg-secondary/50"
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
                    <div className="absolute inset-0 rounded-md sm:rounded-lg hidden sm:block">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary/20"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 45}%`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}%`}
                          className="text-primary transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {calendarView === 'week' && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            {weekViewDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayTime = timeByDay.get(dayKey) || 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const goalMet = dayTime >= dailyGoalMs;
              const daySessions = sessions.filter(s =>
                isSameDay(new Date(s.date), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(isSelected ? null : day);
                    setShowDayDetails(true);
                  }}
                  className={cn(
                    "p-2 sm:p-3 rounded-lg border transition-all cursor-pointer min-h-[100px] sm:min-h-[120px] touch-manipulation active:scale-95",
                    isSelected && "ring-2 ring-primary bg-primary/5",
                    isTodayDate && !isSelected && "border-primary/50 bg-primary/5",
                    goalMet && "bg-green-500/10 border-green-500/30",
                    "hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      isTodayDate && "text-primary font-bold"
                    )}>
                      <span className="hidden sm:inline">{format(day, "EEE")}</span>
                      <span className="sm:hidden">{format(day, "EEEEE")}</span>
                    </span>
                    <span className={cn(
                      "text-xs sm:text-sm font-semibold",
                      isTodayDate && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {goalMet && (
                      <div className="flex items-center gap-1 text-green-500 text-[10px] sm:text-xs">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">Goal met</span>
                        <span className="sm:hidden">✓</span>
                      </div>
                    )}
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatTimeShort(dayTime)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {daySessions.length} {daySessions.length !== 1 ? 'sess' : 'sess'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day View */}
        {calendarView === 'day' && dayViewDate && (
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                    {format(dayViewDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isToday(dayViewDate) ? 'Today' : format(dayViewDate, "EEEE")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(dayViewDate);
                    setShowDayDetails(true);
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  View Details
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Time</p>
                  <p className="text-base sm:text-xl font-bold text-foreground">
                    {formatTime(timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Sessions</p>
                  <p className="text-base sm:text-xl font-bold text-foreground">
                    {sessions.filter(s => isSameDay(new Date(s.date), dayViewDate)).length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Goal Status</p>
                  <p className={cn(
                    "text-base sm:text-xl font-bold",
                    (timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0) >= dailyGoalMs
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )}>
                    {(timeByDay.get(format(dayViewDate, "yyyy-MM-dd")) || 0) >= dailyGoalMs ? '✓ Met' : 'Not Met'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Activity Timeline</h4>
              {activityTimeline.length > 0 ? (
                <div className="space-y-2">
                  {activityTimeline.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{activity.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(activity.time, "h:mm a")}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-mono flex-shrink-0">{formatTime(activity.duration)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                  No activity recorded for this day
                </p>
              )}
            </div>
          </div>
        )}

        {/* Legend and Heatmap */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              <span>Goal met</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-full bg-primary/60" />
              <span>Activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-primary/50" />
              <span>Today</span>
            </div>
          </div>

          {/* Activity Heatmap */}
          {calendarView === 'month' && (
            <div className="pt-3 sm:pt-4 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">Activity Heatmap</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Less</span>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "w-2 h-2 sm:w-3 sm:h-3 rounded",
                          level === 0 && "bg-secondary/30",
                          level === 1 && "bg-primary/20",
                          level === 2 && "bg-primary/40",
                          level === 3 && "bg-primary/60",
                          level === 4 && "bg-primary"
                        )}
                      />
                    ))}
                  </div>
                  <span className="hidden sm:inline">More</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-0.5 sm:gap-1 max-h-24 sm:max-h-32 overflow-y-auto pb-2">
                {heatmapData.slice(-365).map((item, idx) => {
                  const intensity = maxTime > 0 ? Math.min((item.value / maxTime) * 4, 4) : 0;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded transition-all hover:scale-150 cursor-pointer border border-transparent hover:border-primary/50 touch-manipulation",
                        intensity === 0 && "bg-secondary/30",
                        intensity > 0 && intensity <= 1 && "bg-primary/20",
                        intensity > 1 && intensity <= 2 && "bg-primary/40",
                        intensity > 2 && intensity <= 3 && "bg-primary/60",
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
      </Card>

      {/* Selected Day Details - Enhanced with History Integration */}
      {selectedDate && showDayDetails && (
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
      )}
    </div>
  );
};
