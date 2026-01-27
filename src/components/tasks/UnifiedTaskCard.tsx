import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Circle,
  Loader2,
  Ban,
  ExternalLink
} from 'lucide-react';
import { UnifiedTask, moduleColors, typeLabels } from '@/types/unifiedTasks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UnifiedTaskCardProps {
  task: UnifiedTask;
  onClick: (task: UnifiedTask) => void;
  compact?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  open: <Circle className="h-3.5 w-3.5 text-blue-500" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 text-purple-500" />,
  blocked: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  cancelled: <Ban className="h-3.5 w-3.5 text-muted-foreground" />,
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export const UnifiedTaskCard: React.FC<UnifiedTaskCardProps> = ({ task, onClick, compact = false }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        task.isOverdue && "border-l-4 border-l-destructive",
        compact ? "p-3" : ""
      )}
      onClick={() => onClick(task)}
    >
      <CardContent className={cn(compact ? "p-0" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header: Module + Type badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", moduleColors[task.module])}>
                {task.moduleLabel}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {typeLabels[task.type] || task.type}
              </Badge>
              {task.isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Title */}
            <h4 className="font-medium text-sm leading-tight mb-1 truncate">
              {task.title}
            </h4>

            {/* Description (only in non-compact mode) */}
            {!compact && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {/* Status */}
              <span className="flex items-center gap-1">
                {statusIcons[task.status]}
                <span className="capitalize">{task.status.replace('_', ' ')}</span>
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className={cn(
                  "flex items-center gap-1",
                  task.isOverdue && "text-destructive font-medium"
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}

              {/* Location */}
              {task.location && !compact && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{task.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right side: Priority + Assignee */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("text-xs capitalize", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            
            {task.assigneeName && (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(task.assigneeName)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedTaskCard;
