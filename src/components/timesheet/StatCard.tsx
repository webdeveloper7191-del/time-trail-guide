import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg p-6 card-shadow transition-all duration-200 hover:card-shadow-lg animate-fade-in',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.positive ? 'text-status-approved' : 'text-status-rejected'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}% from last week
            </p>
          )}
        </div>
        <div className="rounded-lg bg-accent p-3">
          <Icon className="h-6 w-6 text-accent-foreground" />
        </div>
      </div>
    </div>
  );
}
