import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Flag, Bell, BellOff, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTasksSync } from "@/hooks/useTasksSync";
import { Progress } from "@/components/ui/progress";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalogClock } from "./AnalogClock";

interface LapTime {
  id: number;
  time: number;
  split: number;
}

interface StopwatchProps {
  time: number;
  isRunning: boolean;
  laps: LapTime[];
  currentTaskId: string | null;
  taskSessionTime: number;
  handleStartStop: () => void;
  handleReset: (name?: string) => Promise<void>;
  handleLap: () => void;
  setTask: (taskId: string | null) => void;
}

export const Stopwatch = ({
  time,
  isRunning,
  laps,
  currentTaskId,
  taskSessionTime,
  handleStartStop,
  handleReset,
  handleLap,
  setTask
}: StopwatchProps) => {
  const { tasks } = useTasksSync();
  const { playStartSound, playStopSound, playLapSound, playResetSound } = useSoundEffects();
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Format time helper
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
      milliseconds: milliseconds.toString().padStart(2, "0"),
    };
  };

  // Check notification permission on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    } catch (e) {
      console.warn('Notification API not available:', e);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast({
          title: "Not supported",
          description: "Notifications are not supported in this browser.",
          variant: "destructive"
        });
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');

      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll see stopwatch updates in notifications."
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      toast({
        title: "Error",
        description: "Could not request notification permission.",
        variant: "destructive"
      });
    }
  };

  // Store time in a ref for notifications to avoid dependency issues
  const timeRef = useRef(time);
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Send message to service worker for background notifications
  const sendToServiceWorker = (message: object) => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
      }
    } catch (e) {
      console.warn('Failed to send message to service worker:', e);
    }
  };

  // Listen for messages from service worker (stop from notification)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_STOPWATCH') {
        handleStartStop();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [handleStartStop]);

  // Handle persistent notification when stopwatch is running (via service worker)
  useEffect(() => {
    if (!notificationsEnabled) return;

    if (isRunning) {
      // Calculate start timestamp for service worker
      const startTimestamp = Date.now() - time;
      sendToServiceWorker({
        type: 'STOPWATCH_UPDATE',
        running: true,
        startTimestamp,
        accumulatedTime: 0
      });
    } else {
      sendToServiceWorker({
        type: 'STOPWATCH_UPDATE',
        running: false
      });
    }

    return () => {
      sendToServiceWorker({ type: 'STOP_NOTIFICATIONS' });
    };
  }, [isRunning, notificationsEnabled]);

  const handleResetClick = () => {
    playResetSound();
    if (time > 0) {
      setShowNameDialog(true);
    } else {
      resetStopwatch();
    }
  };

  const resetStopwatch = async (name?: string) => {
    await handleReset(name);
    toast({
      title: "Session saved",
      description: name ? `Session "${name}" saved to history.` : "Your stopwatch session has been saved to history.",
    });
    setShowNameDialog(false);
    setSessionName("");
  };

  const handleSaveSession = () => {
    resetStopwatch(sessionName || undefined);
  };

  const handleSkipNaming = () => {
    resetStopwatch();
  };

  // Display task session time when a task is active, otherwise show total time
  const displayTime = currentTaskId ? taskSessionTime : time;

  const currentTask = tasks.find(t => t.id === currentTaskId);
  const taskProgress = currentTask ? Math.min((currentTask.total_time_spent_ms + time) / currentTask.target_time_ms * 100, 100) : 0;
  const isTaskOvertime = currentTask && (currentTask.total_time_spent_ms + time) > currentTask.target_time_ms;

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Task Selection */}
        {!isRunning && (
          <Card className="p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <Select
                  value={currentTaskId || "none"}
                  onValueChange={(value) => setTask(value === "none" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a task (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No task selected</SelectItem>
                    {tasks.filter(t => !t.is_completed).map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Task Progress Card */}
        {currentTask && (
          <Card className="p-4 animate-scale-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{currentTask.name}</span>
                </div>
                <Badge variant={isTaskOvertime ? "destructive" : "secondary"} className="text-xs">
                  {formatTime(currentTask.total_time_spent_ms + time).hours}:
                  {formatTime(currentTask.total_time_spent_ms + time).minutes}:
                  {formatTime(currentTask.total_time_spent_ms + time).seconds} / {formatTime(currentTask.target_time_ms).hours}:
                  {formatTime(currentTask.target_time_ms).minutes}:
                  {formatTime(currentTask.target_time_ms).seconds}
                </Badge>
              </div>
              <Progress
                value={taskProgress}
                className={isTaskOvertime ? "bg-destructive/20" : ""}
              />
            </div>
          </Card>
        )}

        <Card className="p-8">
          <div className="text-center space-y-8">
            {/* Analog Clock with Digital Display */}
            <AnalogClock
              time={displayTime}
              isRunning={isRunning}
              size={300}
              showDigital={true}
              taskName={currentTask?.name}
            />

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center pt-2">
              <Button
                onClick={() => {
                  if (isRunning) {
                    playStopSound();
                  } else {
                    playStartSound();
                  }
                  handleStartStop();
                }}
                size="lg"
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-105"
              >
                {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button
                onClick={() => {
                  playLapSound();
                  handleLap();
                }}
                disabled={!isRunning && time === 0}
                size="lg"
                variant="secondary"
                className="h-16 w-16 rounded-full transition-all hover:scale-105"
              >
                <Flag className="h-6 w-6" />
              </Button>

              <Button
                onClick={handleResetClick}
                disabled={time === 0 && !isRunning}
                size="lg"
                variant="outline"
                className="h-16 w-16 rounded-full border-border/50 hover:bg-secondary/50 transition-all hover:scale-105"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Card>

        {laps.length > 0 && (
          <Card className="p-6 animate-scale-in">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Laps</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...laps].reverse().map((lap, index) => {
                const lapFormatted = formatTime(lap.time);
                const splitFormatted = formatTime(lap.split);
                return (
                  <div
                    key={lap.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-muted-foreground font-medium">
                      Lap {laps.length - index}
                    </span>
                    <div className="text-right">
                      <div className="text-foreground font-mono">
                        {lapFormatted.minutes}:{lapFormatted.seconds}:{lapFormatted.milliseconds}
                      </div>
                      <div className="text-sm text-primary font-mono">
                        +{splitFormatted.minutes}:{splitFormatted.seconds}:{splitFormatted.milliseconds}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Name Your Session</DialogTitle>
            <DialogDescription>
              Give this stopwatch session a name to help organize your history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Session Name (optional)</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Run, Study Session"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveSession();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipNaming}>
              Skip
            </Button>
            <Button onClick={handleSaveSession}>
              Save Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};