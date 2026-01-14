import { StaffMember, Shift, QualificationType, Qualification } from '@/types/roster';
import { SkillWeight } from '@/types/advancedRoster';

export interface SkillMatchResult {
  staffId: string;
  staffName: string;
  matchScore: number;
  meetsMandatory: boolean;
  skillBreakdown: {
    skillName: string;
    staffLevel: number;
    requiredLevel: number;
    weight: number;
    contribution: number;
  }[];
}

export interface ShiftSkillRequirement {
  shiftId: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredQualifications: QualificationType[];
  preferredSkills: {
    skillName: string;
    minimumLevel: number;
    weight: number;
    isMandatory: boolean;
  }[];
}

// Map qualifications to skill scores
const qualificationSkillMap: Record<QualificationType, { skillName: string; level: number }[]> = {
  diploma_ece: [
    { skillName: 'Child Development', level: 4 },
    { skillName: 'Curriculum Planning', level: 4 },
  ],
  certificate_iii: [
    { skillName: 'Child Development', level: 3 },
    { skillName: 'Behaviour Management', level: 3 },
  ],
  first_aid: [
    { skillName: 'First Aid', level: 5 },
  ],
  food_safety: [
    { skillName: 'Food Safety', level: 5 },
  ],
  working_with_children: [
    { skillName: 'Child Safety', level: 5 },
  ],
  bachelor_ece: [
    { skillName: 'Child Development', level: 5 },
    { skillName: 'Curriculum Planning', level: 5 },
    { skillName: 'Special Needs Support', level: 4 },
  ],
  masters_ece: [
    { skillName: 'Child Development', level: 5 },
    { skillName: 'Curriculum Planning', level: 5 },
    { skillName: 'Special Needs Support', level: 5 },
    { skillName: 'Research', level: 5 },
  ],
};

export function getStaffSkillLevels(staff: StaffMember): Record<string, number> {
  const skillLevels: Record<string, number> = {};
  
  // Base skills from qualifications
  staff.qualifications?.forEach((qual: Qualification) => {
    const qualType = qual.type;
    const skills = qualificationSkillMap[qualType] || [];
    skills.forEach(skill => {
      skillLevels[skill.skillName] = Math.max(skillLevels[skill.skillName] || 0, skill.level);
    });
  });
  
  // Add base competencies based on role/experience
  if (staff.role === 'lead_educator') {
    skillLevels['Leadership'] = 5;
    skillLevels['Parent Communication'] = 4;
  }
  if (staff.role === 'educator') {
    skillLevels['Parent Communication'] = 3;
    skillLevels['Behaviour Management'] = Math.max(skillLevels['Behaviour Management'] || 0, 3);
  }
  
  // Add first aid if not already present
  if (!skillLevels['First Aid']) {
    skillLevels['First Aid'] = 2; // Basic level
  }
  
  return skillLevels;
}

export function calculateMatchScore(
  staff: StaffMember,
  requirements: ShiftSkillRequirement,
  skillWeights: SkillWeight[]
): SkillMatchResult {
  const staffSkills = getStaffSkillLevels(staff);
  const skillBreakdown: SkillMatchResult['skillBreakdown'] = [];
  let totalWeight = 0;
  let totalScore = 0;
  let meetsMandatory = true;
  
  // Check required qualifications
  const staffQualTypes = staff.qualifications?.map(q => q.type) || [];
  const hasRequiredQuals = requirements.requiredQualifications.every(
    qual => staffQualTypes.includes(qual)
  );
  if (!hasRequiredQuals) {
    meetsMandatory = false;
  }
  
  // Calculate skill-based score
  requirements.preferredSkills.forEach(req => {
    const staffLevel = staffSkills[req.skillName] || 0;
    const weight = skillWeights.find(sw => sw.skillName === req.skillName)?.weight || req.weight;
    
    // Check mandatory requirements
    if (req.isMandatory && staffLevel < req.minimumLevel) {
      meetsMandatory = false;
    }
    
    // Calculate contribution (0-100 based on how well staff meets/exceeds requirement)
    let contribution = 0;
    if (staffLevel >= req.minimumLevel) {
      // Full credit for meeting minimum, bonus for exceeding
      contribution = Math.min(100, 70 + (staffLevel - req.minimumLevel) * 10);
    } else if (staffLevel > 0) {
      // Partial credit for having some skill
      contribution = (staffLevel / req.minimumLevel) * 50;
    }
    
    totalWeight += weight;
    totalScore += contribution * (weight / 100);
    
    skillBreakdown.push({
      skillName: req.skillName,
      staffLevel,
      requiredLevel: req.minimumLevel,
      weight,
      contribution: Math.round(contribution),
    });
  });
  
  // Normalize score
  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 50;
  
  // Apply penalty if mandatory requirements not met
  const finalScore = meetsMandatory ? normalizedScore : Math.min(normalizedScore, 40);
  
  return {
    staffId: staff.id,
    staffName: staff.name,
    matchScore: finalScore,
    meetsMandatory,
    skillBreakdown,
  };
}

export function rankStaffForShift(
  staff: StaffMember[],
  requirement: ShiftSkillRequirement,
  skillWeights: SkillWeight[],
  existingShifts: Shift[]
): SkillMatchResult[] {
  // Filter out staff already assigned to overlapping shifts
  const availableStaff = staff.filter(s => {
    const hasOverlap = existingShifts.some(
      shift => shift.staffId === s.id && 
               shift.date === requirement.date &&
               shiftsOverlap(shift, requirement)
    );
    return !hasOverlap;
  });
  
  // Calculate match scores for all available staff
  const results = availableStaff.map(s => calculateMatchScore(s, requirement, skillWeights));
  
  // Sort by: mandatory met first, then by score
  return results.sort((a, b) => {
    if (a.meetsMandatory !== b.meetsMandatory) {
      return a.meetsMandatory ? -1 : 1;
    }
    return b.matchScore - a.matchScore;
  });
}

function shiftsOverlap(shift: Shift, requirement: ShiftSkillRequirement): boolean {
  const [s1Start, s1End] = [shift.startTime, shift.endTime].map(timeToMinutes);
  const [s2Start, s2End] = [requirement.startTime, requirement.endTime].map(timeToMinutes);
  
  return s1Start < s2End && s2Start < s1End;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function autoMatchAllShifts(
  staff: StaffMember[],
  requirements: ShiftSkillRequirement[],
  skillWeights: SkillWeight[],
  existingShifts: Shift[]
): { shiftId: string; staffId: string; matchScore: number }[] {
  const assignments: { shiftId: string; staffId: string; matchScore: number }[] = [];
  const assignedStaffPerDay: Record<string, Set<string>> = {};
  
  // Process requirements by priority (could be enhanced with urgency scoring)
  requirements.forEach(req => {
    const dayKey = req.date;
    if (!assignedStaffPerDay[dayKey]) {
      assignedStaffPerDay[dayKey] = new Set();
    }
    
    // Get available staff (not already assigned this day for simplicity)
    const availableStaff = staff.filter(s => !assignedStaffPerDay[dayKey].has(s.id));
    
    // Rank staff
    const ranked = rankStaffForShift(availableStaff, req, skillWeights, existingShifts);
    
    // Assign top match if they meet mandatory requirements
    const topMatch = ranked.find(r => r.meetsMandatory && r.matchScore >= 50);
    if (topMatch) {
      assignments.push({
        shiftId: req.shiftId,
        staffId: topMatch.staffId,
        matchScore: topMatch.matchScore,
      });
      assignedStaffPerDay[dayKey].add(topMatch.staffId);
    }
  });
  
  return assignments;
}
