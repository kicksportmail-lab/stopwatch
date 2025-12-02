import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Flag, Bell, BellOff } from "lucide-react";
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
import { useStopwatchSync } from "@/hooks/useStopwatchSync";

export const Stopwatch = () => {
  const { time, isRunning, laps, handleStartStop, handleReset, handleLap } = useStopwatchSync();
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationIntervalRef = useRef<number | null>(null);
  const lastNotificationRef = useRef<Notification | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
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
  };

  // Show persistent notification
  const showNotification = () => {
    if (!notificationsEnabled || !('Notification' in window)) return;

    // Close previous notification if exists
    if (lastNotificationRef.current) {
      lastNotificationRef.current.close();
    }

    const notification = new Notification('Stopwatch Running', {
      body: 'Tap to view your stopwatch',
      icon: '/icon-192.png',
      tag: 'stopwatch-persistent',
      silent: true,
      requireInteraction: true // Keeps notification visible
    });

    // Handle notification click to focus the app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    lastNotificationRef.current = notification;
  };

  // Handle persistent notification when stopwatch is running
  useEffect(() => {
    if (isRunning && notificationsEnabled) {
      // Show persistent notification once
      showNotification();
    } else {
      // Close notification when stopped
      if (lastNotificationRef.current) {
        lastNotificationRef.current.close();
        lastNotificationRef.current = null;
      }
    }

    return () => {
      if (lastNotificationRef.current) {
        lastNotificationRef.current.close();
      }
    };
  }, [isRunning, notificationsEnabled]);

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

  const handleResetClick = () => {
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

  const { hours, minutes, seconds, milliseconds } = formatTime(time);

  // Calculate dot position on the circle (completes rotation every 60 seconds)
  const getAnalogPosition = () => {
    const totalSeconds = time / 1000;
    const angle = (totalSeconds % 60) * 6 - 90; // 6 degrees per second, -90 to start at top
    const radius = 130;
    const centerX = 150;
    const centerY = 150;
    
    const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
    const y = centerY + radius * Math.sin((angle * Math.PI) / 180);
    
    return { x, y };
  };

  const { x, y } = getAnalogPosition();

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
        <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8">
          <div className="text-center space-y-8">
            {/* Analog Clock with Digital Display */}
            <div className="relative flex items-center justify-center w-full h-[320px]">
              <svg width="300" height="300" className="absolute">
                {/* Outer circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.3"
                />
                
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x1 = 150 + 127 * Math.cos(angle);
                  const y1 = 150 + 127 * Math.sin(angle);
                  const x2 = 150 + 140 * Math.cos(angle);
                  const y2 = 150 + 140 * Math.sin(angle);
                  
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  );
                })}
                
                {/* Moving dot with glow */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="hsl(var(--primary))"
                  className={`${isRunning ? 'drop-shadow-[0_0_20px_hsl(var(--primary))]' : ''}`}
                  style={{ 
                    transition: 'cx 0.01s linear, cy 0.01s linear',
                    filter: isRunning ? 'drop-shadow(0 0 20px hsl(var(--primary)))' : 'none'
                  }}
                />
                
                {/* Trail effect */}
                <circle
                  cx={x}
                  cy={y}
                  r="13"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  opacity="0.2"
                  style={{ transition: 'cx 0.01s linear, cy 0.01s linear' }}
                />
              </svg>
              
              {/* Digital Display - Centered */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`text-5xl font-bold tracking-tight ${isRunning ? 'animate-pulse-glow' : ''}`}>
                  <div className="flex items-baseline">
                    <span className="text-foreground">{hours}</span>
                    <span className="text-primary mx-1">:</span>
                    <span className="text-foreground">{minutes}</span>
                    <span className="text-primary mx-1">:</span>
                    <span className="text-foreground">{seconds}</span>
                  </div>
                </div>
                <div className="text-2xl text-primary font-bold mt-1">
                  {milliseconds}
                </div>
              </div>
            </div>

            {/* Notification Toggle */}
            <div className="flex flex-col items-center pt-6 pb-2 gap-3">
              {/* Active Notification Badge */}
              {notificationsEnabled && isRunning && (
                <Badge 
                  variant="default" 
                  className="animate-pulse bg-primary/90 text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                >
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  Background Notifications Active
                </Badge>
              )}
              
              <Button
                onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
                variant={notificationsEnabled ? "secondary" : "outline"}
                size="default"
                className="w-full max-w-xs transition-all"
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="h-5 w-5 mr-2" />
                    Enable Notifications
                  </>
                )}
              </Button>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center pt-2">
              <Button
                onClick={handleStartStop}
                size="lg"
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-105"
              >
                {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button
                onClick={handleLap}
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
          <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-6 animate-scale-in">
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