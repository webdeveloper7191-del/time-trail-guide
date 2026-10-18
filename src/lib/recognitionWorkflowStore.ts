import { useSyncExternalStore } from 'react';
import { createBrowserState } from '@/lib/browserState';
import { recognitionStore } from '@/lib/recognitionStore';
import { rewardsStore } from '@/lib/rewardsStore';
import { defaultCultureValues } from '@/types/recognition';
import type { StaffMember } from '@/types/staff';

export interface RecognitionValue { id: string; name: string; description: string; active: boolean }
export interface ValueNomination {
  id: string; fromStaffId: string; toStaffId: string; valueId: string; valueName: string; reason: string;
  status: 'pending' | 'approved' | 'declined'; createdAt: string; decidedAt?: string; decidedBy?: string; decisionNote?: string; pointsAwarded?: number;
}
interface WorkflowState {
  enabled: boolean; approverIds: string[]; approvalPoints: number; values: RecognitionValue[]; nominations: ValueNomination[];
}
const db = createBrowserState<WorkflowState>('rostered.recognition.workflow.v1', {
  enabled: true, approverIds: [], approvalPoints: 25,
  values: defaultCultureValues.map(v => ({ id: v.id, name: v.name, description: v.description, active: true })), nominations: [],
});
export const recognitionWorkflowStore = {
  ...db,
  saveSettings(patch: Partial<Pick<WorkflowState, 'enabled' | 'approverIds' | 'approvalPoints'>>) {
    if (patch.approvalPoints !== undefined && (!Number.isInteger(patch.approvalPoints) || patch.approvalPoints < 0)) throw new Error('Points must be a non-negative whole number.');
    db.set(s => ({ ...s, ...patch }));
  },
  saveValue(value: RecognitionValue) {
    if (!value.name.trim()) throw new Error('Enter a company value name.');
    db.set(s => ({ ...s, values: s.values.some(v => v.id === value.id) ? s.values.map(v => v.id === value.id ? { ...value, name: value.name.trim() } : v) : [...s.values, { ...value, name: value.name.trim() }] }));
  },
  nominate(fromStaffId: string, toStaffId: string, valueId: string, reason: string) {
    const state = db.get();
    if (!state.enabled) throw new Error('Recognition nominations are disabled.');
    if (!state.approverIds.length) throw new Error('Select at least one recognition approver in Settings first.');
    const value = state.values.find(v => v.id === valueId && v.active);
    if (!value || !toStaffId || fromStaffId === toStaffId || !reason.trim()) throw new Error('Choose a colleague, a company value and a reason.');
    const nomination: ValueNomination = { id: crypto.randomUUID(), fromStaffId, toStaffId, valueId, valueName: value.name, reason: reason.trim(), status: 'pending', createdAt: new Date().toISOString() };
    db.set(s => ({ ...s, nominations: [nomination, ...s.nominations] }));
    return nomination;
  },
  decide(id: string, actor: string, status: 'approved' | 'declined', note = '') {
    const state = db.get();
    if (!state.approverIds.includes(actor)) throw new Error('Only a configured recognition approver can review nominations in this browser.');
    const nomination = state.nominations.find(n => n.id === id);
    if (!nomination || nomination.status !== 'pending') throw new Error('This nomination has already been reviewed.');
    if (status === 'declined' && !note.trim()) throw new Error('Enter a reason for declining.');
    let points = 0;
    if (status === 'approved') {
      const sourceId = `recognition:${id}`;
      const existing = rewardsStore.get().ledger.find(l => l.sourceId === sourceId);
      points = existing?.points ?? (rewardsStore.get().settings.programEnabled ? state.approvalPoints : 0);
      if (points > 0 && !existing) rewardsStore.addLedgerEntry({ staffId: nomination.toStaffId, type: 'earned', points, sourceId, reason: `Recognition: ${nomination.valueName}`, awardedBy: actor });
      const postId = `recognition:${id}`;
      if (!recognitionStore.get().posts.some(p => p.id === postId)) recognitionStore.set(s => ({ ...s, posts: [{ id: postId, fromStaffId: nomination.fromStaffId, toStaffId: nomination.toStaffId, category: 'teamwork', message: `${nomination.valueName}: ${nomination.reason}`, badges: [], likes: [], comments: [], pointsAwarded: points, createdAt: new Date().toISOString() }, ...s.posts] }));
    }
    db.set(s => ({ ...s, nominations: s.nominations.map(n => n.id === id ? { ...n, status, decidedBy: actor, decidedAt: new Date().toISOString(), decisionNote: note.trim(), pointsAwarded: points } : n) }));
  },
};
export const useRecognitionWorkflow = () => useSyncExternalStore(db.subscribe, db.get, db.get);

/** Checked on opening the workspace, not by a background scheduler. Private birthdays still receive private ledger rewards. */
export function processMilestoneRewards(staff: StaffMember[], today = new Date()) {
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  for (const person of staff.filter(s => s.status === 'active')) {
    for (const [trigger, source] of [['birthday', person.dateOfBirth], ['work_anniversary', person.employmentStartDate]] as const) {
      if (!source || source.slice(5, 10) !== date.slice(5, 10) || Number(source.slice(0, 4)) >= today.getFullYear()) continue;
      rewardsStore.awardForTrigger(person.id, trigger, undefined, `milestone:${trigger}:${person.id}:${date}`);
    }
  }
}