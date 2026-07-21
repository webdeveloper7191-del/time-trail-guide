import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { shiftTypesStore, type ShiftTypeMaster } from '@/lib/masterData/shiftTypesStore';
import type { MasterColumn } from '@/lib/masterData/types';

const columns: MasterColumn<ShiftTypeMaster>[] = [
  { key: 'label', header: 'Shift type', render: i => <span className="font-medium">{i.label}</span> },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'kind', header: 'Kind', render: i => <Badge variant="outline">{i.kind.replace('_', ' ')}</Badge> },
  { key: 'ord', header: 'Ordinary hrs', render: i => i.countsTowardOrdinaryHours ? 'Yes' : 'No' },
  { key: 'sleep', header: 'Sleepover', render: i => i.triggersSleepoverAllowance ? 'Yes' : '—' },
  { key: 'cb', header: 'Callback min', render: i => i.triggersCallbackMinimum ? 'Yes' : '—' },
  { key: 'min', header: 'Min hrs', render: i => i.minEngagementHours ?? '—' },
];

const fields: FieldDef<ShiftTypeMaster>[] = [
  { key: 'kind', type: 'select', label: 'Underlying kind', help: 'Drives which award clauses apply (sleepover allowance, callback minimums, split-shift penalty).',
    options: [
      { value: 'regular', label: 'Regular' }, { value: 'on_call', label: 'On-Call' },
      { value: 'callback', label: 'Callback' }, { value: 'recall', label: 'Recall' },
      { value: 'sleepover', label: 'Sleepover' }, { value: 'split', label: 'Split' },
      { value: 'broken', label: 'Broken' }, { value: 'emergency', label: 'Emergency' },
    ] },
  { key: 'minEngagementHours', type: 'number', label: 'Min engagement (hours)', help: 'Minimum paid duration regardless of actual worked time.' },
  { key: 'countsTowardOrdinaryHours', type: 'toggle', label: 'Counts as ordinary hours', help: 'If off, hours are excluded from weekly ordinary-hours calc (e.g. on-call standby).' },
  { key: 'triggersSleepoverAllowance', type: 'toggle', label: 'Sleepover allowance', help: 'Auto-applies award sleepover allowance.' },
  { key: 'triggersCallbackMinimum', type: 'toggle', label: 'Callback minimum', help: 'Enforces min engagement even if actual work is shorter.' },
  { key: 'splitShiftPenalty', type: 'toggle', label: 'Split-shift penalty', help: 'Adds penalty when the shift has an unpaid gap.' },
];

export function ShiftTypesMasterPanel() {
  return (
    <GenericMasterPanel<ShiftTypeMaster>
      title="Shift types"
      description="Regular, On-Call, Sleepover, Split, Callback — each with its own allowance and overtime treatment."
      store={shiftTypesStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `st-${Date.now().toString(36)}`, code: '', label: '', kind: 'regular',
        triggersSleepoverAllowance: false, triggersCallbackMinimum: false,
        splitShiftPenalty: false, countsTowardOrdinaryHours: true,
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
