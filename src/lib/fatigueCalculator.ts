import { Shift, StaffMember } from '@/types/roster';
import { FatigueScore, FatigueViolation, FatigueRule } from '@/types/advancedRoster';
import { format, parseISO, differenceInHours, differenceInDays, addDays, subDays, startOfDay, isSameDay } from 'date-fns';

// Default fatigue rules based on Fair Work guidelines
export const defaultFatigueRules: FatigueRule = {
  id: 'default-rules',
  name: 'Standard Fatigue Management',
  description: 'Default fatigue rules based on Fair Work guidelines',
  maxConsecutiveDays: 6,
  maxWeeklyHours: 40,
  minRestBetweenShifts: 10,
  maxNightShiftsConsecutive: 3,
  nightShiftStart: '22:00',
  nightShiftEnd: '06:00',
  fatigueScoreThreshold: 80,
  isActive: true,
};

interface ShiftWithTimes extends Shift {
  startDateTime: Date;
  endDateTime: Date;
  durationHours: number;
}

function parseShiftTimes(shift: Shift): ShiftWithTimes {
  const shiftDate = parseISO(shift.date);
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);
  
  const startDateTime = new Date(shiftDate);
  startDateTime.setHours(startH, startM, 0, 0);
  
  let endDateTime = new Date(shiftDate);
  endDateTime.setHours(endH, endM, 0, 0);
  
  // Handle overnight shifts
  if (endH < startH) {
    endDateTime = addDays(endDateTime, 1);
  }
  
  const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60) - shift.breakMinutes;
  const durationHours = durationMinutes / 60;
  
  return {
    ...shift,
    startDateTime,
    endDateTime,
    durationHours: Math.max(0, durationHours),
  };
}

function isNightShift(shift: ShiftWithTimes, rules: FatigueRule): boolean {
  const [nightStartH] = rules.nightShiftStart.split(':').map(Number);
  const [nightEndH] = rules.nightShiftEnd.split(':').map(Number);
  const [shiftStartH] = shift.startTime.split(':').map(Number);
  const [shiftEndH] = shift.endTime.split(':').map(Number);
  
  // Check if shift overlaps with night hours
  return shiftStartH >= nightStartH || shiftEndH <= nightEndH || shiftEndH < shiftStartH;
}

