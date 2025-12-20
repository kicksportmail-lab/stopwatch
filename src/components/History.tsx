import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, BarChart3, Clock, Activity, TrendingUp, Check, ArrowDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";

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

export const History = ({
  sessions,
}: {
  sessions: HistorySession[];
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimeShort = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Calculate time by day for analytics
  const timeByDay = new Map<string, number>();
  sessions.forEach((session) => {
    const dayKey = format(new Date(session.date), "yyyy-MM-dd");
    timeByDay.set(dayKey, (timeByDay.get(dayKey) || 0) + session.time);
  });

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Name", "Laps Count"];
    const rows = sessions.map(session => [
      format(new Date(session.date), "MMM d, yyyy h:mm a"),
      formatTime(session.time),
      session.name || "Untitled Session",
      session.laps.length
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const dataBlob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stopwatch-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (sessions.length === 0) {
    return (
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8 text-center animate-fade-in">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No history yet. Complete a stopwatch session to see it here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* History & Analytics Section */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 shadow-md">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-foreground bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                History & Analytics
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">View your activity history and insights</p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="gap-2 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Analytics Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total Sessions</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">{sessions.length}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total Time</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {formatTimeShort(sessions.reduce((acc, s) => acc + s.time, 0))}
            </p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg/Session</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {sessions.length > 0 ? formatTimeShort(Math.round(sessions.reduce((acc, s) => acc + s.time, 0) / sessions.length)) : '0m'}
            </p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Best Day</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">
              {formatTimeShort(Math.max(...Array.from(timeByDay.values()), 0))}
            </p>
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="mb-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              All Sessions ({sessions.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const isSelectedSession = selectedDate && isSameDay(sessionDate, selectedDate);
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedDate(isSelectedSession ? null : sessionDate)}
                  className={cn(
                    "flex items-center gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-all touch-manipulation active:scale-95 group",
                    isSelectedSession
                      ? "bg-primary/10 border-primary/50 ring-2 ring-primary shadow-md"
                      : "bg-secondary/30 border-border/30 hover:bg-secondary/50 hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all",
                    isSelectedSession ? "bg-primary/30" : "bg-primary/20 group-hover:bg-primary/30"
                  )}>
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {session.name || 'Untitled Session'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(sessionDate, "MMM d, yyyy")}
                      </p>
                      <span className="text-[10px] text-muted-foreground/50">•</span>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(sessionDate, "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                      {formatTime(session.time)}
                    </span>
                    {session.laps && session.laps.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {session.laps.length} lap{session.laps.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Selected Session Details */}
      {selectedDate && sessions.filter(s => isSameDay(new Date(s.date), selectedDate)).length > 0 && (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDown className="h-4 w-4 text-primary" />
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Sessions on {format(selectedDate, "MMMM d, yyyy")}
            </h3>
          </div>
          <div className="space-y-3">
            {sessions
              .filter(s => isSameDay(new Date(s.date), selectedDate))
              .map((session) => (
                <Card key={session.id} className="p-3 sm:p-4 bg-card border-border/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        {session.name || 'Untitled Session'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(session.date), "h:mm a")}
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold font-mono text-primary">
                      {formatTime(session.time)}
                    </p>
                  </div>
                  {session.laps && session.laps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Laps ({session.laps.length})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {session.laps.map((lap, index) => (
                          <div
                            key={lap.id}
                            className="flex justify-between text-xs sm:text-sm"
                          >
                            <span className="text-muted-foreground">
                              Lap {index + 1}
                            </span>
                            <span className="font-mono text-foreground">
                              {formatTime(lap.time)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
