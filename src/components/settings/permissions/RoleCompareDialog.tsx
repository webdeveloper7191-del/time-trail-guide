import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionMatrix, RoleDefinition, actionLabels } from '@/types/permissions';
import { GrantDiffRow, actionListLabel, diffGrants, grantTotal } from '@/lib/roleGrants';
import { GrantDiffList } from './GrantDiffList';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'left' | 'right';

/** Side-by-side diff of two roles' grant sets. */
export function RoleCompareDialog({
  roles,
  matrix,
  open,
  onOpenChange,
  initialLeft,
}: {
  roles: RoleDefinition[];
  matrix: PermissionMatrix;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialLeft?: string;
}) {
  const [leftId, setLeftId] = useState(initialLeft ?? roles[0]?.id ?? '');
  const [rightId, setRightId] = useState(roles[1]?.id ?? roles[0]?.id ?? '');
  const [filter, setFilter] = useState<Filter>('all');

  const left = roles.find(r => r.id === leftId);
  const right = roles.find(r => r.id === rightId);
  const leftGrants = matrix[leftId] ?? {};
  const rightGrants = matrix[rightId] ?? {};

  const rows = useMemo(() => diffGrants(leftGrants, rightGrants), [leftGrants, rightGrants]);
  const onlyRight = rows.filter(r => r.added.length);
  const onlyLeft = rows.filter(r => r.removed.length);

  const visible: GrantDiffRow[] =
    filter === 'left'
      ? onlyLeft.map(r => ({ ...r, added: [] }))
      : filter === 'right'
        ? onlyRight.map(r => ({ ...r, removed: [] }))
        : rows;

  const exportCsv = () => {
    const header = ['Capability', 'Group', left?.label ?? 'A', right?.label ?? 'B', 'Difference'];
    const body = rows.map(r => [
      r.label,
      r.group,
      actionListLabel(r.before),
      actionListLabel(r.after),
      [
        r.removed.length ? `Only ${left?.label}: ${r.removed.map(a => actionLabels[a]).join(' ')}` : '',
        r.added.length ? `Only ${right?.label}: ${r.added.map(a => actionLabels[a]).join(' ')}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    ]);
    const csv = [header, ...body].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `role-compare-${leftId}-vs-${rightId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Comparison exported');
  };

  const swap = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare roles</DialogTitle>
          <DialogDescription>
            See exactly where two roles differ before you clone, merge or retire one of them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-2">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={swap} aria-label="Swap roles">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: left?.label ?? 'A', value: grantTotal(leftGrants), hint: 'permissions' },
            { label: 'Differences', value: rows.length, hint: 'capabilities differ' },
            { label: right?.label ?? 'B', value: grantTotal(rightGrants), hint: 'permissions' },
          ].map(card => (
            <div key={card.label} className="rounded-md border px-3 py-2">
              <div className="text-lg font-semibold tracking-tight">{card.value}</div>
              <div className="text-xs font-medium truncate">{card.label}</div>
              <div className="text-[11px] text-muted-foreground">{card.hint}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              ['all', `All differences (${rows.length})`],
              ['left', `Only ${left?.label ?? 'A'} (${onlyLeft.length})`],
              ['right', `Only ${right?.label ?? 'B'} (${onlyRight.length})`],
            ] as [Filter, string][]
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                filter === key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
              )}
            >
              {text}
            </button>
          ))}
          {leftId === rightId && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              Same role selected
            </Badge>
          )}
        </div>

        <div className="max-h-[45vh] overflow-y-auto">
          <GrantDiffList
            rows={visible}
            leftLabel={left?.label}
            rightLabel={right?.label}
            emptyText="These roles grant exactly the same permissions."
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Red badges are held only by {left?.label}; blue badges only by {right?.label}.
        </p>
      </DialogContent>
    </Dialog>
  );
}
