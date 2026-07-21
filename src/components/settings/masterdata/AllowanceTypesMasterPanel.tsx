import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { allowanceTypesStore, type AllowanceTypeMaster } from '@/lib/masterData/allowanceTypesStore';
import type { MasterColumn } from '@/lib/masterData/types';

const columns: MasterColumn<AllowanceTypeMaster>[] = [
  { key: 'label', header: 'Allowance', render: i => <span className="font-medium">{i.label}</span> },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'unit', header: 'Unit', render: i => i.unit.replace('per_', 'per ') },
  { key: 'source', header: 'Rate source', render: i => <Badge variant="outline">{i.rateSource}</Badge> },
  { key: 'amt', header: 'Default', render: i => i.defaultAmount != null ? `$${i.defaultAmount.toFixed(2)}` : '—' },
  { key: 'tax', header: 'Taxable', render: i => i.taxable ? 'Yes' : 'No' },
  { key: 'sup', header: 'Superable', render: i => i.superable ? 'Yes' : 'No' },
  { key: 'ot', header: 'OT applies', render: i => i.overtimeApplicable ? 'Yes' : 'No' },
];

const fields: FieldDef<AllowanceTypeMaster>[] = [
  { key: 'unit', type: 'select', label: 'Unit', help: 'How the allowance is measured — drives the calculation in the shift editor.',
    options: [
      { value: 'per_hour', label: 'Per hour' }, { value: 'per_shift', label: 'Per shift' },
      { value: 'per_day', label: 'Per day' }, { value: 'per_week', label: 'Per week' },
      { value: 'per_km', label: 'Per km' }, { value: 'per_occasion', label: 'Per occasion' },
      { value: 'one_off', label: 'One-off' },
    ] },
  { key: 'rateSource', type: 'select', label: 'Rate source', help: 'Award-linked pulls the rate from the award schedule; Fixed uses this default; Custom lets the user enter per-shift.',
    options: [
      { value: 'award', label: 'Award-linked' }, { value: 'fixed', label: 'Fixed default' }, { value: 'custom', label: 'Custom per-use' },
    ] },
  { key: 'defaultAmount', type: 'number', label: 'Default amount ($)', help: 'Used when rate source is Fixed.' },
  { key: 'category', type: 'select', label: 'Category',
    options: [
      { value: 'skill', label: 'Skill' }, { value: 'expense', label: 'Expense / reimbursement' },
      { value: 'condition', label: 'Working condition' }, { value: 'penalty', label: 'Penalty' },
    ] },
  { key: 'taxable', type: 'toggle', label: 'Taxable', help: 'Included in PAYG wages.' },
  { key: 'superable', type: 'toggle', label: 'Superable', help: 'Counts toward Ordinary Time Earnings for super.' },
  { key: 'overtimeApplicable', type: 'toggle', label: 'Overtime applicable', help: 'Amount uplifts when hours are OT.' },
];

export function AllowanceTypesMasterPanel() {
  return (
    <GenericMasterPanel<AllowanceTypeMaster>
      title="Allowance types"
      description="Everything payable on top of ordinary/OT wages. Categories, tax flags and OT applicability flow into payroll exports."
      store={allowanceTypesStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `al-${Date.now().toString(36)}`, code: '', label: '',
        unit: 'per_shift', rateSource: 'fixed',
        taxable: true, superable: true, overtimeApplicable: false,
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
