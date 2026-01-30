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
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Coffee,
  DollarSign,
  FileText,
  ChevronRight,
  User,
  Building2,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Target,
  MessageSquare,
  Users,
  Sparkles,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('current');

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-primary/70">
                <AvatarFallback className="text-primary-foreground font-medium">
                  {getInitials(currentEmployee.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{currentEmployee.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentEmployee.position} • {currentEmployee.department}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/timesheet-admin'}>
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="current" className="gap-2">
              <Clock className="h-4 w-4" /> Timesheets
            </TabsTrigger>
            <TabsTrigger value="recognition" className="gap-2">
              <Sparkles className="h-4 w-4" /> Recognition
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Target className="h-4 w-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="okrs" className="gap-2">
              <Target className="h-4 w-4" /> My OKRs
            </TabsTrigger>
            <TabsTrigger value="career" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Career Path
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Surveys
            </TabsTrigger>
            <TabsTrigger value="360" className="gap-2">
              <Users className="h-4 w-4" /> 360° Feedback
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Learning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {currentWeekTimesheet ? (
              <CurrentWeekView timesheet={currentWeekTimesheet} />
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-medium">No timesheet for current week</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start clocking in to create your timesheet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recognition">
            <EmployeeRecognitionPanel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="performance">
            <EmployeePerformancePanel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="okrs">
            <EmployeeOKRPanel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="career">
            <EmployeeCareerPathingPanel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="surveys">
            <EmployeeSurveyPanel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="360">
            <Employee360Panel currentUserId={currentEmployee.id} />
          </TabsContent>

          <TabsContent value="learning">
            <EmployeeLMSPanel currentUserId={currentEmployee.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CurrentWeekView({ timesheet }: { timesheet: Timesheet }) {
  const validation = validateCompliance(timesheet);

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
            <StatusBadge status={timesheet.status} />
          </div>
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
