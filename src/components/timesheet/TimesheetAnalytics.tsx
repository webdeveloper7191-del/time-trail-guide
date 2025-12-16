import { useMemo } from 'react';
import { Timesheet } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Users,
  Activity,
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface TimesheetAnalyticsProps {
  timesheets: Timesheet[];
}

export function TimesheetAnalytics({ timesheets }: TimesheetAnalyticsProps) {
  const analytics = useMemo(() => {
    // Status distribution
    const statusCounts = {
      pending: timesheets.filter(t => t.status === 'pending').length,
      approved: timesheets.filter(t => t.status === 'approved').length,
      rejected: timesheets.filter(t => t.status === 'rejected').length,
    };

    // Compliance analysis
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let totalFlags = 0;
    const flagsByType: Record<string, number> = {};

    timesheets.forEach(t => {
      const validation = validateCompliance(t);
      if (validation.isCompliant) {
        compliantCount++;
      } else {
        nonCompliantCount++;
      }
      totalFlags += validation.flags.length;
      validation.flags.forEach(f => {
        flagsByType[f.type] = (flagsByType[f.type] || 0) + 1;
      });
    });

    // Overtime analysis
    const overtimeData = timesheets.reduce((acc, t) => {
      const key = t.employee.department;
      if (!acc[key]) {
        acc[key] = { department: key, regular: 0, overtime: 0 };
      }
      acc[key].regular += t.regularHours;
      acc[key].overtime += t.overtimeHours;
      return acc;
    }, {} as Record<string, { department: string; regular: number; overtime: number }>);

    // Weekly hours trend
    const hoursByEmployee = timesheets.map(t => ({
      name: t.employee.name.split(' ')[0],
      hours: t.totalHours,
      overtime: t.overtimeHours,
      breaks: Math.round(t.totalBreakMinutes / 60 * 10) / 10,
    }));

    // Approval rate
    const totalProcessed = statusCounts.approved + statusCounts.rejected;
    const approvalRate = totalProcessed > 0 
      ? Math.round((statusCounts.approved / totalProcessed) * 100) 
      : 0;

    // Average hours
    const avgHours = timesheets.length > 0
      ? Math.round((timesheets.reduce((s, t) => s + t.totalHours, 0) / timesheets.length) * 10) / 10
      : 0;

    // Compliance score
    const complianceScore = timesheets.length > 0
      ? Math.round((compliantCount / timesheets.length) * 100)
      : 100;

    return {
      statusCounts,
      compliantCount,
      nonCompliantCount,
      totalFlags,
      flagsByType,
      overtimeData: Object.values(overtimeData),
      hoursByEmployee,
      approvalRate,
      avgHours,
      complianceScore,
    };
  }, [timesheets]);

  const statusPieData = [
    { name: 'Approved', value: analytics.statusCounts.approved, color: 'hsl(142, 71%, 45%)' },
    { name: 'Pending', value: analytics.statusCounts.pending, color: 'hsl(38, 92%, 50%)' },
    { name: 'Rejected', value: analytics.statusCounts.rejected, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  const compliancePieData = [
    { name: 'Compliant', value: analytics.compliantCount, color: 'hsl(142, 71%, 45%)' },
    { name: 'Issues', value: analytics.nonCompliantCount, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Approval Rate</p>
                <p className="text-3xl font-bold text-emerald-600">{analytics.approvalRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">+5% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg Hours/Week</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.avgHours}h</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{timesheets.length} timesheets</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Compliance Score</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.complianceScore}%</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.complianceScore >= 90 ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">Excellent</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Flags</p>
                <p className="text-3xl font-bold text-amber-600">{analytics.totalFlags}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{analytics.nonCompliantCount} affected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Employee */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Hours Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hoursByEmployee} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="hours" name="Regular" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overtime" name="Overtime" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overtime by Department */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-primary" />
              Overtime by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.overtimeData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="regular" name="Regular" stackId="a" fill="hsl(199, 89%, 48%)" />
                  <Bar dataKey="overtime" name="Overtime" stackId="a" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compliancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compliancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
