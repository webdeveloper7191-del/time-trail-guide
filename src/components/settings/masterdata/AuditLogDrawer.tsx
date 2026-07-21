import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuditLog } from '@/lib/masterData/auditLog';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  masterKey: string;
  title: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  archive: 'bg-amber-100 text-amber-800',
  restore: 'bg-slate-100 text-slate-800',
  delete: 'bg-rose-100 text-rose-800',
};

export function AuditLogDrawer({ open, onOpenChange, masterKey, title }: Props) {
  const entries = useAuditLog(masterKey);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title} — Audit log</SheetTitle>
          <SheetDescription>Every create, update, archive and delete on this master list.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No changes recorded yet.</p>
          )}
          {entries.map(e => (
            <div key={e.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge className={actionColors[e.action] ?? ''} variant="secondary">{e.action}</Badge>
                  <span className="font-medium">{e.itemLabel}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">by {e.actor}</div>
              {e.note && <div className="mt-1 text-xs italic">{e.note}</div>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
