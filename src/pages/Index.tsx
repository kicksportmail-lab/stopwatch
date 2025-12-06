import { Stopwatch } from "@/components/Stopwatch";
import { History } from "@/components/History";
import { Tasks } from "@/components/Tasks";
import { CalendarProgress } from "@/components/CalendarProgress";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer } from "lucide-react";
import { useHistorySync } from "@/hooks/useHistorySync";
import { useStopwatchSync } from "@/hooks/useStopwatchSync";
import { useTasksSync } from "@/hooks/useTasksSync";

const Index = () => {
  const { history, handleUpdateSessionName, handleDeleteSession, handleClearHistory } = useHistorySync();
  const { time: currentStopwatchTime, isRunning: isStopwatchRunning } = useStopwatchSync();
  const { tasks } = useTasksSync();
  return (
    <div className="min-h-screen bg-gradient-primary">
      <InstallPrompt />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Stopwatch
            </h1>
          </div>
          <p className="text-muted-foreground">Track your time with precision - synced across all your devices</p>
        </div>

        <Tabs defaultValue="stopwatch" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 mb-8 bg-secondary/50 backdrop-blur-lg">
            <TabsTrigger value="stopwatch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Stopwatch
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stopwatch" className="mt-6">
            <Stopwatch />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Tasks />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarProgress 
              sessions={history} 
              tasks={tasks}
              currentStopwatchTime={currentStopwatchTime}
              isStopwatchRunning={isStopwatchRunning}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <History 
              sessions={history} 
              onClearHistory={handleClearHistory}
              onUpdateSessionName={handleUpdateSessionName}
              onDeleteSession={handleDeleteSession}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
