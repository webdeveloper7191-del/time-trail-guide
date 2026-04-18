import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLatePunctuality } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Clock, AlertTriangle, Users, TrendingDown, Timer, UserX } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type LatePunctualityRecord = typeof mockLatePunctuality[0];
const typeColors: Record<string, string> = { late_in: 'bg-amber-100 text-amber-700', early_out: 'bg-orange-100 text-orange-700', both: 'bg-red-100 text-red-700' };
const typeLabels: Record<string, string> = { late_in: 'Late In', early_out: 'Early Out', both: 'Both' };

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Scheduled Start', accessor: 'scheduledStart' }, { header: 'Actual Clock In', accessor: 'actualClockIn' },
  { header: 'Late (min)', accessor: 'lateMinutes' }, { header: 'Type', accessor: (r: any) => typeLabels[r.type] },
];

const locations = [...new Set(mockLatePunctuality.map(r => r.location))];

const tableColumns: DataTableColumn<LatePunctualityRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.type === 'both' ? 'bg-red-500' : r.type === 'late_in' ? 'bg-amber-500' : 'bg-orange-500')} />

      <span className="font-medium">{r.staffName}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'scheduledStart', header: 'Scheduled', type: 'text', accessor: (r) => <span className="text-xs font-mono">{r.scheduledStart}</span>, sortValue: (r) => r.scheduledStart },
  { key: 'actualClockIn', header: 'Actual In', type: 'number', accessor: (r) => <span className="text-xs font-mono">{r.actualClockIn}</span>, sortValue: (r) => r.actualClockIn },
  { key: 'lateMinutes', header: 'Late', type: 'number', align: 'right', sortValue: (r) => r.lateMinutes,
    accessor: (r) => r.lateMinutes > 0 ? (
      <span className={cn('font-medium', r.lateMinutes > 15 ? 'text-destructive' : r.lateMinutes > 5 ? 'text-amber-600' : 'text-muted-foreground')}>+{r.lateMinutes}m</span>
    ) : <span className="text-muted-foreground">—</span> },
  { key: 'earlyMinutes', header: 'Early Out', type: 'number', align: 'right', sortValue: (r) => r.earlyMinutes,
    accessor: (r) => r.earlyMinutes > 0 ? (
      <span className={cn('font-medium', r.earlyMinutes > 15 ? 'text-destructive' : 'text-orange-600')}>-{r.earlyMinutes}m</span>
    ) : <span className="text-muted-foreground">—</span> },
  { key: 'type', header: 'Type', type: 'enum', sortValue: (r) => r.type,
    accessor: (r) => <Badge className={cn('text-xs', typeColors[r.type])}>{typeLabels[r.type]}</Badge> },
  { key: 'totalLateMinutes', header: 'Total Min', type: 'number', accessor: (r) => <span className="font-mono text-xs">{r.totalLateMinutes ?? 0}m</span>, sortValue: (r) => r.totalLateMinutes ?? 0, align: 'right' },
  { key: 'occurrencesThisMonth', header: 'This Mo.', type: 'number', accessor: (r) => r.occurrencesThisMonth ?? 0, sortValue: (r) => r.occurrencesThisMonth ?? 0, align: 'right' },
  { key: 'costImpact', header: 'Cost Impact', type: 'number', accessor: (r) => `$${r.costImpact ?? 0}`, sortValue: (r) => r.costImpact ?? 0, align: 'right' },
  { key: 'pattern', header: 'Pattern', type: 'enum', accessor: (r) => <Badge variant={r.pattern === 'chronic' ? 'destructive' : r.pattern === 'recurring' ? 'secondary' : 'outline'} className="text-[10px]">{r.pattern}</Badge>, sortValue: (r) => r.pattern ?? '' },
  { key: 'actionTaken', header: 'Action', type: 'enum', accessor: (r) => <span className="text-xs">{(r.actionTaken ?? '').replace('_', ' ')}</span>, sortValue: (r) => r.actionTaken ?? '' },
  { key: 'lateMinutesTrend', header: 'Late Trend (8wk)', type: 'sparkline', trendValues: (r) => r.lateMinutesTrend ?? [], accessor: () => null },
];

