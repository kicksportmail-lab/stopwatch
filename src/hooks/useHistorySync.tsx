import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  name?: string;
}

export const useHistorySync = () => {
  const [history, setHistory] = useState<HistorySession[]>([]);

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('stopwatch_sessions')
        .select('*')
        .order('date', { ascending: false });

      if (data && !error) {
        setHistory(data.map(session => ({
          id: session.id,
          time: session.time,
          laps: Array.isArray(session.laps) ? (session.laps as unknown as LapTime[]) : [],
          date: session.date,
          name: session.name || undefined
        })));
      }
    };

    loadHistory();
  }, []);

  // Listen to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('sessions-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stopwatch_sessions'
        },
        (payload) => {
          const newSession = payload.new as any;
          setHistory(prev => [{
            id: newSession.id,
            time: newSession.time,
            laps: Array.isArray(newSession.laps) ? (newSession.laps as unknown as LapTime[]) : [],
            date: newSession.date,
            name: newSession.name || undefined
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stopwatch_sessions'
        },
        (payload) => {
          const updatedSession = payload.new as any;
          setHistory(prev => prev.map(session =>
            session.id === updatedSession.id
              ? {
                  id: updatedSession.id,
                  time: updatedSession.time,
                  laps: Array.isArray(updatedSession.laps) ? (updatedSession.laps as unknown as LapTime[]) : [],
                  date: updatedSession.date,
                  name: updatedSession.name || undefined
                }
              : session
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stopwatch_sessions'
        },
        (payload) => {
          const deletedId = payload.old.id;
          setHistory(prev => prev.filter(session => session.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateSessionName = async (sessionId: string, name: string) => {
    await supabase
      .from('stopwatch_sessions')
      .update({ name })
      .eq('id', sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await supabase
      .from('stopwatch_sessions')
      .delete()
      .eq('id', sessionId);
  };

  const handleClearHistory = async () => {
    await supabase
      .from('stopwatch_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    setHistory([]);
  };

  return {
    history,
    handleUpdateSessionName,
    handleDeleteSession,
    handleClearHistory,
  };
};