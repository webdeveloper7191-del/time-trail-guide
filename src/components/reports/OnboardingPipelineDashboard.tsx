import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockOnboardingData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, Line } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Users, Clock, CheckCircle2, AlertTriangle, Target, TrendingUp, UserPlus, Timer } from 'lucide-react';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800', in_progress: 'bg-blue-100 text-blue-800',
  not_started: 'bg-muted text-muted-foreground', overdue: 'bg-destructive/10 text-destructive',
};
const statusLabels: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started', overdue: 'Overdue' };
const COLORS = ['#10B981', 'hsl(var(--primary))', '#94A3B8', 'hsl(var(--destructive))'];

export function OnboardingPipelineDashboard() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockOnboardingData.filter(r => {
    if (location !== 'all' && r.location !== location) return false;
    if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.position.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, location]);

  const statusSummary = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, not_started: 0, overdue: 0 };
    filtered.forEach(r => counts[r.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name: statusLabels[name], value }));
  }, [filtered]);

  const avgCompletion = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, r) => s + r.completionPct, 0) / filtered.length) : 0, [filtered]);
  const avgDays = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, r) => s + r.daysInPipeline, 0) / filtered.length) : 0, [filtered]);
  const completedCount = filtered.filter(r => r.status === 'completed').length;
  const overdueCount = filtered.filter(r => r.status === 'overdue').length;
  const inProgressCount = filtered.filter(r => r.status === 'in_progress').length;
  const completionRate = filtered.length > 0 ? Math.round((completedCount / filtered.length) * 100) : 0;
  const totalSteps = filtered.reduce((s, r) => s + r.totalSteps, 0);
  const completedSteps = filtered.reduce((s, r) => s + r.stepsCompleted, 0);

  const locations = [...new Set(mockOnboardingData.map(r => r.location))];

  const locationBreakdown = locations.map(loc => {
    const items = filtered.filter(r => r.location === loc);
    return {
      name: loc.split(' ')[0],
      completed: items.filter(r => r.status === 'completed').length,
      inProgress: items.filter(r => r.status === 'in_progress').length,
      overdue: items.filter(r => r.status === 'overdue').length,
    };
  });

  const exportColumns: ExportColumn[] = [
    { header: 'Staff Name', accessor: 'staffName' }, { header: 'Position', accessor: 'position' },
    { header: 'Location', accessor: 'location' }, { header: 'Status', accessor: (r) => statusLabels[r.status] },
    { header: 'Completion %', accessor: 'completionPct' }, { header: 'Days in Pipeline', accessor: 'daysInPipeline' },
    { header: 'Assigned To', accessor: 'assignedTo' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Onboarding Pipeline" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Onboarding Pipeline Dashboard"
        reportDescription="Tracks new staff onboarding progress from invitation to completion, monitoring step completion, time-in-pipeline, and overdue items."
        purpose="Ensures new hires are onboarded efficiently, identifies bottlenecks in the onboarding process, and prevents compliance gaps from incomplete documentation."
        whenToUse={[
          'During weekly HR reviews to monitor new hire progress', 'When following up on stalled onboarding processes',
          'Before new staff are rostered to verify compliance documentation', 'For management reporting on hiring pipeline velocity',
        ]}
        keyMetrics={[
          { label: 'Completion Rate', description: 'Percentage of new hires who have completed all onboarding steps', interpretation: 'Below 80% suggests process friction. Target 100% within SLA period', goodRange: '≥90%', warningRange: '70-89%', criticalRange: '<70%' },
          { label: 'Avg Days in Pipeline', description: 'Average time from onboarding start to completion', interpretation: 'Best practice is <14 days. Above 21 days indicates process issues', goodRange: '<14 days', warningRange: '14-21 days', criticalRange: '>21 days' },
          { label: 'Overdue Count', description: 'New hires who have exceeded the expected completion timeline', interpretation: 'Each overdue onboarding delays their rostering and increases compliance risk' },
          { label: 'Avg Completion', description: 'Average percentage of steps completed across all active onboardings', interpretation: 'Low average with many in-progress items suggests common blocking steps' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Eight headline metrics with variant coloring. Red overdue count = immediate HR follow-up needed.' },
          { title: 'Pipeline Pie', content: 'Visual breakdown of onboarding statuses. Healthy pipeline: minimal overdue, growing completed segment.' },
          { title: 'Completion Chart', content: 'Per-staff bar chart shows individual progress. Identify who needs follow-up at a glance.' },
          { title: 'Location Breakdown', content: 'Stacked bars show onboarding health per location. Sites with high overdue counts need process review.' },
        ]}
        actionableInsights={[
          'Overdue onboardings should receive immediate follow-up calls or emails',
          'Common blocked steps indicate form or documentation issues to streamline',
          'Locations with slower completion may need additional HR support or training',
          'Staff cannot be rostered for compliance-sensitive roles until onboarding is 100% complete',
        ]}
        relatedReports={['Headcount & FTE', 'Qualification Expiry', 'Turnover & Retention', 'Contract Distribution']}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Pipeline" value={filtered.length} icon={UserPlus} size="sm" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="In Progress" value={inProgressCount} icon={TrendingUp} size="sm" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} size="sm" variant={overdueCount > 2 ? 'danger' : overdueCount > 0 ? 'warning' : 'success'} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={Target} size="sm" variant={completionRate >= 90 ? 'success' : completionRate >= 70 ? 'warning' : 'danger'} />
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} icon={Users} size="sm" sparklineData={filtered.map(r => r.completionPct)} />
        <StatCard label="Avg Days" value={avgDays} icon={Timer} size="sm" variant={avgDays > 21 ? 'danger' : avgDays > 14 ? 'warning' : 'success'} />
        <StatCard label="Steps Done" value={`${completedSteps}/${totalSteps}`} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {overdueCount > 0 && <InsightCard type="negative" title={`${overdueCount} Overdue Onboarding${overdueCount > 1 ? 's' : ''}`} description={`Staff with overdue onboarding cannot be rostered for compliance-sensitive roles. Average ${avgDays} days in pipeline.`} action="Send follow-up reminders immediately" />}
        {completionRate >= 90 && <InsightCard type="positive" title="Strong Pipeline Flow" description={`${completionRate}% completion rate. Onboarding process is running efficiently.`} />}
        {avgDays > 14 && <InsightCard type="action" title="Slow Pipeline Velocity" description={`Average ${avgDays} days in pipeline exceeds the 14-day target. Identify and resolve common blockers.`} action="Review blocked steps and streamline forms" />}
        {overdueCount === 0 && <InsightCard type="positive" title="No Overdue Items" description="All onboardings are within their expected timeline. Excellent HR process management." />}
      </div>

      <SummaryRow items={[
        { label: 'Pipeline', value: filtered.length }, { label: 'Completed', value: completedCount, highlight: true },
        { label: 'Overdue', value: overdueCount }, { label: 'Avg Days', value: avgDays },
        { label: 'Steps Done', value: `${completedSteps}/${totalSteps}` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pipeline Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusSummary} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Individual Completion</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="staffName" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="completionPct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="overdue" name="Overdue" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Onboarding Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Position</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Progress</TableHead>
              <TableHead className="text-xs text-right">Days</TableHead>
              <TableHead className="text-xs">Assigned To</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.position}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColors[r.status]}`}>{statusLabels[r.status]}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={r.completionPct} className="h-2 w-20" /><span className="text-xs text-muted-foreground">{r.stepsCompleted}/{r.totalSteps}</span></div></TableCell>
                  <TableCell className="text-sm text-right">{r.daysInPipeline}</TableCell>
                  <TableCell className="text-sm">{r.assignedTo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
