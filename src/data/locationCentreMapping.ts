// Maps roster centres to location settings, providing the bridge between
// the roster module (centres/rooms) and location management (locations/areas)

import { AreaCombiningThreshold, OperationalOptimization } from '@/types/location';
import { IndustryType } from '@/types/industryConfig';
import { getIndustryOptimizationDefaults } from '@/lib/areaCombiningEngine';

export interface LocationCentreLink {
  centreId: string;
  locationId: string;
  industryType: IndustryType;
}

// Static mapping between roster centres and locations
const CENTRE_LOCATION_MAP: LocationCentreLink[] = [
  { centreId: 'centre-1', locationId: 'loc-1', industryType: 'childcare' },
  { centreId: 'centre-2', locationId: 'loc-2', industryType: 'childcare' },
  { centreId: 'centre-3', locationId: 'loc-3', industryType: 'healthcare' },
];

// Per-location stored optimization configs (simulates DB persistence)
const locationOptimizationStore: Record<string, {
  optimization: OperationalOptimization;
  thresholds: AreaCombiningThreshold[];
}> = {};

// Initialize with industry defaults
function initializeDefaults() {
  for (const link of CENTRE_LOCATION_MAP) {
    if (!locationOptimizationStore[link.locationId]) {
      const defaults = getIndustryOptimizationDefaults(link.industryType);
      locationOptimizationStore[link.locationId] = {
        optimization: {
          id: `opt-${link.locationId}`,
          type: link.industryType === 'childcare' ? 'area_combining' 
              : link.industryType === 'healthcare' ? 'ward_consolidation'
              : 'area_combining',
          name: `${link.industryType} Optimization`,
          description: defaults.context,
          isEnabled: true,
          thresholds: defaults.thresholds,
          peakOptimizationWindows: defaults.optimizationWindows,
          enableCostTracking: true,
          estimatedSavingsPerCombine: link.industryType === 'healthcare' ? 120 : 50,
          notifyManagers: true,
          notifyStaff: false,
          autoApply: false,
          industryContext: defaults.context,
        },
        thresholds: defaults.thresholds,
      };
    }
  }
}

// Ensure defaults are loaded
initializeDefaults();

// --- Public API ---

export function getLocationForCentre(centreId: string): LocationCentreLink | undefined {
  return CENTRE_LOCATION_MAP.find(m => m.centreId === centreId);
}

export function getIndustryTypeForCentre(centreId: string): IndustryType {
  return getLocationForCentre(centreId)?.industryType || 'custom';
}

export function getThresholdsForCentre(centreId: string): AreaCombiningThreshold[] {
  const link = getLocationForCentre(centreId);
  if (!link) return getIndustryOptimizationDefaults('custom').thresholds;
  const stored = locationOptimizationStore[link.locationId];
  return stored?.thresholds ?? getIndustryOptimizationDefaults(link.industryType).thresholds;
}

export function getOptimizationForCentre(centreId: string): OperationalOptimization | undefined {
  const link = getLocationForCentre(centreId);
  if (!link) return undefined;
  return locationOptimizationStore[link.locationId]?.optimization;
}

export function saveLocationOptimization(
  locationId: string,
  thresholds: AreaCombiningThreshold[],
  optimization?: OperationalOptimization
) {
  const existing = locationOptimizationStore[locationId];
  locationOptimizationStore[locationId] = {
    optimization: optimization || existing?.optimization || {} as OperationalOptimization,
    thresholds,
  };
}

export function getAllLocationLinks(): LocationCentreLink[] {
  return [...CENTRE_LOCATION_MAP];
}
