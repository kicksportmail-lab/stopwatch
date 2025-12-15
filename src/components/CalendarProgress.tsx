import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Flame, Target, Check, CalendarDays, Play, Pause, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  onDeleteTask
}: CalendarProgressProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { weeklyGoalMs } = useDailyGoal();
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');

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
    if (!newTaskName.trim() || !onCreateTask) return;
    const hours = parseInt(targetHours) || 0;
    const minutes = parseInt(targetMinutes) || 0;
    const targetTimeMs = (hours * 3600 + minutes * 60) * 1000;
    if (targetTimeMs === 0) return;

    await onCreateTask(newTaskName, targetTimeMs);
    setNewTaskName('');
    setTargetHours('');
    setTargetMinutes('');
    setShowCreateTaskDialog(false);
  };

  const handleToggleComplete = async (task: Task) => {
    if (onUpdateTask) {
      await onUpdateTask(task.id, { is_completed: !task.is_completed });
    }
  };

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Task Management Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-chart-1/20">
              <Clock className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Tasks</p>
              <p className="text-sm text-muted-foreground">Track time on your tasks</p>
            </div>
          </div>
          <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Set a task name and target time to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="e.g., Study React"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
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
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreateTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No tasks yet. Create your first task to start tracking!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isActiveTask = currentTaskId === task.id;
              const currentTaskTime = isActiveTask ? taskSessionTime : 0;
              const displayTime = task.total_time_spent_ms + currentTaskTime;
              const progress = Math.min((displayTime / task.target_time_ms) * 100, 100);
              const overtime = displayTime > task.target_time_ms;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-4 rounded-xl border border-border/50 transition-all",
                    task.is_completed && "opacity-60",
                    isActiveTask && isStopwatchRunning && "ring-2 ring-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="hover:opacity-70 transition-opacity flex-shrink-0"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={cn(
                        "font-medium truncate",
                        task.is_completed && "line-through text-muted-foreground"
                      )}>
                        {task.name}
                      </span>
                      {isActiveTask && isStopwatchRunning && (
                        <Badge variant="default" className="bg-primary animate-pulse gap-1 flex-shrink-0">
                          <Play className="h-3 w-3" />
                          Running
                        </Badge>
                      )}
                      {isActiveTask && !isStopwatchRunning && currentStopwatchTime > 0 && (
                        <Badge variant="secondary" className="gap-1 flex-shrink-0">
                          <Pause className="h-3 w-3" />
                          Paused
                        </Badge>
                      )}
                    </div>
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
                          className="gap-1 h-8"
                        >
                          {isActiveTask && isStopwatchRunning ? (
                            <><Pause className="h-3 w-3" /> Pause</>
                          ) : isActiveTask ? (
                            <><Play className="h-3 w-3" /> Resume</>
                          ) : currentTaskId ? (
                            <><Play className="h-3 w-3" /> Switch</>
                          ) : (
                            <><Play className="h-3 w-3" /> Start</>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTask?.(task.id)}
                        className="text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Progress</span>
                        <Badge
                          variant={overtime ? "destructive" : progress >= 100 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {Math.round(progress)}%
                        </Badge>
                      </div>
                      <span className="font-mono text-xs">
                        {formatTime(displayTime)} / {formatTime(task.target_time_ms)}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn("h-2", overtime && "bg-destructive/20")}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {overtime && (
                        <Badge variant="destructive" className="text-xs">
                          +{formatTime(displayTime - task.target_time_ms)} overtime
                        </Badge>
                      )}
                      {!task.is_completed && progress < 100 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {formatTime(task.target_time_ms - displayTime)} remaining
                        </Badge>
                      )}
                      {task.is_completed && (
                        <Badge variant="default" className="text-xs bg-primary">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
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
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-primary/20 mb-2">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-xl font-bold text-foreground">{currentStreak}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-green-500/20 mb-2">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">Goals Met</p>
            <p className="text-xl font-bold text-foreground">{daysGoalMet}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-accent/20 mb-2">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold text-foreground">{formatTimeShort(monthTotal)}</p>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayTime = timeByDay.get(dayKey) || 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const goalMet = dayTime >= dailyGoalMs;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                  "relative aspect-square p-1 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isTodayDate && !isSelected && "ring-1 ring-primary/50",
                  goalMet && "bg-green-500/10",
                  "hover:bg-secondary/50"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary font-bold",
                    goalMet && !isTodayDate && "text-green-500",
                    !isTodayDate && !goalMet && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTime > 0 && (
                  goalMet ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <div
                      className={cn(
                        "w-6 h-1.5 rounded-full transition-all",
                        getIntensity(dayTime)
                      )}
                    />
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            <span>Goal met</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-full bg-primary/60" />
            <span>Activity</span>
          </div>
        </div>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>

          {selectedDateSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No sessions recorded on this day
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground">Total Time</span>
                <span className="text-xl font-bold text-primary">
                  {formatTime(
                    selectedDateSessions.reduce((acc, s) => acc + s.time, 0)
                  )}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDateSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30"
                  >
                    <div>
                      {session.name && (
                        <p className="text-sm font-medium text-foreground">
                          {session.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.date), "h:mm a")}
                      </p>
                    </div>
                    <span className="font-mono text-foreground">
                      {formatTime(session.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
