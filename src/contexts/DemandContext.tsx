import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { 
  DemandMasterSettings, 
  DemandSchedulePattern, 
  DemandThreshold,
  DemandConfig,
  StaffingConfig,
  IndustryType,
  getIndustryTemplate,
  IntegrationOption,
} from '@/types/industryConfig';
import { format, addDays, startOfWeek, parse, isWithinInterval } from 'date-fns';

// Unified configuration that combines industry + demand settings
export interface UnifiedDemandConfiguration {
  // Industry selection
  industryType: IndustryType;
  
  // Terminology (from industry template, customizable)
  terminology: DemandConfig;
  
  // Staffing terminology
  staffingTerminology: StaffingConfig;
  
  // Operational settings
  settings: DemandMasterSettings;
  
  // Active integrations
  integrations: IntegrationOption[];
}

export interface ManualDemandEntry {
  id: string;
  date: string;
  centreId: string;
  roomId: string;
  timeSlot: string;
  expectedDemand: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: 'manual' | 'import';
}

interface DemandContextValue {
  // Unified configuration
  config: UnifiedDemandConfiguration;
  updateConfig: (config: Partial<UnifiedDemandConfiguration>) => void;
  
  // Industry switching
  switchIndustry: (industry: IndustryType) => void;
  
  // Settings (shortcut accessors)
  settings: DemandMasterSettings;
  updateSettings: (settings: DemandMasterSettings) => void;
  
  // Terminology (shortcut accessors)
  terminology: DemandConfig;
  updateTerminology: (terminology: Partial<DemandConfig>) => void;
  
  // Staffing terminology
  staffingTerminology: StaffingConfig;
  updateStaffingTerminology: (terminology: Partial<StaffingConfig>) => void;
  
