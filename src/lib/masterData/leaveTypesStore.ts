import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type LeaveAccrualSource = 'ordinary_hours' | 'overtime' | 'manual' | 'anniversary';
export type LeaveUnit = 'hours' | 'days';
export type LeaveLedgerKey = 'annual' | 'personal' | 'lsl' | 'rdo' | 'ado' | 'toil' | 'compassionate' | 'parental' | 'unpaid' | 'other';

export interface LeaveTypeMaster extends MasterItem {
  ledgerKey: LeaveLedgerKey;
  paid: boolean;
  requiresEvidence: boolean;
  accrualSource: LeaveAccrualSource;
  /** Accrual rate expressed per source-unit hour. e.g. 4 wks/yr @ 38hr week = 4/(52*38) */
  accrualRatePerHour?: number;
  capHours?: number;
  unit: LeaveUnit;
  /** Blocks accrual when generated from OT (for RDO/ADO) or from ordinary hours (for TOIL). */
  disallowedSources?: LeaveAccrualSource[];
  color?: string;
}

const seed = (): LeaveTypeMaster[] => ([
  { id: 'lt-annual',       code: 'AL',   label: 'Annual Leave',        ledgerKey: 'annual',       paid: true,  requiresEvidence: false, accrualSource: 'ordinary_hours', accrualRatePerHour: 0.076923, unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, description: 'NES: 4 weeks per year of ordinary hours.' },
  { id: 'lt-personal',     code: 'PL',   label: 'Personal / Carer\'s',  ledgerKey: 'personal',     paid: true,  requiresEvidence: true,  accrualSource: 'ordinary_hours', accrualRatePerHour: 0.038461, unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, description: 'NES: 10 days per year.' },
  { id: 'lt-lsl',          code: 'LSL',  label: 'Long Service Leave',  ledgerKey: 'lsl',          paid: true,  requiresEvidence: false, accrualSource: 'anniversary',    unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, description: 'State-based; accrues from anniversary years.' },
  { id: 'lt-compassionate',code: 'COMP', label: 'Compassionate Leave', ledgerKey: 'compassionate',paid: true,  requiresEvidence: true,  accrualSource: 'manual',         unit: 'days',  status: 'active', scope: 'tenant', isSystemDefault: true, description: 'NES: 2 days per occasion.' },
  { id: 'lt-parental',     code: 'PAR',  label: 'Parental Leave',      ledgerKey: 'parental',     paid: false, requiresEvidence: true,  accrualSource: 'manual',         unit: 'days',  status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'lt-unpaid',       code: 'UNP',  label: 'Leave Without Pay',   ledgerKey: 'unpaid',       paid: false, requiresEvidence: false, accrualSource: 'manual',         unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'lt-rdo',          code: 'RDO',  label: 'Rostered Day Off',    ledgerKey: 'rdo',          paid: true,  requiresEvidence: false, accrualSource: 'ordinary_hours', unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, disallowedSources: ['overtime'], description: 'Never accrues from overtime.' },
  { id: 'lt-ado',          code: 'ADO',  label: 'Accrued Day Off',     ledgerKey: 'ado',          paid: true,  requiresEvidence: false, accrualSource: 'ordinary_hours', unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, disallowedSources: ['overtime'] },
  { id: 'lt-toil',         code: 'TOIL', label: 'Time Off in Lieu',    ledgerKey: 'toil',         paid: true,  requiresEvidence: false, accrualSource: 'overtime',       unit: 'hours', status: 'active', scope: 'tenant', isSystemDefault: true, disallowedSources: ['ordinary_hours'], description: 'Instead of overtime pay. Never from ordinary hours.' },
]);

export const leaveTypesStore = createMasterStore<LeaveTypeMaster>({
  masterKey: 'leaveTypes',
  storageKey: 'rai.masterData.leaveTypes',
  seed,
});
