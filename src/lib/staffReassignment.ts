/**
 * Staff Reassignment Engine
 * When rooms are combined, determines which staff to move, release, or keep
 * based on qualifications, skills, and the auto-scheduler scoring engine.
 */

import { StaffMember, Shift, Room } from '@/types/roster';
import { CombineAlert, CombiningPlan } from '@/lib/areaCombiningEngine';
import { getStaffSkillLevels } from '@/lib/skillMatcher';

export type ReassignmentAction = 'keep' | 'move' | 'release';

export interface StaffReassignment {
  staffId: string;
  staffName: string;
  staffRole: string;
  currentRoomId: string;
  currentRoomName: string;
  action: ReassignmentAction;
  targetRoomId?: string;
  targetRoomName?: string;
  score: number; // 0-100 fitness score for the combined room
  reasons: string[];
  qualifications: string[];
  isQualified: boolean; // meets minimum qualification for target room
}

export interface ReassignmentPlan {
  planId: string;
  timeBlockLabel: string;
  targetRoomId: string;
  targetRoomName: string;
  staffNeededInTarget: number;
  reassignments: StaffReassignment[];
  totalStaffBefore: number;
  totalStaffAfter: number;
  staffReleased: number;
}

interface ScoreFactors {
  qualificationScore: number;
  skillScore: number;
  roleScore: number;
  costScore: number;
}

function scoreStaffForRoom(
  staff: StaffMember,
  targetRoom: Room,
): { total: number; factors: ScoreFactors; reasons: string[] } {
  const reasons: string[] = [];
  const skillLevels = getStaffSkillLevels(staff);

  // 1. Qualification score (40% weight)
  const qualTypes = staff.qualifications?.map(q => q.type) || [];
  const hasChildDev = qualTypes.some(q =>
    ['diploma_ece', 'bachelor_ece', 'masters_ece', 'certificate_iii'].includes(q)
  );
  const hasFirstAid = qualTypes.some(q => q === 'first_aid');
  const hasWWC = qualTypes.some(q => q === 'working_with_children');

  let qualificationScore = 30;
  if (hasChildDev) { qualificationScore += 30; reasons.push('Has child development qualification'); }
  if (hasFirstAid) { qualificationScore += 20; reasons.push('First aid certified'); }
  if (hasWWC) { qualificationScore += 20; reasons.push('WWC checked'); }
  qualificationScore = Math.min(100, qualificationScore);

  // 2. Skill match score (25% weight)
  const relevantSkills = ['Child Development', 'Behaviour Management', 'Leadership', 'First Aid'];
  const skillScores = relevantSkills.map(s => (skillLevels[s] || 0) * 20);
  const skillScore = Math.min(100, skillScores.reduce((a, b) => a + b, 0) / relevantSkills.length);

  // 3. Role suitability (20% weight)
  let roleScore = 50;
  if (staff.role === 'lead_educator') { roleScore = 100; reasons.push('Lead educator — ideal for combined room'); }
  else if (staff.role === 'educator') { roleScore = 80; reasons.push('Qualified educator'); }
  else if (staff.role === 'assistant') { roleScore = 60; }
  else if (staff.role === 'casual') { roleScore = 40; reasons.push('Casual — candidate for release'); }

  // 4. Cost efficiency (15% weight) — lower cost = higher score for keeping
  const maxRate = 60;
  const costScore = Math.max(0, Math.min(100, ((maxRate - (staff.hourlyRate || 30)) / maxRate) * 100));

  const total = Math.round(
    qualificationScore * 0.4 +
    skillScore * 0.25 +
    roleScore * 0.2 +
    costScore * 0.15
  );

  return { total, factors: { qualificationScore, skillScore, roleScore, costScore }, reasons };
}

export function generateReassignmentPlan(
  alert: CombineAlert,
  plan: CombiningPlan,
  shifts: Shift[],
  staff: StaffMember[],
  rooms: Room[],
): ReassignmentPlan {
  const targetRoom = rooms.find(r => r.id === plan.targetRoomId);
  const targetRoomName = targetRoom?.name || plan.targetRoomId;

  // Find staff currently assigned to source rooms during this time block
  const blockStart = alert.timeBlock.startTime;
  const blockEnd = alert.timeBlock.endTime;

  const relevantShifts = shifts.filter(s =>
    s.date === alert.date &&
    plan.sourceRoomIds.includes(s.roomId) &&
    s.staffId &&
    shiftsOverlapBlock(s.startTime, s.endTime, blockStart, blockEnd)
  );

  // Unique staff in source rooms
  const staffInRooms = new Map<string, { staffMember: StaffMember; roomId: string; shift: Shift }>();
  for (const shift of relevantShifts) {
    const member = staff.find(s => s.id === shift.staffId);
    if (member && !staffInRooms.has(member.id)) {
      staffInRooms.set(member.id, { staffMember: member, roomId: shift.roomId, shift });
    }
  }

  // Score each staff member for the target room
  const scored: StaffReassignment[] = [];
  for (const [, { staffMember, roomId }] of staffInRooms) {
    const currentRoom = rooms.find(r => r.id === roomId);
    const { total, reasons } = scoreStaffForRoom(staffMember, targetRoom!);

    scored.push({
      staffId: staffMember.id,
      staffName: staffMember.name,
      staffRole: staffMember.role,
      currentRoomId: roomId,
      currentRoomName: currentRoom?.name || roomId,
      action: 'keep', // will be determined below
      score: total,
      reasons,
      qualifications: staffMember.qualifications?.map(q => q.name || q.type) || [],
      isQualified: total >= 50,
    });
  }

  // Sort by score descending — best staff kept first
  scored.sort((a, b) => b.score - a.score);

  // Determine how many staff needed in combined room
  const staffNeeded = alert.staffAfter;

  // Assign actions
  scored.forEach((s, idx) => {
    if (idx < staffNeeded) {
      if (s.currentRoomId === plan.targetRoomId) {
        s.action = 'keep';
        s.targetRoomId = plan.targetRoomId;
        s.targetRoomName = targetRoomName;
      } else {
        s.action = 'move';
        s.targetRoomId = plan.targetRoomId;
        s.targetRoomName = targetRoomName;
      }
    } else {
      s.action = 'release';
      s.reasons.push('Can be released or redeployed to another area');
    }
  });

  return {
    planId: plan.id,
    timeBlockLabel: alert.timeBlock.label,
    targetRoomId: plan.targetRoomId,
    targetRoomName,
    staffNeededInTarget: staffNeeded,
    reassignments: scored,
    totalStaffBefore: scored.length,
    totalStaffAfter: staffNeeded,
    staffReleased: Math.max(0, scored.length - staffNeeded),
  };
}

function shiftsOverlapBlock(shiftStart: string, shiftEnd: string, blockStart: string, blockEnd: string): boolean {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(shiftStart) < toMin(blockEnd) && toMin(blockStart) < toMin(shiftEnd);
}
