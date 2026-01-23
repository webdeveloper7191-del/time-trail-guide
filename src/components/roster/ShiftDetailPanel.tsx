import { useState, useMemo, useEffect } from 'react';
import { Shift, StaffMember, DemandData, RosterComplianceFlag, Room, Centre, TimeOff, RecurrencePattern, RecurrenceEndType, ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Clock, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  MapPin,
  Coffee,
  Save,
  Trash2,
  Copy,
  ArrowLeftRight,
  Zap,
  BarChart3,
  UserX,
  CheckCircle2,
  FileText,
  UserPlus,
  RefreshCw,
  Repeat
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { DemandHistogram } from './DemandHistogram';
import { ShiftTypeEditor } from './ShiftTypeEditor';
import { AllowanceEligibilityPanel } from './AllowanceEligibilityPanel';
import { OnCallPayBreakdown } from './OnCallPayBreakdown';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { useShiftCost } from '@/hooks/useShiftCost';
import { toast } from 'sonner';
import { ShiftCoverageSuggestionModal } from './ShiftCoverageSuggestionModal';
import { timesheetApi } from '@/lib/api/timesheetApi';
import { shiftStatusColors, getShiftTypeConfig, ShiftStatus } from '@/lib/rosterColors';
import { useRecurringPatterns } from '@/hooks/useRecurringPatterns';
import { recurrencePatternLabels } from '@/types/advancedRoster';

// Extended shift status to include absent
export type ExtendedShiftStatus = Shift['status'] | 'absent';

interface ShiftDetailPanelProps {
  shift: Shift;
  staff: StaffMember[];
  centre: Centre;
  demandData: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  existingShifts?: Shift[];
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  onDuplicate: (shift: Shift) => void;
  onSwapStaff: (shift: Shift) => void;
  onCopyShift?: (shift: Shift) => void;
}

// Build status options from central config
const shiftStatusOptions: { value: ShiftStatus; label: string; description: string; color: string }[] = [
  { value: 'draft', label: shiftStatusColors.draft.legendLabel, description: shiftStatusColors.draft.legendDescription, color: `${shiftStatusColors.draft.badgeBg} ${shiftStatusColors.draft.text}` },
  { value: 'published', label: shiftStatusColors.published.legendLabel, description: shiftStatusColors.published.legendDescription, color: `${shiftStatusColors.published.badgeBg} ${shiftStatusColors.published.text}` },
  { value: 'confirmed', label: shiftStatusColors.confirmed.legendLabel, description: shiftStatusColors.confirmed.legendDescription, color: `${shiftStatusColors.confirmed.badgeBg} ${shiftStatusColors.confirmed.text}` },
  { value: 'completed', label: shiftStatusColors.completed.legendLabel, description: shiftStatusColors.completed.legendDescription, color: `${shiftStatusColors.completed.badgeBg} ${shiftStatusColors.completed.text}` },
];

export function ShiftDetailPanel({
  shift,
  staff,
  centre,
  demandData,
  complianceFlags,
  existingShifts = [],
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onSwapStaff,
  onCopyShift,
}: ShiftDetailPanelProps) {
  const [editedShift, setEditedShift] = useState<Shift>(shift);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [templateMode, setTemplateMode] = useState<'shift' | 'recurring'>('shift');
  
  // Get recurring patterns from shared hook
  const { activePatterns } = useRecurringPatterns();

  // IMPORTANT: keep local state in sync when user clicks a different shift card
  useEffect(() => {
    setEditedShift(shift);
    setShowCoverageModal(false);
  }, [shift]);
  
  // Track absent state from the shift itself
  const isAbsent = editedShift.isAbsent || false;
  
  const assignedStaff = staff.find(s => s.id === editedShift.staffId);
  const room = centre.rooms.find(r => r.id === shift.roomId);
  
  const relatedFlags = complianceFlags.filter(
    f => f.date === shift.date && 
         f.roomId === shift.roomId && 
         f.centreId === shift.centreId
  );

  // Check if staff has approved leave for this shift date
  const staffApprovedLeave = useMemo(() => {
    if (!assignedStaff?.timeOff) return null;
    
    return assignedStaff.timeOff.find(leave => {
      if (leave.status !== 'approved') return false;
      const shiftDate = parseISO(shift.date);
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);
      return isWithinInterval(shiftDate, { start: leaveStart, end: leaveEnd });
    });
  }, [assignedStaff, shift.date]);

  // Check if there's pending leave for this date
  const staffPendingLeave = useMemo(() => {
    if (!assignedStaff?.timeOff) return null;
    
    return assignedStaff.timeOff.find(leave => {
      if (leave.status !== 'pending') return false;
      const shiftDate = parseISO(shift.date);
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);
      return isWithinInterval(shiftDate, { start: leaveStart, end: leaveEnd });
    });
  }, [assignedStaff, shift.date]);

  const leaveTypeLabels: Record<TimeOff['type'], string> = {
    annual_leave: 'Annual Leave',
    sick_leave: 'Sick Leave',
    personal_leave: 'Personal Leave',
    unpaid_leave: 'Unpaid Leave',
  };

  const { getQuickEstimate, calculateCost } = useShiftCost();

  const shiftDuration = useMemo(() => {
    const [startH, startM] = editedShift.startTime.split(':').map(Number);
    const [endH, endM] = editedShift.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - editedShift.breakMinutes;
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [editedShift]);

  // Use context-aware cost calculation with custom rules and rate overrides
  const { estimatedCost, costBreakdown } = useMemo(() => {
    if (!assignedStaff) {
      return { estimatedCost: 0, costBreakdown: null };
    }
    try {
      const breakdown = calculateCost(editedShift, assignedStaff);
      return { 
        estimatedCost: breakdown.totalCost, 
        costBreakdown: breakdown 
      };
    } catch {
      // Fallback to quick estimate
      return { 
        estimatedCost: getQuickEstimate(editedShift, assignedStaff), 
        costBreakdown: null 
      };
    }
  }, [editedShift, assignedStaff, calculateCost, getQuickEstimate]);

  const handleSave = () => {
    onSave(editedShift);
    onClose();
  };

  const handleMarkAbsent = () => {
    setShowCoverageModal(true);
  };

  const handleConfirmAbsent = async (findCoverage: boolean) => {
    const absenceReason = staffApprovedLeave ? 'leave' : 'other';
    const absentShift: Shift = {
      ...editedShift,
      isAbsent: true,
      absenceReason,
      notes: `${editedShift.notes ? editedShift.notes + '\n' : ''}[ABSENT] ${staffApprovedLeave ? `Leave: ${leaveTypeLabels[staffApprovedLeave.type]}` : 'Marked absent by manager'}`,
    };

    console.log('[absent] saving shift', {
      id: absentShift.id,
      staffId: absentShift.staffId,
      date: absentShift.date,
      isAbsent: absentShift.isAbsent,
      replacementStaffId: absentShift.replacementStaffId,
    });

    setEditedShift(absentShift);
    onSave(absentShift);
    
    // Update timesheet for this date
    try {
      const result = await timesheetApi.markTimesheetAbsent(
        editedShift.staffId,
        editedShift.date,
        absenceReason,
        editedShift.startTime,
        editedShift.endTime,
        staffApprovedLeave ? `Leave: ${leaveTypeLabels[staffApprovedLeave.type]}` : undefined
      );
      
      if (result.data.updated) {
        toast.success('Shift marked as absent', {
          description: 'Timesheet updated to reflect absence'
        });
      } else {
        toast.success('Shift marked as absent', {
          description: findCoverage ? 'Select a replacement from the suggestions' : 'The shift has been updated'
        });
      }
    } catch {
      toast.success('Shift marked as absent', {
        description: 'Note: Timesheet may need manual update'
      });
    }
  };

  const handleAssignCoverage = async (replacementStaffId: string) => {
    if (!assignedStaff) return;

    const originalStaffName = assignedStaff.name;
    const replacementStaff = staff.find(s => s.id === replacementStaffId);

    // 1) Keep the existing shift on the original staff member, but mark it as absent.
    const absenceReason = staffApprovedLeave ? 'leave' : 'other';
    const absentShift: Shift = {
      ...editedShift,
      isAbsent: true,
      absenceReason,
      replacementStaffId,
      notes: `${editedShift.notes ? editedShift.notes + '\n' : ''}[ABSENT] ${staffApprovedLeave ? `Leave: ${leaveTypeLabels[staffApprovedLeave.type]}` : 'Marked absent by manager'}${replacementStaff ? ` • Covered by ${replacementStaff.name}` : ''}`,
    };

    setEditedShift(absentShift);
    onSave(absentShift);

    // 2) Create a NEW shift for the replacement staff (same date/time/room).
    // We use onDuplicate because RosterScheduler already supports adding a new shift via that callback.
    const coverageShift: Shift = {
      ...editedShift,
      staffId: replacementStaffId,
      isAbsent: false,
      replacementStaffId: undefined,
      notes: `${editedShift.notes ? editedShift.notes + '\n' : ''}[COVERING] Covering for ${originalStaffName}`,
    };
    onDuplicate(coverageShift);

    setShowCoverageModal(false);

    // Mark original staff as absent in timesheet
    try {
      await timesheetApi.markTimesheetAbsent(
        assignedStaff.id,
        editedShift.date,
        absenceReason,
        editedShift.startTime,
        editedShift.endTime,
        'Shift covered by replacement staff'
      );
    } catch {
      // Silently fail - main operation succeeded
    }
  };

  const handleSkipCoverage = async () => {
    // First mark the shift as absent (including saving it)
    await handleConfirmAbsent(false);
    // Then close the modal
    setShowCoverageModal(false);
  };

  const handleStatusChange = (newStatus: Shift['status']) => {
    setEditedShift(prev => ({ ...prev, status: newStatus }));
  };

  // Get shift type from central config
  const getShiftTypeIndicator = () => {
    if (!editedShift.shiftType || editedShift.shiftType === 'regular') {
      return null;
    }
    const config = getShiftTypeConfig(editedShift.shiftType);
    return { icon: config.icon, color: config.color, label: config.label };
  };

  const shiftTypeIndicator = getShiftTypeIndicator();

  const actions: OffCanvasAction[] = [
    { label: 'Save Changes', onClick: handleSave, variant: 'primary', icon: <Save className="h-4 w-4" /> },
  ];

  const headerActions = (
    <div className="flex gap-1">
      <Button variant="outline" size="sm" onClick={() => onSwapStaff(shift)}>
        <ArrowLeftRight className="h-4 w-4 mr-1" />
        Swap
      </Button>
      <Button variant="outline" size="sm" onClick={() => onCopyShift?.(shift)}>
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>
      <Button variant="outline" size="icon" onClick={() => onDuplicate(shift)}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(shift.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <PrimaryOffCanvas
      open={true}
      onClose={onClose}
      title="Shift Details"
      description={`${format(parseISO(shift.date), 'EEEE, MMMM d, yyyy')} • ${centre.name} • ${room?.name || 'Unknown Room'}`}
      icon={Calendar}
      size="xl"
      actions={actions}
      headerActions={headerActions}
    >
      {/* Shift Type Badge */}
      {shiftTypeIndicator && (
        <div className="py-2 px-3 mb-4 -mt-2 rounded-lg bg-muted/50 border border-border">
          <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", shiftTypeIndicator.color)}>
            <shiftTypeIndicator.icon className="h-3 w-3" />
            {shiftTypeIndicator.label}
          </Badge>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent mb-4">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="allowances" className="text-xs flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Allowances
          </TabsTrigger>
          <TabsTrigger value="demand" className="text-xs flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Demand
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 m-0 mt-4">
          <div className="space-y-6">
            {/* Risk/Compliance Alerts */}
            {relatedFlags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Risk Impacts
                </Label>
                <div className="space-y-2">
                  {relatedFlags.map(flag => (
                    <div
                      key={flag.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        flag.severity === 'critical' && "border-destructive/50 bg-destructive/10",
                        flag.severity === 'warning' && "border-amber-500/50 bg-amber-500/10",
                        flag.severity === 'info' && "border-blue-500/50 bg-blue-500/10"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={cn(
                          "h-4 w-4 mt-0.5",
                          flag.severity === 'critical' && "text-destructive",
                          flag.severity === 'warning' && "text-amber-500",
                          flag.severity === 'info' && "text-blue-500"
                        )} />
                        <div>
                          <p className="text-sm font-medium">{flag.message}</p>
                          {flag.timeSlot && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Time: {flag.timeSlot}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Assignment */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Staff Assignment
              </Label>
              <Select 
                value={editedShift.staffId} 
                onValueChange={(value) => setEditedShift(prev => ({ ...prev, staffId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id} textValue={member.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span>{member.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({member.currentWeeklyHours}/{member.maxHoursPerWeek}h)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {assignedStaff && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: assignedStaff.color }}
                      >
                        {assignedStaff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{assignedStaff.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${assignedStaff.hourlyRate.toFixed(2)}/hr
                        </p>
                      </div>
                    </div>
                    {/* Mark Absent Button - Always visible */}
                    {!isAbsent && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={handleMarkAbsent}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Mark Absent
                      </Button>
                    )}
                    {isAbsent && (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Absent
                      </Badge>
                    )}
                  </div>
                  
                  {/* Overtime warning */}
                  {assignedStaff.currentWeeklyHours + shiftDuration > assignedStaff.maxHoursPerWeek && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>This shift would exceed weekly hour limit</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Leave/Absence Alert */}
            {(staffApprovedLeave || staffPendingLeave) && (
              <div className={cn(
                "p-3 rounded-lg border",
                staffApprovedLeave 
                  ? "border-amber-500/50 bg-amber-500/10" 
                  : "border-blue-500/50 bg-blue-500/10"
              )}>
                <div className="flex items-start gap-2">
                  <UserX className={cn(
                    "h-4 w-4 mt-0.5",
                    staffApprovedLeave ? "text-amber-600" : "text-blue-500"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {staffApprovedLeave 
                        ? `Approved ${leaveTypeLabels[staffApprovedLeave.type]}`
                        : `Pending ${leaveTypeLabels[staffPendingLeave!.type]}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {staffApprovedLeave 
                        ? `${format(parseISO(staffApprovedLeave.startDate), 'MMM d')} - ${format(parseISO(staffApprovedLeave.endDate), 'MMM d')}`
                        : `${format(parseISO(staffPendingLeave!.startDate), 'MMM d')} - ${format(parseISO(staffPendingLeave!.endDate), 'MMM d')}`
                      }
                    </p>
                    {staffApprovedLeave && !isAbsent && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs border-amber-500/50 text-amber-700 hover:bg-amber-500/20"
                          onClick={handleMarkAbsent}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Mark Absent & Find Coverage
                        </Button>
                      </div>
                    )}
                    {isAbsent && (
                      <Badge variant="outline" className="mt-2 text-amber-600 border-amber-500/50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Marked Absent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Unified Templates Section */}
            <div className="space-y-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </Label>
              
              {/* Radio Selection */}
              <RadioGroup 
                value={templateMode} 
                onValueChange={(value: 'shift' | 'recurring') => setTemplateMode(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shift" id="template-shift" />
                  <Label htmlFor="template-shift" className="text-sm font-medium cursor-pointer">
                    Shift Template
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="template-recurring" />
                  <Label htmlFor="template-recurring" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5" />
                    Recurring Pattern
                  </Label>
                </div>
              </RadioGroup>

              {/* Shift Template Section */}
              {templateMode === 'shift' && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <Select 
                    value=""
                    onValueChange={(templateId) => {
                      const template = defaultShiftTemplates.find(t => t.id === templateId);
                      if (template) {
                        setEditedShift(prev => ({ 
                          ...prev, 
                          startTime: template.startTime,
                          endTime: template.endTime,
                          breakMinutes: template.breakMinutes,
                          shiftType: template.shiftType || 'regular',
                        }));
                        toast.success(`Applied "${template.name}" template`);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a shift template..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {defaultShiftTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} textValue={template.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: template.color }}
                            />
                            <span>{template.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({template.startTime} - {template.endTime})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Sets shift times, break duration, and type
                  </p>
                </div>
              )}

              {/* Recurring Pattern Section */}
              {templateMode === 'recurring' && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                  {activePatterns.length > 0 ? (
                    <Select 
                      value=""
                      onValueChange={(patternId) => {
                        const pattern = activePatterns.find(p => p.id === patternId);
                        if (pattern) {
                          setEditedShift(prev => ({ 
                            ...prev, 
                            startTime: pattern.shiftTemplate.startTime,
                            endTime: pattern.shiftTemplate.endTime,
                            breakMinutes: pattern.shiftTemplate.breakDuration || 30,
                            recurring: {
                              isRecurring: true,
                              pattern: pattern.pattern as RecurrencePattern,
                              daysOfWeek: pattern.daysOfWeek || [],
                              endType: pattern.endDate ? 'on_date' : 'never',
                              endDate: pattern.endDate,
                              recurrenceGroupId: `rg-${prev.id}-${Date.now()}`
                            }
                          }));
                          toast.success(`Applied "${pattern.name}" recurring pattern`);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a recurring pattern..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {activePatterns.map(pattern => (
                          <SelectItem key={pattern.id} value={pattern.id} textValue={pattern.name}>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                <span className="font-medium">{pattern.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {recurrencePatternLabels[pattern.pattern]}
                                </Badge>
                                <span>
                                  {pattern.shiftTemplate.startTime} - {pattern.shiftTemplate.endTime}
                                </span>
                                <span>•</span>
                                <span>{pattern.shiftTemplate.roleName}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 border border-dashed border-muted-foreground/30 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">No active patterns available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create patterns in Recurring Shift Patterns panel
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sets times and enables recurring schedule automatically
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Time Settings */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Schedule
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editedShift.startTime}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editedShift.endTime}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="break" className="text-sm flex items-center gap-1">
                  <Coffee className="h-3.5 w-3.5" />
                  Break Duration
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="break"
                    type="number"
                    min={0}
                    step={15}
                    value={editedShift.breakMinutes}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>

              {/* Duration & Cost Summary */}
              <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{shiftDuration} hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                    <p className="text-sm font-medium">${estimatedCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Recurring Shift Configuration */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Recurring Shift
              </Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring-toggle" className="text-sm">Make this a recurring shift</Label>
                  <p className="text-xs text-muted-foreground">Automatically create shifts on a schedule</p>
                </div>
                <Switch
                  id="recurring-toggle"
                  checked={editedShift.recurring?.isRecurring || false}
                  onCheckedChange={(checked) => setEditedShift(prev => ({
                    ...prev,
                    recurring: checked 
                      ? { 
                          isRecurring: true, 
                          pattern: 'weekly' as RecurrencePattern,
                          daysOfWeek: [new Date(prev.date).getDay()],
                          endType: 'after_occurrences' as RecurrenceEndType,
                          endAfterOccurrences: 4,
                          recurrenceGroupId: `rg-${prev.id}-${Date.now()}`
                        }
                      : { isRecurring: false }
                  }))}
                />
              </div>

              {editedShift.recurring?.isRecurring && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">

                  {/* Pattern Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Repeat Pattern</Label>
                    <Select
                      value={editedShift.recurring.pattern || 'weekly'}
                      onValueChange={(value: RecurrencePattern) => setEditedShift(prev => ({
                        ...prev,
                        recurring: { ...prev.recurring!, pattern: value }
                      }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Days of Week - for weekly/fortnightly patterns */}
                  {(editedShift.recurring.pattern === 'weekly' || editedShift.recurring.pattern === 'fortnightly') && (
                    <div className="space-y-2">
                      <Label className="text-sm">Repeat on</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <div key={day} className="flex items-center gap-1">
                            <Checkbox
                              id={`day-${index}`}
                              checked={editedShift.recurring?.daysOfWeek?.includes(index) || false}
                              onCheckedChange={(checked) => {
                                const currentDays = editedShift.recurring?.daysOfWeek || [];
                                const newDays = checked
                                  ? [...currentDays, index]
                                  : currentDays.filter(d => d !== index);
                                setEditedShift(prev => ({
                                  ...prev,
                                  recurring: { ...prev.recurring!, daysOfWeek: newDays }
                                }));
                              }}
                            />
                            <Label htmlFor={`day-${index}`} className="text-xs cursor-pointer">{day}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* End Condition */}
                  <div className="space-y-2">
                    <Label className="text-sm">Ends</Label>
                    <Select
                      value={editedShift.recurring.endType || 'after_occurrences'}
                      onValueChange={(value: RecurrenceEndType) => setEditedShift(prev => ({
                        ...prev,
                        recurring: { ...prev.recurring!, endType: value }
                      }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="after_occurrences">After X occurrences</SelectItem>
                        <SelectItem value="on_date">On a specific date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Occurrences count */}
                  {editedShift.recurring.endType === 'after_occurrences' && (
                    <div className="space-y-2">
                      <Label className="text-sm">Number of occurrences</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={editedShift.recurring.endAfterOccurrences || 4}
                          onChange={(e) => setEditedShift(prev => ({
                            ...prev,
                            recurring: { ...prev.recurring!, endAfterOccurrences: parseInt(e.target.value) || 4 }
                          }))}
                          className="w-24 bg-background"
                        />
                        <span className="text-sm text-muted-foreground">occurrences</span>
                      </div>
                    </div>
                  )}

                  {/* End date */}
                  {editedShift.recurring.endType === 'on_date' && (
                    <div className="space-y-2">
                      <Label className="text-sm">End date</Label>
                      <Input
                        type="date"
                        value={editedShift.recurring.endDate || ''}
                        min={editedShift.date}
                        onChange={(e) => setEditedShift(prev => ({
                          ...prev,
                          recurring: { ...prev.recurring!, endDate: e.target.value }
                        }))}
                        className="bg-background"
                      />
                    </div>
                  )}

                  {/* Preview info */}
                  <div className="p-2 bg-primary/5 rounded text-xs text-muted-foreground border border-primary/10">
                    <p className="font-medium text-foreground">
                      {editedShift.recurring.pattern === 'daily' && 'Creates a shift every day'}
                      {editedShift.recurring.pattern === 'weekly' && `Creates a shift every week on ${editedShift.recurring.daysOfWeek?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'selected days'}`}
                      {editedShift.recurring.pattern === 'fortnightly' && `Creates a shift every 2 weeks on ${editedShift.recurring.daysOfWeek?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'selected days'}`}
                    </p>
                    <p className="mt-1">
                      {editedShift.recurring.endType === 'never' && 'Until manually stopped'}
                      {editedShift.recurring.endType === 'after_occurrences' && `For ${editedShift.recurring.endAfterOccurrences || 4} occurrences`}
                      {editedShift.recurring.endType === 'on_date' && editedShift.recurring.endDate && `Until ${format(new Date(editedShift.recurring.endDate), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Shift Status */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Shift Status
              </Label>
              <Select 
                value={editedShift.status} 
                onValueChange={(value) => handleStatusChange(value as Shift['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {shiftStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} textValue={option.label}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", option.color)}>
                            {option.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick status actions */}
              <div className="flex gap-2">
                {editedShift.status === 'draft' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleStatusChange('published')}
                  >
                    Publish Shift
                  </Button>
                )}
                {editedShift.status === 'published' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleStatusChange('confirmed')}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Confirmed
                  </Button>
                )}
                {(editedShift.status === 'confirmed' || editedShift.status === 'published') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Mark Completed
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Room Assignment */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Room
              </Label>
              <Select 
                value={editedShift.roomId} 
                onValueChange={(value) => setEditedShift(prev => ({ ...prev, roomId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {centre.rooms.map(r => (
                    <SelectItem key={r.id} value={r.id} textValue={r.name}>
                      {r.name} (1:{r.requiredRatio} ratio)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-xs text-muted-foreground uppercase tracking-wide">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={editedShift.notes || ''}
                onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes for this shift..."
                rows={3}
              />
            </div>
          </div>
        </TabsContent>

        {/* Allowances Tab */}
        <TabsContent value="allowances" className="flex-1 m-0 mt-4">
          <div className="space-y-6">
            {/* Shift Type Editor */}
            <ShiftTypeEditor 
              shift={editedShift}
              onChange={setEditedShift}
            />

            <Separator />

            {/* On-Call Pay Breakdown - Show for on-call or recall shifts */}
            {(editedShift.shiftType === 'on_call' || editedShift.shiftType === 'recall') && (
              <>
                <OnCallPayBreakdown 
                  shift={editedShift}
                  staff={assignedStaff}
                  awardType="children_services"
                />
                <Separator />
              </>
            )}

            {/* Allowance Eligibility */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Allowance Eligibility
              </Label>
              <AllowanceEligibilityPanel 
                shift={editedShift}
                staff={assignedStaff}
              />
            </div>
          </div>
        </TabsContent>

        {/* Demand Tab */}
        <TabsContent value="demand" className="flex-1 m-0 mt-4">
          <div className="space-y-6">
            {room && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Demand Context
                </Label>
                <DemandHistogram 
                  demandData={demandData}
                  room={room}
                  date={shift.date}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Coverage Suggestion Modal */}
      {assignedStaff && (
        <ShiftCoverageSuggestionModal
          open={showCoverageModal}
          onClose={() => setShowCoverageModal(false)}
          shift={editedShift}
          absentStaff={assignedStaff}
          allStaff={staff}
          room={room}
          existingShifts={existingShifts}
          onAssignStaff={handleAssignCoverage}
          onSkipCoverage={handleSkipCoverage}
        />
      )}
    </PrimaryOffCanvas>
  );
}
