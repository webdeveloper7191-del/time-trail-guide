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
import { PlanTier, planAllows, planAllowsSub } from '@/types/plans';
import { planStore } from '@/lib/planStore';

const ROLES_KEY = 'rai.permissions.roles.v1';
const MATRIX_KEY = 'rai.permissions.matrix.v2';
const ASSIGN_KEY = 'rai.permissions.assignments.v1';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
  emit();
}

export const permissionsStore = {
  getRoles: (): RoleDefinition[] => read(ROLES_KEY, DEFAULT_ROLES),
  getMatrix: (): PermissionMatrix => read(MATRIX_KEY, DEFAULT_MATRIX),
  /** staffId -> roleId */
  getAssignments: (): Record<string, string> => read(ASSIGN_KEY, {}),

  saveRoles: (roles: RoleDefinition[]) => write(ROLES_KEY, roles),
  saveMatrix: (matrix: PermissionMatrix) => write(MATRIX_KEY, matrix),
  saveAssignments: (a: Record<string, string>) => write(ASSIGN_KEY, a),

  addRole: (role: RoleDefinition, copyFromRoleId?: string) => {
    const roles = permissionsStore.getRoles();
    permissionsStore.saveRoles([...roles, role]);
    const matrix = permissionsStore.getMatrix();
    permissionsStore.saveMatrix({
      ...matrix,
      [role.id]: copyFromRoleId ? { ...(matrix[copyFromRoleId] ?? {}) } : {},
    });
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