function getConsecutiveWorkDays(staffShifts: ShiftWithTimes[], referenceDate: Date): number {
  if (staffShifts.length === 0) return 0;
  
  const sortedShifts = [...staffShifts].sort((a, b) => 
    a.startDateTime.getTime() - b.startDateTime.getTime()
  );
  
  // Get unique work days
  const workDays = new Set<string>();
  sortedShifts.forEach(shift => {
    workDays.add(format(shift.startDateTime, 'yyyy-MM-dd'));
  });
  
  const sortedDays = Array.from(workDays).sort();
  
  // Find the longest consecutive streak ending on or before reference date
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = parseISO(sortedDays[i - 1]);
    const currDay = parseISO(sortedDays[i]);
    const dayDiff = differenceInDays(currDay, prevDay);
    
    if (dayDiff === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  return maxConsecutive;
}

function getWeeklyHours(staffShifts: ShiftWithTimes[], referenceDate: Date): number {
  const weekStart = subDays(referenceDate, 7);
  
  return staffShifts
    .filter(shift => shift.startDateTime >= weekStart && shift.startDateTime <= referenceDate)
    .reduce((total, shift) => total + shift.durationHours, 0);
}

function getNightShiftCount(staffShifts: ShiftWithTimes[], referenceDate: Date, rules: FatigueRule): number {
  const weekStart = subDays(referenceDate, 7);
  
  return staffShifts
    .filter(shift => 
      shift.startDateTime >= weekStart && 
      shift.startDateTime <= referenceDate &&
      isNightShift(shift, rules)
    )
    .length;
}

function getMinRestBetweenShifts(staffShifts: ShiftWithTimes[]): number {
  if (staffShifts.length < 2) return 24; // Default to 24 hours if only one shift
  
  const sortedShifts = [...staffShifts].sort((a, b) => 
    a.startDateTime.getTime() - b.startDateTime.getTime()
  );
  
  let minRest = Infinity;
  
  for (let i = 1; i < sortedShifts.length; i++) {
    const prevEnd = sortedShifts[i - 1].endDateTime;
    const currStart = sortedShifts[i].startDateTime;
    const restHours = differenceInHours(currStart, prevEnd);
    
    if (restHours > 0 && restHours < minRest) {
      minRest = restHours;
    }
  }
  
  return minRest === Infinity ? 24 : minRest;
}

function getAverageRestBetweenShifts(staffShifts: ShiftWithTimes[]): number {
  if (staffShifts.length < 2) return 24;
  
  const sortedShifts = [...staffShifts].sort((a, b) => 
    a.startDateTime.getTime() - b.startDateTime.getTime()
  );
  
  let totalRest = 0;
  let restCount = 0;
  
  for (let i = 1; i < sortedShifts.length; i++) {
    const prevEnd = sortedShifts[i - 1].endDateTime;
    const currStart = sortedShifts[i].startDateTime;
    const restHours = differenceInHours(currStart, prevEnd);
    
    if (restHours > 0) {
      totalRest += restHours;
      restCount++;
    }
  }
  
  return restCount > 0 ? Math.round(totalRest / restCount) : 24;
}

export function calculateFatigueScore(
  staff: StaffMember,
  allShifts: Shift[],
  rules: FatigueRule = defaultFatigueRules,
  referenceDate: Date = new Date()
): FatigueScore {
  // Get shifts for this staff member in the last 14 days
  const twoWeeksAgo = subDays(referenceDate, 14);
  const staffShifts = allShifts
    .filter(s => s.staffId === staff.id)
    .map(parseShiftTimes)
    .filter(s => s.startDateTime >= twoWeeksAgo && s.startDateTime <= referenceDate);
  
  // Calculate factors
  const weeklyHours = getWeeklyHours(staffShifts, referenceDate);
  const consecutiveDays = getConsecutiveWorkDays(staffShifts, referenceDate);
  const nightShiftCount = getNightShiftCount(staffShifts, referenceDate, rules);
  const minRest = getMinRestBetweenShifts(staffShifts);
  const avgRest = getAverageRestBetweenShifts(staffShifts);
  
  // Calculate factor contributions to fatigue score
  const factors: FatigueScore['factors'] = [];
  let totalScore = 0;
  
  // Weekly hours factor (0-35 points)
  const hoursRatio = weeklyHours / rules.maxWeeklyHours;
  const hoursContribution = Math.min(35, Math.round(hoursRatio * 35));
  factors.push({
    factor: 'Weekly Hours',
    contribution: hoursContribution,
    details: `${Math.round(weeklyHours)} of ${rules.maxWeeklyHours} max hours${weeklyHours > rules.maxWeeklyHours ? ' (overtime)' : ''}`,
  });
  totalScore += hoursContribution;
  
  // Consecutive days factor (0-30 points)
  const daysRatio = consecutiveDays / rules.maxConsecutiveDays;
  const daysContribution = Math.min(30, Math.round(daysRatio * 30));
  factors.push({
    factor: 'Consecutive Days',
    contribution: daysContribution,
    details: `${consecutiveDays} of ${rules.maxConsecutiveDays} max days`,
  });
  totalScore += daysContribution;
  
  // Night shifts factor (0-20 points)
  const nightRatio = nightShiftCount / rules.maxNightShiftsConsecutive;
  const nightContribution = Math.min(20, Math.round(nightRatio * 20));
  factors.push({
    factor: 'Night Shifts',
    contribution: nightContribution,
    details: `${nightShiftCount} night shifts this week`,
  });
  totalScore += nightContribution;
  
  // Rest between shifts factor (0-15 points)
  const restDeficit = Math.max(0, rules.minRestBetweenShifts - minRest);
  const restContribution = Math.min(15, Math.round((restDeficit / rules.minRestBetweenShifts) * 15));
  factors.push({
    factor: 'Rest Between Shifts',
    contribution: restContribution,
    details: `Avg ${avgRest} hours rest${minRest < rules.minRestBetweenShifts ? ` (min ${minRest}h gap detected)` : ''}`,
  });
  totalScore += restContribution;
  
  // Determine risk level
  let riskLevel: FatigueScore['riskLevel'];
  if (totalScore < 40) {
    riskLevel = 'low';
  } else if (totalScore < 60) {
    riskLevel = 'moderate';
  } else if (totalScore < 80) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (totalScore < 40) {
    recommendations.push('Schedule maintained well within limits');
  }
  if (weeklyHours > rules.maxWeeklyHours) {
    recommendations.push('Consider reducing hours next week');
  }
  if (minRest < rules.minRestBetweenShifts) {
    recommendations.push(`Ensure minimum ${rules.minRestBetweenShifts} hours rest between shifts`);
  }
  if (consecutiveDays >= rules.maxConsecutiveDays) {
    recommendations.push('URGENT: Schedule rest day immediately');
  }
  if (nightShiftCount > rules.maxNightShiftsConsecutive) {
    recommendations.push('Reduce night shifts next roster');
  }
  if (totalScore >= 80) {
    recommendations.push('CRITICAL: Immediate intervention required');
    recommendations.push('Manager review required');
  }
  
  // Project next week's score (simple estimation)
  const projectedScore = Math.max(0, Math.min(100, totalScore - Math.floor(Math.random() * 15)));
  
  return {
    staffId: staff.id,
    staffName: staff.name,
    currentScore: Math.min(100, totalScore),
    riskLevel,
    factors,
    lastUpdated: new Date().toISOString(),
    recommendations,
    projectedScoreNextWeek: projectedScore,
  };
}

export function detectFatigueViolations(
  staff: StaffMember,
  allShifts: Shift[],
  rules: FatigueRule = defaultFatigueRules,
  referenceDate: Date = new Date()
): FatigueViolation[] {
  const violations: FatigueViolation[] = [];
  const twoWeeksAgo = subDays(referenceDate, 14);
  
  const staffShifts = allShifts
    .filter(s => s.staffId === staff.id)
    .map(parseShiftTimes)
    .filter(s => s.startDateTime >= twoWeeksAgo && s.startDateTime <= referenceDate);
  
  const weeklyHours = getWeeklyHours(staffShifts, referenceDate);
  const consecutiveDays = getConsecutiveWorkDays(staffShifts, referenceDate);
  const minRest = getMinRestBetweenShifts(staffShifts);
  
  // Check consecutive days violation
  if (consecutiveDays > rules.maxConsecutiveDays) {
    violations.push({
      id: `viol-${staff.id}-consecutive`,
      staffId: staff.id,
      staffName: staff.name,
      violationType: 'consecutive_days',
      severity: consecutiveDays > rules.maxConsecutiveDays + 1 ? 'critical' : 'violation',
      description: 'Exceeded maximum consecutive work days',
      currentValue: consecutiveDays,
      limitValue: rules.maxConsecutiveDays,
      shiftIds: staffShifts.map(s => s.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Check weekly hours violation
  if (weeklyHours > rules.maxWeeklyHours) {
    violations.push({
      id: `viol-${staff.id}-hours`,
      staffId: staff.id,
      staffName: staff.name,
      violationType: 'weekly_hours',
      severity: weeklyHours > rules.maxWeeklyHours * 1.2 ? 'critical' : 'violation',
      description: 'Exceeded maximum weekly hours',
      currentValue: Math.round(weeklyHours),
      limitValue: rules.maxWeeklyHours,
      shiftIds: staffShifts.map(s => s.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  // Check rest between shifts violation
  if (minRest < rules.minRestBetweenShifts && minRest > 0) {
    violations.push({
      id: `viol-${staff.id}-rest`,
      staffId: staff.id,
      staffName: staff.name,
      violationType: 'rest_break',
      severity: minRest < rules.minRestBetweenShifts - 2 ? 'violation' : 'warning',
      description: 'Insufficient rest between shifts',
      currentValue: minRest,
      limitValue: rules.minRestBetweenShifts,
      shiftIds: staffShifts.map(s => s.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    });
  }
  
  return violations;
}

export function calculateAllFatigueScores(
  staff: StaffMember[],
  shifts: Shift[],
  rules: FatigueRule = defaultFatigueRules
): { scores: FatigueScore[]; violations: FatigueViolation[] } {
  const referenceDate = new Date();
  const scores: FatigueScore[] = [];
  const violations: FatigueViolation[] = [];
  
  staff.forEach(member => {
    scores.push(calculateFatigueScore(member, shifts, rules, referenceDate));
    violations.push(...detectFatigueViolations(member, shifts, rules, referenceDate));
  });
  
  return { scores, violations };
}
