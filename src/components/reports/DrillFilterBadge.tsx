import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DrillFilter {
  type: string;
  value: string;
  label?: string;
}

interface DrillFilterBadgeProps {
  filter: DrillFilter | null;
  onClear: () => void;
}

export function DrillFilterBadge({ filter, onClear }: DrillFilterBadgeProps) {
  if (!filter) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-200">
      <Filter className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs text-muted-foreground">Drill-down:</span>
      <Badge variant="secondary" className="text-xs font-medium">
        {filter.label || filter.type}: {filter.value}
      </Badge>
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1 hover:bg-destructive/10" onClick={onClear}>
        <X className="h-3 w-3" />
      </Button>
      <span className="text-[10px] text-muted-foreground ml-auto">Click any chart element to change · Click ✕ to clear</span>
    </div>
  );
}
