import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar } from "lucide-react";
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

  if (sessions.length === 0) {
    return (
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8 text-center animate-fade-in">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No history yet. Complete a stopwatch session to see it here.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">History</h2>
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
  );
};
