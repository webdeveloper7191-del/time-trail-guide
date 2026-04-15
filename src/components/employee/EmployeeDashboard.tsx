import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Clock, Calendar, MapPin, ArrowRight, CalendarPlus,
  FileText, CheckCircle2, AlertCircle, TreePalm, Briefcase,
  ClipboardCheck, TrendingUp, Bell, Sun, Sunrise, Moon,
  Users, LogIn, LogOut, Play, Square, Send, ArrowLeftRight, Inbox, Coffee,
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShiftSwapRequestDialog } from './ShiftSwapRequestDialog';
import { SwapInboxDialog, generateMockSwapRequests, type SwapRequest } from './SwapInboxDialog';
import { BreakTracker, type BreakRecord } from './BreakTracker';

interface EmployeeDashboardProps {
  employee: { id: string; name: string; department: string; position: string; hourlyRate: number };
  onNavigate: (tab: string) => void;
  onboardingProgress: number;
  onboardingComplete: boolean;
}

interface ShiftItem {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  role: string;
  status: 'confirmed' | 'pending';
  pickedUp?: boolean;
  premium?: boolean;
  rate?: string;
}

interface ClockState {
  isClockedIn: boolean;
  clockInTime: Date | null;
  shiftId: string | null;
  elapsed: number; // seconds
}

