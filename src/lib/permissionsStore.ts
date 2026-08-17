import { useEffect, useState } from 'react';
import {
  DEFAULT_MATRIX,
  DEFAULT_ROLES,
  PermissionAction,
  PermissionMatrix,
  RoleDefinition,
  getSubPermissions,
  subKey,

} from '@/types/permissions';
import { PlanTier } from '@/types/plans';
import { planAllows, planAllowsSub } from '@/lib/planEntitlementsStore';
import { planStore } from '@/lib/planStore';

const ROLES_KEY = 'rai.permissions.roles.v3';
const MATRIX_KEY = 'rai.permissions.matrix.v6';
const ASSIGN_KEY = 'rai.permissions.assignments.v1';
const ASSIGN_V2_KEY = 'rai.permissions.assignments.v2';

/**
 * A person can hold several roles, each optionally scoped to one location
 * (`locationId: null` means "everywhere"). Effective access is the union.
 */
export interface RoleAssignment {
  roleId: string;
  /** null = all locations the person belongs to. */
  locationId: string | null;
}
export type RoleAssignments = Record<string, RoleAssignment[]>;

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Snapshot cache. Reading localStorage + JSON.parse on every render made the
 * permission matrix re-parse the whole store on each toggle; caching keeps
 * object identity stable so memoised rows can bail out of re-rendering.
 */
const cache = new Map<string, unknown>();
const emit = () => listeners.forEach(l => l());

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

function write<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
  emit();
}

/** One-time migration of the legacy single-role map to multi-role assignments. */
function readAssignments(): RoleAssignments {
  if (cache.has(ASSIGN_V2_KEY)) return cache.get(ASSIGN_V2_KEY) as RoleAssignments;
  let value: RoleAssignments = {};
  try {
    const raw = localStorage.getItem(ASSIGN_V2_KEY);
    if (raw) {
      value = JSON.parse(raw) as RoleAssignments;
    } else {
      const legacy = localStorage.getItem(ASSIGN_KEY);
      if (legacy) {
        const map = JSON.parse(legacy) as Record<string, string>;
        value = Object.fromEntries(
          Object.entries(map).map(([staffId, roleId]) => [staffId, [{ roleId, locationId: null }]]),
        );
      }
    }
  } catch {
    value = {};
  }
  cache.set(ASSIGN_V2_KEY, value);
  return value;
}

