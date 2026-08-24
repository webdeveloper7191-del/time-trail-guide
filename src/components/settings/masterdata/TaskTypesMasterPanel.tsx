import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { taskTypesStore, type TaskTypeMaster } from '@/lib/masterData/taskTypesStore';
import type { MasterColumn } from '@/lib/masterData/types';

const priorityStyle: Record<string, string> = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-rose-100 text-rose-800',
};

const columns: MasterColumn<TaskTypeMaster>[] = [
  { key: 'label', header: 'Task type', render: i => (
    <span className="flex items-center gap-2 font-medium">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
      {i.label}
    </span>
  ) },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'category', header: 'Category', render: i => <Badge variant="outline" className="text-[10px] capitalize">{i.category}</Badge> },
  { key: 'priority', header: 'Default priority', render: i => (
    <Badge className={priorityStyle[i.defaultPriority]} variant="secondary">{i.defaultPriority}</Badge>
  ) },
  { key: 'due', header: 'Due in', render: i => i.defaultDueInDays > 0 ? `${i.defaultDueInDays} day${i.defaultDueInDays === 1 ? '' : 's'}` : '—' },
  { key: 'req', header: 'Required', render: i => {
    const reqs = [
      i.requiresLocation && 'Location',
      i.requiresAssignee && 'Assignee',
      i.requiresEvidence && 'Evidence',
      i.requiresApproval && 'Approval',
    ].filter(Boolean) as string[];
    return reqs.length
      ? <div className="flex flex-wrap gap-1">{reqs.map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>
      : <span className="text-muted-foreground">—</span>;
  } },
];

const fields: FieldDef<TaskTypeMaster>[] = [
  { key: 'category', type: 'select', label: 'Category', width: 'half',
    options: [
      { value: 'operations', label: 'Operations' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'people', label: 'People' },
      { value: 'other', label: 'Other' },
    ] },
  { key: 'color', type: 'text', label: 'Colour (hex)', width: 'half', placeholder: '#2563eb',
    help: 'Used for the dot on task cards and board chips.' },
  { key: 'defaultPriority', type: 'select', label: 'Default priority', width: 'half',
    options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
    ] },
  { key: 'defaultDueInDays', type: 'number', label: 'Default due in (days)', width: 'half',
    help: 'Pre-fills the due date when a task of this type is created. 0 = no default.' },
  { key: 'requiresLocation', type: 'toggle', label: 'Requires location', help: 'Task cannot be saved without a location.' },
  { key: 'requiresAssignee', type: 'toggle', label: 'Requires assignee' },
  { key: 'requiresEvidence', type: 'toggle', label: 'Requires evidence', help: 'Attachment (photo, document) needed before completion.' },
  { key: 'requiresApproval', type: 'toggle', label: 'Requires approval to close' },
];

export function TaskTypesMasterPanel() {
  return (
    <GenericMasterPanel<TaskTypeMaster>
      title="Task types"
      description="Types available when raising a task. Drives default priority, due date and the fields required before a task can be completed."
      store={taskTypesStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `tt-${Date.now().toString(36)}`, code: '', label: '',
        category: 'operations', color: '#2563eb', defaultPriority: 'medium', defaultDueInDays: 3,
        requiresLocation: false, requiresAssignee: false, requiresEvidence: false, requiresApproval: false,
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
