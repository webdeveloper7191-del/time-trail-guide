import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Shift, Room, ShiftTemplate, Centre, StaffMember } from '@/types/roster';
import { RosterTemplate, TemplateMatchResult } from '@/types/rosterTemplates';
import { format, addDays, startOfWeek } from 'date-fns';
import { FileStack, Check, Plus, ArrowRight, Layers } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CentreSelector } from './CentreSelector';
import { cn } from '@/lib/utils';
import {
  isBlockedOnDate,
  evaluateRetention,
  staffCohortLabels,
  resolveStaffCohort,
  type RetentionMode,
  type StaffCohort,
} from '@/lib/staffRetention';

interface ApplyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  rosterTemplates: RosterTemplate[];
  shiftTemplates: ShiftTemplate[];
  existingShifts: Shift[];
  rooms: Room[];
  centreId: string;
  centres?: Centre[];
  staff?: StaffMember[];
  currentDate: Date;
  onApply: (shifts: Omit<Shift, 'id'>[]) => void;
}

export function ApplyTemplateModal({
  open,
  onClose,
  rosterTemplates: allRosterTemplates,
  shiftTemplates,
  existingShifts,
  rooms: defaultRooms,
  centreId,
  centres,
  staff = [],
  currentDate,
  onApply
}: ApplyTemplateModalProps) {
  const [activeCentreId, setActiveCentreId] = useState(centreId);
  const rooms = useMemo(() => {
    if (centres) {
      const centre = centres.find(c => c.id === activeCentreId);
      return centre?.rooms || [];
    }
    return defaultRooms;
  }, [centres, activeCentreId, defaultRooms]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [skipExisting, setSkipExisting] = useState(true);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [staffMode, setStaffMode] = useState<RetentionMode>('keep_all');
  const [retainCohorts, setRetainCohorts] = useState<Record<StaffCohort, boolean>>({
    full_time: true,
    part_time: true,
    casual: false,
    agency: false,
  });
  const [releaseOnLeaveOrRdo, setReleaseOnLeaveOrRdo] = useState(true);
  /** Per-row manual staff override: templateShift.id -> staffId ('' = open shift). */
  const [staffOverrides, setStaffOverrides] = useState<Record<string, string>>({});

  const staffById = useMemo(() => new Map(staff.map(s => [s.id, s])), [staff]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Only show templates saved for the active location (fall back to all if none match).
  const rosterTemplates = useMemo(() => {
    const scoped = allRosterTemplates.filter(t => t.centreId === activeCentreId);
    return scoped;
  }, [allRosterTemplates, activeCentreId]);

  const selectedTemplate = rosterTemplates.find(t => t.id === selectedTemplateId);

  // Reset the template when it no longer belongs to the active location.
  useEffect(() => {
    if (selectedTemplateId && !rosterTemplates.some(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId('');
    }
  }, [rosterTemplates, selectedTemplateId]);

  // Reset all state when reopened.
  useEffect(() => {
    if (open) {
      setActiveCentreId(centreId);
      setSelectedTemplateId('');
      setSelectedShifts(new Set());
      setSkipExisting(true);
      setStaffMode('keep_all');
      setRetainCohorts({ full_time: true, part_time: true, casual: false, agency: false });
      setReleaseOnLeaveOrRdo(true);
      setStaffOverrides({});
    }
  }, [open, centreId]);

  const matchResults = useMemo((): TemplateMatchResult[] => {
    if (!selectedTemplate) return [];

    return selectedTemplate.shifts.map(templateShift => {
      const targetDate = dates.find(d => d.getDay() === templateShift.dayOfWeek);
      if (!targetDate) {
        return {
          templateShift,
          date: '',
          action: 'skip' as const,
          reason: 'Day not in range'
        };
      }

      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      // Only skip if there's an exactly matching OPEN shift (same room, date, time)
      // This allows adding template shifts even if staff shifts exist at same time/place
      const existingShift = skipExisting ? existingShifts.find(s => {
        // Be defensive: treat a shift as "open" only if it's truly unassigned.
        // Some flows may accidentally set isOpenShift=true on assigned shifts.
        const isTrulyOpen = !s.staffId;

        return (
          s.centreId === activeCentreId &&
          s.roomId === templateShift.roomId &&
          s.date === dateStr &&
          s.startTime === templateShift.startTime &&
          s.endTime === templateShift.endTime &&
          isTrulyOpen
        );
      }) : undefined;

      if (existingShift) {
        return {
          templateShift,
          existingShift,
          date: dateStr,
          action: 'skip' as const,
          reason: 'Open shift already exists'
        };
      }

      return {
        templateShift,
        date: dateStr,
        action: 'add' as const
      };
    });
  }, [selectedTemplate, dates, existingShifts, activeCentreId, skipExisting]);

  const templateHasStaff = !!selectedTemplate?.shifts.some(ts => !!ts.staffId);

  const retentionRules = useMemo(
    () => ({
      mode: staffMode,
      retainCohorts,
      releaseOutcome: 'open_shift' as const,
      releaseOnLeaveOrRdo,
    }),
    [staffMode, retainCohorts, releaseOnLeaveOrRdo],
  );

  /**
   * Staff for a template shift: manual override wins, otherwise the saved staff member
   * subject to the retention rules (cohort + leave/RDO).
   */
  const resolveStaffId = (templateShift: { id: string; staffId?: string }, date: string) => {
    const override = staffOverrides[templateShift.id];
    if (override !== undefined) {
      if (!override) return '';
      const member = staffById.get(override);
      if (member && releaseOnLeaveOrRdo && isBlockedOnDate(member, date).blocked) return '';
      return override;
    }
    if (!templateShift.staffId || !date) return '';
    const member = staffById.get(templateShift.staffId);
    const decision = evaluateRetention(member, date, retentionRules);
    return decision.retained ? templateShift.staffId : '';
  };

  /** Why a saved staff member was dropped, for the row hint. */
  const releaseReason = (templateShift: { id: string; staffId?: string }, date: string) => {
    if (staffOverrides[templateShift.id] !== undefined) return undefined;
    if (!templateShift.staffId || !date) return undefined;
    const member = staffById.get(templateShift.staffId);
    const decision = evaluateRetention(member, date, retentionRules);
    return decision.retained ? undefined : decision.reason;
  };

  const shiftsToAdd = useMemo(() => matchResults.filter(r => r.action === 'add'), [matchResults]);
  const shiftsToSkip = matchResults.filter(r => r.action === 'skip');

  // Explicit selection: every addable shift starts ticked.
  useEffect(() => {
    setSelectedShifts(new Set(shiftsToAdd.map(r => r.templateShift.id)));
  }, [shiftsToAdd]);

  const selectedAddable = shiftsToAdd.filter(r => selectedShifts.has(r.templateShift.id));
  const assignedCount = selectedAddable.filter(
    r => !!resolveStaffId(r.templateShift, r.date)
  ).length;

  const handleApply = () => {
    const newShifts: Omit<Shift, 'id'>[] = selectedAddable.map(result => {
      const staffId = resolveStaffId(result.templateShift, result.date);
      return {
        staffId,
        centreId: activeCentreId,
        roomId: result.templateShift.roomId,
        date: result.date,
        startTime: result.templateShift.startTime,
        endTime: result.templateShift.endTime,
        breakMinutes: result.templateShift.breakMinutes,
        status: 'draft' as const,
        isOpenShift: !staffId,
        notes: result.templateShift.notes,
      };
    });

    onApply(newShifts);
    toast.success(`${newShifts.length} shift${newShifts.length === 1 ? '' : 's'} added`, {
      description: `${assignedCount} assigned to staff · ${shiftsToSkip.length} skipped`,
    });
    onClose();
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts(prev => {
      const next = new Set(prev);
      if (next.has(shiftId)) {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedShifts(new Set(shiftsToAdd.map(r => r.templateShift.id)));
  };

  const deselectAll = () => {
    setSelectedShifts(new Set());
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Apply Roster Template"
      description="Apply a saved template to the current week"
      icon={FileStack}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { 
          label: `Apply ${selectedAddable.length} Shift${selectedAddable.length === 1 ? '' : 's'}`, 
          onClick: handleApply, 
          variant: 'primary',
          disabled: !selectedTemplate || selectedAddable.length === 0,
          icon: <Plus size={16} />
        },
      ]}
    >
      <div className="space-y-5">
        {/* Location Selector */}
        {centres && centres.length > 0 && (
          <FormSection title="Location">
            <CentreSelector
              centres={centres}
              selectedCentreId={activeCentreId}
              onCentreChange={setActiveCentreId}
            />
          </FormSection>
        )}

        {/* Template Selection */}
        <FormSection title="Select Template">
          <FormField label="Template" required tooltip="Choose a saved roster template to apply">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="bg-background h-11">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {rosterTemplates.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No templates saved for this location yet
                  </div>
                ) : (
                  rosterTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary" />
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {template.shifts.length} shifts
                        </Badge>
                        {template.shifts.some(s => !!s.staffId) && (
                          <Badge variant="outline" className="text-xs">with staff</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        {selectedTemplate && (
          <>
            {/* Options */}
            <FormSection title="Options">
              <div className="flex items-center justify-between bg-background rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={skipExisting}
                    onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
                  />
                  <span className="text-sm">Skip existing shifts (don't overwrite)</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
                </div>
              </div>

              <div className="bg-background rounded-lg border p-4 mt-3 space-y-3">
                <div>
                  <p className="text-sm font-medium">Staff on applied shifts</p>
                  <p className="text-xs text-muted-foreground">
                    Choose which saved assignments carry over. Anything not kept becomes an open shift,
                    and you can still change any individual row below.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'unassign_all', label: 'Without staff' },
                    { value: 'keep_all', label: 'With all staff' },
                    { value: 'by_type', label: 'By staff type' },
                  ] as { value: RetentionMode; label: string }[]).map(opt => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={staffMode === opt.value ? 'default' : 'outline'}
                      onClick={() => setStaffMode(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>

                {staffMode === 'by_type' && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    {(Object.keys(staffCohortLabels) as StaffCohort[]).map(cohort => (
                      <label key={cohort} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={retainCohorts[cohort]}
                          onCheckedChange={(checked) =>
                            setRetainCohorts(prev => ({ ...prev, [cohort]: checked as boolean }))
                          }
                        />
                        {staffCohortLabels[cohort]}
                      </label>
                    ))}
                  </div>
                )}

                {staffMode !== 'unassign_all' && (
                  <label className="flex items-center gap-2 text-sm pt-1">
                    <Checkbox
                      checked={releaseOnLeaveOrRdo}
                      onCheckedChange={(checked) => setReleaseOnLeaveOrRdo(checked as boolean)}
                    />
                    Release staff on approved leave or an RDO for the target date
                  </label>
                )}
              </div>

            </FormSection>

            {/* Summary */}
            <FormSection title="Preview">
              <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
                <div className="flex items-center gap-1.5 text-primary">
                  <Plus size={16} />
                  <span className="text-sm font-medium">{selectedAddable.length} of {shiftsToAdd.length} to add</span>
                </div>
                {templateHasStaff && applyWithStaff && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-sm">{assignedCount} with staff</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Check size={16} />
                  <span className="text-sm">{shiftsToSkip.length} will be skipped</span>
                </div>
              </div>
            </FormSection>

            {/* Shifts Table */}
            <FormSection title="Shifts to Apply">
              <div className="bg-background rounded-lg border overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[32px_1fr_20px_104px_92px_170px_64px] items-center gap-3 px-4 py-2 bg-muted/50 border-b">
                  <div />
                  <span className="text-xs font-medium text-muted-foreground">Room</span>
                  <div />
                  <span className="text-xs font-medium text-muted-foreground">Date</span>
                  <span className="text-xs font-medium text-muted-foreground">Time</span>
                  <span className="text-xs font-medium text-muted-foreground text-right">Status</span>
                </div>
                
                <ScrollArea className="h-64">
                  <div className="divide-y divide-border">
                    {matchResults.map((result, idx) => {
                      const room = rooms.find(r => r.id === result.templateShift.roomId);
                      const isSelected = selectedShifts.has(result.templateShift.id);
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => result.action === 'add' && toggleShift(result.templateShift.id)}
                          className={cn(
                            "grid grid-cols-[32px_1fr_20px_104px_92px_170px_64px] items-center gap-3 px-4 py-3 transition-all",
                            result.action === 'skip' ? "opacity-60" : "cursor-pointer hover:bg-primary/5",
                            result.action === 'add' && isSelected && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-center">
                            {result.action === 'add' ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleShift(result.templateShift.id)}
                                className="border-primary data-[state=checked]:bg-primary"
                              />
                            ) : (
                              <Check size={16} className="text-muted-foreground/40" />
                            )}
                          </div>
                          
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected && result.action === 'add' ? "text-primary" : "text-foreground"
                          )}>
                            {room?.name || 'Unknown'}
                          </span>
                          <ArrowRight size={12} className="text-muted-foreground/40" />
                          <span className="text-sm">
                            {result.date ? format(new Date(result.date), 'EEE, MMM d') : 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {result.templateShift.startTime} - {result.templateShift.endTime}
                          </span>
                          <div onClick={(e) => e.stopPropagation()}>
                            {result.action === 'add' ? (
                              <>
                                <Select
                                  value={resolveStaffId(result.templateShift, result.date) || '__open__'}
                                  onValueChange={(value) =>
                                    setStaffOverrides(prev => ({
                                      ...prev,
                                      [result.templateShift.id]: value === '__open__' ? '' : value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Open shift" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover z-50">
                                    <SelectItem value="__open__">Open shift</SelectItem>
                                    {staff.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                        {resolveStaffCohort(s)
                                          ? ` · ${staffCohortLabels[resolveStaffCohort(s)!]}`
                                          : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(() => {
                                  const reason = releaseReason(result.templateShift, result.date);
                                  return reason ? (
                                    <span className="block text-[11px] text-muted-foreground mt-1">{reason}</span>
                                  ) : null;
                                })()}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <Badge 
                              variant={result.action === 'add' && isSelected ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs",
                                result.action === 'add' && isSelected && "bg-primary text-primary-foreground"
                              )}
                            >
                              {result.action === 'add' ? 'Add' : 'Skip'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </FormSection>
          </>
        )}

        {!selectedTemplate && rosterTemplates.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-background rounded-lg border">
            <FileStack size={48} className="opacity-20 mb-2" />
            <p className="text-sm">Select a template to preview shifts</p>
          </div>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
