import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAreaCombiningSavings, AreaCombiningSavingsRecord } from '@/data/mockReportData';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Clock, Users, Layers, TrendingUp, Zap } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Combined Areas', accessor: 'combinedAreas' },
  { header: 'Staff Saved', accessor: 'staffSaved' }, { header: 'Hours Saved', accessor: 'hoursSaved' },
  { header: 'Cost Saved ($)', accessor: 'costSaved' }, { header: 'Duration (min)', accessor: 'durationMinutes' },
];

const locations = [...new Set(mockAreaCombiningSavings.map(r => r.location))];

const tableColumns: DataTableColumn<AreaCombiningSavingsRecord>[] = [
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'combinedAreas', header: 'Combined Areas', type: 'text', accessor: (r) => <span className="font-medium">{r.combinedAreas}</span>, sortValue: (r) => r.combinedAreas },
  { key: 'staffSaved', header: 'Staff Saved', type: 'text', accessor: (r) => (
    <Badge variant="default" className="text-xs">{r.staffSaved}</Badge>
  ), sortValue: (r) => r.staffSaved, align: 'right' },
  { key: 'hoursSaved', header: 'Hours Saved', type: 'number', accessor: (r) => `${r.hoursSaved}h`, sortValue: (r) => r.hoursSaved, align: 'right' },
  { key: 'costSaved', header: 'Cost Saved', type: 'number', accessor: (r) => <span className="font-semibold text-emerald-600">${r.costSaved.toLocaleString()}</span>, sortValue: (r) => r.costSaved, align: 'right' },
  { key: 'childrenAffected', header: 'Attendees', type: 'number', accessor: (r) => r.childrenAffected, sortValue: (r) => r.childrenAffected, align: 'right' },
  { key: 'durationMinutes', header: 'Duration', type: 'number', accessor: (r) => {
    const h = Math.floor(r.durationMinutes / 60);
    const m = r.durationMinutes % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  }, sortValue: (r) => r.durationMinutes, align: 'right' },
  { key: 'combinedDurationHrs', header: 'Duration', type: 'number', accessor: (r) => `${r.combinedDurationHrs ?? 0}h`, sortValue: (r) => r.combinedDurationHrs ?? 0, align: 'right' },
  { key: 'newRatio', header: 'New Ratio', type: 'enum', accessor: (r) => <span className="font-mono text-[11px]">{r.newRatio}</span>, sortValue: (r) => r.newRatio ?? '' },
  { key: 'ratioCompliant', header: 'Compliant', type: 'enum', accessor: (r) => r.ratioCompliant ? <Badge variant="outline" className="text-[10px]">✓ Yes</Badge> : <Badge variant="destructive" className="text-[10px]">No</Badge>, sortValue: (r) => r.ratioCompliant ? 'Yes' : 'No' },
  { key: 'alternativeCost', header: 'Alt. Cost', type: 'number', accessor: (r) => <span className="text-muted-foreground text-xs">${(r.alternativeCost ?? 0).toLocaleString()}</span>, sortValue: (r) => r.alternativeCost ?? 0, align: 'right' },
  { key: 'approvedBy', header: 'Approved By', type: 'enum', accessor: (r) => <span className="text-xs">{r.approvedBy}</span>, sortValue: (r) => r.approvedBy ?? '' },
];

