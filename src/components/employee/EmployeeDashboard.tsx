import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock, Calendar, MapPin, Users, ArrowRight, CalendarPlus,
  FileText, CheckCircle2, AlertCircle, TreePalm, Briefcase,
  ClipboardCheck, TrendingUp, Bell, Sun, Sunrise, Moon,
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface EmployeeDashboardProps {
  employee: { id: string; name: string; department: string; position: string; hourlyRate: number };
  onNavigate: (tab: string) => void;
  onboardingProgress: number;
  onboardingComplete: boolean;
}

// Mock data for dashboard widgets
const mockUpcomingShifts = [
  { id: '1', date: new Date(), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' as const },
  { id: '2', date: addDays(new Date(), 1), startTime: '06:00', endTime: '14:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' as const },
  { id: '3', date: addDays(new Date(), 2), startTime: '14:00', endTime: '22:00', location: 'Events Hall', role: 'Sous Chef', status: 'pending' as const },
  { id: '4', date: addDays(new Date(), 4), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' as const },
];

const mockOpenShifts = [
  { id: 'o1', date: addDays(new Date(), 1), startTime: '16:00', endTime: '22:00', location: 'Poolside Bar', role: 'Bartender', premium: true, rate: '+$5/hr' },
  { id: 'o2', date: addDays(new Date(), 3), startTime: '06:00', endTime: '14:00', location: 'Main Kitchen', role: 'Prep Cook', premium: false, rate: '' },
  { id: 'o3', date: addDays(new Date(), 5), startTime: '10:00', endTime: '18:00', location: 'Events Hall', role: 'Server', premium: true, rate: '+$3/hr' },
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

export function EmployeeDashboard({ employee, onNavigate, onboardingProgress, onboardingComplete }: EmployeeDashboardProps) {
  const nextShift = mockUpcomingShifts[0];
  const hoursProgress = (mockTimesheetSummary.currentWeekHours / mockTimesheetSummary.targetHours) * 100;

  return (
    <div className="space-y-6">
      {/* Quick Glance Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          icon={Clock}
          label="Hours This Week"
          value={`${mockTimesheetSummary.currentWeekHours}h`}
          sub={`of ${mockTimesheetSummary.targetHours}h target`}
          accent="text-blue-600"
          bgAccent="from-blue-500/10 to-blue-600/5 border-blue-200/60"
        />
        <QuickStat
          icon={Calendar}
          label="Next Shift"
          value={isToday(nextShift.date) ? 'Today' : isTomorrow(nextShift.date) ? 'Tomorrow' : format(nextShift.date, 'EEE')}
          sub={`${nextShift.startTime} – ${nextShift.endTime}`}
          accent="text-emerald-600"
          bgAccent="from-emerald-500/10 to-emerald-600/5 border-emerald-200/60"
        />
        <QuickStat
          icon={CalendarPlus}
          label="Open Shifts"
          value={`${mockOpenShifts.length}`}
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
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => onNavigate('current')}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {mockUpcomingShifts.map((shift) => {
                  const Icon = getShiftIcon(shift.startTime);
                  const today = isToday(shift.date);
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'flex items-center gap-4 p-3.5 rounded-lg border transition-colors',
                        today
                          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                          : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        today ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{getDateLabel(shift.date)}</span>
                          {today && <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5 py-0">NOW</Badge>}
                          {shift.status === 'pending' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {shift.startTime} – {shift.endTime} • {shift.role}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {shift.location}
                        </div>
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
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">{mockOpenShifts.length} available</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {mockOpenShifts.map((shift) => (
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
                      <Button size="sm" variant="outline" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Pick Up
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                    <span className="font-semibold">{mockTimesheetSummary.currentWeekHours}h / {mockTimesheetSummary.targetHours}h</span>
                  </div>
                  <Progress value={hoursProgress} className="h-2.5" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold">{mockTimesheetSummary.currentWeekHours}h</p>
                    <p className="text-[10px] text-muted-foreground">Logged</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-amber-600">{mockTimesheetSummary.overtimeThisWeek}h</p>
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
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Request
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
              {mockPendingLeave.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pending Requests</p>
                  {mockPendingLeave.map((req) => (
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
