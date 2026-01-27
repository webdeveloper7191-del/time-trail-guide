import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ClipboardList, 
  User, 
  Building2,
  RefreshCw
} from 'lucide-react';
import { UnifiedTaskCard } from '@/components/tasks/UnifiedTaskCard';
import { TaskStatsCards } from '@/components/tasks/TaskStatsCards';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { 
  getAllUnifiedTasks, 
  getMyTasks, 
  filterTasks, 
  sortTasks, 
  getTaskStats 
} from '@/lib/unifiedTaskService';
import { UnifiedTask, TaskFilter, defaultTaskFilter } from '@/types/unifiedTasks';
import { cn } from '@/lib/utils';

// Mock current user
const CURRENT_USER = {
  id: 'staff-1',
  name: 'Mark John',
};

const MyTasksDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>(defaultTaskFilter);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'module' | 'status'>('dueDate');
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [quickFilter, setQuickFilter] = useState<string>('all');

  // Get tasks based on toggle
  const baseTasks = useMemo(() => {
    return showMyTasksOnly ? getMyTasks(CURRENT_USER.id) : getAllUnifiedTasks();
  }, [showMyTasksOnly]);

  // Apply quick filter to the main filter
  const effectiveFilter = useMemo(() => {
    let updatedFilter = { ...filter };
    
    switch (quickFilter) {
      case 'overdue':
        updatedFilter.dateRange = 'overdue';
        updatedFilter.showCompleted = false;
        break;
      case 'today':
        updatedFilter.dateRange = 'today';
        updatedFilter.showCompleted = false;
        break;
      case 'week':
        updatedFilter.dateRange = 'week';
        updatedFilter.showCompleted = false;
        break;
      case 'in_progress':
        updatedFilter.statuses = ['in_progress'];
        updatedFilter.showCompleted = false;
        break;
      case 'completed':
        updatedFilter.statuses = ['completed'];
        updatedFilter.showCompleted = true;
        break;
      default:
        // 'all' - use the filter as is
        break;
    }
    
    return updatedFilter;
  }, [filter, quickFilter]);

  // Apply filters and sorting
  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(baseTasks, effectiveFilter);
    return sortTasks(filtered, sortBy);
  }, [baseTasks, effectiveFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    // Stats should be calculated on base tasks without completed filter
    const tasksForStats = filterTasks(baseTasks, { ...defaultTaskFilter, showCompleted: true });
    return getTaskStats(tasksForStats);
  }, [baseTasks]);

  const handleTaskClick = (task: UnifiedTask) => {
    // Navigate to the appropriate module's task detail
    if (task.module === 'forms') {
      navigate(`/forms?tab=tasks&taskId=${task.id}`);
    } else if (task.module === 'performance') {
      navigate(`/performance?tab=tasks&taskId=${task.id}`);
    }
  };

  const handleQuickFilterClick = (filterId: string) => {
    setQuickFilter(quickFilter === filterId ? 'all' : filterId);
  };

  const handleRefresh = () => {
    // In a real app, this would refetch data
    setFilter(defaultTaskFilter);
    setQuickFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                  My Tasks
                </h1>
                <p className="text-sm text-muted-foreground">
                  Consolidated view of all your tasks across modules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* My Tasks / All Tasks toggle */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="myTasks" className="text-sm cursor-pointer">
                    My Tasks
                  </Label>
                </div>
                <Switch
                  id="myTasks"
                  checked={!showMyTasksOnly}
                  onCheckedChange={(checked) => setShowMyTasksOnly(!checked)}
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="myTasks" className="text-sm cursor-pointer">
                    All Tasks
                  </Label>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <TaskStatsCards 
          stats={stats} 
          onFilterClick={handleQuickFilterClick}
          activeFilter={quickFilter}
        />

        {/* Filter Bar */}
        <Card>
          <CardContent className="pt-4">
            <TaskFilterBar
              filter={filter}
              onFilterChange={setFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {showMyTasksOnly ? 'My Tasks' : 'All Tasks'}
                <Badge variant="secondary" className="ml-2">
                  {filteredTasks.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground">
                  {showMyTasksOnly 
                    ? "You don't have any tasks assigned to you matching the current filters."
                    : "No tasks match the current filters."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-3"
                )}>
                  {filteredTasks.map((task) => (
                    <UnifiedTaskCard
                      key={task.id}
                      task={task}
                      onClick={handleTaskClick}
                      compact={viewMode === 'grid'}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MyTasksDashboard;
