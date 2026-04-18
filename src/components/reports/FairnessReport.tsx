import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockFairness, FairnessRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Scale, Users, AlertTriangle, TrendingDown, Star, BarChart3 } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Total Shifts', accessor: 'totalShifts' }, { header: 'Weekend', accessor: 'weekendShifts' },
  { header: 'Early', accessor: 'earlyShifts' }, { header: 'Late', accessor: 'lateShifts' },
  { header: 'Fairness Score', accessor: 'fairnessScore' }, { header: 'Deviation %', accessor: 'deviationFromAvg' },
];

const locations = [...new Set(mockFairness.map(r => r.location))];

const tableColumns: DataTableColumn<FairnessRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.fairnessScore >= 85 ? 'bg-emerald-500' : r.fairnessScore >= 70 ? 'bg-amber-500' : 'bg-red-500')} />

      <span className="font-medium">{r.staffName}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'totalShifts', header: 'Total', type: 'number', accessor: (r) => r.totalShifts, sortValue: (r) => r.totalShifts, align: 'right' },
  { key: 'weekendShifts', header: 'Weekend', type: 'text', accessor: (r) => (
    <span className={cn('text-xs', r.weekendShifts > 4 ? 'text-destructive font-medium' : '')}>{r.weekendShifts}</span>
  ), sortValue: (r) => r.weekendShifts, align: 'right' },
  { key: 'earlyShifts', header: 'Early', type: 'text', accessor: (r) => r.earlyShifts, sortValue: (r) => r.earlyShifts, align: 'right' },
  { key: 'lateShifts', header: 'Late', type: 'text', accessor: (r) => r.lateShifts, sortValue: (r) => r.lateShifts, align: 'right' },
  { key: 'fairnessScore', header: 'Fairness Score', type: 'number', className: 'w-[150px]', sortValue: (r) => r.fairnessScore,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.fairnessScore >= 85 ? 'bg-emerald-500' : r.fairnessScore >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${r.fairnessScore}%` }} />
        </div>
        <span className={cn('text-xs font-mono w-8 text-right', r.fairnessScore < 70 ? 'text-destructive font-bold' : '')}>{r.fairnessScore}</span>
      </div>
    ) },
  { key: 'deviationFromAvg', header: 'Deviation', type: 'number', align: 'right', sortValue: (r) => Math.abs(r.deviationFromAvg),
    accessor: (r) => (
      <span className={cn('font-medium text-xs', Math.abs(r.deviationFromAvg) > 15 ? 'text-destructive' : Math.abs(r.deviationFromAvg) > 10 ? 'text-amber-600' : 'text-muted-foreground')}>
        {r.deviationFromAvg > 0 ? '+' : ''}{r.deviationFromAvg}%
      </span>
    ) },
  { key: 'publicHolidayShifts', header: 'PH Shifts', type: 'number', accessor: (r) => r.publicHolidayShifts ?? 0, sortValue: (r) => r.publicHolidayShifts ?? 0, align: 'right' },
  { key: 'preferredShiftMatchPct', header: 'Pref Match %', type: 'number', accessor: (r) => `${r.preferredShiftMatchPct ?? 0}%`, sortValue: (r) => r.preferredShiftMatchPct ?? 0, align: 'right' },
  { key: 'swapsRequested', header: 'Swaps', type: 'number', accessor: (r) => (r.swapsRequested ?? 0) > 3 ? <span className="text-amber-600 font-medium text-xs">{r.swapsRequested}</span> : (r.swapsRequested ?? 0), sortValue: (r) => r.swapsRequested ?? 0, align: 'right' },
  { key: 'ranking', header: 'Rank', type: 'number', accessor: (r) => <Badge variant="outline" className="text-[10px]">#{r.ranking}</Badge>, sortValue: (r) => r.ranking ?? 0, align: 'center' },
  { key: 'lastReviewDate', header: 'Last Review', type: 'date', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.lastReviewDate}</span>, sortValue: (r) => r.lastReviewDate ?? '' },
  { key: 'fairnessScoreTrend', header: 'Score Trend (8wk)', type: 'sparkline', trendValues: (r: any) => r.fairnessScoreTrend ?? [], accessor: () => null },
];

export function FairnessReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockFairness.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
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


  const avgScore = Math.round(filtered.reduce((s, r) => s + r.fairnessScore, 0) / (filtered.length || 1));
  const belowThreshold = filtered.filter(r => r.fairnessScore < 70).length;
  const avgWeekend = (filtered.reduce((s, r) => s + r.weekendShifts, 0) / (filtered.length || 1)).toFixed(1);
  const maxDeviation = Math.max(...filtered.map(r => Math.abs(r.deviationFromAvg)), 0);
  const giniIndex = (() => {
    const shifts = filtered.map(r => r.totalShifts).sort((a, b) => a - b);
    const n = shifts.length;
    if (n === 0) return 0;
    const mean = shifts.reduce((s, v) => s + v, 0) / n;
    const sumDiffs = shifts.reduce((s, v, i) => s + (2 * (i + 1) - n - 1) * v, 0);
    return Math.round((sumDiffs / (n * n * mean)) * 100) / 100;
  })();
  const mostUnfair = [...filtered].sort((a, b) => a.fairnessScore - b.fairnessScore)[0];
  const weekendRange = { min: Math.min(...filtered.map(r => r.weekendShifts)), max: Math.max(...filtered.map(r => r.weekendShifts)) };

  const distributionData = filtered.map(r => ({ name: r.staffName.split(' ')[0], weekend: r.weekendShifts, early: r.earlyShifts, late: r.lateShifts, total: r.totalShifts }));

  // Radar for top 5 most/least fair
  const radarData = useMemo(() => {
    const avgTotal = filtered.reduce((s, r) => s + r.totalShifts, 0) / (filtered.length || 1);
    const avgWknd = filtered.reduce((s, r) => s + r.weekendShifts, 0) / (filtered.length || 1);
    const avgEarly = filtered.reduce((s, r) => s + r.earlyShifts, 0) / (filtered.length || 1);
    const avgLate = filtered.reduce((s, r) => s + r.lateShifts, 0) / (filtered.length || 1);
    return [
      { metric: 'Total', ideal: 50, ...Object.fromEntries(filtered.slice(0, 5).map(r => [r.staffName.split(' ')[0], Math.min(100, (r.totalShifts / avgTotal) * 50)])) },
      { metric: 'Weekend', ideal: 50, ...Object.fromEntries(filtered.slice(0, 5).map(r => [r.staffName.split(' ')[0], Math.min(100, (r.weekendShifts / (avgWknd || 1)) * 50)])) },
      { metric: 'Early', ideal: 50, ...Object.fromEntries(filtered.slice(0, 5).map(r => [r.staffName.split(' ')[0], Math.min(100, (r.earlyShifts / (avgEarly || 1)) * 50)])) },
      { metric: 'Late', ideal: 50, ...Object.fromEntries(filtered.slice(0, 5).map(r => [r.staffName.split(' ')[0], Math.min(100, (r.lateShifts / (avgLate || 1)) * 50)])) },
    ];
  }, [filtered]);

  // Score distribution buckets
  const scoreBuckets = useMemo(() => {
    const buckets = [
      { range: '90-100', count: 0, fill: '#10B981' },
      { range: '80-89', count: 0, fill: '#22C55E' },
      { range: '70-79', count: 0, fill: '#F59E0B' },
      { range: '60-69', count: 0, fill: '#F97316' },
      { range: '<60', count: 0, fill: 'hsl(var(--destructive))' },
    ];
    filtered.forEach(r => {
      if (r.fairnessScore >= 90) buckets[0].count++;
      else if (r.fairnessScore >= 80) buckets[1].count++;
      else if (r.fairnessScore >= 70) buckets[2].count++;
      else if (r.fairnessScore >= 60) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets.filter(b => b.count > 0);
  }, [filtered]);

  const insights = useMemo(() => {
    const result = [];
    if (belowThreshold > 0) result.push({ type: 'negative' as const, title: `${belowThreshold} staff below fairness threshold`, description: `These staff members have fairness scores below 70, indicating significantly unequal shift distribution. This can lead to burnout, resentment, and turnover.`, metric: `${Math.round(belowThreshold / filtered.length * 100)}% of workforce affected`, action: 'Review scheduling preferences and redistribute undesirable shifts' });
    if (weekendRange.max - weekendRange.min > 3) result.push({ type: 'action' as const, title: `Weekend shift gap: ${weekendRange.min}–${weekendRange.max} shifts`, description: `A ${weekendRange.max - weekendRange.min} shift spread in weekend assignments indicates inequitable distribution. The fairest allocation would have max 1-2 shift variation.`, action: 'Enable weekend rotation rules in the auto-scheduler' });
    if (giniIndex > 0.15) result.push({ type: 'neutral' as const, title: `Gini inequality index: ${giniIndex.toFixed(2)}`, description: `The Gini coefficient measures overall distribution inequality (0 = perfect equality, 1 = maximum inequality). Values above 0.15 warrant attention. Current distribution is ${giniIndex > 0.25 ? 'highly unequal' : 'moderately unequal'}.`, metric: `${giniIndex.toFixed(2)} (target: <0.10)` });
    if (mostUnfair) result.push({ type: 'negative' as const, title: `Most impacted: ${mostUnfair.staffName}`, description: `Fairness score of ${mostUnfair.fairnessScore}/100 with ${mostUnfair.deviationFromAvg > 0 ? '+' : ''}${mostUnfair.deviationFromAvg}% deviation from average. ${mostUnfair.weekendShifts > Number(avgWeekend) + 2 ? 'Disproportionately high weekend allocation.' : 'Significant shift count imbalance.'}`, action: 'Manually adjust next roster to compensate' });
    return result;
  }, [filtered, belowThreshold, weekendRange, giniIndex, mostUnfair, avgWeekend]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Schedule Fairness Report"
        reportDescription="Analyses the equity of shift distribution across staff, measuring fairness in total shifts, weekend assignments, and early/late shift allocation using a composite scoring algorithm."
        purpose="To ensure equitable workload distribution, prevent burnout from unbalanced scheduling, support staff satisfaction, and reduce turnover caused by perceived unfair treatment."
        whenToUse={[
          'After each roster period to audit distribution equity',
          'During performance reviews to validate workload balance claims',
          'When staff raise concerns about unfair scheduling',
          'Before implementing auto-scheduling to establish baseline fairness',
          'During union or enterprise agreement compliance reviews',
        ]}
        keyMetrics={[
          { label: 'Fairness Score (0-100)', description: 'Composite score using coefficient of variation across shift types. 100 = perfectly equal distribution relative to contracted hours. Factors: total shifts (40%), weekend (30%), early/late split (30%).', interpretation: 'Below 70 indicates significant inequity requiring manual intervention.', goodRange: '≥85', warningRange: '70-84', criticalRange: '<70' },
          { label: 'Deviation from Average', description: 'Percentage difference between individual total shifts and the team average. Accounts for different contracted hours.', interpretation: 'Deviations beyond ±15% are considered inequitable unless justified by contract type.', goodRange: '±5%', warningRange: '±5-15%', criticalRange: '>±15%' },
          { label: 'Gini Index', description: 'Statistical measure of overall distribution inequality (0-1). Adapted from economics to measure shift allocation equality.', interpretation: 'Below 0.10 is excellent equity. Above 0.25 indicates systemic distribution problems.', goodRange: '<0.10', warningRange: '0.10-0.20', criticalRange: '>0.20' },
        ]}
        howToRead={[
          { title: 'KPI Summary', content: 'Quick equity assessment:\n• Avg Score: Team-wide fairness level\n• Below Threshold: Staff needing immediate attention\n• Gini Index: Statistical inequality measure\n• Weekend Range: Spread in weekend assignments (smaller = fairer)' },
          { title: 'Score Distribution', content: 'Bar chart showing how many staff fall in each score bucket. A healthy distribution has most staff in 80-100. A bimodal distribution (some very high, some very low) indicates systematic favouritism.' },
          { title: 'Shift Type Distribution', content: 'Stacked bars show the mix of weekend, early, and late shifts per staff member. Ideally all bars should be similar height with similar colour proportions.' },
          { title: 'Staff Detail Table', content: 'Sorted by fairness score (lowest first). Visual cues:\n• Red dot = Score below 70\n• Coloured deviation = Distance from team average\n• Use this to identify specific rebalancing actions needed' },
        ]}
        actionableInsights={[
          'Staff below 70 should receive preferential shift selection in the next roster period',
          'Enable weekend rotation rules to automatically equalise weekend distribution',
          'Compare fairness scores before and after auto-scheduling to validate algorithm equity',
          'Consider individual preferences — some staff prefer weekends (factor into scoring)',
          'Track Gini index monthly to ensure scheduling changes are improving equity over time',
        ]}
        relatedReports={['Staff Utilisation', 'Overtime & Fatigue Risk', 'Recurring Pattern Adherence']}
      />

      <ReportFilterBar title="Schedule Fairness Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Avg Fairness Score" value={`${avgScore}/100`} icon={Scale}
          variant={avgScore < 70 ? 'danger' : avgScore < 80 ? 'warning' : 'success'} sparklineData={[72, 78, 75, 82, 80, avgScore]} />
        <StatCard label="Below Threshold (<70)" value={belowThreshold} icon={AlertTriangle}
          variant={belowThreshold > 0 ? 'danger' : 'success'} subtitle={belowThreshold > 0 ? 'Needs rebalancing' : 'All staff equitable'} />
        <StatCard label="Gini Index" value={giniIndex.toFixed(2)} icon={BarChart3}
          variant={giniIndex > 0.2 ? 'danger' : giniIndex > 0.1 ? 'warning' : 'success'} subtitle="0 = perfect equity" />
        <StatCard label="Avg Weekend Shifts" value={avgWeekend} icon={Users} subtitle={`Range: ${weekendRange.min}–${weekendRange.max}`} />
        <StatCard label="Max Deviation" value={`${maxDeviation}%`} icon={TrendingDown}
          variant={maxDeviation > 15 ? 'danger' : maxDeviation > 10 ? 'warning' : 'default'} />
        <StatCard label="Staff Assessed" value={filtered.length} icon={Star} />
      </div>

      <SummaryRow items={[
        { label: 'Most Fair', value: [...filtered].sort((a, b) => b.fairnessScore - a.fairnessScore)[0]?.staffName.split(' ')[0] || 'N/A' },
        { label: 'Least Fair', value: mostUnfair?.staffName.split(' ')[0] || 'N/A', highlight: true },
        { label: 'Total Weekend Shifts', value: filtered.reduce((s, r) => s + r.weekendShifts, 0) },
        { label: 'Equity Target Met', value: belowThreshold === 0 ? '✓ Yes' : '✗ No', highlight: belowThreshold > 0 },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreBuckets} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Staff Count" radius={[4, 4, 0, 0]}>
                  {scoreBuckets.map((b, i) => <Bar key={i} dataKey="count" fill={b.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Shift Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="weekend" name="Weekend" fill="hsl(var(--destructive))" stackId="a" opacity={0.8} />
                <Bar dataKey="early" name="Early" fill="hsl(var(--primary))" stackId="a" />
                <Bar dataKey="late" name="Late" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Shift Distribution Equity — Sorted by Fairness Score</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={[...filtered].sort((a, b) => a.fairnessScore - b.fairnessScore)} rowKey={(r) => r.staffId} reportId="fairness" exportTitle="Fairness & Equity" />
        </CardContent>
      </Card>
    </div>
  );
}
