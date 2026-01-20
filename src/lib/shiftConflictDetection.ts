import { Shift, StaffMember, ShiftConflict, ShiftConflictType, Room } from '@/types/roster';
import { format, parseISO, differenceInHours, addDays, subDays } from 'date-fns';

// Convert time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// Calculate shift duration in hours
function getShiftHours(shift: Shift): number {
  const start = timeToMinutes(shift.startTime);
  const end = timeToMinutes(shift.endTime);
  return (end - start - shift.breakMinutes) / 60;
}

/**
 * Detect shift conflicts for a given shift
 * @param newShift - The shift to check for conflicts
 * @param existingShifts - Shifts within the current centre for other checks (overtime, rest periods, etc.)
 * @param staff - All staff members
 * @param rooms - Rooms for the current centre (for room preference checks)
 * @param allShiftsAcrossLocations - Optional: All shifts across all locations for cross-location overlap detection
 */
export function detectShiftConflicts(
  newShift: Shift,
  existingShifts: Shift[],
  staff: StaffMember[],
  rooms: Room[],
  allShiftsAcrossLocations?: Shift[]
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = [];
  const staffMember = staff.find(s => s.id === newShift.staffId);
  
  if (!staffMember) return conflicts;

  const shiftDate = parseISO(newShift.date);
  const dayOfWeek = shiftDate.getDay();

  // Use allShiftsAcrossLocations for cross-location overlap detection, fallback to existingShifts
  const shiftsToCheckForOverlap = allShiftsAcrossLocations || existingShifts;

  // 1. Check for overlapping shifts on same day ACROSS ALL LOCATIONS
  const sameDayShifts = shiftsToCheckForOverlap.filter(
    s => s.staffId === newShift.staffId && s.date === newShift.date && s.id !== newShift.id
  );
  
  for (const existing of sameDayShifts) {
    if (timesOverlap(newShift.startTime, newShift.endTime, existing.startTime, existing.endTime)) {
      const isSameLocation = existing.centreId === newShift.centreId;
      conflicts.push({
        id: `conflict-overlap-${newShift.id}-${existing.id}`,
        type: 'overlap',
        severity: 'error',
        shiftId: newShift.id,
        staffId: newShift.staffId,
        message: isSameLocation 
          ? `Shift overlaps with existing shift (${existing.startTime}-${existing.endTime})`
          : `Cross-location conflict: overlaps with shift at another centre (${existing.startTime}-${existing.endTime})`,
        details: isSameLocation
          ? `${staffMember.name} already has a shift from ${existing.startTime} to ${existing.endTime} on this day`
          : `${staffMember.name} has a conflicting shift at another location from ${existing.startTime} to ${existing.endTime}. Staff cannot be in two places at once.`,
        canOverride: false,
      });
    }
  }

  // 2. Check availability
  const availability = staffMember.availability.find(a => a.dayOfWeek === dayOfWeek);
  if (!availability?.available) {
    conflicts.push({
      id: `conflict-unavailable-${newShift.id}`,
      type: 'outside_availability',
      severity: 'error',
      shiftId: newShift.id,
      staffId: newShift.staffId,
      message: `${staffMember.name} is not available on ${format(shiftDate, 'EEEE')}`,
      canOverride: true,
    });
  } else if (availability.startTime && availability.endTime) {
    const availStart = timeToMinutes(availability.startTime);
    const availEnd = timeToMinutes(availability.endTime);
    const shiftStart = timeToMinutes(newShift.startTime);
    const shiftEnd = timeToMinutes(newShift.endTime);

    if (shiftStart < availStart || shiftEnd > availEnd) {
      conflicts.push({
        id: `conflict-availability-time-${newShift.id}`,
        type: 'outside_availability',
        severity: 'warning',
        shiftId: newShift.id,
        staffId: newShift.staffId,
        message: `Shift extends outside availability (${availability.startTime}-${availability.endTime})`,
        details: `${staffMember.name} is only available ${availability.startTime}-${availability.endTime}`,
        canOverride: true,
      });
    }
  }

  // 3. Check overtime (use all shifts for this staff, not just current centre)
  const allStaffShifts = shiftsToCheckForOverlap.filter(s => s.staffId === newShift.staffId && s.id !== newShift.id);
  const totalHours = allStaffShifts.reduce((sum, s) => sum + getShiftHours(s), 0) + getShiftHours(newShift);
  
  if (totalHours > staffMember.maxHoursPerWeek) {
    conflicts.push({
      id: `conflict-overtime-${newShift.id}`,
      type: 'overtime_exceeded',
      severity: 'warning',
      shiftId: newShift.id,
      staffId: newShift.staffId,
      message: `Adding this shift will exceed max weekly hours (${staffMember.maxHoursPerWeek}h)`,
      details: `Total would be ${totalHours.toFixed(1)}h, ${(totalHours - staffMember.maxHoursPerWeek).toFixed(1)}h overtime`,
      canOverride: true,
    });
  }

  // 4. Check leave/time off
  const timeOff = staffMember.timeOff?.find(to => {
    const start = parseISO(to.startDate);
    const end = parseISO(to.endDate);
    return shiftDate >= start && shiftDate <= end && to.status === 'approved';
  });
  
  if (timeOff) {
    conflicts.push({
      id: `conflict-leave-${newShift.id}`,
      type: 'on_leave',
      severity: 'error',
      shiftId: newShift.id,
      staffId: newShift.staffId,
      message: `${staffMember.name} is on approved leave on this date`,
      details: `Leave type: ${timeOff.type.replace('_', ' ')}`,
      canOverride: false,
    });
  }

  // 5. Check minimum rest between shifts (across all locations)
  const minRest = staffMember.schedulingPreferences?.minRestHoursBetweenShifts || 10;
  const previousDay = format(subDays(shiftDate, 1), 'yyyy-MM-dd');
  const nextDay = format(addDays(shiftDate, 1), 'yyyy-MM-dd');
  
  const prevDayShifts = shiftsToCheckForOverlap.filter(s => s.staffId === newShift.staffId && s.date === previousDay);
  const nextDayShifts = shiftsToCheckForOverlap.filter(s => s.staffId === newShift.staffId && s.date === nextDay);
  
  for (const prev of prevDayShifts) {
    const prevEnd = timeToMinutes(prev.endTime);
    const newStart = timeToMinutes(newShift.startTime);
    const restHours = (24 * 60 - prevEnd + newStart) / 60;
    
    if (restHours < minRest) {
      conflicts.push({
        id: `conflict-rest-prev-${newShift.id}`,
        type: 'insufficient_rest',
        severity: 'warning',
        shiftId: newShift.id,
        staffId: newShift.staffId,
        message: `Only ${restHours.toFixed(1)}h rest from previous day shift`,
        details: `Minimum ${minRest}h rest required between shifts`,
        canOverride: true,
      });
    }
  }

  for (const next of nextDayShifts) {
    const newEnd = timeToMinutes(newShift.endTime);
    const nextStart = timeToMinutes(next.startTime);
    const restHours = (24 * 60 - newEnd + nextStart) / 60;
    
    if (restHours < minRest) {
      conflicts.push({
        id: `conflict-rest-next-${newShift.id}`,
        type: 'insufficient_rest',
        severity: 'warning',
        shiftId: newShift.id,
        staffId: newShift.staffId,
        message: `Only ${restHours.toFixed(1)}h rest before next day shift`,
        details: `Minimum ${minRest}h rest required between shifts`,
        canOverride: true,
      });
    }
  }

  // 6. Check max consecutive days (across all locations)
  const maxConsecutive = staffMember.schedulingPreferences?.maxConsecutiveDays || 5;
  let consecutiveDays = 1;
  
  for (let i = 1; i <= maxConsecutive; i++) {
    const checkDate = format(subDays(shiftDate, i), 'yyyy-MM-dd');
    if (shiftsToCheckForOverlap.some(s => s.staffId === newShift.staffId && s.date === checkDate)) {
      consecutiveDays++;
    } else break;
  }
  
  for (let i = 1; i <= maxConsecutive; i++) {
    const checkDate = format(addDays(shiftDate, i), 'yyyy-MM-dd');
    if (shiftsToCheckForOverlap.some(s => s.staffId === newShift.staffId && s.date === checkDate)) {
      consecutiveDays++;
    } else break;
  }
  
  if (consecutiveDays > maxConsecutive) {
    conflicts.push({
      id: `conflict-consecutive-${newShift.id}`,
      type: 'max_consecutive_days',
      severity: 'warning',
      shiftId: newShift.id,
      staffId: newShift.staffId,
      message: `Would exceed max ${maxConsecutive} consecutive work days`,
      details: `This would result in ${consecutiveDays} consecutive days`,
      canOverride: true,
    });
  }

  // 7. Check preferred/avoided rooms
  if (staffMember.schedulingPreferences?.avoidRooms?.includes(newShift.roomId)) {
    const room = rooms.find(r => r.id === newShift.roomId);
    conflicts.push({
      id: `conflict-room-avoid-${newShift.id}`,
      type: 'preferred_room_violated',
      severity: 'warning',
      shiftId: newShift.id,
      staffId: newShift.staffId,
      message: `${room?.name || 'This room'} is in staff's avoid list`,
      details: `Consider assigning to a different room`,
      canOverride: true,
    });
  }

  return conflicts;
}

