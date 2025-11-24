import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

export const History = ({
  sessions,
  onClearHistory,
}: {
  sessions: HistorySession[];
  onClearHistory: () => void;
}) => {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;
    
    const times = sessions.map(s => s.time);
    const total = sessions.length;
    const average = times.reduce((a, b) => a + b, 0) / total;
    const longest = Math.max(...times);
    const shortest = Math.min(...times);
    
    return { total, average, longest, shortest };
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stopwatch-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Laps Count"];
    const rows = sessions.map(session => [
      formatDate(session.date),
      formatTime(session.time),
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

  const stats = calculateStats();

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
      {/* Statistics Summary */}
      {stats && (
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Total Sessions
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                Average Time
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">{formatTime(stats.average)}</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Longest
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">{formatTime(stats.longest)}</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingDown className="h-4 w-4" />
                Shortest
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">{formatTime(stats.shortest)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* History List */}
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">History</h2>
          <div className="flex gap-2">
            <Button
              onClick={exportToJSON}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              JSON
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              onClick={onClearHistory}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="bg-secondary/30 border-border/30 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-2xl font-bold font-mono text-primary">
                    {formatTime(session.time)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.date)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.laps.length} lap{session.laps.length !== 1 ? "s" : ""}
                </div>
              </div>

              {session.laps.length > 0 && (
                <div className="space-y-1 mt-3 pt-3 border-t border-border/30">
                  {session.laps.map((lap, index) => (
                    <div
                      key={lap.id}
                      className="flex justify-between text-sm"
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
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
      </Card>
    </div>
  );
};
