import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type ShiftKind = 'regular' | 'on_call' | 'callback' | 'recall' | 'sleepover' | 'split' | 'broken' | 'emergency';

export interface ShiftTypeMaster extends MasterItem {
  kind: ShiftKind;
  triggersSleepoverAllowance: boolean;
  triggersCallbackMinimum: boolean;
  splitShiftPenalty: boolean;
  minEngagementHours?: number;
  countsTowardOrdinaryHours: boolean;
  color?: string;
}

const seed = (): ShiftTypeMaster[] => ([
  { id: 'st-regular',   code: 'REG',  label: 'Regular',       kind: 'regular',   triggersSleepoverAllowance: false, triggersCallbackMinimum: false, splitShiftPenalty: false, countsTowardOrdinaryHours: true,  status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'st-on-call',   code: 'ONC',  label: 'On-Call',       kind: 'on_call',   triggersSleepoverAllowance: false, triggersCallbackMinimum: true,  splitShiftPenalty: false, countsTowardOrdinaryHours: false, status: 'active', scope: 'tenant', isSystemDefault: true, description: 'Standby time paid at allowance rate; call-outs paid separately.' },
  { id: 'st-callback',  code: 'CB',   label: 'Callback',      kind: 'callback',  triggersSleepoverAllowance: false, triggersCallbackMinimum: true,  splitShiftPenalty: false, minEngagementHours: 3, countsTowardOrdinaryHours: false, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'st-recall',    code: 'RC',   label: 'Recall',        kind: 'recall',    triggersSleepoverAllowance: false, triggersCallbackMinimum: true,  splitShiftPenalty: false, minEngagementHours: 3, countsTowardOrdinaryHours: false, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'st-sleepover', code: 'SLP',  label: 'Sleepover',     kind: 'sleepover', triggersSleepoverAllowance: true,  triggersCallbackMinimum: false, splitShiftPenalty: false, countsTowardOrdinaryHours: false, status: 'active', scope: 'tenant', isSystemDefault: true, description: 'Flat allowance; disturbed sleep pays extra.' },
  { id: 'st-split',     code: 'SPL',  label: 'Split shift',   kind: 'split',     triggersSleepoverAllowance: false, triggersCallbackMinimum: false, splitShiftPenalty: true,  countsTowardOrdinaryHours: true,  status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'st-broken',    code: 'BRK',  label: 'Broken shift',  kind: 'broken',    triggersSleepoverAllowance: false, triggersCallbackMinimum: false, splitShiftPenalty: true,  countsTowardOrdinaryHours: true,  status: 'active', scope: 'tenant', isSystemDefault: true },
]);

export const shiftTypesStore = createMasterStore<ShiftTypeMaster>({
  masterKey: 'shiftTypes',
  storageKey: 'rai.masterData.shiftTypes',
  seed,
});
