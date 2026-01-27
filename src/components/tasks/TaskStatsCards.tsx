import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatsCardsProps {
  stats: {
    total: number;
    overdue: number;
    dueToday: number;
    dueSoon: number;
    byStatus: Record<string, number>;
  };
  onFilterClick?: (filter: string) => void;
  activeFilter?: string;
}

export const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({ 
  stats, 
  onFilterClick,
  activeFilter 
}) => {
  const cards = [
    {
      id: 'all',
      label: 'Total Tasks',
      value: stats.total,
      icon: ClipboardList,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      id: 'today',
      label: 'Due Today',
      value: stats.dueToday,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      id: 'week',
      label: 'Due Soon',
      value: stats.dueSoon,
      icon: CalendarDays,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: stats.byStatus?.in_progress || 0,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.byStatus?.completed || 0,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <Card 
            key={card.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isActive && "ring-2 ring-primary"
            )}
            onClick={() => onFilterClick?.(card.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskStatsCards;
