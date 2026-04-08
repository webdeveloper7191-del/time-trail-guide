// Area Combining Analysis Engine
// Analyzes demand data per time block and detects when rooms should be combined

import { DemandData, Room } from '@/types/roster';
import { AreaCombiningThreshold } from '@/types/location';

export interface TimeBlock {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  timeSlot: string; // matches DemandData.timeSlot format
}

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: 'early-morning', label: 'Early Morning', startTime: '06:00', endTime: '09:00', timeSlot: '06:00-09:00' },
  { id: 'morning', label: 'Morning', startTime: '09:00', endTime: '12:00', timeSlot: '09:00-12:00' },
  { id: 'afternoon', label: 'Afternoon', startTime: '12:00', endTime: '15:00', timeSlot: '12:00-15:00' },
  { id: 'late-afternoon', label: 'Late Afternoon', startTime: '15:00', endTime: '18:00', timeSlot: '15:00-18:00' },
];

export type CombineAlertSeverity = 'suggestion' | 'recommended' | 'critical';
export type CombineAlertStatus = 'pending' | 'accepted' | 'dismissed' | 'snoozed';

export interface CombineAlert {
  id: string;
  date: string;
  centreId: string;
  timeBlock: TimeBlock;
  severity: CombineAlertSeverity;
  status: CombineAlertStatus;
  
  // Source rooms to combine
  sourceRooms: {
    roomId: string;
    roomName: string;
    ageGroup: string;
    currentAttendance: number;
    capacity: number;
    utilisationPercent: number;
    currentStaffNeeded: number;
  }[];
  
  // Target combined room
  targetRoom?: {
    roomId: string;
    roomName: string;
  };
  
  // Savings
  totalAttendanceCombined: number;
  totalCapacityCombined: number;
  staffBefore: number;
  staffAfter: number;
  staffSaved: number;
  
  // Trigger info
  triggerType: AreaCombiningThreshold['triggerType'];
  triggerThreshold: number;
  triggerActual: number;
  message: string;
  promptMessage?: string;
}

export interface CombiningPlan {
  id: string;
  date: string;
  centreId: string;
  timeBlock: TimeBlock;
  status: 'draft' | 'active' | 'completed';
  
  // Rooms being combined
  sourceRoomIds: string[];
  targetRoomId: string;
  
  // Staff reassignment
  staffReassignments: {
    staffId: string;
    fromRoomId: string;
    toRoomId: string;
    action: 'move' | 'release'; // move to combined room or release from duty
  }[];
  
  createdAt: string;
  createdBy?: string;
}

// Calculate staff required based on attendance and ratio
function calculateStaffRequired(attendance: number, ratio: number): number {
  if (attendance <= 0) return 0;
  return Math.ceil(attendance / ratio);
}

// Determine severity based on how much below threshold
function determineSeverity(utilisationPercent: number): CombineAlertSeverity {
  if (utilisationPercent <= 25) return 'critical';
  if (utilisationPercent <= 40) return 'recommended';
  return 'suggestion';
}

// Check if two rooms are compatible for combining (same or similar age group)
function areRoomsCompatible(room1: Room, room2: Room, sameCategory: boolean): boolean {
  if (!sameCategory) return true;
  return room1.ageGroup === room2.ageGroup;
}

export interface AnalyzeOptions {
  centreId: string;
  date: string;
  demandData: DemandData[];
  rooms: Room[];
  thresholds: AreaCombiningThreshold[];
  timeBlocks?: TimeBlock[];
}

