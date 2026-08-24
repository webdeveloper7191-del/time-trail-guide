import { useMemo, useState } from 'react';
import { Search, Users, CalendarClock, Repeat, Bell, FileText, Check } from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockStaff } from '@/data/mockStaffData';
import { mockFormTemplates } from '@/data/mockFormData';
import {
  formDeliveryStore,
  buildOccurrenceDates,
  type DeliveryMode,
  type RecurrenceFrequency,
} from '@/lib/formDeliveryStore';

interface AssignFormPanelProps {
  open: boolean;
  onClose: () => void;
  defaultTemplateId?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayKey = () => new Date().toISOString().slice(0, 10);

const AssignFormPanel = ({ open, onClose, defaultTemplateId }: AssignFormPanelProps) => {
  const templates = useMemo(
    () => mockFormTemplates.filter(t => t.scope !== 'system' && t.status === 'published'),
    []
  );

  const [templateIds, setTemplateIds] = useState<string[]>(
    defaultTemplateId ? [defaultTemplateId] : templates[0] ? [templates[0].id] : []
  );
  const [title, setTitle] = useState('');
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [mode, setMode] = useState<DeliveryMode>('once');
  const [dueDate, setDueDate] = useState(todayKey());
  const [dueTime, setDueTime] = useState('17:00');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(2);
  const [notes, setNotes] = useState('');

  const activeStaff = useMemo(() => mockStaff.filter(s => s.status === 'active' || !s.status), []);
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    activeStaff.forEach(s => (s.locations ?? []).forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [activeStaff]);
  const positionOptions = useMemo(
    () => Array.from(new Set(activeStaff.map(s => s.position).filter(Boolean) as string[])).sort(),
    [activeStaff]
  );

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    return activeStaff.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchQ = !q || name.includes(q) || (s.position ?? '').toLowerCase().includes(q);
      const matchLoc = locationFilter === 'all' || (s.locations ?? []).includes(locationFilter);
      const matchPos = positionFilter === 'all' || s.position === positionFilter;
      return matchQ && matchLoc && matchPos;
    });
  }, [activeStaff, staffSearch, locationFilter, positionFilter]);

  const recurrence = mode === 'recurring'
    ? {
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        startDate,
        endDate: endDate || undefined,
      }
    : undefined;

  const occurrences = useMemo(
    () => buildOccurrenceDates(mode, dueDate, recurrence),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, dueDate, frequency, daysOfWeek, dayOfMonth, startDate, endDate]
  );

  const selectedTemplates = templates.filter(t => templateIds.includes(t.id));
  const totalTasks = occurrences.length * staffIds.length * Math.max(selectedTemplates.length, 0);
  const canSubmit = selectedTemplates.length > 0 && staffIds.length > 0 && occurrences.length > 0;

  const toggleTemplate = (id: string) =>
    setTemplateIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const toggleStaff = (id: string) =>
    setStaffIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const allFilteredSelected = filteredStaff.length > 0 && filteredStaff.every(s => staffIds.includes(s.id));
  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setStaffIds(prev => prev.filter(id => !filteredStaff.some(s => s.id === id)));
    } else {
      setStaffIds(prev => Array.from(new Set([...prev, ...filteredStaff.map(s => s.id)])));
    }
  };

  const selectEveryone = () => setStaffIds(activeStaff.map(s => s.id));
  const selectByLocation = (loc: string) =>
    setStaffIds(prev => Array.from(new Set([
      ...prev,
      ...activeStaff.filter(s => (s.locations ?? []).includes(loc)).map(s => s.id),
    ])));
  const selectByPosition = (pos: string) =>
    setStaffIds(prev => Array.from(new Set([
      ...prev,
      ...activeStaff.filter(s => s.position === pos).map(s => s.id),
    ])));


  const reset = () => {
    setStaffIds([]); setTitle(''); setNotes(''); setStaffSearch('');
    setMode('once'); setDueDate(todayKey()); setDueTime('17:00');
  };

  const handleAssign = () => {
    if (!canSubmit) return;
    const staff = staffIds.map(id => {
      const s = activeStaff.find(x => x.id === id);
      return { id, name: s ? `${s.firstName} ${s.lastName}` : id };
    });
    selectedTemplates.forEach(template => {
      formDeliveryStore.createAssignment({
        templateId: template.id,
        templateName: template.name,
        title: title.trim()
          ? (selectedTemplates.length > 1 ? `${title.trim()} — ${template.name}` : title.trim())
          : template.name,
        mode,
        dueDate: mode === 'once' ? dueDate : undefined,
        dueTime,
        recurrence,
        staff,
        reminderEnabled,
        reminderHoursBefore,
        notes: notes.trim() || undefined,
      });
    });
    toast.success(
      `${selectedTemplates.length} form${selectedTemplates.length === 1 ? '' : 's'} assigned to ${staffIds.length} staff · ${totalTasks} task${totalTasks === 1 ? '' : 's'} created`
    );
    reset();
    onClose();
  };


  const sectionTitle = (icon: React.ReactNode, label: string, hint?: string) => (
    <div className="flex items-start gap-2 mb-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground tracking-tight">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );

  return (
    <PrimaryOffCanvas
      title="Assign form to staff"
      description="Choose recipients, set once-off or recurring delivery, and track completion."
      icon={Users}
      size="2xl"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        {
          label: totalTasks ? `Assign · ${totalTasks} task${totalTasks === 1 ? '' : 's'}` : 'Assign',
          onClick: handleAssign,
          variant: 'primary',
          disabled: !canSubmit,
          icon: <Check size={16} />,
        },
      ]}
    >
      <div className="space-y-6">
        {/* 1. Form */}
        <section className="rounded-lg border border-border p-4">
          {sectionTitle(
            <FileText size={16} />,
            'Forms',
            `${selectedTemplates.length} selected · pick one or more published templates to send together.`
          )}
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => setTemplateIds(templateIds.length === templates.length ? [] : templates.map(t => t.id))}
              className="text-xs font-medium text-primary hover:underline"
            >
              {templateIds.length === templates.length ? 'Clear all' : 'Select all forms'}
            </button>
          </div>
          <ScrollArea className="h-40 rounded-md border border-border">
            <div className="divide-y divide-border">
              {templates.map(t => {
                const selected = templateIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={cn('flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50', selected && 'bg-primary/5')}
                  >
                    <Checkbox checked={selected} onCheckedChange={() => toggleTemplate(t.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.category ?? 'Form'}</p>
                    </div>
                  </label>
                );
              })}
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-6 text-center">No published templates available.</p>
              )}
            </div>
          </ScrollArea>
          <div className="space-y-1.5 mt-3">
            <Label className="text-xs">Assignment name (optional)</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={selectedTemplates[0]?.name ?? 'e.g. Weekly safety check'}
            />
          </div>
        </section>


        {/* 2. Recipients */}
        <section className="rounded-lg border border-border p-4">
          {sectionTitle(<Users size={16} />, 'Staff', `${staffIds.length} selected`)}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8 h-9" placeholder="Search staff or position" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All positions</SelectItem>
                {positionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={toggleAllFiltered}
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap px-2"
            >
              {allFilteredSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <ScrollArea className="h-56 rounded-md border border-border">
            <div className="divide-y divide-border">
              {filteredStaff.map(s => {
                const selected = staffIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn('flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50', selected && 'bg-primary/5')}
                  >
                    <Checkbox checked={selected} onCheckedChange={() => toggleStaff(s.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.position}{s.locations?.length ? ` · ${s.locations.join(', ')}` : ''}
                      </p>
                    </div>
                  </label>
                );
              })}
              {filteredStaff.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-6 text-center">No staff match your filters.</p>
              )}
            </div>
          </ScrollArea>
        </section>

        {/* 3. Delivery */}
        <section className="rounded-lg border border-border p-4">
          {sectionTitle(<Repeat size={16} />, 'Delivery', 'Send it once, or repeat on a schedule.')}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {([
              { key: 'once', label: 'Once-off', hint: 'A single task per staff member' },
              { key: 'recurring', label: 'Recurring', hint: 'Repeats until the end date' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMode(opt.key)}
                className={cn(
                  'text-left rounded-md border p-3 transition-colors',
                  mode === opt.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                )}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.hint}</p>
              </button>
            ))}
          </div>

          {mode === 'once' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due time</Label>
                <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Repeats</Label>
                  <Select value={frequency} onValueChange={v => setFrequency(v as RecurrenceFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Due time each occurrence</Label>
                  <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                </div>
              </div>

              {frequency === 'weekly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">On days</Label>
                  <div className="flex gap-1.5">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDaysOfWeek(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())}
                        className={cn(
                          'h-8 w-10 rounded-md border text-xs font-medium transition-colors',
                          daysOfWeek.includes(i) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'monthly' && (
                <div className="space-y-1.5 w-40">
                  <Label className="text-xs">Day of month</Label>
                  <Input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End date (optional)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-md bg-muted/50 p-3 flex items-start gap-2">
            <CalendarClock size={14} className="mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              {occurrences.length === 0 ? (
                <span>Set a valid date to preview the schedule.</span>
              ) : (
                <>
                  <span className="font-medium text-foreground">{occurrences.length} occurrence{occurrences.length === 1 ? '' : 's'}</span>
                  {' · '}{staffIds.length} staff{' · '}
                  <span className="font-medium text-foreground">{totalTasks} task{totalTasks === 1 ? '' : 's'}</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {occurrences.slice(0, 8).map(d => <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>)}
                    {occurrences.length > 8 && <Badge variant="outline" className="text-[10px]">+{occurrences.length - 8} more</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 4. Reminders and notes */}
        <section className="rounded-lg border border-border p-4">
          {sectionTitle(<Bell size={16} />, 'Reminders & notes')}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm text-foreground">Remind staff before due time</p>
              <p className="text-xs text-muted-foreground">Sends a portal notification ahead of each due time.</p>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </div>
          {reminderEnabled && (
            <div className="space-y-1.5 w-48 mt-2">
              <Label className="text-xs">Hours before due</Label>
              <Input type="number" min={1} max={72} value={reminderHoursBefore} onChange={e => setReminderHoursBefore(Number(e.target.value))} />
            </div>
          )}
          <div className="space-y-1.5 mt-3">
            <Label className="text-xs">Instructions for staff (optional)</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Complete before the first client arrives." />
          </div>
        </section>
      </div>
    </PrimaryOffCanvas>
  );
};

export default AssignFormPanel;
