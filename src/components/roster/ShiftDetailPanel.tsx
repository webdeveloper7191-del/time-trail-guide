import { useState, useMemo, useEffect } from 'react';
import { CallbackEvent } from './CallbackEventLoggingPanel';
import { SleepoverEvent, SplitShiftEvent } from '@/types/shiftEvents';
import { Shift, StaffMember, DemandData, RosterComplianceFlag, Centre, TimeOff } from '@/types/roster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  Save,
  Trash2,
  Copy,
  ArrowLeftRight,
  Zap,
  UserX,
  CheckCircle2,
  UserPlus,
  Repeat,
  PhoneCall,
  Shield,
  Timer,
  Car,
  XCircle,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ShiftTypeEditor } from './ShiftTypeEditor';
import { AllowanceEligibilityPanel } from './AllowanceEligibilityPanel';
import { ManualAllowancesEditor } from './ManualAllowancesEditor';
import { ShiftBreaksEditor, unpaidBreakTotal } from './ShiftBreaksEditor';
import { OnCallPayBreakdown } from './OnCallPayBreakdown';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { useShiftCost } from '@/hooks/useShiftCost';
import { toast } from 'sonner';
import { ShiftCoverageSuggestionModal } from './ShiftCoverageSuggestionModal';
import { timesheetApi } from '@/lib/api/timesheetApi';
import { shiftStatusColors, getShiftTypeConfig, ShiftStatus } from '@/lib/rosterColors';
import { applyShiftLeaveEffect } from '@/lib/leaveAccrualEngine';
import { StaffAvailabilityWarnings } from './StaffAvailabilityWarnings';

// Extended shift status to include absent
export type ExtendedShiftStatus = Shift['status'] | 'absent';

interface ShiftDetailPanelProps {
  shift: Shift;
  staff: StaffMember[];
  centre: Centre;
  demandData?: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  existingShifts?: Shift[];
  callbackEvents?: CallbackEvent[];
  sleepoverEvents?: SleepoverEvent[];
  splitShiftEvents?: SplitShiftEvent[];
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  onDuplicate: (shift: Shift) => void;
  onSwapStaff: (shift: Shift) => void;
  onCopyShift?: (shift: Shift) => void;
  onLogCallback?: (shift: Shift, type: 'callback' | 'recall' | 'emergency') => void;
  onLogSleepover?: (shift: Shift) => void;
  onLogSplitShift?: (shift: Shift) => void;
  onCallbackStatusChange?: (eventId: string, newStatus: CallbackEvent['status']) => void;
  onSleepoverStatusChange?: (eventId: string, newStatus: SleepoverEvent['status']) => void;
  onSplitShiftStatusChange?: (eventId: string, newStatus: SplitShiftEvent['status']) => void;
}

// Build status options from central config
const shiftStatusOptions: { value: ShiftStatus; label: string; description: string; color: string }[] = [
  { value: 'draft', label: shiftStatusColors.draft.legendLabel, description: shiftStatusColors.draft.legendDescription, color: `${shiftStatusColors.draft.badgeBg} ${shiftStatusColors.draft.text}` },
  { value: 'published', label: shiftStatusColors.published.legendLabel, description: shiftStatusColors.published.legendDescription, color: `${shiftStatusColors.published.badgeBg} ${shiftStatusColors.published.text}` },
  { value: 'confirmed', label: shiftStatusColors.confirmed.legendLabel, description: shiftStatusColors.confirmed.legendDescription, color: `${shiftStatusColors.confirmed.badgeBg} ${shiftStatusColors.confirmed.text}` },
  { value: 'completed', label: shiftStatusColors.completed.legendLabel, description: shiftStatusColors.completed.legendDescription, color: `${shiftStatusColors.completed.badgeBg} ${shiftStatusColors.completed.text}` },
];

const eventStatusColors: Record<string, string> = {
  logged: 'bg-blue-500/15 text-blue-700 border-blue-300',
  approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
  rejected: 'bg-destructive/15 text-destructive border-destructive/40',
  paid: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
};

