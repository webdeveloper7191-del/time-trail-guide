import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockWeeklyTimesheets, approvalStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Clock, Users, AlertTriangle, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type WeeklyTimesheetRecord = typeof mockWeeklyTimesheets[0];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700', escalated: 'bg-orange-100 text-orange-700', auto_approved: 'bg-sky-100 text-sky-700',
};

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Department', accessor: 'department' }, { header: 'Regular Hours', accessor: 'regularHours' },
  { header: 'Overtime', accessor: 'overtimeHours' }, { header: 'Total', accessor: 'totalHours' },
  { header: 'Days Worked', accessor: 'daysWorked' }, { header: 'Status', accessor: (r: any) => approvalStatusLabels[r.status] },
];

const locations = [...new Set(mockWeeklyTimesheets.map(r => r.location))];

const tableColumns: DataTableColumn<WeeklyTimesheetRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'number', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.status === 'approved' || r.status === 'auto_approved' ? 'bg-emerald-500' : r.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500')} />

      <span className="font-medium">{r.staffName}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'department', header: 'Dept', accessor: (r) => <Badge variant="outline" className="text-[10px]">{r.department}</Badge>, sortValue: (r) => r.department },
  { key: 'regularHours', header: 'Regular', type: 'number', accessor: (r) => `${r.regularHours}h`, sortValue: (r) => r.regularHours, align: 'right' },
  { key: 'overtimeHours', header: 'OT', type: 'number', align: 'right', sortValue: (r) => r.overtimeHours,
    accessor: (r) => r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : <span className="text-muted-foreground">—</span> },
  { key: 'totalHours', header: 'Total', type: 'number', accessor: (r) => <span className="font-semibold">{r.totalHours}h</span>, sortValue: (r) => r.totalHours, align: 'right' },
  { key: 'breakMinutes', header: 'Break', type: 'number', accessor: (r) => `${r.breakMinutes}m`, sortValue: (r) => r.breakMinutes, align: 'right' },
  { key: 'daysWorked', header: 'Days', type: 'date', accessor: (r) => (
    <span className={cn(r.daysWorked >= 6 ? 'text-destructive font-medium' : '')}>{r.daysWorked}</span>
  ), sortValue: (r) => r.daysWorked, align: 'right' },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge className={cn('text-xs capitalize', statusColors[r.status])}>{approvalStatusLabels[r.status]}</Badge> },
];

