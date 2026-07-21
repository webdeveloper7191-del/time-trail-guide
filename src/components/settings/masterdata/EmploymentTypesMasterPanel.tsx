/**
 * Master panel over the existing employmentTypesStore, presented through the
 * same MasterListShell so it feels consistent with Positions.
 * The award-scoped selector at top switches which award's list is edited.
 */
import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, ArchiveRestore, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { australianAwards } from '@/data/australianAwards';
import type { EmploymentType } from '@/types/staff';
import { GLOBAL_AWARD_ID, useEmploymentTypes, type EmploymentTypeOption } from '@/lib/employmentTypesStore';
import { logMasterChange } from '@/lib/masterData/auditLog';
import { MasterListShell } from './MasterListShell';
import { AuditLogDrawer } from './AuditLogDrawer';
import type { MasterColumn, MasterItem } from '@/lib/masterData/types';

const MASTER_KEY = 'employmentTypes';

interface Row extends MasterItem {
  raw: EmploymentTypeOption;
}

const baseTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contractor', label: 'Contractor' },
];

export function EmploymentTypesMasterPanel() {
  const [awardId, setAwardId] = useState<string>(GLOBAL_AWARD_ID);
  const [list, setList] = useEmploymentTypes(awardId);
  const [editing, setEditing] = useState<EmploymentTypeOption | null>(null);
  const [archived, setArchived] = useState<Record<string, boolean>>({});
  const [auditOpen, setAuditOpen] = useState(false);

  const rows = useMemo<Row[]>(() => list.map(et => ({
    id: et.id,
    code: et.code,
    label: et.name,
    description: et.description,
    status: archived[et.id] ? 'archived' : 'active',
    scope: awardId === GLOBAL_AWARD_ID ? 'tenant' : 'system',
    isSystemDefault: et.isSystem,
    usageCount: 0,
    raw: et,
  })), [list, archived, awardId]);

  const columns: MasterColumn<Row>[] = [
    { key: 'label', header: 'Employment type', render: r => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{r.label}</span>
        {r.isSystemDefault && <Lock className="h-3 w-3 text-muted-foreground" />}
      </div>
    ) },
    { key: 'code', header: 'Code', render: r => <code className="text-xs">{r.code}</code> },
    { key: 'base', header: 'Base type', render: r => <Badge variant="outline">{r.raw.baseType.replace('_', ' ')}</Badge> },
    { key: 'loading', header: 'Loading', render: r => r.raw.loadingPercent ? `${r.raw.loadingPercent}%` : '—' },
    { key: 'leave', header: 'Accrues leave', render: r => r.raw.accruesLeave ? 'Yes' : 'No' },
    { key: 'ot', header: 'OT eligible', render: r => r.raw.overtimeEligible ? 'Yes' : 'No' },
  ];

  const upsert = (next: EmploymentTypeOption) => {
    const existing = list.find(l => l.id === next.id);
    const nextList = existing ? list.map(l => l.id === next.id ? next : l) : [...list, next];
    setList(nextList);
    logMasterChange({
      masterKey: MASTER_KEY,
      itemId: next.id,
      itemLabel: next.name,
      action: existing ? 'update' : 'create',
      before: existing as unknown as Record<string, unknown>,
      after: next as unknown as Record<string, unknown>,
      note: `Scope: ${awardId === GLOBAL_AWARD_ID ? 'Global' : awardId}`,
    });
    toast.success('Saved');
    setEditing(null);
  };

  const toggleArchive = (r: Row) => {
    setArchived(a => ({ ...a, [r.id]: !a[r.id] }));
    logMasterChange({
      masterKey: MASTER_KEY,
      itemId: r.id,
      itemLabel: r.label,
      action: r.status === 'active' ? 'archive' : 'restore',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Scope:</Label>
        <Select value={awardId} onValueChange={setAwardId}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={GLOBAL_AWARD_ID}>Global (organisation-wide defaults)</SelectItem>
            {australianAwards.map(a => <SelectItem key={a.id} value={a.id}>{a.shortName || a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Every award defines its own employment categories — pick one to override or add award-specific tiers (e.g. Apprentice Year 3).</p>
      </div>

      <MasterListShell<Row>
        title="Employment types"
        description="Full Time, Part Time, Casual, Apprentice, Trainee — each with its own loading, leave-accrual and overtime rules."
        items={rows}
        columns={columns}
        onAdd={() => setEditing({
          id: `et-${Date.now().toString(36)}`,
          name: '', code: '', baseType: 'part_time',
          isSystem: false, accruesLeave: true, overtimeEligible: true,
        })}
        onRowClick={r => setEditing(r.raw)}
        onShowAudit={() => setAuditOpen(true)}
        renderActions={r => r.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => toggleArchive(r)}><Archive className="h-4 w-4" /></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => toggleArchive(r)}><ArchiveRestore className="h-4 w-4" /></Button>
        )}
      />

      <EmploymentTypeEditor draft={editing} setDraft={setEditing} onSave={upsert} baseTypes={baseTypes} />
      <AuditLogDrawer open={auditOpen} onOpenChange={setAuditOpen} masterKey={MASTER_KEY} title="Employment types" />
    </div>
  );
}

function EmploymentTypeEditor({
  draft, setDraft, onSave, baseTypes,
}: {
  draft: EmploymentTypeOption | null;
  setDraft: (d: EmploymentTypeOption | null) => void;
  onSave: (d: EmploymentTypeOption) => void;
  baseTypes: { value: EmploymentType; label: string }[];
}) {
  if (!draft) return null;
  return (
    <Sheet open={!!draft} onOpenChange={o => !o && setDraft(null)}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{draft.name || 'New employment type'}</SheetTitle>
          <SheetDescription>Configure loading, leave accrual and overtime eligibility — these values flow into Pay Conditions and the award engine.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} /></div>
          </div>

          <div>
            <Label>Base payroll type</Label>
            <Select value={draft.baseType} onValueChange={v => setDraft({ ...draft, baseType: v as EmploymentType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{baseTypes.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Drives which award clauses, loadings and leave rules apply.</p>
          </div>

          <div>
            <Label>Casual loading %</Label>
            <Input type="number" value={draft.loadingPercent ?? ''} onChange={e => setDraft({ ...draft, loadingPercent: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="e.g. 25" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-md border p-3">
              <div><div className="text-sm font-medium">Accrues leave</div><div className="text-xs text-muted-foreground">Annual, personal, RDO/ADO</div></div>
              <Switch checked={draft.accruesLeave} onCheckedChange={c => setDraft({ ...draft, accruesLeave: c })} />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3">
              <div><div className="text-sm font-medium">Overtime eligible</div><div className="text-xs text-muted-foreground">Triggers OT & TOIL</div></div>
              <Switch checked={draft.overtimeEligible} onCheckedChange={c => setDraft({ ...draft, overtimeEligible: c })} />
            </label>
          </div>

          <div><Label>Description / clause ref</Label><Textarea rows={2} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.name.trim() || !draft.code.trim()}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
