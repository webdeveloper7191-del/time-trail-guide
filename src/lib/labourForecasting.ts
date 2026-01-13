/**
 * Labour Cost Forecasting Engine
 * Predictive analytics for budget planning based on roster patterns
 */

import { Shift, StaffMember, Centre, Room } from '@/types/roster';
import { 
  calculateShiftCost, 
  calculateRosterCost, 
  ShiftCostBreakdown,
  formatCurrency 
} from './awardInterpreter';
import { getAwardById } from '@/data/australianAwards';
import { 
  format, 
  addDays, 
  addWeeks, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  differenceInWeeks,
  parseISO 
} from 'date-fns';
import { isPublicHoliday, isSchoolHoliday, getHolidaysInRange } from '@/data/mockHolidaysEvents';

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  isPublicHoliday: boolean;
  isSchoolHoliday: boolean;
  
  projectedShifts: number;
  projectedHours: number;
  projectedCost: number;
  projectedSuperannuation: number;
  totalProjectedCost: number;
  
  // Breakdown
  ordinaryCost: number;
  penaltyCost: number;
  overtimeCost: number;
  allowancesCost: number;
  
  confidence: number; // 0-1 confidence score
}

export interface WeeklyForecast {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  
  days: DailyForecast[];
  
  totalShifts: number;
  totalHours: number;
  totalCost: number;
  
  // Comparisons
  vsLastWeek: {
    costDifference: number;
    percentChange: number;
  };
  vsBudget: {
    budgetAmount: number;
    variance: number;
    percentVariance: number;
    isOverBudget: boolean;
  };
  
  // Trends
  avgDailyCost: number;
  peakDay: string;
  peakDayCost: number;
  
  confidence: number;
}

export interface ForecastSummary {
  periodStart: string;
  periodEnd: string;
  weeksCount: number;
  
  totalProjectedCost: number;
  totalProjectedHours: number;
  avgWeeklyCost: number;
  avgHourlyCost: number;
  
  // Budget tracking
  periodBudget: number;
  projectedVariance: number;
  percentVariance: number;
  isOverBudget: boolean;
  
  // Breakdown
  byDayType: {
    weekday: { hours: number; cost: number; percent: number };
    saturday: { hours: number; cost: number; percent: number };
    sunday: { hours: number; cost: number; percent: number };
    publicHoliday: { hours: number; cost: number; percent: number };
  };
  
  // Risk factors
  riskFactors: {
    type: string;
    description: string;
    estimatedImpact: number;
    severity: 'low' | 'medium' | 'high';
  }[];
  
  // Recommendations
  recommendations: string[];
  
  weeks: WeeklyForecast[];
}