export function analyzeAreaCombining(options: AnalyzeOptions): CombineAlert[] {
  const {
    centreId,
    date,
    demandData,
    rooms,
    thresholds,
    timeBlocks = DEFAULT_TIME_BLOCKS,
  } = options;

  const alerts: CombineAlert[] = [];
  const centreRooms = rooms.filter(r => r.centreId === centreId);
  const activethresholds = thresholds.filter(t => t.isActive);

  if (activethresholds.length === 0 || centreRooms.length < 2) return alerts;

  for (const block of timeBlocks) {
    // Get demand for this time block
    const blockDemand = demandData.filter(
      d => d.date === date && d.centreId === centreId && d.timeSlot === block.timeSlot
    );

    if (blockDemand.length === 0) continue;

    // Build room utilisation map
    const roomStats = centreRooms.map(room => {
      const demand = blockDemand.find(d => d.roomId === room.id);
      const attendance = demand?.bookedChildren ?? 0;
      const utilisation = room.capacity > 0 ? (attendance / room.capacity) * 100 : 0;
      const staffNeeded = calculateStaffRequired(attendance, room.requiredRatio);

      return {
        room,
        attendance,
        capacity: room.capacity,
        utilisation,
        staffNeeded,
      };
    });

    // Check each threshold against each room
    for (const threshold of activethresholds) {
      const lowRooms = roomStats.filter(rs => {
        switch (threshold.triggerType) {
          case 'attendance_percentage':
            return rs.utilisation < threshold.triggerValue && rs.attendance > 0;
          case 'absolute_count':
            return rs.attendance < threshold.triggerValue && rs.attendance > 0;
          case 'staff_ratio':
            // Staff ratio inefficiency: if we need 1 staff but have capacity for more
            return rs.utilisation < threshold.triggerValue;
          default:
            return false;
        }
      });

      if (lowRooms.length < 2) continue;

      // Group compatible rooms for combining
      const compatibleGroups: typeof lowRooms[] = [];
      const used = new Set<string>();

      for (const room of lowRooms) {
        if (used.has(room.room.id)) continue;

        const group = [room];
        used.add(room.room.id);

        for (const other of lowRooms) {
          if (used.has(other.room.id)) continue;
          if (areRoomsCompatible(room.room, other.room, threshold.combineOnlyWithSameCategory ?? false)) {
            group.push(other);
            used.add(other.room.id);
          }
        }

        if (group.length >= 2) {
          compatibleGroups.push(group);
        }
      }

      // Generate alerts for each compatible group
      for (const group of compatibleGroups) {
        const totalAttendance = group.reduce((s, r) => s + r.attendance, 0);
        const totalCapacity = group.reduce((s, r) => s + r.capacity, 0);
        const staffBefore = group.reduce((s, r) => s + r.staffNeeded, 0);
        
        // Combined staff need: use the tightest ratio from the group
        const tightestRatio = Math.min(...group.map(r => r.room.requiredRatio));
        const staffAfter = calculateStaffRequired(totalAttendance, tightestRatio);
        const staffSaved = staffBefore - staffAfter;

        if (staffSaved <= 0) continue;

        // Pick the largest room as the target
        const targetRoom = group.reduce((best, curr) => 
          curr.capacity > best.capacity ? curr : best
        );

        const avgUtilisation = group.reduce((s, r) => s + r.utilisation, 0) / group.length;

        alerts.push({
          id: `combine-${date}-${block.id}-${group.map(r => r.room.id).join('-')}`,
          date,
          centreId,
          timeBlock: block,
          severity: determineSeverity(avgUtilisation),
          status: 'pending',
          sourceRooms: group.map(r => ({
            roomId: r.room.id,
            roomName: r.room.name,
            ageGroup: r.room.ageGroup,
            currentAttendance: r.attendance,
            capacity: r.capacity,
            utilisationPercent: Math.round(r.utilisation),
            currentStaffNeeded: r.staffNeeded,
          })),
          targetRoom: {
            roomId: targetRoom.room.id,
            roomName: targetRoom.room.name,
          },
          totalAttendanceCombined: totalAttendance,
          totalCapacityCombined: totalCapacity,
          staffBefore,
          staffAfter,
          staffSaved,
          triggerType: threshold.triggerType,
          triggerThreshold: threshold.triggerValue,
          triggerActual: Math.round(avgUtilisation),
          message: buildAlertMessage(group, block, staffSaved, threshold),
          promptMessage: threshold.promptMessage,
        });
      }
    }
  }

  // Deduplicate (same rooms in same block)
  const seen = new Set<string>();
  return alerts.filter(a => {
    const key = `${a.timeBlock.id}-${a.sourceRooms.map(r => r.roomId).sort().join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAlertMessage(
  rooms: { room: Room; attendance: number; capacity: number }[],
  block: TimeBlock,
  staffSaved: number,
  threshold: AreaCombiningThreshold
): string {
  const roomNames = rooms.map(r => r.room.name).join(' & ');
  const totalKids = rooms.reduce((s, r) => s + r.attendance, 0);
  
  if (threshold.promptMessage) return threshold.promptMessage;
  
  return `${roomNames} have low attendance (${totalKids} total) during ${block.label}. ` +
    `Combining could save ${staffSaved} staff member${staffSaved > 1 ? 's' : ''}.`;
}

// Generate default thresholds for childcare
export function getDefaultCombiningThresholds(): AreaCombiningThreshold[] {
  return [
    {
      id: 'default-attendance-pct',
      name: 'Low Attendance',
      description: 'When room attendance drops below 50% of capacity',
      triggerType: 'attendance_percentage',
      triggerValue: 50,
      combineOnlyWithSameCategory: true,
      isActive: true,
      promptMessage: undefined,
    },
    {
      id: 'default-absolute',
      name: 'Very Low Numbers',
      description: 'When fewer than 4 children are in a room',
      triggerType: 'absolute_count',
      triggerValue: 4,
      combineOnlyWithSameCategory: false,
      isActive: true,
      promptMessage: undefined,
    },
  ];
}

// Industry-specific default optimization configurations
export function getIndustryOptimizationDefaults(industryType: string): {
  thresholds: AreaCombiningThreshold[];
  optimizationWindows: { label: string; startTime: string; endTime: string; isActive: boolean }[];
  context: string;
} {
  switch (industryType) {
    case 'childcare':
      return {
        thresholds: [
          {
            id: 'cc-low-attendance',
            name: 'Low Room Attendance',
            description: 'Combine rooms when attendance drops below 50% — common in early morning and late afternoon',
            triggerType: 'attendance_percentage',
            triggerValue: 50,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Consider combining rooms to maintain ratios and reduce staff costs.',
          },
          {
            id: 'cc-very-low',
            name: 'Very Low Numbers',
            description: 'Urgent: fewer than 4 children in a room',
            triggerType: 'absolute_count',
            triggerValue: 4,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Room has very few children — combine immediately to save staffing costs.',
          },
          {
            id: 'cc-staff-inefficiency',
            name: 'Staff Ratio Inefficiency',
            description: 'When staff utilization is below 40% of capacity',
            triggerType: 'staff_ratio',
            triggerValue: 40,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Staff underutilized — consider combining rooms or releasing staff.',
          },
        ],
        optimizationWindows: [
          { label: 'Early Drop-off', startTime: '06:00', endTime: '08:30', isActive: true },
          { label: 'Late Pick-up', startTime: '15:30', endTime: '18:30', isActive: true },
          { label: 'After Lunch Rest', startTime: '12:30', endTime: '14:00', isActive: false },
        ],
        context: 'Childcare centres experience low attendance during early morning drop-off and late afternoon pick-up. Combining rooms during these windows maintains NQF ratio compliance while reducing educator requirements.',
      };

    case 'healthcare':
      return {
        thresholds: [
          {
            id: 'hc-low-census',
            name: 'Low Census Ward',
            description: 'Consolidate wards when patient count drops below 40% bed occupancy',
            triggerType: 'attendance_percentage',
            triggerValue: 40,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Ward census is low — consider consolidating patients to free up nursing staff.',
          },
          {
            id: 'hc-critical-low',
            name: 'Critical Low Census',
            description: 'Ward has fewer than 3 patients',
            triggerType: 'absolute_count',
            triggerValue: 3,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Critical low census — consolidate ward immediately and float nurses to high-acuity areas.',
          },
          {
            id: 'hc-nurse-ratio',
            name: 'Nurse Float Trigger',
            description: 'When nurse-to-patient ratio efficiency drops below 50%',
            triggerType: 'staff_ratio',
            triggerValue: 50,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Nursing staff underutilized — float excess nurses to short-staffed wards.',
          },
        ],
        optimizationWindows: [
          { label: 'Night Shift (Low Census)', startTime: '22:00', endTime: '06:00', isActive: true },
          { label: 'Weekend Reduced', startTime: '06:00', endTime: '18:00', isActive: true },
          { label: 'Post-Discharge Window', startTime: '10:00', endTime: '14:00', isActive: false },
        ],
        context: 'Hospitals experience census fluctuations overnight and on weekends. Ward consolidation during low-census periods allows nurse floating to high-acuity areas while maintaining AHPRA staffing standards.',
      };

    case 'retail':
      return {
        thresholds: [
          {
            id: 'rt-low-traffic',
            name: 'Low Foot Traffic',
            description: 'Merge zones when customer count drops below 30% of peak capacity',
            triggerType: 'attendance_percentage',
            triggerValue: 30,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Low customer traffic — consider merging zones and reassigning floor staff.',
          },
          {
            id: 'rt-register-consolidation',
            name: 'Register Consolidation',
            description: 'Close registers when fewer than 5 customers in checkout queue zone',
            triggerType: 'absolute_count',
            triggerValue: 5,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Low checkout traffic — consolidate registers and move staff to restocking.',
          },
        ],
        optimizationWindows: [
          { label: 'Morning Opening', startTime: '09:00', endTime: '11:00', isActive: true },
          { label: 'Mid-Afternoon Lull', startTime: '14:00', endTime: '16:00', isActive: true },
          { label: 'Evening Wind-down', startTime: '19:00', endTime: '21:00', isActive: true },
        ],
        context: 'Retail stores see traffic patterns with distinct peaks (lunch, after work) and lulls. Zone merging during quiet periods lets you reassign floor staff to restocking, online order fulfillment, or customer service.',
      };

    case 'hospitality':
      return {
        thresholds: [
          {
            id: 'hs-section-low',
            name: 'Low Section Covers',
            description: 'Combine sections when seated covers drop below 40% of section capacity',
            triggerType: 'attendance_percentage',
            triggerValue: 40,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Section has low covers — combine with adjacent section to reduce floor staff.',
          },
          {
            id: 'hs-very-low-covers',
            name: 'Very Low Covers',
            description: 'Fewer than 6 covers in a section',
            triggerType: 'absolute_count',
            triggerValue: 6,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Very few seated covers — merge sections immediately.',
          },
        ],
        optimizationWindows: [
          { label: 'Between Lunch & Dinner', startTime: '14:30', endTime: '17:30', isActive: true },
          { label: 'Late Evening', startTime: '21:00', endTime: '23:00', isActive: true },
          { label: 'Early Opening', startTime: '06:00', endTime: '08:00', isActive: false },
        ],
        context: 'Restaurants and hotels experience distinct service peaks. Between lunch and dinner service, sections can be combined to reduce floor staff. Kitchen stations can also be consolidated during quiet periods.',
      };

    case 'call_center':
      return {
        thresholds: [
          {
            id: 'cc-queue-low',
            name: 'Low Queue Volume',
            description: 'Merge skill queues when call volume drops below 30% of agent capacity',
            triggerType: 'attendance_percentage',
            triggerValue: 30,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Queue volume is low — consider merging skill groups or releasing agents.',
          },
          {
            id: 'cc-idle-agents',
            name: 'Idle Agent Threshold',
            description: 'When agent utilization drops below 40%',
            triggerType: 'staff_ratio',
            triggerValue: 40,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Agents underutilized — merge queues or schedule training/breaks.',
          },
        ],
        optimizationWindows: [
          { label: 'Early Morning', startTime: '06:00', endTime: '09:00', isActive: true },
          { label: 'Late Night', startTime: '21:00', endTime: '06:00', isActive: true },
          { label: 'Weekend Off-Peak', startTime: '12:00', endTime: '18:00', isActive: false },
        ],
        context: 'Call centres experience volume fluctuations throughout the day. During low-volume periods, skill queues can be merged so fewer agents handle multiple skill groups, with excess agents released or assigned to training.',
      };

    case 'manufacturing':
      return {
        thresholds: [
          {
            id: 'mf-line-low',
            name: 'Low Line Output',
            description: 'Consolidate lines when production output drops below 50% capacity',
            triggerType: 'attendance_percentage',
            triggerValue: 50,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Production line underperforming — consider consolidating to fewer lines.',
          },
          {
            id: 'mf-staff-excess',
            name: 'Excess Line Staff',
            description: 'When line staffing exceeds 150% of required for current output',
            triggerType: 'staff_ratio',
            triggerValue: 60,
            combineOnlyWithSameCategory: true,
            isActive: true,
            promptMessage: 'Line is overstaffed for current output — redistribute workers or consolidate.',
          },
        ],
        optimizationWindows: [
          { label: 'Shift Changeover', startTime: '06:00', endTime: '07:00', isActive: true },
          { label: 'Maintenance Window', startTime: '14:00', endTime: '15:00', isActive: false },
          { label: 'Night Reduced', startTime: '22:00', endTime: '06:00', isActive: true },
        ],
        context: 'Manufacturing facilities can consolidate production lines during low-demand periods or maintenance windows, redistributing operators to active lines or cross-training tasks.',
      };

    case 'events':
      return {
        thresholds: [
          {
            id: 'ev-area-low',
            name: 'Low Area Attendance',
            description: 'Merge service areas when guest count drops below 35% of area capacity',
            triggerType: 'attendance_percentage',
            triggerValue: 35,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Guest area is under-attended — merge with adjacent area to reduce staff.',
          },
          {
            id: 'ev-staff-ratio',
            name: 'Staff Over-allocation',
            description: 'When staff-to-guest ratio is underutilized below 40%',
            triggerType: 'staff_ratio',
            triggerValue: 40,
            combineOnlyWithSameCategory: false,
            isActive: true,
            promptMessage: 'Staff over-allocated for current guest count — release or reassign.',
          },
        ],
        optimizationWindows: [
          { label: 'Pre-Event Setup', startTime: '06:00', endTime: '10:00', isActive: false },
          { label: 'Between Sessions', startTime: '12:00', endTime: '13:00', isActive: true },
          { label: 'Post-Event Wind-down', startTime: '22:00', endTime: '02:00', isActive: true },
        ],
        context: 'Events have distinct phases (setup, peak, wind-down). During gaps between sessions or post-event, service areas can be merged to reduce active staff while maintaining guest experience quality.',
      };

    default:
      return {
        thresholds: getDefaultCombiningThresholds(),
        optimizationWindows: [
          { label: 'Morning', startTime: '06:00', endTime: '09:00', isActive: true },
          { label: 'Afternoon', startTime: '15:00', endTime: '18:00', isActive: true },
        ],
        context: 'Configure area combining thresholds based on your operational patterns.',
      };
  }
}
