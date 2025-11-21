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

  // Calculate dot position on the circle (completes rotation every 60 seconds)
  const getAnalogPosition = () => {
    const totalSeconds = time / 1000;
    const angle = (totalSeconds % 60) * 6 - 90; // 6 degrees per second, -90 to start at top
    const radius = 180;
    const centerX = 200;
    const centerY = 200;
    
    const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
    const y = centerY + radius * Math.sin((angle * Math.PI) / 180);
    
    return { x, y };
  };

  const { x, y } = getAnalogPosition();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card className="bg-gradient-card backdrop-blur-lg border-border/50 shadow-[var(--shadow-card)] p-8">
        <div className="text-center space-y-8">
          {/* Analog Clock with Digital Display */}
          <div className="relative flex items-center justify-center w-full h-[420px]">
            <svg width="400" height="400" className="absolute">
              {/* Outer circle */}
              <circle
                cx="200"
                cy="200"
                r="190"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                opacity="0.3"
              />
              
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x1 = 200 + 175 * Math.cos(angle);
                const y1 = 200 + 175 * Math.sin(angle);
                const x2 = 200 + 190 * Math.cos(angle);
                const y2 = 200 + 190 * Math.sin(angle);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    opacity="0.5"
                  />
                );
              })}
              
              {/* Moving dot with glow */}
              <circle
                cx={x}
                cy={y}
                r="10"
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
                r="16"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                opacity="0.2"
                style={{ transition: 'cx 0.01s linear, cy 0.01s linear' }}
              />
            </svg>
            
            {/* Digital Display - Centered */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`text-7xl font-bold tracking-tight ${isRunning ? 'animate-pulse-glow' : ''}`}>
                <div className="flex items-baseline">
                  <span className="text-foreground">{minutes}</span>
                  <span className="text-primary mx-1">:</span>
                  <span className="text-foreground">{seconds}</span>
                </div>
              </div>
              <div className="text-4xl text-primary font-bold mt-2">
                {milliseconds}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center pt-4">
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
