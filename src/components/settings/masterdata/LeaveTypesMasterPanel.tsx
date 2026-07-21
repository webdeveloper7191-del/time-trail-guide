import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { leaveTypesStore, type LeaveTypeMaster } from '@/lib/masterData/leaveTypesStore';
import type { MasterColumn } from '@/lib/masterData/types';

const columns: MasterColumn<LeaveTypeMaster>[] = [
  { key: 'label', header: 'Leave type', render: i => <span className="font-medium">{i.label}</span> },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'ledger', header: 'Ledger', render: i => <Badge variant="outline">{i.ledgerKey.toUpperCase()}</Badge> },
  { key: 'paid', header: 'Paid', render: i => i.paid ? 'Yes' : 'No' },
  { key: 'source', header: 'Accrual source', render: i => i.accrualSource.replace('_', ' ') },
  { key: 'unit', header: 'Unit', render: i => i.unit },
  { key: 'cap', header: 'Cap', render: i => i.capHours ? `${i.capHours}h` : '—' },
];

const fields: FieldDef<LeaveTypeMaster>[] = [
  { key: 'ledgerKey', type: 'select', label: 'Ledger key', help: 'Which balance this type deducts from. RDO/ADO/TOIL map to the specialised ledgers.',
    options: [
      { value: 'annual', label: 'Annual' }, { value: 'personal', label: 'Personal / Carer\'s' }, { value: 'lsl', label: 'Long Service' },
      { value: 'rdo', label: 'RDO' }, { value: 'ado', label: 'ADO' }, { value: 'toil', label: 'TOIL' },
      { value: 'compassionate', label: 'Compassionate' }, { value: 'parental', label: 'Parental' },
      { value: 'unpaid', label: 'Unpaid' }, { value: 'other', label: 'Other' },
    ] },
  { key: 'accrualSource', type: 'select', label: 'Accrual source', help: 'What generates balance. TOIL must come from overtime; RDO/ADO must come from ordinary hours.',
    options: [
      { value: 'ordinary_hours', label: 'Ordinary hours' }, { value: 'overtime', label: 'Overtime' },
      { value: 'anniversary', label: 'Anniversary (LSL)' }, { value: 'manual', label: 'Manual grant' },
    ] },
  { key: 'unit', type: 'select', label: 'Unit', options: [{ value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }] },
  { key: 'accrualRatePerHour', type: 'number', label: 'Accrual rate per ordinary hour', help: 'e.g. 0.076923 = 4 weeks/yr.' },
  { key: 'capHours', type: 'number', label: 'Cap (hours)', help: 'Optional maximum balance.' },
  { key: 'paid', type: 'toggle', label: 'Paid leave', help: 'Employee receives pay while on leave.' },
  { key: 'requiresEvidence', type: 'toggle', label: 'Requires evidence', help: 'Medical certificate, statutory declaration, etc.' },
];

export function LeaveTypesMasterPanel() {
  return (
    <GenericMasterPanel<LeaveTypeMaster>
      title="Leave types"
      description="Every leave type an employee can request. Ledger key + accrual source drive the leave engine (RDO/ADO/TOIL rules baked in)."
      store={leaveTypesStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `lt-${Date.now().toString(36)}`, code: '', label: '',
        ledgerKey: 'other', paid: true, requiresEvidence: false,
        accrualSource: 'manual', unit: 'hours',
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
