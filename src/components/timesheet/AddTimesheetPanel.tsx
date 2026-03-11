import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { locations } from '@/data/mockTimesheets';
import { Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import { formatTime12h } from '@/lib/timeFormat';

interface AddTimesheetPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd: (timesheet: Timesheet) => void;
}

interface EntryForm {
  date: string;
  clockIn: string;
  clockOut: string;
  breakStart: string;
  breakEnd: string;
  notes: string;
}

const emptyEntry = (): EntryForm => ({
  date: '',
  clockIn: '09:00',
  clockOut: '17:00',
  breakStart: '12:00',
  breakEnd: '12:30',
  notes: '',
});

export function AddTimesheetPanel({ open, onClose, onAdd }: AddTimesheetPanelProps) {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [locationId, setLocationId] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [entries, setEntries] = useState<EntryForm[]>([emptyEntry()]);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setEmployeeName('');
    setEmployeeEmail('');
    setDepartment('');
    setPosition('');
    setLocationId('');
    setWeekStartDate('');
    setEntries([emptyEntry()]);
    setNotes('');
  };

  const addEntry = () => {
    setEntries(prev => [...prev, emptyEntry()]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof EntryForm, value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
  };

  const handleSubmit = () => {
    if (!employeeName || !employeeEmail || !department || !locationId || !weekStartDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (entries.length === 0) {
      toast.error('Add at least one time entry');
      return;
    }

    const location = locations.find(l => l.id === locationId)!;
    const id = `TS-${Date.now()}`;
    const employeeId = `E-${Date.now()}`;

    const clockEntries: ClockEntry[] = entries.map((entry, i) => {
      const grossHours = calculateHours(entry.clockIn, entry.clockOut);
      const breakMinutes = calculateHours(entry.breakStart, entry.breakEnd) * 60;
      const netHours = Math.max(0, grossHours - breakMinutes / 60);
      const breaks: BreakEntry[] = entry.breakStart && entry.breakEnd ? [{
        id: `brk-${i}`,
        startTime: entry.breakStart,
        endTime: entry.breakEnd,
        duration: breakMinutes,
        type: 'lunch' as const,
      }] : [];

      return {
        id: `entry-${i}`,
        date: entry.date || weekStartDate,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        breaks,
        totalBreakMinutes: breakMinutes,
        grossHours,
        netHours,
        overtime: Math.max(0, netHours - 8),
        notes: entry.notes,
      };
    });

    const totalHours = clockEntries.reduce((s, e) => s + e.netHours, 0);
    const overtimeHours = clockEntries.reduce((s, e) => s + e.overtime, 0);
    const totalBreakMinutes = clockEntries.reduce((s, e) => s + e.totalBreakMinutes, 0);

    const timesheet: Timesheet = {
      id,
      employee: {
        id: employeeId,
        name: employeeName,
        email: employeeEmail,
        department,
        position: position || 'Staff',
      },
      location,
      weekStartDate,
      weekEndDate: format(addDays(parseISO(weekStartDate), 6), 'yyyy-MM-dd'),
      status: 'pending',
      entries: clockEntries,
      totalHours,
      regularHours: totalHours - overtimeHours,
      overtimeHours,
      totalBreakMinutes,
      submittedAt: new Date().toISOString(),
      notes,
    };

    onAdd(timesheet);
    resetForm();
    onClose();
    toast.success('Timesheet added successfully');
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Add Timesheet
          </SheetTitle>
          <SheetDescription>Create a new timesheet entry with employee details and clock times.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            {/* Employee Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Employee Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name *</Label>
                  <Input placeholder="John Smith" value={employeeName} onChange={e => setEmployeeName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" placeholder="john@company.com" value={employeeEmail} onChange={e => setEmployeeEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Department *</Label>
                  <Input placeholder="Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Position</Label>
                  <Input placeholder="Developer" value={position} onChange={e => setPosition(e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location & Week */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assignment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Location *</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Week Starting *</Label>
                  <Input type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Time Entries</h3>
                <Button variant="outline" size="sm" onClick={addEntry}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {entries.map((entry, i) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {entry.clockIn && entry.clockOut && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime12h(entry.clockIn)} – {formatTime12h(entry.clockOut)}
                        </span>
                      )}
                      {entries.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEntry(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Date</Label>
                      <Input type="date" className="h-8 text-xs" value={entry.date} onChange={e => updateEntry(i, 'date', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Clock In</Label>
                      <Input type="time" className="h-8 text-xs" value={entry.clockIn} onChange={e => updateEntry(i, 'clockIn', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Clock Out</Label>
                      <Input type="time" className="h-8 text-xs" value={entry.clockOut} onChange={e => updateEntry(i, 'clockOut', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Break Start</Label>
                      <Input type="time" className="h-8 text-xs" value={entry.breakStart} onChange={e => updateEntry(i, 'breakStart', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Break End</Label>
                      <Input type="time" className="h-8 text-xs" value={entry.breakEnd} onChange={e => updateEntry(i, 'breakEnd', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Notes</Label>
                    <Input className="h-8 text-xs" placeholder="Optional notes" value={entry.notes} onChange={e => updateEntry(i, 'notes', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* General Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">General Notes</Label>
              <Textarea placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[60px]" />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t flex gap-2">
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1">Add Timesheet</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