const initialUpcomingShifts: ShiftItem[] = [
  { id: '1', date: new Date(), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' },
  { id: '2', date: addDays(new Date(), 1), startTime: '06:00', endTime: '14:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' },
  { id: '3', date: addDays(new Date(), 2), startTime: '14:00', endTime: '22:00', location: 'Events Hall', role: 'Sous Chef', status: 'pending' },
  { id: '4', date: addDays(new Date(), 4), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' },
];

const initialOpenShifts: ShiftItem[] = [
  { id: 'o1', date: addDays(new Date(), 1), startTime: '16:00', endTime: '22:00', location: 'Poolside Bar', role: 'Bartender', status: 'confirmed', premium: true, rate: '+$5/hr' },
  { id: 'o2', date: addDays(new Date(), 3), startTime: '06:00', endTime: '14:00', location: 'Main Kitchen', role: 'Prep Cook', status: 'confirmed', premium: false, rate: '' },
  { id: 'o3', date: addDays(new Date(), 5), startTime: '10:00', endTime: '18:00', location: 'Events Hall', role: 'Server', status: 'confirmed', premium: true, rate: '+$3/hr' },
];

const mockLeaveBalances = [
  { type: 'Annual Leave', used: 8, total: 20, color: 'bg-blue-500' },
  { type: 'Personal/Sick', used: 2, total: 10, color: 'bg-amber-500' },
  { type: 'Long Service', used: 0, total: 0, color: 'bg-purple-500', accruing: true },
];

const mockPendingLeave = [
  { id: 'l1', type: 'Annual Leave', startDate: addDays(new Date(), 14), endDate: addDays(new Date(), 18), status: 'pending' as const, days: 5 },
];

const mockTimesheetSummary = {
  currentWeekHours: 24.5,
  targetHours: 38,
  pendingApproval: 1,
  lastApproved: '2026-04-06',
  overtimeThisWeek: 0,
};

const mockNotifications = [
  { id: 'n1', message: 'Your timesheet for Apr 6-12 was approved', time: '2h ago', type: 'success' as const },
  { id: 'n2', message: 'New open shift available: Poolside Bar tomorrow', time: '4h ago', type: 'info' as const },
  { id: 'n3', message: 'Leave request for Apr 28 – May 2 is pending review', time: '1d ago', type: 'warning' as const },
];

function getShiftIcon(startTime: string) {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 10) return Sunrise;
  if (hour < 16) return Sun;
  return Moon;
}

function getDateLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function EmployeeDashboard({ employee, onNavigate, onboardingProgress, onboardingComplete }: EmployeeDashboardProps) {
  

  // ── Shift state ──
  const [upcomingShifts, setUpcomingShifts] = useState<ShiftItem[]>(initialUpcomingShifts);
  const [openShifts, setOpenShifts] = useState<ShiftItem[]>(initialOpenShifts);
  const [pickingUpId, setPickingUpId] = useState<string | null>(null);

  // ── Clock-in/out state ──
  const [clockState, setClockState] = useState<ClockState>({
    isClockedIn: false, clockInTime: null, shiftId: null, elapsed: 0,
  });
  const [clockInterval, setClockIntervalRef] = useState<ReturnType<typeof setInterval> | null>(null);

  // ── Leave request dialog ──
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'annual_leave', startDate: '', endDate: '', notes: '' });
  const [pendingLeaves, setPendingLeaves] = useState(mockPendingLeave);

  // ── Shift swap dialog ──
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapShift, setSwapShift] = useState<ShiftItem | null>(null);
  const [pendingSwaps, setPendingSwaps] = useState<{ id: string; shiftId: string; colleagueName: string; date: Date }[]>([]);

  const nextShift = upcomingShifts[0];
  const todayShift = upcomingShifts.find(s => isToday(s.date));

  // ── Live timesheet hours: base + clocked elapsed ──
  const liveWeekHours = useMemo(() => {
    const clockedHours = clockState.isClockedIn ? clockState.elapsed / 3600 : 0;
    return Math.round((mockTimesheetSummary.currentWeekHours + clockedHours) * 10) / 10;
  }, [clockState.isClockedIn, clockState.elapsed]);
  const liveOvertime = useMemo(() => {
    return Math.max(0, Math.round((liveWeekHours - mockTimesheetSummary.targetHours) * 10) / 10);
  }, [liveWeekHours]);
  const hoursProgress = (liveWeekHours / mockTimesheetSummary.targetHours) * 100;

  // ── Pick up open shift ──
  const handlePickUp = useCallback((shiftId: string) => {
    setPickingUpId(shiftId);
    const shift = openShifts.find(s => s.id === shiftId);
    if (!shift) return;

    // Simulate API delay
    setTimeout(() => {
      const pickedShift: ShiftItem = {
        ...shift,
        id: `picked-${shift.id}`,
        status: 'pending',
        pickedUp: true,
      };
      setUpcomingShifts(prev => [...prev, pickedShift].sort((a, b) => a.date.getTime() - b.date.getTime()));
      setOpenShifts(prev => prev.filter(s => s.id !== shiftId));
      setPickingUpId(null);
      toast.success(`Shift Picked Up! ${shift.role} on ${getDateLabel(shift.date)} (${shift.startTime} – ${shift.endTime}) added to your schedule.`);
    }, 600);
  }, [openShifts]);

  // ── Clock in/out ──
  const handleClockIn = useCallback(() => {
    if (!todayShift) return;
    const now = new Date();
    setClockState({ isClockedIn: true, clockInTime: now, shiftId: todayShift.id, elapsed: 0 });
    const interval = setInterval(() => {
      setClockState(prev => ({ ...prev, elapsed: prev.elapsed + 1 }));
    }, 1000);
    setClockIntervalRef(interval);
    toast.success(`Clocked In — Started at ${format(now, 'HH:mm')}`);
  }, [todayShift]);

  const handleClockOut = useCallback(() => {
    if (clockInterval) clearInterval(clockInterval);
    const elapsed = clockState.elapsed;
    const hours = (elapsed / 3600).toFixed(1);
    setClockState({ isClockedIn: false, clockInTime: null, shiftId: null, elapsed: 0 });
    setClockIntervalRef(null);
    toast.success(`Clocked Out — Total time: ${hours} hours logged.`);
  }, [clockInterval, clockState.elapsed]);

  // ── Leave request ──
  const handleLeaveSubmit = useCallback(() => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please select start and end dates.');
      return;
    }
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    if (end < start) {
      toast.error('End date must be after start date.');
      return;
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const typeLabels: Record<string, string> = {
      annual_leave: 'Annual Leave', sick_leave: 'Sick Leave',
      personal_leave: 'Personal Leave', unpaid_leave: 'Unpaid Leave',
    };
    const newLeave = {
      id: `l-${Date.now()}`,
      type: typeLabels[leaveForm.type] || leaveForm.type,
      startDate: start,
      endDate: end,
      status: 'pending' as const,
      days,
    };
    setPendingLeaves(prev => [...prev, newLeave]);
    setLeaveDialogOpen(false);
    setLeaveForm({ type: 'annual_leave', startDate: '', endDate: '', notes: '' });
    toast.success(`Leave Request Submitted — ${newLeave.type} for ${days} day(s) is pending approval.`);
  }, [leaveForm]);

  // ── Shift swap ──
  const handleOpenSwap = useCallback((shift: ShiftItem) => {
    setSwapShift(shift);
    setSwapDialogOpen(true);
  }, []);

  const handleSwapSubmit = useCallback((fromShiftId: string, toStaffId: string, reason: string) => {
    const colleagueNames: Record<string, string> = {
      'col-1': 'James Wilson', 'col-2': 'Maria Garcia',
      'col-3': 'Alex Thompson', 'col-4': 'Emily Park',
    };
    const shift = upcomingShifts.find(s => s.id === fromShiftId);
    setPendingSwaps(prev => [...prev, {
      id: `swap-${Date.now()}`,
      shiftId: fromShiftId,
      colleagueName: colleagueNames[toStaffId] || 'Unknown',
      date: shift?.date || new Date(),
    }]);
  }, [upcomingShifts]);

  return (
    <div className="space-y-6">
      {/* Clock-In/Out Banner */}
      {todayShift && (
        <Card className={cn(
          'border overflow-hidden',
          clockState.isClockedIn
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5'
            : 'border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center',
                  clockState.isClockedIn ? 'bg-emerald-500/20' : 'bg-primary/15'
                )}>
                  {clockState.isClockedIn ? (
                    <Play className="h-6 w-6 text-emerald-600 fill-emerald-600" />
                  ) : (
                    <LogIn className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {clockState.isClockedIn ? 'Currently Working' : "Today's Shift"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayShift.startTime} – {todayShift.endTime} • {todayShift.role} • {todayShift.location}
                  </p>
                  {clockState.isClockedIn && clockState.clockInTime && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clocked in at {format(clockState.clockInTime, 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {clockState.isClockedIn && (
                  <div className="text-right mr-2">
                    <p className="text-2xl font-mono font-bold text-emerald-600 tabular-nums">
                      {formatElapsed(clockState.elapsed)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">elapsed</p>
                  </div>
                )}
                {clockState.isClockedIn ? (
                  <Button onClick={handleClockOut} variant="destructive" size="sm" className="gap-2">
                    <Square className="h-3.5 w-3.5 fill-current" /> Clock Out
                  </Button>
                ) : (
                  <Button onClick={handleClockIn} size="sm" className="gap-2">
                    <LogIn className="h-3.5 w-3.5" /> Clock In
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Glance Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          icon={Clock}
          label="Hours This Week"
          value={`${liveWeekHours}h`}
          sub={`of ${mockTimesheetSummary.targetHours}h target`}
          accent="text-blue-600"
          bgAccent="from-blue-500/10 to-blue-600/5 border-blue-200/60"
        />
        <QuickStat
          icon={Calendar}
          label="Next Shift"
          value={nextShift ? (isToday(nextShift.date) ? 'Today' : isTomorrow(nextShift.date) ? 'Tomorrow' : format(nextShift.date, 'EEE')) : '—'}
          sub={nextShift ? `${nextShift.startTime} – ${nextShift.endTime}` : 'No shifts'}
          accent="text-emerald-600"
          bgAccent="from-emerald-500/10 to-emerald-600/5 border-emerald-200/60"
        />
        <QuickStat
          icon={CalendarPlus}
          label="Open Shifts"
          value={`${openShifts.length}`}
          sub="available to pick up"
          accent="text-amber-600"
          bgAccent="from-amber-500/10 to-amber-600/5 border-amber-200/60"
        />
        <QuickStat
          icon={TreePalm}
          label="Leave Balance"
          value={`${mockLeaveBalances[0].total - mockLeaveBalances[0].used}d`}
          sub="annual leave remaining"
          accent="text-purple-600"
          bgAccent="from-purple-500/10 to-purple-600/5 border-purple-200/60"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Shifts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Shifts */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming Shifts
                  {upcomingShifts.some(s => s.pickedUp) && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Updated</Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => onNavigate('current')}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {upcomingShifts.map((shift) => {
                  const Icon = getShiftIcon(shift.startTime);
                  const today = isToday(shift.date);
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'flex items-center gap-4 p-3.5 rounded-lg border transition-all',
                        shift.pickedUp
                          ? 'bg-emerald-500/5 border-emerald-300/40 ring-1 ring-emerald-200/30 animate-in fade-in slide-in-from-left-2'
                          : today
                            ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                            : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        shift.pickedUp ? 'bg-emerald-500/15 text-emerald-600' :
                        today ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{getDateLabel(shift.date)}</span>
                          {today && <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5 py-0">NOW</Badge>}
                          {shift.pickedUp && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">Picked Up</Badge>
                          )}
                          {shift.status === 'pending' && !shift.pickedUp && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {shift.startTime} – {shift.endTime} • {shift.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {shift.location}
                          </div>
                        </div>
                        {shift.status === 'confirmed' && !shift.pickedUp && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); handleOpenSwap(shift); }}
                            title="Request swap"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {pendingSwaps.some(s => s.shiftId === shift.id) && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">Swap Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Open Shifts */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-amber-600" />
                  Open Shifts
                  {openShifts.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">{openShifts.length} available</Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {openShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No open shifts available right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openShifts.map((shift) => (
                    <div key={shift.id} className="flex items-center gap-4 p-3.5 rounded-lg bg-muted/30 border border-border/50 hover:border-amber-300/50 transition-colors group">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{getDateLabel(shift.date)}</span>
                          {shift.premium && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">
                              {shift.rate}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {shift.startTime} – {shift.endTime} • {shift.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{shift.location}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                          disabled={pickingUpId === shift.id}
                          onClick={() => handlePickUp(shift.id)}
                        >
                          {pickingUpId === shift.id ? (
                            <>
                              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Picking up…
                            </>
                          ) : (
                            'Pick Up'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timesheet Summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Timesheet Summary
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => onNavigate('current')}>
                  View details <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">This week's hours</span>
                    <span className="font-semibold">
                      {liveWeekHours}h / {mockTimesheetSummary.targetHours}h
                      {clockState.isClockedIn && <span className="text-emerald-600 text-xs ml-1 animate-pulse">● LIVE</span>}
                    </span>
                  </div>
                  <Progress value={Math.min(hoursProgress, 100)} className="h-2.5" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className={cn('text-lg font-bold tabular-nums', clockState.isClockedIn && 'text-emerald-600')}>{liveWeekHours}h</p>
                    <p className="text-[10px] text-muted-foreground">{clockState.isClockedIn ? 'Live' : 'Logged'}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className={cn('text-lg font-bold tabular-nums', liveOvertime > 0 ? 'text-amber-600' : '')}>{liveOvertime}h</p>
                    <p className="text-[10px] text-muted-foreground">Overtime</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-bold text-amber-600">{mockTimesheetSummary.pendingApproval}</p>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Leave, Onboarding, Activity */}
        <div className="space-y-6">
          {/* Onboarding Card (if incomplete) */}
          {!onboardingComplete && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-primary">{onboardingProgress}%</span>
                  </div>
                  <Progress value={onboardingProgress} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">Complete your profile, documents, and contracts to get started.</p>
                <Button size="sm" className="w-full gap-1.5" onClick={() => onNavigate('onboarding')}>
                  Continue Setup <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Leave Balances */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TreePalm className="h-4 w-4 text-purple-600" />
                  Leave
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => setLeaveDialogOpen(true)}>
                  <Send className="h-3 w-3" /> Request
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {mockLeaveBalances.map((leave) => (
                <div key={leave.type} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{leave.type}</span>
                    {leave.accruing ? (
                      <span className="text-xs text-muted-foreground italic">Accruing</span>
                    ) : (
                      <span className="font-medium">{leave.total - leave.used}d / {leave.total}d</span>
                    )}
                  </div>
                  {!leave.accruing && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', leave.color)}
                        style={{ width: `${(leave.used / leave.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Pending Leave Requests */}
              {pendingLeaves.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pending Requests</p>
                  <div className="space-y-2">
                    {pendingLeaves.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/50">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{req.type} • {req.days} days</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(req.startDate, 'MMM d')} – {format(req.endDate, 'MMM d')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-1.5 shrink-0',
                      notif.type === 'success' && 'bg-emerald-500',
                      notif.type === 'info' && 'bg-blue-500',
                      notif.type === 'warning' && 'bg-amber-500',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'My Timesheets', icon: FileText, tab: 'current' },
                  { label: 'Performance', icon: TrendingUp, tab: 'performance' },
                  { label: 'My OKRs', icon: Users, tab: 'okrs' },
                  { label: 'Learning', icon: ClipboardCheck, tab: 'learning' },
                ].map((action) => (
                  <Button
                    key={action.tab}
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1.5 text-xs"
                    onClick={() => onNavigate(action.tab)}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Request Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TreePalm className="h-5 w-5 text-purple-600" />
              Request Leave
            </DialogTitle>
            <DialogDescription>Submit a new leave request for manager approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual_leave">Annual Leave</SelectItem>
                  <SelectItem value="sick_leave">Sick Leave</SelectItem>
                  <SelectItem value="personal_leave">Personal Leave</SelectItem>
                  <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional details…"
                value={leaveForm.notes}
                onChange={(e) => setLeaveForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            {/* Balance reminder */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Balance: </span>
                {mockLeaveBalances[0].total - mockLeaveBalances[0].used} days annual leave remaining
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLeaveSubmit} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Swap Dialog */}
      <ShiftSwapRequestDialog
        open={swapDialogOpen}
        onClose={() => { setSwapDialogOpen(false); setSwapShift(null); }}
        shift={swapShift}
        onSubmitSwap={handleSwapSubmit}
      />
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, sub, accent, bgAccent }: {
  icon: React.ElementType; label: string; value: string; sub: string; accent: string; bgAccent: string;
}) {
  return (
    <Card className={cn('bg-gradient-to-br border', bgAccent)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
            <p className={cn('text-2xl font-bold', accent)}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center bg-background/60')}>
            <Icon className={cn('h-5 w-5', accent)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
