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

const Index = () => {
  const { history, handleUpdateSessionName, handleDeleteSession, handleClearHistory } = useHistorySync();
  const { time: currentStopwatchTime, isRunning: isStopwatchRunning, laps, currentTaskId, taskSessionTime, setTask, handleStartStop, handleReset, handleLap } = useStopwatchSync();
  const { tasks, createTask, updateTask, deleteTask } = useTasksSync();
  const [user, setUser] = useState<any>(null);

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
    <div className="min-h-screen bg-background">
      <InstallPrompt />
      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        <div className="absolute top-8 right-4 flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>

        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Stopwatch
            </h1>
          </div>
          <p className="text-muted-foreground">Track your time with precision - synced across all your devices</p>
        </div>

        <Tabs defaultValue="stopwatch" className="w-full">
          <TabsList className="grid w-full max-w-xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="stopwatch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Stopwatch
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              History
            </TabsTrigger>
            <TabsTrigger value="steps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <Footprints className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Steps</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stopwatch" className="mt-6">
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

          <TabsContent value="calendar" className="mt-6">
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


          <TabsContent value="history" className="mt-6">
            <History sessions={history} />
          </TabsContent>


          <TabsContent value="steps" className="mt-6">
            <StepTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
