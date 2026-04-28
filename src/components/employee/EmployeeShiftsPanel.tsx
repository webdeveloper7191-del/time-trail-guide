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
} from 'lucide-react';
import {
  format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO,
  eachDayOfInterval, addWeeks, subWeeks, isWithinInterval,
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
  { id: 's1', date: addDays(today, 0), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'in-progress', breakMinutes: 30 },
  { id: 's2', date: addDays(today, 1), startTime: '08:00', endTime: '16:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
  { id: 's3', date: addDays(today, 2), startTime: '12:00', endTime: '20:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'confirmed', breakMinutes: 45 },
  { id: 's4', date: addDays(today, 4), startTime: '09:00', endTime: '17:00', location: 'Main Centre', area: 'Operations', role: 'Coordinator', status: 'pending', breakMinutes: 30 },
  { id: 's5', date: addDays(today, 7), startTime: '07:00', endTime: '15:00', location: 'Main Centre', area: 'Front of House', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
  { id: 's6', date: addDays(today, 8), startTime: '14:00', endTime: '22:00', location: 'North Branch', area: 'Floor', role: 'Coordinator', status: 'confirmed', breakMinutes: 30 },
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
export function EmployeeShiftsPanel() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [tab, setTab] = useState<'mine' | 'open' | 'swaps'>('mine');
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [availability, setAvailability] = useState<AvailabilityDay[]>(seedAvailability(startOfWeek(today, { weekStartsOn: 1 })));
  const [swapShift, setSwapShift] = useState<MyShift | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState<string>('all');
  const [editingDay, setEditingDay] = useState<AvailabilityDay | null>(null);

  const locations = useMemo(() => Array.from(new Set([...mockMyShifts, ...mockOpenShifts].map(s => s.location))), []);

  const filteredMyShifts = useMemo(() =>
    mockMyShifts.filter(s =>
      (locFilter === 'all' || s.location === locFilter) &&
      (search === '' || s.location.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => a.date.getTime() - b.date.getTime()),
  [search, locFilter]);

  const filteredOpen = useMemo(() =>
    mockOpenShifts.filter(s => locFilter === 'all' || s.location === locFilter)
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
  [locFilter]);

  const pendingIncoming = swapRequests.filter(r => r.direction === 'incoming' && r.status === 'pending').length;

  const totalHours = filteredMyShifts.reduce((sum, s) => sum + hoursBetween(s.startTime, s.endTime, s.breakMinutes), 0);

  // ── Navigation
  const goPrev = () => setWeekStart(w => subWeeks(w, view === 'calendar' ? 2 : 1));
  const goNext = () => setWeekStart(w => addWeeks(w, view === 'calendar' ? 2 : 1));
  const goToday = () => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));

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
            <span className="ml-2 text-sm font-medium text-foreground">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, view === 'calendar' ? 13 : 6), 'MMM d, yyyy')}
            </span>
          </div>

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
          {view === 'list' ? (
            <ShiftList
              shifts={filteredMyShifts}
              onSwap={(s) => setSwapShift(s)}
            />
          ) : (
            <CalendarGrid
              weekStart={weekStart}
              shifts={filteredMyShifts}
              availability={availability}
              onShiftClick={(s) => setSwapShift(s)}
              onAvailabilityClick={(d) => setEditingDay(d)}
            />
          )}
          <AvailabilityStrip
            weekStart={weekStart}
            availability={availability}
            onChange={(date) => setEditingDay(availability.find(a => isSameDay(a.date, date)) || { date, status: 'available' })}
          />
        </TabsContent>

        {/* ── Open Shifts */}
        <TabsContent value="open" className="mt-4 space-y-4">
          {view === 'list' ? (
            <OpenShiftList shifts={filteredOpen} onClaim={claimOpen} />
          ) : (
            <CalendarGrid
              weekStart={weekStart}
              shifts={[]}
              openShifts={filteredOpen}
              availability={availability}
              onClaim={claimOpen}
            />
          )}
        </TabsContent>

        {/* ── Swaps */}
        <TabsContent value="swaps" className="mt-4">
          <SwapList
            requests={swapRequests}
            onAccept={(id) => { setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'accepted', respondedAt: new Date() } : r)); toast.success('Swap accepted'); }}
            onDecline={(id) => { setSwapRequests(p => p.map(r => r.id === id ? { ...r, status: 'declined', respondedAt: new Date() } : r)); toast.info('Swap declined'); }}
            onCancel={(id) => { setSwapRequests(p => p.filter(r => r.id !== id)); toast.info('Swap cancelled'); }}
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
function ShiftList({ shifts, onSwap }: { shifts: MyShift[]; onSwap: (s: MyShift) => void }) {
  if (shifts.length === 0) {
    return <EmptyState icon={CalendarIcon} title="No shifts scheduled" desc="You're all caught up. Check the Open Shifts tab to pick up extra work." />;
  }
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
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 capitalize", statusTone[s.status])}>{s.status.replace('-', ' ')}</Badge>
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
              <Button size="sm" variant="outline" onClick={() => onSwap(s)} className="gap-1.5 h-8" disabled={s.status === 'completed' || s.status === 'in-progress'}>
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

// ───────────────────────── Calendar Grid ─────────────────────────
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
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 13) });
  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayShifts = shifts.filter(s => isSameDay(s.date, day));
            const dayOpen = openShifts.filter(s => isSameDay(s.date, day));
            const avail = availability.find(a => isSameDay(a.date, day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={cn(
                "border-r border-b border-border/60 min-h-[110px] p-2 flex flex-col gap-1",
                isToday && "bg-primary/5",
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-foreground")}>{format(day, 'd')}</span>
                  {avail && (
                    <button
                      onClick={() => onAvailabilityClick?.(avail)}
                      className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", availTone[avail.status])}
                      title="Click to edit availability"
                    >
                      {avail.status === 'unavailable' ? 'Off' : avail.status === 'preferred' ? 'Pref' : 'Avail'}
                    </button>
                  )}
                </div>
                {dayShifts.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onShiftClick?.(s)}
                    className={cn("text-left rounded border px-1.5 py-1 text-[10px] leading-tight hover:opacity-80", statusTone[s.status])}
                  >
                    <p className="font-semibold">{fmt12(s.startTime)}</p>
                    <p className="opacity-80 truncate">{s.location}</p>
                  </button>
                ))}
                {dayOpen.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onClaim?.(s)}
                    className="text-left rounded border border-dashed border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-1.5 py-1 text-[10px] leading-tight hover:bg-amber-500/15"
                  >
                    <p className="font-semibold flex items-center gap-1">
                      {s.premium && <Sparkles className="h-2.5 w-2.5" />}
                      {fmt12(s.startTime)} · ${s.rate}
                    </p>
                    <p className="opacity-80 truncate">Open · {s.location}</p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────────────────── Availability Strip ─────────────────────────
function AvailabilityStrip({ weekStart, availability, onChange }: {
  weekStart: Date;
  availability: AvailabilityDay[];
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
            return (
              <button
                key={day.toISOString()}
                onClick={() => onChange(day)}
                className={cn("rounded-md border p-2 text-left transition-all hover:scale-[1.02]", availTone[status])}
              >
                <p className="text-[10px] uppercase tracking-wide opacity-80">{format(day, 'EEE')}</p>
                <p className="text-base font-bold">{format(day, 'd')}</p>
                <p className="text-[10px] capitalize mt-0.5 opacity-90">{status}</p>
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
