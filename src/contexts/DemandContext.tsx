import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { DemandMasterSettings, DemandSchedulePattern, DemandThreshold } from '@/types/industryConfig';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { defaultDemandMasterSettings } from '@/components/settings/DemandMasterSettingsModal';
import { format, addDays, startOfWeek, parse, isWithinInterval } from 'date-fns';

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
  // Settings
  settings: DemandMasterSettings;
  updateSettings: (settings: DemandMasterSettings) => void;
  
  // Manual entries
  manualEntries: ManualDemandEntry[];
  addManualEntry: (entry: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateManualEntry: (id: string, updates: Partial<ManualDemandEntry>) => void;
  deleteManualEntry: (id: string) => void;
  bulkAddManualEntries: (entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  
  // Computed demand data
  getEffectiveDemand: (date: string, roomId: string, timeSlot: string) => number;
  getDemandWithMultiplier: (baseDemand: number, date: string, timeSlot: string) => number;
  getThresholdForDemand: (demand: number) => DemandThreshold | undefined;
  getActivePatterns: (date: string, timeSlot: string) => DemandSchedulePattern[];
  
  // Time slots based on settings
  getTimeSlots: () => string[];
  
  // Operating hours
  isOperatingHour: (date: Date, time: string) => boolean;
}

const DemandContext = createContext<DemandContextValue | undefined>(undefined);

export function DemandProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DemandMasterSettings>(defaultDemandMasterSettings);
  const [manualEntries, setManualEntries] = useState<ManualDemandEntry[]>([]);

  const updateSettings = useCallback((newSettings: DemandMasterSettings) => {
    setSettings(newSettings);
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
    
    const minutes = granularityMinutes[settings.granularity];
    
    // Default operating hours: 6am to 6pm
    const startHour = 6;
    const endHour = 18;
    
    if (settings.granularity === 'daily') {
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
  }, [settings.granularity]);

  const getActivePatterns = useCallback((date: string, timeSlot: string) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const [slotStart] = timeSlot.split('-');
    
    return settings.schedulePatterns.filter(pattern => {
      if (!pattern.dayOfWeek.includes(dayOfWeek)) return false;
      
      // Check if time slot overlaps with pattern
      const patternStart = pattern.startTime;
      const patternEnd = pattern.endTime;
      
      return slotStart >= patternStart && slotStart < patternEnd;
    });
  }, [settings.schedulePatterns]);

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
    const sorted = [...settings.thresholds].sort((a, b) => a.minDemand - b.minDemand);
    
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
  }, [settings.thresholds]);

  const isOperatingHour = useCallback((date: Date, time: string) => {
    const dayOfWeek = date.getDay();
    const hours = settings.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!hours || !hours.isOpen) return false;
    
    return time >= hours.open && time < hours.close;
  }, [settings.operatingHours]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    manualEntries,
    addManualEntry,
    updateManualEntry,
    deleteManualEntry,
    bulkAddManualEntries,
    getEffectiveDemand,
    getDemandWithMultiplier,
    getThresholdForDemand,
    getActivePatterns,
    getTimeSlots,
    isOperatingHour,
  }), [
    settings,
    updateSettings,
    manualEntries,
    addManualEntry,
    updateManualEntry,
    deleteManualEntry,
    bulkAddManualEntries,
    getEffectiveDemand,
    getDemandWithMultiplier,
    getThresholdForDemand,
    getActivePatterns,
    getTimeSlots,
    isOperatingHour,
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
