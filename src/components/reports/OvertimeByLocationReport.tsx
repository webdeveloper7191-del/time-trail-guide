import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOvertimeByLocation } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, DollarSign, AlertTriangle, MapPin, Users, TrendingUp } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type OvertimeByLocationRecord = typeof mockOvertimeByLocation[0];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Department', accessor: 'department' },
  { header: 'Staff Count', accessor: 'staffCount' }, { header: 'Total OT Hours', accessor: 'totalOvertimeHours' },
  { header: 'Avg OT/Staff', accessor: 'avgOvertimePerStaff' }, { header: 'OT Cost ($)', accessor: 'overtimeCost' },
  { header: 'Top OT Staff', accessor: 'topOvertimeStaff' },
];

const locations = [...new Set(mockOvertimeByLocation.map(r => r.location))];

const tableColumns: DataTableColumn<OvertimeByLocationRecord>[] = [
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'department', header: 'Department', type: 'enum', accessor: (r) => <Badge variant="outline" className="text-[10px]">{r.department}</Badge>, sortValue: (r) => r.department },
  { key: 'staffCount', header: 'Staff', type: 'number', accessor: (r) => r.staffCount, sortValue: (r) => r.staffCount, align: 'right' },
  { key: 'totalOvertimeHours', header: 'Total OT', type: 'number', align: 'right', sortValue: (r) => r.totalOvertimeHours,
    accessor: (r) => <span className={cn('font-medium', r.totalOvertimeHours > 8 ? 'text-destructive' : '')}>{r.totalOvertimeHours}h</span> },
  { key: 'avgOvertimePerStaff', header: 'Avg/Staff', type: 'number', accessor: (r) => `${r.avgOvertimePerStaff.toFixed(1)}h`, sortValue: (r) => r.avgOvertimePerStaff, align: 'right' },
  { key: 'overtimeCost', header: 'OT Cost', type: 'number', accessor: (r) => <span className="font-semibold">${r.overtimeCost.toLocaleString()}</span>, sortValue: (r) => r.overtimeCost, align: 'right' },
  { key: 'topOvertimeStaff', header: 'Top Contributor', type: 'number', accessor: (r) => <span className="text-xs text-muted-foreground">{r.topOvertimeStaff}</span>, sortValue: (r) => r.topOvertimeStaff },
  { key: 'topOvertimeHours', header: 'Their OT', type: 'number', align: 'right', sortValue: (r) => r.topOvertimeHours,
    accessor: (r) => r.topOvertimeHours > 0 ? <span className="text-destructive text-xs font-medium">{r.topOvertimeHours}h</span> : <span className="text-muted-foreground">—</span> },
  { key: 'budgetedOvertimeCost', header: 'OT Budget', type: 'number', accessor: (r) => `$${(r.budgetedOvertimeCost ?? 0).toLocaleString()}`, sortValue: (r) => r.budgetedOvertimeCost ?? 0, align: 'right' },
  { key: 'variance', header: 'Variance', type: 'number', accessor: (r) => <span className={cn('font-mono text-xs', (r.variance ?? 0) > 0 ? 'text-destructive' : 'text-emerald-600')}>{(r.variance ?? 0) > 0 ? '+' : ''}${r.variance ?? 0}</span>, sortValue: (r) => r.variance ?? 0, align: 'right' },
  { key: 'variancePercent', header: 'Var %', type: 'number', accessor: (r) => `${(r.variancePercent ?? 0) > 0 ? '+' : ''}${r.variancePercent ?? 0}%`, sortValue: (r) => r.variancePercent ?? 0, align: 'right' },
  { key: 'policyLimit', header: 'Policy Limit', type: 'number', accessor: (r) => `${r.policyLimit ?? 0}h`, sortValue: (r) => r.policyLimit ?? 0, align: 'right' },
  { key: 'riskLevel', header: 'Risk', type: 'enum', accessor: (r) => <Badge variant={r.riskLevel === 'critical' ? 'destructive' : r.riskLevel === 'high' ? 'secondary' : 'outline'} className="text-[10px]">{r.riskLevel}</Badge>, sortValue: (r) => r.riskLevel ?? '' },
  { key: 'overtimeHoursTrend', header: 'OT Trend (8wk)', type: 'sparkline', trendValues: (r) => r.overtimeHoursTrend ?? [], accessor: () => null },
  { key: 'overtimeCostTrend', header: 'Cost Trend', type: 'sparkline', trendValues: (r) => r.overtimeCostTrend ?? [], accessor: () => null, defaultHidden: true },
];