// Generate forecast based on current roster patterns
export function generateForecast(
  currentShifts: Shift[],
  staff: StaffMember[],
  centre: Centre,
  forecastWeeks: number = 4,
  weeklyBudget: number = 8000
): ForecastSummary {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  // Calculate current week baseline
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const currentWeekShifts = currentShifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return shiftDate >= currentWeekStart && shiftDate <= currentWeekEnd;
  });
  
  const award = getAwardById('children-services-2020')!;
  const baselineCost = calculateRosterCost(
    currentWeekShifts,
    staff,
    format(currentWeekStart, 'yyyy-MM-dd'),
    format(currentWeekEnd, 'yyyy-MM-dd'),
    award
  );
  
  const weeks: WeeklyForecast[] = [];
  let previousWeekCost = baselineCost.totalCost;
  
  // Generate weekly forecasts
  for (let w = 1; w <= forecastWeeks; w++) {
    const weekStart = addWeeks(currentWeekStart, w);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const days: DailyForecast[] = [];
    
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    for (const day of daysInWeek) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = format(day, 'EEEE');
      const isPH = isPublicHoliday(dateStr);
      const isSH = isSchoolHoliday(dateStr);
      
      // Base projection on same day from current week
      const sameDayShifts = currentWeekShifts.filter(s => {
        const shiftDate = parseISO(s.date);
        return format(shiftDate, 'EEEE') === dayOfWeek;
      });
      
      // Adjust for public holidays (reduced demand, but higher cost)
      let demandMultiplier = 1;
      let costMultiplier = 1;
      
      if (isPH) {
        demandMultiplier = 0.3; // 70% reduction in shifts on public holidays
        costMultiplier = 2.5;   // 250% penalty rate
      } else if (isSH) {
        demandMultiplier = 1.2; // 20% increase during school holidays
      }
      
      const projectedShifts = Math.round(sameDayShifts.length * demandMultiplier);
      const baseHours = sameDayShifts.reduce((sum, s) => {
        const startMins = parseInt(s.startTime.split(':')[0]) * 60 + parseInt(s.startTime.split(':')[1]);
        const endMins = parseInt(s.endTime.split(':')[0]) * 60 + parseInt(s.endTime.split(':')[1]);
        return sum + (endMins - startMins - s.breakMinutes) / 60;
      }, 0);
      
      const projectedHours = baseHours * demandMultiplier;
      
      // Calculate projected costs
      const avgHourlyRate = staff.length > 0 
        ? staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length 
        : 28;
      
      const ordinaryCost = projectedHours * avgHourlyRate;
      const penaltyCost = isPH 
        ? ordinaryCost * 1.5 
        : (dayOfWeek === 'Saturday' ? ordinaryCost * 0.5 : 
           dayOfWeek === 'Sunday' ? ordinaryCost * 1 : 0);
      
      const projectedCost = ordinaryCost + penaltyCost;
      const projectedSuperannuation = projectedCost * 0.115;
      
      days.push({
        date: dateStr,
        dayOfWeek,
        isPublicHoliday: isPH,
        isSchoolHoliday: isSH,
        projectedShifts,
        projectedHours,
        projectedCost,
        projectedSuperannuation,
        totalProjectedCost: projectedCost + projectedSuperannuation,
        ordinaryCost,
        penaltyCost,
        overtimeCost: 0,
        allowancesCost: projectedCost * 0.02, // ~2% allowances
        confidence: isPH || isSH ? 0.7 : 0.85,
      });
    }
    
    const totalCost = days.reduce((sum, d) => sum + d.totalProjectedCost, 0);
    const totalHours = days.reduce((sum, d) => sum + d.projectedHours, 0);
    const totalShifts = days.reduce((sum, d) => sum + d.projectedShifts, 0);
    
    const peakDay = days.reduce((max, d) => d.totalProjectedCost > max.totalProjectedCost ? d : max, days[0]);
    
    weeks.push({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      weekNumber: w,
      days,
      totalShifts,
      totalHours,
      totalCost,
      vsLastWeek: {
        costDifference: totalCost - previousWeekCost,
        percentChange: previousWeekCost > 0 ? ((totalCost - previousWeekCost) / previousWeekCost) * 100 : 0,
      },
      vsBudget: {
        budgetAmount: weeklyBudget,
        variance: totalCost - weeklyBudget,
        percentVariance: weeklyBudget > 0 ? ((totalCost - weeklyBudget) / weeklyBudget) * 100 : 0,
        isOverBudget: totalCost > weeklyBudget,
      },
      avgDailyCost: totalCost / 7,
      peakDay: peakDay.dayOfWeek,
      peakDayCost: peakDay.totalProjectedCost,
      confidence: days.reduce((sum, d) => sum + d.confidence, 0) / days.length,
    });
    
    previousWeekCost = totalCost;
  }
  
  // Aggregate summary
  const totalProjectedCost = weeks.reduce((sum, w) => sum + w.totalCost, 0);
  const totalProjectedHours = weeks.reduce((sum, w) => sum + w.totalHours, 0);
  const periodBudget = weeklyBudget * forecastWeeks;
  
  // Breakdown by day type
  const allDays = weeks.flatMap(w => w.days);
  const weekdayDays = allDays.filter(d => !['Saturday', 'Sunday'].includes(d.dayOfWeek) && !d.isPublicHoliday);
  const saturdayDays = allDays.filter(d => d.dayOfWeek === 'Saturday' && !d.isPublicHoliday);
  const sundayDays = allDays.filter(d => d.dayOfWeek === 'Sunday' && !d.isPublicHoliday);
  const phDays = allDays.filter(d => d.isPublicHoliday);
  
  const byDayType = {
    weekday: {
      hours: weekdayDays.reduce((sum, d) => sum + d.projectedHours, 0),
      cost: weekdayDays.reduce((sum, d) => sum + d.totalProjectedCost, 0),
      percent: 0,
    },
    saturday: {
      hours: saturdayDays.reduce((sum, d) => sum + d.projectedHours, 0),
      cost: saturdayDays.reduce((sum, d) => sum + d.totalProjectedCost, 0),
      percent: 0,
    },
    sunday: {
      hours: sundayDays.reduce((sum, d) => sum + d.projectedHours, 0),
      cost: sundayDays.reduce((sum, d) => sum + d.totalProjectedCost, 0),
      percent: 0,
    },
    publicHoliday: {
      hours: phDays.reduce((sum, d) => sum + d.projectedHours, 0),
      cost: phDays.reduce((sum, d) => sum + d.totalProjectedCost, 0),
      percent: 0,
    },
  };
  
  // Calculate percentages
  Object.values(byDayType).forEach(dt => {
    dt.percent = totalProjectedCost > 0 ? (dt.cost / totalProjectedCost) * 100 : 0;
  });
  
  // Identify risk factors
  const riskFactors: ForecastSummary['riskFactors'] = [];
  
  const publicHolidaysInPeriod = getHolidaysInRange(
    format(addWeeks(currentWeekStart, 1), 'yyyy-MM-dd'),
    format(addWeeks(currentWeekStart, forecastWeeks + 1), 'yyyy-MM-dd')
  ).filter(h => h.type === 'public_holiday');
  
  if (publicHolidaysInPeriod.length > 0) {
    riskFactors.push({
      type: 'public_holiday',
      description: `${publicHolidaysInPeriod.length} public holiday(s) in forecast period`,
      estimatedImpact: publicHolidaysInPeriod.length * 500, // ~$500 extra per PH
      severity: publicHolidaysInPeriod.length > 2 ? 'high' : 'medium',
    });
  }
  
  const overBudgetWeeks = weeks.filter(w => w.vsBudget.isOverBudget);
  if (overBudgetWeeks.length > 0) {
    riskFactors.push({
      type: 'budget_overrun',
      description: `${overBudgetWeeks.length} week(s) projected over budget`,
      estimatedImpact: overBudgetWeeks.reduce((sum, w) => sum + w.vsBudget.variance, 0),
      severity: overBudgetWeeks.length > 2 ? 'high' : 'medium',
    });
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (totalProjectedCost > periodBudget) {
    recommendations.push(`Consider reducing weekend shifts to save ~${formatCurrency(byDayType.sunday.cost * 0.2)}`);
    recommendations.push('Review overtime patterns - weekly overtime adds significant cost');
  }
  
  if (publicHolidaysInPeriod.length > 0) {
    recommendations.push('Plan public holiday staffing carefully - 250% penalty rates apply');
  }
  
  const schoolHolidayDays = allDays.filter(d => d.isSchoolHoliday);
  if (schoolHolidayDays.length > 5) {
    recommendations.push('School holidays may increase demand - consider casual staff for flexibility');
  }
  
  return {
    periodStart: format(addWeeks(currentWeekStart, 1), 'yyyy-MM-dd'),
    periodEnd: format(addWeeks(currentWeekStart, forecastWeeks + 1), 'yyyy-MM-dd'),
    weeksCount: forecastWeeks,
    totalProjectedCost,
    totalProjectedHours,
    avgWeeklyCost: totalProjectedCost / forecastWeeks,
    avgHourlyCost: totalProjectedHours > 0 ? totalProjectedCost / totalProjectedHours : 0,
    periodBudget,
    projectedVariance: totalProjectedCost - periodBudget,
    percentVariance: periodBudget > 0 ? ((totalProjectedCost - periodBudget) / periodBudget) * 100 : 0,
    isOverBudget: totalProjectedCost > periodBudget,
    byDayType,
    riskFactors,
    recommendations,
    weeks,
  };
}

