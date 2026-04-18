import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockRecurringPatterns, RecurringPatternRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, CheckCircle2, AlertTriangle, Layers, BarChart3, Target } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Pattern', accessor: 'patternName' }, { header: 'Location', accessor: 'location' },
  { header: 'Expected Shifts', accessor: 'totalExpectedShifts' }, { header: 'Actual Shifts', accessor: 'actualShifts' },
  { header: 'Adherence %', accessor: 'adherencePercent' }, { header: 'Deviations', accessor: 'deviations' },
  { header: 'Reasons', accessor: (r: any) => r.deviationReasons.join('; ') },
];

const locations = [...new Set(mockRecurringPatterns.map(r => r.location))];

const tableColumns: DataTableColumn<RecurringPatternRecord>[] = [
  { key: 'patternName', header: 'Pattern', type: 'text', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.adherencePercent >= 90 ? 'bg-emerald-500' : r.adherencePercent >= 75 ? 'bg-amber-500' : 'bg-red-500')} />

      <span className="font-medium">{r.patternName}</span>
    </div>
  ), sortValue: (r) => r.patternName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'totalExpectedShifts', header: 'Expected', type: 'number', accessor: (r) => r.totalExpectedShifts, sortValue: (r) => r.totalExpectedShifts, align: 'right' },
  { key: 'actualShifts', header: 'Actual', type: 'number', accessor: (r) => (
    <span className={cn(r.actualShifts < r.totalExpectedShifts ? 'text-destructive font-medium' : '')}>{r.actualShifts}</span>
  ), sortValue: (r) => r.actualShifts, align: 'right' },
  { key: 'adherencePercent', header: 'Adherence', type: 'number', className: 'w-[150px]', sortValue: (r) => r.adherencePercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.adherencePercent >= 90 ? 'bg-emerald-500' : r.adherencePercent >= 75 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${r.adherencePercent}%` }} />
        </div>
        <span className={cn('text-xs font-mono w-10 text-right', r.adherencePercent < 75 ? 'text-destructive font-bold' : '')}>{r.adherencePercent}%</span>
      </div>
    ) },
  { key: 'deviations', header: 'Deviations', type: 'text', align: 'right', sortValue: (r) => r.deviations,
    accessor: (r) => r.deviations > 0 ? (
      <Badge variant={r.deviations > 3 ? 'destructive' : 'outline'} className="text-xs">{r.deviations}</Badge>
    ) : <span className="text-emerald-600 text-xs">✓ None</span> },
  { key: 'deviationReasons', header: 'Deviation Reasons', type: 'text', accessor: (r) => (
    <div className="flex flex-wrap gap-1">
      {r.deviationReasons.length > 0 ? r.deviationReasons.map((reason, i) => (
        <Badge key={i} variant="secondary" className="text-[10px]">{reason}</Badge>
      )) : <span className="text-muted-foreground text-xs">—</span>}
    </div>
  ), sortValue: (r) => r.deviationReasons.join(', ') },
  { key: 'daysActive', header: 'Days Active', type: 'number', accessor: (r) => `${r.daysActive ?? 0}d`, sortValue: (r) => r.daysActive ?? 0, align: 'right' },
  { key: 'staffAssigned', header: 'Staff', type: 'number', accessor: (r) => r.staffAssigned ?? 0, sortValue: (r) => r.staffAssigned ?? 0, align: 'right' },
  { key: 'failureCost', header: 'Failure Cost', type: 'number', accessor: (r) => (r.failureCost ?? 0) > 0 ? <span className="text-destructive text-xs">${r.failureCost}</span> : '—', sortValue: (r) => r.failureCost ?? 0, align: 'right' },
  { key: 'lastDeviation', header: 'Last Deviation', type: 'date', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.lastDeviation}</span>, sortValue: (r) => r.lastDeviation ?? '' },
  { key: 'owner', header: 'Owner', type: 'enum', accessor: (r) => <span className="text-xs">{r.owner}</span>, sortValue: (r) => r.owner ?? '' },
];

export function RecurringPatternReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockRecurringPatterns.filter(r => {
    const matchesSearch = !search || r.patternName.toLowerCase().includes(search.toLowerCase());
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


  const avgAdherence = Math.round(filtered.reduce((s, r) => s + r.adherencePercent, 0) / (filtered.length || 1));
  const totalDeviations = filtered.reduce((s, r) => s + r.deviations, 0);
  const perfectPatterns = filtered.filter(r => r.adherencePercent === 100).length;
  const poorPatterns = filtered.filter(r => r.adherencePercent < 75).length;
  const totalExpected = filtered.reduce((s, r) => s + r.totalExpectedShifts, 0);
  const totalActual = filtered.reduce((s, r) => s + r.actualShifts, 0);
  const missedShifts = totalExpected - totalActual;

  // Deviation reason aggregation
  const reasonBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => r.deviationReasons.forEach(reason => { map[reason] = (map[reason] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count }));
  }, [filtered]);

  const reasonPie = reasonBreakdown.map(r => ({ name: r.reason, value: r.count }));
  const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--destructive))', '#10B981', '#8B5CF6', '#EC4899'];

  const chartData = filtered.map(r => ({
    name: r.patternName.length > 12 ? r.patternName.substring(0, 12) + '…' : r.patternName,
    expected: r.totalExpectedShifts,
    actual: r.actualShifts,
    adherence: r.adherencePercent,
  }));

  // Adherence buckets
  const adherenceBuckets = [
    { range: '95-100%', count: filtered.filter(r => r.adherencePercent >= 95).length, fill: '#10B981' },
    { range: '85-94%', count: filtered.filter(r => r.adherencePercent >= 85 && r.adherencePercent < 95).length, fill: '#22C55E' },
    { range: '75-84%', count: filtered.filter(r => r.adherencePercent >= 75 && r.adherencePercent < 85).length, fill: '#F59E0B' },
    { range: '<75%', count: filtered.filter(r => r.adherencePercent < 75).length, fill: 'hsl(var(--destructive))' },
  ].filter(b => b.count > 0);

  const insights = useMemo(() => {
    const result = [];
    if (perfectPatterns > 0) result.push({ type: 'positive' as const, title: `${perfectPatterns} patterns with 100% adherence`, description: `${Math.round(perfectPatterns / filtered.length * 100)}% of recurring patterns were followed exactly as configured. These represent stable, well-managed scheduling templates.`, metric: `${perfectPatterns} of ${filtered.length} patterns` });
    if (poorPatterns > 0) result.push({ type: 'negative' as const, title: `${poorPatterns} patterns below 75% adherence`, description: `These patterns are being significantly deviated from. Possible causes: outdated templates, frequent absences in pattern roles, or operational changes not reflected in templates.`, metric: `${missedShifts} shifts missed vs expected`, action: 'Review and update underperforming templates' });
    if (reasonBreakdown.length > 0) result.push({ type: 'neutral' as const, title: `Top deviation reason: ${reasonBreakdown[0].reason}`, description: `"${reasonBreakdown[0].reason}" accounts for ${reasonBreakdown[0].count} deviations (${Math.round(reasonBreakdown[0].count / totalDeviations * 100)}% of all). Addressing this root cause would have the greatest impact on adherence.`, action: `Implement mitigation strategies for ${reasonBreakdown[0].reason.toLowerCase()}` });
    if (missedShifts > 0) result.push({ type: 'action' as const, title: `${missedShifts} shifts below pattern expectations`, description: `Actual shifts fell short of recurring pattern expectations by ${missedShifts} shifts. Estimated cost impact: $${(missedShifts * 180).toLocaleString()} based on average shift value.`, metric: `${totalActual} actual vs ${totalExpected} expected` });
    return result;
  }, [filtered, perfectPatterns, poorPatterns, reasonBreakdown, totalDeviations, missedShifts, totalExpected, totalActual]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Recurring Pattern Adherence Report"
        reportDescription="Measures how closely actual scheduling follows configured recurring shift patterns/templates. Identifies template drift, highlights patterns needing updates, and quantifies scheduling consistency."
        purpose="To validate that recurring shift templates are being followed, identify why deviations occur, and ensure templates remain aligned with operational needs. High adherence reduces scheduling effort and improves predictability."
        whenToUse={[
          'After each roster period to measure template compliance',
          'When updating or creating new recurring shift patterns',
          'During scheduling process reviews to identify inefficiencies',
          'When staff report inconsistent or unpredictable schedules',
          'Before implementing auto-scheduling to verify template accuracy',
        ]}
        keyMetrics={[
          { label: 'Adherence %', description: 'Percentage of expected shifts from a recurring pattern that were actually scheduled. Calculated as (actual shifts / expected shifts) × 100.', interpretation: 'Below 75% means the pattern is effectively not being followed — consider redesigning it.', goodRange: '≥90%', warningRange: '75-89%', criticalRange: '<75%' },
          { label: 'Deviations', description: 'Count of individual instances where a pattern shift was modified, skipped, or replaced.', interpretation: 'Occasional deviations are normal (1-2 per pattern). Frequent deviations suggest the pattern is outdated.' },
          { label: 'Pattern Coverage', description: 'Ratio of actual to expected shifts across all patterns.', interpretation: 'Below 90% indicates systemic understaffing against template expectations.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Assess overall pattern health:\n• Avg Adherence: Team-wide template compliance\n• Perfect Patterns: Templates working exactly as designed\n• Poor Patterns (<75%): Templates needing urgent review\n• Missed Shifts: Gap between expected and actual' },
          { title: 'Expected vs Actual', content: 'Side-by-side bar chart comparing what the pattern calls for (grey) vs what was actually scheduled (blue). Large gaps indicate patterns that don\'t match operational reality.' },
          { title: 'Deviation Reasons', content: 'Pie chart showing the root causes of deviations. Concentrate improvement efforts on the top 1-2 reasons for maximum impact.' },
          { title: 'Pattern Detail Table', content: 'Each row is a recurring pattern with its adherence metrics. Patterns are colour-coded:\n• Green dot = ≥90% adherence\n• Amber dot = 75-89%\n• Red dot = <75% — needs review\n• Deviation reasons shown as tags for quick root cause identification' },
        ]}
        actionableInsights={[
          'Patterns below 75% adherence should be reviewed and either updated or retired',
          'If the top deviation reason is "absence" related, strengthen the substitute/cover system',
          'Compare adherence before and after template updates to validate improvements',
          'High-adherence patterns are candidates for auto-scheduling — low human intervention needed',
          'Track adherence trends over time to detect gradual template drift before it becomes critical',
        ]}
        relatedReports={['Schedule Fairness', 'Staff Utilisation', 'Coverage Gap Analysis']}
      />

      <ReportFilterBar title="Recurring Pattern Adherence Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search pattern..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Avg Adherence" value={`${avgAdherence}%`} icon={Target}
          variant={avgAdherence < 75 ? 'danger' : avgAdherence < 85 ? 'warning' : 'success'} sparklineData={[82, 85, 88, 84, 87, avgAdherence]} />
        <StatCard label="Perfect Patterns" value={perfectPatterns} icon={CheckCircle2}
          variant="success" subtitle={`of ${filtered.length} total`} />
        <StatCard label="Poor Patterns (<75%)" value={poorPatterns} icon={AlertTriangle}
          variant={poorPatterns > 0 ? 'danger' : 'success'} />
        <StatCard label="Total Deviations" value={totalDeviations} icon={RefreshCw}
          trend={{ value: -3, label: 'vs last period', isPositiveGood: false }} />
        <StatCard label="Active Patterns" value={filtered.length} icon={Layers} />
        <StatCard label="Missed Shifts" value={missedShifts} icon={BarChart3}
          variant={missedShifts > 5 ? 'warning' : 'default'} subtitle={`$${(missedShifts * 180).toLocaleString()} est. impact`} />
      </div>

      <SummaryRow items={[
        { label: 'Expected Shifts', value: totalExpected },
        { label: 'Actual Shifts', value: totalActual },
        { label: 'Pattern Coverage', value: `${Math.round((totalActual / (totalExpected || 1)) * 100)}%`, highlight: true },
        { label: 'Top Deviation Reason', value: reasonBreakdown[0]?.reason || 'None' },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Expected vs Actual Shifts</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expected" name="Expected" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Deviation Reasons</CardTitle></CardHeader>
          <CardContent>
            {reasonPie.length > 0 ? (
              <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={reasonPie} cursor="pointer" onClick={(_, index) => { const d = reasonPie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, percent }) => `${name.length > 10 ? name.substring(0, 10) + '…' : name} ${(percent * 100).toFixed(0)}%`}>
                    {reasonPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer></AnimatedChartWrapper>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No deviations recorded</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pattern Adherence Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} />
        </CardContent>
      </Card>
    </div>
  );
}
