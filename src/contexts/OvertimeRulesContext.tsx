/**
 * Overtime Rules Context
 * Provides global access to configured overtime rules for use in pay calculations
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Re-export the OvertimeRuleConfig type
export interface OvertimeRuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'penalty' | 'special';
  isActive: boolean;
  isDefault: boolean;
  
  // Thresholds
  dailyThreshold?: number;
  weeklyThreshold?: number;
  
  // Multipliers (as decimals, e.g., 1.5 for time-and-a-half)
  overtimeMultiplier: number;
  doubleTimeMultiplier?: number;
  doubleTimeThreshold?: number;
  
  // Day/time specific
  applicableDays?: ('weekday' | 'saturday' | 'sunday' | 'public_holiday')[];
  timeRange?: { start: string; end: string };
  
  // Penalty loadings (percentage, e.g., 25 for 25%)
  penaltyLoading?: number;
  
  // Award linkage
  awardIds?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// Default rules matching the panel defaults
const defaultRules: OvertimeRuleConfig[] = [
  {
    id: 'default-daily',
    name: 'Standard Daily Overtime',
    description: 'Overtime triggered after daily hour threshold',
    category: 'daily',
    isActive: true,
    isDefault: true,
    dailyThreshold: 8,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    doubleTimeThreshold: 10,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'default-weekly',
    name: 'Standard Weekly Overtime',
    description: 'Overtime triggered after weekly hour threshold (38h NES)',
    category: 'weekly',
    isActive: true,
    isDefault: true,
    weeklyThreshold: 38,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'saturday-penalty',
    name: 'Saturday Penalty Rate',
    description: 'Penalty loading for Saturday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['saturday'],
    overtimeMultiplier: 1.5,
    penaltyLoading: 50,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'sunday-penalty',
    name: 'Sunday Penalty Rate',
    description: 'Penalty loading for Sunday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['sunday'],
    overtimeMultiplier: 2.0,
    penaltyLoading: 100,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'public-holiday',
    name: 'Public Holiday Rate',
    description: 'Penalty loading for public holiday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['public_holiday'],
    overtimeMultiplier: 2.5,
    penaltyLoading: 150,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'night-shift',
    name: 'Night Shift Loading',
    description: 'Additional loading for night shift work (10pm-6am)',
    category: 'special',
    isActive: true,
    isDefault: true,
    timeRange: { start: '22:00', end: '06:00' },
    overtimeMultiplier: 1.0,
    penaltyLoading: 15,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'evening-shift',
    name: 'Evening Shift Loading',
    description: 'Additional loading for evening work (6pm-10pm)',
    category: 'special',
    isActive: true,
    isDefault: true,
    timeRange: { start: '18:00', end: '22:00' },
    overtimeMultiplier: 1.0,
    penaltyLoading: 10,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

interface OvertimeRulesContextType {
  rules: OvertimeRuleConfig[];
  activeRules: OvertimeRuleConfig[];
  setRules: (rules: OvertimeRuleConfig[]) => void;
  updateRule: (id: string, updates: Partial<OvertimeRuleConfig>) => void;
  addRule: (rule: OvertimeRuleConfig) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  getActiveDaily: () => OvertimeRuleConfig | undefined;
  getActiveWeekly: () => OvertimeRuleConfig | undefined;
  getPenaltyForDay: (day: 'weekday' | 'saturday' | 'sunday' | 'public_holiday') => OvertimeRuleConfig | undefined;
  getSpecialLoadings: () => OvertimeRuleConfig[];
}

const OvertimeRulesContext = createContext<OvertimeRulesContextType | null>(null);

export function OvertimeRulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRulesState] = useState<OvertimeRuleConfig[]>(defaultRules);

  const activeRules = rules.filter(r => r.isActive);

  const setRules = useCallback((newRules: OvertimeRuleConfig[]) => {
    setRulesState(newRules);
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<OvertimeRuleConfig>) => {
    setRulesState(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
  }, []);

  const addRule = useCallback((rule: OvertimeRuleConfig) => {
    setRulesState(prev => [...prev, rule]);
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRulesState(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRulesState(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r
    ));
  }, []);

  const getActiveDaily = useCallback(() => {
    return activeRules.find(r => r.category === 'daily');
  }, [activeRules]);

  const getActiveWeekly = useCallback(() => {
    return activeRules.find(r => r.category === 'weekly');
  }, [activeRules]);

  const getPenaltyForDay = useCallback((day: 'weekday' | 'saturday' | 'sunday' | 'public_holiday') => {
    return activeRules.find(r => r.category === 'penalty' && r.applicableDays?.includes(day));
  }, [activeRules]);

  const getSpecialLoadings = useCallback(() => {
    return activeRules.filter(r => r.category === 'special');
  }, [activeRules]);

  return (
    <OvertimeRulesContext.Provider value={{
      rules,
      activeRules,
      setRules,
      updateRule,
      addRule,
      deleteRule,
      toggleRule,
      getActiveDaily,
      getActiveWeekly,
      getPenaltyForDay,
      getSpecialLoadings,
    }}>
      {children}
    </OvertimeRulesContext.Provider>
  );
}

export function useOvertimeRules() {
  const context = useContext(OvertimeRulesContext);
  if (!context) {
    throw new Error('useOvertimeRules must be used within an OvertimeRulesProvider');
  }
  return context;
}

// Standalone function to get rules without context (for calculator)
export function getDefaultOvertimeRules(): OvertimeRuleConfig[] {
  return defaultRules;
}
