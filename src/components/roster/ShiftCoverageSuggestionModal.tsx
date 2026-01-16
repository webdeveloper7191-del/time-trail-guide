import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Star,
  Calendar,
  DollarSign,
  XCircle
} from 'lucide-react';
import { Shift, StaffMember, Room, TimeOff } from '@/types/roster';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

interface CoverageCandidate {
  staff: StaffMember;
  score: number;
  reasons: string[];
  warnings: string[];
  estimatedCost: number;
}

interface ShiftCoverageSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  absentStaff: StaffMember;
  allStaff: StaffMember[];
  room?: Room;
  existingShifts: Shift[];
  onAssignStaff: (staffId: string) => void;
  onSkipCoverage: () => void;
}

export function ShiftCoverageSuggestionModal({
  open,
  onClose,
  shift,
  absentStaff,
  allStaff,
  room,
  existingShifts,
  onAssignStaff,
  onSkipCoverage,
}: ShiftCoverageSuggestionModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Calculate shift duration in hours
  const shiftDuration = useMemo(() => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes;
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [shift]);

  // Check if staff has a conflict with this shift
  const hasShiftConflict = (staff: StaffMember): boolean => {
    const [shiftStart, shiftEnd] = [shift.startTime, shift.endTime].map(timeToMinutes);
    
    return existingShifts.some(s => {
      if (s.staffId !== staff.id || s.date !== shift.date) return false;
      const [existingStart, existingEnd] = [s.startTime, s.endTime].map(timeToMinutes);
      return shiftStart < existingEnd && existingStart < shiftEnd;
    });
  };

  // Check if staff is on leave
  const isOnLeave = (staff: StaffMember): TimeOff | null => {
    if (!staff.timeOff) return null;
    
    return staff.timeOff.find(leave => {
      if (leave.status !== 'approved') return false;
      const shiftDate = parseISO(shift.date);
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);
      return isWithinInterval(shiftDate, { start: leaveStart, end: leaveEnd });
    }) || null;
  };

  // Check if staff has required qualifications for the room's age group
  const hasRequiredQualifications = (staff: StaffMember): boolean => {
    // Check if staff has diploma or higher for lead educator rooms
    const staffQuals = staff.qualifications?.map(q => q.type) || [];
    const hasDiploma = staffQuals.includes('diploma_ece') || staffQuals.includes('bachelor_ece') || staffQuals.includes('masters_ece');
    const hasCertIII = staffQuals.includes('certificate_iii');
    
    // All rooms require at least Cert III
    return hasDiploma || hasCertIII;
  };

  // Score and rank available staff
  const coverageCandidates: CoverageCandidate[] = useMemo(() => {
    const candidates: CoverageCandidate[] = [];

    allStaff.forEach(staff => {
      // Skip the absent staff member
      if (staff.id === absentStaff.id) return;

      const reasons: string[] = [];
      const warnings: string[] = [];
      let score = 50; // Base score

      // Check for absolute blockers
      const leave = isOnLeave(staff);
      if (leave) {
        return; // Skip staff on leave
      }

      if (hasShiftConflict(staff)) {
        return; // Skip staff with conflicting shifts
      }

      // Qualification match
      if (hasRequiredQualifications(staff)) {
        score += 20;
        reasons.push('Has required qualifications');
      } else {
        score -= 30;
        warnings.push('Missing some qualifications');
      }

      // Same role preference
      if (staff.role === absentStaff.role) {
        score += 15;
        reasons.push('Same role as absent staff');
      }

      // Check availability preference using DayAvailability array
      const shiftDate = parseISO(shift.date);
      const dayOfWeekNum = shiftDate.getDay(); // 0-6, Sunday-Saturday
      const availability = staff.availability?.find(a => a.dayOfWeek === dayOfWeekNum);
      
      if (availability?.available) {
        const [shiftStart] = shift.startTime.split(':').map(Number);
        const [shiftEnd] = shift.endTime.split(':').map(Number);
        const [availStart] = (availability.startTime || '00:00').split(':').map(Number);
        const [availEnd] = (availability.endTime || '23:59').split(':').map(Number);
        
        if (shiftStart >= availStart && shiftEnd <= availEnd) {
          score += 15;
          reasons.push('Available this day');
        } else {
          score += 5;
          warnings.push('Partially available');
        }
      } else if (availability?.available === false) {
        score -= 20;
        warnings.push('Not available this day');
      }

      // Hours capacity
      const hoursRemaining = staff.maxHoursPerWeek - staff.currentWeeklyHours;
      if (hoursRemaining >= shiftDuration) {
        score += 10;
        reasons.push(`${hoursRemaining.toFixed(1)}h remaining this week`);
      } else if (hoursRemaining > 0) {
        score += 5;
        warnings.push('Would exceed weekly hours');
      } else {
        score -= 15;
        warnings.push('At weekly hour limit');
      }

      // Lower hourly rate is preferred (cost savings)
      if (staff.hourlyRate < absentStaff.hourlyRate) {
        score += 5;
        reasons.push('Lower hourly rate');
      }

      // Calculate estimated cost
      const estimatedCost = staff.hourlyRate * shiftDuration;

      candidates.push({
        staff,
        score: Math.max(0, Math.min(100, score)),
        reasons,
        warnings,
        estimatedCost,
      });
    });

    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
  }, [allStaff, absentStaff, shift, existingShifts, room, shiftDuration]);

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    
    setIsAssigning(true);
    try {
      onAssignStaff(selectedStaffId);
      const selectedStaff = allStaff.find(s => s.id === selectedStaffId);
      toast.success('Shift reassigned', {
        description: `${selectedStaff?.name} will now cover this shift`
      });
      onClose();
    } catch (error) {
      toast.error('Failed to reassign shift');
    } finally {
      setIsAssigning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Find Coverage for Absent Staff
          </DialogTitle>
          <DialogDescription>
            {absentStaff.name} is marked absent. Select a replacement for this shift.
          </DialogDescription>
        </DialogHeader>

        {/* Shift Info */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(shift.date), 'EEEE, MMM d')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            <Badge variant="outline">{shiftDuration}h</Badge>
          </div>
          {room && (
            <Badge 
              variant="secondary"
              style={{ 
                backgroundColor: `${room.color}20`,
                color: room.color,
                borderColor: room.color
              }}
            >
              {room.name}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Candidate List */}
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-muted-foreground mb-3">
            {coverageCandidates.length} available staff members ranked by suitability
          </p>
          
          <ScrollArea className="h-[350px] pr-4">
            {coverageCandidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No available staff found for this shift</p>
                <p className="text-sm">All staff members are either on leave or have conflicting shifts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {coverageCandidates.map((candidate, index) => (
                  <div
                    key={candidate.staff.id}
                    onClick={() => setSelectedStaffId(candidate.staff.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedStaffId === candidate.staff.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: candidate.staff.color }}
                          >
                            {candidate.staff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {index === 0 && candidate.score >= 70 && (
                            <Star className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 fill-yellow-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{candidate.staff.name}</span>
                            {selectedStaffId === candidate.staff.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {candidate.staff.role.replace('_', ' ')} • ${candidate.staff.hourlyRate}/hr
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn("text-xs", getScoreBadge(candidate.score))}>
                          {candidate.score}% match
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${candidate.estimatedCost.toFixed(2)} est.
                        </p>
                      </div>
                    </div>

                    {/* Reasons and Warnings */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {candidate.reasons.slice(0, 3).map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          {reason}
                        </Badge>
                      ))}
                      {candidate.warnings.slice(0, 2).map((warning, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onSkipCoverage}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedStaffId || isAssigning}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isAssigning ? 'Assigning...' : 'Assign Selected'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
