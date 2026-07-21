import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { exceptionReasonsStore, type ExceptionReasonMaster } from '@/lib/masterData/exceptionReasonsStore';
import type { MasterColumn } from '@/lib/masterData/types';

const severityStyle: Record<string, string> = {
  info: 'bg-slate-100 text-slate-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-rose-100 text-rose-800',
};

const columns: MasterColumn<ExceptionReasonMaster>[] = [
  { key: 'label', header: 'Reason', render: i => <span className="font-medium">{i.label}</span> },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'sev', header: 'Severity', render: i => <Badge className={severityStyle[i.severity]} variant="secondary">{i.severity}</Badge> },
  { key: 'blocks', header: 'Blocks approval', render: i => i.blocksApproval ? 'Yes' : 'No' },
  { key: 'note', header: 'Mgr note', render: i => i.requiresManagerNote ? 'Yes' : 'No' },
  { key: 'ev', header: 'Evidence', render: i => i.requiresEvidence ? 'Yes' : 'No' },
  { key: 'app', header: 'Applies to', render: i => (
    <div className="flex flex-wrap gap-1">{i.appliesTo.map(a => <Badge key={a} variant="outline" className="text-[10px]">{a.replace('_', ' ')}</Badge>)}</div>
  ) },
];

const fields: FieldDef<ExceptionReasonMaster>[] = [
  { key: 'severity', type: 'select', label: 'Severity',
    options: [{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }] },
  { key: 'appliesTo', type: 'multiselect', label: 'Applies to',
    options: [
      { value: 'clock_in', label: 'Clock-in' }, { value: 'clock_out', label: 'Clock-out' },
      { value: 'break', label: 'Break' }, { value: 'missed_shift', label: 'Missed shift' },
      { value: 'overtime', label: 'Overtime' }, { value: 'other', label: 'Other' },
    ] },
  { key: 'blocksApproval', type: 'toggle', label: 'Blocks approval', help: 'Timesheet cannot be approved until this exception is resolved.' },
  { key: 'requiresManagerNote', type: 'toggle', label: 'Requires manager note' },
  { key: 'requiresEvidence', type: 'toggle', label: 'Requires evidence', help: 'Attachment (photo, certificate) required.' },
  { key: 'autoNotifyPayroll', type: 'toggle', label: 'Auto-notify payroll' },
];

export function ExceptionReasonsMasterPanel() {
  return (
    <GenericMasterPanel<ExceptionReasonMaster>
      title="Exception reasons"
      description="Reasons a timesheet entry can be flagged. Drives approval routing and payroll notifications."
      store={exceptionReasonsStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `ex-${Date.now().toString(36)}`, code: '', label: '',
        severity: 'warning', blocksApproval: false, requiresManagerNote: true,
        requiresEvidence: false, autoNotifyPayroll: false, appliesTo: ['other'],
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
