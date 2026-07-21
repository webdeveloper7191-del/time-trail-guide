import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Timesheet, ClockEntry, BreakEntry, ExceptionReason, TimesheetException } from '@/types/timesheet';
import { locations } from '@/data/mockTimesheets';
import { Plus, Trash2, Clock, AlertTriangle, X, CalendarOff, Coffee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import { formatTime12h } from '@/lib/timeFormat';
import { RaiseExceptionDialog, EXCEPTION_REASONS } from './RaiseExceptionDialog';
import { LeaveStore } from '@/lib/leaveAccrualEngine';
import { useBreakRules } from '@/lib/breakRulesStore';

type LeaveKindOption =
  | 'annual_leave'
  | 'sick_leave'
  | 'personal_leave'
  | 'unpaid_leave'
  | 'rdo_leave'
  | 'ado_leave'
  | 'toil_leave';

const LEAVE_OPTIONS: { value: LeaveKindOption; label: string; ledgerKind?: 'RDO' | 'ADO' | 'TOIL' }[] = [
  { value: 'annual_leave', label: 'Annual Leave' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'personal_leave', label: 'Personal / Carer\'s Leave' },
  { value: 'unpaid_leave', label: 'Unpaid Leave' },
  { value: 'rdo_leave', label: 'RDO Leave', ledgerKind: 'RDO' },
  { value: 'ado_leave', label: 'ADO Leave', ledgerKind: 'ADO' },
  { value: 'toil_leave', label: 'TOIL Leave', ledgerKind: 'TOIL' },
];


interface AddTimesheetPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd: (timesheet: Timesheet) => void;
}

interface BreakForm {
  id: string;
  start: string;
  end: string;
  paid: boolean;
  label?: string;
}

interface EntryForm {
  date: string;
  clockIn: string;
  clockOut: string;
  breaks: BreakForm[];
  notes: string;
  exceptionReason?: ExceptionReason | '';
  exceptionNote?: string;
  leaveType?: LeaveKindOption | '';
  leaveHours?: number;
}

let breakIdCounter = 0;
const nextBreakId = () => `brk-${Date.now()}-${++breakIdCounter}`;

