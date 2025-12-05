import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Flame, Target, Check, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDailyGoal } from "@/hooks/useDailyGoal";

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
}

interface CalendarProgressProps {
  sessions: HistorySession[];
}

export const CalendarProgress = ({ sessions }: CalendarProgressProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalHours, setGoalHours] = useState("1");
  const [goalMinutes, setGoalMinutes] = useState("0");
  
  const { dailyGoalMs, updateDailyGoal } = useDailyGoal();

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

  // Today's progress
  const todayTime = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    return timeByDay.get(todayKey) || 0;
  }, [timeByDay]);

  const todayProgress = Math.min((todayTime / dailyGoalMs) * 100, 100);

  const handleSaveGoal = () => {
    const hours = parseInt(goalHours) || 0;
    const minutes = parseInt(goalMinutes) || 0;
    const newGoalMs = (hours * 3600000) + (minutes * 60000);
    if (newGoalMs > 0) {
      updateDailyGoal(newGoalMs);
      setGoalDialogOpen(false);
    }
  };

  const openGoalDialog = () => {
    const hours = Math.floor(dailyGoalMs / 3600000);
    const minutes = Math.floor((dailyGoalMs % 3600000) / 60000);
    setGoalHours(hours.toString());
    setGoalMinutes(minutes.toString());
    setGoalDialogOpen(true);
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
      {/* Today's Progress */}
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6">
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
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={openGoalDialog}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Daily Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      max="24"
                      value={goalHours}
                      onChange={(e) => setGoalHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minutes">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={goalMinutes}
                      onChange={(e) => setGoalMinutes(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveGoal} className="w-full">
                  Save Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-primary/20 mb-2">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-xl font-bold text-foreground">{currentStreak}</p>
          </div>
        </Card>

        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-xl bg-green-500/20 mb-2">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">Goals Met</p>
            <p className="text-xl font-bold text-foreground">{daysGoalMet}</p>
          </div>
        </Card>

        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
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
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6">
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
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6 animate-scale-in">
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