const shortTime = (value?: string) => (value ? format(new Date(value), 'h:mm a') : '—');

/** Compact summary tiles used above each event list. */
const StatTiles = ({ items }: { items: { value: string; label: string }[] }) => (
  <div className="grid grid-cols-3 gap-3">
    {items.map(item => (
      <div key={item.label} className="rounded-lg border bg-muted/30 p-3 text-center">
        <p className="text-2xl font-bold text-foreground">{item.value}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
      </div>
    ))}
  </div>
);

/** One logged event (callback / sleepover / split shift) with its approval actions. */
const EventCard = ({ icon: Icon, label, tone, status, flag, rows, notes, onStatusChange }: {
  icon: React.ElementType;
  label: string;
  tone: string;
  status: string;
  flag?: string;
  rows: React.ReactNode[];
  notes?: React.ReactNode;
  onStatusChange?: (next: 'approved' | 'rejected' | 'paid') => void;
}) => (
  <div className={cn('rounded-lg border p-3 space-y-2', tone)}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {flag && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">{flag}</Badge>}
        <Badge variant="outline" className={cn('text-[9px]', eventStatusColors[status])}>{status}</Badge>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">{rows}</div>

    {notes && <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-1.5">{notes}</div>}

    {onStatusChange && (status === 'logged' || status === 'approved') && (
      <div className="flex items-center gap-2 pt-1.5 border-t border-border/50">
        {status === 'logged' ? (
          <>
            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-500/10" onClick={() => onStatusChange('approved')}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => onStatusChange('rejected')}>
              <XCircle className="h-3 w-3 mr-1" /> Reject
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-500/10" onClick={() => onStatusChange('paid')}>
            <DollarSign className="h-3 w-3 mr-1" /> Mark as Paid
          </Button>
        )}
      </div>
    )}
  </div>
);

const EventRow = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="h-3 w-3" />
    <span>{children}</span>
  </div>
);

const EmptyEvents = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="text-center py-6">
    <Icon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export function ShiftDetailPanel({
  shift,
  staff,
  centre,
  complianceFlags,
  existingShifts = [],
  callbackEvents = [],
  sleepoverEvents = [],
  splitShiftEvents = [],
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onSwapStaff,
  onCopyShift,
  onLogCallback,
  onLogSleepover,
  onLogSplitShift,
  onCallbackStatusChange,
  onSleepoverStatusChange,
  onSplitShiftStatusChange,
}: ShiftDetailPanelProps) {
  const [editedShift, setEditedShift] = useState<Shift>(shift);
  const [showCoverageModal, setShowCoverageModal] = useState(false);

  // IMPORTANT: keep local state in sync when user clicks a different shift card
  useEffect(() => {
    setEditedShift(shift);
    setShowCoverageModal(false);
  }, [shift]);

  // Track absent state from the shift itself
  const isAbsent = editedShift.isAbsent || false;

  const assignedStaff = staff.find(s => s.id === editedShift.staffId);
  const room = centre.rooms.find(r => r.id === shift.roomId);
  const isOnCall = editedShift.shiftType === 'on_call' || editedShift.shiftType === 'recall';

  const relatedFlags = complianceFlags.filter(
    f => f.date === shift.date &&
         f.roomId === shift.roomId &&
         f.centreId === shift.centreId
  );

  const findLeave = (status: TimeOff['status']) => {
    if (!assignedStaff?.timeOff) return null;
    return assignedStaff.timeOff.find(leave =>
      leave.status === status &&
      isWithinInterval(parseISO(shift.date), { start: parseISO(leave.startDate), end: parseISO(leave.endDate) })
    ) ?? null;
  };

  const staffApprovedLeave = useMemo(() => findLeave('approved'), [assignedStaff, shift.date]);
  const staffPendingLeave = useMemo(() => findLeave('pending'), [assignedStaff, shift.date]);
  const relevantLeave = staffApprovedLeave ?? staffPendingLeave;

  const leaveTypeLabels: Record<TimeOff['type'], string> = {
    annual_leave: 'Annual Leave',
    sick_leave: 'Sick Leave',
    personal_leave: 'Personal Leave',
    unpaid_leave: 'Unpaid Leave',
    rdo_leave: 'RDO Leave',
    ado_leave: 'ADO Leave',
    toil_leave: 'TOIL Leave',
  };

  // Filter events for this specific shift
  const shiftCallbackEvents = useMemo(() => {
    return callbackEvents.filter(e =>
      e.staffId === editedShift.staffId &&
      (e.onCallShiftId === editedShift.id || e.workStartTime?.startsWith(editedShift.date))
    );
  }, [callbackEvents, editedShift.staffId, editedShift.date, editedShift.id]);

  const shiftSleepoverEvents = useMemo(() => {
    return sleepoverEvents.filter(e => e.staffId === editedShift.staffId && e.date === editedShift.date);
  }, [sleepoverEvents, editedShift.staffId, editedShift.date]);

  const shiftSplitShiftEvents = useMemo(() => {
    return splitShiftEvents.filter(e => e.staffId === editedShift.staffId && e.date === editedShift.date);
  }, [splitShiftEvents, editedShift.staffId, editedShift.date]);

  const totalEventCount = shiftCallbackEvents.length + shiftSleepoverEvents.length + shiftSplitShiftEvents.length;

  const { getQuickEstimate, calculateCost } = useShiftCost();

  const shiftDuration = useMemo(() => {
    const [startH, startM] = editedShift.startTime.split(':').map(Number);
    const [endH, endM] = editedShift.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - editedShift.breakMinutes;
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [editedShift]);

  // Use context-aware cost calculation with custom rules and rate overrides
  const estimatedCost = useMemo(() => {
    if (!assignedStaff) return 0;
    try {
      return calculateCost(editedShift, assignedStaff).totalCost;
    } catch {
      return getQuickEstimate(editedShift, assignedStaff);
    }
  }, [editedShift, assignedStaff, calculateCost, getQuickEstimate]);

  const handleSave = () => {
    // Post leave-accrual ledger effect (RDO/ADO/TOIL) if applicable
    try {
      const hoursBetween = (start: string, end: string, br: number) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        return Math.max(0, (mins - (br || 0)) / 60);
      };
      const staffMember = staff.find(s => s.id === editedShift.staffId);
      const scheduled = hoursBetween(editedShift.startTime, editedShift.endTime, editedShift.breakMinutes || 0);
      const entry = applyShiftLeaveEffect({
        staffId: editedShift.staffId,
        staffName: staffMember?.name,
        shiftId: editedShift.id,
        date: editedShift.date,
        scheduledHours: scheduled,
        leaveTag: editedShift.leaveTag ?? 'AUTO',
        locationId: centre?.id,
      });
      if (entry) {
        toast.success(`${entry.kind} ${entry.type} posted`, {
          description: `${entry.hours > 0 ? '+' : ''}${entry.hours.toFixed(2)}h • ${entry.note ?? ''}`,
        });
      }
    } catch (e) {
      console.warn('[leave] applyShiftLeaveEffect failed', e);
    }
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
    await handleConfirmAbsent(false);
    setShowCoverageModal(false);
  };

  const handleStatusChange = (newStatus: Shift['status']) => {
    setEditedShift(prev => ({ ...prev, status: newStatus }));
  };

  const shiftTypeConfig = editedShift.shiftType && editedShift.shiftType !== 'regular'
    ? getShiftTypeConfig(editedShift.shiftType)
    : null;

  const actions: OffCanvasAction[] = [
    { label: 'Save Changes', onClick: handleSave, variant: 'primary', icon: <Save className="h-4 w-4" /> },
  ];

  const headerActions = (
    <div className="flex gap-1">
      <Button variant="outline" size="sm" onClick={() => onSwapStaff(shift)}>
        <ArrowLeftRight className="h-4 w-4 mr-1" />
        Swap
      </Button>
      <Button variant="outline" size="sm" onClick={() => (onCopyShift ? onCopyShift(shift) : onDuplicate(shift))}>
        <Copy className="h-4 w-4 mr-1" />
        Copy
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
      {/* Shift type + recurring series context */}
      {(shiftTypeConfig || editedShift.recurring?.isRecurring) && (
        <div className="py-2 px-3 mb-4 -mt-2 rounded-lg bg-muted/50 border border-border flex items-center gap-2 flex-wrap">
          {shiftTypeConfig && (
            <Badge variant="outline" className={cn('flex items-center gap-1 w-fit', shiftTypeConfig.color)}>
              <shiftTypeConfig.icon className="h-3 w-3" />
              {shiftTypeConfig.label}
            </Badge>
          )}
          {editedShift.recurring?.isRecurring && (
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Repeat className="h-3 w-3" />
              Part of a recurring series
            </Badge>
          )}
        </div>
      )}

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent mb-4">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="pay" className="text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Pay &amp; Allowances
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs flex items-center gap-1">
            <PhoneCall className="h-3 w-3" />
            Events
            {totalEventCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-0.5">{totalEventCount}</Badge>
            )}
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
            <FormSection title="Staff Assignment">
              <FormField label="Assigned Staff" required>
                <Select
                  value={editedShift.staffId}
                  onValueChange={(value) => setEditedShift(prev => ({ ...prev, staffId: value }))}
                >
                  <SelectTrigger className="bg-background">
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
              </FormField>

              {assignedStaff && (
                <div className="bg-background rounded-lg border p-3 space-y-2">
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
                    {isAbsent ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Absent
                      </Badge>
                    ) : (
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

              {assignedStaff && (
                <StaffAvailabilityWarnings
                  staff={assignedStaff}
                  shiftDate={editedShift.date}
                />
              )}
            </FormSection>

            {/* Leave/Absence Alert */}
            {relevantLeave && (
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
                      {staffApprovedLeave ? 'Approved' : 'Pending'} {leaveTypeLabels[relevantLeave.type]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(relevantLeave.startDate), 'MMM d')} - {format(parseISO(relevantLeave.endDate), 'MMM d')}
                    </p>
                    {staffApprovedLeave && !isAbsent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs mt-2 border-amber-500/50 text-amber-700 hover:bg-amber-500/20"
                        onClick={handleMarkAbsent}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Mark Absent &amp; Find Coverage
                      </Button>
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

            {/* Time Settings */}
            <FormSection title="Schedule">
              <FormRow columns={2}>
                <FormField label="Start Time" required>
                  <Input
                    type="time"
                    value={editedShift.startTime}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className="bg-background h-11"
                  />
                </FormField>
                <FormField label="End Time" required>
                  <Input
                    type="time"
                    value={editedShift.endTime}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
                    className="bg-background h-11"
                  />
                </FormField>
              </FormRow>

              <FormField label="Required Employees">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={editedShift.requiredEmployeeCount || 1}
                    onChange={(e) => setEditedShift(prev => ({ ...prev, requiredEmployeeCount: parseInt(e.target.value) || 1 }))}
                    className="w-24 bg-background h-11"
                  />
                  <span className="text-sm text-muted-foreground">staff</span>
                </div>
              </FormField>

              {/* Paid / Unpaid break entries — mirrors the timesheet breaks grid */}
              <ShiftBreaksEditor
                breaks={editedShift.breaks ?? (editedShift.breakMinutes > 0 ? [{
                  id: 'legacy',
                  start: '',
                  end: '',
                  paid: false,
                  label: `Unpaid Break (${editedShift.breakMinutes} min)`,
                }] : [])}
                startTime={editedShift.startTime}
                endTime={editedShift.endTime}
                onChange={(breaks) => setEditedShift(prev => ({
                  ...prev,
                  breaks,
                  breakMinutes: unpaidBreakTotal(breaks),
                }))}
              />

              {/* Duration & Cost Summary */}
              <div className="bg-background rounded-lg border p-3 grid grid-cols-2 gap-3">
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
            </FormSection>

            {/* Shift Status */}
            <FormSection title="Shift Status">
              <FormField label="Current Status">
                <Select
                  value={editedShift.status}
                  onValueChange={(value) => handleStatusChange(value as Shift['status'])}
                >
                  <SelectTrigger className="bg-background">
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
              </FormField>

              {/* Quick status actions */}
              <div className="flex gap-2">
                {editedShift.status === 'draft' && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange('published')}>
                    Publish Shift
                  </Button>
                )}
                {editedShift.status === 'published' && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange('confirmed')}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Confirmed
                  </Button>
                )}
                {(editedShift.status === 'confirmed' || editedShift.status === 'published') && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange('completed')}>
                    Mark Completed
                  </Button>
                )}
              </div>
            </FormSection>

            {/* Room Assignment */}
            <FormSection title="Room">
              <FormField label="Room Assignment" required>
                <Select
                  value={editedShift.roomId}
                  onValueChange={(value) => setEditedShift(prev => ({ ...prev, roomId: value }))}
                >
                  <SelectTrigger className="bg-background">
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
              </FormField>
            </FormSection>

            {/* Notes */}
            <FormSection title="Notes">
              <FormField label="Shift Notes">
                <Textarea
                  value={editedShift.notes || ''}
                  onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes for this shift..."
                  rows={3}
                  className="bg-background resize-none"
                />
              </FormField>
            </FormSection>
          </div>
        </TabsContent>

        {/* Pay & Allowances Tab */}
        <TabsContent value="pay" className="flex-1 m-0 mt-4">
          <div className="space-y-6">
            <FormSection title="Shift Type">
              <ShiftTypeEditor
                shift={editedShift}
                onChange={setEditedShift}
              />
            </FormSection>

            {/* Leave Accrual Tag (RDO / ADO / TOIL) */}
            <FormSection title="Leave Accrual Tag" tooltip="On save, a ledger entry is posted for the assigned staff member">
              <Select
                value={editedShift.leaveTag ?? 'AUTO'}
                onValueChange={(v) => setEditedShift(prev => ({ ...prev, leaveTag: v as NonNullable<Shift['leaveTag']> }))}
              >
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Auto (derive from award &amp; staff enrolment)</SelectItem>
                  <SelectItem value="NONE">None — no leave impact</SelectItem>
                  <SelectItem value="RDO">Accrue RDO</SelectItem>
                  <SelectItem value="ADO">Accrue ADO</SelectItem>
                  <SelectItem value="TOIL">Accrue TOIL (bank overtime)</SelectItem>
                  <SelectItem value="RDO_LEAVE">RDO Leave — consume RDO balance</SelectItem>
                  <SelectItem value="ADO_LEAVE">ADO Leave — consume ADO balance</SelectItem>
                  <SelectItem value="TOIL_LEAVE">TOIL Leave — consume TOIL balance</SelectItem>
                </SelectContent>
              </Select>
              <a href="/leave-accruals" target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">
                Configure RDO/ADO/TOIL rules →
              </a>
            </FormSection>

            {/* On-Call Pay Breakdown - Show for on-call or recall shifts */}
            {isOnCall && (
              <OnCallPayBreakdown
                shift={editedShift}
                staff={assignedStaff}
                awardType="children_services"
              />
            )}

            {/* Manual Allowances */}
            <FormSection title="Manual Allowances" tooltip="Add one-off allowances to this shift (paid on top of auto-eligible)">
              <ManualAllowancesEditor shift={editedShift} onChange={setEditedShift} />
            </FormSection>

            {/* Allowance Eligibility */}
            <FormSection title="Auto-Eligible Allowances" tooltip="Allowances automatically detected from award rules & shift attributes">
              <AllowanceEligibilityPanel
                shift={editedShift}
                staff={assignedStaff}
              />
            </FormSection>
          </div>
        </TabsContent>

        {/* Events Tab — callbacks, sleepovers and split shifts for this shift */}
        <TabsContent value="events" className="flex-1 m-0 mt-4">
          <div className="space-y-6">
            {/* Log new event */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Log New Event</Label>
              <div className="grid grid-cols-3 gap-2">
                {isOnCall && onLogCallback && (
                  <>
                    <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col items-center gap-1 border-amber-300 hover:bg-amber-500/10" onClick={() => onLogCallback(editedShift, 'callback')}>
                      <PhoneCall className="h-4 w-4 text-amber-600" />
                      <span className="text-[10px]">Callback</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col items-center gap-1 border-destructive/50 hover:bg-destructive/10" onClick={() => onLogCallback(editedShift, 'emergency')}>
                      <Shield className="h-4 w-4 text-destructive" />
                      <span className="text-[10px]">Emergency</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col items-center gap-1 border-orange-300 hover:bg-orange-500/10" onClick={() => onLogCallback(editedShift, 'recall')}>
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-[10px]">Recall</span>
                    </Button>
                  </>
                )}
                {onLogSleepover && (
                  <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col items-center gap-1 border-purple-300 hover:bg-purple-500/10" onClick={() => onLogSleepover(editedShift)}>
                    <Moon className="h-4 w-4 text-purple-600" />
                    <span className="text-[10px]">Sleepover</span>
                  </Button>
                )}
                {onLogSplitShift && (
                  <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col items-center gap-1 border-orange-300 hover:bg-orange-500/10" onClick={() => onLogSplitShift(editedShift)}>
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="text-[10px]">Split Shift</span>
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {totalEventCount === 0 ? (
              <EmptyEvents icon={PhoneCall} message="No events logged for this shift" />
            ) : (
              <div className="space-y-6">
                {/* Callbacks */}
                {shiftCallbackEvents.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Callbacks</Label>
                    <StatTiles items={[
                      { value: `${shiftCallbackEvents.length}`, label: 'Events' },
                      { value: `${(shiftCallbackEvents.reduce((s, e) => s + e.paidMinutes, 0) / 60).toFixed(1)}h`, label: 'Total Paid' },
                      { value: `$${shiftCallbackEvents.reduce((s, e) => s + e.calculatedPay, 0).toFixed(0)}`, label: 'Total Cost' },
                    ]} />
                    {shiftCallbackEvents.map(event => {
                      const styles = {
                        callback: { icon: PhoneCall, tone: 'border-amber-300 bg-amber-500/10 text-amber-600', label: 'Callback' },
                        recall: { icon: Zap, tone: 'border-orange-300 bg-orange-500/10 text-orange-600', label: 'Recall' },
                        emergency: { icon: Shield, tone: 'border-destructive/40 bg-destructive/10 text-destructive', label: 'Emergency' },
                      };
                      const style = styles[event.callbackType] || styles.callback;
                      return (
                        <EventCard
                          key={event.id}
                          icon={style.icon}
                          label={style.label}
                          tone={style.tone}
                          status={event.status}
                          flag={(event as any).restViolation ? 'Rest Violated' : undefined}
                          rows={[
                            <EventRow key="t" icon={Clock}>{shortTime(event.workStartTime)} – {shortTime(event.workEndTime)}</EventRow>,
                            <EventRow key="p" icon={DollarSign}>
                              <span className="font-semibold text-foreground">${event.calculatedPay.toFixed(2)}</span> ({event.rateMultiplier}x)
                            </EventRow>,
                            <EventRow key="h" icon={Timer}>
                              {(event.paidMinutes / 60).toFixed(1)}h paid
                              {event.minimumEngagementApplied && ` • min ${event.minimumEngagementHours}h`}
                            </EventRow>,
                            ...(event.travelTimeMinutes > 0
                              ? [<EventRow key="v" icon={Car}>{event.travelTimeMinutes} min travel</EventRow>]
                              : []),
                          ]}
                          notes={(event.reason || event.notes) && (
                            <>
                              {event.reason && <p><span className="font-medium text-foreground">Reason:</span> {event.reason}</p>}
                              {event.notes && <p>{event.notes}</p>}
                            </>
                          )}
                          onStatusChange={onCallbackStatusChange ? (next) => onCallbackStatusChange(event.id, next) : undefined}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Sleepovers */}
                {shiftSleepoverEvents.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sleepovers</Label>
                    <StatTiles items={[
                      { value: `${shiftSleepoverEvents.length}`, label: 'Journals' },
                      { value: `${shiftSleepoverEvents.reduce((s, e) => s + e.disturbances.length, 0)}`, label: 'Disturbances' },
                      { value: `$${shiftSleepoverEvents.reduce((s, e) => s + e.totalPay, 0).toFixed(0)}`, label: 'Total Cost' },
                    ]} />
                    {shiftSleepoverEvents.map(event => (
                      <EventCard
                        key={event.id}
                        icon={Moon}
                        label="Sleepover Journal"
                        tone="border-purple-300 bg-purple-500/10 text-purple-600"
                        status={event.status}
                        flag={event.overtimeTriggered ? 'OT Triggered' : undefined}
                        rows={[
                          <EventRow key="in" icon={Clock}>Check-in: {shortTime(event.checkInTime)}</EventRow>,
                          <EventRow key="out" icon={Clock}>Check-out: {shortTime(event.checkOutTime)}</EventRow>,
                          <EventRow key="d" icon={AlertTriangle}>
                            {event.disturbances.length} disturbance{event.disturbances.length !== 1 ? 's' : ''} ({event.totalDisturbanceMinutes}min)
                          </EventRow>,
                          <EventRow key="p" icon={DollarSign}>
                            <span className="font-semibold text-foreground">${event.totalPay.toFixed(2)}</span>
                          </EventRow>,
                        ]}
                        notes={event.notes}
                        onStatusChange={onSleepoverStatusChange ? (next) => onSleepoverStatusChange(event.id, next) : undefined}
                      />
                    ))}
                  </div>
                )}

                {/* Split shifts */}
                {shiftSplitShiftEvents.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Split Shifts</Label>
                    <StatTiles items={[
                      { value: `${shiftSplitShiftEvents.length}`, label: 'Split Events' },
                      { value: `${shiftSplitShiftEvents.reduce((s, e) => s + e.segments.length, 0)}`, label: 'Segments' },
                      { value: `$${shiftSplitShiftEvents.reduce((s, e) => s + e.totalPay, 0).toFixed(0)}`, label: 'Total Cost' },
                    ]} />
                    {shiftSplitShiftEvents.map(event => (
                      <EventCard
                        key={event.id}
                        icon={Zap}
                        label="Split Shift"
                        tone="border-orange-300 bg-orange-500/10 text-orange-600"
                        status={event.status}
                        flag={!event.gapCompliant ? 'Non-compliant' : undefined}
                        rows={[
                          <EventRow key="s" icon={Clock}>{event.segments.length} segments</EventRow>,
                          <EventRow key="g" icon={Timer}>{event.gapMinutes}min gap</EventRow>,
                          <EventRow key="a" icon={Zap}>Allowance: ${event.splitShiftAllowance.toFixed(2)}</EventRow>,
                          <EventRow key="p" icon={DollarSign}>
                            <span className="font-semibold text-foreground">${event.totalPay.toFixed(2)}</span>
                          </EventRow>,
                        ]}
                        notes={event.notes}
                        onStatusChange={onSplitShiftStatusChange ? (next) => onSplitShiftStatusChange(event.id, next) : undefined}
                      />
                    ))}
                  </div>
                )}
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
