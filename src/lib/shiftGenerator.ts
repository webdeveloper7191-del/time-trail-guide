import { Shift, StaffMember, Room } from '@/types/roster';
import { RecurringShiftPattern } from '@/types/advancedRoster';
import { format, addDays, addWeeks, parseISO, getDay, startOfWeek, eachDayOfInterval } from 'date-fns';

export interface GeneratedShift {
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  staffId?: string;
  centreId: string;
  breakMinutes: number;
  patternId: string;
  patternName: string;
}

export function generateShiftsFromPattern(
  pattern: RecurringShiftPattern,
  startDate: Date,
  weeksToGenerate: number = 4,
  existingShifts: Shift[] = []
): GeneratedShift[] {
  const generatedShifts: GeneratedShift[] = [];
  const endDate = addWeeks(startDate, weeksToGenerate);
  
  // Get all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Filter days based on pattern
  const patternDays = pattern.daysOfWeek || [];
  
  allDays.forEach(day => {
    const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if this day matches the pattern
    if (!patternDays.includes(dayOfWeek)) return;
    
    // For fortnightly patterns, check week interval
    if (pattern.pattern === 'fortnightly' && pattern.weekInterval) {
      const patternStartDate = parseISO(pattern.startDate);
      const weeksDiff = Math.floor((day.getTime() - patternStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksDiff % pattern.weekInterval !== 0) return;
    }
    
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Check if shift already exists for this day/time
    const alreadyExists = existingShifts.some(
      s => s.date === dateStr && 
           s.startTime === pattern.shiftTemplate.startTime
    );
    
    if (!alreadyExists) {
      generatedShifts.push({
        date: dateStr,
        startTime: pattern.shiftTemplate.startTime,
        endTime: pattern.shiftTemplate.endTime,
        roomId: '', // Will use default room
        staffId: pattern.assignedStaffId,
        centreId: pattern.shiftTemplate.centreId,
        breakMinutes: pattern.shiftTemplate.breakDuration || 30,
        patternId: pattern.id,
        patternName: pattern.name,
      });
    }
  });
  
  return generatedShifts;
}

export function convertGeneratedShiftsToRosterShifts(
  generatedShifts: GeneratedShift[],
  defaultRoomId: string
): Omit<Shift, 'id'>[] {
  return generatedShifts.map(gs => ({
    staffId: gs.staffId || '',
    centreId: gs.centreId,
    roomId: gs.roomId || defaultRoomId,
    date: gs.date,
    startTime: gs.startTime,
    endTime: gs.endTime,
    breakMinutes: gs.breakMinutes,
    status: 'draft' as const,
    isOpenShift: !gs.staffId,
    notes: `Generated from pattern: ${gs.patternName}`,
  }));
}

export function generateBulkShiftsFromPatterns(
  patterns: RecurringShiftPattern[],
  startDate: Date,
  weeksToGenerate: number,
  existingShifts: Shift[],
  defaultRoomId: string
): { shifts: Omit<Shift, 'id'>[]; summary: { patternId: string; patternName: string; count: number }[] } {
  const allGeneratedShifts: GeneratedShift[] = [];
  const summary: { patternId: string; patternName: string; count: number }[] = [];
  
  patterns
    .filter(p => p.isActive)
    .forEach(pattern => {
      const generated = generateShiftsFromPattern(pattern, startDate, weeksToGenerate, existingShifts);
      allGeneratedShifts.push(...generated);
      summary.push({
        patternId: pattern.id,
        patternName: pattern.name,
        count: generated.length,
      });
    });
  
  const shifts = convertGeneratedShiftsToRosterShifts(allGeneratedShifts, defaultRoomId);
  
  return { shifts, summary };
}
