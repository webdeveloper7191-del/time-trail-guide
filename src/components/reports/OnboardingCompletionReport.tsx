import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockOnboardingData, OnboardingRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { UserCheck, Clock, AlertTriangle, CheckCircle2, Users, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const statusLabels: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started', overdue: 'Overdue' };
const statusVariant: Record<string, string> = { completed: 'bg-emerald-100 text-emerald-800', in_progress: 'bg-blue-100 text-blue-800', not_started: 'bg-muted text-muted-foreground', overdue: 'bg-destructive/10 text-destructive' };
const PIE_COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))'];

const locations = [...new Set(mockOnboardingData.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Position', accessor: 'position' },
  { header: 'Location', accessor: 'location' }, { header: 'Status', accessor: (r: any) => statusLabels[r.status] },
  { header: 'Completion %', accessor: 'completionPct' }, { header: 'Days', accessor: 'daysInPipeline' },
];

const tableColumns: DataTableColumn<OnboardingRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <div><span className="font-medium">{r.staffName}</span><span className="block text-[10px] text-muted-foreground">{r.position}</span></div>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'assignedTo', header: 'Assigned To', type: 'text', accessor: (r) => <span className="text-xs text-muted-foreground">{r.assignedTo}</span>, sortValue: (r) => r.assignedTo },
  { key: 'status', header: 'Status', type: 'enum', sortValue: (r) => r.status,
    accessor: (r) => <Badge className={`text-[10px] ${statusVariant[r.status]}`}>{statusLabels[r.status]}</Badge> },
  { key: 'stepsCompleted', header: 'Steps', type: 'text', accessor: (r) => <span className="text-xs">{r.stepsCompleted}/{r.totalSteps}</span>, sortValue: (r) => r.stepsCompleted, align: 'right' },
  { key: 'completionPct', header: 'Progress', type: 'number', className: 'w-[150px]', sortValue: (r) => r.completionPct,
    accessor: (r) => <div className="flex items-center gap-2"><Progress value={r.completionPct} className="h-2 flex-1" /><span className="text-xs w-8 text-right">{r.completionPct}%</span></div> },
  { key: 'daysInPipeline', header: 'Days', type: 'number', accessor: (r) => <span className={cn('text-xs font-medium', r.daysInPipeline > 21 ? 'text-destructive' : 'text-foreground')}>{r.daysInPipeline}d</span>, sortValue: (r) => r.daysInPipeline, align: 'right' },
  { key: 'startDate', header: 'Start Date', type: 'date', accessor: (r) => <span className="text-xs text-muted-foreground">{r.startDate}</span>, sortValue: (r) => r.startDate },
  { key: 'email', header: 'Email', type: 'text', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.email}</span>, sortValue: (r) => r.email ?? '' },
  { key: 'phone', header: 'Phone', type: 'text', accessor: (r) => <span className="font-mono text-[10px]">{r.phone}</span>, sortValue: (r) => r.phone ?? '' },
  { key: 'backgroundCheck', header: 'Background', type: 'enum', accessor: (r) => <Badge variant={r.backgroundCheck === 'failed' ? 'destructive' : r.backgroundCheck === 'pending' ? 'secondary' : 'outline'} className="text-[10px] capitalize">{r.backgroundCheck}</Badge>, sortValue: (r) => r.backgroundCheck ?? '' },
  { key: 'docsOutstanding', header: 'Docs Pending', type: 'number', accessor: (r) => (r.docsOutstanding ?? 0) > 0 ? <span className="text-amber-600 font-medium text-xs">{r.docsOutstanding}</span> : '0', sortValue: (r) => r.docsOutstanding ?? 0, align: 'right' },
  { key: 'daysUntilStart', header: 'Days to Start', type: 'number', accessor: (r) => <span className={cn('text-xs', (r.daysUntilStart ?? 0) < 0 ? 'text-destructive' : '')}>{r.daysUntilStart ?? 0}d</span>, sortValue: (r) => r.daysUntilStart ?? 0, align: 'right' },
];

