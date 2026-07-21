import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type ExceptionSeverity = 'info' | 'warning' | 'error';

export interface ExceptionReasonMaster extends MasterItem {
  severity: ExceptionSeverity;
  blocksApproval: boolean;
  requiresManagerNote: boolean;
  requiresEvidence: boolean;
  autoNotifyPayroll: boolean;
  appliesTo: ('clock_in' | 'clock_out' | 'break' | 'missed_shift' | 'overtime' | 'other')[];
}

const seed = (): ExceptionReasonMaster[] => ([
  { id: 'ex-late',        code: 'LATE',  label: 'Late clock-in',            severity: 'warning', blocksApproval: false, requiresManagerNote: true,  requiresEvidence: false, autoNotifyPayroll: false, appliesTo: ['clock_in'],   status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-early-out',   code: 'EOUT',  label: 'Early clock-out',          severity: 'warning', blocksApproval: false, requiresManagerNote: true,  requiresEvidence: false, autoNotifyPayroll: false, appliesTo: ['clock_out'],  status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-missed-punch',code: 'MISS',  label: 'Missed punch',             severity: 'error',   blocksApproval: true,  requiresManagerNote: true,  requiresEvidence: false, autoNotifyPayroll: true,  appliesTo: ['clock_in', 'clock_out'], status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-no-break',    code: 'NBRK',  label: 'Missed break',             severity: 'warning', blocksApproval: false, requiresManagerNote: true,  requiresEvidence: false, autoNotifyPayroll: false, appliesTo: ['break'],      status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-short-break', code: 'SBRK',  label: 'Break shorter than scheduled', severity: 'warning', blocksApproval: false, requiresManagerNote: true, requiresEvidence: false, autoNotifyPayroll: false, appliesTo: ['break'],      status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-unauth-ot',   code: 'UOT',   label: 'Unauthorised overtime',    severity: 'error',   blocksApproval: true,  requiresManagerNote: true,  requiresEvidence: false, autoNotifyPayroll: true,  appliesTo: ['overtime'],   status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-no-show',     code: 'NS',    label: 'No show',                  severity: 'error',   blocksApproval: true,  requiresManagerNote: true,  requiresEvidence: true,  autoNotifyPayroll: true,  appliesTo: ['missed_shift'], status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'ex-illness',     code: 'ILL',   label: 'Illness / unfit for duty', severity: 'info',    blocksApproval: false, requiresManagerNote: true,  requiresEvidence: true,  autoNotifyPayroll: false, appliesTo: ['other'],      status: 'active', scope: 'tenant', isSystemDefault: true },
]);

export const exceptionReasonsStore = createMasterStore<ExceptionReasonMaster>({
  masterKey: 'exceptionReasons',
  storageKey: 'rai.masterData.exceptionReasons',
  seed,
});
