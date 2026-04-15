import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

// ============= Stat Card with Trend =============

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: {
    value: number;
    label: string;
    isPositiveGood?: boolean; // default true
  };
  subtitle?: string;
  sparklineData?: number[];
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ label, value, icon: Icon, trend, subtitle, sparklineData, className, size = 'md', variant = 'default' }: StatCardProps) {
  const isPositive = trend ? trend.value > 0 : undefined;
  const isGoodTrend = trend ? (trend.isPositiveGood !== false ? isPositive : !isPositive) : undefined;

  const variantStyles = {
    default: '',
    success: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    danger: 'border-red-200 bg-red-50/50',
  };

  return (
    <Card className={cn('border-border/60', variantStyles[variant], className)}>
      <CardContent className={cn('p-4', size === 'sm' && 'p-3')}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {Icon && <Icon className={cn('h-4 w-4 text-muted-foreground mb-1.5', size === 'sm' && 'h-3.5 w-3.5 mb-1')} />}
            <p className={cn('font-bold tracking-tight text-foreground', size === 'md' ? 'text-2xl' : 'text-lg')}>{value}</p>
            <p className={cn('text-muted-foreground mt-0.5', size === 'md' ? 'text-xs' : 'text-[11px]')}>{label}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
              isGoodTrend ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isPositive === false ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}{typeof trend.value === 'number' && !String(trend.value).includes('%') ? '' : ''}
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 flex items-end gap-[2px] h-6">
            {sparklineData.map((v, i) => {
              const max = Math.max(...sparklineData);
              const min = Math.min(...sparklineData);
              const range = max - min || 1;
              const height = Math.max(4, ((v - min) / range) * 24);
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm transition-all',
                    i === sparklineData.length - 1 ? 'bg-primary' : 'bg-primary/30'
                  )}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        )}
        {trend && trend.label && (
          <p className="text-[10px] text-muted-foreground mt-1">{trend.label}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============= Insight Card =============

interface InsightCardProps {
  type: 'positive' | 'negative' | 'neutral' | 'action';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

const insightStyles = {
  positive: { border: 'border-emerald-200', bg: 'bg-emerald-50/50', icon: '✓', iconColor: 'text-emerald-600' },
  negative: { border: 'border-red-200', bg: 'bg-red-50/50', icon: '✗', iconColor: 'text-red-600' },
  neutral: { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'ℹ', iconColor: 'text-blue-600' },
  action: { border: 'border-amber-200', bg: 'bg-amber-50/50', icon: '⚡', iconColor: 'text-amber-600' },
};

export function InsightCard({ type, title, description, metric, action }: InsightCardProps) {
  const style = insightStyles[type];
  return (
    <div className={cn('rounded-lg border p-3 space-y-1', style.border, style.bg)}>
      <div className="flex items-start gap-2">
        <span className={cn('text-sm font-bold', style.iconColor)}>{style.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>
          {metric && <p className="text-[11px] font-medium text-foreground mt-1">Impact: {metric}</p>}
          {action && (
            <p className="text-[11px] text-primary font-medium mt-1 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> {action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= Summary Row =============

interface SummaryRowProps {
  items: { label: string; value: string | number; highlight?: boolean }[];
}

export function SummaryRow({ items }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-muted/40 border border-border/40">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <div className="w-px h-4 bg-border/60" />}
          <span className="text-[11px] text-muted-foreground">{item.label}:</span>
          <span className={cn('text-xs font-semibold', item.highlight ? 'text-primary' : 'text-foreground')}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============= Comparison Indicator =============

interface ComparisonProps {
  current: number;
  previous: number;
  format?: 'percent' | 'number' | 'currency';
  label?: string;
}

export function ComparisonIndicator({ current, previous, format = 'number', label }: ComparisonProps) {
  const diff = current - previous;
  const pctChange = previous !== 0 ? Math.round((diff / previous) * 100) : 0;
  const isPositive = diff > 0;

  const formatted = format === 'currency' ? `$${Math.abs(diff).toLocaleString()}` :
    format === 'percent' ? `${Math.abs(diff).toFixed(1)}%` :
    Math.abs(diff).toLocaleString();

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-medium',
      isPositive ? 'text-emerald-600' : 'text-red-600'
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : '-'}{formatted} ({pctChange > 0 ? '+' : ''}{pctChange}%)
      {label && <span className="text-muted-foreground font-normal ml-1">{label}</span>}
    </span>
  );
}
