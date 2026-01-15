/**
 * Award Configuration Context
 * Provides persistence layer for rate overrides and custom rules
 * Used across settings panels and shift cost calculations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RateOverride } from '@/components/settings/awards/CustomRateOverridesPanel';
import { 
  createAuditEvent, 
  getAuditEvents, 
  getAlerts,
  acknowledgeAlert as auditAcknowledgeAlert,
  actionAlert as auditActionAlert,
  dismissAlert as auditDismissAlert,
  getAwardVersionHistory,
} from '@/lib/awardAuditService';
import { 
  AuditEvent, 
  RateChangeAlert, 
  AwardVersion,
  AuditEventType,
} from '@/types/awardAudit';
import { toast } from 'sonner';

// Custom rule structure
export interface CustomRule {
  id: string;
  name: string;
  description: string;
  type: 'overtime' | 'penalty' | 'allowance' | 'leave_loading';
  awardId: string;
  classificationId?: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  isCustom: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | number | string[];
  logic?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'apply_multiplier' | 'add_allowance' | 'set_rate' | 'add_loading';
  value: number;
  description?: string;
}

// Enabled award configuration
export interface EnabledAward {
  awardId: string;
  enabledClassifications: string[];
  customRates: Record<string, number>;
  isActive: boolean;
  isFavorite?: boolean;
}

// Context value type
interface AwardConfigContextValue {
  // Rate overrides
  rateOverrides: RateOverride[];
  addRateOverride: (override: Omit<RateOverride, 'id' | 'createdAt'>) => void;
  updateRateOverride: (id: string, updates: Partial<RateOverride>) => void;
  deleteRateOverride: (id: string) => void;
  toggleRateOverride: (id: string) => void;
  getActiveOverridesForClassification: (awardId: string, classificationId: string) => RateOverride[];
  
  // Custom rules
  customRules: CustomRule[];
  addCustomRule: (rule: Omit<CustomRule, 'id' | 'createdAt'>) => void;
  updateCustomRule: (id: string, updates: Partial<CustomRule>) => void;
  deleteCustomRule: (id: string) => void;
  toggleCustomRule: (id: string) => void;
  getActiveRulesForAward: (awardId: string) => CustomRule[];
  
  // Enabled awards
  enabledAwards: EnabledAward[];
  toggleAward: (awardId: string) => void;
  toggleFavorite: (awardId: string) => void;
  setCustomRate: (awardId: string, classificationId: string, rate: number) => void;
  
  // Audit trail
  auditEvents: AuditEvent[];
  alerts: RateChangeAlert[];
  awardVersions: AwardVersion[];
  refreshAuditData: () => void;
  acknowledgeAlert: (alertId: string, notes?: string) => void;
  actionAlert: (alertId: string, notes?: string) => void;
  dismissAlert: (alertId: string, reason: string) => void;
  
  // Get effective rate (with overrides applied)
  getEffectiveRate: (awardId: string, classificationId: string, baseRate: number) => number;
  
  // Loading state
  isLoading: boolean;
}

const AwardConfigContext = createContext<AwardConfigContextValue | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  rateOverrides: 'award_rate_overrides',
  customRules: 'award_custom_rules',
  enabledAwards: 'award_enabled_awards',
};

// Initial mock data
const initialRateOverrides: RateOverride[] = [
  {
    id: '1',
    awardId: 'children-services-2020',
    classificationId: 'cs-4-1',
    overrideType: 'base_rate',
    originalValue: 30.28,
    newValue: 32.50,
    effectiveFrom: '2024-01-01',
    reason: 'Above award rate for experienced staff retention',
    approvedBy: 'HR Manager',
    createdAt: '2023-12-15',
    isActive: true,
  },
  {
    id: '2',
    awardId: 'children-services-2020',
    classificationId: 'cs-5-1',
    overrideType: 'base_rate',
    originalValue: 34.60,
    newValue: 36.00,
    effectiveFrom: '2024-03-01',
    reason: 'Market adjustment for ECT qualification',
    approvedBy: 'CEO',
    createdAt: '2024-02-20',
    isActive: true,
  },
];

const initialEnabledAwards: EnabledAward[] = [
  { awardId: 'children-services-2020', enabledClassifications: [], customRates: {}, isActive: true, isFavorite: true },
];

interface AwardConfigProviderProps {
  children: ReactNode;
}

export function AwardConfigProvider({ children }: AwardConfigProviderProps) {
  const [rateOverrides, setRateOverrides] = useState<RateOverride[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [enabledAwards, setEnabledAwards] = useState<EnabledAward[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [alerts, setAlerts] = useState<RateChangeAlert[]>([]);
  const [awardVersions, setAwardVersions] = useState<AwardVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedOverrides = localStorage.getItem(STORAGE_KEYS.rateOverrides);
      const storedRules = localStorage.getItem(STORAGE_KEYS.customRules);
      const storedAwards = localStorage.getItem(STORAGE_KEYS.enabledAwards);
      
      setRateOverrides(storedOverrides ? JSON.parse(storedOverrides) : initialRateOverrides);
      setCustomRules(storedRules ? JSON.parse(storedRules) : []);
      setEnabledAwards(storedAwards ? JSON.parse(storedAwards) : initialEnabledAwards);
      
      // Load audit data
      refreshAuditData();
    } catch (error) {
      console.error('Error loading award config:', error);
      setRateOverrides(initialRateOverrides);
      setEnabledAwards(initialEnabledAwards);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Persist changes to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.rateOverrides, JSON.stringify(rateOverrides));
    }
  }, [rateOverrides, isLoading]);
  
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.customRules, JSON.stringify(customRules));
    }
  }, [customRules, isLoading]);
  
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.enabledAwards, JSON.stringify(enabledAwards));
    }
  }, [enabledAwards, isLoading]);
  
  const refreshAuditData = useCallback(() => {
    setAuditEvents(getAuditEvents(100, 0));
    setAlerts(getAlerts());
    // Get version history for children's services award
    setAwardVersions(getAwardVersionHistory('children-services-2020'));
  }, []);
  
  // Rate override functions
  const addRateOverride = useCallback((override: Omit<RateOverride, 'id' | 'createdAt'>) => {
    const newOverride: RateOverride = {
      ...override,
      id: `override-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setRateOverrides(prev => [...prev, newOverride]);
    
    // Create audit event
    createAuditEvent(
      'rate_override_created',
      'classification',
      override.classificationId,
      `${override.awardId}/${override.classificationId}`,
      'create',
      [{ field: 'hourlyRate', oldValue: override.originalValue, newValue: override.newValue }],
      'current-user',
      'Current User',
      'user',
      override.reason
    );
    
    refreshAuditData();
    toast.success('Rate override created');
  }, [refreshAuditData]);
  
  const updateRateOverride = useCallback((id: string, updates: Partial<RateOverride>) => {
    setRateOverrides(prev => prev.map(o => 
      o.id === id ? { ...o, ...updates } : o
    ));
    
    createAuditEvent(
      'rate_override_updated',
      'classification',
      id,
      id,
      'update',
      Object.entries(updates).map(([field, newValue]) => ({ field, newValue })),
      'current-user',
      'Current User',
      'user'
    );
    
    refreshAuditData();
    toast.success('Rate override updated');
  }, [refreshAuditData]);
  
  const deleteRateOverride = useCallback((id: string) => {
    const override = rateOverrides.find(o => o.id === id);
    setRateOverrides(prev => prev.filter(o => o.id !== id));
    
    if (override) {
      createAuditEvent(
        'rate_override_deleted',
        'classification',
        override.classificationId,
        `${override.awardId}/${override.classificationId}`,
        'delete',
        [{ field: 'hourlyRate', oldValue: override.newValue, newValue: override.originalValue }],
        'current-user',
        'Current User',
        'user'
      );
    }
    
    refreshAuditData();
    toast.success('Rate override deleted');
  }, [rateOverrides, refreshAuditData]);
  
  const toggleRateOverride = useCallback((id: string) => {
    setRateOverrides(prev => prev.map(o => 
      o.id === id ? { ...o, isActive: !o.isActive } : o
    ));
  }, []);
  
  const getActiveOverridesForClassification = useCallback((awardId: string, classificationId: string) => {
    const now = new Date().toISOString().split('T')[0];
    return rateOverrides.filter(o => 
      o.awardId === awardId && 
      o.classificationId === classificationId &&
      o.isActive &&
      o.effectiveFrom <= now &&
      (!o.effectiveTo || o.effectiveTo >= now)
    );
  }, [rateOverrides]);
  
  // Custom rule functions
  const addCustomRule = useCallback((rule: Omit<CustomRule, 'id' | 'createdAt'>) => {
    const newRule: CustomRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomRules(prev => [...prev, newRule]);
    toast.success('Custom rule created');
  }, []);
  
  const updateCustomRule = useCallback((id: string, updates: Partial<CustomRule>) => {
    setCustomRules(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
    toast.success('Custom rule updated');
  }, []);
  
  const deleteCustomRule = useCallback((id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
    toast.success('Custom rule deleted');
  }, []);
  
  const toggleCustomRule = useCallback((id: string) => {
    setCustomRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  }, []);
  
  const getActiveRulesForAward = useCallback((awardId: string) => {
    return customRules.filter(r => 
      r.awardId === awardId && 
      r.isActive
    );
  }, [customRules]);
  
  // Enabled awards functions
  const toggleAward = useCallback((awardId: string) => {
    const existing = enabledAwards.find(e => e.awardId === awardId);
    if (existing) {
      setEnabledAwards(prev => prev.map(e => 
        e.awardId === awardId ? { ...e, isActive: !e.isActive } : e
      ));
    } else {
      setEnabledAwards(prev => [...prev, { 
        awardId, 
        enabledClassifications: [], 
        customRates: {}, 
        isActive: true 
      }]);
    }
  }, [enabledAwards]);
  
  const toggleFavorite = useCallback((awardId: string) => {
    const existing = enabledAwards.find(e => e.awardId === awardId);
    if (existing) {
      setEnabledAwards(prev => prev.map(e => 
        e.awardId === awardId ? { ...e, isFavorite: !e.isFavorite } : e
      ));
    } else {
      setEnabledAwards(prev => [...prev, { 
        awardId, 
        enabledClassifications: [], 
        customRates: {}, 
        isActive: false,
        isFavorite: true 
      }]);
    }
  }, [enabledAwards]);
  
  const setCustomRate = useCallback((awardId: string, classificationId: string, rate: number) => {
    setEnabledAwards(prev => prev.map(e => 
      e.awardId === awardId 
        ? { ...e, customRates: { ...e.customRates, [classificationId]: rate } }
        : e
    ));
  }, []);
  
  // Alert functions
  const acknowledgeAlert = useCallback((alertId: string, notes?: string) => {
    auditAcknowledgeAlert(alertId, 'current-user', notes);
    refreshAuditData();
    toast.success('Alert acknowledged');
  }, [refreshAuditData]);
  
  const actionAlert = useCallback((alertId: string, notes?: string) => {
    auditActionAlert(alertId, 'current-user', notes);
    refreshAuditData();
    toast.success('Alert marked as actioned');
  }, [refreshAuditData]);
  
  const dismissAlert = useCallback((alertId: string, reason: string) => {
    auditDismissAlert(alertId, 'current-user', reason);
    refreshAuditData();
    toast.success('Alert dismissed');
  }, [refreshAuditData]);
  
  // Get effective rate with overrides applied
  const getEffectiveRate = useCallback((awardId: string, classificationId: string, baseRate: number) => {
    const overrides = getActiveOverridesForClassification(awardId, classificationId);
    const baseRateOverride = overrides.find(o => o.overrideType === 'base_rate');
    
    if (baseRateOverride) {
      return baseRateOverride.newValue;
    }
    
    // Check custom rates in enabled awards
    const enabledAward = enabledAwards.find(e => e.awardId === awardId);
    if (enabledAward?.customRates[classificationId]) {
      return enabledAward.customRates[classificationId];
    }
    
    return baseRate;
  }, [getActiveOverridesForClassification, enabledAwards]);
  
  const value: AwardConfigContextValue = {
    rateOverrides,
    addRateOverride,
    updateRateOverride,
    deleteRateOverride,
    toggleRateOverride,
    getActiveOverridesForClassification,
    customRules,
    addCustomRule,
    updateCustomRule,
    deleteCustomRule,
    toggleCustomRule,
    getActiveRulesForAward,
    enabledAwards,
    toggleAward,
    toggleFavorite,
    setCustomRate,
    auditEvents,
    alerts,
    awardVersions,
    refreshAuditData,
    acknowledgeAlert,
    actionAlert,
    dismissAlert,
    getEffectiveRate,
    isLoading,
  };
  
  return (
    <AwardConfigContext.Provider value={value}>
      {children}
    </AwardConfigContext.Provider>
  );
}

export function useAwardConfig() {
  const context = useContext(AwardConfigContext);
  if (context === undefined) {
    throw new Error('useAwardConfig must be used within an AwardConfigProvider');
  }
  return context;
}
