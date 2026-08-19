import { Badge } from '@/components/ui/badge';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { actionLabels } from '@/types/permissions';
import { GrantDiffRow } from '@/lib/roleGrants';
import { cn } from '@/lib/utils';

/** Shared renderer for "what changes when I save" and role comparison. */
export function GrantDiffList({
  rows,
  leftLabel,
  rightLabel,
  emptyText = 'No differences.',
  className,
}: {
  rows: GrantDiffRow[];
  leftLabel?: string;
  rightLabel?: string;
  emptyText?: string;
  className?: string;
}) {
  if (!rows.length) {
    return <p className={cn('text-sm text-muted-foreground py-6 text-center', className)}>{emptyText}</p>;
  }
  return (
    <div className={cn('divide-y rounded-md border', className)}>
      {(leftLabel || rightLabel) && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
          <span>Capability</span>
          <span className="flex items-center gap-2">
            {leftLabel} <ArrowRight className="h-3 w-3" /> {rightLabel}
          </span>
        </div>
      )}
      {rows.map(row => (
        <div key={row.key} className="px-3 py-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{row.label}</div>
            <div className="text-[11px] text-muted-foreground">{row.group}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {row.added.map(a => (
              <Badge
                key={`a-${a}`}
                variant="outline"
                className="gap-1 text-[10px] border-primary/40 text-primary"
              >
                <Plus className="h-2.5 w-2.5" />
                {actionLabels[a]}
              </Badge>
            ))}
            {row.removed.map(a => (
              <Badge
                key={`r-${a}`}
                variant="outline"
                className="gap-1 text-[10px] border-destructive/40 text-destructive"
              >
                <Minus className="h-2.5 w-2.5" />
                {actionLabels[a]}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
