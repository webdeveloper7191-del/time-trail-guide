/**
 * Ratio Compliance Enforcement Engine
 * Enforces educator-to-child ratios as per Australian regulations
 * Blocks actions that would violate compliance requirements
 */

import { Shift, Room, StaffMember, Centre, Qualification, QualificationType } from '@/types/roster';
import { format, parseISO, isSameDay, isWithinInterval } from 'date-fns';

// Age group ratio requirements (National Quality Framework)
export interface RatioRequirement {
  ageGroup: string;
  minAge: number;
  maxAge: number;
  ratio: number; // children per educator
  requiresQualifiedEducator: boolean;
  qualificationRequired?: QualificationType;
}

export const nqfRatioRequirements: RatioRequirement[] = [
  { ageGroup: 'babies', minAge: 0, maxAge: 2, ratio: 4, requiresQualifiedEducator: true, qualificationRequired: 'diploma_ece' },
  { ageGroup: 'toddlers', minAge: 2, maxAge: 3, ratio: 5, requiresQualifiedEducator: true, qualificationRequired: 'certificate_iii' },
  { ageGroup: 'preschool', minAge: 3, maxAge: 4, ratio: 10, requiresQualifiedEducator: true, qualificationRequired: 'certificate_iii' },
  { ageGroup: 'kindy', minAge: 4, maxAge: 5, ratio: 11, requiresQualifiedEducator: true, qualificationRequired: 'certificate_iii' },
];

export interface RatioStatus {
  roomId: string;
  roomName: string;
  date: string;
  timeSlot: string;
  
  // Counts
  bookedChildren: number;
  projectedChildren: number;
  scheduledEducators: number;
  qualifiedEducators: number;
  
  // Requirements
  requiredEducators: number;
  requiredQualifiedEducators: number;
  ratio: number;
  
  // Compliance
  isCompliant: boolean;
  isQualificationCompliant: boolean;
  educatorShortfall: number;
  qualificationShortfall: number;
  
  // Staff details
  assignedStaff: {
    id: string;
    name: string;
    isQualified: boolean;
    qualifications: QualificationType[];
    shiftTime: string;
  }[];
  
  // Warnings
  warnings: string[];
  blockingIssues: string[];
}

export interface ComplianceCheckResult {
  canProceed: boolean;
  ratioStatus: RatioStatus;
  message: string;
  severity: 'ok' | 'warning' | 'blocking';
  suggestedActions?: string[];
}

// Check if staff member has required qualification
export function hasRequiredQualification(
  staff: StaffMember, 
  requiredQual?: QualificationType
): boolean {
  if (!requiredQual) return true;
  
  return staff.qualifications.some(q => 
    q.type === requiredQual && !q.isExpired
  );
}

// Get qualified educators count for a room
export function getQualifiedEducatorsCount(
  staff: StaffMember[],
  room: Room
): number {
  const ratioReq = nqfRatioRequirements.find(r => r.ageGroup === room.ageGroup);
  if (!ratioReq || !ratioReq.qualificationRequired) return staff.length;
  
  return staff.filter(s => hasRequiredQualification(s, ratioReq.qualificationRequired)).length;
}

// Calculate required educators for a given child count and room
export function calculateRequiredEducators(
  childCount: number,
  room: Room
): { totalRequired: number; qualifiedRequired: number } {
  const ratio = room.requiredRatio;
  const totalRequired = Math.ceil(childCount / ratio);
  
  // At least 50% must be qualified (simplified rule)
  const qualifiedRequired = Math.ceil(totalRequired * 0.5);
  
  return { totalRequired, qualifiedRequired };
}

