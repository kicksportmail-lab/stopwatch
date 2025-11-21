import { useState, useEffect } from "react";
import { Stopwatch } from "@/components/Stopwatch";
import { History } from "@/components/History";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer } from "lucide-react";

interface LapTime {
  id: number;
  time: number;
  split: number;
}

interface HistorySession {
  id: string;
  time: number;
  laps: LapTime[];
  date: string;
}

const Index = () => {
  const [history, setHistory] = useState<HistorySession[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("stopwatch-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSessionComplete = (time: number, laps: LapTime[]) => {
    const newSession: HistorySession = {
      id: Date.now().toString(),
      time,
      laps,
      date: new Date().toISOString(),
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("stopwatch-history", JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("stopwatch-history");
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Stopwatch
            </h1>
          </div>
          <p className="text-muted-foreground">Track your time with precision</p>
        </div>

        <Tabs defaultValue="stopwatch" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-secondary/50 backdrop-blur-lg">
            <TabsTrigger value="stopwatch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Stopwatch
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stopwatch" className="mt-6">
            <Stopwatch onSessionComplete={handleSessionComplete} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <History sessions={history} onClearHistory={handleClearHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
