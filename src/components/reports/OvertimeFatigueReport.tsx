import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOvertimeFatigue, OvertimeFatigueRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { AlertTriangle, Shield, Clock, Users, Heart, Activity } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';


const riskColors: Record<string, string> = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const riskFills: Record<string, string> = { low: 'hsl(142, 76%, 36%)', medium: '#F59E0B', high: '#F97316', critical: 'hsl(var(--destructive))' };

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Weekly Hours', accessor: 'weeklyHours' }, { header: 'Max Hours', accessor: 'maxHours' },
  { header: 'Overtime', accessor: 'overtimeHours' }, { header: 'Consec. Days', accessor: 'consecutiveDays' },
  { header: 'Rest Hours', accessor: 'restHoursBetweenShifts' }, { header: 'Fatigue Score', accessor: 'fatigueScore' },
  { header: 'Risk Level', accessor: 'riskLevel' },
];

const locations = [...new Set(mockOvertimeFatigue.map(r => r.location))];

// Simulate 14-day fatigue trend
const fatigueTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  avgFatigue: Math.round(25 + i * 3.5 + Math.random() * 10),
  threshold: 70,
  critical: 85,
}));

const tableColumns: DataTableColumn<OvertimeFatigueRecord>[] = [
  { key: 'staffName', header: 'Staff Member', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.riskLevel === 'critical' ? 'bg-red-500 animate-pulse' : r.riskLevel === 'high' ? 'bg-orange-500' : r.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')} />

      <span className="font-medium">{r.staffName}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'weeklyHours', header: 'Weekly / Max', accessor: (r) => (
    <span className={cn('text-xs font-mono', r.weeklyHours > r.maxHours && 'text-destructive font-semibold')}>{r.weeklyHours}h / {r.maxHours}h</span>
  ), sortValue: (r) => r.weeklyHours, align: 'right' },
  { key: 'overtimeHours', header: 'Overtime', align: 'right', sortValue: (r) => r.overtimeHours,
    accessor: (r) => r.overtimeHours > 0 ? (
      <div>
        <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge>
        <span className="block text-[10px] text-destructive mt-0.5">${(r.overtimeHours * 48).toLocaleString()} cost</span>
      </div>
    ) : <span className="text-muted-foreground text-xs">—</span> },
  { key: 'consecutiveDays', header: 'Consec. Days', align: 'right', sortValue: (r) => r.consecutiveDays,
    accessor: (r) => (
      <span className={cn('text-xs', r.consecutiveDays >= 6 ? 'text-destructive font-bold' : r.consecutiveDays >= 5 ? 'text-amber-600 font-medium' : '')}>
        {r.consecutiveDays} {r.consecutiveDays >= 6 && '⚠'}
      </span>
    ) },
  { key: 'restHours', header: 'Min Rest', align: 'right', sortValue: (r) => r.restHoursBetweenShifts,
    accessor: (r) => (
      <span className={cn('text-xs', r.restHoursBetweenShifts < 10 ? 'text-destructive font-bold' : r.restHoursBetweenShifts < 12 ? 'text-amber-600' : 'text-emerald-600')}>
        {r.restHoursBetweenShifts}h {r.restHoursBetweenShifts < 10 && '✗'}
      </span>
    ) },
  { key: 'fatigueScore', header: 'Fatigue Score', align: 'right', sortValue: (r) => r.fatigueScore,
    accessor: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.fatigueScore >= 80 ? 'bg-red-500' : r.fatigueScore >= 60 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${r.fatigueScore}%` }} />
        </div>
        <span className="font-mono text-xs w-8 text-right">{r.fatigueScore}</span>
      </div>
    ) },
  { key: 'riskLevel', header: 'Risk Level', sortValue: (r) => ({ low: 0, medium: 1, high: 2, critical: 3 }[r.riskLevel]),
    accessor: (r) => <Badge className={cn('text-xs capitalize', riskColors[r.riskLevel])}>{r.riskLevel}</Badge> },
];

export function OvertimeFatigueReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => mockOvertimeFatigue.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

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


  const criticalCount = filtered.filter(r => r.riskLevel === 'critical').length;
  const highCount = filtered.filter(r => r.riskLevel === 'high').length;
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  const otCost = totalOT * 48;
  const avgFatigue = Math.round(filtered.reduce((s, r) => s + r.fatigueScore, 0) / (filtered.length || 1));
  const restViolations = filtered.filter(r => r.restHoursBetweenShifts < 10).length;
  const consecViolations = filtered.filter(r => r.consecutiveDays >= 6).length;

  const riskDistribution = [
    { name: 'Low', value: filtered.filter(r => r.riskLevel === 'low').length, fill: riskFills.low },
    { name: 'Medium', value: filtered.filter(r => r.riskLevel === 'medium').length, fill: riskFills.medium },
    { name: 'High', value: filtered.filter(r => r.riskLevel === 'high').length, fill: riskFills.high },
    { name: 'Critical', value: filtered.filter(r => r.riskLevel === 'critical').length, fill: riskFills.critical },
  ].filter(d => d.value > 0);

  const fatigueRadar = filtered.slice(0, 5).map(r => ({
    staff: r.staffName.split(' ')[0],
    overtime: Math.min(100, r.overtimeHours * 15),
    consecutive: Math.min(100, r.consecutiveDays * 15),
    restDeficit: Math.min(100, Math.max(0, (16 - r.restHoursBetweenShifts) * 10)),
    totalHours: Math.min(100, (r.weeklyHours / r.maxHours) * 100),
  }));

  const insights = useMemo(() => {
    const result = [];
    if (criticalCount > 0) result.push({ type: 'negative' as const, title: `${criticalCount} staff at CRITICAL fatigue risk`, description: `These staff members have fatigue scores above 80, indicating dangerous levels of accumulated fatigue. Immediate intervention required — continued scheduling increases workplace injury risk by 3x.`, metric: `Avg fatigue: ${avgFatigue}/100`, action: 'Remove from next 48h roster and schedule mandatory recovery break' });
    if (restViolations > 0) result.push({ type: 'negative' as const, title: `${restViolations} minimum rest violations`, description: `Staff are receiving less than 10 hours between shifts, violating minimum rest requirements under most Modern Awards. This is a compliance risk.`, metric: `${restViolations} of ${filtered.length} staff affected`, action: 'Adjust scheduling to ensure 10+ hour gaps between shifts' });
    if (consecViolations > 0) result.push({ type: 'action' as const, title: `${consecViolations} consecutive day violations`, description: `Staff working 6+ consecutive days without a rest day. Most Awards mandate a maximum of 5 consecutive days for full-time employees.`, action: 'Schedule a rest day within next 24 hours' });
    if (totalOT > 0) result.push({ type: 'neutral' as const, title: `$${otCost.toLocaleString()} overtime cost this period`, description: `${totalOT} hours of overtime at an average penalty rate of $48/hr. ${totalOT > 10 ? 'Consider whether additional permanent headcount would be more cost-effective.' : 'Within acceptable range for operational flexibility.'}`, metric: `${totalOT}h × $48/hr avg penalty rate` });
    return result;
  }, [filtered, criticalCount, restViolations, consecViolations, totalOT, avgFatigue, otCost]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Overtime & Fatigue Risk Report"
        reportDescription="A comprehensive risk assessment combining overtime hours, consecutive working days, minimum rest period compliance, and accumulated fatigue scoring to identify staff at risk of burnout, injury, or Award non-compliance."
        purpose="To protect staff wellbeing, ensure legal compliance with Australian Modern Award rest provisions, and control overtime costs. The fatigue scoring algorithm weighs multiple factors over a 14-day rolling window."
        whenToUse={[
          'Daily — to catch emerging fatigue risks before they become critical',
          'During roster building to validate planned schedules against fatigue thresholds',
          'After incidents to investigate whether fatigue was a contributing factor',
          'In WHS committee reviews as evidence of fatigue management',
          'When overtime spending exceeds budget to identify contributing staff patterns',
        ]}
        keyMetrics={[
          { label: 'Fatigue Score (0-100)', description: 'A composite score calculated from: hours worked (30%), consecutive days (25%), rest gaps (25%), and overtime accumulation (20%) over a rolling 14-day window.', interpretation: 'Scores above 70 indicate elevated risk. Above 85 triggers mandatory review under most fatigue management policies.', goodRange: '0-40 Low Risk', warningRange: '41-70 Moderate', criticalRange: '>70 High/Critical' },
          { label: 'Minimum Rest Hours', description: 'The shortest rest gap between consecutive shifts in the current period. Most Modern Awards require a minimum of 10 hours between shift end and next shift start.', interpretation: 'Below 10 hours is a compliance violation. Below 8 hours is a serious safety risk.', goodRange: '≥12 hours', warningRange: '10-11 hours', criticalRange: '<10 hours' },
          { label: 'Consecutive Days', description: 'Number of days worked without a full rest day (no scheduled work). Australian law and most Awards limit this to 5-6 days.', interpretation: '5 consecutive days is typical maximum for full-time. 6+ requires investigation and justification.', goodRange: '1-4 days', warningRange: '5 days', criticalRange: '6+ days' },
          { label: 'Overtime Cost', description: 'Overtime hours multiplied by applicable penalty rate (typically 1.5x for first 2 hours, 2x thereafter).', interpretation: 'Track against budget. Persistent overtime at one location may justify an additional hire.' },
        ]}
        howToRead={[
          { title: 'Risk Summary Cards', content: 'The top row provides an immediate risk snapshot:\n• Critical/High Risk count should ideally be ZERO\n• Overtime cost shows the financial impact\n• Rest violations are potential compliance breaches\n• Avg Fatigue Score should stay below 50 for a healthy workforce' },
          { title: 'Risk Distribution Pie Chart', content: 'Shows the proportion of staff at each risk level. A healthy distribution has 80%+ in Low/Medium. If Critical+High exceeds 20%, there is a systemic scheduling problem — not just individual cases.' },
          { title: 'Fatigue Score by Staff (Bar Chart)', content: 'Each bar represents one staff member\'s fatigue score, colour-coded by risk level. Compare heights to quickly identify outliers. Staff consistently at the top of this chart over multiple reporting periods need workload restructuring.' },
          { title: '14-Day Fatigue Trend', content: 'The line chart shows how average fatigue builds over the fortnight. A healthy pattern shows fatigue rising mid-week and resetting after weekends. A continuously rising trend without resets indicates insufficient recovery scheduling.' },
          { title: 'Staff Detail Table', content: 'Sorted by fatigue score (highest risk first). Key visual cues:\n• Pulsing red dot = Critical risk\n• Red overtime cost = Financial impact per staff member\n• ⚠ on consecutive days = Exceeds safe limit\n• ✗ on rest hours = Below legal minimum\n• Fatigue bar = Visual gauge of accumulated fatigue' },
        ]}
        actionableInsights={[
          'Any Critical risk staff should be removed from the next 48 hours of rosters immediately',
          'Rest violations under 10 hours must be corrected — this is a legal compliance requirement',
          'Compare overtime costs against the cost of a casual or agency shift to find the breakeven point',
          'Staff showing High risk for 3+ consecutive reporting periods need a structured workload review',
          'Use the radar chart to identify which factor (hours, consecutive days, rest gaps) is the primary driver per staff member',
        ]}
        relatedReports={['Staff Utilisation', 'Break Compliance', 'Attendance Trend', 'Approval SLA Report']}
      />

      <ReportFilterBar title="Overtime & Fatigue Risk Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Critical Risk" value={criticalCount} icon={AlertTriangle}
          variant={criticalCount > 0 ? 'danger' : 'success'} subtitle={criticalCount > 0 ? 'Immediate action needed' : 'No critical alerts'} />
        <StatCard label="High Risk" value={highCount} icon={Shield}
          variant={highCount > 0 ? 'warning' : 'default'} subtitle={`${highCount + criticalCount} staff need attention`} />
        <StatCard label="Total Overtime" value={`${totalOT}h`} icon={Clock}
          trend={{ value: -2, label: 'vs last period', isPositiveGood: false }} subtitle={`$${otCost.toLocaleString()} penalty cost`} />
        <StatCard label="Avg Fatigue Score" value={`${avgFatigue}/100`} icon={Activity}
          sparklineData={fatigueTrend.slice(-7).map(d => d.avgFatigue)} variant={avgFatigue > 60 ? 'warning' : 'default'} />
        <StatCard label="Rest Violations" value={restViolations} icon={Heart}
          variant={restViolations > 0 ? 'danger' : 'success'} subtitle="Below 10hr minimum" />
        <StatCard label="Consec. Day Violations" value={consecViolations} icon={Users}
          variant={consecViolations > 0 ? 'warning' : 'default'} subtitle="6+ days without rest" />
      </div>

      <SummaryRow items={[
        { label: 'Staff Monitored', value: filtered.length },
        { label: 'Compliance Rate', value: `${Math.round((filtered.length - restViolations - consecViolations) / (filtered.length || 1) * 100)}%`, highlight: true },
        { label: 'Avg Rest Gap', value: `${Math.round(filtered.reduce((s, r) => s + r.restHoursBetweenShifts, 0) / (filtered.length || 1))}h` },
        { label: 'Max Consec. Days', value: `${Math.max(...filtered.map(r => r.consecutiveDays), 0)}` },
      ]} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskDistribution} cursor="pointer" onClick={(_, index) => { const d = riskDistribution[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fatigue Score by Staff</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={filtered.map(r => ({ name: r.staffName.split(' ')[0], fatigue: r.fatigueScore, risk: r.riskLevel, overtime: r.overtimeHours }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="fatigue" name="Fatigue Score" radius={[4, 4, 0, 0]}>
                  {filtered.map((r, i) => <Cell key={i} fill={riskFills[r.riskLevel]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">14-Day Rolling Fatigue Trend</CardTitle></CardHeader>
        <CardContent>
          <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
            <LineChart data={fatigueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="avgFatigue" name="Avg Fatigue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="threshold" name="Warning (70)" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="critical" name="Critical (85)" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer></AnimatedChartWrapper>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Fatigue Risk Assessment Detail</CardTitle>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && <Badge variant="destructive" className="text-[10px]">{criticalCount} Critical</Badge>}
              {highCount > 0 && <Badge className="text-[10px] bg-orange-100 text-orange-700">{highCount} High</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={[...filtered].sort((a, b) => b.fatigueScore - a.fatigueScore)} rowKey={(r) => r.staffId} />
        </CardContent>
      </Card>
    </div>
  );
}