export function OnboardingCompletionReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockOnboardingData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), dateRange);
  }, [search, location]);

  const { drill, drilled: filtered, applyDrill, clearDrill, animKey } = useDrillFilter(
    baseFiltered,
    (item: any, d: DrillFilter) => {
      if (d.type === 'location' && 'location' in item) return item.location === d.value;
      if (d.type === 'department' && 'department' in item) return item.department === d.value;
      if (d.type === 'category' && 'category' in item) return item.category === d.value;
      if (d.type === 'status' && 'status' in item) return item.status === d.value;
      if (d.type === 'type' && 'type' in item) return item.type === d.value;
      if (d.type === 'severity' && 'gapSeverity' in item) return item.gapSeverity === d.value;
      if (d.type === 'staffName' && 'staffName' in item) return item.staffName === d.value;
      if (d.type === 'agencyName' && 'agencyName' in item) return item.agencyName === d.value;
      if (d.type === 'adjustmentType' && 'adjustmentType' in item) return item.adjustmentType === d.value;
      if (d.type === 'areaName' && 'areaName' in item) return item.areaName === d.value;
      if (d.type === 'sourceLocation' && 'sourceLocation' in item) return item.sourceLocation === d.value;
      return String((item as any)[d.type]) === d.value;
    }
  );


  const completionRate = filtered.length ? Math.round((filtered.filter(r => r.status === 'completed').length / filtered.length) * 100) : 0;
  const avgDays = useMemo(() => {
    const completed = filtered.filter(r => r.status === 'completed');
    return completed.length ? Math.round(completed.reduce((s, r) => s + r.daysInPipeline, 0) / completed.length) : 0;
  }, [filtered]);
  const overdueCount = filtered.filter(r => r.status === 'overdue').length;
  const inProgressCount = filtered.filter(r => r.status === 'in_progress').length;
  const avgCompletion = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.completionPct, 0) / filtered.length) : 0;

  const statusPie = [
    { name: 'Completed', value: filtered.filter(r => r.status === 'completed').length },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Not Started', value: filtered.filter(r => r.status === 'not_started').length },
    { name: 'Overdue', value: overdueCount },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Onboarding Completion Rate" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Onboarding Completion Report"
        reportDescription="Tracks the progress and efficiency of new staff onboarding across all locations, measuring completion rates, time-to-complete, and identifying bottlenecks."
        purpose="Ensures all new hires complete required onboarding steps within SLA timelines, reducing compliance risk and accelerating time-to-productivity."
        whenToUse={[
          'Weekly HR review to track new starter progress', 'When onboarding SLA breaches are escalating',
          'During compliance audits requiring proof of completed inductions', 'When evaluating onboarding process efficiency',
        ]}
        keyMetrics={[
          { label: 'Completion Rate', description: 'Percentage of staff who finished all onboarding steps', interpretation: 'Below 80% indicates process friction or resource constraints', goodRange: '≥90%', warningRange: '70-89%', criticalRange: '<70%' },
          { label: 'Avg Days to Complete', description: 'Average calendar days from start to full completion', interpretation: 'Industry best practice is under 14 days. Over 21 days signals bottlenecks', goodRange: '≤14 days', warningRange: '15-21 days', criticalRange: '>21 days' },
          { label: 'Overdue Count', description: 'Staff who exceeded the expected onboarding timeline', interpretation: 'Any overdue items represent compliance risk and require immediate attention', goodRange: '0', warningRange: '1-2', criticalRange: '≥3' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows completion rate, average days, overdue count, and pipeline size. Red/amber variants flag concerning values.' },
          { title: 'Status Distribution', content: 'Pie chart shows the proportion of staff in each onboarding stage. A healthy pipeline has most staff completed or actively in progress with minimal overdue.' },
          { title: 'Completion Progress', content: 'Horizontal bar chart shows individual staff completion percentages. Longer bars = more complete. Red bars indicate overdue staff.' },
          { title: 'Detail Table', content: 'Full breakdown with progress bars, step counts, and days in pipeline. Sort by days to find longest-running onboardings.' },
        ]}
        actionableInsights={[
          'Contact overdue staff\'s assigned mentors immediately to unblock progress',
          'If average days exceeds 21, audit which specific steps are causing delays',
          'Staff at 0% who started >7 days ago may need personal outreach',
          'Compare completion rates by location to identify best-practice sites',
        ]}
        relatedReports={['Headcount & FTE', 'Qualification & Certification Expiry', 'Turnover & Retention']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={CheckCircle2} variant={completionRate >= 90 ? 'success' : completionRate >= 70 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Avg Days to Complete" value={`${avgDays}d`} icon={Timer} variant={avgDays <= 14 ? 'success' : avgDays <= 21 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} variant={overdueCount > 0 ? 'danger' : 'success'} size="sm" />
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} size="sm" />
        <StatCard label="Avg Progress" value={`${avgCompletion}%`} icon={Users} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {overdueCount > 0 && <InsightCard type="negative" title={`${overdueCount} Overdue Onboarding${overdueCount > 1 ? 's' : ''}`} description="Staff have exceeded the expected onboarding timeline, creating compliance risk." action="Review and escalate overdue cases immediately" />}
        {completionRate >= 90 && <InsightCard type="positive" title="High Completion Rate" description={`${completionRate}% of new starters have fully completed onboarding. Process is running efficiently.`} />}
        {avgDays > 14 && <InsightCard type="action" title="Slow Onboarding Pipeline" description={`Average ${avgDays} days to complete exceeds the 14-day benchmark. Audit step dependencies.`} action="Identify and remove bottleneck steps" />}
      </div>

      <SummaryRow items={[
        { label: 'Total Pipeline', value: filtered.length }, { label: 'Completed', value: filtered.filter(r => r.status === 'completed').length, highlight: true },
        { label: 'In Progress', value: inProgressCount }, { label: 'Overdue', value: overdueCount },
        { label: 'Avg Completion', value: `${avgCompletion}%` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Individual Progress</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.sort((a, b) => b.completionPct - a.completionPct)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="staffName" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="completionPct" name="Completion %" radius={[0, 4, 4, 0]}>
                  {filtered.map((r, i) => <Cell key={i} fill={r.status === 'overdue' ? 'hsl(var(--destructive))' : r.completionPct === 100 ? 'hsl(142, 76%, 36%)' : 'hsl(var(--primary))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Onboarding Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