export function LatePunctualityReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockLatePunctuality.filter(r => {
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


  const totalLateMinutes = filtered.reduce((s, r) => s + r.lateMinutes, 0);
  const totalEarlyMinutes = filtered.reduce((s, r) => s + r.earlyMinutes, 0);
  const totalLostMinutes = totalLateMinutes + totalEarlyMinutes;
  const avgLate = filtered.filter(r => r.lateMinutes > 0).length > 0 ? Math.round(totalLateMinutes / filtered.filter(r => r.lateMinutes > 0).length) : 0;
  const estCostImpact = Math.round((totalLostMinutes / 60) * 35);

  const staffAgg = useMemo(() => {
    const agg: Record<string, { name: string; fullName: string; lateCount: number; totalLate: number; earlyCount: number; totalEarly: number }> = {};
    filtered.forEach(r => {
      if (!agg[r.staffName]) agg[r.staffName] = { name: r.staffName.split(' ')[0], fullName: r.staffName, lateCount: 0, totalLate: 0, earlyCount: 0, totalEarly: 0 };
      if (r.lateMinutes > 0) { agg[r.staffName].lateCount++; agg[r.staffName].totalLate += r.lateMinutes; }
      if (r.earlyMinutes > 0) { agg[r.staffName].earlyCount++; agg[r.staffName].totalEarly += r.earlyMinutes; }
    });
    return Object.values(agg);
  }, [filtered]);

  const repeatOffenders = staffAgg.filter(s => s.lateCount >= 2);
  const typeDist = [
    { name: 'Late In Only', value: filtered.filter(r => r.type === 'late_in').length, fill: '#F59E0B' },
    { name: 'Early Out Only', value: filtered.filter(r => r.type === 'early_out').length, fill: '#F97316' },
    { name: 'Both', value: filtered.filter(r => r.type === 'both').length, fill: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const insights = useMemo(() => {
    const result = [];
    if (repeatOffenders.length > 0) result.push({ type: 'negative' as const, title: `${repeatOffenders.length} repeat offenders identified`, description: `Staff with 2+ late/early incidents in the period: ${repeatOffenders.map(s => s.fullName).join(', ')}. Chronic punctuality issues may require formal counselling.`, metric: `${repeatOffenders.reduce((s, r) => s + r.lateCount, 0)} incidents combined`, action: 'Schedule performance discussions with repeat offenders' });
    if (totalLostMinutes > 60) result.push({ type: 'action' as const, title: `${Math.round(totalLostMinutes / 60)}h productive time lost`, description: `${totalLateMinutes}m from late arrivals + ${totalEarlyMinutes}m from early departures = ${totalLostMinutes}m of unproductive paid time. Estimated cost: $${estCostImpact.toLocaleString()}.`, metric: `$${estCostImpact.toLocaleString()} cost impact` });
    if (avgLate > 10) result.push({ type: 'neutral' as const, title: `Average late arrival: ${avgLate} minutes`, description: `The average tardiness exceeds 10 minutes, suggesting systemic issues beyond individual behaviour. Consider reviewing shift start times, transport logistics, or parking availability.`, action: 'Survey staff on barriers to punctual arrival' });
    const earlyOuts = filtered.filter(r => r.earlyMinutes > 15);
    if (earlyOuts.length > 0) result.push({ type: 'negative' as const, title: `${earlyOuts.length} early departures exceeding 15 minutes`, description: `Significant early departures reduce effective coverage during end-of-shift periods, which are often critical handover times.`, action: 'Review end-of-shift processes and handover requirements' });
    return result;
  }, [filtered, repeatOffenders, totalLostMinutes, totalLateMinutes, totalEarlyMinutes, estCostImpact, avgLate]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Late Clock-In / Early Clock-Out Report"
        reportDescription="Tracks all punctuality incidents where staff clocked in after their scheduled start or clocked out before their scheduled end. Identifies patterns and repeat offenders."
        purpose="To monitor workforce punctuality, quantify lost productive time, identify individuals needing performance intervention, and support fair attendance management processes."
        whenToUse={['Weekly to review punctuality trends', 'Before performance reviews', 'When investigating coverage gaps at shift changeover times', 'During attendance management proceedings']}
        keyMetrics={[
          { label: 'Total Lost Minutes', description: 'Combined late arrival and early departure minutes across all incidents.', interpretation: 'Convert to hours and multiply by average rate to calculate cost impact.' },
          { label: 'Repeat Offenders', description: 'Staff with 2+ punctuality incidents in the reporting period.', interpretation: 'Repeat patterns indicate behavioural issues requiring management intervention.' },
          { label: 'Average Late Minutes', description: 'Mean tardiness across all late clock-in events.', interpretation: 'Above 10 minutes suggests systemic issues, not just individual tardiness.', goodRange: '≤5 min', warningRange: '5-15 min', criticalRange: '>15 min' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Quick severity assessment. Total incidents, time lost, cost impact, and number of repeat offenders.' },
          { title: 'Incidents by Staff', content: 'Bar chart showing late-in and early-out counts per staff member. Staff with both types of incidents have the most significant punctuality issues.' },
          { title: 'Type Distribution', content: 'Pie chart showing the balance between late arrivals, early departures, and combined incidents.' },
          { title: 'Incident Detail Table', content: 'Each row is a specific incident with scheduled vs actual times. Red-highlighted minutes indicate significant deviations.' },
        ]}
        actionableInsights={['Address repeat offenders with documented performance conversations', 'Consider adjusting shift times if systemic lateness at specific time slots', 'Implement grace period policy to distinguish trivial from meaningful lateness', 'Review early departures for coverage impact during handover periods']}
        relatedReports={['Attendance Trend', 'Break Compliance', 'Timesheet Exception', 'Weekly Timesheet Summary']}
      />

      <ReportFilterBar title="Late Clock-In / Early Clock-Out Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Incidents" value={filtered.length} icon={AlertTriangle} sparklineData={[8, 12, 10, 15, filtered.length]} />
        <StatCard label="Late Minutes" value={`${totalLateMinutes}m`} icon={Clock} variant={totalLateMinutes > 60 ? 'warning' : 'default'} />
        <StatCard label="Early Out Minutes" value={`${totalEarlyMinutes}m`} icon={Timer} />
        <StatCard label="Avg Late" value={`${avgLate}m`} icon={TrendingDown} variant={avgLate > 10 ? 'warning' : 'default'} />
        <StatCard label="Repeat Offenders" value={repeatOffenders.length} icon={UserX} variant={repeatOffenders.length > 0 ? 'danger' : 'success'} />
        <StatCard label="Est. Cost Impact" value={`$${estCostImpact.toLocaleString()}`} icon={Users} subtitle={`${Math.round(totalLostMinutes / 60)}h lost`} />
      </div>

      <SummaryRow items={[
        { label: 'Total Lost Time', value: `${Math.round(totalLostMinutes / 60)}h ${totalLostMinutes % 60}m` },
        { label: 'Unique Staff', value: staffAgg.length },
        { label: 'Worst Offender', value: [...staffAgg].sort((a, b) => b.totalLate - a.totalLate)[0]?.fullName || 'N/A', highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Incidents by Staff</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffAgg} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lateCount" name="Late Ins" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earlyCount" name="Early Outs" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Incident Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={typeDist} cursor="pointer" onClick={(_, index) => { const d = typeDist[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {typeDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Punctuality Incident Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable reportId="late-punctuality" key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
