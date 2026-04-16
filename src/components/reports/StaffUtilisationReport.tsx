import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockStaffUtilisation, StaffUtilisationRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Users, Clock, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Role', accessor: 'role' },
  { header: 'Location', accessor: 'location' }, { header: 'Scheduled Hours', accessor: 'scheduledHours' },
  { header: 'Capacity Hours', accessor: 'capacityHours' }, { header: 'Utilisation %', accessor: 'utilisationPercent' },
  { header: 'Overtime Hours', accessor: 'overtimeHours' }, { header: 'Leave Hours', accessor: 'leaveHours' },
];

const locations = [...new Set(mockStaffUtilisation.map(r => r.location))];

const tableColumns: DataTableColumn<StaffUtilisationRecord>[] = [
  { key: 'staffName', header: 'Staff Member', accessor: (r) => (
    <div>
      <span className="font-medium text-foreground">{r.staffName}</span>
      <span className="block text-[10px] text-muted-foreground">{r.staffId}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'role', header: 'Role', accessor: (r) => <Badge variant="outline" className="text-xs">{r.role}</Badge>, sortValue: (r) => r.role },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'scheduledHours', header: 'Scheduled', accessor: (r) => <span className="font-mono text-xs">{r.scheduledHours}h</span>, sortValue: (r) => r.scheduledHours, align: 'right' },
  { key: 'capacityHours', header: 'Capacity', accessor: (r) => <span className="font-mono text-xs">{r.capacityHours}h</span>, sortValue: (r) => r.capacityHours, align: 'right' },
  { key: 'gapHours', header: 'Gap', align: 'right', sortValue: (r) => r.capacityHours - r.scheduledHours,
    accessor: (r) => {
      const gap = r.capacityHours - r.scheduledHours;
      return gap > 0 ? <span className="text-xs text-amber-600 font-medium">{gap}h unused</span> : <span className="text-xs text-emerald-600">—</span>;
    }
  },
  { key: 'utilisationPercent', header: 'Utilisation', className: 'w-[160px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.utilisationPercent} className="h-2 flex-1" />

        <span className={cn('text-xs font-semibold w-9 text-right',
          r.utilisationPercent >= 100 ? 'text-destructive' : r.utilisationPercent >= 90 ? 'text-emerald-600' : r.utilisationPercent >= 75 ? 'text-foreground' : 'text-amber-600'
        )}>{r.utilisationPercent}%</span>
      </div>
    ),
  },
  { key: 'overtimeHours', header: 'OT', align: 'right', sortValue: (r) => r.overtimeHours,
    accessor: (r) => r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : <span className="text-muted-foreground text-xs">—</span> },
  { key: 'leaveHours', header: 'Leave', align: 'right', sortValue: (r) => r.leaveHours,
    accessor: (r) => r.leaveHours > 0 ? <span className="text-xs text-blue-600">{r.leaveHours}h</span> : <span className="text-muted-foreground text-xs">—</span> },
  { key: 'effectiveRate', header: 'Eff. $/hr', align: 'right', sortValue: (r) => r.scheduledHours > 0 ? Math.round(r.utilisationPercent * 0.45) : 0,
    accessor: (r) => <span className="text-xs font-mono">${(r.utilisationPercent * 0.45).toFixed(2)}</span> },
];

// Simulated weekly trend data per staff
const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
  day: d,
  avgUtil: Math.round(75 + Math.random() * 20),
  target: 85,
  headcount: Math.round(5 + Math.random() * 3),
}));

