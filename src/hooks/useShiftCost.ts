/**
 * Hook for context-aware shift cost calculations
 * Automatically applies custom rules and rate overrides from AwardConfigContext
 */

import { useMemo, useCallback } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { useAwardConfig } from '@/contexts/AwardConfigContext';
import { 
  calculateShiftCost, 
  ShiftCostBreakdown, 
  ShiftCostContext,
  RateOverrideConfig,
  AppliedCustomRule,
  calculateWeeklyCost,
  WeeklyCostSummary 
} from '@/lib/awardInterpreter';
import { getAwardById, AustralianAward, AwardClassification } from '@/data/australianAwards';

export interface UseShiftCostResult {
  /** Calculate cost for a single shift with context rules applied */
  calculateCost: (
    shift: Shift, 
    staff: StaffMember, 
    award?: AustralianAward,
    classification?: AwardClassification
  ) => ShiftCostBreakdown;
  
  /** Calculate weekly cost summary with context rules applied */
  calculateWeekCost: (
    shifts: Shift[],
    staff: StaffMember,
    weekStart: string,
    weekEnd: string,
    award?: AustralianAward
  ) => WeeklyCostSummary;
  
  /** Quick estimate for a single shift (simplified) */
  getQuickEstimate: (shift: Shift, staff: StaffMember) => number;
  
  /** Calculate costs for multiple staff members */
  calculateStaffCosts: (
    shifts: Shift[],
    staffMember: StaffMember,
    centreId?: string
  ) => {
    regularCost: number;
    overtimeCost: number;
    penaltyCost: number;
    totalCost: number;
    totalHours: number;
  };
  
  /** The current context being applied */
  context: ShiftCostContext;
}

export function useShiftCost(): UseShiftCostResult {
  const { rateOverrides, customRules, getEffectiveRate } = useAwardConfig();
  
  // Build the context object from AwardConfigContext
  const context: ShiftCostContext = useMemo(() => {
    // Convert RateOverride[] to RateOverrideConfig[] format expected by awardInterpreter
    const overrideConfigs: RateOverrideConfig[] = rateOverrides
      .filter(override => override.isActive)
      .map(override => ({
        awardId: override.awardId,
        classificationId: override.classificationId,
        newRate: override.overrideType === 'base_rate' ? override.newValue : undefined,
        casualLoadingOverride: override.overrideType === 'casual_loading' ? override.newValue : undefined,
        penaltyOverrides: override.overrideType === 'penalty_rate' 
          ? { default: override.newValue } 
          : undefined,
      }));
    
    // Convert CustomRule[] to AppliedCustomRule[] format
    const appliedRules: AppliedCustomRule[] = customRules
      .filter(rule => rule.isActive)
      .map(rule => {
        // Calculate the adjustment value from the rule actions
        const adjustment = rule.actions.reduce((sum, action) => {
          if (action.type === 'apply_multiplier') {
            return sum + (action.value - 1) * 100; // Convert multiplier to percentage
          }
          if (action.type === 'add_loading' || action.type === 'add_allowance') {
            return sum + action.value;
          }
          return sum;
        }, 0);
        
        return {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          adjustment,
          description: rule.description,
        };
      });
    
    return {
      rateOverrides: overrideConfigs,
      customRules: appliedRules,
      getEffectiveRate,
    };
  }, [rateOverrides, customRules, getEffectiveRate]);
  
  const calculateCost = useCallback((
    shift: Shift,
    staff: StaffMember,
    award?: AustralianAward,
    classification?: AwardClassification
  ): ShiftCostBreakdown => {
    const selectedAward = award || getAwardById('children-services-2020')!;
    return calculateShiftCost(shift, staff, selectedAward, classification, context);
  }, [context]);
  
  const calculateWeekCost = useCallback((
    shifts: Shift[],
    staff: StaffMember,
    weekStart: string,
    weekEnd: string,
    award?: AustralianAward
  ): WeeklyCostSummary => {
    const selectedAward = award || getAwardById('children-services-2020')!;
    return calculateWeeklyCost(shifts, staff, weekStart, weekEnd, selectedAward);
  }, []);
  
  const getQuickEstimate = useCallback((shift: Shift, staff: StaffMember): number => {
    try {
      const breakdown = calculateCost(shift, staff);
      return breakdown.totalCost;
    } catch {
      // Fallback to simple calculation if award calculation fails
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      return Math.round(hours * staff.hourlyRate * 100) / 100;
    }
  }, [calculateCost]);
  
  const calculateStaffCosts = useCallback((
    shifts: Shift[],
    staffMember: StaffMember,
    centreId?: string
  ) => {
    const memberShifts = shifts.filter(s => 
      s.staffId === staffMember.id && 
      (!centreId || s.centreId === centreId)
    );
    
    let totalHours = 0;
    let regularCost = 0;
    let overtimeCost = 0;
    let penaltyCost = 0;
    
    memberShifts.forEach(shift => {
      try {
        const breakdown = calculateCost(shift, staffMember);
        totalHours += breakdown.netHours;
        regularCost += breakdown.ordinaryPay;
        overtimeCost += breakdown.overtimePay;
        // Calculate penalty cost from evening, saturday, sunday, and public holiday pay
        penaltyCost += breakdown.eveningPay + breakdown.saturdayPay + 
                      breakdown.sundayPay + breakdown.publicHolidayPay - 
                      (breakdown.eveningHours + breakdown.saturdayHours + 
                       breakdown.sundayHours + breakdown.publicHolidayHours) * breakdown.baseHourlyRate;
      } catch {
        // Fallback calculation
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
        totalHours += hours;
        regularCost += hours * staffMember.hourlyRate;
      }
    });
    
    return {
      regularCost: Math.round(regularCost * 100) / 100,
      overtimeCost: Math.round(overtimeCost * 100) / 100,
      penaltyCost: Math.round(Math.max(0, penaltyCost) * 100) / 100,
      totalCost: Math.round((regularCost + overtimeCost + Math.max(0, penaltyCost)) * 100) / 100,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }, [calculateCost]);
  
  return {
    calculateCost,
    calculateWeekCost,
    getQuickEstimate,
    calculateStaffCosts,
    context,
  };
}
