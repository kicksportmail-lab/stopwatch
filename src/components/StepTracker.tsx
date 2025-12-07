import { useState } from "react";
import { useStepTracker } from "@/hooks/useStepTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Footprints, 
  MapPin, 
  Flame, 
  Target, 
  Play, 
  Pause, 
  Settings,
  TrendingUp,
  Calendar,
  RotateCcw,
  Plus,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export const StepTracker = () => {
  const {
    todaySteps,
    stepGoal,
    distance,
    calories,
    progressPercentage,
    isTracking,
    isLoading,
    sensorAvailable,
    weeklySteps,
    weeklyDistance,
    weeklyCalories,
    weeklyAverage,
    weeklyData,
    monthlySteps,
    monthlyDistance,
    monthlyCalories,
    monthlyAverage,
    daysGoalMet,
    startTracking,
    stopTracking,
    updateStepGoal,
    addStepsManually,
    resetTodaySteps,
  } = useStepTracker();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(stepGoal.toString());
  const [manualSteps, setManualSteps] = useState("");

  const handleGoalSave = () => {
    const goal = parseInt(newGoal);
    if (!isNaN(goal) && goal > 0) {
      updateStepGoal(goal);
      setGoalDialogOpen(false);
    }
  };

  const handleAddManualSteps = () => {
    const steps = parseInt(manualSteps);
    if (!isNaN(steps) && steps > 0) {
      addStepsManually(steps);
      setManualSteps("");
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Progress Card */}
      <Card className="bg-gradient-card backdrop-blur-xl border-border/50 shadow-card overflow-hidden">
        <CardContent className="p-6">
          {/* Circular Progress */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-48 h-48 mb-4">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="url(#stepGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercentage / 100)}`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="h-8 w-8 text-primary mb-1" />
                <span className="text-3xl font-bold text-foreground">
                  {formatNumber(todaySteps)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {formatNumber(stepGoal)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {Math.round(progressPercentage)}% of daily goal
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{formatDistance(distance)}</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <Flame className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{Math.round(calories)}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <Target className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(stepGoal)}</p>
              <p className="text-xs text-muted-foreground">Goal</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              className={cn(
                "gap-2",
                isTracking 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-gradient-accent hover:opacity-90"
              )}
              disabled={!sensorAvailable}
            >
              {isTracking ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Tracking
                </>
              )}
            </Button>

            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Set Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Daily Step Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Enter step goal"
                    min="1"
                  />
                  <div className="flex gap-2">
                    {[5000, 7500, 10000, 15000].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewGoal(preset.toString())}
                      >
                        {formatNumber(preset)}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={handleGoalSave} className="w-full">
                    Save Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" onClick={resetTodaySteps}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Sensor availability warning */}
          {!sensorAvailable && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">
                  Motion sensors not available. Use manual entry below.
                </span>
              </div>
            </div>
          )}

          {/* Manual step entry */}
          <div className="mt-4 flex gap-2">
            <Input
              type="number"
              value={manualSteps}
              onChange={(e) => setManualSteps(e.target.value)}
              placeholder="Add steps manually"
              min="1"
              className="flex-1"
            />
            <Button onClick={handleAddManualSteps} variant="secondary" className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly/Monthly Stats */}
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
          <TabsTrigger value="weekly" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="h-4 w-4" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          <Card className="bg-gradient-card backdrop-blur-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(weeklySteps)}</p>
                  <p className="text-xs text-muted-foreground">Total Steps</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(weeklyAverage)}</p>
                  <p className="text-xs text-muted-foreground">Daily Average</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatDistance(weeklyDistance)}</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(Math.round(weeklyCalories))}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
              </div>

              {/* Weekly bar chart */}
              {weeklyData.length > 0 && (
                <div className="flex items-end justify-between gap-1 h-24 mt-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                    const dayData = weeklyData[index];
                    const percentage = dayData 
                      ? Math.min((dayData.steps / stepGoal) * 100, 100) 
                      : 0;
                    const metGoal = dayData && dayData.steps >= dayData.step_goal;
                    
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full rounded-t-sm transition-all duration-300"
                          style={{ 
                            height: `${Math.max(percentage, 5)}%`,
                            background: metGoal 
                              ? "linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))"
                              : "hsl(var(--muted))"
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card className="bg-gradient-card backdrop-blur-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(monthlySteps)}</p>
                  <p className="text-xs text-muted-foreground">Total Steps</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(monthlyAverage)}</p>
                  <p className="text-xs text-muted-foreground">Daily Average</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatDistance(monthlyDistance)}</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatNumber(Math.round(monthlyCalories))}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
              </div>

              {/* Goals met indicator */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">Days Goal Met</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{daysGoalMet}</span>
                </div>
                <Progress 
                  value={(daysGoalMet / 30) * 100} 
                  className="h-2 mt-2" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
