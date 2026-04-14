/**
 * Demand-to-Shift Generation Engine
 * 
 * Pipeline:
 * 1. Interpolate demand data into 15-minute intervals
 * 2. Apply room ratio bands to calculate required staff per interval
 * 3. Group consecutive intervals into optimized shift envelopes
 * 4. Output open shifts ready for roster injection
 */

import { Room } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import {
  DemandInterval,
  RoomDemandProfile,
  ShiftEnvelope,
  DemandShiftConfig,
  DemandShiftGenerationResult,
  DEFAULT_DEMAND_SHIFT_CONFIG,
} from '@/types/demandShiftGeneration';

// ============= HELPERS =============

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Seeded random for deterministic interpolation
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Color palette for shift envelopes
const SHIFT_COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(350, 65%, 55%)',
];

// ============= STEP 1: INTERPOLATION =============

/**
 * Interpolates coarse demand data (4 time slots) into 15-minute intervals.
 * Uses smooth interpolation to create realistic demand curves.
 */
function interpolateDemandToIntervals(
  demandData: DemandAnalyticsData[],
  room: Room,
  date: string,
  config: DemandShiftConfig
): DemandInterval[] {
  const startMin = timeToMinutes(config.operatingStart);
  const endMin = timeToMinutes(config.operatingEnd);
  const intervals: DemandInterval[] = [];
  
  // Get demand records for this room/date
  const roomDemand = demandData.filter(d => d.roomId === room.id && d.date === date);
  
  if (roomDemand.length === 0) {
    // No demand data — generate empty intervals
    for (let min = startMin; min < endMin; min += 15) {
      intervals.push({
        time: minutesToTime(min),
        minuteOfDay: min,
        bookedChildren: 0,
        predictedAttendance: 0,
        requiredStaff: 0,
        scheduledStaff: 0,
        surplus: 0,
      });
    }
    return intervals;
  }
  
  // Parse time slot boundaries: "06:00-09:00" → { start, end, data }
  const slotMap = roomDemand.map(d => {
    const [slotStart, slotEnd] = d.timeSlot.split('-');
    return {
      startMin: timeToMinutes(slotStart),
      endMin: timeToMinutes(slotEnd),
      data: d,
    };
  });
  
  // Generate 15-minute intervals
  for (let min = startMin; min < endMin; min += 15) {
    const slot = slotMap.find(s => min >= s.startMin && min < s.endMin);
    
    if (!slot) {
      intervals.push({
        time: minutesToTime(min),
        minuteOfDay: min,
        bookedChildren: 0,
        predictedAttendance: 0,
        requiredStaff: 0,
        scheduledStaff: 0,
        surplus: 0,
      });
      continue;
    }
    
    const d = slot.data;
    const slotDuration = slot.endMin - slot.startMin;
    const progressInSlot = (min - slot.startMin) / slotDuration;
    
    // Create a realistic curve: ramp up in first slot, peak mid-morning, taper off
    // Use slot position within the day for shaping
    const hourOfDay = min / 60;
    let shapeFactor: number;
    
    if (hourOfDay < 7) shapeFactor = 0.4 + progressInSlot * 0.3;       // Early: ramping up
    else if (hourOfDay < 9) shapeFactor = 0.7 + progressInSlot * 0.3;  // Morning: building
    else if (hourOfDay < 12) shapeFactor = 0.9 + seededRandom(min) * 0.1; // Peak
    else if (hourOfDay < 14) shapeFactor = 0.85 + seededRandom(min + 1) * 0.1; // Post-lunch
    else if (hourOfDay < 16) shapeFactor = 0.7 + seededRandom(min + 2) * 0.15; // Afternoon
    else shapeFactor = 0.5 - (progressInSlot * 0.3);                   // Evening: tapering
    
    const booked = Math.max(0, Math.round(d.bookedChildren * shapeFactor));
    const attendanceRate = config.attendanceRateOverride ?? (d.attendanceRate / 100);
    const predicted = Math.round(booked * attendanceRate);
    
    // Step 2: Calculate required staff using ratio
    const childCount = config.roundingStrategy === 'ceiling' ? booked : predicted;
    const required = childCount > 0 ? Math.ceil(childCount / room.requiredRatio) : 0;
    
    const scheduled = Math.round(d.scheduledStaff * shapeFactor);
    
    intervals.push({
      time: minutesToTime(min),
      minuteOfDay: min,
      bookedChildren: booked,
      predictedAttendance: predicted,
      requiredStaff: Math.max(required, childCount > 0 ? 1 : 0), // At least 1 if any children
      scheduledStaff: scheduled,
      surplus: scheduled - required,
    });
  }
  
  return intervals;
}

