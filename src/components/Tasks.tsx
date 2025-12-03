import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useTasksSync, Task } from '@/hooks/useTasksSync';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const Tasks = () => {
  const { tasks, createTask, updateTask, deleteTask } = useTasksSync();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;

    const hours = parseInt(targetHours) || 0;
    const minutes = parseInt(targetMinutes) || 0;
    const targetTimeMs = (hours * 3600 + minutes * 60) * 1000;

    if (targetTimeMs === 0) return;

    await createTask(newTaskName, targetTimeMs);
    setNewTaskName('');
    setTargetHours('');
    setTargetMinutes('');
    setShowCreateDialog(false);
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask(task.id, { is_completed: !task.is_completed });
  };

  const getProgress = (task: Task) => {
    return Math.min((task.total_time_spent_ms / task.target_time_ms) * 100, 100);
  };

  const isOvertime = (task: Task) => {
    return task.total_time_spent_ms > task.target_time_ms;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">Track time spent on your tasks</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Set a task name and target time to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  placeholder="e.g., Study React"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Time</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Hours"
                      min="0"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      min="0"
                      max="59"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tasks yet. Create your first task to start tracking time!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={task.is_completed ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={task.is_completed ? 'line-through' : ''}>
                        {task.name}
                      </span>
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">Progress</span>
                      <Badge 
                        variant={isOvertime(task) ? "destructive" : getProgress(task) >= 100 ? "default" : "secondary"}
                        className="text-xs font-bold"
                      >
                        {Math.round(getProgress(task))}%
                      </Badge>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {formatTime(task.total_time_spent_ms)} / {formatTime(task.target_time_ms)}
                    </span>
                  </div>
                  <Progress
                    value={getProgress(task)}
                    className={isOvertime(task) ? 'bg-destructive/20' : ''}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {isOvertime(task) && (
                      <Badge variant="destructive">
                        +{formatTime(task.total_time_spent_ms - task.target_time_ms)} overtime
                      </Badge>
                    )}
                    {!task.is_completed && getProgress(task) < 100 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {formatTime(task.target_time_ms - task.total_time_spent_ms)} remaining
                      </Badge>
                    )}
                    {task.is_completed && (
                      <Badge variant="default" className="bg-primary">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