/**
 * Detect cross-location conflicts for all shifts of a specific staff member
 * Returns only overlap conflicts across different centres
 */
export function detectCrossLocationConflicts(
  staffId: string,
  allShifts: Shift[],
  staff: StaffMember[]
): ShiftConflict[] {
  const staffShifts = allShifts.filter(s => s.staffId === staffId);
  const conflicts: ShiftConflict[] = [];
  const staffMember = staff.find(s => s.id === staffId);
  
  if (!staffMember || staffShifts.length < 2) return conflicts;

  // Group shifts by date
  const shiftsByDate = new Map<string, Shift[]>();
  staffShifts.forEach(shift => {
    const existing = shiftsByDate.get(shift.date) || [];
    existing.push(shift);
    shiftsByDate.set(shift.date, existing);
  });

  // Check each date for overlaps across different centres
  shiftsByDate.forEach((dayShifts, date) => {
    if (dayShifts.length < 2) return;

    for (let i = 0; i < dayShifts.length; i++) {
      for (let j = i + 1; j < dayShifts.length; j++) {
        const shift1 = dayShifts[i];
        const shift2 = dayShifts[j];

        if (timesOverlap(shift1.startTime, shift1.endTime, shift2.startTime, shift2.endTime)) {
          const isCrossLocation = shift1.centreId !== shift2.centreId;
          conflicts.push({
            id: `conflict-overlap-${shift1.id}-${shift2.id}`,
            type: 'overlap',
            severity: 'error',
            shiftId: shift1.id,
            staffId: staffId,
            message: isCrossLocation
              ? `Cross-location conflict: ${staffMember.name} has overlapping shifts at different centres`
              : `${staffMember.name} has overlapping shifts (${shift1.startTime}-${shift1.endTime} and ${shift2.startTime}-${shift2.endTime})`,
            details: `Shifts overlap on ${date}: ${shift1.startTime}-${shift1.endTime} and ${shift2.startTime}-${shift2.endTime}`,
            canOverride: false,
          });
        }
      }
    }
  });

  return conflicts;
}

