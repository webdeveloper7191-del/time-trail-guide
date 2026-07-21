import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type AllowanceUnit = 'per_hour' | 'per_shift' | 'per_day' | 'per_week' | 'per_km' | 'per_occasion' | 'one_off';
export type AllowanceRateSource = 'award' | 'fixed' | 'custom';

export interface AllowanceTypeMaster extends MasterItem {
  unit: AllowanceUnit;
  rateSource: AllowanceRateSource;
  defaultAmount?: number;
  taxable: boolean;
  superable: boolean;
  overtimeApplicable: boolean;
  category?: 'skill' | 'expense' | 'condition' | 'penalty';
}

const seed = (): AllowanceTypeMaster[] => ([
  { id: 'al-firstaid',    code: 'FA',   label: 'First Aid',            unit: 'per_shift',    rateSource: 'award', taxable: true,  superable: true,  overtimeApplicable: false, category: 'skill',     status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-lead',        code: 'LEAD', label: 'Leading Hand',         unit: 'per_hour',     rateSource: 'award', taxable: true,  superable: true,  overtimeApplicable: true,  category: 'skill',     status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-higher',      code: 'HD',   label: 'Higher Duties',        unit: 'per_hour',     rateSource: 'custom',taxable: true,  superable: true,  overtimeApplicable: true,  category: 'skill',     status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-vehicle',     code: 'KM',   label: 'Vehicle / km',         unit: 'per_km',       rateSource: 'award', taxable: false, superable: false, overtimeApplicable: false, category: 'expense',   status: 'active', scope: 'tenant', isSystemDefault: true, description: 'Non-taxable reimbursement.' },
  { id: 'al-meal',        code: 'MEAL', label: 'Meal',                 unit: 'per_occasion', rateSource: 'award', taxable: false, superable: false, overtimeApplicable: false, category: 'expense',   status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-sleepover',   code: 'SLP',  label: 'Sleepover',            unit: 'per_shift',    rateSource: 'award', taxable: true,  superable: true,  overtimeApplicable: false, category: 'condition', status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-oncall',      code: 'ONC',  label: 'On-Call standby',      unit: 'per_hour',     rateSource: 'award', taxable: true,  superable: true,  overtimeApplicable: false, category: 'condition', status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-broken',      code: 'BRK',  label: 'Broken shift penalty', unit: 'per_shift',    rateSource: 'award', taxable: true,  superable: true,  overtimeApplicable: false, category: 'penalty',   status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'al-uniform',     code: 'UNI',  label: 'Uniform / laundry',    unit: 'per_week',     rateSource: 'award', taxable: false, superable: false, overtimeApplicable: false, category: 'expense',   status: 'active', scope: 'tenant', isSystemDefault: true },
]);

export const allowanceTypesStore = createMasterStore<AllowanceTypeMaster>({
  masterKey: 'allowanceTypes',
  storageKey: 'rai.masterData.allowanceTypes',
  seed,
});
