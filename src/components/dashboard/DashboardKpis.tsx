import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiItem {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  negative?: boolean;
  hint?: string;
}

export function DashboardKpis({ items, columns = 4 }: { items: KpiItem[]; columns?: number }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        columns === 3 ? 'lg:grid-cols-3' : columns === 5 ? 'lg:grid-cols-5' : 'md:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <Card key={item.label} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.trend && (
                <span className={cn('text-xs font-medium', item.negative ? 'text-destructive' : 'text-emerald-600')}>
                  {item.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            {item.hint && <p className="text-[11px] text-muted-foreground/80 mt-1">{item.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
