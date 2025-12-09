import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, CheckCircle2, Circle, Clock, Play, Pause } from 'lucide-react';
import { useTasksSync, Task } from '@/hooks/useTasksSync';
import { useStopwatchSync } from '@/hooks/useStopwatchSync';
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
  const { time, isRunning, currentTaskId: activeTaskId, taskSessionTime, setTask } = useStopwatchSync();
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
          {tasks.map((task) => {
            const isActiveTask = activeTaskId === task.id;
            const currentTaskTime = isActiveTask ? taskSessionTime : 0;
            const displayTime = task.total_time_spent_ms + currentTaskTime;
            const progress = Math.min((displayTime / task.target_time_ms) * 100, 100);
            const overtime = displayTime > task.target_time_ms;
            
            return (
              <Card 
                key={task.id} 
                className={`${task.is_completed ? 'opacity-60' : ''} ${isActiveTask && isRunning ? 'ring-2 ring-primary animate-pulse' : ''}`}
              >
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
                        {isActiveTask && isRunning && (
                          <Badge variant="default" className="bg-primary animate-pulse gap-1">
                            <Play className="h-3 w-3" />
                            Running
                          </Badge>
                        )}
                        {isActiveTask && !isRunning && time > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Pause className="h-3 w-3" />
                            Paused
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {!task.is_completed && (
                        <Button
                          variant={isActiveTask ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTask(isActiveTask ? null : task.id)}
                          className="gap-1"
                        >
                          {isActiveTask ? (
                            <>
                              <Pause className="h-3 w-3" />
                              Stop
                            </>
                          ) : activeTaskId ? (
                            <>
                              <Play className="h-3 w-3" />
                              Switch
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Start
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isActiveTask && isRunning && (
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Current Session</p>
                      <p className="font-mono text-3xl font-bold text-primary">{formatTime(taskSessionTime)}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Progress</span>
                        <Badge 
                          variant={overtime ? "destructive" : progress >= 100 ? "default" : "secondary"}
                          className="text-xs font-bold"
                        >
                          {Math.round(progress)}%
                        </Badge>
                      </div>
                      <span className="font-mono text-sm font-medium">
                        {formatTime(displayTime)} / {formatTime(task.target_time_ms)}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className={overtime ? 'bg-destructive/20' : ''}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {overtime && (
                        <Badge variant="destructive">
                          +{formatTime(displayTime - task.target_time_ms)} overtime
                        </Badge>
                      )}
                      {!task.is_completed && progress < 100 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {formatTime(task.target_time_ms - displayTime)} remaining
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
            );
          })}
        </div>
      )}
    </div>
  );
};
