import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import {
  Calendar as CalendarIcon, Clock, MapPin, ArrowLeftRight, Inbox,
  List, LayoutGrid, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Hand, Sparkles, Building2, Search, Coffee, LogIn, LogOut, FileText, Briefcase,
  UserX, Plane, Stethoscope, Plus,
} from 'lucide-react';
import {
  format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO,
  eachDayOfInterval, addWeeks, subWeeks, isWithinInterval,
  startOfMonth, endOfMonth, addMonths, subMonths, getDay, isSameMonth,
  differenceInCalendarDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShiftSwapRequestDialog } from './ShiftSwapRequestDialog';
import { SwapInboxDialog, SwapRequest } from './SwapInboxDialog';

// ───────────────────────── Types ─────────────────────────
interface BreakEntry {
  start: string;
  end?: string;
  type: 'paid' | 'unpaid';
  label?: string;
}
interface MyShift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  area: string;
  role: string;
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed';
  breakMinutes: number;
  notes?: string;
  clockIn?: string;
  clockOut?: string;
  breaks?: BreakEntry[];
}

interface OpenShift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  area: string;
  role: string;
  rate: number;
  premium?: boolean;
  applicants: number;
  reason?: string;
}

type AvailabilityStatus = 'available' | 'preferred' | 'unavailable';
interface AvailabilityDay {
  date: Date;
  status: AvailabilityStatus;
  note?: string;
}

// ───────────────────────── Mock data ─────────────────────────
const today = new Date();
const mockMyShifts: MyShift[] = [
  { id: 's1', date: addDays(today, 0), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'in-progress', breakMinutes: 30, clockIn: '08:57', breaks: [{ start: '12:30', end: '13:00', type: 'unpaid', label: 'Lunch' }] },
  { id: 's2', date: addDays(today, 1), startTime: '08:00', endTime: '16:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
  { id: 's3', date: addDays(today, 2), startTime: '12:00', endTime: '20:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'confirmed', breakMinutes: 45 },
  { id: 's4', date: addDays(today, 4), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'pending', breakMinutes: 30 },
  { id: 's5', date: addDays(today, 7), startTime: '07:00', endTime: '15:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
  { id: 's6', date: addDays(today, 8), startTime: '14:00', endTime: '22:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
  { id: 's0', date: addDays(today, -1), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '08:55', clockOut: '17:04', breaks: [{ start: '12:30', end: '13:00', type: 'unpaid', label: 'Lunch' }] },
  { id: 'sp1', date: addDays(today, -3), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '09:02', clockOut: '17:08', breaks: [{ start: '12:30', end: '13:00', type: 'unpaid', label: 'Lunch' }] },
  { id: 'sp2', date: addDays(today, -5), startTime: '08:00', endTime: '16:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '07:58', clockOut: '16:01', breaks: [{ start: '12:00', end: '12:30', type: 'unpaid', label: 'Lunch' }] },
  { id: 'sp3', date: addDays(today, -8), startTime: '12:00', endTime: '20:00', location: 'East Centre', area: 'Floor', role: 'Coordinator', status: 'completed', breakMinutes: 45, clockIn: '11:55', clockOut: '20:10', breaks: [{ start: '15:30', end: '16:15', type: 'unpaid', label: 'Dinner' }] },
  { id: 'sp4', date: addDays(today, -10), startTime: '07:00', endTime: '15:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '06:55', clockOut: '15:04', breaks: [{ start: '11:00', end: '11:30', type: 'unpaid', label: 'Lunch' }] },
  { id: 'sp5', date: addDays(today, -14), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '09:01', clockOut: '17:00' },
  { id: 'sp6', date: addDays(today, -17), startTime: '14:00', endTime: '22:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '13:58', clockOut: '22:05' },
  { id: 'sp7', date: addDays(today, -21), startTime: '08:00', endTime: '16:00', location: 'Main Centre', area: 'Reception', role: 'Coordinator', status: 'completed', breakMinutes: 30, clockIn: '08:00', clockOut: '16:00' },
];

const mockOpenShifts: OpenShift[] = [
  { id: 'o1', date: addDays(today, 1), startTime: '17:00', endTime: '23:00', location: 'Main Centre', area: 'Evening Cover', role: 'Coordinator', rate: 32, premium: true, applicants: 2, reason: 'Late cover needed' },
  { id: 'o2', date: addDays(today, 3), startTime: '06:00', endTime: '14:00', location: 'North Branch', area: 'Operations', role: 'Coordinator', rate: 28, applicants: 0 },
  { id: 'o3', date: addDays(today, 5), startTime: '10:00', endTime: '18:00', location: 'East Centre', area: 'Floor', role: 'Coordinator', rate: 30, premium: true, applicants: 4, reason: 'High demand' },
  { id: 'o4', date: addDays(today, 6), startTime: '08:00', endTime: '12:00', location: 'Main Centre', area: 'Reception', role: 'Coordinator', rate: 28, applicants: 1 },
];

const mockSwapRequests: SwapRequest[] = [
  {
    id: 'sw1', direction: 'incoming', status: 'pending',
    fromStaff: { id: 'u9', name: 'Liam Brooks', role: 'Coordinator' },
    toStaff: { id: 'u1', name: 'Sarah Chen', role: 'Coordinator' },
    fromShift: { date: addDays(today, 3), startTime: '09:00', endTime: '17:00', location: 'Main Centre', role: 'Coordinator' },
    toShift: { date: addDays(today, 4), startTime: '09:00', endTime: '17:00', location: 'Main Centre', role: 'Coordinator' },
    reason: 'Doctor appointment', createdAt: addDays(today, -1),
  },
  {
    id: 'sw2', direction: 'outgoing', status: 'pending',
    fromStaff: { id: 'u1', name: 'Sarah Chen', role: 'Coordinator' },
    toStaff: { id: 'u4', name: 'Maria Garcia', role: 'Coordinator' },
    fromShift: { date: addDays(today, 7), startTime: '07:00', endTime: '15:00', location: 'Main Centre', role: 'Coordinator' },
    toShift: { date: addDays(today, 9), startTime: '09:00', endTime: '17:00', location: 'Main Centre', role: 'Coordinator' },
    reason: 'Family event', createdAt: addDays(today, -2),
  },
];

const seedAvailability = (weekStart: Date): AvailabilityDay[] =>
  eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 13) }).map((d, i) => ({
    date: d,
    status: ([0, 6].includes(d.getDay()) ? 'unavailable' : i % 5 === 2 ? 'preferred' : 'available') as AvailabilityStatus,
  }));

// ───────────────────────── Helpers ─────────────────────────
const statusTone: Record<MyShift['status'], string> = {
  'confirmed': 'bg-status-approved/10 text-status-approved border-status-approved/20',
  'pending': 'bg-status-pending/10 text-status-pending border-status-pending/20',
  'in-progress': 'bg-primary/10 text-primary border-primary/20',
  'completed': 'bg-muted text-muted-foreground border-border',
};

const availTone: Record<AvailabilityStatus, string> = {
  available: 'bg-status-approved/15 text-status-approved border-status-approved/30',
  preferred: 'bg-primary/15 text-primary border-primary/30',
  unavailable: 'bg-status-rejected/10 text-status-rejected border-status-rejected/25',
};

const hoursBetween = (start: string, end: string, breakMins: number) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm) - breakMins) / 60);
};

