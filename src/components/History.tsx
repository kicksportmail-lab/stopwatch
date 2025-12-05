import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Download, Filter, X, Edit2, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export const History = ({
  sessions,
  onClearHistory,
  onUpdateSessionName,
  onDeleteSession,
}: {
  sessions: HistorySession[];
  onClearHistory: () => void;
  onUpdateSessionName: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
}) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [minDuration, setMinDuration] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState<string>("");
  const [minLaps, setMinLaps] = useState<string>("");
  const [maxLaps, setMaxLaps] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const parseTimeInput = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const [h, m, s] = parts.map(Number);
      return (h * 3600 + m * 60 + s) * 1000;
    }
    return 0;
  };

  const handleEditSession = (sessionId: string, currentName?: string) => {
    setEditingSessionId(sessionId);
    setEditingName(currentName || "");
  };

  const handleSaveName = (sessionId: string) => {
    onUpdateSessionName(sessionId, editingName);
    setEditingSessionId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingName("");
  };

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    
    // Date range filter
    if (dateFrom && sessionDate < dateFrom) return false;
    if (dateTo && sessionDate > dateTo) return false;
    
    // Duration filter
    const minDur = parseTimeInput(minDuration);
    const maxDur = parseTimeInput(maxDuration);
    if (minDur > 0 && session.time < minDur) return false;
    if (maxDur > 0 && session.time > maxDur) return false;
    
    // Lap count filter
    const minL = minLaps ? parseInt(minLaps) : 0;
    const maxL = maxLaps ? parseInt(maxLaps) : Infinity;
    if (minL > 0 && session.laps.length < minL) return false;
    if (maxL < Infinity && session.laps.length > maxL) return false;
    
    return true;
  });

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinDuration("");
    setMaxDuration("");
    setMinLaps("");
    setMaxLaps("");
  };

  const hasActiveFilters = dateFrom || dateTo || minDuration || maxDuration || minLaps || maxLaps;

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
      {/* Filter Section */}
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                !
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Duration (HH:MM:SS)</Label>
              <Input
                placeholder="00:00:00"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Duration (HH:MM:SS)</Label>
              <Input
                placeholder="00:00:00"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Lap Count Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Laps</Label>
              <Input
                type="number"
                placeholder="0"
                value={minLaps}
                onChange={(e) => setMinLaps(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Laps</Label>
              <Input
                type="number"
                placeholder="Any"
                value={maxLaps}
                onChange={(e) => setMaxLaps(e.target.value)}
                min="0"
              />
            </div>
          </div>
        )}
      </Card>

      {filteredSessions.length === 0 && sessions.length > 0 && (
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8 text-center">
          <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No sessions match your filters. Try adjusting them.</p>
        </Card>
      )}

      {/* History List */}
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">History</h2>
          <div className="flex gap-2">
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
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="bg-secondary/30 border-border/30 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Session name"
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveName(session.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveName(session.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    session.name && (
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">{session.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSession(session.id, session.name)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  )}
                  <div className="text-2xl font-bold font-mono text-primary">
                    {formatTime(session.time)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.date)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {session.laps.length} lap{session.laps.length !== 1 ? "s" : ""}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteSession(session.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {!session.name && editingSessionId !== session.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSession(session.id)}
                      className="h-7 text-xs gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Add Name
                    </Button>
                  )}
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