// Quick cost projection for a single shift
export function projectShiftCost(
  shift: Partial<Shift>,
  staff: StaffMember
): {
  estimatedCost: number;
  breakdown: {
    basePay: number;
    penalties: number;
    super: number;
  };
  warnings: string[];
} {
  if (!shift.startTime || !shift.endTime || !shift.date) {
    return {
      estimatedCost: 0,
      breakdown: { basePay: 0, penalties: 0, super: 0 },
      warnings: ['Incomplete shift data'],
    };
  }
  
  const startMins = parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1]);
  const endMins = parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1]);
  const netMinutes = endMins - startMins - (shift.breakMinutes || 30);
  const netHours = netMinutes / 60;
  
  const isPH = isPublicHoliday(shift.date);
  const dayOfWeek = format(parseISO(shift.date), 'EEEE');
  
  let penaltyMultiplier = 1;
  if (isPH) penaltyMultiplier = 2.5;
  else if (dayOfWeek === 'Sunday') penaltyMultiplier = 2;
  else if (dayOfWeek === 'Saturday') penaltyMultiplier = 1.5;
  
  const basePay = netHours * staff.hourlyRate;
  const penalties = basePay * (penaltyMultiplier - 1);
  const grossPay = basePay + penalties;
  const superAmount = grossPay * 0.115;
  
  const warnings: string[] = [];
  if (isPH) warnings.push('Public holiday rates apply (250%)');
  if (netHours > 8) warnings.push('Daily overtime may apply');
  
  return {
    estimatedCost: grossPay + superAmount,
    breakdown: {
      basePay,
      penalties,
      super: superAmount,
    },
    warnings,
  };
}
