import { useState } from "react";
import { useStepTracker, Achievement } from "@/hooks/useStepTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Footprints,
  MapPin,
  Flame,
  Target,
  Settings,
  TrendingUp,
  Calendar,
  RotateCcw,
  Plus,
  Smartphone,
  Award,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const StepTracker = () => {
  const {
    todaySteps,
    stepGoal,
    distance,
    calories,
    progressPercentage,
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
    currentStreak,
    totalAllTimeSteps,
    achievements,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Main Progress Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8">
            {/* Circular Progress */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-56 h-56 mb-6">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90 overflow-visible">
                  <circle
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="16"
                    className="opacity-30"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="url(#stepGradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `${2 * Math.PI * 100}`, strokeDashoffset: `${2 * Math.PI * 100}` }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 100 * (1 - progressPercentage / 100)}` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.5 }}
                  >
                    <Footprints className="h-10 w-10 text-primary mb-2 animate-bounce" />
                  </motion.div>
                  <span className="text-4xl font-black tracking-tighter text-foreground">
                    {formatNumber(todaySteps)}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground/60">
                    / {formatNumber(stepGoal)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
                  <span className="text-lg font-black text-primary">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3 rounded-full bg-secondary/50" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: MapPin, label: "Distance", value: formatDistance(distance), color: "text-primary", bg: "bg-primary/10" },
                { icon: Flame, label: "Calories", value: Math.round(calories), color: "text-destructive", bg: "bg-destructive/10" },
                { icon: Target, label: "Goal", value: formatNumber(stepGoal), color: "text-accent", bg: "bg-accent/10" }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={cn("text-center p-4 rounded-3xl transition-all border border-transparent hover:border-border/50", stat.bg)}
                >
                  <stat.icon className={cn("h-6 w-6 mx-auto mb-2", stat.color)} />
                  <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="gap-2 rounded-2xl h-12 px-6 border-border/50 hover:bg-secondary/50">
                      <Settings className="h-4 w-4" />
                      Set Goal
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] border-border/50 backdrop-blur-2xl bg-card/80">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Set Daily Step Goal</DialogTitle>
                    <DialogDescription>
                      Choose your daily step target to track your walking progress.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <Input
                      type="number"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Enter step goal"
                      min="1"
                      className="rounded-xl h-12 bg-secondary/30 border-border/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {[5000, 7500, 10000, 15000].map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewGoal(preset.toString())}
                          className="rounded-xl h-10 border-border/50"
                        >
                          {formatNumber(preset)}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={handleGoalSave} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Save Goal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="icon" onClick={resetTodaySteps} className="h-12 w-12 rounded-2xl border-border/50 hover:bg-secondary/50">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            {/* Sensor availability warning */}
            <AnimatePresence>
              {!sensorAvailable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 rounded-2xl bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-center gap-3 text-destructive">
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      Motion sensors not available. Use manual entry below.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual step entry */}
            <div className="mt-6 flex gap-3">
              <Input
                type="number"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                placeholder="Add steps manually"
                min="1"
                className="flex-1 rounded-2xl h-12 bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleAddManualSteps} variant="secondary" className="gap-2 rounded-2xl h-12 px-6 bg-secondary/50 hover:bg-secondary/80">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly/Monthly/Achievements Stats */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/30 backdrop-blur-md p-1 rounded-2xl border border-border/50 mb-6">
            <TabsTrigger value="weekly" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <TrendingUp className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Calendar className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Award className="h-4 w-4" />
              Awards
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key="tabs-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="weekly" className="mt-0 outline-none">
                <Card className="bg-card/30 backdrop-blur-md border-border/50 rounded-[2rem] overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { label: "Total Steps", value: formatNumber(weeklySteps) },
                        { label: "Daily Average", value: formatNumber(weeklyAverage) },
                        { label: "Distance", value: formatDistance(weeklyDistance) },
                        { label: "Calories", value: formatNumber(Math.round(weeklyCalories)) }
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-secondary/20 border border-border/30">
                          <p className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Weekly bar chart */}
                    {weeklyData.length > 0 && (
                      <div className="flex items-end justify-between gap-2 h-32 mt-6 px-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                          const dayData = weeklyData[index];
                          const percentage = dayData
                            ? Math.min((dayData.steps / stepGoal) * 100, 100)
                            : 0;
                          const metGoal = dayData && dayData.steps >= dayData.step_goal;

                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(percentage, 8)}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={cn(
                                  "w-full rounded-full transition-all duration-500 shadow-sm",
                                  metGoal
                                    ? "bg-gradient-to-t from-primary to-accent"
                                    : "bg-secondary/60"
                                )}
                              />
                              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="mt-0 outline-none">
                <Card className="bg-card/30 backdrop-blur-md border-border/50 rounded-[2rem]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: "Total Steps", value: formatNumber(monthlySteps) },
                        { label: "Daily Average", value: formatNumber(monthlyAverage) },
                        { label: "Distance", value: formatDistance(monthlyDistance) },
                        { label: "Calories", value: formatNumber(Math.round(monthlyCalories)) }
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-secondary/20 border border-border/30">
                          <p className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Goals met indicator */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-6 rounded-[1.5rem] bg-primary/5 border border-primary/20 shadow-inner"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-bold text-foreground">Days Goal Met</span>
                        </div>
                        <span className="text-3xl font-black text-primary tracking-tighter">{daysGoalMet}</span>
                      </div>
                      <Progress
                        value={(daysGoalMet / 30) * 100}
                        className="h-3 rounded-full bg-secondary/50"
                      />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mt-3 text-center">
                        {30 - daysGoalMet} days remaining to hit 100%
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="mt-0 outline-none space-y-6">
                {/* Streak Card */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-md border-primary/20 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-2xl bg-primary shadow-lg shadow-primary/30">
                            <Zap className="h-8 w-8 text-primary-foreground animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Current Streak</p>
                            <p className="text-3xl font-black text-foreground tracking-tighter">{currentStreak} days</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Steps</p>
                          <p className="text-xl font-black text-foreground tracking-tighter">{formatNumber(totalAllTimeSteps)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Achievements Grid */}
                <Card className="bg-card/30 backdrop-blur-md border-border/50 rounded-[2rem]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Achievements
                      <span className="ml-auto text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {achievements.map((achievement, idx) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ x: 5 }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all duration-300",
                            achievement.unlocked
                              ? "bg-primary/10 border-primary/30 shadow-sm"
                              : "bg-secondary/20 border-border/30 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl filter drop-shadow-md">{achievement.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={cn(
                                  "font-bold tracking-tight",
                                  achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {achievement.name}
                                </p>
                                {achievement.unlocked && (
                                  <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest py-0">
                                    Unlocked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                {achievement.description}
                              </p>
                              {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
                                <div className="mt-3">
                                  <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Progress</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">{formatNumber(achievement.progress)} / {formatNumber(achievement.target)}</span>
                                  </div>
                                  <Progress
                                    value={(achievement.progress / achievement.target) * 100}
                                    className="h-1.5 rounded-full bg-secondary/50"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};