// ============= STEP 2: ROOM DEMAND PROFILES =============

export function buildRoomDemandProfiles(
  demandData: DemandAnalyticsData[],
  rooms: Room[],
  date: string,
  config: DemandShiftConfig = DEFAULT_DEMAND_SHIFT_CONFIG
): RoomDemandProfile[] {
  return rooms.map(room => ({
    roomId: room.id,
    roomName: room.name,
    centreId: room.centreId,
    date,
    ageGroup: room.ageGroup,
    capacity: room.capacity,
    requiredRatio: room.requiredRatio,
    intervals: interpolateDemandToIntervals(demandData, room, date, config),
  }));
}

// ============= STEP 3: SHIFT ENVELOPE GENERATION =============

/**
 * Groups consecutive intervals with staffing requirements into optimized shift blocks.
 * Uses a greedy approach: scan the demand curve and create shifts that cover contiguous
 * periods where staff are needed, respecting min/max shift lengths.
 */
function generateShiftEnvelopes(
  profile: RoomDemandProfile,
  config: DemandShiftConfig,
  colorIndex: number
): ShiftEnvelope[] {
  const { intervals } = profile;
  const envelopes: ShiftEnvelope[] = [];
  
  if (intervals.length === 0) return envelopes;
  
  // Find the peak required staff across all intervals
  const peakRequired = Math.max(...intervals.map(i => i.requiredStaff), 0);
  if (peakRequired === 0) return envelopes;
  
  // Generate shifts layer by layer (one per staff member needed)
  for (let layer = 0; layer < peakRequired; layer++) {
    // Find contiguous blocks where this layer of staff is needed
    let blockStart: number | null = null;
    
    for (let i = 0; i <= intervals.length; i++) {
      const needed = i < intervals.length ? intervals[i].requiredStaff > layer : false;
      
      if (needed && blockStart === null) {
        blockStart = i;
      } else if (!needed && blockStart !== null) {
        // End of a block — create shift envelope(s)
        const startMin = intervals[blockStart].minuteOfDay;
        const endMin = intervals[i - 1].minuteOfDay + 15; // Add 15 for end of last interval
        const durationMin = endMin - startMin;
        
        // Apply overlap buffer
        const bufferedStart = Math.max(
          timeToMinutes(config.operatingStart),
          startMin - config.overlapBufferMinutes
        );
        const bufferedEnd = Math.min(
          timeToMinutes(config.operatingEnd),
          endMin + config.overlapBufferMinutes
        );
        const bufferedDuration = bufferedEnd - bufferedStart;
        
        // If too short, extend to minimum; if too long, split
        if (bufferedDuration <= config.maxShiftMinutes) {
          const finalDuration = Math.max(bufferedDuration, config.minShiftMinutes);
          // Center the shift around the demand block
          const excess = finalDuration - bufferedDuration;
          const adjStart = Math.max(
            timeToMinutes(config.operatingStart),
            bufferedStart - Math.floor(excess / 2)
          );
          const adjEnd = Math.min(
            timeToMinutes(config.operatingEnd),
            adjStart + finalDuration
          );
          
          const blockIntervals = intervals.filter(
            iv => iv.minuteOfDay >= adjStart && iv.minuteOfDay < adjEnd
          );
          const avgDemand = blockIntervals.length > 0
            ? blockIntervals.reduce((s, iv) => s + iv.bookedChildren, 0) / blockIntervals.length
            : 0;
          const peakDemand = blockIntervals.length > 0
            ? Math.max(...blockIntervals.map(iv => iv.bookedChildren))
            : 0;
          
          // Calculate break
          const shiftHours = (adjEnd - adjStart) / 60;
          const breakMins = shiftHours >= 7 ? 45 : shiftHours >= 5 ? 30 : 0;
          
          envelopes.push({
            id: `dse-${profile.roomId}-${profile.date}-${layer}-${blockStart}`,
            roomId: profile.roomId,
            roomName: profile.roomName,
            centreId: profile.centreId,
            date: profile.date,
            startTime: minutesToTime(adjStart),
            endTime: minutesToTime(adjEnd),
            durationMinutes: adjEnd - adjStart,
            breakMinutes: breakMins,
            requiredStaff: 1,
            averageDemand: Math.round(avgDemand * 10) / 10,
            peakDemand,
            priority: layer === 0 ? 'critical' : durationMin >= 360 ? 'high' : 'normal',
            source: 'demand-engine',
            color: SHIFT_COLORS[(colorIndex + layer) % SHIFT_COLORS.length],
          });
        } else {
          // Split into multiple shifts
          let splitStart = bufferedStart;
          while (splitStart < bufferedEnd) {
            const splitEnd = Math.min(splitStart + config.maxShiftMinutes, bufferedEnd);
            const splitDuration = splitEnd - splitStart;
            
            if (splitDuration < config.minShiftMinutes && envelopes.length > 0) {
              // Too short for a standalone shift — extend previous
              const prev = envelopes[envelopes.length - 1];
              const prevEnd = timeToMinutes(prev.endTime);
              const newEnd = Math.min(prevEnd + splitDuration, timeToMinutes(config.operatingEnd));
              prev.endTime = minutesToTime(newEnd);
              prev.durationMinutes = newEnd - timeToMinutes(prev.startTime);
              break;
            }
            
            const shiftHours = splitDuration / 60;
            const breakMins = shiftHours >= 7 ? 45 : shiftHours >= 5 ? 30 : 0;
            
            envelopes.push({
              id: `dse-${profile.roomId}-${profile.date}-${layer}-${splitStart}`,
              roomId: profile.roomId,
              roomName: profile.roomName,
              centreId: profile.centreId,
              date: profile.date,
              startTime: minutesToTime(splitStart),
              endTime: minutesToTime(splitEnd),
              durationMinutes: splitDuration,
              breakMinutes: breakMins,
              requiredStaff: 1,
              averageDemand: 0,
              peakDemand: 0,
              priority: layer === 0 ? 'critical' : 'high',
              source: 'demand-engine',
              color: SHIFT_COLORS[(colorIndex + layer) % SHIFT_COLORS.length],
            });
            
            splitStart = splitEnd;
          }
        }
        
        blockStart = null;
      }
    }
  }
  
  return envelopes;
}

