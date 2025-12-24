import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, BarChart3, Clock, Activity, TrendingUp, Check, ArrowDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl p-12 text-center rounded-[2.5rem]">
          <div className="p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Complete a stopwatch session to see your activity history and insights here.</p>
        </Card>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* History & Analytics Section */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 sm:p-8 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-foreground">
                  History & Analytics
                </h2>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Activity Insights</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-10 px-4 border-border/50 hover:bg-secondary/50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </motion.div>
          </div>

          {/* Analytics Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Clock, label: "Total Sessions", value: sessions.length, color: "text-primary", bg: "bg-primary/10" },
              { icon: Activity, label: "Total Time", value: formatTimeShort(sessions.reduce((acc, s) => acc + s.time, 0)), color: "text-accent", bg: "bg-accent/10" },
              { icon: Check, label: "Avg/Session", value: sessions.length > 0 ? formatTimeShort(Math.round(sessions.reduce((acc, s) => acc + s.time, 0) / sessions.length)) : '0m', color: "text-green-500", bg: "bg-green-500/10" },
              { icon: TrendingUp, label: "Best Day", value: formatTimeShort(Math.max(...Array.from(timeByDay.values()), 0)), color: "text-primary", bg: "bg-primary/10" }
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -5 }}
                className={cn("p-4 rounded-2xl border border-transparent transition-all", stat.bg)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</span>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Sessions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                All Sessions ({sessions.length})
              </h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {sessions.map((session, idx) => {
                  const sessionDate = new Date(session.date);
                  const isSelectedSession = selectedDate && isSameDay(sessionDate, selectedDate);
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedDate(isSelectedSession ? null : sessionDate)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden",
                        isSelectedSession
                          ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5"
                          : "bg-secondary/20 border-border/30 hover:bg-secondary/40 hover:border-primary/20"
                      )}
                    >
                      {isSelectedSession && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                        />
                      )}
                      <div className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        isSelectedSession ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                      )}>
                        <Clock className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-foreground truncate tracking-tight">
                          {session.name || 'Untitled Session'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                            {format(sessionDate, "MMM d, yyyy")}
                          </p>
                          <span className="text-muted-foreground/30">•</span>
                          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                            {format(sessionDate, "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="font-mono text-lg font-black text-foreground tracking-tighter">
                          {formatTime(session.time)}
                        </span>
                        {session.laps && session.laps.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest py-0 px-2 rounded-full bg-primary/10 text-primary border-none">
                            {session.laps.length} lap{session.laps.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Selected Session Details */}
      <AnimatePresence>
        {selectedDate && sessions.filter(s => isSameDay(new Date(s.date), selectedDate)).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            className="overflow-hidden"
          >
            <Card className="p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-2xl rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ArrowDown className="h-5 w-5 text-primary animate-bounce" />
                </div>
                <h3 className="text-xl font-black tracking-tighter text-foreground">
                  Sessions on {format(selectedDate, "MMMM d, yyyy")}
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {sessions
                  .filter(s => isSameDay(new Date(s.date), selectedDate))
                  .map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="p-5 bg-card/80 backdrop-blur-md border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-lg font-bold text-foreground tracking-tight">
                              {session.name || 'Untitled Session'}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                              {format(new Date(session.date), "h:mm a")}
                            </p>
                          </div>
                          <p className="text-2xl font-black font-mono text-primary tracking-tighter">
                            {formatTime(session.time)}
                          </p>
                        </div>
                        {session.laps && session.laps.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">
                              Laps ({session.laps.length})
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {session.laps.map((lap, index) => (
                                <div
                                  key={lap.id}
                                  className="flex justify-between items-center p-2 rounded-lg bg-secondary/30"
                                >
                                  <span className="text-xs font-bold text-muted-foreground/70 uppercase">
                                    Lap {index + 1}
                                  </span>
                                  <span className="font-mono text-sm font-bold text-foreground">
                                    {formatTime(lap.time)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