export function OvertimeByLocationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockOvertimeByLocation.filter(r => {
    const ms = !search || r.department.toLowerCase().includes(search.toLowerCase()) || r.topOvertimeStaff.toLowerCase().includes(search.toLowerCase());
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


  const totalOT = filtered.reduce((s, r) => s + r.totalOvertimeHours, 0);
  const totalCost = filtered.reduce((s, r) => s + r.overtimeCost, 0);
  const totalStaff = filtered.reduce((s, r) => s + r.staffCount, 0);
  const avgOTPerStaff = totalStaff > 0 ? (totalOT / totalStaff).toFixed(1) : '0';
  const deptWithMostOT = [...filtered].sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours)[0];

  const chartData = filtered.map(r => ({ name: `${r.department}`, ot: r.totalOvertimeHours, cost: r.overtimeCost }));

  const costByLocation = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.location] = (map[r.location] || 0) + r.overtimeCost; });
    return Object.entries(map).map(([loc, cost]) => ({ name: loc.split(' ')[0], value: cost }));
  }, [filtered]);
  const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--destructive))', '#10B981', '#8B5CF6'];

  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, i) => ({
      day,
      hours: filtered.reduce((s, r) => s + (r.weekTrend[i] || 0), 0),
    }));
  }, [filtered]);

  const insights = useMemo(() => {
    const result = [];
    if (totalCost > 2000) result.push({ type: 'negative' as const, title: `$${totalCost.toLocaleString()} overtime cost this period`, description: `At average penalty rates, this overtime spend represents significant budget impact. If sustained, annual OT cost would be ~$${Math.round(totalCost * 52 / 1000)}k. Consider whether an additional hire at ~$55k/year would be more cost-effective.`, metric: `${totalOT}h at ~$${Math.round(totalCost / totalOT)}/hr avg`, action: 'Compare OT cost against permanent hire breakeven' });
    if (deptWithMostOT) result.push({ type: 'action' as const, title: `Highest OT: ${deptWithMostOT.department} (${deptWithMostOT.totalOvertimeHours}h)`, description: `This department accounts for ${Math.round(deptWithMostOT.totalOvertimeHours / totalOT * 100)}% of all overtime. The top contributor is ${deptWithMostOT.topOvertimeStaff} with ${deptWithMostOT.topOvertimeHours}h.`, action: 'Review staffing levels and shift coverage in this department' });
    const peakDay = trendData.sort((a, b) => b.hours - a.hours)[0];
    if (peakDay) result.push({ type: 'neutral' as const, title: `Peak OT day: ${peakDay.day} (${peakDay.hours}h)`, description: `Overtime concentrates on ${peakDay.day}s. This may correlate with specific operational demands or scheduling patterns that could be addressed through roster optimization.` });
    return result;
  }, [filtered, totalCost, totalOT, deptWithMostOT, trendData]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Overtime by Location/Department Report"
        reportDescription="Breaks down overtime hours and costs by location and department, identifying where overtime is concentrated and which staff are the primary contributors."
        purpose="To control overtime spending by identifying high-OT departments, tracking weekly patterns, and providing data for headcount justification decisions."
        whenToUse={['Monthly during budget reviews', 'When overtime spending exceeds allocated budget', 'During workforce planning to justify additional headcount', 'For department-level performance discussions']}
        keyMetrics={[
          { label: 'Total OT Cost', description: 'Aggregate overtime cost at applicable penalty rates.', interpretation: 'Track trend over time. Sustained high OT may justify permanent hire (breakeven typically ~$55k/year).' },
          { label: 'Avg OT per Staff', description: 'Total overtime divided by staff count — shows OT intensity.', interpretation: 'Above 2h/staff/week suggests understaffing rather than individual workload issues.', goodRange: '≤1h', warningRange: '1-3h', criticalRange: '>3h' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Total OT hours, cost, and distribution metrics. The estimated annual projection helps with budgeting decisions.' },
          { title: 'OT by Department', content: 'Identifies which departments generate the most overtime — focus intervention efforts here.' },
          { title: 'Weekly Trend', content: 'Shows which days of the week have peak overtime — useful for adjusting roster patterns.' },
          { title: 'Cost by Location Pie', content: 'Proportional view of where overtime spend is concentrated across locations.' },
        ]}
        actionableInsights={['Compare OT cost against equivalent permanent hire cost to find breakeven', 'Address peak OT days through roster optimization', 'Review top OT contributors for workload redistribution', 'Track monthly trends to validate intervention effectiveness']}
        relatedReports={['Overtime & Fatigue Risk', 'Labour Cost by Location', 'Weekly Timesheet Summary']}
      />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportFilterBar title="Overtime by Location Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search department..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Overtime" value={`${totalOT}h`} icon={Clock} variant={totalOT > 20 ? 'danger' : 'default'} sparklineData={trendData.map(d => d.hours)} />
        <StatCard label="Overtime Cost" value={`$${totalCost.toLocaleString()}`} icon={DollarSign}
          trend={{ value: 8, label: 'vs last period' }} />
        <StatCard label="Departments with OT" value={filtered.filter(r => r.totalOvertimeHours > 0).length} icon={MapPin} subtitle={`of ${filtered.length} total`} />
        <StatCard label="Avg OT/Staff" value={`${avgOTPerStaff}h`} icon={Users} variant={Number(avgOTPerStaff) > 2 ? 'warning' : 'default'} />
        <StatCard label="Total Staff" value={totalStaff} icon={Users} />
        <StatCard label="Est. Annual OT" value={`$${Math.round(totalCost * 52 / 1000)}k`} icon={TrendingUp} variant="warning" />
      </div>

      <SummaryRow items={[
        { label: 'Highest Dept', value: deptWithMostOT?.department || 'N/A', highlight: true },
        { label: 'Top Contributor', value: deptWithMostOT?.topOvertimeStaff || 'N/A' },
        { label: 'Peak Day', value: [...trendData].sort((a, b) => b.hours - a.hours)[0]?.day || 'N/A' },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">OT Cost by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={costByLocation} cursor="pointer" onClick={(_, index) => { const d = costByLocation[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costByLocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">OT by Department</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="ot" name="OT Hours" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly OT Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="hours" name="OT Hours" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Overtime Detail by Department</CardTitle></CardHeader>
        <CardContent><ReportDataTable reportId="overtime-by-location" key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