// ============= MAIN ENTRY POINT =============

export function generateDemandDrivenShifts(
  demandData: DemandAnalyticsData[],
  rooms: Room[],
  dates: string[],
  config: DemandShiftConfig = DEFAULT_DEMAND_SHIFT_CONFIG
): DemandShiftGenerationResult {
  const allProfiles: RoomDemandProfile[] = [];
  const allEnvelopes: ShiftEnvelope[] = [];
  
  dates.forEach(date => {
    const profiles = buildRoomDemandProfiles(demandData, rooms, date, config);
    allProfiles.push(...profiles);
    
    profiles.forEach((profile, idx) => {
      const envelopes = generateShiftEnvelopes(profile, config, idx);
      allEnvelopes.push(...envelopes);
    });
  });
  
  // Build summary
  const roomBreakdown = rooms.map(room => {
    const roomEnvelopes = allEnvelopes.filter(e => e.roomId === room.id);
    return {
      roomId: room.id,
      roomName: room.name,
      shifts: roomEnvelopes.length,
      hours: Math.round(roomEnvelopes.reduce((s, e) => s + (e.durationMinutes - e.breakMinutes) / 60, 0) * 10) / 10,
    };
  });
  
  // Find coverage gaps
  const coverageGaps: { roomId: string; time: string; deficit: number }[] = [];
  allProfiles.forEach(profile => {
    profile.intervals.forEach(interval => {
      if (interval.requiredStaff > 0 && interval.surplus < 0) {
        coverageGaps.push({
          roomId: profile.roomId,
          time: `${profile.date} ${interval.time}`,
          deficit: Math.abs(interval.surplus),
        });
      }
    });
  });
  
  const allRequired = allProfiles.flatMap(p => p.intervals.map(i => i.requiredStaff));
  
  return {
    roomProfiles: allProfiles,
    shiftEnvelopes: allEnvelopes,
    summary: {
      totalShifts: allEnvelopes.length,
      totalHours: Math.round(allEnvelopes.reduce((s, e) => s + (e.durationMinutes - e.breakMinutes) / 60, 0) * 10) / 10,
      roomBreakdown,
      peakStaffRequired: Math.max(...allRequired, 0),
      averageStaffRequired: allRequired.length > 0
        ? Math.round((allRequired.reduce((a, b) => a + b, 0) / allRequired.length) * 10) / 10
        : 0,
      coverageGaps: coverageGaps.slice(0, 20), // Cap at 20 for display
    },
  };
}

/**
 * Convert shift envelopes into roster-compatible shift objects
 */
export function convertEnvelopesToRosterShifts(
  envelopes: ShiftEnvelope[]
): Omit<import('@/types/roster').Shift, 'id'>[] {
  return envelopes.map(env => ({
    staffId: '',
    centreId: env.centreId,
    roomId: env.roomId,
    date: env.date,
    startTime: env.startTime,
    endTime: env.endTime,
    breakMinutes: env.breakMinutes,
    status: 'draft' as const,
    isOpenShift: true,
    notes: `Generated from demand (avg ${env.averageDemand} children, peak ${env.peakDemand})`,
  }));
}
