import { useState, useMemo, useCallback } from 'react';
import {
  Button,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Slider,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  Divider,
} from '@mui/material';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shift, 
  StaffMember, 
  Room, 
  ShiftTemplate, 
  QualificationType,
  qualificationLabels,
  roleLabels,
  EmploymentType,
  TimeOff
} from '@/types/roster';
import { 
  Wand2, 
  ChevronDown, 
  DollarSign, 
  Clock, 
  GraduationCap, 
  Calendar, 
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Users,
  TrendingDown,
  Shield,
  Zap,
  Info,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format, parseISO, getDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface EmptyShift {
  id: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  template?: ShiftTemplate;
  requiredQualifications?: QualificationType[];
  minimumClassification?: string;
  preferredRole?: StaffMember['role'];
}

interface StaffScore {
  staffId: string;
  staffName: string;
  score: number;
  breakdown: {
    availability: number;
    qualifications: number;
    cost: number;
    fairness: number;
    preference: number;
    penalty: number;
  };
  issues: string[];
  isEligible: boolean;
  hourlyRate: number;
  estimatedCost: number;
  employmentType: EmploymentType;
}

interface AssignmentResult {
  shiftId: string;
  staffId: string | null;
  staffName?: string;
  room: string;
  date: string;
  time: string;
  score: number;
  issues: string[];
  alternatives: StaffScore[];
}

interface AutoAssignStaffModalProps {
  open: boolean;
  onClose: () => void;
  emptyShifts: EmptyShift[];
  staff: StaffMember[];
  rooms: Room[];
  existingShifts: Shift[];
  onAssign: (assignments: { shiftId: string; staffId: string }[]) => void;
}

// Optimization weight presets
const OPTIMIZATION_PRESETS = {
  balanced: { cost: 0.25, availability: 0.25, qualifications: 0.2, fairness: 0.2, preference: 0.1 },
  costOptimized: { cost: 0.5, availability: 0.2, qualifications: 0.15, fairness: 0.1, preference: 0.05 },
  qualityFirst: { cost: 0.1, availability: 0.2, qualifications: 0.4, fairness: 0.15, preference: 0.15 },
  fairDistribution: { cost: 0.15, availability: 0.2, qualifications: 0.15, fairness: 0.4, preference: 0.1 },
};

export function AutoAssignStaffModal({
  open,
  onClose,
  emptyShifts,
  staff,
  rooms,
  existingShifts,
  onAssign,
}: AutoAssignStaffModalProps) {
  const [activeTab, setActiveTab] = useState('config');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentResult[]>([]);
  
  // Configuration options
  const [optimizationPreset, setOptimizationPreset] = useState<keyof typeof OPTIMIZATION_PRESETS>('balanced');
  const [weights, setWeights] = useState(OPTIMIZATION_PRESETS.balanced);
  const [includeAgency, setIncludeAgency] = useState(false);
  const [includeCasual, setIncludeCasual] = useState(true);
  const [respectPreferences, setRespectPreferences] = useState(true);
  const [enforceQualifications, setEnforceQualifications] = useState(true);
  const [maxOvertimePercent, setMaxOvertimePercent] = useState(10);
  
  // Calculate staff hours for the current period
  const staffHoursMap = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    existingShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      let mins = (endH * 60 + endM) - (startH * 60 + startM);
      if (mins < 0) mins += 24 * 60;
      mins -= shift.breakMinutes;
      hoursMap[shift.staffId] = (hoursMap[shift.staffId] || 0) + mins / 60;
    });
    return hoursMap;
  }, [existingShifts]);

  // Check if staff is on leave for a given date
  const isStaffOnLeave = useCallback((staffMember: StaffMember, date: string) => {
    if (!staffMember.timeOff) return false;
    const checkDate = parseISO(date);
    return staffMember.timeOff.some(leave => 
      leave.status === 'approved' && 
      isWithinInterval(checkDate, {
        start: parseISO(leave.startDate),
        end: parseISO(leave.endDate),
      })
    );
  }, []);

  // Check staff availability for a specific shift
  const checkStaffAvailability = useCallback((
    staffMember: StaffMember, 
    shiftDate: string, 
    startTime: string, 
    endTime: string
  ): { available: boolean; reason?: string } => {
    // Check leave
    if (isStaffOnLeave(staffMember, shiftDate)) {
      return { available: false, reason: 'On approved leave' };
    }

    // Check day availability
    const dayOfWeek = getDay(parseISO(shiftDate));
    const dayAvail = staffMember.availability.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!dayAvail?.available) {
      return { available: false, reason: 'Not available on this day' };
    }

    // Check time range
    if (dayAvail.startTime && dayAvail.endTime) {
      const [shiftStartH, shiftStartM] = startTime.split(':').map(Number);
      const [shiftEndH, shiftEndM] = endTime.split(':').map(Number);
      const [availStartH, availStartM] = dayAvail.startTime.split(':').map(Number);
      const [availEndH, availEndM] = dayAvail.endTime.split(':').map(Number);

      const shiftStartMins = shiftStartH * 60 + shiftStartM;
      const shiftEndMins = shiftEndH * 60 + shiftEndM;
      const availStartMins = availStartH * 60 + availStartM;
      const availEndMins = availEndH * 60 + availEndM;

      if (shiftStartMins < availStartMins || shiftEndMins > availEndMins) {
        return { available: false, reason: `Only available ${dayAvail.startTime} - ${dayAvail.endTime}` };
      }
    }

    // Check for shift overlap
    const hasOverlap = existingShifts.some(existing => {
      if (existing.staffId !== staffMember.id || existing.date !== shiftDate) return false;
      const [existStartH, existStartM] = existing.startTime.split(':').map(Number);
      const [existEndH, existEndM] = existing.endTime.split(':').map(Number);
      const [newStartH, newStartM] = startTime.split(':').map(Number);
      const [newEndH, newEndM] = endTime.split(':').map(Number);
      
      const existStart = existStartH * 60 + existStartM;
      const existEnd = existEndH * 60 + existEndM;
      const newStart = newStartH * 60 + newStartM;
      const newEnd = newEndH * 60 + newEndM;
      
      return !(newEnd <= existStart || newStart >= existEnd);
    });

    if (hasOverlap) {
      return { available: false, reason: 'Has overlapping shift' };
    }

    return { available: true };
  }, [existingShifts, isStaffOnLeave]);

  // Check qualifications
  const checkQualifications = useCallback((
    staffMember: StaffMember,
    requiredQualifications?: QualificationType[],
    minimumClassification?: string,
    preferredRole?: StaffMember['role']
  ): { qualified: boolean; score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    // Check required qualifications
    if (requiredQualifications && requiredQualifications.length > 0) {
      const staffQualTypes = staffMember.qualifications.map(q => q.type);
      const missingQuals = requiredQualifications.filter(q => !staffQualTypes.includes(q));
      
      if (missingQuals.length > 0) {
        if (enforceQualifications) {
          return { 
            qualified: false, 
            score: 0, 
            issues: [`Missing: ${missingQuals.map(q => qualificationLabels[q]).join(', ')}`] 
          };
        }
        score -= missingQuals.length * 20;
        issues.push(`Missing ${missingQuals.length} qualification(s)`);
      }

      // Check for expired qualifications
      const expiredQuals = staffMember.qualifications.filter(q => q.isExpired);
      if (expiredQuals.length > 0) {
        score -= 30;
        issues.push('Has expired qualifications');
      }
    }

    // Check role match
    if (preferredRole && staffMember.role !== preferredRole) {
      score -= 15;
      issues.push(`Role mismatch: ${roleLabels[staffMember.role]} vs preferred ${roleLabels[preferredRole]}`);
    }

    return { qualified: true, score: Math.max(0, score), issues };
  }, [enforceQualifications]);

  // Calculate penalty rate factor
  const calculatePenaltyFactor = useCallback((date: string, startTime: string, endTime: string): number => {
    const dayOfWeek = getDay(parseISO(date));
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    
    let factor = 1.0;
    
    // Weekend penalty
    if (dayOfWeek === 0) factor = Math.max(factor, 2.0); // Sunday
    if (dayOfWeek === 6) factor = Math.max(factor, 1.5); // Saturday
    
    // Early morning (before 7am)
    if (startH < 7) factor = Math.max(factor, 1.15);
    
    // Evening (after 6pm)
    if (endH > 18) factor = Math.max(factor, 1.15);
    
    // Night shift (after 10pm or before 6am)
    if (startH >= 22 || endH >= 22 || startH < 6) factor = Math.max(factor, 1.3);
    
    return factor;
  }, []);

  // Score a staff member for a specific shift
  const scoreStaffForShift = useCallback((
    staffMember: StaffMember,
    shift: EmptyShift
  ): StaffScore => {
    const issues: string[] = [];
    const breakdown = {
      availability: 0,
      qualifications: 0,
      cost: 0,
      fairness: 0,
      preference: 0,
      penalty: 0,
    };

    // Filter by employment type
    if (!includeCasual && staffMember.employmentType === 'casual') {
      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        score: 0,
        breakdown,
        issues: ['Casual staff excluded'],
        isEligible: false,
        hourlyRate: staffMember.hourlyRate,
        estimatedCost: 0,
        employmentType: staffMember.employmentType,
      };
    }

    if (!includeAgency && staffMember.agency) {
      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        score: 0,
        breakdown,
        issues: ['Agency staff excluded'],
        isEligible: false,
        hourlyRate: staffMember.hourlyRate,
        estimatedCost: 0,
        employmentType: staffMember.employmentType,
      };
    }

    // Check availability
    const availCheck = checkStaffAvailability(
      staffMember, 
      shift.date, 
      shift.startTime, 
      shift.endTime
    );
    
    if (!availCheck.available) {
      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        score: 0,
        breakdown,
        issues: [availCheck.reason!],
        isEligible: false,
        hourlyRate: staffMember.hourlyRate,
        estimatedCost: 0,
        employmentType: staffMember.employmentType,
      };
    }
    breakdown.availability = 100;

    // Check qualifications
    const qualCheck = checkQualifications(
      staffMember,
      shift.requiredQualifications || shift.template?.requiredQualifications,
      shift.minimumClassification || shift.template?.minimumClassification,
      shift.preferredRole || shift.template?.preferredRole
    );

    if (!qualCheck.qualified) {
      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        score: 0,
        breakdown,
        issues: qualCheck.issues,
        isEligible: false,
        hourlyRate: staffMember.hourlyRate,
        estimatedCost: 0,
        employmentType: staffMember.employmentType,
      };
    }
    breakdown.qualifications = qualCheck.score;
    issues.push(...qualCheck.issues);

    // Calculate shift hours and check overtime
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    let shiftMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (shiftMins < 0) shiftMins += 24 * 60;
    shiftMins -= shift.breakMinutes;
    const shiftHours = shiftMins / 60;

    const currentHours = staffHoursMap[staffMember.id] || 0;
    const newTotalHours = currentHours + shiftHours;
    const maxAllowedHours = staffMember.maxHoursPerWeek * (1 + maxOvertimePercent / 100);

    if (newTotalHours > maxAllowedHours) {
      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        score: 0,
        breakdown,
        issues: [`Would exceed max hours (${currentHours.toFixed(1)} + ${shiftHours.toFixed(1)} > ${maxAllowedHours.toFixed(1)})`],
        isEligible: false,
        hourlyRate: staffMember.hourlyRate,
        estimatedCost: 0,
        employmentType: staffMember.employmentType,
      };
    }

    // Calculate costs
    const penaltyFactor = calculatePenaltyFactor(shift.date, shift.startTime, shift.endTime);
    const isOvertime = newTotalHours > staffMember.maxHoursPerWeek;
    const rate = isOvertime ? staffMember.overtimeRate : staffMember.hourlyRate;
    const estimatedCost = shiftHours * rate * penaltyFactor;

    // Cost score (lower is better, normalized to 0-100)
    const maxPossibleCost = shiftHours * 100; // Assuming max rate of $100/hr
    breakdown.cost = Math.max(0, 100 - (estimatedCost / maxPossibleCost) * 100);
    breakdown.penalty = penaltyFactor > 1 ? Math.max(0, 100 - (penaltyFactor - 1) * 200) : 100;

    if (isOvertime) {
      issues.push('Would incur overtime rates');
      breakdown.cost -= 20;
    }

    if (penaltyFactor > 1.2) {
      issues.push(`High penalty rates (${((penaltyFactor - 1) * 100).toFixed(0)}% loading)`);
    }

    // Fairness score (prioritize staff with fewer hours)
    const utilizationRate = currentHours / staffMember.maxHoursPerWeek;
    breakdown.fairness = Math.max(0, 100 - utilizationRate * 100);

    // Preference score
    if (respectPreferences) {
      const room = rooms.find(r => r.id === shift.roomId);
      const prefs = staffMember.schedulingPreferences;
      
      if (prefs) {
        if (prefs.preferredRooms.includes(shift.roomId)) {
          breakdown.preference = 100;
        } else if (prefs.avoidRooms.includes(shift.roomId)) {
          breakdown.preference = 20;
          issues.push('Prefers to avoid this room');
        } else {
          breakdown.preference = 60;
        }

        const [shiftStartH] = shift.startTime.split(':').map(Number);
        if (prefs.preferEarlyShifts && shiftStartH < 9) {
          breakdown.preference += 20;
        } else if (prefs.preferLateShifts && shiftStartH >= 12) {
          breakdown.preference += 20;
        }
        breakdown.preference = Math.min(100, breakdown.preference);
      } else {
        breakdown.preference = 50;
      }
    } else {
      breakdown.preference = 50;
    }

    // Calculate weighted total score
    const totalScore = 
      breakdown.availability * weights.availability +
      breakdown.qualifications * weights.qualifications +
      breakdown.cost * weights.cost +
      breakdown.fairness * weights.fairness +
      breakdown.preference * weights.preference;

    return {
      staffId: staffMember.id,
      staffName: staffMember.name,
      score: Math.round(totalScore),
      breakdown,
      issues,
      isEligible: true,
      hourlyRate: rate,
      estimatedCost,
      employmentType: staffMember.employmentType,
    };
  }, [
    includeCasual,
    includeAgency,
    checkStaffAvailability,
    checkQualifications,
    staffHoursMap,
    maxOvertimePercent,
    calculatePenaltyFactor,
    rooms,
    respectPreferences,
    weights,
  ]);

  // Run auto-assignment algorithm
  const runAutoAssignment = useCallback(() => {
    setIsProcessing(true);
    setActiveTab('results');

    // Simulate processing delay for UX
    setTimeout(() => {
      const results: AssignmentResult[] = [];
      const assignedStaff = new Set<string>(); // Track staff assigned on same date

      // Sort shifts by date and time for consistent assignment
      const sortedShifts = [...emptyShifts].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      sortedShifts.forEach(shift => {
        const room = rooms.find(r => r.id === shift.roomId);
        
        // Score all staff for this shift
        const staffScores = staff
          .map(s => scoreStaffForShift(s, shift))
          .filter(s => s.isEligible)
          .sort((a, b) => b.score - a.score);

        // Find best available staff (not already assigned to this date/time slot)
        let bestMatch: StaffScore | null = null;
        for (const score of staffScores) {
          const staffDateKey = `${score.staffId}-${shift.date}`;
          // Check if staff already has a shift at overlapping time
          const hasConflict = results.some(r => 
            r.staffId === score.staffId && 
            r.date === shift.date
          );
          
          if (!hasConflict) {
            bestMatch = score;
            break;
          }
        }

        results.push({
          shiftId: shift.id,
          staffId: bestMatch?.staffId || null,
          staffName: bestMatch?.staffName,
          room: room?.name || 'Unknown',
          date: shift.date,
          time: `${shift.startTime} - ${shift.endTime}`,
          score: bestMatch?.score || 0,
          issues: bestMatch?.issues || ['No eligible staff found'],
          alternatives: staffScores.slice(0, 5), // Top 5 alternatives
        });
      });

      setAssignments(results);
      setIsProcessing(false);
    }, 1500);
  }, [emptyShifts, staff, rooms, scoreStaffForShift]);

  // Handle preset change
  const handlePresetChange = (preset: keyof typeof OPTIMIZATION_PRESETS) => {
    setOptimizationPreset(preset);
    setWeights(OPTIMIZATION_PRESETS[preset]);
  };

  // Handle assignment confirmation
  const handleConfirmAssignments = () => {
    const validAssignments = assignments
      .filter(a => a.staffId !== null)
      .map(a => ({ shiftId: a.shiftId, staffId: a.staffId! }));
    
    onAssign(validAssignments);
    onClose();
  };

  // Manual override assignment
  const handleManualOverride = (shiftId: string, newStaffId: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.shiftId === shiftId) {
        const newStaff = a.alternatives.find(alt => alt.staffId === newStaffId);
        return {
          ...a,
          staffId: newStaffId,
          staffName: newStaff?.staffName || '',
          score: newStaff?.score || 0,
          issues: newStaff?.issues || [],
        };
      }
      return a;
    }));
  };

  const assignedCount = assignments.filter(a => a.staffId !== null).length;
  const unassignedCount = assignments.filter(a => a.staffId === null).length;
  const totalEstimatedCost = assignments.reduce((sum, a) => {
    if (!a.staffId) return sum;
    const alt = a.alternatives.find(x => x.staffId === a.staffId);
    return sum + (alt?.estimatedCost || 0);
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[700px] sm:max-w-[700px] p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Auto-Assign Staff to Shifts
          </SheetTitle>
          <SheetDescription>
            Intelligently assign staff to {emptyShifts.length} empty shift(s) based on availability, 
            qualifications, cost optimization, and fairness.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start px-6 pt-4">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={assignments.length === 0}>
              Results {assignments.length > 0 && `(${assignedCount}/${assignments.length})`}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <TabsContent value="config" className="p-6 pt-4 space-y-4">
              {/* Optimization Preset */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Optimization Strategy
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.keys(OPTIMIZATION_PRESETS).map(preset => (
                    <Chip
                      key={preset}
                      label={preset === 'balanced' ? 'Balanced' : 
                             preset === 'costOptimized' ? 'Cost Optimized' :
                             preset === 'qualityFirst' ? 'Quality First' : 'Fair Distribution'}
                      icon={
                        preset === 'balanced' ? <Zap size={14} /> :
                        preset === 'costOptimized' ? <DollarSign size={14} /> :
                        preset === 'qualityFirst' ? <GraduationCap size={14} /> : <Users size={14} />
                      }
                      onClick={() => handlePresetChange(preset as keyof typeof OPTIMIZATION_PRESETS)}
                      color={optimizationPreset === preset ? 'primary' : 'default'}
                      variant={optimizationPreset === preset ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider />

              {/* Weight Sliders */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Scoring Weights
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { key: 'cost', label: 'Cost Optimization', icon: <DollarSign size={14} /> },
                      { key: 'availability', label: 'Availability Match', icon: <Clock size={14} /> },
                      { key: 'qualifications', label: 'Qualifications', icon: <GraduationCap size={14} /> },
                      { key: 'fairness', label: 'Fair Distribution', icon: <Users size={14} /> },
                      { key: 'preference', label: 'Staff Preferences', icon: <Calendar size={14} /> },
                    ].map(({ key, label, icon }) => (
                      <Box key={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {icon}
                          <Typography variant="body2">{label}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                            {Math.round(weights[key as keyof typeof weights] * 100)}%
                          </Typography>
                        </Box>
                        <Slider
                          value={weights[key as keyof typeof weights] * 100}
                          onChange={(_, value) => setWeights(prev => ({
                            ...prev,
                            [key]: (value as number) / 100,
                          }))}
                          min={0}
                          max={100}
                          size="small"
                        />
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Staff Filters */}
              <Accordion>
                <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Staff Filters
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <StyledSwitch
                      checked={includeCasual}
                      onChange={setIncludeCasual}
                      label="Include casual staff"
                    />
                    <StyledSwitch
                      checked={includeAgency}
                      onChange={setIncludeAgency}
                      label="Include agency staff"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Rules */}
              <Accordion>
                <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Assignment Rules
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <StyledSwitch
                      checked={enforceQualifications}
                      onChange={setEnforceQualifications}
                      label="Strictly enforce qualification requirements"
                    />
                    <StyledSwitch
                      checked={respectPreferences}
                      onChange={setRespectPreferences}
                      label="Respect staff scheduling preferences"
                    />
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Maximum overtime allowance
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Slider
                          value={maxOvertimePercent}
                          onChange={(_, value) => setMaxOvertimePercent(value as number)}
                          min={0}
                          max={50}
                          size="small"
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {maxOvertimePercent}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Summary of shifts to assign */}
              <Alert severity="info" icon={<Info size={16} />}>
                <Typography variant="body2">
                  <strong>{emptyShifts.length}</strong> shift(s) ready for assignment across{' '}
                  <strong>{new Set(emptyShifts.map(s => s.date)).size}</strong> day(s)
                </Typography>
              </Alert>
            </TabsContent>

            <TabsContent value="results" className="p-6 pt-4 space-y-4">
              {isProcessing ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Wand2 className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
                  <Typography variant="h6" gutterBottom>
                    Optimizing Assignments...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Analyzing availability, qualifications, and costs
                  </Typography>
                  <LinearProgress sx={{ mt: 3, maxWidth: 300, mx: 'auto' }} />
                </Box>
              ) : (
                <>
                  {/* Summary Stats */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 2, textAlign: 'center' }}>
                      <UserCheck className="w-6 h-6 mx-auto mb-1" />
                      <Typography variant="h5" fontWeight={700}>{assignedCount}</Typography>
                      <Typography variant="caption">Assigned</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 2, textAlign: 'center' }}>
                      <UserX className="w-6 h-6 mx-auto mb-1" />
                      <Typography variant="h5" fontWeight={700}>{unassignedCount}</Typography>
                      <Typography variant="caption">Unassigned</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, textAlign: 'center' }}>
                      <DollarSign className="w-6 h-6 mx-auto mb-1" />
                      <Typography variant="h5" fontWeight={700}>${totalEstimatedCost.toFixed(0)}</Typography>
                      <Typography variant="caption">Est. Cost</Typography>
                    </Box>
                  </Box>

                  {/* Assignment Results */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {assignments.map(assignment => (
                      <Box
                        key={assignment.shiftId}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: assignment.staffId ? 'divider' : 'warning.main',
                          bgcolor: assignment.staffId ? 'background.paper' : 'warning.50',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {assignment.room}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(assignment.date), 'EEE, MMM d')} • {assignment.time}
                            </Typography>
                          </Box>
                          {assignment.staffId && (
                            <Chip
                              size="small"
                              label={`Score: ${assignment.score}`}
                              color={assignment.score >= 70 ? 'success' : assignment.score >= 40 ? 'warning' : 'error'}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          {assignment.staffId ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <Typography variant="body2" fontWeight={500}>
                                {assignment.staffName}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <Typography variant="body2" color="warning.main" fontWeight={500}>
                                No eligible staff found
                              </Typography>
                            </>
                          )}
                        </Box>

                        {assignment.issues.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {assignment.issues.map((issue, idx) => (
                              <Chip key={idx} label={issue} size="small" variant="outlined" color="warning" />
                            ))}
                          </Box>
                        )}

                        {/* Alternative options */}
                        {assignment.alternatives.length > 1 && (
                          <Accordion sx={{ mt: 1, bgcolor: 'transparent', boxShadow: 'none' }}>
                            <AccordionSummary expandIcon={<ChevronDown size={14} />} sx={{ minHeight: 32, p: 0 }}>
                              <Typography variant="caption" color="text.secondary">
                                {assignment.alternatives.length} alternative(s) available
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {assignment.alternatives.slice(0, 5).map(alt => (
                                  <Box
                                    key={alt.staffId}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: assignment.staffId === alt.staffId ? 'action.selected' : 'action.hover',
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'action.selected' },
                                    }}
                                    onClick={() => handleManualOverride(assignment.shiftId, alt.staffId)}
                                  >
                                    <Box>
                                      <Typography variant="body2">
                                        {alt.staffName}
                                        <Chip 
                                          label={alt.employmentType} 
                                          size="small" 
                                          sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                        />
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        ${alt.estimatedCost.toFixed(2)} est.
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={alt.score}
                                      size="small"
                                      color={alt.score >= 70 ? 'success' : alt.score >= 40 ? 'warning' : 'default'}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="p-6 pt-4 border-t">
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>
              Cancel
            </Button>
            {activeTab === 'config' ? (
              <Button
                variant="contained"
                onClick={runAutoAssignment}
                disabled={emptyShifts.length === 0}
                startIcon={<Wand2 size={16} />}
                sx={{ flex: 1 }}
              >
                Run Auto-Assignment
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={runAutoAssignment}
                  startIcon={<RefreshCw size={16} />}
                >
                  Re-run
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmAssignments}
                  disabled={assignedCount === 0}
                  startIcon={<Check size={16} />}
                  sx={{ flex: 1 }}
                >
                  Confirm {assignedCount} Assignment(s)
                </Button>
              </>
            )}
          </Box>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
