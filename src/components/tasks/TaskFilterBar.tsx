import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { TaskFilter, ModuleType, moduleLabels, defaultTaskFilter } from '@/types/unifiedTasks';
import { cn } from '@/lib/utils';

interface TaskFilterBarProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  sortBy: 'dueDate' | 'priority' | 'module' | 'status';
  onSortChange: (sort: 'dueDate' | 'priority' | 'module' | 'status') => void;
}

const statuses = ['open', 'in_progress', 'blocked', 'completed', 'cancelled'];
const priorities = ['critical', 'high', 'medium', 'low'];
const modules: ModuleType[] = ['forms', 'performance'];

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
}) => {
  const hasActiveFilters = 
    filter.modules.length !== modules.length ||
    filter.statuses.length > 0 ||
    filter.priorities.length > 0 ||
    filter.search !== '' ||
    filter.dateRange !== 'all';

  const clearFilters = () => {
    onFilterChange(defaultTaskFilter);
  };

  const toggleModule = (module: ModuleType) => {
    const newModules = filter.modules.includes(module)
      ? filter.modules.filter(m => m !== module)
      : [...filter.modules, module];
    onFilterChange({ ...filter, modules: newModules });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filter.statuses.includes(status)
      ? filter.statuses.filter(s => s !== status)
      : [...filter.statuses, status];
    onFilterChange({ ...filter, statuses: newStatuses });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filter.priorities.includes(priority)
      ? filter.priorities.filter(p => p !== priority)
      : [...filter.priorities, priority];
    onFilterChange({ ...filter, priorities: newPriorities });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2">
          {/* Module filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Module
                {filter.modules.length !== modules.length && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filter.modules.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Module</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {modules.map((module) => (
                <DropdownMenuCheckboxItem
                  key={module}
                  checked={filter.modules.includes(module)}
                  onCheckedChange={() => toggleModule(module)}
                >
                  {moduleLabels[module]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Status
                {filter.statuses.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filter.statuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filter.statuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                >
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Priority
                {filter.priorities.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filter.priorities.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priorities.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filter.priorities.includes(priority)}
                  onCheckedChange={() => togglePriority(priority)}
                >
                  <span className="capitalize">{priority}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === 'dueDate'}
                onCheckedChange={() => onSortChange('dueDate')}
              >
                Due Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'priority'}
                onCheckedChange={() => onSortChange('priority')}
              >
                Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'module'}
                onCheckedChange={() => onSortChange('module')}
              >
                Module
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'status'}
                onCheckedChange={() => onSortChange('status')}
              >
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Show completed toggle + Clear filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="showCompleted"
            checked={filter.showCompleted}
            onCheckedChange={(checked) => 
              onFilterChange({ ...filter, showCompleted: checked as boolean })
            }
          />
          <label htmlFor="showCompleted" className="text-sm text-muted-foreground cursor-pointer">
            Show completed tasks
          </label>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default TaskFilterBar;