/**
 * Check if a shift can be published (no blocking conflicts)
 */
export function canPublishShift(
  shift: Shift,
  allShifts: Shift[],
  staff: StaffMember[],
  rooms: Room[]
): { canPublish: boolean; blockingConflicts: ShiftConflict[] } {
  const conflicts = detectShiftConflicts(shift, allShifts, staff, rooms, allShifts);
  const blockingConflicts = conflicts.filter(c => c.severity === 'error' && !c.canOverride);
  
  return {
    canPublish: blockingConflicts.length === 0,
    blockingConflicts
  };
}

/**
 * Check if all draft shifts in a centre can be published
 */
export function canPublishRoster(
  shifts: Shift[],
  centreId: string,
  allShifts: Shift[],
  staff: StaffMember[],
  rooms: Room[]
): { canPublish: boolean; blockingShifts: { shift: Shift; conflicts: ShiftConflict[] }[] } {
  const draftShifts = shifts.filter(s => s.status === 'draft' && s.centreId === centreId);
  const blockingShifts: { shift: Shift; conflicts: ShiftConflict[] }[] = [];

  draftShifts.forEach(shift => {
    const { canPublish, blockingConflicts } = canPublishShift(shift, allShifts, staff, rooms);
    if (!canPublish) {
      blockingShifts.push({ shift, conflicts: blockingConflicts });
    }
  });

  return {
    canPublish: blockingShifts.length === 0,
    blockingShifts
  };
}

export function getConflictSeverityColor(severity: ShiftConflict['severity']): string {
  switch (severity) {
    case 'error': return 'text-destructive bg-destructive/10 border-destructive';
    case 'warning': return 'text-amber-600 bg-amber-500/10 border-amber-500';
    default: return 'text-muted-foreground bg-muted/10 border-muted';
  }
}

export function getConflictIcon(type: ShiftConflictType): string {
  switch (type) {
    case 'overlap': return '⚠️';
    case 'outside_availability': return '🕐';
    case 'overtime_exceeded': return '⏰';
    case 'insufficient_rest': return '😴';
    case 'max_consecutive_days': return '📅';
    case 'on_leave': return '🏖️';
    case 'qualification_missing': return '📋';
    case 'preferred_room_violated': return '🚫';
    default: return '❗';
  }
}
