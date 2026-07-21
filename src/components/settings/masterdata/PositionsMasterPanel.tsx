import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, ArchiveRestore, Lock } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';
import { toast } from 'sonner';
import { MasterListShell } from './MasterListShell';
import { AuditLogDrawer } from './AuditLogDrawer';
import {
  usePositions, upsertPosition, archivePosition, restorePosition, resolvePositionRate,
  MASTER_KEY, type PositionMaster,
} from '@/lib/masterData/positionsStore';
import type { MasterColumn } from '@/lib/masterData/types';

const blank = (): PositionMaster => ({
  id: `pos-${Date.now().toString(36)}`,
  code: '',
  label: '',
  status: 'active',
  scope: 'tenant',
  isSystemDefault: false,
  usageCount: 0,
});

export function PositionsMasterPanel() {
  const items = usePositions();
  const [editing, setEditing] = useState<PositionMaster | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const columns: MasterColumn<PositionMaster>[] = [
    { key: 'label', header: 'Position', render: i => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{i.label}</span>
        {i.isSystemDefault && <Lock className="h-3 w-3 text-muted-foreground" />}
      </div>
    ) },
    { key: 'code', header: 'Code', render: i => <code className="text-xs text-muted-foreground">{i.code}</code> },
    { key: 'category', header: 'Category', render: i => i.category ?? '—' },
    { key: 'award', header: 'Award binding', render: i => {
      const r = resolvePositionRate(i);
      if (!r.awardName) return <span className="text-xs text-muted-foreground">Not linked</span>;
      return (
        <div className="text-xs">
          <div className="font-medium">{r.awardName}</div>
          <div className="text-muted-foreground">{r.classificationLabel}</div>
          {r.rate && <div className="text-emerald-700">${r.rate.toFixed(2)}/hr</div>}
        </div>
      );
    } },
    { key: 'usage', header: 'In use', render: i => <Badge variant="secondary">{i.usageCount ?? 0}</Badge> },
  ];

  return (
    <>
      <MasterListShell<PositionMaster>
        title="Positions"
        description="Job titles used across rostering, timesheets and staff profiles. Link each position to an Award classification to auto-resolve base pay."
        items={items}
        columns={columns}
        onAdd={() => setEditing(blank())}
        onRowClick={setEditing}
        onShowAudit={() => setAuditOpen(true)}
        renderActions={i => i.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => { archivePosition(i.id); toast.success('Archived'); }}>
            <Archive className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => { restorePosition(i.id); toast.success('Restored'); }}>
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        )}
      />
      <PositionEditor
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(next) => { upsertPosition(next); setEditing(null); toast.success('Saved'); }}
      />
      <AuditLogDrawer open={auditOpen} onOpenChange={setAuditOpen} masterKey={MASTER_KEY} title="Positions" />
    </>
  );
}

function PositionEditor({ item, onClose, onSave }: { item: PositionMaster | null; onClose: () => void; onSave: (p: PositionMaster) => void }) {
  const [draft, setDraft] = useState<PositionMaster | null>(item);
  // resync when opening a different item
  if (item && draft?.id !== item.id) setDraft(item);
  if (!draft) return null;

  const award = australianAwards.find(a => a.id === draft.awardId);

  return (
    <Sheet open={!!item} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item?.label || 'New position'}</SheetTitle>
          <SheetDescription>Rename, recategorise, or bind to an Award classification.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Label</Label>
              <Input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Input value={draft.category ?? ''} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="e.g. Education, Management, Support" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>

          <div className="rounded-md border p-3 space-y-3 bg-muted/30">
            <div className="font-medium text-sm">Award binding</div>
            <p className="text-xs text-muted-foreground">Link this position to an award classification. The classification is the source of truth for base pay — Pay Conditions read this automatically.</p>
            <div>
              <Label>Award</Label>
              <Select value={draft.awardId ?? '__none__'} onValueChange={v => setDraft({ ...draft, awardId: v === '__none__' ? undefined : v, classificationId: undefined })}>
                <SelectTrigger><SelectValue placeholder="Not linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not linked</SelectItem>
                  {australianAwards.map(a => <SelectItem key={a.id} value={a.id}>{a.shortName || a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {award && (
              <div>
                <Label>Classification</Label>
                <Select value={draft.classificationId ?? ''} onValueChange={v => setDraft({ ...draft, classificationId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a classification" /></SelectTrigger>
                  <SelectContent>
                    {award.classifications.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.level} — {c.description} (${c.baseHourlyRate.toFixed(2)}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {draft.isSystemDefault && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> System default — can be renamed or archived, not deleted.
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.label.trim() || !draft.code.trim()}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