export function StaffUtilisationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockStaffUtilisation.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
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


  const avgUtilisation = Math.round(filtered.reduce((s, r) => s + r.utilisationPercent, 0) / (filtered.length || 1));
  const totalScheduled = filtered.reduce((s, r) => s + r.scheduledHours, 0);
  const totalCapacity = filtered.reduce((s, r) => s + r.capacityHours, 0);
  const totalOvertime = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  const totalLeave = filtered.reduce((s, r) => s + r.leaveHours, 0);
  const unusedCapacity = totalCapacity - totalScheduled;
  const costOfUnused = unusedCapacity * 32; // avg hourly rate
  const overutilised = filtered.filter(r => r.utilisationPercent >= 95).length;
  const underutilised = filtered.filter(r => r.utilisationPercent < 75).length;
  const optimal = filtered.filter(r => r.utilisationPercent >= 75 && r.utilisationPercent < 95).length;

  const chartData = filtered.map(r => ({ name: r.staffName.split(' ')[1] || r.staffName.split(' ')[0], utilisation: r.utilisationPercent, overtime: r.overtimeHours, leave: r.leaveHours, capacity: r.capacityHours }));
  const distributionData = [
    { name: 'Under-utilised (<75%)', value: underutilised, color: '#F59E0B' },
    { name: 'Optimal (75-94%)', value: optimal, color: 'hsl(142, 76%, 36%)' },
    { name: 'Over-utilised (≥95%)', value: overutilised, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  const locationBreakdown = locations.map(loc => {
    const staff = filtered.filter(r => r.location === loc);
    return {
      location: loc.split(' ')[0],
      avgUtil: Math.round(staff.reduce((s, r) => s + r.utilisationPercent, 0) / (staff.length || 1)),
      headcount: staff.length,
      overtime: staff.reduce((s, r) => s + r.overtimeHours, 0),
      unused: staff.reduce((s, r) => s + r.capacityHours - r.scheduledHours, 0),
    };
  });

  // Insights
  const insights = useMemo(() => {
    const result = [];
    if (overutilised > 0) result.push({ type: 'negative' as const, title: `${overutilised} staff over-utilised`, description: `${overutilised} staff member(s) are at or above 95% utilisation, increasing burnout risk and reducing schedule flexibility for unexpected absences.`, metric: `${totalOvertime}h overtime accrued`, action: 'Review workload distribution and consider hiring or rebalancing shifts' });
    if (underutilised > 0) result.push({ type: 'action' as const, title: `${underutilised} staff under-utilised`, description: `${underutilised} staff member(s) are below 75% utilisation. This represents ${unusedCapacity}h of unused capacity worth approximately $${costOfUnused.toLocaleString()}.`, metric: `$${costOfUnused.toLocaleString()} potential savings`, action: 'Reassign shifts from overtime staff or reduce contracted hours' });
    if (avgUtilisation >= 85 && avgUtilisation <= 92) result.push({ type: 'positive' as const, title: 'Healthy utilisation balance', description: `Average utilisation of ${avgUtilisation}% is within the optimal range (85-92%). This provides enough buffer for absences while maintaining cost efficiency.`, metric: `${optimal} staff in optimal range` });
    if (totalLeave > 10) result.push({ type: 'neutral' as const, title: `${totalLeave}h leave impact`, description: `Staff leave is consuming ${totalLeave}h this period, reducing effective capacity by ${Math.round(totalLeave / totalCapacity * 100)}%. Monitor for patterns.`, action: 'Check if leave patterns correlate with peak demand periods' });
    return result;
  }, [filtered, overutilised, underutilised, avgUtilisation, totalOvertime, totalLeave, unusedCapacity, costOfUnused, optimal, totalCapacity]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Staff Utilisation Report"
        reportDescription="Measures how effectively staff working hours are being used relative to their contracted capacity. This report helps identify both overworked staff at risk of burnout and underutilised staff representing labour cost inefficiency."
        purpose="To optimise workforce scheduling by ensuring staff are neither overworked (burnout risk, overtime costs) nor underutilised (wasted labour budget). The target utilisation range is 85-92%."
        whenToUse={[
          'During weekly roster reviews to identify scheduling imbalances',
          'When planning headcount changes or restructuring',
          'To justify hiring requests with data on current capacity shortfalls',
          'Before performance reviews to contextualise workload distribution',
          'When overtime costs are rising to find root causes',
        ]}
        keyMetrics={[
          { label: 'Utilisation %', description: 'Scheduled hours divided by capacity hours, expressed as a percentage. Measures how much of a staff member\'s available time is actually rostered.', interpretation: 'Higher isn\'t always better. 100% means zero flexibility for absences or emergencies.', goodRange: '85-92%', warningRange: '<75% or >92%', criticalRange: '≥95% or <60%' },
          { label: 'Unused Capacity', description: 'The gap between contracted hours and scheduled hours. Represents time you\'re paying for but not utilising.', interpretation: 'Small gaps (5-15%) are healthy buffers. Large gaps indicate overstaffing or scheduling inefficiency.' },
          { label: 'Overtime Hours', description: 'Hours worked beyond contracted maximum. Paid at penalty rates (typically 1.5x-2x).', interpretation: 'Any overtime alongside unused capacity at the same location signals a scheduling problem, not a staffing problem.', goodRange: '0h', warningRange: '1-4h', criticalRange: '>4h' },
          { label: 'Effective Cost/Hour', description: 'Approximation of the true cost-per-productive-hour factoring in utilisation rate.', interpretation: 'Lower utilisation inflates effective hourly cost. A $32/hr staff member at 60% utilisation effectively costs $53/productive hour.' },
        ]}
        howToRead={[
          { title: 'Summary KPI Cards', content: 'The top row shows aggregate metrics for the filtered view. "Avg Utilisation" is the primary health indicator — aim for 85-92%. "Unused Capacity" shows total hours being paid for but not scheduled. "Overtime" flags excess hours that could often be redistributed to underutilised staff. The "Cost of Unused Capacity" estimates the financial impact of scheduling gaps.' },
          { title: 'Utilisation Distribution Chart', content: 'The pie chart segments staff into three zones:\n• Under-utilised (<75%): Staff with significant unused contracted hours\n• Optimal (75-94%): Healthy balance with flexibility buffer\n• Over-utilised (≥95%): At or near maximum — no room for emergencies\n\nA healthy organisation should have most staff in the Optimal zone.' },
          { title: 'Weekly Trend Line', content: 'Shows daily average utilisation across the week. Look for:\n• Consistent dips on specific days (potential for schedule consolidation)\n• The gap between actual utilisation and the 85% target line\n• Weekend utilisation patterns versus weekdays' },
          { title: 'Staff Detail Table', content: 'Each row represents one staff member. Key columns:\n• Gap: Hours between capacity and scheduled — highlights redistribution opportunities\n• Utilisation bar: Visual indicator with colour coding (green = optimal, amber = under, red = over)\n• OT: Overtime hours flagged in red — cross-reference with underutilised staff at the same location\n• Eff. $/hr: True cost per productive hour — rises sharply as utilisation drops' },
          { title: 'Location Breakdown', content: 'Compares utilisation metrics across locations. Look for locations with both overtime AND unused capacity — this indicates internal scheduling inefficiency rather than headcount issues.' },
        ]}
        actionableInsights={[
          'If a location has both overtime and unused capacity, redistribute shifts before approving overtime',
          'Staff consistently under 70% utilisation may need contracted hours reduced or cross-location deployment',
          'Staff consistently over 95% should have workload reduced to prevent burnout and maintain compliance buffers',
          'Track week-over-week trends — declining utilisation may signal upcoming demand drops',
          'Use the "Effective $/hr" column to identify the true cost impact of underutilisation on your labour budget',
        ]}
        relatedReports={['Overtime & Fatigue Risk', 'Availability vs Scheduled', 'Labour Cost by Location', 'Schedule Fairness Report']}
      />

      <ReportFilterBar title="Staff Utilisation Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or role..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Avg Utilisation" value={`${avgUtilisation}%`} icon={Target}
          trend={{ value: 2.3, label: 'vs last period', isPositiveGood: true }}
          sparklineData={weeklyTrend.map(d => d.avgUtil)}
          variant={avgUtilisation >= 85 ? 'success' : avgUtilisation >= 70 ? 'warning' : 'danger'} />
        <StatCard label="Total Scheduled" value={`${totalScheduled}h`} icon={Clock}
          trend={{ value: 8, label: 'vs last period' }} subtitle={`of ${totalCapacity}h capacity`} />
        <StatCard label="Unused Capacity" value={`${unusedCapacity}h`} icon={Zap}
          trend={{ value: -3, label: 'vs last period', isPositiveGood: false }}
          subtitle={`$${costOfUnused.toLocaleString()} labour cost`} variant={unusedCapacity > 20 ? 'warning' : 'default'} />
        <StatCard label="Overtime Accrued" value={`${totalOvertime}h`} icon={AlertTriangle}
          trend={{ value: -1, label: 'vs last period', isPositiveGood: false }} variant={totalOvertime > 8 ? 'danger' : 'default'} />
        <StatCard label="Staff on Leave" value={`${totalLeave}h`} icon={Users}
          subtitle={`${filtered.filter(r => r.leaveHours > 0).length} staff affected`} />
        <StatCard label="Staff Count" value={filtered.length} icon={Users}
          subtitle={`${overutilised} over · ${underutilised} under`} />
      </div>

      {/* Summary Row */}
      <SummaryRow items={[
        { label: 'Optimal Range Staff', value: `${optimal} of ${filtered.length}`, highlight: true },
        { label: 'Over-utilised', value: overutilised },
        { label: 'Under-utilised', value: underutilised },
        { label: 'Avg Capacity/Staff', value: `${Math.round(totalCapacity / (filtered.length || 1))}h` },
        { label: 'OT as % of Total', value: `${totalScheduled > 0 ? Math.round(totalOvertime / totalScheduled * 100) : 0}%` },
      ]} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Staff Member</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 110]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="utilisation" name="Utilisation %" radius={[4, 4, 0, 0]} stackId="a">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.utilisation >= 95 ? 'hsl(var(--destructive))' : entry.utilisation >= 75 ? 'hsl(142, 76%, 36%)' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distributionData} cursor="pointer" onClick={(_, index) => { const d = distributionData[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" label={({ name, value }) => `${value}`}>
                  {distributionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
            <div className="space-y-1 mt-2">
              {distributionData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly Utilisation Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avgUtil" name="Avg Utilisation %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" name="Target 85%" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={locationBreakdown} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="location" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgUtil" name="Avg Util %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
            <div className="mt-3 space-y-1">
              {locationBreakdown.map(lb => (
                <div key={lb.location} className="flex items-center text-[11px] gap-2">
                  <span className="text-muted-foreground flex-1">{lb.location}</span>
                  <span>{lb.headcount} staff</span>
                  <span className="w-px h-3 bg-border" />
                  <span>{lb.overtime}h OT</span>
                  <span className="w-px h-3 bg-border" />
                  <span className="text-amber-600">{lb.unused}h unused</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Staff Utilisation Detail</CardTitle>
            <Badge variant="outline" className="text-[10px]">{filtered.length} staff</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.staffId} />
        </CardContent>
      </Card>
    </div>
  );
}
