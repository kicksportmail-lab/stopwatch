import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LapTime {
  id: number;
  time: number;
  split: number;
}

export const Stopwatch = ({ onSessionComplete }: { onSessionComplete: (time: number, laps: LapTime[]) => void }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
      milliseconds: milliseconds.toString().padStart(2, "0"),
    };
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (time > 0) {
      onSessionComplete(time, laps);
      toast({
        title: "Session saved",
        description: "Your stopwatch session has been saved to history.",
      });
    }
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (time > 0) {
      const previousLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
      const split = time - previousLapTime;
      setLaps([...laps, { id: laps.length + 1, time, split }]);
    }
  };

  const { minutes, seconds, milliseconds } = formatTime(time);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className={`text-7xl font-bold tracking-tight ${isRunning ? 'animate-pulse-glow' : ''}`}>
              <span className="text-foreground">{minutes}</span>
              <span className="text-primary">:</span>
              <span className="text-foreground">{seconds}</span>
              <span className="text-primary">:</span>
              <span className="text-muted-foreground text-5xl">{milliseconds}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
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
              onClick={handleReset}
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
  );
};
