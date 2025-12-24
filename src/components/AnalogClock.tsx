import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const { x, y, angle } = useMemo(() => {
        const totalSeconds = time / 1000;
        const angle = (totalSeconds % 60) * 6 - 90; // 6 degrees per second, -90 to start at top

        // Scale based on size (original was 300x300 with radius 130)
        const scale = size / 300;
        const radius = 130 * scale;
        const centerX = size / 2;
        const centerY = size / 2;

        const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
        const y = centerY + radius * Math.sin((angle * Math.PI) / 180);

        return { x, y, angle };
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
            <svg width={size} height={size} className="absolute overflow-visible">
                {/* Outer circle with glow when running */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={circleRadius}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.2)"
                    strokeWidth={strokeWidth}
                    animate={isRunning ? {
                        stroke: ["hsl(var(--primary) / 0.1)", "hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.1)"],
                        scale: [1, 1.02, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const markerAngle = (i * 30 - 90) * (Math.PI / 180);
                    const x1 = center + markerLength1 * Math.cos(markerAngle);
                    const y1 = center + markerLength1 * Math.sin(markerAngle);
                    const x2 = center + markerLength2 * Math.cos(markerAngle);
                    const y2 = center + markerLength2 * Math.sin(markerAngle);

                    return (
                        <motion.line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="hsl(var(--primary))"
                            strokeWidth={strokeWidth}
                            initial={{ opacity: 0.2 }}
                            animate={isRunning ? { opacity: [0.2, 0.4, 0.2] } : { opacity: 0.3 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    );
                })}

                {/* Moving dot with glow */}
                <motion.circle
                    cx={x}
                    cy={y}
                    r={dotRadius}
                    fill="hsl(var(--primary))"
                    animate={isRunning ? {
                        opacity: [0.8, 1, 0.8],
                        scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        transition: 'cx 0.05s linear, cy 0.05s linear',
                    }}
                />

                {/* Trail effect */}
                <motion.circle
                    cx={x}
                    cy={y}
                    r={trailRadius}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={strokeWidth}
                    animate={isRunning ? { opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] } : { opacity: 0.1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transition: 'cx 0.05s linear, cy 0.05s linear' }}
                />
            </svg>

            {/* Digital Display - Centered */}
            {showDigital && (
                <div className="relative z-10 flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        {taskName && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Badge
                                    variant="secondary"
                                    className="mb-4 px-4 py-1.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-full shadow-sm"
                                >
                                    <Target className="h-3.5 w-3.5 mr-2 animate-pulse" />
                                    {taskName}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col items-center">
                        <motion.div
                            className="font-bold tracking-tight flex items-baseline"
                            style={{ fontSize: `${56 * scale}px` }}
                        >
                            <motion.span animate={isRunning ? { opacity: [1, 0.8, 1] } : {}}>{hours}</motion.span>
                            <motion.span
                                animate={isRunning ? { opacity: [1, 0, 1] } : {}}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-primary mx-1 opacity-50"
                            >
                                :
                            </motion.span>
                            <motion.span animate={isRunning ? { opacity: [1, 0.8, 1] } : {}}>{minutes}</motion.span>
                            <motion.span
                                animate={isRunning ? { opacity: [1, 0, 1] } : {}}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-primary mx-1 opacity-50"
                            >
                                :
                            </motion.span>
                            <motion.span animate={isRunning ? { opacity: [1, 0.8, 1] } : {}} className="text-primary">{seconds}</motion.span>
                        </motion.div>

                        <motion.div
                            className="text-primary/60 font-mono font-bold mt-[-8px]"
                            style={{ fontSize: `${28 * scale}px` }}
                            animate={isRunning ? { opacity: [0.4, 1, 0.4] } : {}}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            {milliseconds}
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