  // Manual entries
  manualEntries: ManualDemandEntry[];
  addManualEntry: (entry: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateManualEntry: (id: string, updates: Partial<ManualDemandEntry>) => void;
  deleteManualEntry: (id: string) => void;
  bulkAddManualEntries: (entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  clearAllManualEntries: (centreId?: string, roomId?: string) => void;
  
  // Computed demand data
  getEffectiveDemand: (date: string, roomId: string, timeSlot: string) => number;
  getDemandWithMultiplier: (baseDemand: number, date: string, timeSlot: string) => number;
  getThresholdForDemand: (demand: number) => DemandThreshold | undefined;
  getActivePatterns: (date: string, timeSlot: string) => DemandSchedulePattern[];
  
  // Time slots based on settings
  getTimeSlots: () => string[];
  
  // Operating hours
  isOperatingHour: (date: Date, time: string) => boolean;
  
  // Labels based on terminology
  getDemandLabel: (count: number) => string;
  getZoneLabel: (count: number) => string;
  getRoleLabel: (count: number) => string;
}

const DemandContext = createContext<DemandContextValue | undefined>(undefined);

// Create default settings
const createDefaultSettings = (): DemandMasterSettings => ({
  enabled: true,
  granularity: '30min',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  operatingHours: [0, 1, 2, 3, 4, 5, 6].map(i => ({
    dayOfWeek: i,
    open: i === 0 || i === 6 ? '08:00' : '06:30',
    close: i === 0 || i === 6 ? '17:00' : '18:30',
    isOpen: i !== 0, // Closed Sunday
  })),
  dataSources: {
    manual: { type: 'manual', enabled: true, priority: 1, settings: {} },
    historical: { type: 'historical', enabled: true, priority: 2, settings: { weeksToAnalyze: 8 } },
    integration: { type: 'integration', enabled: false, priority: 3, settings: {} },
    forecast: { type: 'forecast', enabled: true, priority: 4, settings: {} },
  },
  forecasting: {
    enabled: true,
    method: 'weighted_average',
    lookbackWeeks: 8,
    confidenceThreshold: 70,
    autoAdjust: true,
    seasonalAdjustments: true,
  },
  schedulePatterns: [
    { id: 'morning-rush', name: 'Morning Rush', dayOfWeek: [1, 2, 3, 4, 5], startTime: '07:00', endTime: '09:00', expectedDemandMultiplier: 1.5, color: '#ef4444' },
    { id: 'afternoon-pickup', name: 'Afternoon Pickup', dayOfWeek: [1, 2, 3, 4, 5], startTime: '15:00', endTime: '18:00', expectedDemandMultiplier: 1.3, color: '#f97316' },
  ],
  thresholds: [
    { id: 'low', name: 'Low Demand', minDemand: 0, maxDemand: 10, requiredStaff: 2, color: '#22c55e', alertLevel: 'info' },
    { id: 'normal', name: 'Normal Demand', minDemand: 11, maxDemand: 25, requiredStaff: 4, color: '#3b82f6', alertLevel: 'info' },
    { id: 'high', name: 'High Demand', minDemand: 26, maxDemand: 40, requiredStaff: 6, color: '#f97316', alertLevel: 'warning' },
    { id: 'critical', name: 'Critical Demand', minDemand: 41, requiredStaff: 8, color: '#ef4444', alertLevel: 'critical' },
  ],
  alerts: {
    understaffing: true,
    overstaffing: true,
    demandSpike: true,
    forecastAccuracy: false,
    thresholdPercentage: 15,
  },
  display: {
    showForecast: true,
    showHistorical: true,
    showVariance: false,
    chartType: 'bar',
    colorScheme: 'default',
  },
});

// Create default unified configuration
const createDefaultConfig = (industry: IndustryType = 'childcare'): UnifiedDemandConfiguration => {
  const template = getIndustryTemplate(industry);
  return {
    industryType: industry,
    terminology: template.demandConfig,
    staffingTerminology: template.staffingConfig,
    settings: createDefaultSettings(),
    integrations: template.integrations,
  };
};

export function DemandProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<UnifiedDemandConfiguration>(() => createDefaultConfig('childcare'));
  const [manualEntries, setManualEntries] = useState<ManualDemandEntry[]>([]);

  // Switch industry - updates terminology and integrations from template
  const switchIndustry = useCallback((industry: IndustryType) => {
    const template = getIndustryTemplate(industry);
    setConfig(prev => ({
      ...prev,
      industryType: industry,
      terminology: template.demandConfig,
      staffingTerminology: template.staffingConfig,
      integrations: template.integrations,
      // Merge peak indicators from industry template into schedule patterns
      settings: {
        ...prev.settings,
        schedulePatterns: [
          ...prev.settings.schedulePatterns.filter(p => !p.id.startsWith('industry-')),
          ...template.demandConfig.peakIndicators.map((indicator, idx) => ({
            id: `industry-peak-${idx}`,
            name: indicator,
            dayOfWeek: [1, 2, 3, 4, 5] as number[],
            startTime: '09:00',
            endTime: '17:00',
            expectedDemandMultiplier: 1.2,
            color: '#6366f1',
          })),
        ],
      },
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<UnifiedDemandConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSettings = useCallback((newSettings: DemandMasterSettings) => {
    setConfig(prev => ({ ...prev, settings: newSettings }));
  }, []);

  const updateTerminology = useCallback((updates: Partial<DemandConfig>) => {
    setConfig(prev => ({
      ...prev,
      terminology: { ...prev.terminology, ...updates },
    }));
  }, []);

  const updateStaffingTerminology = useCallback((updates: Partial<StaffingConfig>) => {
    setConfig(prev => ({
      ...prev,
      staffingTerminology: { ...prev.staffingTerminology, ...updates },
    }));
  }, []);

  const addManualEntry = useCallback((entry: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: ManualDemandEntry = {
      ...entry,
      id: `demand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    setManualEntries(prev => [...prev, newEntry]);
  }, []);

  const updateManualEntry = useCallback((id: string, updates: Partial<ManualDemandEntry>) => {
    setManualEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
        : entry
    ));
  }, []);

  const deleteManualEntry = useCallback((id: string) => {
    setManualEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const bulkAddManualEntries = useCallback((entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const newEntries = entries.map((entry, idx) => ({
      ...entry,
      id: `demand-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }));
    setManualEntries(prev => [...prev, ...newEntries]);
  }, []);

  const clearAllManualEntries = useCallback((centreId?: string, roomId?: string) => {
    setManualEntries(prev => prev.filter(entry => {
      if (centreId && roomId) return entry.centreId !== centreId || entry.roomId !== roomId;
      if (centreId) return entry.centreId !== centreId;
      return false;
    }));
  }, []);

  const getTimeSlots = useCallback(() => {
    const slots: string[] = [];
    const granularityMinutes = {
      '15min': 15,
      '30min': 30,
      '1hour': 60,
      '2hour': 120,
      '4hour': 240,
      'daily': 1440,
    };
    
    const minutes = granularityMinutes[config.settings.granularity];
    
    // Default operating hours: 6am to 6pm
    const startHour = 6;
    const endHour = 18;
    
    if (config.settings.granularity === 'daily') {
      return ['All Day'];
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += minutes) {
        if (hour + (min + minutes) / 60 <= endHour) {
          const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const endMinutes = min + minutes;
          const endHourCalc = hour + Math.floor(endMinutes / 60);
          const endMinCalc = endMinutes % 60;
          const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinCalc.toString().padStart(2, '0')}`;
          slots.push(`${startTime}-${endTime}`);
        }
      }
    }
    
    return slots;
  }, [config.settings.granularity]);

  const getActivePatterns = useCallback((date: string, timeSlot: string) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const [slotStart] = timeSlot.split('-');
    
    return config.settings.schedulePatterns.filter(pattern => {
      if (!pattern.dayOfWeek.includes(dayOfWeek)) return false;
      
      // Check if time slot overlaps with pattern
      const patternStart = pattern.startTime;
      const patternEnd = pattern.endTime;
      
      return slotStart >= patternStart && slotStart < patternEnd;
    });
  }, [config.settings.schedulePatterns]);

  const getDemandWithMultiplier = useCallback((baseDemand: number, date: string, timeSlot: string) => {
    const patterns = getActivePatterns(date, timeSlot);
    
    if (patterns.length === 0) return baseDemand;
    
    // Use the highest multiplier if multiple patterns overlap
    const maxMultiplier = Math.max(...patterns.map(p => p.expectedDemandMultiplier));
    return Math.round(baseDemand * maxMultiplier);
  }, [getActivePatterns]);

  const getEffectiveDemand = useCallback((date: string, roomId: string, timeSlot: string) => {
    // Check manual entries first
    const manualEntry = manualEntries.find(
      e => e.date === date && e.roomId === roomId && e.timeSlot === timeSlot
    );
    
    if (manualEntry) {
      return getDemandWithMultiplier(manualEntry.expectedDemand, date, timeSlot);
    }
    
    // Fall back to historical/default (would integrate with historical data)
    return 0;
  }, [manualEntries, getDemandWithMultiplier]);

  const getThresholdForDemand = useCallback((demand: number) => {
    // Sort thresholds by minDemand ascending
    const sorted = [...config.settings.thresholds].sort((a, b) => a.minDemand - b.minDemand);
    
    // Find the threshold that matches
    for (let i = sorted.length - 1; i >= 0; i--) {
      const threshold = sorted[i];
      if (demand >= threshold.minDemand) {
        if (threshold.maxDemand === undefined || demand <= threshold.maxDemand) {
          return threshold;
        }
      }
    }
    
    return sorted[0]; // Return lowest threshold as default
  }, [config.settings.thresholds]);

  const isOperatingHour = useCallback((date: Date, time: string) => {
    const dayOfWeek = date.getDay();
    const hours = config.settings.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!hours || !hours.isOpen) return false;
    
    return time >= hours.open && time < hours.close;
  }, [config.settings.operatingHours]);

  // Terminology-based label helpers
  const getDemandLabel = useCallback((count: number) => {
    return count === 1 ? config.terminology.demandUnit : config.terminology.demandUnitPlural;
  }, [config.terminology]);

  const getZoneLabel = useCallback((count: number) => {
    return count === 1 ? config.terminology.zoneLabel : config.terminology.zoneLabelPlural;
  }, [config.terminology]);

  const getRoleLabel = useCallback((count: number) => {
    return count === 1 ? config.staffingTerminology.roleLabel : config.staffingTerminology.roleLabelPlural;
  }, [config.staffingTerminology]);

  const value = useMemo(() => ({
    // Unified config
    config,
    updateConfig,
    switchIndustry,
    
    // Shortcuts
    settings: config.settings,
    updateSettings,
    terminology: config.terminology,
    updateTerminology,
    staffingTerminology: config.staffingTerminology,
    updateStaffingTerminology,
    
    // Manual entries
    manualEntries,
    addManualEntry,
    updateManualEntry,
    deleteManualEntry,
    bulkAddManualEntries,
    clearAllManualEntries,
    
    // Computed
    getEffectiveDemand,
    getDemandWithMultiplier,
    getThresholdForDemand,
    getActivePatterns,
    getTimeSlots,
    isOperatingHour,
    
    // Labels
    getDemandLabel,
    getZoneLabel,
    getRoleLabel,
  }), [
    config,
    updateConfig,
    switchIndustry,
    updateSettings,
    updateTerminology,
    updateStaffingTerminology,
    manualEntries,
    addManualEntry,
    updateManualEntry,
    deleteManualEntry,
    bulkAddManualEntries,
    clearAllManualEntries,
    getEffectiveDemand,
    getDemandWithMultiplier,
    getThresholdForDemand,
    getActivePatterns,
    getTimeSlots,
    isOperatingHour,
    getDemandLabel,
    getZoneLabel,
    getRoleLabel,
  ]);

  return (
    <DemandContext.Provider value={value}>
      {children}
    </DemandContext.Provider>
  );
}

export function useDemand() {
  const context = useContext(DemandContext);
  if (!context) {
    throw new Error('useDemand must be used within a DemandProvider');
  }
  return context;
}

// Re-export for convenience
export { createDefaultSettings as defaultDemandSettings };
