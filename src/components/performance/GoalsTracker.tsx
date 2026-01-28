import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Goal, 
  GoalStatus,
  GoalPriority,
  goalStatusLabels, 
  goalPriorityLabels,
  goalCategories,
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
  Flag,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalsTrackerProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onViewGoal: (goal: Goal) => void;
  onUpdateProgress: (goalId: string, progress: number) => void;
  compact?: boolean;
  showFilters?: boolean;
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
  compact = false,
  showFilters = true,
}: GoalsTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<GoalPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = [...goals];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(g => g.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === categoryFilter);
    }

    // Sort: overdue first, then by priority, then by target date
    return filtered.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
  }, [goals, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const activeGoals = filteredAndSortedGoals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');
  const completedGoals = filteredAndSortedGoals.filter(g => g.status === 'completed');

  // Get unique categories from goals
  const availableCategories = useMemo(() => {
    const cats = new Set(goals.map(g => g.category));
    return Array.from(cats).sort();
  }, [goals]);

  // Stats
  const stats = useMemo(() => ({
    total: goals.length,
    active: goals.filter(g => g.status === 'in_progress').length,
    completed: goals.filter(g => g.status === 'completed').length,
    overdue: goals.filter(g => g.status === 'overdue').length,
  }), [goals]);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            Goals & Objectives
          </h2>
          <p className="text-sm text-muted-foreground">
            Track progress on personal and professional development goals
          </p>
        </div>
        <Button onClick={onCreateGoal} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Cards - Clean Minimalist Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-semibold tracking-tight">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-semibold tracking-tight">{stats.active}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-semibold tracking-tight">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-semibold tracking-tight">{stats.overdue}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Cleaner Design */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 border-border/60 bg-background"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GoalStatus | 'all')}>
            <SelectTrigger className="w-36 border-border/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(goalStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as GoalPriority | 'all')}>
            <SelectTrigger className="w-36 border-border/60">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.entries(goalPriorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 border-border/60">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Active Goals - Refined Cards */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active Goals
          </h3>
          <span className="text-sm text-muted-foreground">{activeGoals.length} items</span>
        </div>
        
        {activeGoals.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters ? 'No goals match your filters' : 'No active goals'}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                {hasActiveFilters 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Create your first goal to start tracking your objectives'
                }
              </p>
              {!hasActiveFilters && (
                <Button onClick={onCreateGoal} className="mt-5 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-card"
                onClick={() => onViewGoal(goal)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {goal.category}
                        </Badge>
                        <Badge className={cn("text-xs font-medium", priorityColors[goal.priority])}>
                          {goalPriorityLabels[goal.priority]}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-foreground line-clamp-1 mt-2">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {goal.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}</span>
                      </div>
                      <Badge variant="outline" className="gap-1 text-xs">
                        {statusIcons[goal.status]}
                        {goalStatusLabels[goal.status]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals - Refined */}
      {completedGoals.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Completed Goals
            </h3>
            <span className="text-sm text-muted-foreground">{completedGoals.length} items</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {completedGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-card/80"
                onClick={() => onViewGoal(goal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-foreground">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Completed {goal.completedAt && format(parseISO(goal.completedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {goal.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
