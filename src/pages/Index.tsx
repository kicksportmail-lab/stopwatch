import { Stopwatch } from "@/components/Stopwatch";
import { History } from "@/components/History";
import { CalendarProgress } from "@/components/CalendarProgress";
import { StepTracker } from "@/components/StepTracker";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Footprints, LogIn, LogOut, User } from "lucide-react";
import { useHistorySync } from "@/hooks/useHistorySync";
import { useStopwatchSync } from "@/hooks/useStopwatchSync";
import { useTasksSync } from "@/hooks/useTasksSync";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { history, handleUpdateSessionName, handleDeleteSession, handleClearHistory } = useHistorySync();
  const { time: currentStopwatchTime, isRunning: isStopwatchRunning, laps, currentTaskId, taskSessionTime, setTask, handleStartStop, handleReset, handleLap } = useStopwatchSync();
  const { tasks, createTask, updateTask, deleteTask } = useTasksSync();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("stopwatch");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <InstallPrompt />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8 max-w-4xl relative"
      >
        <div className="absolute top-8 right-4 flex items-center gap-2 z-50">
          {user ? (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-card/50 backdrop-blur-md p-1 pr-2 rounded-full border border-border/50"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/20 hover:border-primary/50 bg-card/50 backdrop-blur-md">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </motion.div>
            </Link>
          )}
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12 pt-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
              <Timer className="h-8 w-8 text-primary animate-pulse-glow" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter orange-gradient-text">
              Swift Chronicle
            </h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
            Precision time tracking, beautifully animated and synced across all your devices.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative max-w-xl mx-auto mb-12">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/30 backdrop-blur-md p-1 rounded-2xl border border-border/50">
              {["stopwatch", "calendar", "history", "steps"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="relative z-10 data-[state=active]:text-primary-foreground transition-all duration-300 rounded-xl py-2.5"
                >
                  {tab === activeTab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20 capitalize">
                    {tab === "steps" ? (
                      <>
                        <Footprints className="h-4 w-4 sm:hidden mx-auto" />
                        <span className="hidden sm:inline">Steps</span>
                      </>
                    ) : tab}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-6"
            >
              <TabsContent value="stopwatch" className="mt-0 border-none p-0 focus-visible:ring-0">
                <Stopwatch
                  time={currentStopwatchTime}
                  isRunning={isStopwatchRunning}
                  laps={laps}
                  currentTaskId={currentTaskId}
                  taskSessionTime={taskSessionTime}
                  handleStartStop={handleStartStop}
                  handleReset={handleReset}
                  handleLap={handleLap}
                  setTask={setTask}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0 border-none p-0 focus-visible:ring-0">
                <CalendarProgress
                  sessions={history}
                  tasks={tasks}
                  currentStopwatchTime={currentStopwatchTime}
                  isStopwatchRunning={isStopwatchRunning}
                  currentTaskId={currentTaskId}
                  taskSessionTime={taskSessionTime}
                  onSelectTask={setTask}
                  onStartStopwatch={handleStartStop}
                  onCreateTask={createTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0 border-none p-0 focus-visible:ring-0">
                <History sessions={history} />
              </TabsContent>

              <TabsContent value="steps" className="mt-0 border-none p-0 focus-visible:ring-0">
                <StepTracker />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};


export default Index;
