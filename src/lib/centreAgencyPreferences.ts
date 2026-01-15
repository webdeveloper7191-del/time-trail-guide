// Centre-level agency preferences for blacklist/preferred status

export type AgencyPreferenceStatus = 'preferred' | 'neutral' | 'blacklisted';

export interface CentreAgencyPreference {
  centreId: string;
  agencyId: string;
  status: AgencyPreferenceStatus;
  reason?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CentreAgencyPreferencesMap {
  [centreId: string]: {
    [agencyId: string]: CentreAgencyPreference;
  };
}

// Mock data for centre agency preferences
const mockPreferences: CentreAgencyPreferencesMap = {
  'centre-1': {
    'agency-1': {
      centreId: 'centre-1',
      agencyId: 'agency-1',
      status: 'preferred',
      reason: 'Consistently high-quality candidates with excellent reliability scores',
      updatedAt: '2024-12-01T10:00:00Z',
      updatedBy: 'admin@example.com',
    },
    'agency-4': {
      centreId: 'centre-1',
      agencyId: 'agency-4',
      status: 'blacklisted',
      reason: 'Multiple no-shows and poor candidate quality in the past 6 months',
      updatedAt: '2024-11-15T14:30:00Z',
      updatedBy: 'admin@example.com',
    },
  },
  'centre-2': {
    'agency-2': {
      centreId: 'centre-2',
      agencyId: 'agency-2',
      status: 'preferred',
      reason: 'Fast response times and great communication',
      updatedAt: '2024-10-20T09:15:00Z',
      updatedBy: 'manager@example.com',
    },
  },
  'centre-3': {
    'agency-3': {
      centreId: 'centre-3',
      agencyId: 'agency-3',
      status: 'preferred',
      reason: 'Specializes in our age group requirements',
      updatedAt: '2024-09-10T11:45:00Z',
      updatedBy: 'director@example.com',
    },
    'agency-4': {
      centreId: 'centre-3',
      agencyId: 'agency-4',
      status: 'blacklisted',
      reason: 'Failed compliance requirements',
      updatedAt: '2024-08-05T16:20:00Z',
      updatedBy: 'director@example.com',
    },
  },
};

// In-memory store (would be replaced with API calls in production)
let preferences: CentreAgencyPreferencesMap = { ...mockPreferences };

export function getCentreAgencyPreferences(centreId: string): Record<string, CentreAgencyPreference> {
  return preferences[centreId] || {};
}

export function getAllCentreAgencyPreferences(): CentreAgencyPreferencesMap {
  return { ...preferences };
}

export function getAgencyPreference(centreId: string, agencyId: string): CentreAgencyPreference | null {
  return preferences[centreId]?.[agencyId] || null;
}

export function setAgencyPreference(
  centreId: string,
  agencyId: string,
  status: AgencyPreferenceStatus,
  reason?: string,
  updatedBy: string = 'system'
): CentreAgencyPreference {
  if (!preferences[centreId]) {
    preferences[centreId] = {};
  }

  const preference: CentreAgencyPreference = {
    centreId,
    agencyId,
    status,
    reason,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  preferences[centreId][agencyId] = preference;
  return preference;
}

export function removeAgencyPreference(centreId: string, agencyId: string): boolean {
  if (preferences[centreId]?.[agencyId]) {
    delete preferences[centreId][agencyId];
    return true;
  }
  return false;
}

export function isAgencyPreferred(centreId: string, agencyId: string): boolean {
  return preferences[centreId]?.[agencyId]?.status === 'preferred';
}

export function isAgencyBlacklisted(centreId: string, agencyId: string): boolean {
  return preferences[centreId]?.[agencyId]?.status === 'blacklisted';
}

export function getPreferredAgencies(centreId: string): string[] {
  const centrePrefs = preferences[centreId] || {};
  return Object.entries(centrePrefs)
    .filter(([_, pref]) => pref.status === 'preferred')
    .map(([agencyId]) => agencyId);
}

export function getBlacklistedAgencies(centreId: string): string[] {
  const centrePrefs = preferences[centreId] || {};
  return Object.entries(centrePrefs)
    .filter(([_, pref]) => pref.status === 'blacklisted')
    .map(([agencyId]) => agencyId);
}

// Sort agencies by preference (preferred first, then neutral, blacklisted last)
export function sortAgenciesByPreference<T extends { id: string }>(
  agencies: T[],
  centreId: string
): T[] {
  const centrePrefs = preferences[centreId] || {};
  
  return [...agencies].sort((a, b) => {
    const prefA = centrePrefs[a.id]?.status || 'neutral';
    const prefB = centrePrefs[b.id]?.status || 'neutral';
    
    const order: Record<AgencyPreferenceStatus, number> = {
      preferred: 0,
      neutral: 1,
      blacklisted: 2,
    };
    
    return order[prefA] - order[prefB];
  });
}
