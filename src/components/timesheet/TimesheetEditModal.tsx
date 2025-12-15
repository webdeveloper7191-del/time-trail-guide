import { useState, useEffect } from 'react';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { AppliedAllowance, AwardType } from '@/types/allowances';
import { AllowanceEditor } from './AllowanceEditor';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  X,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  Coffee,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
      // Expand all days by default
      setExpandedDays(timesheet.entries.map((e) => e.id));
    }
  }, [timesheet]);

  if (!timesheet) return null;

  const handleEntryChange = (
    index: number,
    field: keyof ClockEntry,
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Recalculate hours when clock times change
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
    
    // Recalculate break duration
    if (field === 'startTime' || field === 'endTime') {
      const breakEntry = breaks[breakIndex];
      if (breakEntry.startTime && breakEntry.endTime) {
        const duration = calculateMinutesBetween(breakEntry.startTime, breakEntry.endTime);
        breaks[breakIndex].duration = duration;
      }
    }
    
    newEntries[entryIndex].breaks = breaks;
    
    // Recalculate total break minutes and net hours
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
    
    // Recalculate totals
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
    
    // Recalculate totals
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
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const toggleDay = (entryId: string) => {
    setExpandedDays((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSave = () => {
    const totalHours = entries.reduce((sum, e) => sum + e.netHours, 0);
    const totalBreakMinutes = entries.reduce((sum, e) => sum + e.totalBreakMinutes, 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = entries.reduce((sum, e) => sum + e.overtime, 0);

    const updatedTimesheet: Timesheet = {
      ...timesheet,
      entries,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      totalBreakMinutes,
      notes,
      appliedAllowances,
      awardType,
    };

    onSave(updatedTimesheet);
    toast({
      title: 'Timesheet Updated',
      description: 'The timesheet has been successfully updated.',
    });
    onClose();
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'EEE, MMM d');
  };

  const hasIssues = (entry: ClockEntry) => {
    return !entry.clockOut || entry.netHours === 0;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Timesheet
          </DialogTitle>
          <DialogDescription>
            Modify clock entries and breaks for {timesheet.employee.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-4">
            {/* Employee Info Banner */}
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{timesheet.employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
                    {format(new Date(timesheet.weekEndDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Current Total</p>
                  <p className="font-semibold text-lg">
                    {entries.reduce((sum, e) => sum + e.netHours, 0).toFixed(2)}h
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Entries */}
            <div className="space-y-3">
              {entries.map((entry, entryIndex) => {
                const isExpanded = expandedDays.includes(entry.id);
                const hasIssue = hasIssues(entry);

                return (
                  <Collapsible
                    key={entry.id}
                    open={isExpanded}
                    onOpenChange={() => toggleDay(entry.id)}
                    className={cn(
                      'rounded-lg border border-border overflow-hidden',
                      hasIssue && 'border-status-rejected/50'
                    )}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{getDayName(entry.date)}</span>
                        {hasIssue && (
                          <AlertCircle className="h-4 w-4 text-status-rejected" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{entry.clockIn}</span>
                          <span>→</span>
                          <span className={cn(!entry.clockOut && 'text-status-rejected')}>
                            {entry.clockOut || '--:--'}
                          </span>
                        </div>
                        <Badge variant="secondary">{entry.netHours}h</Badge>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4 bg-muted/30">
                        {/* Clock In/Out */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Clock In</Label>
                            <Input
                              type="time"
                              value={entry.clockIn}
                              onChange={(e) =>
                                handleEntryChange(entryIndex, 'clockIn', e.target.value)
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Clock Out</Label>
                            <Input
                              type="time"
                              value={entry.clockOut || ''}
                              onChange={(e) =>
                                handleEntryChange(entryIndex, 'clockOut', e.target.value)
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Hours Summary */}
                        <div className="grid grid-cols-4 gap-2 text-sm bg-background rounded-md p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Gross</p>
                            <p className="font-medium">{entry.grossHours}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Breaks</p>
                            <p className="font-medium">{formatMinutesToTime(entry.totalBreakMinutes)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Net</p>
                            <p className="font-medium">{entry.netHours}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Overtime</p>
                            <p className={cn('font-medium', entry.overtime > 0 && 'text-status-pending')}>
                              {entry.overtime > 0 ? `+${entry.overtime}h` : '0h'}
                            </p>
                          </div>
                        </div>

                        {/* Breaks Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                              <Coffee className="h-4 w-4" /> Breaks
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addBreak(entryIndex)}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Break
                            </Button>
                          </div>

                          {entry.breaks.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">
                              No breaks recorded
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {entry.breaks.map((breakEntry, breakIndex) => (
                                <div
                                  key={breakEntry.id}
                                  className="flex items-center gap-2 bg-background rounded-md p-2"
                                >
                                  <Select
                                    value={breakEntry.type}
                                    onValueChange={(value) =>
                                      handleBreakChange(
                                        entryIndex,
                                        breakIndex,
                                        'type',
                                        value as BreakEntry['type']
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs">
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
                                      handleBreakChange(
                                        entryIndex,
                                        breakIndex,
                                        'startTime',
                                        e.target.value
                                      )
                                    }
                                    className="w-24 h-8 text-xs"
                                  />
                                  <span className="text-muted-foreground">to</span>
                                  <Input
                                    type="time"
                                    value={breakEntry.endTime || ''}
                                    onChange={(e) =>
                                      handleBreakChange(
                                        entryIndex,
                                        breakIndex,
                                        'endTime',
                                        e.target.value
                                      )
                                    }
                                    className="w-24 h-8 text-xs"
                                  />
                                  <Badge variant="outline" className="text-xs min-w-[50px] justify-center">
                                    {formatMinutesToTime(breakEntry.duration)}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBreak(entryIndex, breakIndex)}
                                    className="h-8 w-8 p-0 text-status-rejected hover:text-status-rejected hover:bg-status-rejected-bg"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Entry Notes */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Day Notes</Label>
                          <Input
                            value={entry.notes || ''}
                            onChange={(e) =>
                              handleEntryChange(entryIndex, 'notes', e.target.value)
                            }
                            placeholder="Add notes for this day..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            <Separator />

            {/* Allowances Editor */}
            <AllowanceEditor
              allowances={appliedAllowances}
              entries={entries}
              awardType={awardType}
              onAwardTypeChange={setAwardType}
              onAllowancesChange={setAppliedAllowances}
            />

            <Separator />

            {/* Admin Notes */}
            <div>
              <Label className="text-sm font-medium">Admin Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for this timesheet..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">
              {entries.reduce((sum, e) => sum + e.netHours, 0).toFixed(2)}h
            </span>
            {entries.reduce((sum, e) => sum + e.overtime, 0) > 0 && (
              <span className="text-status-pending ml-2">
                (+{entries.reduce((sum, e) => sum + e.overtime, 0).toFixed(2)}h OT)
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
