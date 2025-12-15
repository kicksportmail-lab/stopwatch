import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface AnalogClockProps {
    time: number;
    isRunning: boolean;
    size?: number;
    showDigital?: boolean;
    taskName?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
    time,
    isRunning,
    size = 300,
    showDigital = false,
    taskName
}) => {
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

    const { hours, minutes, seconds, milliseconds } = formatTime(time);

    // Calculate dot position on the circle (completes rotation every 60 seconds)
    const { x, y } = useMemo(() => {
        const totalSeconds = time / 1000;
        const angle = (totalSeconds % 60) * 6 - 90; // 6 degrees per second, -90 to start at top

        // Scale based on size (original was 300x300 with radius 130)
        const scale = size / 300;
        const radius = 130 * scale;
        const centerX = size / 2;
        const centerY = size / 2;

        const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
        const y = centerY + radius * Math.sin((angle * Math.PI) / 180);

        return { x, y };
    }, [time, size]);

    // Scale factors
    const scale = size / 300;
    const strokeWidth = 2 * scale;
    const dotRadius = 8 * scale;
    const trailRadius = 13 * scale;
    const markerLength1 = 127 * scale; // Inner radius for markers
    const markerLength2 = 140 * scale; // Outer radius for markers
    const center = size / 2;
    const circleRadius = 140 * scale;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute">
                {/* Outer circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={circleRadius}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={strokeWidth}
                    opacity="0.3"
                />

                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const x1 = center + markerLength1 * Math.cos(angle);
                    const y1 = center + markerLength1 * Math.sin(angle);
                    const x2 = center + markerLength2 * Math.cos(angle);
                    const y2 = center + markerLength2 * Math.sin(angle);

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="hsl(var(--primary))"
                            strokeWidth={strokeWidth}
                            opacity="0.5"
                        />
                    );
                })}

                {/* Moving dot with glow */}
                <circle
                    cx={x}
                    cy={y}
                    r={dotRadius}
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
                    r={trailRadius}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={strokeWidth}
                    opacity="0.2"
                    style={{ transition: 'cx 0.01s linear, cy 0.01s linear' }}
                />
            </svg>

            {/* Digital Display - Centered */}
            {showDigital && (
                <div className="relative z-10 flex flex-col items-center">
                    {/* Active Task Badge */}
                    {taskName && (
                        <Badge
                            variant="secondary"
                            className="mb-2 px-3 py-1 text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                        >
                            <Target className="h-3 w-3 mr-1.5" />
                            {taskName}
                        </Badge>
                    )}
                    <div className={`font-bold tracking-tight ${isRunning ? 'animate-pulse-glow' : ''}`} style={{ fontSize: `${48 * scale}px` }}>
                        <div className="flex items-baseline">
                            <span className="text-foreground">{hours}</span>
                            <span className="text-primary mx-1">:</span>
                            <span className="text-foreground">{minutes}</span>
                            <span className="text-primary mx-1">:</span>
                            <span className="text-foreground">{seconds}</span>
                        </div>
                    </div>
                    <div className="text-primary font-bold mt-1" style={{ fontSize: `${24 * scale}px` }}>
                        {milliseconds}
                    </div>
                </div>
            )}
        </div>
    );
};