export function AreaCombiningSavingsReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockAreaCombiningSavings.filter(r => {
    const matchesSearch = !search || r.combinedAreas.toLowerCase().includes(search.toLowerCase());
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


  const totalSaved = filtered.reduce((s, r) => s + r.costSaved, 0);
  const totalHours = filtered.reduce((s, r) => s + r.hoursSaved, 0);
  const totalStaff = filtered.reduce((s, r) => s + r.staffSaved, 0);
  const avgDuration = Math.round(filtered.reduce((s, r) => s + r.durationMinutes, 0) / (filtered.length || 1));
  const avgSavingPerEvent = Math.round(totalSaved / (filtered.length || 1));
  const projectedAnnual = Math.round(totalSaved * 52 / 4); // project quarterly to annual

  // Savings by location
  const savingsByLoc = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.location] = (map[r.location] || 0) + r.costSaved; });
    return Object.entries(map).map(([loc, cost]) => ({ name: loc.split(' ')[0], value: cost }));
  }, [filtered]);

  const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Daily trend
  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; cost: number; events: number }> = {};
    filtered.forEach(r => {
      const d = format(parseISO(r.date), 'dd MMM');
      if (!map[d]) map[d] = { date: d, cost: 0, events: 0 };
      map[d].cost += r.costSaved;
      map[d].events++;
    });
    return Object.values(map);
  }, [filtered]);

  const insights = useMemo(() => {
    const result = [];
    result.push({ type: 'positive' as const, title: `$${totalSaved.toLocaleString()} saved through area combining`, description: `${filtered.length} combining events saved ${totalHours} staff-hours and ${totalStaff} staff deployments. This is labour that would have been wasted due to low occupancy.`, metric: `Projected annual savings: $${projectedAnnual.toLocaleString()}` });
    if (avgDuration > 120) result.push({ type: 'neutral' as const, title: `Average combining duration: ${Math.round(avgDuration / 60)}h ${avgDuration % 60}m`, description: `Longer combining periods suggest sustained low occupancy. Consider whether areas should be permanently merged during these time windows.`, action: 'Review occupancy patterns for permanent area restructuring' });
    const topLoc = savingsByLoc.sort((a, b) => b.value - a.value)[0];
    if (topLoc) result.push({ type: 'action' as const, title: `Highest savings at ${topLoc.name}`, description: `${topLoc.name} generated $${topLoc.value.toLocaleString()} in combining savings. This location has the most optimization potential — consider permanent capacity adjustments.`, action: 'Schedule capacity review for this location' });
    return result;
  }, [filtered, totalSaved, totalHours, totalStaff, projectedAnnual, avgDuration, savingsByLoc]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Area Combining Savings Report"
        reportDescription="Tracks the financial and operational impact of automatically combining areas during low-occupancy periods. Validates the ROI of the area combining optimization engine."
        purpose="To quantify labour cost savings from dynamic area combining, identify optimal combining patterns, and support decisions about permanent capacity restructuring."
        whenToUse={[
          'Monthly to track ROI of the area combining feature',
          'During budget reviews to demonstrate operational efficiency gains',
          'When planning permanent area restructuring based on occupancy patterns',
          'To justify continued investment in scheduling optimization tools',
        ]}
        keyMetrics={[
          { label: 'Total Cost Saved', description: 'Aggregate labour cost savings from all combining events in the reporting period. Calculated from redeployed staff hours × applicable hourly rate.', interpretation: 'Compare against the previous period to track optimization trends.' },
          { label: 'Staff-Hours Saved', description: 'Total hours of labour that were redeployed or not required due to area combining.', interpretation: 'These hours represent real capacity that was either reassigned productively or removed from the roster.' },
          { label: 'Average Duration', description: 'Mean duration of combining events in hours/minutes.', interpretation: 'Very long durations (>3h) suggest the areas could be permanently combined during those time windows.' },
          { label: 'Projected Annual Savings', description: 'Extrapolation of current period savings to a full-year estimate.', interpretation: 'Use this figure in business cases for continued optimization investment.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'The top row quantifies the total impact:\n• Total Saved: Direct cost reduction achieved\n• Hours/Staff Saved: Operational efficiency gained\n• Avg Per Event: Helps calibrate expectations per combining opportunity\n• Projected Annual: Use for budgeting and ROI calculations' },
          { title: 'Savings by Location (Pie)', content: 'Shows which locations benefit most from area combining. Locations with high savings should be investigated for permanent restructuring.' },
          { title: 'Daily Trend', content: 'The line chart shows savings accumulation over time. Peaks often correspond to low-attendance days (school holidays, seasonal dips).' },
          { title: 'Event Detail Table', content: 'Each row is a specific combining event with the areas involved, staff saved, and duration. Look for recurring area combinations that could be made permanent.' },
        ]}
        actionableInsights={[
          'Areas that combine more than 3 times per week should be evaluated for permanent merging',
          'Compare projected annual savings against the cost of the optimization system for ROI',
          'Long-duration combining events (>4h) indicate areas that could run with reduced baseline staffing',
          'Track savings per location to prioritise capacity reviews where impact is highest',
        ]}
        relatedReports={['Staff Utilisation', 'Coverage Gap Analysis', 'Labour Cost by Location']}
      />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportFilterBar title="Area Combining Savings Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search areas..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Cost Saved" value={`$${totalSaved.toLocaleString()}`} icon={DollarSign} variant="success"
          sparklineData={dailyTrend.map(d => d.cost)} trend={{ value: 12, label: 'vs last period' }} />
        <StatCard label="Hours Saved" value={`${totalHours}h`} icon={Clock} subtitle={`${totalStaff} staff redeployed`} />
        <StatCard label="Combining Events" value={filtered.length} icon={Layers} />
        <StatCard label="Avg Per Event" value={`$${avgSavingPerEvent}`} icon={Zap} subtitle="cost saved" />
        <StatCard label="Avg Duration" value={`${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m`} icon={Clock}
          variant={avgDuration > 180 ? 'warning' : 'default'} />
        <StatCard label="Projected Annual" value={`$${(projectedAnnual / 1000).toFixed(0)}k`} icon={TrendingUp} variant="success" />
      </div>

      <SummaryRow items={[
        { label: 'Locations', value: new Set(filtered.map(r => r.location)).size },
        { label: 'Unique Area Combos', value: new Set(filtered.map(r => r.combinedAreas)).size },
        { label: 'Total Attendees Affected', value: filtered.reduce((s, r) => s + r.childrenAffected, 0) },
        { label: 'Cost Efficiency', value: `$${Math.round(totalSaved / (totalHours || 1))}/hr saved`, highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Savings by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={savingsByLoc} cursor="pointer" onClick={(_, index) => { const d = savingsByLoc[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {savingsByLoc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Savings Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyTrend} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="cost" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="events" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="cost" dataKey="cost" name="Cost Saved ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Line yAxisId="events" type="monotone" dataKey="events" name="Events" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Area Combining Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} />
        </CardContent>
      </Card>
    </div>
  );
}
