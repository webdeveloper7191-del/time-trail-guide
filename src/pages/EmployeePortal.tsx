import { useState, useMemo } from 'react';
import { mockTimesheets } from '@/data/mockTimesheets';
import { Timesheet } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock, Calendar, CheckCircle2, XCircle, AlertCircle,
  TrendingUp, Coffee, DollarSign, FileText, ChevronRight,
  User, Building2, Hourglass, ShieldCheck, ShieldAlert,
  GraduationCap, Target, MessageSquare, Users, Sparkles,
  ClipboardCheck, LayoutDashboard, Search, Bell, Settings as SettingsIcon,
  Send,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmployeePortalSidebar } from '@/components/employee/EmployeePortalSidebar';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/timesheet/StatusBadge';
import { EmployeeLMSPanel } from '@/components/performance/EmployeeLMSPanel';
import { EmployeePerformancePanel } from '@/components/performance/EmployeePerformancePanel';
import { EmployeeOKRPanel } from '@/components/performance/EmployeeOKRPanel';
import { EmployeeSurveyPanel } from '@/components/performance/EmployeeSurveyPanel';
import { Employee360Panel } from '@/components/performance/Employee360Panel';
import { EmployeeRecognitionPanel } from '@/components/performance/EmployeeRecognitionPanel';
import { EmployeeCareerPathingPanel } from '@/components/performance/employee/EmployeeCareerPathingPanel';
import { EmployeeOnboardingPanel } from '@/components/employee/EmployeeOnboardingPanel';
import { OnboardingBanner } from '@/components/employee/OnboardingBanner';
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard';
import { EmployeeShiftsPanel } from '@/components/employee/EmployeeShiftsPanel';

// Mock current employee (in real app, this would come from auth)
const currentEmployee = {
  id: 'ts-001',
  name: 'Sarah Chen',
  email: 'sarah.chen@company.com',
  department: 'Operations',
  position: 'Operations Coordinator',
  hourlyRate: 28,
};

