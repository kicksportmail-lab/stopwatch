import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Flame } from "lucide-react";
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

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dayKey = format(checkDate, "yyyy-MM-dd");
      if (timeByDay.has(dayKey)) {
        streak++;
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      } else if (streak === 0 && !isToday(checkDate)) {
        // If today has no activity, check yesterday
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      } else {
        break;
      }
    }
    return streak;
  }, [timeByDay]);

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">
                {currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">{formatTime(monthTotal)}</p>
            </div>
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

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cn(
                  "relative aspect-square p-1 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isTodayDate && !isSelected && "ring-1 ring-primary/50",
                  "hover:bg-secondary/50"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary font-bold",
                    !isTodayDate && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTime > 0 && (
                  <div
                    className={cn(
                      "w-6 h-1.5 rounded-full transition-all",
                      getIntensity(dayTime)
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <div className="w-3 h-3 rounded bg-primary/40" />
            <div className="w-3 h-3 rounded bg-primary/60" />
            <div className="w-3 h-3 rounded bg-primary/90" />
          </div>
          <span>More</span>
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