export const permissionsStore = {
  getRoles: (): RoleDefinition[] => read(ROLES_KEY, DEFAULT_ROLES),
  getMatrix: (): PermissionMatrix => read(MATRIX_KEY, DEFAULT_MATRIX),
  /** staffId -> role assignments (multi-role, optionally location scoped) */
  getAssignments: (): RoleAssignments => readAssignments(),

  saveRoles: (roles: RoleDefinition[]) => write(ROLES_KEY, roles),
  saveMatrix: (matrix: PermissionMatrix) => write(MATRIX_KEY, matrix),
  saveAssignments: (a: RoleAssignments) => write(ASSIGN_V2_KEY, a),

  /** Replace every assignment for one person. */
  setStaffAssignments: (staffId: string, list: RoleAssignment[]) => {
    const next = { ...permissionsStore.getAssignments() };
    if (list.length) next[staffId] = list;
    else delete next[staffId];
    permissionsStore.saveAssignments(next);
  },

  /** Add a role (optionally location scoped) to many people at once. */
  bulkAssign: (
    staffIds: string[],
    roleId: string,
    locationId: string | null,
    mode: 'add' | 'replace' = 'add',
  ) => {
    const next = { ...permissionsStore.getAssignments() };
    for (const id of staffIds) {
      const current = mode === 'replace' ? [] : (next[id] ?? []);
      if (current.some(a => a.roleId === roleId && a.locationId === locationId)) continue;
      next[id] = [...current, { roleId, locationId }];
    }
    permissionsStore.saveAssignments(next);
  },

  /** Remove a role (optionally location scoped) from many people at once. */
  bulkUnassign: (staffIds: string[], roleId: string, locationId: string | null | 'any' = 'any') => {
    const next = { ...permissionsStore.getAssignments() };
    for (const id of staffIds) {
      const list = (next[id] ?? []).filter(
        a => !(a.roleId === roleId && (locationId === 'any' || a.locationId === locationId)),
      );
      if (list.length) next[id] = list;
      else delete next[id];
    }
    permissionsStore.saveAssignments(next);
  },


  addRole: (role: RoleDefinition, copyFromRoleId?: string) => {
    const roles = permissionsStore.getRoles();
    permissionsStore.saveRoles([...roles, role]);
    const matrix = permissionsStore.getMatrix();
    permissionsStore.saveMatrix({
      ...matrix,
      [role.id]: copyFromRoleId ? { ...(matrix[copyFromRoleId] ?? {}) } : {},
    });
  },

  updateRole: (roleId: string, patch: Partial<Omit<RoleDefinition, 'id' | 'system'>>) => {
    permissionsStore.saveRoles(
      permissionsStore.getRoles().map(r => (r.id === roleId && !r.system ? { ...r, ...patch } : r)),
    );
  },

  deleteRole: (roleId: string) => {
    permissionsStore.saveRoles(permissionsStore.getRoles().filter(r => r.id !== roleId));
    const matrix = { ...permissionsStore.getMatrix() };
    delete matrix[roleId];
    permissionsStore.saveMatrix(matrix);
  },

  /** Parent module toggle — cascades down to every sub-permission. */
  toggleAction: (roleId: string, moduleId: string, action: PermissionAction) => {
    const matrix = permissionsStore.getMatrix();
    const roleMatrix = { ...(matrix[roleId] ?? {}) };
    const current = roleMatrix[moduleId] ?? [];
    const has = current.includes(action);
    let next = has ? current.filter(a => a !== action) : [...current, action];
    // Any non-view grant implies view.
    if (!has && action !== 'view' && !next.includes('view')) next = ['view', ...next];
    if (has && action === 'view') next = [];
    roleMatrix[moduleId] = next;

    for (const sub of getSubPermissions(moduleId)) {
      const key = subKey(moduleId, sub.id);
      const subCurrent = roleMatrix[key] ?? [];
      // Only keep sub grants that are still allowed by the parent.
      let subNext = subCurrent.filter(a => next.includes(a));
      if (!has && sub.actions.includes(action)) {
        // Granting on the parent switches the action on everywhere below it.
        subNext = [...new Set([...subNext, action])];
        if (action !== 'view' && sub.actions.includes('view')) subNext = [...new Set(['view' as PermissionAction, ...subNext])];
      }
      roleMatrix[key] = subNext;
    }

    permissionsStore.saveMatrix({ ...matrix, [roleId]: roleMatrix });
  },

  /** Sub-permission toggle — implies the same action on the parent module. */
  toggleSubAction: (
    roleId: string,
    moduleId: string,
    subId: string,
    action: PermissionAction,
  ) => {
    const matrix = permissionsStore.getMatrix();
    const roleMatrix = { ...(matrix[roleId] ?? {}) };
    const key = subKey(moduleId, subId);
    const current = roleMatrix[key] ?? [];
    const has = current.includes(action);
    let next = has ? current.filter(a => a !== action) : [...current, action];
    if (!has && action !== 'view' && !next.includes('view')) next = ['view', ...next];
    if (has && action === 'view') next = [];
    roleMatrix[key] = next;

    if (!has) {
      // Parent must allow anything granted below it.
      const parent = roleMatrix[moduleId] ?? [];
      const parentNext = [...new Set([...parent, ...next])];
      roleMatrix[moduleId] = parentNext;
    }

    permissionsStore.saveMatrix({ ...matrix, [roleId]: roleMatrix });
  },

  /** Set the whole module (and all its sub-permissions) at once. */
  setModuleActions: (roleId: string, moduleId: string, actions: PermissionAction[]) => {
    const matrix = permissionsStore.getMatrix();
    const roleMatrix = { ...(matrix[roleId] ?? {}), [moduleId]: actions };
    for (const sub of getSubPermissions(moduleId)) {
      roleMatrix[subKey(moduleId, sub.id)] = sub.actions.filter(a => actions.includes(a));
    }
    permissionsStore.saveMatrix({ ...matrix, [roleId]: roleMatrix });
  },

  setSubActions: (
    roleId: string,
    moduleId: string,
    subId: string,
    actions: PermissionAction[],
  ) => {
    const matrix = permissionsStore.getMatrix();
    const roleMatrix = { ...(matrix[roleId] ?? {}), [subKey(moduleId, subId)]: actions };
    if (actions.length) {
      roleMatrix[moduleId] = [...new Set([...(roleMatrix[moduleId] ?? []), ...actions])];
    }
    permissionsStore.saveMatrix({ ...matrix, [roleId]: roleMatrix });
  },

  /**
   * Bulk: enable or disable a module (and every sub-permission below it) for
   * every role at once. When `actions` is omitted the module's full action set
   * is used for "enable".
   */
  setModuleForAllRoles: (
    moduleId: string,
    on: boolean,
    actions: PermissionAction[] = [],
  ) => {
    const matrix = { ...permissionsStore.getMatrix() };
    const next = on ? actions : [];
    for (const role of permissionsStore.getRoles()) {
      const roleMatrix = { ...(matrix[role.id] ?? {}), [moduleId]: next };
      for (const sub of getSubPermissions(moduleId)) {
        roleMatrix[subKey(moduleId, sub.id)] = sub.actions.filter(a => next.includes(a));
      }
      matrix[role.id] = roleMatrix;
    }
    permissionsStore.saveMatrix(matrix);
  },

  /** Bulk: turn a single action on/off for a module (and children) in every role. */
  setActionForAllRoles: (moduleId: string, action: PermissionAction, on: boolean) => {
    const matrix = { ...permissionsStore.getMatrix() };
    for (const role of permissionsStore.getRoles()) {
      const roleMatrix = { ...(matrix[role.id] ?? {}) };
      const current = roleMatrix[moduleId] ?? [];
      let next: PermissionAction[];
      if (on) {
        next = [...new Set([...current, action])];
        if (action !== 'view') next = [...new Set(['view' as PermissionAction, ...next])];
      } else {
        next = action === 'view' ? [] : current.filter(a => a !== action);
      }
      roleMatrix[moduleId] = next;
      for (const sub of getSubPermissions(moduleId)) {
        const key = subKey(moduleId, sub.id);
        let subNext = (roleMatrix[key] ?? []).filter(a => next.includes(a));
        if (on && sub.actions.includes(action)) {
          subNext = [...new Set([...subNext, action])];
          if (action !== 'view' && sub.actions.includes('view')) {
            subNext = [...new Set(['view' as PermissionAction, ...subNext])];
          }
        }
        roleMatrix[key] = subNext;
      }
      matrix[role.id] = roleMatrix;
    }
    permissionsStore.saveMatrix(matrix);
  },

  resetToDefaults: () => {
    write(ROLES_KEY, DEFAULT_ROLES);
    write(MATRIX_KEY, DEFAULT_MATRIX);
  },

  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** Roles that apply to a person, optionally narrowed to one location. */
export function rolesForStaff(
  assignments: RoleAssignments,
  staffId: string,
  locationId?: string | null,
): string[] {
  const list = assignments[staffId] ?? [];
  const scoped = locationId
    ? list.filter(a => a.locationId === null || a.locationId === locationId)
    : list;
  return [...new Set(scoped.map(a => a.roleId))];
}

/** Union of the grants of every role a person holds (in a location context). */
export function unionActions(
  matrix: PermissionMatrix,
  roleIds: string[],
  key: string,
): PermissionAction[] {
  const set = new Set<PermissionAction>();
  for (const roleId of roleIds) for (const a of matrix[roleId]?.[key] ?? []) set.add(a);
  return [...set];
}

export function usePermissionsStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = permissionsStore.subscribe(() => force(n => n + 1));
    return () => {
      unsub();
    };
  }, []);
  return {
    roles: permissionsStore.getRoles(),
    matrix: permissionsStore.getMatrix(),
    assignments: permissionsStore.getAssignments(),
  };
}


/**
 * Effective permission = what the role grants AND what the subscription plan
 * sells. Both must be true.
 */
export function can(
  matrix: PermissionMatrix,
  roleId: string,
  moduleId: string,
  action: PermissionAction,
  tier: PlanTier = planStore.getTier(),
) {
  return (
    (matrix[roleId]?.[moduleId] ?? []).includes(action) && planAllows(tier, moduleId, action)
  );
}

export function canSub(
  matrix: PermissionMatrix,
  roleId: string,
  moduleId: string,
  subId: string,
  action: PermissionAction,
  tier: PlanTier = planStore.getTier(),
) {
  return (
    (matrix[roleId]?.[subKey(moduleId, subId)] ?? []).includes(action) &&
    planAllowsSub(tier, moduleId, subId, action)
  );
}

