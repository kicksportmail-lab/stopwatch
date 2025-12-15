import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export interface Todo {
    id: string;
    title: string;
    is_completed: boolean;
    date: string;
    created_at: string;
}

export const useTodos = (selectedDate: Date | null) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    // Check authentication status
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch todos
    useEffect(() => {
        const fetchTodos = async () => {
            setIsLoading(true);

            if (userId) {
                // Authenticated: Fetch from Supabase
                const { data, error } = await supabase
                    .from('todos' as any)
                    .select('*')
                    .eq('date', dateKey)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Error fetching todos:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load to-do list.",
                        variant: "destructive"
                    });
                } else {
                    setTodos(data || []);
                }
            } else {
                // Guest: Fetch from LocalStorage
                const guestTodos = JSON.parse(localStorage.getItem(`guest_todos_${dateKey}`) || '[]');
                setTodos(guestTodos);
            }
            setIsLoading(false);
        };

        fetchTodos();

        if (userId) {
            // Real-time subscription only for authenticated users
            const channel = supabase
                .channel(`todos-${dateKey}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'todos',
                        filter: `date=eq.${dateKey}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setTodos(prev => [...prev, payload.new as Todo]);
                        } else if (payload.eventType === 'UPDATE') {
                            setTodos(prev => prev.map(t => t.id === payload.new.id ? payload.new as Todo : t));
                        } else if (payload.eventType === 'DELETE') {
                            setTodos(prev => prev.filter(t => t.id !== payload.old.id));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [dateKey, userId]);

    const addTodo = async (title: string) => {
        if (!title.trim()) return;

        if (userId) {
            // Authenticated: Save to Supabase
            const { error } = await supabase
                .from('todos' as any)
                .insert({
                    title,
                    date: dateKey,
                    is_completed: false,
                    user_id: userId
                });

            if (error) {
                console.error('Error adding todo:', error);
                toast({
                    title: "Error",
                    description: `Failed to add to-do item: ${error.message}`,
                    variant: "destructive"
                });
            }
        } else {
            // Guest: Save to LocalStorage
            const newTodo: Todo = {
                id: crypto.randomUUID(),
                title,
                is_completed: false,
                date: dateKey,
                created_at: new Date().toISOString()
            };
            const currentTodos = JSON.parse(localStorage.getItem(`guest_todos_${dateKey}`) || '[]');
            const updatedTodos = [...currentTodos, newTodo];
            localStorage.setItem(`guest_todos_${dateKey}`, JSON.stringify(updatedTodos));
            setTodos(updatedTodos);
        }
    };

    const toggleTodo = async (id: string, isCompleted: boolean) => {
        if (userId) {
            // Authenticated: Update Supabase
            const { error } = await supabase
                .from('todos' as any)
                .update({ is_completed: isCompleted })
                .eq('id', id);

            if (error) {
                console.error('Error updating todo:', error);
                toast({
                    title: "Error",
                    description: "Failed to update to-do item.",
                    variant: "destructive"
                });
            }
        } else {
            // Guest: Update LocalStorage
            const currentTodos = JSON.parse(localStorage.getItem(`guest_todos_${dateKey}`) || '[]');
            const updatedTodos = currentTodos.map((t: Todo) =>
                t.id === id ? { ...t, is_completed: isCompleted } : t
            );
            localStorage.setItem(`guest_todos_${dateKey}`, JSON.stringify(updatedTodos));
            setTodos(updatedTodos);
        }
    };

    const deleteTodo = async (id: string) => {
        if (userId) {
            // Authenticated: Delete from Supabase
            const { error } = await supabase
                .from('todos' as any)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting todo:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete to-do item.",
                    variant: "destructive"
                });
            }
        } else {
            // Guest: Delete from LocalStorage
            const currentTodos = JSON.parse(localStorage.getItem(`guest_todos_${dateKey}`) || '[]');
            const updatedTodos = currentTodos.filter((t: Todo) => t.id !== id);
            localStorage.setItem(`guest_todos_${dateKey}`, JSON.stringify(updatedTodos));
            setTodos(updatedTodos);
        }
    };

    return {
        todos,
        isLoading,
        addTodo,
        toggleTodo,
        deleteTodo
    };
};