const fmt12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
};

// ───────────────────────── Main Component ─────────────────────────
const PAST_PAGE_SIZE = 8;
type CalRange = 'week' | 'fortnight' | 'month';

export function EmployeeShiftsPanel() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [tab, setTab] = useState<'mine' | 'open' | 'swaps'>('mine');
  const [calRange, setCalRange] = useState<CalRange>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(today);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(seedAvailability(startOfWeek(today, { weekStartsOn: 1 })));
  const [swapShift, setSwapShift] = useState<MyShift | null>(null);
  const [detailsShift, setDetailsShift] = useState<MyShift | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [editingDay, setEditingDay] = useState<AvailabilityDay | null>(null);
  const [pastPage, setPastPage] = useState(1);
  const [absentShift, setAbsentShift] = useState<MyShift | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveSeed, setLeaveSeed] = useState<{ date?: Date; type?: 'annual' | 'sick' } | null>(null);

  const locations = useMemo(() => Array.from(new Set([...mockMyShifts, ...mockOpenShifts].map(s => s.location))), []);

  const startOfToday = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Calendar range -> visible window
  const rangeStart = useMemo(() => {
    if (calRange === 'month') return startOfMonth(anchorDate);
    return startOfWeek(anchorDate, { weekStartsOn: 1 });
  }, [calRange, anchorDate]);
  const rangeEnd = useMemo(() => {
    if (calRange === 'month') return endOfMonth(anchorDate);
    if (calRange === 'fortnight') return addDays(rangeStart, 13);
    return addDays(rangeStart, 6);
  }, [calRange, anchorDate, rangeStart]);

  const filteredMyShifts = useMemo(() =>
    mockMyShifts.filter(s => {
      if (locFilter !== 'all' && s.location !== locFilter) return false;
      if (search !== '' && !s.location.toLowerCase().includes(search.toLowerCase()) && !s.role.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateRange === 'upcoming' && s.date < startOfToday) return false;
      if (dateRange === 'past' && s.date >= startOfToday) return false;
      return true;
    }).sort((a, b) => dateRange === 'past' ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime()),
  [search, locFilter, dateRange, startOfToday]);

  // Reset pagination when filter/search changes
  useMemo(() => { setPastPage(1); }, [dateRange, search, locFilter]);

  const paginatedMyShifts = useMemo(() => {
    if (dateRange !== 'past') return filteredMyShifts;
    const start = (pastPage - 1) * PAST_PAGE_SIZE;
    return filteredMyShifts.slice(start, start + PAST_PAGE_SIZE);
  }, [filteredMyShifts, dateRange, pastPage]);
  const totalPastPages = Math.max(1, Math.ceil(filteredMyShifts.length / PAST_PAGE_SIZE));

  const filteredOpen = useMemo(() =>
    mockOpenShifts.filter(s => locFilter === 'all' || s.location === locFilter)
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
  [locFilter]);

  const pendingIncoming = swapRequests.filter(r => r.direction === 'incoming' && r.status === 'pending').length;

  const totalHours = filteredMyShifts.reduce((sum, s) => sum + hoursBetween(s.startTime, s.endTime, s.breakMinutes), 0);

  // ── Navigation (step by current calendar range)
  const stepDays = calRange === 'week' ? 7 : calRange === 'fortnight' ? 14 : 0;
  const goPrev = () => setAnchorDate(d => calRange === 'month' ? subMonths(d, 1) : addDays(d, -stepDays));
  const goNext = () => setAnchorDate(d => calRange === 'month' ? addMonths(d, 1) : addDays(d, stepDays));
  const goToday = () => setAnchorDate(today);

  // ── Actions
  const claimOpen = (s: OpenShift) => toast.success(`Application sent for ${format(s.date, 'EEE d MMM')} • ${fmt12(s.startTime)}`);
  const updateAvailability = (date: Date, status: AvailabilityStatus, note?: string) => {
    setAvailability(prev => {
      const exists = prev.find(a => isSameDay(a.date, date));
      if (exists) return prev.map(a => isSameDay(a.date, date) ? { ...a, status, note } : a);
      return [...prev, { date, status, note }];
    });
    toast.success(`Availability updated for ${format(date, 'EEE d MMM')}`);
  };

  const rangeLabel = useMemo(() => {
    if (calRange === 'month') return format(anchorDate, 'MMMM yyyy');
    return `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`;
  }, [calRange, anchorDate, rangeStart, rangeEnd]);


  return (
    <div className="space-y-4">
      {/* ── Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            <Button size="sm" variant={view === 'list' ? 'default' : 'ghost'} onClick={() => setView('list')} className="h-8 gap-1.5">
              <List className="h-3.5 w-3.5" /> List
            </Button>
            <Button size="sm" variant={view === 'calendar' ? 'default' : 'ghost'} onClick={() => setView('calendar')} className="h-8 gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Calendar
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" onClick={goPrev} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={goToday} className="h-8">Today</Button>
            <Button size="icon" variant="outline" onClick={goNext} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            <span className="ml-2 text-sm font-medium text-foreground">{rangeLabel}</span>
          </div>

          {view === 'calendar' && (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
              {(['week', 'fortnight', 'month'] as CalRange[]).map(r => (
                <Button key={r} size="sm" variant={calRange === r ? 'default' : 'ghost'} onClick={() => setCalRange(r)} className="h-8 capitalize">
                  {r}
                </Button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 w-44" />
            </div>
            <Select value={locFilter} onValueChange={setLocFilter}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => { setLeaveSeed(null); setLeaveOpen(true); }} className="h-8 gap-1.5">
              <Plane className="h-3.5 w-3.5" /> Apply for leave
            </Button>
            <Button size="sm" variant="outline" onClick={() => setInboxOpen(true)} className="h-8 gap-1.5 relative">
              <Inbox className="h-3.5 w-3.5" /> Inbox
              {pendingIncoming > 0 && <Badge className="h-5 px-1.5 ml-1 bg-primary text-primary-foreground">{pendingIncoming}</Badge>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={CalendarIcon} label="Scheduled" value={`${filteredMyShifts.length} shifts`} tone="text-primary" />
        <KpiTile icon={Clock} label="Hours next 14 days" value={`${totalHours.toFixed(1)}h`} tone="text-blue-600" />
        <KpiTile icon={Sparkles} label="Open shifts" value={`${filteredOpen.length} available`} tone="text-amber-600" />
        <KpiTile icon={ArrowLeftRight} label="Swap requests" value={`${pendingIncoming} pending`} tone="text-purple-600" />
      </div>

      {/* ── Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="mine" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> My Shifts
            <Badge variant="outline" className="ml-1 h-5 px-1.5">{filteredMyShifts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2">
            <Hand className="h-4 w-4" /> Open Shifts
            <Badge variant="outline" className="ml-1 h-5 px-1.5">{filteredOpen.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="swaps" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" /> Swap Requests
            {pendingIncoming > 0 && <Badge className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground">{pendingIncoming}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── My Shifts */}
        <TabsContent value="mine" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
              {(['upcoming', 'past', 'all'] as const).map(r => (
                <Button
                  key={r}
                  size="sm"
                  variant={dateRange === r ? 'default' : 'ghost'}
                  onClick={() => setDateRange(r)}
                  className="h-8 capitalize"
                >
                  {r === 'upcoming' ? 'Upcoming' : r === 'past' ? 'Past' : 'All shifts'}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'past'
                ? `Showing ${(pastPage - 1) * PAST_PAGE_SIZE + 1}–${Math.min(pastPage * PAST_PAGE_SIZE, filteredMyShifts.length)} of ${filteredMyShifts.length} past shifts`
                : dateRange === 'all'
                ? `Showing all ${filteredMyShifts.length} shift${filteredMyShifts.length === 1 ? '' : 's'}`
                : `Showing ${filteredMyShifts.length} upcoming shift${filteredMyShifts.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {view === 'list' ? (
            <>
              <ShiftList
                shifts={paginatedMyShifts}
                onSwap={(s) => setSwapShift(s)}
                onOpenDetails={(s) => setDetailsShift(s)}
                onMarkAbsent={(s) => setAbsentShift(s)}
                onApplyLeave={(s) => { setLeaveSeed({ date: s.date }); setLeaveOpen(true); }}
              />
              {dateRange === 'past' && totalPastPages > 1 && (
                <Pagination page={pastPage} totalPages={totalPastPages} onChange={setPastPage} />
              )}
            </>
          ) : (
            <CalendarGrid
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              calRange={calRange}
              shifts={filteredMyShifts}
              availability={availability}
              onShiftClick={(s) => setDetailsShift(s)}
              onAvailabilityClick={(d) => setEditingDay(d)}
              onApplyLeave={(d) => { setLeaveSeed({ date: d }); setLeaveOpen(true); }}
            />
          )}
          <AvailabilityStrip
            weekStart={startOfWeek(anchorDate, { weekStartsOn: 1 })}
            availability={availability}
            shifts={filteredMyShifts}
            onChange={(date) => setEditingDay(availability.find(a => isSameDay(a.date, date)) || { date, status: 'available' })}
          />
        </TabsContent>

        {/* ── Open Shifts */}
        <TabsContent value="open" className="mt-4 space-y-4">
          {view === 'list' ? (
            <OpenShiftList shifts={filteredOpen} onClaim={claimOpen} />
          ) : (
            <CalendarGrid
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              calRange={calRange}
              shifts={[]}
              openShifts={filteredOpen}
              availability={availability}
              onClaim={claimOpen}
            />
          )}
          <AvailabilityStrip
            weekStart={startOfWeek(anchorDate, { weekStartsOn: 1 })}
            availability={availability}
            shifts={filteredMyShifts}
            onChange={(date) => setEditingDay(availability.find(a => isSameDay(a.date, date)) || { date, status: 'available' })}
          />
        </TabsContent>

        {/* ── Swaps */}
        <TabsContent value="swaps" className="mt-4 space-y-4">
          <SwapList
            requests={swapRequests}
            onAccept={(id) => { setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'accepted', respondedAt: new Date() } : r)); toast.success('Swap accepted'); }}
            onDecline={(id) => { setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'declined', respondedAt: new Date() } : r)); toast.info('Swap declined'); }}
            onCancel={(id) => { setSwapRequests(p => p.filter(r => r.id !== id)); toast.info('Swap cancelled'); }}
          />
          <AvailabilityStrip
            weekStart={startOfWeek(anchorDate, { weekStartsOn: 1 })}
            availability={availability}
            shifts={filteredMyShifts}
            onChange={(date) => setEditingDay(availability.find(a => isSameDay(a.date, date)) || { date, status: 'available' })}
          />
        </TabsContent>

      </Tabs>

      {/* ── Dialogs */}
      <ShiftSwapRequestDialog
        open={!!swapShift}
        onClose={() => setSwapShift(null)}
        shift={swapShift ? {
          id: swapShift.id, date: swapShift.date, startTime: swapShift.startTime, endTime: swapShift.endTime,
          location: swapShift.location, role: swapShift.role, status: 'confirmed',
        } : null}
        onSubmitSwap={() => { setSwapShift(null); toast.success('Swap request sent'); }}
      />

      <SwapInboxDialog
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        requests={swapRequests}
        onAccept={(id) => setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'accepted' } : r))}
        onDecline={(id) => setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'declined' } : r))}
      />

      <AvailabilityEditSheet
        day={editingDay}
        onClose={() => setEditingDay(null)}
        onSave={(d, status, note) => { updateAvailability(d, status, note); setEditingDay(null); }}
      />

      <ShiftDetailsSheet
        shift={detailsShift}
        onClose={() => setDetailsShift(null)}
        onSwap={(s) => { setDetailsShift(null); setSwapShift(s); }}
        onMarkAbsent={(s) => { setDetailsShift(null); setAbsentShift(s); }}
        onApplyLeave={(s) => { setDetailsShift(null); setLeaveSeed({ date: s.date }); setLeaveOpen(true); }}
      />

      <MarkAbsentSheet
        shift={absentShift}
        onClose={() => setAbsentShift(null)}
        onConfirm={(s, reason, type) => {
          setAbsentShift(null);
          toast.success(`Marked absent for ${format(s.date, 'EEE d MMM')}${reason ? ` · ${reason}` : ''}`);
          if (type === 'sick' || type === 'annual') {
            setLeaveSeed({ date: s.date, type });
            setLeaveOpen(true);
          }
        }}
      />

      <LeaveRequestSheet
        open={leaveOpen}
        seed={leaveSeed}
        onClose={() => { setLeaveOpen(false); setLeaveSeed(null); }}
        onSubmit={(payload) => {
          setLeaveOpen(false);
          setLeaveSeed(null);
          toast.success(`${payload.type === 'annual' ? 'Annual' : payload.type === 'sick' ? 'Sick' : 'Leave'} request submitted · ${format(payload.from, 'MMM d')}${!isSameDay(payload.from, payload.to) ? ` – ${format(payload.to, 'MMM d')}` : ''}`);
        }}
      />
    </div>
  );
}

// ───────────────────────── KPI Tile ─────────────────────────
function KpiTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={cn("text-lg font-bold tracking-tight", tone)} style={{ letterSpacing: '-0.025em' }}>{value}</p>
        </div>
        <Icon className={cn("h-7 w-7 opacity-40", tone)} />
      </CardContent>
    </Card>
  );
}

// ───────────────────────── List Views ─────────────────────────
function ShiftList({ shifts, onSwap, onOpenDetails }: { shifts: MyShift[]; onSwap: (s: MyShift) => void; onOpenDetails: (s: MyShift) => void }) {
  if (shifts.length === 0) {
    return <EmptyState icon={CalendarIcon} title="No shifts scheduled" desc="You're all caught up. Check the Open Shifts tab to pick up extra work." />;
  }
  return (
    <Card className="border-border/50">
      <ScrollArea className="max-h-[560px]">
        <div className="divide-y divide-border/60">
          {shifts.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onOpenDetails(s)}>
              <div className="text-center min-w-[56px]">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{format(s.date, 'EEE')}</p>
                <p className="text-xl font-bold leading-tight">{format(s.date, 'd')}</p>
                <p className="text-[10px] text-muted-foreground">{format(s.date, 'MMM')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{fmt12(s.startTime)} – {fmt12(s.endTime)}</span>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 capitalize", statusTone[s.status])}>{s.status.replace('-', ' ')}</Badge>
                  {s.clockIn && !s.clockOut && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20 gap-1"><LogIn className="h-2.5 w-2.5" /> Clocked in {fmt12(s.clockIn)}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location} · {s.area}</span>
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{s.role}</span>
                  <span>{s.breakMinutes}m break</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{hoursBetween(s.startTime, s.endTime, s.breakMinutes).toFixed(1)}h</p>
              </div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onOpenDetails(s); }} className="h-8 gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Details
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSwap(s); }} className="gap-1.5 h-8" disabled={s.status === 'completed' || s.status === 'in-progress'}>
                <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function OpenShiftList({ shifts, onClaim }: { shifts: OpenShift[]; onClaim: (s: OpenShift) => void }) {
  if (shifts.length === 0) return <EmptyState icon={Hand} title="No open shifts" desc="Check back later — new shifts are posted as they become available." />;
  return (
    <Card className="border-border/50">
      <ScrollArea className="max-h-[560px]">
        <div className="divide-y divide-border/60">
          {shifts.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className="text-center min-w-[56px]">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{format(s.date, 'EEE')}</p>
                <p className="text-xl font-bold leading-tight">{format(s.date, 'd')}</p>
                <p className="text-[10px] text-muted-foreground">{format(s.date, 'MMM')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{fmt12(s.startTime)} – {fmt12(s.endTime)}</span>
                  {s.premium && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 border text-[10px] px-1.5 py-0 h-5 gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Premium
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location} · {s.area}</span>
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{s.role}</span>
                  {s.reason && <span className="italic">"{s.reason}"</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${s.rate}/hr</p>
                <p className="text-[11px] text-muted-foreground">{s.applicants} applicant{s.applicants === 1 ? '' : 's'}</p>
              </div>
              <Button size="sm" onClick={() => onClaim(s)} className="gap-1.5 h-8">
                <Hand className="h-3.5 w-3.5" /> Apply
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function SwapList({ requests, onAccept, onDecline, onCancel }: {
  requests: SwapRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const filtered = requests.filter(r => filter === 'all' || r.direction === filter);
  if (filtered.length === 0) return <EmptyState icon={ArrowLeftRight} title="No swap requests" desc="When you or a teammate request a swap, it'll appear here." />;
  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5 w-fit">
        {(['all', 'incoming', 'outgoing'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'ghost'} onClick={() => setFilter(f)} className="h-7 capitalize">{f}</Button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-[10px] h-5">{r.direction}</Badge>
                  <Badge variant="outline" className={cn(
                    "capitalize text-[10px] h-5",
                    r.status === 'pending' && 'bg-status-pending/10 text-status-pending border-status-pending/20',
                    r.status === 'accepted' && 'bg-status-approved/10 text-status-approved border-status-approved/20',
                    r.status === 'declined' && 'bg-status-rejected/10 text-status-rejected border-status-rejected/20',
                  )}>{r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{format(r.createdAt, 'MMM d, h:mm a')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SwapShiftCard label={r.direction === 'incoming' ? `${r.fromStaff.name} gives` : 'You give'} shift={r.fromShift} />
                <SwapShiftCard label={r.direction === 'incoming' ? 'You give' : `${r.toStaff.name} gives`} shift={r.toShift} />
              </div>
              {r.reason && <p className="text-xs text-muted-foreground mt-3 italic">"{r.reason}"</p>}
              {r.status === 'pending' && (
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/60">
                  {r.direction === 'incoming' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onDecline(r.id)} className="gap-1.5 h-8"><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                      <Button size="sm" onClick={() => onAccept(r.id)} className="gap-1.5 h-8"><CheckCircle2 className="h-3.5 w-3.5" /> Accept</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onCancel(r.id)} className="h-8">Cancel request</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SwapShiftCard({ label, shift }: { label: string; shift: SwapRequest['fromShift'] }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-sm">{format(shift.date, 'EEE, MMM d')}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{fmt12(shift.startTime)} – {fmt12(shift.endTime)}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{shift.location}</p>
    </div>
  );
}

// ───────────────────────── Calendar Grid (Roster scheduler style) ─────────────────────────
// Time-axis timeline calendar matching the main roster scheduler look,
// adapted for a single staff member (no left staff panel, no right side panel).
const DAY_START_HOUR = 6;   // 6 AM
const DAY_END_HOUR = 23;    // 11 PM
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);

const minutesFromDayStart = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return Math.max(0, (h - DAY_START_HOUR) * 60 + m);
};
const totalDayMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function CalendarGrid({
  weekStart, shifts, openShifts = [], availability, onShiftClick, onAvailabilityClick, onClaim,
}: {
  weekStart: Date;
  shifts: MyShift[];
  openShifts?: OpenShift[];
  availability: AvailabilityDay[];
  onShiftClick?: (s: MyShift) => void;
  onAvailabilityClick?: (d: AvailabilityDay) => void;
  onClaim?: (s: OpenShift) => void;
}) {
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const shiftBarTone: Record<MyShift['status'], string> = {
    confirmed: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-500/25',
    pending: 'bg-amber-500/15 border-amber-500/40 border-dashed text-amber-900 dark:text-amber-100 hover:bg-amber-500/25',
    'in-progress': 'bg-primary/20 border-primary/50 text-foreground hover:bg-primary/30 ring-1 ring-primary/40',
    completed: 'bg-muted border-border text-muted-foreground hover:bg-muted/80',
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Hour axis header */}
        <div className="flex border-b border-border/60 bg-muted/40 sticky top-0 z-10">
          <div className="w-32 shrink-0 border-r border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Day
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0, 1fr))` }}>
            {HOURS.map(h => (
              <div key={h} className="border-r border-border/40 last:border-r-0 px-1 py-2 text-[10px] text-muted-foreground text-center">
                {h === 12 ? '12 PM' : h === 0 ? '12 AM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            ))}
          </div>
        </div>

        {/* Day rows */}
        <ScrollArea className="max-h-[600px]">
          <div>
            {days.map(day => {
              const dayShifts = shifts.filter(s => isSameDay(s.date, day));
              const dayOpen = openShifts.filter(s => isSameDay(s.date, day));
              const avail = availability.find(a => isSameDay(a.date, day));
              const isToday = isSameDay(day, new Date());
              const status = avail?.status || 'available';

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex border-b border-border/60 last:border-b-0 min-h-[64px]",
                    isToday && "bg-primary/5",
                  )}
                >
                  {/* Day label column */}
                  <div className="w-32 shrink-0 border-r border-border/60 p-2 flex flex-col gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {format(day, 'EEE')}
                      </span>
                      <span className={cn("text-base font-bold leading-none", isToday ? "text-primary" : "text-foreground")}>
                        {format(day, 'd')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{format(day, 'MMM')}</span>
                    </div>
                    {avail && (
                      <button
                        onClick={() => onAvailabilityClick?.(avail)}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide w-fit",
                          dayShifts.length > 0
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                            : availTone[status],
                        )}
                        title="Click to edit availability"
                      >
                        {dayShifts.length > 0
                          ? `Working · ${dayShifts.length}`
                          : status === 'unavailable' ? 'Off' : status === 'preferred' ? 'Preferred' : 'Available'}
                      </button>
                    )}
                  </div>

                  {/* Timeline lane */}
                  <div className="flex-1 relative">
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0, 1fr))` }}>
                      {HOURS.map(h => (
                        <div key={h} className="border-r border-border/30 last:border-r-0" />
                      ))}
                    </div>

                    {/* Now indicator */}
                    {isToday && (() => {
                      const now = new Date();
                      const nowMin = (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes();
                      if (nowMin < 0 || nowMin > totalDayMinutes) return null;
                      const left = (nowMin / totalDayMinutes) * 100;
                      return (
                        <div className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none" style={{ left: `${left}%` }}>
                          <div className="absolute -top-1 -left-[3px] h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                      );
                    })()}

                    {/* Shift bars */}
                    <div className="relative h-full py-2 px-1">
                      {dayShifts.map(s => {
                        const startMin = minutesFromDayStart(s.startTime);
                        const endMin = Math.min(totalDayMinutes, minutesFromDayStart(s.endTime));
                        const left = (startMin / totalDayMinutes) * 100;
                        const width = Math.max(2, ((endMin - startMin) / totalDayMinutes) * 100);
                        return (
                          <button
                            key={s.id}
                            onClick={() => onShiftClick?.(s)}
                            className={cn(
                              "absolute rounded-md border px-2 py-1 text-left transition-all overflow-hidden",
                              shiftBarTone[s.status],
                            )}
                            style={{ left: `${left}%`, width: `${width}%`, top: 8, bottom: 8 }}
                            title={`${fmt12(s.startTime)} – ${fmt12(s.endTime)} · ${s.location}`}
                          >
                            <p className="text-[11px] font-semibold truncate leading-tight">
                              {fmt12(s.startTime)} – {fmt12(s.endTime)}
                            </p>
                            <p className="text-[10px] truncate opacity-90">{s.location} · {s.area}</p>
                          </button>
                        );
                      })}

                      {dayOpen.map(s => {
                        const startMin = minutesFromDayStart(s.startTime);
                        const endMin = Math.min(totalDayMinutes, minutesFromDayStart(s.endTime));
                        const left = (startMin / totalDayMinutes) * 100;
                        const width = Math.max(2, ((endMin - startMin) / totalDayMinutes) * 100);
                        return (
                          <button
                            key={s.id}
                            onClick={() => onClaim?.(s)}
                            className="absolute rounded-md border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 px-2 py-1 text-left transition-all overflow-hidden"
                            style={{ left: `${left}%`, width: `${width}%`, top: 8, bottom: 8 }}
                            title={`Open shift · ${fmt12(s.startTime)} – ${fmt12(s.endTime)}`}
                          >
                            <p className="text-[11px] font-semibold truncate leading-tight flex items-center gap-1">
                              {s.premium && <Sparkles className="h-2.5 w-2.5" />}
                              Open · {fmt12(s.startTime)}
                            </p>
                            <p className="text-[10px] truncate opacity-90">${s.rate}/hr · {s.location}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground bg-muted/20">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-emerald-500/40 border border-emerald-500/60" />Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-amber-500/40 border border-amber-500/60 border-dashed" />Pending</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-primary/40 border border-primary/60" />In progress</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-muted border border-border" />Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-amber-500/20 border border-dashed border-amber-500/60" />Open shift</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────────────────── Availability Strip ─────────────────────────
function AvailabilityStrip({ weekStart, availability, shifts, onChange }: {
  weekStart: Date;
  availability: AvailabilityDay[];
  shifts: MyShift[];
  onChange: (date: Date) => void;
}) {
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 13) });
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> My Availability
          </CardTitle>
          <div className="flex items-center gap-3 text-[11px]">
            <Legend tone="bg-blue-500/40" label="Working" />
            <Legend tone="bg-status-approved/40" label="Available" />
            <Legend tone="bg-primary/40" label="Preferred" />
            <Legend tone="bg-status-rejected/40" label="Unavailable" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(day => {
            const a = availability.find(av => isSameDay(av.date, day));
            const status = a?.status || 'available';
            const dayShifts = shifts.filter(s => isSameDay(s.date, day));
            const isWorking = dayShifts.length > 0;
            return (
              <button
                key={day.toISOString()}
                onClick={() => onChange(day)}
                className={cn(
                  "rounded-md border p-2 text-left transition-all hover:scale-[1.02]",
                  isWorking
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    : availTone[status],
                )}
              >
                <p className="text-[10px] uppercase tracking-wide opacity-80">{format(day, 'EEE')}</p>
                <p className="text-base font-bold">{format(day, 'd')}</p>
                {isWorking ? (
                  <div className="mt-0.5">
                    <p className="text-[10px] font-semibold flex items-center gap-1">
                      <Briefcase className="h-2.5 w-2.5" /> Working
                    </p>
                    <p className="text-[10px] opacity-80">{dayShifts.length} shift{dayShifts.length === 1 ? '' : 's'}</p>
                  </div>
                ) : (
                  <p className="text-[10px] capitalize mt-0.5 opacity-90">{status}</p>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return <span className="flex items-center gap-1 text-muted-foreground"><span className={cn("h-2.5 w-2.5 rounded-sm", tone)} />{label}</span>;
}

// ───────────────────────── Availability edit sheet ─────────────────────────
function AvailabilityEditSheet({ day, onClose, onSave }: {
  day: AvailabilityDay | null;
  onClose: () => void;
  onSave: (d: Date, status: AvailabilityStatus, note?: string) => void;
}) {
  const [status, setStatus] = useState<AvailabilityStatus>(day?.status || 'available');
  const [note, setNote] = useState(day?.note || '');
  const [recurring, setRecurring] = useState(false);

  // Re-sync when day changes
  useMemo(() => { if (day) { setStatus(day.status); setNote(day.note || ''); } }, [day]);

  return (
    <Sheet open={!!day} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit availability</SheetTitle>
          <SheetDescription>{day && format(day.date, 'EEEE, MMMM d, yyyy')}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['available', 'preferred', 'unavailable'] as AvailabilityStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-xs font-medium capitalize transition-all",
                    status === s ? availTone[s] + " ring-2 ring-offset-1 ring-current" : "bg-background border-border text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avail-note">Note (optional)</Label>
            <Textarea id="avail-note" placeholder="e.g. Available after 2 PM only" value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="recur" className="cursor-pointer">Apply weekly</Label>
              <p className="text-[11px] text-muted-foreground">Repeat for every {day && format(day.date, 'EEEE')} going forward</p>
            </div>
            <Switch id="recur" checked={recurring} onCheckedChange={setRecurring} />
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => day && onSave(day.date, status, note)}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ───────────────────────── Empty state ─────────────────────────
function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}

// ───────────────────────── Shift Details Sheet ─────────────────────────
function ShiftDetailsSheet({ shift, onClose, onSwap }: {
  shift: MyShift | null;
  onClose: () => void;
  onSwap: (s: MyShift) => void;
}) {
  if (!shift) return null;
  const scheduled = hoursBetween(shift.startTime, shift.endTime, shift.breakMinutes);
  const breakTotal = (shift.breaks || []).reduce((acc, b) => {
    if (!b.end) return acc;
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0) || shift.breakMinutes;
  const eligibleForSwap = shift.status === 'confirmed' || shift.status === 'pending';

  return (
    <Sheet open={!!shift} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Shift details</SheetTitle>
            <Badge variant="outline" className={cn("capitalize text-[10px] h-5", statusTone[shift.status])}>
              {shift.status.replace('-', ' ')}
            </Badge>
          </div>
          <SheetDescription>{format(shift.date, 'EEEE, MMMM d, yyyy')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Time block */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Scheduled time</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                {fmt12(shift.startTime)} – {fmt12(shift.endTime)}
              </span>
              <span className="text-sm text-muted-foreground">· {scheduled.toFixed(1)}h paid</span>
            </div>
          </div>

          {/* Clock in/out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                <LogIn className="h-3 w-3" /> Clock in
              </p>
              <p className="text-base font-semibold">
                {shift.clockIn ? fmt12(shift.clockIn) : <span className="text-muted-foreground font-normal">Not clocked in</span>}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                <LogOut className="h-3 w-3" /> Clock out
              </p>
              <p className="text-base font-semibold">
                {shift.clockOut ? fmt12(shift.clockOut) : <span className="text-muted-foreground font-normal">Not clocked out</span>}
              </p>
            </div>
          </div>

          {/* Breaks */}
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
              <Coffee className="h-3 w-3" /> Breaks · {breakTotal}m total
            </p>
            {shift.breaks && shift.breaks.length > 0 ? (
              <ul className="space-y-1.5">
                {shift.breaks.map((b, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{b.label || (b.type === 'paid' ? 'Paid break' : 'Unpaid break')}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {fmt12(b.start)} – {b.end ? fmt12(b.end) : 'in progress'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{shift.breakMinutes}m unpaid break scheduled</p>
            )}
          </div>

          {/* Location & role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="text-sm font-semibold">{shift.location}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{shift.area}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                <Briefcase className="h-3 w-3" /> Role
              </p>
              <p className="text-sm font-semibold">{shift.role}</p>
            </div>
          </div>

          {shift.notes && (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm">{shift.notes}</p>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6 flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={() => onSwap(shift)}
            disabled={!eligibleForSwap}
            className="gap-1.5"
            title={eligibleForSwap ? 'Request a swap with another team member' : 'This shift cannot be swapped'}
          >
            <ArrowLeftRight className="h-4 w-4" /> Request swap
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
