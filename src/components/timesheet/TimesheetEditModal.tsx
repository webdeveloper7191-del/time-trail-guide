import { useState, useEffect } from 'react';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { AppliedAllowance, AwardType } from '@/types/allowances';
import { AllowanceEditor } from './AllowanceEditor';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  Coffee,
  AlertCircle,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TimesheetEditModalProps {
  timesheet: Timesheet | null;
  open: boolean;
  onClose: () => void;
  onSave: (timesheet: Timesheet) => void;
}

export function TimesheetEditModal({
  timesheet,
  open,
  onClose,
  onSave,
}: TimesheetEditModalProps) {
  const [entries, setEntries] = useState<ClockEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [appliedAllowances, setAppliedAllowances] = useState<AppliedAllowance[]>([]);
  const [awardType, setAwardType] = useState<AwardType>('children_services');

  useEffect(() => {
    if (timesheet) {
      setEntries(JSON.parse(JSON.stringify(timesheet.entries)));
      setNotes(timesheet.notes || '');
      setAppliedAllowances(timesheet.appliedAllowances || []);
      setAwardType(timesheet.awardType || 'children_services');
      setExpandedDays([]);
    }
  }, [timesheet]);

  if (!timesheet) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const handleEntryChange = (
    index: number,
    field: keyof ClockEntry,
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    if (field === 'clockIn' || field === 'clockOut') {
      const entry = newEntries[index];
      if (entry.clockIn && entry.clockOut) {
        const grossHours = calculateHoursBetween(entry.clockIn, entry.clockOut);
        const breakMinutes = entry.totalBreakMinutes;
        const netHours = Math.max(0, grossHours - breakMinutes / 60);
        newEntries[index].grossHours = Math.round(grossHours * 100) / 100;
        newEntries[index].netHours = Math.round(netHours * 100) / 100;
        newEntries[index].overtime = Math.max(0, Math.round((netHours - 8) * 100) / 100);
      }
    }
    
    setEntries(newEntries);
  };

  const handleBreakChange = (
    entryIndex: number,
    breakIndex: number,
    field: 'startTime' | 'endTime' | 'type',
    value: string
  ) => {
    const newEntries = [...entries];
    const breaks = [...newEntries[entryIndex].breaks];
    breaks[breakIndex] = { ...breaks[breakIndex], [field]: value };
    
    if (field === 'startTime' || field === 'endTime') {
      const breakEntry = breaks[breakIndex];
      if (breakEntry.startTime && breakEntry.endTime) {
        const duration = calculateMinutesBetween(breakEntry.startTime, breakEntry.endTime);
        breaks[breakIndex].duration = duration;
      }
    }
    
    newEntries[entryIndex].breaks = breaks;
    
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    newEntries[entryIndex].totalBreakMinutes = totalBreakMinutes;
    
    if (newEntries[entryIndex].clockIn && newEntries[entryIndex].clockOut) {
      const grossHours = calculateHoursBetween(
        newEntries[entryIndex].clockIn,
        newEntries[entryIndex].clockOut!
      );
      const netHours = Math.max(0, grossHours - totalBreakMinutes / 60);
      newEntries[entryIndex].grossHours = Math.round(grossHours * 100) / 100;
      newEntries[entryIndex].netHours = Math.round(netHours * 100) / 100;
      newEntries[entryIndex].overtime = Math.max(0, Math.round((netHours - 8) * 100) / 100);
    }
    
    setEntries(newEntries);
  };

  const addBreak = (entryIndex: number) => {
    const newEntries = [...entries];
    const newBreak: BreakEntry = {
      id: `break-${Date.now()}`,
      startTime: '12:00',
      endTime: '12:30',
      duration: 30,
      type: 'lunch',
    };
    newEntries[entryIndex].breaks = [...newEntries[entryIndex].breaks, newBreak];
    
    const totalBreakMinutes = newEntries[entryIndex].breaks.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    );
    newEntries[entryIndex].totalBreakMinutes = totalBreakMinutes;
    
    if (newEntries[entryIndex].clockIn && newEntries[entryIndex].clockOut) {
      const grossHours = calculateHoursBetween(
        newEntries[entryIndex].clockIn,
        newEntries[entryIndex].clockOut!
      );
      const netHours = Math.max(0, grossHours - totalBreakMinutes / 60);
      newEntries[entryIndex].netHours = Math.round(netHours * 100) / 100;
      newEntries[entryIndex].overtime = Math.max(0, Math.round((netHours - 8) * 100) / 100);
    }
    
    setEntries(newEntries);
  };

  const removeBreak = (entryIndex: number, breakIndex: number) => {
    const newEntries = [...entries];
    newEntries[entryIndex].breaks = newEntries[entryIndex].breaks.filter(
      (_, i) => i !== breakIndex
    );
    
    const totalBreakMinutes = newEntries[entryIndex].breaks.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    );
    newEntries[entryIndex].totalBreakMinutes = totalBreakMinutes;
    
    if (newEntries[entryIndex].clockIn && newEntries[entryIndex].clockOut) {
      const grossHours = calculateHoursBetween(
        newEntries[entryIndex].clockIn,
        newEntries[entryIndex].clockOut!
      );
      const netHours = Math.max(0, grossHours - totalBreakMinutes / 60);
      newEntries[entryIndex].netHours = Math.round(netHours * 100) / 100;
      newEntries[entryIndex].overtime = Math.max(0, Math.round((netHours - 8) * 100) / 100);
    }
    
    setEntries(newEntries);
  };

  const calculateHoursBetween = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM - startH * 60 - startM) / 60;
  };

  const calculateMinutesBetween = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return endH * 60 + endM - startH * 60 - startM;
  };

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const toggleDay = (entryId: string) => {
    setExpandedDays((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSave = () => {
    // Mark entries as edited and store original values if changed
    const updatedEntries = entries.map((entry, index) => {
      const originalEntry = timesheet.entries[index];
      const clockInChanged = entry.clockIn !== originalEntry.clockIn;
      const clockOutChanged = entry.clockOut !== originalEntry.clockOut;
      const breaksChanged = JSON.stringify(entry.breaks) !== JSON.stringify(originalEntry.breaks);
      
      if (clockInChanged || clockOutChanged || breaksChanged) {
        return {
          ...entry,
          wasEdited: true,
          editedAt: new Date().toISOString(),
          editedBy: 'Admin', // In real app, get from auth context
          originalClockIn: entry.originalClockIn || originalEntry.clockIn,
          originalClockOut: entry.originalClockOut !== undefined ? entry.originalClockOut : originalEntry.clockOut,
          originalBreaks: entry.originalBreaks || originalEntry.breaks,
        };
      }
      return entry;
    });

    const totalHours = updatedEntries.reduce((sum, e) => sum + e.netHours, 0);
    const totalBreakMinutes = updatedEntries.reduce((sum, e) => sum + e.totalBreakMinutes, 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = updatedEntries.reduce((sum, e) => sum + e.overtime, 0);

    const updatedTimesheet: Timesheet = {
      ...timesheet,
      entries: updatedEntries,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      totalBreakMinutes,
      notes,
      appliedAllowances,
      awardType,
    };

    onSave(updatedTimesheet);
    toast.success('Timesheet updated successfully');
    onClose();
  };

  const getDayName = (dateStr: string) => format(new Date(dateStr), 'EEE');
  const getDayDate = (dateStr: string) => format(new Date(dateStr), 'd');

  const hasIssues = (entry: ClockEntry) => !entry.clockOut || entry.netHours === 0;

  const totalNetHours = entries.reduce((sum, e) => sum + e.netHours, 0);
  const totalOvertime = entries.reduce((sum, e) => sum + e.overtime, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-lg font-semibold">Edit Timesheet</SheetTitle>
          <SheetDescription className="sr-only">
            Edit timesheet entries for {timesheet.employee.name}
          </SheetDescription>
        </SheetHeader>

        {/* Employee Card */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(timesheet.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{timesheet.employee.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(timesheet.weekStartDate), 'MMM d')} - {format(new Date(timesheet.weekEndDate), 'MMM d')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{totalNetHours.toFixed(1)}h</p>
              {totalOvertime > 0 && (
                <p className="text-xs text-amber-600">+{totalOvertime.toFixed(1)}h OT</p>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Daily Entries */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">Daily Entries</Label>
              {entries.map((entry, entryIndex) => {
                const isExpanded = expandedDays.includes(entry.id);
                const hasIssue = hasIssues(entry);

                return (
                  <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => toggleDay(entry.id)}>
                    <CollapsibleTrigger className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      "hover:bg-muted/50",
                      hasIssue ? "border-amber-500/50 bg-amber-500/5" : "border-border",
                      isExpanded && "rounded-b-none border-b-0"
                    )}>
                      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">{getDayName(entry.date)}</span>
                        <span className="text-sm font-bold -mt-0.5">{getDayDate(entry.date)}</span>
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{entry.clockIn}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn("font-medium", !entry.clockOut && "text-amber-600")}>
                            {entry.clockOut || '--:--'}
                          </span>
                          {hasIssue && <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.breaks.length} break{entry.breaks.length !== 1 ? 's' : ''} · {formatMinutesToTime(entry.totalBreakMinutes)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{entry.netHours}h</p>
                        {entry.overtime > 0 && (
                          <p className="text-xs text-amber-600">+{entry.overtime} OT</p>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className={cn(
                        "px-4 pb-4 pt-4 space-y-4 border border-t-0 rounded-b-lg",
                        hasIssue ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-muted/20"
                      )}>
                        {/* Time inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Clock In</Label>
                            <Input
                              type="time"
                              value={entry.clockIn}
                              onChange={(e) => handleEntryChange(entryIndex, 'clockIn', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Clock Out</Label>
                            <Input
                              type="time"
                              value={entry.clockOut || ''}
                              onChange={(e) => handleEntryChange(entryIndex, 'clockOut', e.target.value)}
                              className="h-10"
                            />
                          </div>
                        </div>

                        {/* Hours summary */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-background">
                            <p className="text-lg font-bold">{entry.grossHours}h</p>
                            <p className="text-[10px] uppercase text-muted-foreground">Gross</p>
                          </div>
                          <div className="p-2 rounded-lg bg-background">
                            <p className="text-lg font-bold">{entry.netHours}h</p>
                            <p className="text-[10px] uppercase text-muted-foreground">Net</p>
                          </div>
                          <div className="p-2 rounded-lg bg-background">
                            <p className={cn("text-lg font-bold", entry.overtime > 0 && "text-amber-600")}>
                              {entry.overtime > 0 ? `+${entry.overtime}h` : '0h'}
                            </p>
                            <p className="text-[10px] uppercase text-muted-foreground">Overtime</p>
                          </div>
                        </div>

                        {/* Breaks */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                              <Coffee className="h-3.5 w-3.5" /> Breaks ({formatMinutesToTime(entry.totalBreakMinutes)})
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addBreak(entryIndex)}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>

                          {entry.breaks.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-3 bg-background rounded-lg">No breaks recorded</p>
                          ) : (
                            <div className="space-y-2">
                              {entry.breaks.map((breakEntry, breakIndex) => (
                                <div key={breakEntry.id} className="flex items-center gap-2 bg-background rounded-lg p-2.5">
                                  <Select
                                    value={breakEntry.type}
                                    onValueChange={(value) =>
                                      handleBreakChange(entryIndex, breakIndex, 'type', value as BreakEntry['type'])
                                    }
                                  >
                                    <SelectTrigger className="w-20 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="lunch">Lunch</SelectItem>
                                      <SelectItem value="short">Short</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="time"
                                    value={breakEntry.startTime}
                                    onChange={(e) =>
                                      handleBreakChange(entryIndex, breakIndex, 'startTime', e.target.value)
                                    }
                                    className="w-[90px] h-8 text-xs"
                                  />
                                  <span className="text-muted-foreground text-xs">→</span>
                                  <Input
                                    type="time"
                                    value={breakEntry.endTime || ''}
                                    onChange={(e) =>
                                      handleBreakChange(entryIndex, breakIndex, 'endTime', e.target.value)
                                    }
                                    className="w-[90px] h-8 text-xs"
                                  />
                                  <Badge variant="secondary" className="text-xs min-w-[50px] justify-center">
                                    {formatMinutesToTime(breakEntry.duration)}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBreak(entryIndex, breakIndex)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            {/* Allowances */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Allowances</Label>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <AllowanceEditor
                  allowances={appliedAllowances}
                  entries={entries}
                  awardType={awardType}
                  onAwardTypeChange={setAwardType}
                  onAllowancesChange={setAppliedAllowances}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Admin Notes */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block px-1">Admin Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add admin notes..."
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
