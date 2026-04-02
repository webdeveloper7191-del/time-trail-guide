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
