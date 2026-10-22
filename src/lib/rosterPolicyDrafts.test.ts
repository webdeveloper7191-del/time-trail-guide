import { describe, expect, it } from 'vitest';
import { emptyPolicyDrafts, resolvePolicyDraft, savePolicySection } from './rosterPolicyDrafts';
import { rosterPolicyDefaults } from '@/components/settings/rosterPolicyCatalog';

describe('roster policy design drafts', () => {
  it('keeps published edits in draft until explicitly republished', () => {
    expect(rosterPolicyDefaults.publishChanges).toBe('Draft until explicitly republished');
  });
  it('keeps staff on the last published roster', () => {
    expect(rosterPolicyDefaults.publishStaffView).toBe('Last published roster until republishing');
  });
  it('does not reuse another location’s override', () => {
    const saved = savePolicySection(emptyPolicyDrafts, 'loc-1', ['swapApproval'], { swapApproval: false }, rosterPolicyDefaults);
    expect(resolvePolicyDraft(rosterPolicyDefaults, saved, 'loc-1').swapApproval).toBe(false);
    expect(resolvePolicyDraft(rosterPolicyDefaults, saved, 'loc-2').swapApproval).toBe(true);
  });
  it('removes an override when reset to business defaults', () => {
    const saved = savePolicySection(emptyPolicyDrafts, 'loc-1', ['swapApproval'], { swapApproval: false }, rosterPolicyDefaults);
    const reset = savePolicySection(saved, 'loc-1', ['swapApproval'], { swapApproval: true }, rosterPolicyDefaults);
    expect(reset.locations['loc-1']).not.toHaveProperty('swapApproval');
  });
  it('inherits later business changes without altering a location override', () => {
    const first = savePolicySection(emptyPolicyDrafts, 'loc-1', ['swapWages'], { swapWages: 'Equal wages only' }, rosterPolicyDefaults);
    const next = savePolicySection(first, 'business', ['swapWages'], { swapWages: 'Higher, equal or lower wages' }, rosterPolicyDefaults);
    expect(resolvePolicyDraft(rosterPolicyDefaults, next, 'loc-1').swapWages).toBe('Equal wages only');
    expect(resolvePolicyDraft(rosterPolicyDefaults, next, 'loc-2').swapWages).toBe('Higher, equal or lower wages');
  });
});