export function WeeklyTimesheetReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockWeeklyTimesheets.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), dateRange), [search, locationFilter, dateRange]);

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


  const totalHours = filtered.reduce((s, r) => s + r.totalHours, 0);
  const totalRegular = filtered.reduce((s, r) => s + r.regularHours, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  const avgHours = (totalHours / (filtered.length || 1)).toFixed(1);
  const otPercent = totalHours > 0 ? Math.round((totalOT / totalHours) * 100) : 0;
  const estCost = Math.round(totalRegular * 35 + totalOT * 52.5);
  const approvedCount = filtered.filter(r => r.status === 'approved' || r.status === 'auto_approved').length;
  const pendingCount = filtered.filter(r => r.status === 'pending').length;

  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ name: approvalStatusLabels[status as keyof typeof approvalStatusLabels] || status, value: count }));
  }, [filtered]);
  const STATUS_COLORS = ['#10B981', '#22C55E', '#F59E0B', '#F97316', 'hsl(var(--destructive))'];

  const chartData = filtered.map(r => ({ name: r.staffName.split(' ')[0], regular: r.regularHours, overtime: r.overtimeHours }));

  const insights = useMemo(() => {
    const result = [];
    if (otPercent > 10) result.push({ type: 'negative' as const, title: `Overtime at ${otPercent}% of total hours`, description: `${totalOT}h overtime represents ${otPercent}% of total ${totalHours}h worked. At 1.5x penalty rate, this costs an additional $${Math.round(totalOT * 17.5).toLocaleString()} above standard rates.`, metric: `$${Math.round(totalOT * 52.5).toLocaleString()} OT cost`, action: 'Review staffing levels to reduce overtime dependency' });
    if (pendingCount > 0) result.push({ type: 'action' as const, title: `${pendingCount} timesheets pending approval`, description: `${Math.round(pendingCount / filtered.length * 100)}% of timesheets are still awaiting approval. Delayed approvals impact payroll processing and staff satisfaction.`, action: 'Chase pending approvals before payroll cut-off' });
    const highHours = filtered.filter(r => r.totalHours > 45);
    if (highHours.length > 0) result.push({ type: 'neutral' as const, title: `${highHours.length} staff exceeding 45h/week`, description: `These staff members are working above standard full-time hours. Sustained high hours increase fatigue risk and may trigger Award overtime provisions.`, metric: `Max: ${Math.max(...filtered.map(r => r.totalHours))}h` });
    if (approvedCount > 0) result.push({ type: 'positive' as const, title: `${approvedCount} timesheets approved (${Math.round(approvedCount / filtered.length * 100)}%)`, description: `Good progress on timesheet processing. ${approvedCount} of ${filtered.length} timesheets have been reviewed and approved.` });
    return result;
  }, [filtered, otPercent, totalOT, totalHours, pendingCount, approvedCount]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Weekly Timesheet Summary"
        reportDescription="Consolidated view of all staff hours for the reporting period, broken down by regular and overtime hours with approval status tracking."
        purpose="To provide payroll teams with a verified summary of all hours worked, identify overtime patterns, and track timesheet approval progress before payroll processing."
        whenToUse={['Before each payroll run to verify hours', 'Weekly to monitor overtime trends', 'When reviewing staff workload distribution', 'During payroll audits']}
        keyMetrics={[
          { label: 'Total Hours', description: 'Sum of all regular + overtime hours across all staff.', interpretation: 'Compare week-over-week to spot unusual spikes or drops.' },
          { label: 'OT as % of Total', description: 'Overtime hours as a percentage of total hours worked.', interpretation: 'Above 10% warrants investigation. Above 15% suggests understaffing.', goodRange: '<5%', warningRange: '5-10%', criticalRange: '>10%' },
          { label: 'Approval Rate', description: 'Percentage of timesheets that have been approved.', interpretation: 'Should be 100% before payroll cut-off. Below 90% will delay processing.', goodRange: '100%', warningRange: '90-99%', criticalRange: '<90%' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Quick overview of total hours, overtime impact, and processing status. The estimated cost provides early visibility into payroll liability.' },
          { title: 'Hours by Staff Chart', content: 'Stacked bars show each staff member\'s regular (blue) and overtime (red) hours. Look for staff with disproportionate overtime — they may need workload rebalancing.' },
          { title: 'Status Distribution', content: 'Pie chart shows how many timesheets are at each stage. All should be "Approved" by payroll cut-off.' },
        ]}
        actionableInsights={['Chase pending approvals before payroll deadline', 'Investigate staff consistently exceeding 40h/week', 'Compare overtime spend against agency alternatives', 'Flag rejected timesheets for immediate correction']}
        relatedReports={['Overtime by Location', 'Approval SLA', 'Break Compliance', 'Timesheet Exception']}
      />

      <ReportFilterBar title="Weekly Timesheet Summary" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Hours" value={`${totalHours}h`} icon={Clock} sparklineData={[380, 395, 410, 388, totalHours]} />
        <StatCard label="Regular Hours" value={`${totalRegular}h`} icon={Users} />
        <StatCard label="Overtime" value={`${totalOT}h`} icon={AlertTriangle} variant={otPercent > 10 ? 'danger' : 'default'} subtitle={`${otPercent}% of total`} />
        <StatCard label="Avg Hours/Staff" value={`${avgHours}h`} icon={TrendingUp} />
        <StatCard label="Est. Cost" value={`$${(estCost / 1000).toFixed(1)}k`} icon={DollarSign} />
        <StatCard label="Approved" value={`${approvedCount}/${filtered.length}`} icon={CheckCircle2} variant={pendingCount > 0 ? 'warning' : 'success'} />
      </div>

      <SummaryRow items={[
        { label: 'Staff Count', value: filtered.length }, { label: 'Pending', value: pendingCount, highlight: pendingCount > 0 },
        { label: 'Rejected', value: filtered.filter(r => r.status === 'rejected').length },
        { label: 'OT Cost Premium', value: `$${Math.round(totalOT * 17.5).toLocaleString()}` },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hours by Staff</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="regular" name="Regular" fill="hsl(var(--primary))" stackId="a" />
                <Bar dataKey="overtime" name="Overtime" fill="hsl(var(--destructive))" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Status</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusDist} cursor="pointer" onClick={(_, index) => { const d = statusDist[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusDist.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Timesheet Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