export function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const onboardingProgress = onboardingComplete ? 100 : 35; // Mock progress
  // Filter timesheets for current employee
  const myTimesheets = useMemo(() => {
    return mockTimesheets.filter(ts => 
      ts.employee.name === currentEmployee.name
    );
  }, []);

  const currentWeekTimesheet = myTimesheets[0];
  const pastTimesheets = myTimesheets.slice(1);

  // Calculate stats
  const stats = useMemo(() => {
    const totalHours = myTimesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const totalOvertime = myTimesheets.reduce((sum, ts) => sum + ts.overtimeHours, 0);
    const totalBreaks = myTimesheets.reduce((sum, ts) => sum + ts.totalBreakMinutes, 0);
    const approvedCount = myTimesheets.filter(ts => ts.status === 'approved').length;
    const avgHoursPerWeek = myTimesheets.length > 0 ? totalHours / myTimesheets.length : 0;
    const estimatedPay = totalHours * currentEmployee.hourlyRate + totalOvertime * currentEmployee.hourlyRate * 1.5;

    return {
      totalHours,
      totalOvertime,
      totalBreaks: Math.round(totalBreaks / 60 * 10) / 10,
      approvedCount,
      pendingCount: myTimesheets.filter(ts => ts.status === 'pending').length,
      avgHoursPerWeek: Math.round(avgHoursPerWeek * 10) / 10,
      estimatedPay: Math.round(estimatedPay * 100) / 100,
    };
  }, [myTimesheets]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Your activity at a glance' },
    onboarding: { title: 'Onboarding', subtitle: 'Complete your setup' },
    schedule: { title: 'My Schedule', subtitle: 'Shifts, open shifts and swap requests' },
    current: { title: 'My Timesheets', subtitle: 'Review your hours and compliance' },
    recognition: { title: 'Recognition', subtitle: 'Celebrate your team' },
    performance: { title: 'Performance', subtitle: 'Reviews, goals and feedback' },
    okrs: { title: 'My OKRs', subtitle: 'Track objectives and key results' },
    career: { title: 'Career Path', subtitle: 'Explore your growth journey' },
    surveys: { title: 'Surveys', subtitle: 'Share your voice' },
    '360': { title: '360° Feedback', subtitle: 'Multi-source feedback' },
    learning: { title: 'Learning', subtitle: 'Courses and certifications' },
  };
  const currentPage = pageTitles[activeTab] ?? pageTitles.dashboard;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <EmployeeDashboard
            employee={currentEmployee}
            onNavigate={setActiveTab}
            onboardingProgress={onboardingProgress}
            onboardingComplete={onboardingComplete}
          />
        );
      case 'onboarding':
        return <EmployeeOnboardingPanel />;
      case 'schedule':
        return <EmployeeShiftsPanel />;
      case 'current':
        return (
          <MyTimesheetsView
            currentWeek={currentWeekTimesheet}
            history={pastTimesheets}
            stats={stats}
          />
        );

      case 'recognition':
        return <EmployeeRecognitionPanel currentUserId={currentEmployee.id} />;
      case 'performance':
        return <EmployeePerformancePanel currentUserId={currentEmployee.id} />;
      case 'okrs':
        return <EmployeeOKRPanel currentUserId={currentEmployee.id} />;
      case 'career':
        return <EmployeeCareerPathingPanel currentUserId={currentEmployee.id} />;
      case 'surveys':
        return <EmployeeSurveyPanel currentUserId={currentEmployee.id} />;
      case '360':
        return <Employee360Panel currentUserId={currentEmployee.id} />;
      case 'learning':
        return <EmployeeLMSPanel currentUserId={currentEmployee.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <EmployeePortalSidebar
        activeTab={activeTab}
        onChange={setActiveTab}
        showOnboarding={!onboardingComplete}
        employeeName={currentEmployee.name}
        employeePosition={currentEmployee.position}
      />

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top utility bar with search */}
        <div className="h-14 border-b border-border bg-card flex items-center gap-4 px-6 sticky top-0 z-20">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by keywords"
              className="pl-9 h-9 bg-background"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <SettingsIcon className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70">
              <AvatarFallback className="text-primary-foreground text-xs font-medium">
                {getInitials(currentEmployee.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Page header banner */}
        <div className="bg-primary/5 border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{currentPage.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{currentPage.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-8 py-6 overflow-x-hidden">
          {/* Onboarding Banner */}
          {!onboardingComplete && activeTab !== 'onboarding' && (
            <OnboardingBanner
              progressPct={onboardingProgress}
              onNavigate={() => setActiveTab('onboarding')}
            />
          )}

          {/* Stats Cards (only on dashboard) */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalHours}h</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Overtime</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.totalOvertime}h</p>
                    </div>
                    <Hourglass className="h-8 w-8 text-amber-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Approved</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.approvedCount}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-600/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Est. Pay</p>
                      <p className="text-2xl font-bold text-purple-600">${stats.estimatedPay}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// My Timesheets — full view with clock in/out, add entry, tabs
