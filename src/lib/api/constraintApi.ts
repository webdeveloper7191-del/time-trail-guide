/**
 * Mock Constraint API
 * Simulates backend CRUD endpoints for scheduling constraints with
 * localStorage persistence and location-scoped overrides.
 */

import {
  SchedulingConstraintsConfig,
  ConstraintSetting,
  createDefaultConstraintsConfig,
} from '@/types/schedulingConstraints';
import { mockApiCall, ApiResponse } from './mockApi';

// ============= STORAGE KEYS =============

const STORAGE_KEY_BUSINESS = 'rostered:constraints:business';
const locationKey = (locationId: string) =>
  `rostered:constraints:location:${locationId}`;

// ============= HELPERS =============

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeFromStorage(key: string) {
  localStorage.removeItem(key);
}

// ============= TYPES =============

export interface ConstraintSavePayload {
  scope: 'business' | 'location';
  locationId?: string;
  constraints: Record<string, ConstraintSetting>;
}

export interface ConstraintResetPayload {
  scope: 'business' | 'location';
  locationId?: string;
  /** If provided, reset only these constraint IDs; otherwise reset all */
  constraintIds?: string[];
}

export interface LocationOverrideSummary {
  locationId: string;
  overriddenCount: number;
  lastUpdated: string;
}

// ============= API FUNCTIONS =============

/**
 * Fetch the business-wide constraint config.
 * Falls back to defaults if nothing is persisted.
 */
async function fetchBusinessConstraints(): Promise<ApiResponse<SchedulingConstraintsConfig>> {
  const stored = loadFromStorage<SchedulingConstraintsConfig>(STORAGE_KEY_BUSINESS);
  const config = stored ?? createDefaultConstraintsConfig();
  return mockApiCall(config);
}

/**
 * Fetch location-scoped overrides merged on top of business defaults.
 * Returns a full config with the location overrides applied.
 */
async function fetchLocationConstraints(
  locationId: string
): Promise<ApiResponse<SchedulingConstraintsConfig>> {
  // Start from business config
  const businessStored = loadFromStorage<SchedulingConstraintsConfig>(STORAGE_KEY_BUSINESS);
  const business = businessStored ?? createDefaultConstraintsConfig();

  // Load location overrides
  const locationOverrides = loadFromStorage<Record<string, Partial<ConstraintSetting>>>(
    locationKey(locationId)
  );

  // Merge: location overrides on top of business
  const merged: Record<string, ConstraintSetting> = { ...business.constraints };
  if (locationOverrides) {
    for (const [id, override] of Object.entries(locationOverrides)) {
      if (merged[id]) {
        merged[id] = {
          ...merged[id],
          locationOverrides: {
            ...merged[id].locationOverrides,
            [locationId]: override,
          },
        };
      }
    }
  }

  const config: SchedulingConstraintsConfig = {
    scope: 'location',
    activeLocationId: locationId,
    constraints: merged,
  };

  return mockApiCall(config);
}

/**
 * Save constraints. Handles both business-wide and location-scoped saves.
 */
async function saveConstraints(
  payload: ConstraintSavePayload
): Promise<ApiResponse<{ savedAt: string }>> {
  const now = new Date().toISOString();

  if (payload.scope === 'business') {
    const config: SchedulingConstraintsConfig = {
      scope: 'business',
      activeLocationId: null,
      constraints: payload.constraints,
    };
    saveToStorage(STORAGE_KEY_BUSINESS, config);
  } else if (payload.scope === 'location' && payload.locationId) {
    // Extract only the location-specific diffs
    const defaults = createDefaultConstraintsConfig();
    const businessStored = loadFromStorage<SchedulingConstraintsConfig>(STORAGE_KEY_BUSINESS);
    const business = businessStored ?? defaults;

    const overrides: Record<string, Partial<ConstraintSetting>> = {};
    for (const [id, setting] of Object.entries(payload.constraints)) {
      const base = business.constraints[id];
      if (!base) continue;

      const diff: Partial<ConstraintSetting> = {};
      if (setting.enforcement !== base.enforcement) diff.enforcement = setting.enforcement;
      if (setting.satisfiability !== base.satisfiability) diff.satisfiability = setting.satisfiability;
      if (setting.weight !== base.weight) diff.weight = setting.weight;
      if (setting.priority !== base.priority) diff.priority = setting.priority;
      if (JSON.stringify(setting.parameters) !== JSON.stringify(base.parameters)) {
        diff.parameters = setting.parameters;
      }
      if (JSON.stringify(setting.conditionalRules) !== JSON.stringify(base.conditionalRules)) {
        diff.conditionalRules = setting.conditionalRules;
      }

      if (Object.keys(diff).length > 0) {
        overrides[id] = diff;
      }
    }

    saveToStorage(locationKey(payload.locationId), overrides);
  }

  return mockApiCall({ savedAt: now });
}

/**
 * Reset constraints to defaults.
 */
async function resetConstraints(
  payload: ConstraintResetPayload
): Promise<ApiResponse<SchedulingConstraintsConfig>> {
  const defaults = createDefaultConstraintsConfig();

  if (payload.scope === 'business') {
    if (payload.constraintIds?.length) {
      // Partial reset: restore only specified IDs
      const current = loadFromStorage<SchedulingConstraintsConfig>(STORAGE_KEY_BUSINESS) ?? defaults;
      for (const id of payload.constraintIds) {
        if (defaults.constraints[id]) {
          current.constraints[id] = { ...defaults.constraints[id] };
        }
      }
      saveToStorage(STORAGE_KEY_BUSINESS, current);
      return mockApiCall(current);
    } else {
      removeFromStorage(STORAGE_KEY_BUSINESS);
      return mockApiCall(defaults);
    }
  } else if (payload.scope === 'location' && payload.locationId) {
    if (payload.constraintIds?.length) {
      const overrides =
        loadFromStorage<Record<string, Partial<ConstraintSetting>>>(
          locationKey(payload.locationId)
        ) ?? {};
      for (const id of payload.constraintIds) {
        delete overrides[id];
      }
      saveToStorage(locationKey(payload.locationId), overrides);
    } else {
      removeFromStorage(locationKey(payload.locationId));
    }
    // Return merged config
    return fetchLocationConstraints(payload.locationId);
  }

  return mockApiCall(defaults);
}

/**
 * List all locations that have overrides stored.
 */
async function listLocationOverrides(): Promise<ApiResponse<LocationOverrideSummary[]>> {
  const summaries: LocationOverrideSummary[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('rostered:constraints:location:')) {
      const locationId = key.replace('rostered:constraints:location:', '');
      const overrides = loadFromStorage<Record<string, Partial<ConstraintSetting>>>(key);
      summaries.push({
        locationId,
        overriddenCount: overrides ? Object.keys(overrides).length : 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  return mockApiCall(summaries);
}

/**
 * Delete a single constraint's location override.
 */
async function deleteLocationOverride(
  locationId: string,
  constraintId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  const overrides =
    loadFromStorage<Record<string, Partial<ConstraintSetting>>>(locationKey(locationId)) ?? {};
  const existed = constraintId in overrides;
  delete overrides[constraintId];

  if (Object.keys(overrides).length === 0) {
    removeFromStorage(locationKey(locationId));
  } else {
    saveToStorage(locationKey(locationId), overrides);
  }

  return mockApiCall({ deleted: existed });
}

// ============= PUBLIC API =============

export const constraintApi = {
  fetchBusiness: fetchBusinessConstraints,
  fetchLocation: fetchLocationConstraints,
  save: saveConstraints,
  reset: resetConstraints,
  listLocationOverrides,
  deleteLocationOverride,
};
