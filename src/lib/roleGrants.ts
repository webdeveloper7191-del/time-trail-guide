import {
  ALL_ACTIONS,
  PERMISSION_MODULES,
  PermissionAction,
  actionLabels,
  getSubPermissions,
  subKey,
} from '@/types/permissions';

/**
 * Pure grant-set algebra shared by the permission store, the matrix draft
 * (preview-before-save), the role compare view and role templates.
 *
 * A "grant set" is the flat `key -> actions` map held for one role, where the
 * key is either a module id or `module:sub`.
 */
export type RoleGrants = Record<string, PermissionAction[]>;

const uniq = (a: PermissionAction[]) => [...new Set(a)];

/** Toggle one action on a module, cascading to every sub-permission. */
export function applyToggleAction(
  grants: RoleGrants,
  moduleId: string,
  action: PermissionAction,
): RoleGrants {
  const next = { ...grants };
  const current = next[moduleId] ?? [];
  const has = current.includes(action);
  let after = has ? current.filter(a => a !== action) : [...current, action];
  if (!has && action !== 'view' && !after.includes('view')) after = ['view', ...after];
  if (has && action === 'view') after = [];
  next[moduleId] = after;

  for (const sub of getSubPermissions(moduleId)) {
    const key = subKey(moduleId, sub.id);
    let subNext = (next[key] ?? []).filter(a => after.includes(a));
    if (!has && sub.actions.includes(action)) {
      subNext = uniq([...subNext, action]);
      if (action !== 'view' && sub.actions.includes('view')) {
        subNext = uniq(['view' as PermissionAction, ...subNext]);
      }
    }
    next[key] = subNext;
  }
  return next;
}

/** Toggle one action on a sub-permission; the parent must allow it too. */
export function applyToggleSubAction(
  grants: RoleGrants,
  moduleId: string,
  subId: string,
  action: PermissionAction,
): RoleGrants {
  const next = { ...grants };
  const key = subKey(moduleId, subId);
  const current = next[key] ?? [];
  const has = current.includes(action);
  let after = has ? current.filter(a => a !== action) : [...current, action];
  if (!has && action !== 'view' && !after.includes('view')) after = ['view', ...after];
  if (has && action === 'view') after = [];
  next[key] = after;
  if (!has) next[moduleId] = uniq([...(next[moduleId] ?? []), ...after]);
  return next;
}

/** Replace a module's actions and re-derive its sub-permissions. */
export function applySetModuleActions(
  grants: RoleGrants,
  moduleId: string,
  actions: PermissionAction[],
): RoleGrants {
  const next: RoleGrants = { ...grants, [moduleId]: actions };
  for (const sub of getSubPermissions(moduleId)) {
    next[subKey(moduleId, sub.id)] = sub.actions.filter(a => actions.includes(a));
  }
  return next;
}

/** Replace a sub-permission's actions, lifting the parent where required. */
export function applySetSubActions(
  grants: RoleGrants,
  moduleId: string,
  subId: string,
  actions: PermissionAction[],
): RoleGrants {
  const next: RoleGrants = { ...grants, [subKey(moduleId, subId)]: actions };
  if (actions.length) next[moduleId] = uniq([...(next[moduleId] ?? []), ...actions]);
  return next;
}

/* ------------------------------------------------------------------ */
/* Labels + diffing                                                     */
/* ------------------------------------------------------------------ */

export interface GrantKeyMeta {
  key: string;
  moduleId: string;
  moduleLabel: string;
  group: string;
  subLabel?: string;
  label: string;
  actions: PermissionAction[];
}

/** Every addressable grant key (modules + sub-permissions) with labels. */
export function grantKeys(): GrantKeyMeta[] {
  const out: GrantKeyMeta[] = [];
  for (const m of PERMISSION_MODULES) {
    out.push({
      key: m.id,
      moduleId: m.id,
      moduleLabel: m.label,
      group: m.group,
      label: m.label,
      actions: m.actions,
    });
    for (const sub of getSubPermissions(m.id)) {
      out.push({
        key: subKey(m.id, sub.id),
        moduleId: m.id,
        moduleLabel: m.label,
        group: m.group,
        subLabel: sub.label,
        label: `${m.label} → ${sub.label}`,
        actions: sub.actions,
      });
    }
  }
  return out;
}

let keyCache: GrantKeyMeta[] | null = null;
export const allGrantKeys = () => (keyCache ??= grantKeys());

export interface GrantDiffRow extends GrantKeyMeta {
  before: PermissionAction[];
  after: PermissionAction[];
  added: PermissionAction[];
  removed: PermissionAction[];
}

/** Rows where `after` differs from `before`, in module order. */
export function diffGrants(before: RoleGrants, after: RoleGrants): GrantDiffRow[] {
  const rows: GrantDiffRow[] = [];
  for (const meta of allGrantKeys()) {
    const b = (before[meta.key] ?? []).filter(a => meta.actions.includes(a));
    const a = (after[meta.key] ?? []).filter(x => meta.actions.includes(x));
    const added = a.filter(x => !b.includes(x));
    const removed = b.filter(x => !a.includes(x));
    if (added.length || removed.length) {
      rows.push({ ...meta, before: b, after: a, added, removed });
    }
  }
  return rows;
}

export const countChanges = (rows: GrantDiffRow[]) =>
  rows.reduce((sum, r) => sum + r.added.length + r.removed.length, 0);

/** Total granted actions across a grant set. */
export const grantTotal = (grants: RoleGrants) =>
  allGrantKeys().reduce(
    (sum, m) => sum + (grants[m.key] ?? []).filter(a => m.actions.includes(a)).length,
    0,
  );

export const actionListLabel = (actions: PermissionAction[]) =>
  ALL_ACTIONS.filter(a => actions.includes(a))
    .map(a => actionLabels[a])
    .join(', ');

/** Drop unknown keys/actions — used when importing a template from elsewhere. */
export function sanitiseGrants(raw: unknown): { grants: RoleGrants; skipped: number } {
  const grants: RoleGrants = {};
  let skipped = 0;
  if (!raw || typeof raw !== 'object') return { grants, skipped };
  const known = new Map(allGrantKeys().map(m => [m.key, m.actions]));
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const allowed = known.get(key);
    if (!allowed || !Array.isArray(value)) {
      skipped += 1;
      continue;
    }
    const actions = (value as unknown[]).filter(
      (a): a is PermissionAction => typeof a === 'string' && (allowed as string[]).includes(a),
    );
    if (actions.length !== value.length) skipped += 1;
    grants[key] = actions;
  }
  return { grants, skipped };
}

/** Merge two grant sets (union of actions per key). */
export function mergeGrants(base: RoleGrants, incoming: RoleGrants): RoleGrants {
  const out: RoleGrants = { ...base };
  for (const [key, actions] of Object.entries(incoming)) {
    out[key] = uniq([...(out[key] ?? []), ...actions]);
  }
  return out;
}