// ============================================================
function MyTimesheetsView({
  currentWeek,
  history,
  stats,
}: {
  currentWeek?: Timesheet;
  history: Timesheet[];
  stats: any;
}) {
  const [tab, setTab] = useState('current');
  const [clockState, setClockState] = useState<{
    clockedIn: boolean;
    onBreak: boolean;
    startedAt: string | null;
    breakStartedAt: string | null;
    todayMinutes: number;
    breakMinutes: number;
  }>({
    clockedIn: false,
    onBreak: false,
    startedAt: null,
    breakStartedAt: null,
    todayMinutes: 0,
    breakMinutes: 0,
  });
  const [addOpen, setAddOpen] = useState(false);

  const handleClockIn = () => {
    setClockState((s) => ({ ...s, clockedIn: true, startedAt: new Date().toISOString() }));
    toast.success('Clocked in', { description: `Started at ${format(new Date(), 'h:mm a')}` });
  };
  const handleClockOut = () => {
    const started = clockState.startedAt ? new Date(clockState.startedAt) : new Date();
    const minutes = Math.max(0, Math.round((Date.now() - started.getTime()) / 60000));
    setClockState((s) => ({
      ...s,
      clockedIn: false,
      onBreak: false,
      startedAt: null,
      breakStartedAt: null,
      todayMinutes: s.todayMinutes + minutes,
    }));
    toast.success('Clocked out', {
      description: `${Math.floor(minutes / 60)}h ${minutes % 60}m logged today`,
    });
  };
  const handleBreakToggle = () => {
    if (!clockState.onBreak) {
      setClockState((s) => ({ ...s, onBreak: true, breakStartedAt: new Date().toISOString() }));
      toast.info('Break started');
    } else {
      const bStart = clockState.breakStartedAt ? new Date(clockState.breakStartedAt) : new Date();
      const mins = Math.max(0, Math.round((Date.now() - bStart.getTime()) / 60000));
      setClockState((s) => ({
        ...s,
        onBreak: false,
        breakStartedAt: null,
        breakMinutes: s.breakMinutes + mins,
      }));
      toast.success('Break ended', { description: `${mins}m break logged` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Clock in / out + add entry */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center',
                  clockState.clockedIn
                    ? 'bg-status-approved/15 text-status-approved'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {clockState.clockedIn
                    ? clockState.onBreak
                      ? 'On break'
                      : 'Clocked in'
                    : 'Not clocked in'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {clockState.startedAt
                    ? `Since ${format(parseISO(clockState.startedAt), 'h:mm a')}`
                    : 'Tap clock-in to start your shift'}
                  {' · '}Today: {Math.floor(clockState.todayMinutes / 60)}h {clockState.todayMinutes % 60}m
                  {clockState.breakMinutes > 0 && ` · Break: ${clockState.breakMinutes}m`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {clockState.clockedIn ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleBreakToggle} className="gap-1.5">
                    <Coffee className="h-3.5 w-3.5" />
                    {clockState.onBreak ? 'End Break' : 'Start Break'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleClockOut} className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    Clock Out
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleClockIn} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Clock In
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Add Timesheet Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="mt-4">
          {currentWeek ? (
            <CurrentWeekView timesheet={currentWeek} />
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No timesheet for current week</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clock in or add an entry to start your timesheet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryView timesheets={history} />
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <SummaryView timesheets={history} stats={stats} />
        </TabsContent>
      </Tabs>

      <AddTimesheetEntryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

type BreakType = 'lunch' | 'short' | 'other';

interface BreakDraft {
  id: string;
  type: BreakType;
  startTime: string;
  endTime: string;
}

interface EntryDraft {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breaks: BreakDraft[];
  notes: string;
}

const newBreak = (): BreakDraft => ({
  id: `brk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'lunch',
  startTime: '12:00',
  endTime: '12:30',
});

const newEntry = (date?: string): EntryDraft => ({
  id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  date: date ?? format(new Date(), 'yyyy-MM-dd'),
  clockIn: '09:00',
  clockOut: '17:00',
  breaks: [newBreak()],
  notes: '',
});

function AddTimesheetEntryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [entries, setEntries] = useState<EntryDraft[]>([newEntry()]);

  const updateEntry = <K extends keyof EntryDraft>(id: string, field: K, value: EntryDraft[K]) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const updateBreak = <K extends keyof BreakDraft>(entryId: string, breakId: string, field: K, value: BreakDraft[K]) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, breaks: e.breaks.map((b) => (b.id === breakId ? { ...b, [field]: value } : b)) }
          : e,
      ),
    );
  };

  const addBreak = (entryId: string) => {
    setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, breaks: [...e.breaks, newBreak()] } : e)));
  };

  const removeBreak = (entryId: string, breakId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, breaks: e.breaks.filter((b) => b.id !== breakId) } : e)),
    );
  };

  const addDay = () => {
    const last = entries[entries.length - 1];
    const baseDate = last ? parseISO(last.date) : new Date();
    const next = new Date(baseDate);
    next.setDate(next.getDate() + 1);
    setEntries((prev) => [...prev, newEntry(format(next, 'yyyy-MM-dd'))]);
  };

  const removeDay = (id: string) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const reset = () => setEntries([newEntry()]);

  const handleSave = () => {
    for (const e of entries) {
      if (!e.date || !e.clockIn || !e.clockOut) {
        toast.error('Each entry needs a date, clock in and clock out');
        return;
      }
      for (const b of e.breaks) {
        if (!b.startTime || !b.endTime) {
          toast.error(`Break on ${format(parseISO(e.date), 'MMM d')} is missing start or end time`);
          return;
        }
      }
    }
    toast.success(`${entries.length} timesheet ${entries.length === 1 ? 'entry' : 'entries'} added`, {
      description: entries.map((e) => `${format(parseISO(e.date), 'MMM d')} · ${e.clockIn}–${e.clockOut}`).join(' · '),
    });
    onOpenChange(false);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Add timesheet entries
          </SheetTitle>
          <SheetDescription>
            Log hours for one or more days. Record break type and times for each entry. Submissions go to your manager for approval.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-6">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Day {idx + 1}
                  </span>
                  {entries.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDay(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, 'date', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Clock in</label>
                    <Input type="time" value={entry.clockIn} onChange={(e) => updateEntry(entry.id, 'clockIn', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Clock out</label>
                    <Input type="time" value={entry.clockOut} onChange={(e) => updateEntry(entry.id, 'clockOut', e.target.value)} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Coffee className="h-3 w-3" /> Breaks
                    </label>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addBreak(entry.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Add break
                    </Button>
                  </div>
                  {entry.breaks.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No breaks recorded.</p>
                  )}
                  {entry.breaks.map((b, bIdx) => (
                    <div key={b.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                      <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground">Type</label>
                        <Select value={b.type} onValueChange={(v) => updateBreak(entry.id, b.id, 'type', v as BreakType)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lunch">Lunch (unpaid)</SelectItem>
                            <SelectItem value="short">Short / rest (paid)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground">Start</label>
                        <Input type="time" className="h-8 text-xs" value={b.startTime} onChange={(e) => updateBreak(entry.id, b.id, 'startTime', e.target.value)} />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[10px] text-muted-foreground">End</label>
                        <Input type="time" className="h-8 text-xs" value={b.endTime} onChange={(e) => updateBreak(entry.id, b.id, 'endTime', e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeBreak(entry.id, b.id)} aria-label={`Remove break ${bIdx + 1}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                  <Input
                    placeholder="Add context for your manager"
                    value={entry.notes}
                    onChange={(e) => updateEntry(entry.id, 'notes', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addDay}>
              <Plus className="h-4 w-4 mr-1.5" /> Add another day
            </Button>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t flex gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1">
            Save {entries.length > 1 ? `${entries.length} entries` : 'entry'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}



function CurrentWeekView({ timesheet }: { timesheet: Timesheet }) {
  const validation = validateCompliance(timesheet);
  const [localStatus, setLocalStatus] = useState(timesheet.status);
  const [submittedAt, setSubmittedAt] = useState<string | null>(
    timesheet.status !== 'pending' ? timesheet.submittedAt : null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasOpenEntry = timesheet.entries.some(e => !e.clockOut);
  const canSubmit = localStatus === 'pending' && !submittedAt;

  const handleSubmit = () => {
    setSubmittedAt(new Date().toISOString());
    setConfirmOpen(false);
    toast.success('Timesheet submitted for approval', {
      description: validation.isCompliant
        ? 'Your manager has been notified.'
        : `${validation.flags.length} compliance issue${validation.flags.length === 1 ? '' : 's'} flagged for review.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Week Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(parseISO(timesheet.weekStartDate), 'MMMM d')} - {format(parseISO(timesheet.weekEndDate), 'd, yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={localStatus} />
              {canSubmit ? (
                <Button
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={hasOpenEntry}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Timesheet
                </Button>
              ) : submittedAt ? (
                <Badge variant="outline" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-status-approved" />
                  Submitted {format(parseISO(submittedAt), 'MMM d, h:mm a')}
                </Badge>
              ) : null}
            </div>
          </div>
          {hasOpenEntry && canSubmit && (
            <p className="text-xs text-status-pending mt-2 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Clock out of all entries before submitting.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold text-foreground">{timesheet.totalHours}</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold text-foreground">{timesheet.regularHours}</p>
              <p className="text-xs text-muted-foreground">Regular</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-status-pending/10">
              <p className="text-3xl font-bold text-status-pending">{timesheet.overtimeHours}</p>
              <p className="text-xs text-muted-foreground">Overtime</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold text-foreground">{Math.round(timesheet.totalBreakMinutes / 60 * 10) / 10}</p>
              <p className="text-xs text-muted-foreground">Break Hours</p>
            </div>
          </div>

          {/* Compliance Status */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            validation.isCompliant
              ? "bg-status-approved/10 border border-status-approved/20"
              : "bg-status-rejected/10 border border-status-rejected/20"
          )}>
            {validation.isCompliant ? (
              <>
                <ShieldCheck className="h-5 w-5 text-status-approved" />
                <div>
                  <p className="font-medium text-status-approved">Compliant</p>
                  <p className="text-xs text-muted-foreground">No issues detected</p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-status-rejected" />
                <div>
                  <p className="font-medium text-status-rejected">{validation.flags.length} Issues Found</p>
                  <p className="text-xs text-muted-foreground">
                    {validation.flags.map(f => f.title).join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit timesheet for approval?</DialogTitle>
            <DialogDescription>
              You're submitting <strong>{timesheet.totalHours}h</strong> for the week of{' '}
              {format(parseISO(timesheet.weekStartDate), 'MMM d')}.
              {!validation.isCompliant && (
                <span className="block mt-2 text-status-rejected">
                  {validation.flags.length} compliance issue{validation.flags.length === 1 ? '' : 's'} will be flagged for your approver.
                </span>
              )}
              {' '}Once submitted, you'll need to raise an exception to make changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daily Entries */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Daily Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timesheet.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-muted-foreground">{format(parseISO(entry.date), 'EEE')}</p>
                    <p className="font-bold">{format(parseISO(entry.date), 'd')}</p>
                  </div>
                  <div>
                    <p className="font-medium">{entry.clockIn} - {entry.clockOut || 'In Progress'}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalBreakMinutes}m break • {entry.netHours}h net
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{entry.grossHours}h</p>
                  {entry.overtime > 0 && (
                    <Badge variant="outline" className="text-status-pending text-xs">
                      +{entry.overtime}h OT
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryView({ timesheets }: { timesheets: Timesheet[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Past Timesheets</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {timesheets.length > 0 ? timesheets.map((ts) => (
              <div key={ts.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-background">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {format(parseISO(ts.weekStartDate), 'MMM d')} - {format(parseISO(ts.weekEndDate), 'd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ts.totalHours}h total • {ts.overtimeHours}h overtime
                    </p>
                  </div>
                </div>
                <StatusBadge status={ts.status} />
              </div>
            )) : (
              <div className="py-12 text-center text-muted-foreground">
                No past timesheets found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SummaryView({ timesheets, stats }: { timesheets: Timesheet[]; stats: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Hours/Week</span>
              <span className="font-medium">{stats.avgHoursPerWeek}h</span>
            </div>
            <Progress value={(stats.avgHoursPerWeek / 40) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Approval Rate</span>
              <span className="font-medium">
                {timesheets.length > 0 
                  ? Math.round((stats.approvedCount / timesheets.length) * 100) 
                  : 100}%
              </span>
            </div>
            <Progress 
              value={timesheets.length > 0 ? (stats.approvedCount / timesheets.length) * 100 : 100} 
              className="h-2" 
            />
          </div>
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{timesheets.length}</p>
                <p className="text-xs text-muted-foreground">Total Timesheets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-status-approved">{stats.approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Regular Hours</span>
              </div>
              <span className="font-medium">{stats.totalHours - stats.totalOvertime}h</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-status-pending/10">
              <div className="flex items-center gap-3">
                <Hourglass className="h-4 w-4 text-status-pending" />
                <span className="text-sm">Overtime Hours</span>
              </div>
              <span className="font-medium text-status-pending">{stats.totalOvertime}h</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Break Hours</span>
              </div>
              <span className="font-medium">{stats.totalBreaks}h</span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estimated Total Pay</span>
                <span className="text-2xl font-bold text-primary">${stats.estimatedPay}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeePortal;