// Check ratio compliance for a room at a specific time
export function checkRoomCompliance(
  room: Room,
  shifts: Shift[],
  staff: StaffMember[],
  date: string,
  bookedChildren: number,
  timeSlot: string = '09:00-15:00' // Core hours
): RatioStatus {
  const warnings: string[] = [];
  const blockingIssues: string[] = [];
  
  // Get shifts for this room and date
  const roomShifts = shifts.filter(s => 
    s.roomId === room.id && 
    s.date === date
  );
  
  // Get assigned staff
  const assignedStaffIds = [...new Set(roomShifts.map(s => s.staffId))];
  const assignedStaff = assignedStaffIds
    .map(id => staff.find(s => s.id === id))
    .filter((s): s is StaffMember => s !== undefined);
  
  const scheduledEducators = assignedStaff.length;
  const qualifiedEducators = getQualifiedEducatorsCount(assignedStaff, room);
  
  // Calculate requirements
  const { totalRequired, qualifiedRequired } = calculateRequiredEducators(bookedChildren, room);
  
  // Check compliance
  const educatorShortfall = Math.max(0, totalRequired - scheduledEducators);
  const qualificationShortfall = Math.max(0, qualifiedRequired - qualifiedEducators);
  
  const isCompliant = educatorShortfall === 0;
  const isQualificationCompliant = qualificationShortfall === 0;
  
  // Generate warnings and blocking issues
  if (!isCompliant) {
    blockingIssues.push(
      `Ratio breach: ${scheduledEducators}/${totalRequired} educators for ${bookedChildren} children (1:${room.requiredRatio} required)`
    );
  }
  
  if (!isQualificationCompliant) {
    warnings.push(
      `Qualification gap: ${qualifiedEducators}/${qualifiedRequired} qualified educators required`
    );
  }
  
  if (bookedChildren > room.capacity) {
    blockingIssues.push(
      `Room capacity exceeded: ${bookedChildren}/${room.capacity} children`
    );
  }
  
  // Staff details with shift times
  const staffDetails = assignedStaff.map(s => {
    const shift = roomShifts.find(sh => sh.staffId === s.id);
    return {
      id: s.id,
      name: s.name,
      isQualified: hasRequiredQualification(s, nqfRatioRequirements.find(r => r.ageGroup === room.ageGroup)?.qualificationRequired),
      qualifications: s.qualifications.filter(q => !q.isExpired).map(q => q.type),
      shiftTime: shift ? `${shift.startTime}-${shift.endTime}` : 'Unknown',
    };
  });
  
  return {
    roomId: room.id,
    roomName: room.name,
    date,
    timeSlot,
    bookedChildren,
    projectedChildren: bookedChildren,
    scheduledEducators,
    qualifiedEducators,
    requiredEducators: totalRequired,
    requiredQualifiedEducators: qualifiedRequired,
    ratio: room.requiredRatio,
    isCompliant,
    isQualificationCompliant,
    educatorShortfall,
    qualificationShortfall,
    assignedStaff: staffDetails,
    warnings,
    blockingIssues,
  };
}

// Validate if a shift can be created/modified
export function validateShiftAction(
  action: 'create' | 'delete' | 'modify',
  shift: Shift,
  allShifts: Shift[],
  staff: StaffMember[],
  room: Room,
  bookedChildren: number,
  options: {
    enforceBlocking?: boolean;
    allowOverride?: boolean;
  } = {}
): ComplianceCheckResult {
  const { enforceBlocking = true, allowOverride = false } = options;
  
  // Simulate the shift action
  let simulatedShifts: Shift[];
  
  if (action === 'create') {
    simulatedShifts = [...allShifts, shift];
  } else if (action === 'delete') {
    simulatedShifts = allShifts.filter(s => s.id !== shift.id);
  } else {
    simulatedShifts = allShifts.map(s => s.id === shift.id ? shift : s);
  }
  
  // Check compliance after simulated action
  const staffMember = staff.find(s => s.id === shift.staffId);
  const ratioStatus = checkRoomCompliance(room, simulatedShifts, staff, shift.date, bookedChildren);
  
  // Determine result
  if (ratioStatus.isCompliant && ratioStatus.isQualificationCompliant) {
    return {
      canProceed: true,
      ratioStatus,
      message: 'Action complies with ratio requirements',
      severity: 'ok',
    };
  }
  
  if (ratioStatus.blockingIssues.length > 0) {
    const canProceed = allowOverride || !enforceBlocking;
    return {
      canProceed,
      ratioStatus,
      message: ratioStatus.blockingIssues.join('; '),
      severity: 'blocking',
      suggestedActions: [
        `Add ${ratioStatus.educatorShortfall} more educator(s)`,
        'Reduce booked children for this time slot',
        'Consider splitting the group between rooms',
      ],
    };
  }
  
  // Warnings only
  return {
    canProceed: true,
    ratioStatus,
    message: ratioStatus.warnings.join('; '),
    severity: 'warning',
    suggestedActions: [
      `Add ${ratioStatus.qualificationShortfall} more qualified educator(s)`,
    ],
  };
}

