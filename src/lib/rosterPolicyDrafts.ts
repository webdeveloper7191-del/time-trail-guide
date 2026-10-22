export type PolicyValue = string | number | boolean;
export type PolicyValues = Record<string, PolicyValue>;
export interface PolicyDrafts {
  business: PolicyValues;
  locations: Record<string, PolicyValues>;
  history: { id: string; scope: string; section: string; date: string; changes: number }[];
}
export const emptyPolicyDrafts: PolicyDrafts = { business: {}, locations: {}, history: [] };
export function resolvePolicyDraft(defaults: PolicyValues, drafts: PolicyDrafts, scope: string): PolicyValues {
  return { ...defaults, ...drafts.business, ...(scope === 'business' ? {} : drafts.locations[scope] ?? {}) };
}
export function savePolicySection(drafts: PolicyDrafts, scope: string, keys: string[], values: PolicyValues, defaults: PolicyValues): PolicyDrafts {
  const business = { ...drafts.business };
  const location = { ...drafts.locations[scope] };
  for (const key of keys) {
    if (scope === 'business') business[key] = values[key];
    else if (values[key] === (business[key] ?? defaults[key])) delete location[key];
    else location[key] = values[key];
  }
  return { ...drafts, business, locations: scope === 'business' ? drafts.locations : { ...drafts.locations, [scope]: location } };
}