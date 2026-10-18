import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { StaffMember } from '@/types/staff';
beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-18T12:00:00Z')); });
afterEach(() => vi.useRealTimers());
describe('Guide-based recognition workflow', () => {
  it('publishes and awards only after a designated approver approves, once', async () => {
    const { recognitionWorkflowStore: w } = await import('./recognitionWorkflowStore');
    const { rewardsStore: r, pointsBalance } = await import('./rewardsStore');
    const { recognitionStore: feed } = await import('./recognitionStore');
    w.saveSettings({ approverIds: ['staff-2'], approvalPoints: 25 });
    const before = pointsBalance(r.get(), 'staff-1');
    const n = w.nominate('staff-3', 'staff-1', 'cv-1', 'Acted with integrity');
    expect(feed.get().posts.some(p => p.id === `recognition:${n.id}`)).toBe(false);
    expect(pointsBalance(r.get(), 'staff-1')).toBe(before);
    expect(() => w.decide(n.id, 'staff-3', 'approved')).toThrow('configured');
    w.decide(n.id, 'staff-2', 'approved');
    expect(pointsBalance(r.get(), 'staff-1')).toBe(before + 25);
    expect(feed.get().posts.filter(p => p.id === `recognition:${n.id}`)).toHaveLength(1);
    expect(() => w.decide(n.id, 'staff-2', 'approved')).toThrow('already');
    vi.resetModules(); const { recognitionWorkflowStore: loaded } = await import('./recognitionWorkflowStore');
    expect(loaded.get().nominations.find(item => item.id === n.id)?.status).toBe('approved');
  });
  it('declining a nomination awards no points and publishes no post', async () => {
    const { recognitionWorkflowStore: w } = await import('./recognitionWorkflowStore');
    const { rewardsStore: r } = await import('./rewardsStore');
    const { recognitionStore: feed } = await import('./recognitionStore');
    w.saveSettings({ approverIds: ['staff-2'] });
    const n = w.nominate('staff-3', 'staff-1', 'cv-1', 'Nomination');
    w.decide(n.id, 'staff-2', 'declined', 'Needs specific evidence');
    expect(r.get().ledger.some(l => l.sourceId === `recognition:${n.id}`)).toBe(false);
    expect(feed.get().posts.some(p => p.id === `recognition:${n.id}`)).toBe(false);
  });
  it('awards configured birthday and anniversary points once per employee date', async () => {
    const { processMilestoneRewards } = await import('./recognitionWorkflowStore');
    const { rewardsStore: r, pointsBalance } = await import('./rewardsStore');
    r.saveEarningRule({ id: 'er-birthday', trigger: 'birthday', points: 40, monthlyCap: 0, isActive: true });
    const staff = [{ id: 'milestone-person', status: 'active', dateOfBirth: '1990-10-18', employmentStartDate: '2020-10-18' }] as StaffMember[];
    processMilestoneRewards(staff); processMilestoneRewards(staff);
    expect(pointsBalance(r.get(), 'milestone-person')).toBe(140);
    expect(r.get().ledger.filter(l => l.staffId === 'milestone-person')).toHaveLength(2);
    vi.resetModules(); const { processMilestoneRewards: again } = await import('./recognitionWorkflowStore'); again(staff);
    const { rewardsStore: reloaded } = await import('./rewardsStore');
    expect(pointsBalance(reloaded.get(), 'milestone-person')).toBe(140);
  });
  it('caps ad-hoc sending and blocks redemption when the program is disabled', async () => {
    const { rewardsStore: r } = await import('./rewardsStore');
    r.saveSettings({ peerMonthlyAllowance: 100 });
    r.awardPoints('staff-1', 'staff-3', 75, 'Thanks');
    expect(() => r.awardPoints('staff-1', 'staff-3', 26, 'Again')).toThrow('25');
    r.saveSettings({ programEnabled: false });
    expect(() => r.requestRedemption('staff-1', 'rw-coffee')).toThrow('disabled');
  });
  it('cannot refund a cancelled redemption twice', async () => {
    const { rewardsStore: r, pointsBalance } = await import('./rewardsStore');
    const before = pointsBalance(r.get(), 'staff-1');
    const request = r.requestRedemption('staff-1', 'rw-coffee');
    r.decideRedemption(request.id, 'cancelled');
    expect(() => r.decideRedemption(request.id, 'cancelled')).toThrow('no longer');
    expect(pointsBalance(r.get(), 'staff-1')).toBe(before);
  });
});