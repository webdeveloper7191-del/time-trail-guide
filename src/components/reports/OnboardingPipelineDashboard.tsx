import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { DateRange } from 'react-day-picker';
import { mockOnboardingData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Users, Clock, CheckCircle2, AlertTriangle, Target, TrendingUp, UserPlus, Timer } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

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
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => filterByDateRange(mockOnboardingData.filter(r => {
    if (location !== 'all' && r.location !== location) return false;
    if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.position.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), dateRange)), [search, location, dateRange]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'status') return baseFiltered.filter(r => statusLabels[r.status] === drill.value || r.status === drill.value);
    if (drill.type === 'location') return baseFiltered.filter(r => r.location.startsWith(drill.value) || r.location === drill.value);
    return baseFiltered;
  }, [baseFiltered, drill]);

  const statusSummary = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, not_started: 0, overdue: 0 };
    filtered.forEach(r => counts[r.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name: statusLabels[name], value, status: name }));
  }, [filtered]);

  const avgCompletion = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.completionPct, 0) / filtered.length) : 0;
  const avgDays = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.daysInPipeline, 0) / filtered.length) : 0;
  const completedCount = filtered.filter(r => r.status === 'completed').length;
  const overdueCount = filtered.filter(r => r.status === 'overdue').length;
  const inProgressCount = filtered.filter(r => r.status === 'in_progress').length;
  const completionRate = filtered.length > 0 ? Math.round((completedCount / filtered.length) * 100) : 0;
  const totalSteps = filtered.reduce((s, r) => s + r.totalSteps, 0);
  const completedSteps = filtered.reduce((s, r) => s + r.stepsCompleted, 0);

  const locations = [...new Set(mockOnboardingData.map(r => r.location))];

  const locationBreakdown = locations.map(loc => {
    const items = baseFiltered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], fullName: loc, completed: items.filter(r => r.status === 'completed').length, inProgress: items.filter(r => r.status === 'in_progress').length, overdue: items.filter(r => r.status === 'overdue').length };
  });

  const handlePieClick = (_: any, index: number) => {
    const item = statusSummary[index];
    if (item) setDrill({ type: 'status', value: item.status, label: item.name });
  };

  const handleLocationClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  const exportColumns: ExportColumn[] = [
    { header: 'Staff', accessor: 'staffName' }, { header: 'Position', accessor: 'position' },
    { header: 'Location', accessor: 'location' }, { header: 'Status', accessor: (r) => statusLabels[r.status] },
    { header: 'Completion %', accessor: 'completionPct' }, { header: 'Days', accessor: 'daysInPipeline' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Onboarding Pipeline" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Onboarding Pipeline Dashboard" reportDescription="Tracks onboarding progress with drill-through to status and location."
        purpose="Monitor new hire onboarding. Click charts to drill into specific statuses or locations."
        whenToUse={['Weekly HR reviews', 'Before rostering new staff', 'Management reporting']}
        keyMetrics={[
          { label: 'Completion Rate', description: '% completed all steps', interpretation: 'Target 100% within SLA', goodRange: '≥90%', warningRange: '70-89%', criticalRange: '<70%' },
          { label: 'Avg Days', description: 'Time in pipeline', interpretation: 'Best practice <14 days', goodRange: '<14', warningRange: '14-21', criticalRange: '>21' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click pie slices to filter by status. Click location bars to filter by site. Click table rows to filter by that status.' }]}
        actionableInsights={['Overdue onboardings need immediate follow-up', 'Staff cannot be rostered until 100% complete']}
        relatedReports={['Headcount & FTE', 'Qualification Expiry', 'Turnover & Retention']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Pipeline" value={filtered.length} icon={UserPlus} size="sm" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="In Progress" value={inProgressCount} icon={TrendingUp} size="sm" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} size="sm" variant={overdueCount > 2 ? 'danger' : overdueCount > 0 ? 'warning' : 'success'} />
        <StatCard label="Completion %" value={`${completionRate}%`} icon={Target} size="sm" variant={completionRate >= 90 ? 'success' : completionRate >= 70 ? 'warning' : 'danger'} />
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} icon={Users} size="sm" sparklineData={filtered.map(r => r.completionPct)} />
        <StatCard label="Avg Days" value={avgDays} icon={Timer} size="sm" variant={avgDays > 21 ? 'danger' : avgDays > 14 ? 'warning' : 'success'} />
        <StatCard label="Steps" value={`${completedSteps}/${totalSteps}`} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {overdueCount > 0 && <InsightCard type="negative" title={`${overdueCount} Overdue`} description="Cannot roster until complete." action="Send reminders" />}
        {completionRate >= 90 && <InsightCard type="positive" title="Strong Flow" description={`${completionRate}% rate.`} />}
        {avgDays > 14 && <InsightCard type="action" title="Slow Pipeline" description={`${avgDays} days avg.`} action="Review blockers" />}
      </div>

      <SummaryRow items={[
        { label: 'Pipeline', value: filtered.length }, { label: 'Completed', value: completedCount, highlight: true },
        { label: 'Overdue', value: overdueCount }, { label: 'Avg Days', value: avgDays }, { label: 'Steps', value: `${completedSteps}/${totalSteps}` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline Status <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusSummary} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Individual Completion</CardTitle></CardHeader>
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
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Location <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationBreakdown} onClick={handleLocationClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" style={{ cursor: 'pointer' }} />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="hsl(var(--primary))" style={{ cursor: 'pointer' }} />
                <Bar dataKey="overdue" name="Overdue" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Onboarding Details {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Position</TableHead>
              <TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Progress</TableHead><TableHead className="text-xs text-right">Days</TableHead>
              <TableHead className="text-xs">Assigned To</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDrill({ type: 'status', value: r.status, label: statusLabels[r.status] })}>
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