// Check if staff removal would cause ratio breach
export function canRemoveStaffFromShift(
  shift: Shift,
  allShifts: Shift[],
  staff: StaffMember[],
  room: Room,
  bookedChildren: number
): ComplianceCheckResult {
  return validateShiftAction('delete', shift, allShifts, staff, room, bookedChildren);
}

// Get compliance summary for entire centre on a date
export function getCentreComplianceSummary(
  centre: Centre,
  shifts: Shift[],
  staff: StaffMember[],
  date: string,
  demandByRoom: Map<string, number>
): {
  overallCompliant: boolean;
  roomStatuses: RatioStatus[];
  totalEducatorsNeeded: number;
  totalEducatorsScheduled: number;
  criticalIssues: string[];
  warnings: string[];
} {
  const roomStatuses = centre.rooms.map(room => {
    const bookedChildren = demandByRoom.get(room.id) || 0;
    return checkRoomCompliance(room, shifts, staff, date, bookedChildren);
  });
  
  const overallCompliant = roomStatuses.every(r => r.isCompliant);
  const totalEducatorsNeeded = roomStatuses.reduce((sum, r) => sum + r.requiredEducators, 0);
  const totalEducatorsScheduled = roomStatuses.reduce((sum, r) => sum + r.scheduledEducators, 0);
  
  const criticalIssues = roomStatuses.flatMap(r => r.blockingIssues);
  const warnings = roomStatuses.flatMap(r => r.warnings);
  
  return {
    overallCompliant,
    roomStatuses,
    totalEducatorsNeeded,
    totalEducatorsScheduled,
    criticalIssues,
    warnings,
  };
}

// Suggest optimal staffing for a room
export function suggestOptimalStaffing(
  room: Room,
  bookedChildren: number,
  availableStaff: StaffMember[]
): {
  recommended: StaffMember[];
  minimumRequired: number;
  qualifiedRequired: number;
  message: string;
} {
  const { totalRequired, qualifiedRequired } = calculateRequiredEducators(bookedChildren, room);
  
  const ratioReq = nqfRatioRequirements.find(r => r.ageGroup === room.ageGroup);
  const requiredQual = ratioReq?.qualificationRequired;
  
  // Sort staff: qualified first, then by rate (lower cost)
  const sortedStaff = [...availableStaff].sort((a, b) => {
    const aQual = hasRequiredQualification(a, requiredQual);
    const bQual = hasRequiredQualification(b, requiredQual);
    
    if (aQual && !bQual) return -1;
    if (!aQual && bQual) return 1;
    
    return a.hourlyRate - b.hourlyRate;
  });
  
  // Select optimal staff
  const recommended: StaffMember[] = [];
  let qualifiedCount = 0;
  
  for (const s of sortedStaff) {
    if (recommended.length >= totalRequired) break;
    
    recommended.push(s);
    if (hasRequiredQualification(s, requiredQual)) {
      qualifiedCount++;
    }
  }
  
  // Check if we have enough qualified
  if (qualifiedCount < qualifiedRequired) {
    // Try to swap unqualified for qualified
    const unqualifiedInRecommended = recommended.filter(s => !hasRequiredQualification(s, requiredQual));
    const qualifiedNotInRecommended = sortedStaff.filter(s => 
      hasRequiredQualification(s, requiredQual) && !recommended.includes(s)
    );
    
    for (let i = 0; i < Math.min(unqualifiedInRecommended.length, qualifiedNotInRecommended.length); i++) {
      if (qualifiedCount >= qualifiedRequired) break;
      
      const toRemove = unqualifiedInRecommended[i];
      const toAdd = qualifiedNotInRecommended[i];
      
      const idx = recommended.indexOf(toRemove);
      if (idx >= 0) {
        recommended[idx] = toAdd;
        qualifiedCount++;
      }
    }
  }
  
  const stillNeedQualified = Math.max(0, qualifiedRequired - qualifiedCount);
  
  let message = `${totalRequired} educator(s) needed for ${bookedChildren} children (1:${room.requiredRatio})`;
  if (stillNeedQualified > 0) {
    message += `. Warning: ${stillNeedQualified} more qualified staff needed.`;
  }
  
  return {
    recommended,
    minimumRequired: totalRequired,
    qualifiedRequired,
    message,
  };
}