const emptyEntry = (): EntryForm => ({
  date: '',
  clockIn: '09:00',
  clockOut: '17:00',
  breaks: [{ id: nextBreakId(), start: '12:00', end: '12:30', paid: false, label: 'Lunch Break' }],
  notes: '',
  exceptionReason: '',
  exceptionNote: '',
  leaveType: '',
  leaveHours: 8,
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
  const [exceptionEntryIndex, setExceptionEntryIndex] = useState<number | null>(null);
  const [breakRules] = useBreakRules();
  const [prepopulateBreaks, setPrepopulateBreaks] = useState(true);

  // Compute a break window from a rule, anchored to the midpoint of the shift.
  const windowFromRule = (clockIn: string, clockOut: string, durationMin: number, offsetMin = 0) => {
    if (!clockIn || !clockOut) return { start: '', end: '' };
    const [ih, im] = clockIn.split(':').map(Number);
    const [oh, om] = clockOut.split(':').map(Number);
    const startMin = ih * 60 + im;
    const endMin = oh * 60 + om;
    if (endMin <= startMin) return { start: '', end: '' };
    const midpoint = Math.round((startMin + endMin) / 2 - durationMin / 2) + offsetMin;
    const bs = Math.min(Math.max(startMin, midpoint), endMin - durationMin);
    const be = bs + durationMin;
    const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    return { start: fmt(bs), end: fmt(be) };
  };

  // Shift length in hours
  const shiftHours = (clockIn: string, clockOut: string) => {
    if (!clockIn || !clockOut) return 0;
    const [ih, im] = clockIn.split(':').map(Number);
    const [oh, om] = clockOut.split(':').map(Number);
    return Math.max(0, ((oh * 60 + om) - (ih * 60 + im)) / 60);
  };

  // Which rules apply given the shift length
  const applicableRules = (clockIn: string, clockOut: string) => {
    const hrs = shiftHours(clockIn, clockOut);
    return breakRules.filter(r => hrs >= (r.minWorkHoursRequired ?? 0));
  };

  const defaultBreakFor = (clockIn: string, clockOut: string) => {
    const rules = applicableRules(clockIn, clockOut);
    const unpaid = rules.find(r => r.type === 'unpaid' && r.isMandatory)
      ?? rules.find(r => r.type === 'unpaid');
    const paid = rules.find(r => r.type === 'paid' && r.isMandatory)
      ?? rules.find(r => r.type === 'paid');
    const unpaidWin = unpaid ? windowFromRule(clockIn, clockOut, unpaid.breakDurationMinutes) : { start: '', end: '' };
    const paidWin = paid ? windowFromRule(clockIn, clockOut, paid.breakDurationMinutes, -Math.max(60, paid.breakDurationMinutes + 15)) : { start: '', end: '' };
    return { unpaid: unpaidWin, paid: paidWin };
  };

  // Build one break entry per applicable rule, staggering their windows so they don't overlap.
  const buildDefaultBreaks = (clockIn: string, clockOut: string): BreakForm[] => {
    const rules = applicableRules(clockIn, clockOut);
    if (!clockIn || !clockOut || rules.length === 0) return [];
    // Order: mandatory unpaid first (usually lunch), then other unpaid, then paid rest breaks.
    const ordered = [...rules].sort((a, b) => {
      const score = (r: typeof a) =>
        (r.type === 'unpaid' ? 0 : 2) + (r.isMandatory ? 0 : 1);
      return score(a) - score(b);
    });
    // Stagger offsets from midpoint so windows don't collide.
    const offsets = [0, -90, 90, -180, 180, -270, 270];
    const out: BreakForm[] = [];
    ordered.forEach((r, idx) => {
      const win = windowFromRule(clockIn, clockOut, r.breakDurationMinutes, offsets[idx] ?? 0);
      if (!win.start) return;
      out.push({
        id: nextBreakId(),
        start: win.start,
        end: win.end,
        paid: r.type === 'paid',
        label: r.name,
      });
    });
    return out;
  };

  const applyPrepopulatedBreaks = (checked: boolean) => {
    setPrepopulateBreaks(checked);
    setEntries(prev => prev.map(e => {
      if (e.leaveType) return e;
      if (checked) {
        // Replace with a full set of defaults from all applicable rules.
        return { ...e, breaks: buildDefaultBreaks(e.clockIn, e.clockOut) };
      }
      return { ...e, breaks: [] };
    }));
  };

  const addBreak = (entryIndex: number, paid: boolean) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== entryIndex) return e;
      const d = defaultBreakFor(e.clockIn, e.clockOut);
      const w = paid ? d.paid : d.unpaid;
      return {
        ...e,
        breaks: [...e.breaks, {
          id: nextBreakId(),
          start: w.start || '',
          end: w.end || '',
          paid,
          label: paid ? 'Rest Break' : 'Break',
        }],
      };
    }));
  };

  const updateBreak = (entryIndex: number, breakId: string, patch: Partial<BreakForm>) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== entryIndex) return e;
      return { ...e, breaks: e.breaks.map(b => b.id === breakId ? { ...b, ...patch } : b) };
    }));
  };

  const removeBreak = (entryIndex: number, breakId: string) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== entryIndex) return e;
      return { ...e, breaks: e.breaks.filter(b => b.id !== breakId) };
    }));
  };


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
    setEntries(prev => [...prev, prepopulateBreaks ? emptyEntry() : { ...emptyEntry(), breaks: [] }]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntry = <K extends keyof EntryForm>(index: number, field: K, value: EntryForm[K]) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== index) return e;
      const next = { ...e, [field]: value };
      // When clock times change and prepopulate is on, refresh the default break set.
      if (prepopulateBreaks && !next.leaveType && (field === 'clockIn' || field === 'clockOut')) {
        const wasDefault =
          e.breaks.length === 0 ||
          JSON.stringify(e.breaks.map(b => ({ s: b.start, e: b.end, p: b.paid }))) ===
            JSON.stringify(buildDefaultBreaks(e.clockIn, e.clockOut).map(b => ({ s: b.start, e: b.end, p: b.paid })));
        if (wasDefault) {
          next.breaks = buildDefaultBreaks(next.clockIn, next.clockOut);
        }
      }
      return next;
    }));
  };

  const calculateHours = (clockIn: string, clockOut: string): number => {
    if (!clockIn || !clockOut) return 0;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
  };

  const entryNeedsException = (e: EntryForm) => !e.leaveType && (!e.clockIn || !e.clockOut);

  const handleSubmit = () => {
    if (!employeeName || !employeeEmail || !department || !locationId || !weekStartDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (entries.length === 0) {
      toast.error('Add at least one time entry');
      return;
    }

    // Enforce exception when a clock time is missing (unless it's a leave day)
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (entryNeedsException(e) && (!e.exceptionReason || !e.exceptionNote?.trim())) {
        toast.error(`Entry ${i + 1}: missing clock time requires an exception reason and note`);
        return;
      }
      if (e.leaveType && !e.date) {
        toast.error(`Entry ${i + 1}: leave day requires a date`);
        return;
      }
    }

    const location = locations.find(l => l.id === locationId)!;
    const id = `TS-${Date.now()}`;
    const employeeId = `E-${Date.now()}`;

    const clockEntries: ClockEntry[] = entries.map((entry, i) => {
      // Leave day: zero worked hours, no breaks, prefix notes with leave tag
      if (entry.leaveType) {
        const leaveOpt = LEAVE_OPTIONS.find(o => o.value === entry.leaveType)!;
        const leaveHours = Math.max(0, Number(entry.leaveHours) || 0);
        return {
          id: `entry-${i}`,
          date: entry.date || weekStartDate,
          clockIn: '',
          clockOut: null,
          breaks: [],
          totalBreakMinutes: 0,
          grossHours: 0,
          netHours: 0,
          overtime: 0,
          notes: `[LEAVE - ${leaveOpt.label.toUpperCase()} · ${leaveHours}h] ${entry.notes ?? ''}`.trim(),
        };
      }

      const grossHours = calculateHours(entry.clockIn, entry.clockOut);
      const validBreaks = entry.breaks.filter(b => b.start && b.end);
      const unpaidBreakMinutes = validBreaks
        .filter(b => !b.paid)
        .reduce((s, b) => s + calculateHours(b.start, b.end) * 60, 0);
      const paidBreakMinutes = validBreaks
        .filter(b => b.paid)
        .reduce((s, b) => s + calculateHours(b.start, b.end) * 60, 0);
      const netHours = Math.max(0, grossHours - unpaidBreakMinutes / 60); // paid break NOT deducted
      const breaks: BreakEntry[] = validBreaks.map((b, bi) => ({
        id: `brk-${i}-${bi}`,
        startTime: b.start,
        endTime: b.end,
        duration: calculateHours(b.start, b.end) * 60,
        type: b.paid ? ('short' as const) : ('lunch' as const),
      }));
      const breakMinutes = unpaidBreakMinutes + paidBreakMinutes;


      let exception: TimesheetException | undefined;
      if (entry.exceptionReason && entry.exceptionNote?.trim()) {
        exception = {
          reason: entry.exceptionReason as ExceptionReason,
          note: entry.exceptionNote.trim(),
          raisedBy: 'manager',
          raisedAt: new Date().toISOString(),
          resolved: false,
        };
      }

      return {
        id: `entry-${i}`,
        date: entry.date || weekStartDate,
        clockIn: entry.clockIn || '',
        clockOut: entry.clockOut || null,
        breaks,
        totalBreakMinutes: breakMinutes,
        grossHours,
        netHours,
        overtime: Math.max(0, netHours - 8),
        notes: entry.notes,
        exception,
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

    // Post RDO/ADO/TOIL consumption entries to the leave ledger
    let ledgerPosts = 0;
    entries.forEach((entry) => {
      const opt = LEAVE_OPTIONS.find(o => o.value === entry.leaveType);
      if (opt?.ledgerKind && entry.date) {
        const hours = Math.max(0, Number(entry.leaveHours) || 0);
        if (hours > 0) {
          LeaveStore.postLedger({
            staffId: employeeId,
            kind: opt.ledgerKind,
            type: 'consumption',
            hours: -hours,
            occurredOn: entry.date,
            note: `Timesheet leave day (${opt.label}) — ${employeeName}`,
          });

          ledgerPosts++;
        }
      }
    });

    resetForm();
    onClose();
    toast.success(
      ledgerPosts > 0
        ? `Timesheet added · ${ledgerPosts} leave ledger entr${ledgerPosts === 1 ? 'y' : 'ies'} posted`
        : 'Timesheet added successfully'
    );
  };


  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col">
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

              {/* Prepopulate breaks toggle — applies across all worked entries, still editable per entry */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/20 cursor-pointer">
                <Checkbox
                  checked={prepopulateBreaks}
                  onCheckedChange={(v) => applyPrepopulatedBreaks(!!v)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Prepopulate breaks for all entries</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Auto-fills a default break based on your configured break rules. You can still edit each entry's break times below.
                  </p>
                </div>
              </label>

              {entries.map((entry, i) => {
                const isLeave = !!entry.leaveType;
                return (
                <div key={i} className={`p-3 rounded-lg border space-y-3 ${isLeave ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-muted/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                      {isLeave && (
                        <Badge variant="outline" className="text-[10px] h-4 border-indigo-500/50 text-indigo-700">
                          <CalendarOff className="h-2.5 w-2.5 mr-1" />
                          {LEAVE_OPTIONS.find(o => o.value === entry.leaveType)?.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isLeave && entry.clockIn && entry.clockOut && (
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

                  {/* Day Type toggle: Worked vs Leave */}
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Day Type</Label>
                      <Select
                        value={entry.leaveType || 'worked'}
                        onValueChange={(v) => {
                          if (v === 'worked') {
                            updateEntry(i, 'leaveType', '');
                          } else {
                            updateEntry(i, 'leaveType', v as LeaveKindOption);
                            // Clear exception since it's a leave day
                            updateEntry(i, 'exceptionReason', '');
                            updateEntry(i, 'exceptionNote', '');
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worked">Worked shift</SelectItem>
                          {LEAVE_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isLeave && (
                      <div className="space-y-1 w-24">
                        <Label className="text-[10px] text-muted-foreground">Hours</Label>
                        <Input
                          type="number" min={0} max={24} step={0.5}
                          className="h-8 text-xs"
                          value={entry.leaveHours ?? 8}
                          onChange={e => updateEntry(i, 'leaveHours', Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>

                  {!isLeave ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Date</Label>
                        <Input type="date" className="h-8 text-xs" value={entry.date} onChange={e => updateEntry(i, 'date', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground">Clock In</Label>
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                            onClick={() => {
                              const wasSet = !!entry.clockIn;
                              updateEntry(i, 'clockIn', wasSet ? '' : '09:00');
                              if (wasSet && !entry.exceptionReason) updateEntry(i, 'exceptionReason', 'missed_clock_in');
                            }}
                          >
                            {entry.clockIn ? 'Mark missing' : 'Set time'}
                          </button>
                        </div>
                        <Input type="time" className="h-8 text-xs" value={entry.clockIn} onChange={e => updateEntry(i, 'clockIn', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground">Clock Out</Label>
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                            onClick={() => {
                              const wasSet = !!entry.clockOut;
                              updateEntry(i, 'clockOut', wasSet ? '' : '17:00');
                              if (wasSet && !entry.exceptionReason) updateEntry(i, 'exceptionReason', 'missed_clock_out');
                            }}
                          >
                            {entry.clockOut ? 'Mark missing' : 'Set time'}
                          </button>
                        </div>
                        <Input type="time" className="h-8 text-xs" value={entry.clockOut} onChange={e => updateEntry(i, 'clockOut', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Date *</Label>
                      <Input type="date" className="h-8 text-xs" value={entry.date} onChange={e => updateEntry(i, 'date', e.target.value)} />
                    </div>
                  )}

                  {!isLeave && (
                    <>
                      {/* Multiple breaks — paid + unpaid */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Breaks</Label>
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2"
                              onClick={() => addBreak(i, false)}>
                              <Plus className="h-2.5 w-2.5 mr-0.5" /> Unpaid
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2"
                              onClick={() => addBreak(i, true)}>
                              <Plus className="h-2.5 w-2.5 mr-0.5" /> Paid
                            </Button>
                          </div>
                        </div>
                        {entry.breaks.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic px-1">No breaks recorded for this shift.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {entry.breaks.map(b => (
                              <div key={b.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-center p-1.5 rounded border ${b.paid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-300/60 bg-muted/20'}`}>
                                <Input
                                  className="h-7 text-[11px]"
                                  placeholder={b.paid ? 'Rest Break' : 'Break'}
                                  value={b.label ?? ''}
                                  onChange={e => updateBreak(i, b.id, { label: e.target.value })}
                                />
                                <Input type="time" className="h-7 text-[11px] w-24"
                                  value={b.start} onChange={e => updateBreak(i, b.id, { start: e.target.value })} />
                                <Input type="time" className="h-7 text-[11px] w-24"
                                  value={b.end} onChange={e => updateBreak(i, b.id, { end: e.target.value })} />
                                <div className="flex items-center gap-0.5">
                                  <button type="button"
                                    className={`text-[10px] px-1.5 h-6 rounded border ${b.paid ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700' : 'border-slate-300 text-muted-foreground hover:bg-muted'}`}
                                    onClick={() => updateBreak(i, b.id, { paid: !b.paid })}
                                    title={b.paid ? 'Paid — not deducted' : 'Unpaid — deducted'}
                                  >
                                    {b.paid ? 'Paid' : 'Unpaid'}
                                  </button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                                    onClick={() => removeBreak(i, b.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {(() => {
                        if (!entry.clockIn || !entry.clockOut) return null;
                        const rules = applicableRules(entry.clockIn, entry.clockOut);
                        const hasUnpaid = entry.breaks.some(b => !b.paid && b.start && b.end);
                        const hasPaid = entry.breaks.some(b => b.paid && b.start && b.end);
                        const missing = rules.filter(r => (r.type === 'unpaid' ? !hasUnpaid : !hasPaid));
                        if (missing.length === 0) return null;
                        const hrs = shiftHours(entry.clockIn, entry.clockOut);
                        return (
                          <div className="flex items-start gap-2 p-2.5 rounded-md border border-amber-500/40 bg-amber-500/5">
                            <Coffee className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <p className="text-[11px] font-medium text-amber-700">
                                Missing break data — shift {formatTime12h(entry.clockIn)} – {formatTime12h(entry.clockOut)} ({hrs.toFixed(2)}h worked)
                              </p>
                              <ul className="space-y-0.5">
                                {missing.map(r => (
                                  <li key={r.id} className="text-[11px] text-amber-800/90 flex items-center gap-1.5">
                                    <span className="inline-block w-1 h-1 rounded-full bg-amber-600" />
                                    <span className="font-medium">{r.name}</span>
                                    <span className="text-muted-foreground">
                                      · expected {r.breakDurationMinutes} min {r.type} {r.isMandatory ? '· mandatory' : '· optional'}
                                      {' '}(triggered ≥ {r.minWorkHoursRequired}h)
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <Button
                              type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-500/10"
                              onClick={() => {
                                missing.forEach(r => addBreak(i, r.type === 'paid'));
                              }}
                            >
                              Add defaults
                            </Button>
                          </div>
                        );

                      })()}
                    </>
                  )}


                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Notes</Label>
                    <Input className="h-8 text-xs" placeholder={isLeave ? 'Optional reason / note' : 'Optional notes'} value={entry.notes} onChange={e => updateEntry(i, 'notes', e.target.value)} />
                  </div>

                  {!isLeave && (
                    entry.exceptionReason && entry.exceptionNote ? (
                      <div className="flex items-start gap-2 p-2.5 rounded-md border border-amber-500/40 bg-amber-500/5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-amber-700">
                              {EXCEPTION_REASONS.find(r => r.value === entry.exceptionReason)?.label ?? 'Exception'}
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4 border-amber-500/50 text-amber-700">
                              Raised
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{entry.exceptionNote}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                            onClick={() => setExceptionEntryIndex(i)}>
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => { updateEntry(i, 'exceptionReason', ''); updateEntry(i, 'exceptionNote', ''); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button" variant="outline" size="sm"
                        className={`h-7 text-xs w-full ${entryNeedsException(entry) ? 'border-amber-500/60 text-amber-700 hover:bg-amber-500/10' : ''}`}
                        onClick={() => setExceptionEntryIndex(i)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {entryNeedsException(entry) ? 'Raise exception (required — missing clock time)' : 'Raise exception'}
                      </Button>
                    )
                  )}
                </div>
                );
              })}

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
      <RaiseExceptionDialog
        open={exceptionEntryIndex !== null}
        onClose={() => setExceptionEntryIndex(null)}
        onSubmit={(exc) => {
          if (exceptionEntryIndex !== null) {
            updateEntry(exceptionEntryIndex, 'exceptionReason', exc.reason);
            updateEntry(exceptionEntryIndex, 'exceptionNote', exc.note);
          }
        }}
        raisedBy="manager"
        contextLabel={exceptionEntryIndex !== null ? `Entry ${exceptionEntryIndex + 1}` : undefined}
        initial={
          exceptionEntryIndex !== null && entries[exceptionEntryIndex]?.exceptionReason
            ? {
                reason: entries[exceptionEntryIndex]!.exceptionReason as ExceptionReason,
                note: entries[exceptionEntryIndex]!.exceptionNote ?? '',
                raisedBy: 'manager',
                raisedAt: new Date().toISOString(),
              }
            : undefined
        }
      />
    </Sheet>
  );
}
