import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Goal, 
  goalStatusLabels, 
  goalPriorityLabels 
} from '@/types/performance';
import { format, isPast, parseISO } from 'date-fns';
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Plus,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalsTrackerProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onViewGoal: (goal: Goal) => void;
  onUpdateProgress: (goalId: string, progress: number) => void;
  compact?: boolean;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-destructive/10 text-destructive',
};

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Clock className="h-3.5 w-3.5" />,
  in_progress: <Target className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5" />,
  cancelled: <Clock className="h-3.5 w-3.5" />,
};

export function GoalsTracker({ 
  goals, 
  onCreateGoal, 
  onViewGoal, 
  onUpdateProgress,
  compact = false 
}: GoalsTrackerProps) {
  const sortedGoals = [...goals].sort((a, b) => {
    // Sort by: overdue first, then by priority, then by target date
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const activeGoals = sortedGoals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');
  const completedGoals = sortedGoals.filter(g => g.status === 'completed');

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Goals</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onCreateGoal}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeGoals.slice(0, 3).map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onViewGoal(goal)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={goal.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
          {activeGoals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No active goals</p>
          )}
          {activeGoals.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full">
              View all {activeGoals.length} goals
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goals & Objectives
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track progress on personal and professional goals
          </p>
        </div>
        <Button onClick={onCreateGoal}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Active Goals ({activeGoals.length})
        </h3>
        
        {activeGoals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active goals</p>
              <Button variant="outline" className="mt-4" onClick={onCreateGoal}>
                Create your first goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeGoals.map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onView={() => onViewGoal(goal)}
                onUpdateProgress={(progress) => onUpdateProgress(goal.id, progress)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Completed ({completedGoals.length})
          </h3>
          <div className="grid gap-4">
            {completedGoals.slice(0, 3).map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onView={() => onViewGoal(goal)}
                onUpdateProgress={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onView: () => void;
  onUpdateProgress: (progress: number) => void;
}

function GoalCard({ goal, onView, onUpdateProgress }: GoalCardProps) {
  const isOverdue = goal.status !== 'completed' && isPast(parseISO(goal.targetDate));
  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const totalMilestones = goal.milestones.length;

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isOverdue && "border-destructive/50"
      )}
      onClick={onView}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={priorityColors[goal.priority]}>
                <Flag className="h-3 w-3 mr-1" />
                {goalPriorityLabels[goal.priority]}
              </Badge>
              <Badge variant="outline" className={statusColors[goal.status]}>
                {statusIcons[goal.status]}
                <span className="ml-1">{goalStatusLabels[goal.status]}</span>
              </Badge>
              <Badge variant="secondary">{goal.category}</Badge>
            </div>

            <h4 className="font-semibold text-base mb-1">{goal.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {goal.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
              </span>
              {totalMilestones > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedMilestones}/{totalMilestones} milestones
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Progress value={goal.progress} className="flex-1 h-2" />
              <span className="text-sm font-medium min-w-[3rem] text-right">
                {goal.progress}%
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default GoalsTracker;
