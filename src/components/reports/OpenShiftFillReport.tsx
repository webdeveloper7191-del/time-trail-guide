import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOpenShiftFill, OpenShiftFillRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Clock, Target, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';


const COLORS = { internal: 'hsl(142, 76%, 36%)', agency: '#F59E0B', unfilled: 'hsl(var(--destructive))' };

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Area', accessor: 'area' },
  { header: 'Total Open', accessor: 'totalOpenShifts' }, { header: 'Filled', accessor: 'filledShifts' },
  { header: 'Internal', accessor: 'filledByInternal' }, { header: 'Agency', accessor: 'filledByAgency' },
  { header: 'Fill Rate %', accessor: 'fillRate' }, { header: 'Avg Time (h)', accessor: 'avgTimeToFillHours' },
  { header: 'Urgency', accessor: 'urgency' },
];

const locations = [...new Set(mockOpenShiftFill.map(r => r.location))];

const tableColumns: DataTableColumn<OpenShiftFillRecord>[] = [
  { key: 'date', header: 'Date', accessor: (r) => (
    <div>
      <span className="font-medium text-xs">{format(parseISO(r.date), 'dd MMM')}</span>
      <span className="block text-[10px] text-muted-foreground">{format(parseISO(r.date), 'EEEE')}</span>
    </div>
  ), sortValue: (r) => r.date },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'area', header: 'Area', accessor: (r) => <Badge variant="outline" className="text-xs">{r.area}</Badge>, sortValue: (r) => r.area },
  { key: 'totalOpenShifts', header: 'Open', accessor: (r) => <span className="font-semibold">{r.totalOpenShifts}</span>, sortValue: (r) => r.totalOpenShifts, align: 'right' },
  { key: 'filledShifts', header: 'Filled', accessor: (r) => r.filledShifts, sortValue: (r) => r.filledShifts, align: 'right' },
  { key: 'filledByInternal', header: 'Internal', accessor: (r) => (
    <span className="text-xs">{r.filledByInternal} <span className="text-muted-foreground">({r.filledShifts > 0 ? Math.round(r.filledByInternal / r.filledShifts * 100) : 0}%)</span></span>
  ), sortValue: (r) => r.filledByInternal, align: 'right' },
  { key: 'filledByAgency', header: 'Agency', accessor: (r) => (
    r.filledByAgency > 0 ? <span className="text-xs text-amber-600">{r.filledByAgency} <span className="text-muted-foreground">(~${r.filledByAgency * 480})</span></span> : <span className="text-muted-foreground text-xs">—</span>
  ), sortValue: (r) => r.filledByAgency, align: 'right' },
  { key: 'unfilled', header: 'Unfilled', align: 'right', sortValue: (r) => r.unfilled,
    accessor: (r) => r.unfilled > 0 ? <Badge variant="destructive" className="text-xs">{r.unfilled}</Badge> : <span className="text-emerald-600 text-xs">✓</span> },
  { key: 'fillRate', header: 'Fill Rate', align: 'right', sortValue: (r) => r.fillRate,
    accessor: (r) => (
      <div className="flex items-center gap-1.5 justify-end">
        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.fillRate >= 80 ? 'bg-emerald-500' : r.fillRate >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${r.fillRate}%` }} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />
        </div>
        <span className={cn('font-semibold text-xs w-8 text-right', r.fillRate >= 80 ? 'text-emerald-600' : r.fillRate >= 50 ? 'text-amber-600' : 'text-destructive')}>{r.fillRate}%</span>
      </div>
    ) },
  { key: 'avgTime', header: 'Time to Fill', accessor: (r) => (
    <span className={cn('text-xs', r.avgTimeToFillHours <= 4 ? 'text-emerald-600' : r.avgTimeToFillHours <= 12 ? 'text-amber-600' : 'text-destructive')}>
      {r.avgTimeToFillHours}h
    </span>
  ), sortValue: (r) => r.avgTimeToFillHours, align: 'right' },
  { key: 'urgency', header: 'Urgency', sortValue: (r) => ({ low: 0, medium: 1, high: 2, critical: 3 }[r.urgency]),
    accessor: (r) => <Badge variant="outline" className={cn('text-[10px] capitalize',
      r.urgency === 'critical' && 'border-destructive text-destructive bg-red-50',
      r.urgency === 'high' && 'border-orange-500 text-orange-600 bg-orange-50',
      r.urgency === 'medium' && 'border-amber-500 text-amber-600',
    )}>{r.urgency}</Badge> },
];

export function OpenShiftFillReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => mockOpenShiftFill.filter(r => {
    const matchesSearch = !search || r.area.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    if (dateRange?.from) { const d = parseISO(r.date); if (d < dateRange.from) return false; if (dateRange.to && d > dateRange.to) return false; }
    return matchesSearch && matchesLoc;
  }), [search, locationFilter, dateRange]);

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


  const totalOpen = filtered.reduce((s, r) => s + r.totalOpenShifts, 0);
  const totalFilled = filtered.reduce((s, r) => s + r.filledShifts, 0);
  const totalInternal = filtered.reduce((s, r) => s + r.filledByInternal, 0);
  const totalAgency = filtered.reduce((s, r) => s + r.filledByAgency, 0);
  const totalUnfilled = filtered.reduce((s, r) => s + r.unfilled, 0);
  const avgFillRate = totalOpen > 0 ? Math.round((totalFilled / totalOpen) * 100) : 0;
  const avgTimeToFill = Math.round(filtered.reduce((s, r) => s + r.avgTimeToFillHours, 0) / (filtered.length || 1));
  const internalRate = totalFilled > 0 ? Math.round(totalInternal / totalFilled * 100) : 0;
  const estAgencyCost = totalAgency * 480;
  const criticalUnfilled = filtered.filter(r => r.unfilled > 0 && r.urgency === 'critical').length;

  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; fillRate: number; total: number; filled: number; internal: number; agency: number; unfilled: number }> = {};
    filtered.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { date: format(parseISO(r.date), 'dd MMM'), fillRate: 0, total: 0, filled: 0, internal: 0, agency: 0, unfilled: 0 };
      byDate[r.date].total += r.totalOpenShifts; byDate[r.date].filled += r.filledShifts;
      byDate[r.date].internal += r.filledByInternal; byDate[r.date].agency += r.filledByAgency;
      byDate[r.date].unfilled += r.unfilled;
    });
    return Object.values(byDate).map(d => ({ ...d, fillRate: d.total > 0 ? Math.round((d.filled / d.total) * 100) : 0 }));
  }, [filtered]);

  const sourceData = [
    { name: 'Internal', value: totalInternal, fill: COLORS.internal },
    { name: 'Agency', value: totalAgency, fill: COLORS.agency },
    { name: 'Unfilled', value: totalUnfilled, fill: COLORS.unfilled },
  ].filter(d => d.value > 0);

  const byArea = [...new Set(filtered.map(r => r.area))].map(area => {
    const items = filtered.filter(r => r.area === area);
    const total = items.reduce((s, r) => s + r.totalOpenShifts, 0);
    const filled = items.reduce((s, r) => s + r.filledShifts, 0);
    return { area, total, filled, fillRate: total > 0 ? Math.round(filled / total * 100) : 0 };
  });

  const insights = useMemo(() => {
    const result = [];
    if (avgFillRate < 70) result.push({ type: 'negative' as const, title: `Fill rate below target at ${avgFillRate}%`, description: `The 14-day fill rate is ${avgFillRate}%, well below the 85% target. ${totalUnfilled} shifts remain unfilled, creating coverage gaps and potential compliance risks.`, metric: `${totalUnfilled} unfilled shifts`, action: 'Review shift timing and expand available staff pool' });
    if (internalRate < 50) result.push({ type: 'action' as const, title: `High agency reliance (${100 - internalRate}% of fills)`, description: `Only ${internalRate}% of shifts are being filled internally. Agency fills cost ~3x more than internal staff. Estimated agency premium: $${estAgencyCost.toLocaleString()}.`, metric: `$${estAgencyCost.toLocaleString()} agency spend`, action: 'Improve internal staff availability or increase casual pool' });
    if (avgTimeToFill > 8) result.push({ type: 'action' as const, title: `Slow fill time: ${avgTimeToFill}h average`, description: `Open shifts take an average of ${avgTimeToFill} hours to fill. Shifts posted less than 4 hours before start have a 40% lower fill rate.`, action: 'Post open shifts earlier — aim for 24h+ lead time' });
    if (criticalUnfilled > 0) result.push({ type: 'negative' as const, title: `${criticalUnfilled} critical unfilled shifts`, description: `There are ${criticalUnfilled} unfilled shifts marked as critical urgency, meaning they affect compliance ratios or service delivery.`, action: 'Escalate to agency broadcast or manager reallocation immediately' });
    if (avgFillRate >= 85) result.push({ type: 'positive' as const, title: `Strong fill rate at ${avgFillRate}%`, description: `Exceeding the 85% target. Internal fill rate of ${internalRate}% indicates good staff engagement with shift pickup.` });
    return result;
  }, [avgFillRate, internalRate, avgTimeToFill, totalUnfilled, estAgencyCost, criticalUnfilled]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Open Shift Fill Rate Report"
        reportDescription="Tracks how effectively open shifts are being filled across locations, including fill source (internal vs agency), time-to-fill metrics, and the financial impact of different fill strategies."
        purpose="To measure operational responsiveness, minimise unfilled shifts, optimise the balance between internal and agency fills, and reduce the cost and time associated with last-minute shift coverage."
        whenToUse={[
          'Weekly — to assess overall shift coverage effectiveness',
          'When agency costs are rising to understand fill source mix',
          'After periods of high absenteeism to measure recovery speed',
          'During recruitment planning to quantify the casual pool gap',
          'Before peak periods to baseline fill capability',
        ]}
        keyMetrics={[
          { label: 'Fill Rate %', description: 'Percentage of open shifts that were successfully filled (either internally or via agency). Calculated as: (Filled Shifts ÷ Total Open Shifts) × 100.', interpretation: 'Target is 85%+. Below 70% indicates systemic coverage problems.', goodRange: '≥85%', warningRange: '70-84%', criticalRange: '<70%' },
          { label: 'Internal Fill Rate', description: 'Of all filled shifts, the percentage filled by your own staff (not agency). Higher is better due to cost savings and familiarity.', interpretation: 'Target 70%+. Below 50% means heavy agency reliance and potential cost blow-out.', goodRange: '≥70%', warningRange: '50-69%', criticalRange: '<50%' },
          { label: 'Time to Fill', description: 'Average hours between a shift being posted as open and being filled. Measures responsiveness.', interpretation: 'Faster is better. Shifts posted 24h+ in advance fill 60% faster than same-day posts.', goodRange: '≤4 hours', warningRange: '5-12 hours', criticalRange: '>12 hours' },
          { label: 'Agency Cost Impact', description: 'Estimated cost of agency fills based on average agency shift cost of $480 (8h × $60/hr).', interpretation: 'Every agency shift avoided by internal fill saves approximately $200-250 in premium.' },
        ]}
        howToRead={[
          { title: 'Summary KPI Cards', content: 'Six metrics give you the complete picture:\n• Fill Rate: Overall effectiveness (target 85%+)\n• Time to Fill: Speed of response\n• Internal Rate: Cost efficiency of fill source\n• Unfilled: Current gaps requiring attention\n• Est. Agency Cost: Financial impact of external fills\n• Critical Unfilled: Shifts affecting compliance' },
          { title: 'Fill Rate Trend Chart', content: 'The area chart shows daily fill rates over the reporting period. Look for:\n• Consistent underperformance on specific days (e.g., weekends)\n• The gap between actual rate and the 85% target line\n• Sudden drops indicating staff availability problems' },
          { title: 'Fill Source Breakdown', content: 'The pie chart shows where fills come from:\n• Green (Internal): Most cost-effective\n• Amber (Agency): Premium cost but ensures coverage\n• Red (Unfilled): Gaps in coverage — potential compliance risk\n\nIdeal ratio is 70%+ internal, <20% agency, <10% unfilled.' },
          { title: 'Fill Rate by Area', content: 'Stacked bar chart showing filled vs open shifts per area. Areas with persistently low fill rates may need:\n• Dedicated casual pools\n• Better shift incentives\n• Adjusted timing to match staff availability' },
          { title: 'Detail Table', content: 'Each row is one day/location/area combination. The visual fill rate bar provides instant comparison. Key columns:\n• Internal vs Agency split with cost estimates\n• Time to Fill with colour coding (green ≤4h, amber ≤12h, red >12h)\n• Urgency flag for prioritisation' },
        ]}
        actionableInsights={[
          'Post open shifts at least 24 hours in advance — this alone improves fill rates by 20-30%',
          'Track which areas have the lowest fill rates and build dedicated casual pools for those roles',
          'If agency fills exceed 30%, consider hiring additional casual staff — the breakeven is typically 2-3 shifts per week',
          'Use fill time data to set SLAs for shift broadcast — escalate to agency if unfilled after 8 hours',
          'Monitor weekend vs weekday fill rates separately — different strategies are needed for each',
        ]}
        relatedReports={['Agency Usage & Cost', 'Shift Coverage Gap Analysis', 'Staff Utilisation', 'Casual vs Permanent Cost']}
      />

      <ReportFilterBar title="Open Shift Fill Rate Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search area or location..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Overall Fill Rate" value={`${avgFillRate}%`} icon={Target}
          trend={{ value: 5, label: 'vs last period' }}
          sparklineData={trendData.map(d => d.fillRate)}
          variant={avgFillRate >= 85 ? 'success' : avgFillRate >= 70 ? 'warning' : 'danger'} />
        <StatCard label="Avg Time to Fill" value={`${avgTimeToFill}h`} icon={Clock}
          trend={{ value: -1.5, label: 'vs last period', isPositiveGood: false }}
          variant={avgTimeToFill <= 4 ? 'success' : avgTimeToFill <= 12 ? 'warning' : 'danger'} />
        <StatCard label="Internal Fill Rate" value={`${internalRate}%`} icon={Users}
          subtitle={`${totalInternal} of ${totalFilled} fills`} variant={internalRate >= 70 ? 'success' : 'warning'} />
        <StatCard label="Still Unfilled" value={totalUnfilled} icon={AlertTriangle}
          variant={totalUnfilled > 0 ? 'danger' : 'success'} subtitle={criticalUnfilled > 0 ? `${criticalUnfilled} critical` : 'No critical gaps'} />
        <StatCard label="Est. Agency Cost" value={`$${(estAgencyCost / 1000).toFixed(1)}k`} icon={DollarSign}
          subtitle={`${totalAgency} agency shifts`} variant={estAgencyCost > 5000 ? 'warning' : 'default'} />
        <StatCard label="Total Open Shifts" value={totalOpen} icon={TrendingUp}
          trend={{ value: -3, label: 'vs last period', isPositiveGood: false }} subtitle={`${totalFilled} filled`} />
      </div>

      <SummaryRow items={[
        { label: 'Period', value: filtered.length > 0 ? `${format(parseISO(filtered[0].date), 'dd MMM')} - ${format(parseISO(filtered[filtered.length - 1].date), 'dd MMM')}` : '—' },
        { label: 'Locations', value: [...new Set(filtered.map(r => r.location))].length },
        { label: 'Fill Breakdown', value: `${totalInternal} int / ${totalAgency} agency / ${totalUnfilled} unfilled`, highlight: true },
        { label: 'Avg Shifts/Day', value: Math.round(totalOpen / (trendData.length || 1)) },
      ]} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fill Rate Trend & Volume</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="fillRate" name="Fill Rate %" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillGrad)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey={() => 85} name="Target 85%" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fill Source Mix</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sourceData} cursor="pointer" onClick={(_, index) => { const d = sourceData[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={65} innerRadius={35} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {sourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
            <div className="space-y-1.5 mt-2">
              {sourceData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-semibold">{d.value} shifts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Fill Rate by Area</CardTitle></CardHeader>
        <CardContent>
          <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
            <BarChart data={byArea} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="filled" name="Filled" stackId="a" fill="hsl(142, 76%, 36%)" />
              <Bar dataKey="total" name="Total Open" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></AnimatedChartWrapper>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Open Shift Fill Details</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{filtered.length} records</Badge>
              {totalUnfilled > 0 && <Badge variant="destructive" className="text-[10px]">{totalUnfilled} unfilled</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} />
        </CardContent>
      </Card>
    </div>
  );
}
