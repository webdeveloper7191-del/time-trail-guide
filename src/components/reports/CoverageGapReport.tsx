import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCoverageGaps, CoverageGapRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, Shield, MapPin, Clock, Users, TrendingUp } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const severityColors: Record<string, string> = { minor: 'bg-emerald-100 text-emerald-700', moderate: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };
const severityFills: Record<string, string> = { minor: 'hsl(142, 76%, 36%)', moderate: '#F59E0B', critical: 'hsl(var(--destructive))' };

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Area', accessor: 'area' },
  { header: 'Time Slot', accessor: 'timeSlot' }, { header: 'Required', accessor: 'requiredStaff' },
  { header: 'Scheduled', accessor: 'scheduledStaff' }, { header: 'Gap', accessor: 'gap' },
  { header: 'Severity', accessor: 'gapSeverity' }, { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockCoverageGaps.map(r => r.location))];

const tableColumns: DataTableColumn<CoverageGapRecord>[] = [
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'area', header: 'Area', type: 'enum', accessor: (r) => <span className="font-medium">{r.area}</span>, sortValue: (r) => r.area },
  { key: 'timeSlot', header: 'Time Slot', type: 'text', accessor: (r) => <span className="text-xs font-mono">{r.timeSlot}</span>, sortValue: (r) => r.timeSlot },
  { key: 'requiredStaff', header: 'Required', type: 'text', accessor: (r) => r.requiredStaff, sortValue: (r) => r.requiredStaff, align: 'right' },
  { key: 'scheduledStaff', header: 'Scheduled', type: 'text', accessor: (r) => r.scheduledStaff, sortValue: (r) => r.scheduledStaff, align: 'right' },
  { key: 'gap', header: 'Gap', type: 'number', align: 'right', sortValue: (r) => r.gap,
    accessor: (r) => <span className={cn('font-semibold', r.gap > 0 ? 'text-destructive' : 'text-emerald-600')}>{r.gap > 0 ? `-${r.gap}` : '✓'}</span> },
  { key: 'gapSeverity', header: 'Severity', type: 'enum', sortValue: (r) => ({ minor: 0, moderate: 1, critical: 2 }[r.gapSeverity]),
    accessor: (r) => <Badge className={cn('text-xs capitalize', severityColors[r.gapSeverity])}>{r.gapSeverity}</Badge> },
  { key: 'reason', header: 'Reason', type: 'text', accessor: (r) => <span className="text-xs text-muted-foreground">{r.reason || '—'}</span>, sortValue: (r) => r.reason },
  { key: 'durationHours', header: 'Duration', type: 'number', accessor: (r) => `${r.durationHours ?? 0}h`, sortValue: (r) => r.durationHours ?? 0, align: 'right' },
  { key: 'estimatedCost', header: 'Est Cost', type: 'number', accessor: (r) => `$${(r.estimatedCost ?? 0).toLocaleString()}`, sortValue: (r) => r.estimatedCost ?? 0, align: 'right' },
  { key: 'ratioImpact', header: 'Ratio', type: 'enum', accessor: (r) => <span className="font-mono text-[11px]">{r.ratioImpact}</span>, sortValue: (r) => r.ratioImpact ?? '' },
  { key: 'resolution', header: 'Resolution', type: 'enum', accessor: (r) => <Badge variant={r.resolution === 'unfilled' ? 'destructive' : r.resolution === 'pending' ? 'secondary' : 'outline'} className="text-[10px] capitalize">{r.resolution}</Badge>, sortValue: (r) => r.resolution ?? '' },
  { key: 'notifiedAt', header: 'Notified', type: 'date', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.notifiedAt}</span>, sortValue: (r) => r.notifiedAt ?? '' },
];

export function CoverageGapReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockCoverageGaps.filter(r => {
    const matchesSearch = !search || r.area.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    const matchesSev = severityFilter === 'all' || r.gapSeverity === severityFilter;
    return matchesSearch && matchesLoc && matchesSev;
  }), dateRange), [search, locationFilter, severityFilter, dateRange]);

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


  const totalGaps = filtered.reduce((s, r) => s + r.gap, 0);
  const criticalGaps = filtered.filter(r => r.gapSeverity === 'critical');
  const affectedSlots = filtered.filter(r => r.gap > 0);
  const coverageRate = filtered.length > 0 ? Math.round(((filtered.length - affectedSlots.length) / filtered.length) * 100) : 100;
  const avgGapSize = affectedSlots.length > 0 ? (totalGaps / affectedSlots.length).toFixed(1) : '0';
  const estCostImpact = totalGaps * 45 * 4; // $45/hr * 4hr avg shift

  // Gaps by location
  const gapsByLocation = useMemo(() => {
    const map: Record<string, { critical: number; moderate: number; minor: number }> = {};
    filtered.forEach(r => {
      if (!map[r.location]) map[r.location] = { critical: 0, moderate: 0, minor: 0 };
      if (r.gap > 0) map[r.location][r.gapSeverity as keyof typeof map[string]]++;
    });
    return Object.entries(map).map(([loc, v]) => ({ name: loc.split(' ')[0], ...v }));
  }, [filtered]);

  // Severity distribution
  const severityDist = [
    { name: 'Critical', value: criticalGaps.length, fill: severityFills.critical },
    { name: 'Moderate', value: filtered.filter(r => r.gapSeverity === 'moderate' && r.gap > 0).length, fill: severityFills.moderate },
    { name: 'Minor', value: filtered.filter(r => r.gapSeverity === 'minor' && r.gap > 0).length, fill: severityFills.minor },
  ].filter(d => d.value > 0);

  // Time slot heat map data
  const timeSlotData = useMemo(() => {
    const slots: Record<string, number> = {};
    filtered.filter(r => r.gap > 0).forEach(r => { slots[r.timeSlot] = (slots[r.timeSlot] || 0) + r.gap; });
    return Object.entries(slots).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([slot, gap]) => ({ slot, gap }));
  }, [filtered]);

  // Reason breakdown
  const reasonData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(r => r.gap > 0 && r.reason).forEach(r => { map[r.reason] = (map[r.reason] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count }));
  }, [filtered]);

  const insights = useMemo(() => {
    const result = [];
    if (criticalGaps.length > 0) result.push({ type: 'negative' as const, title: `${criticalGaps.length} critical coverage gaps`, description: `Critical gaps represent situations where staffing falls below mandatory minimums. This may constitute a compliance violation under staffing ratio requirements.`, metric: `${totalGaps} total staff-slots unfilled`, action: 'Escalate to agency broadcast or authorise overtime immediately' });
    if (coverageRate < 90) result.push({ type: 'negative' as const, title: `Coverage rate at ${coverageRate}% — below 90% target`, description: `Only ${coverageRate}% of scheduled time slots have adequate staffing. Persistent low coverage indicates structural understaffing, not just absence-related gaps.`, action: 'Review headcount requirements and recruitment pipeline' });
    if (reasonData.length > 0) result.push({ type: 'neutral' as const, title: `Top gap reason: ${reasonData[0].reason}`, description: `"${reasonData[0].reason}" accounts for ${reasonData[0].count} of ${affectedSlots.length} gaps (${Math.round(reasonData[0].count / affectedSlots.length * 100)}%). Addressing the primary root cause would have the largest impact.`, action: `Focus mitigation efforts on ${reasonData[0].reason.toLowerCase()} management` });
    if (estCostImpact > 0) result.push({ type: 'action' as const, title: `Estimated gap cost: $${estCostImpact.toLocaleString()}`, description: `Based on ${totalGaps} unfilled staff-slots at an average 4-hour shift at $45/hr. This represents revenue risk from reduced service capacity and potential compliance penalties.`, metric: `${totalGaps} gaps × 4h × $45/hr` });
    return result;
  }, [filtered, criticalGaps, coverageRate, reasonData, totalGaps, affectedSlots, estCostImpact]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Coverage Gap Analysis"
        reportDescription="Identifies periods where scheduled staffing falls below required levels, classified by severity and root cause. Enables proactive gap management before they impact operations."
        purpose="To ensure adequate staffing coverage at all times by identifying, quantifying, and categorising coverage shortfalls. Supports compliance with mandatory staffing ratios and service level commitments."
        whenToUse={[
          'Daily during roster review to catch upcoming gaps before they occur',
          'After publishing a roster to validate coverage against requirements',
          'When investigating service quality complaints linked to understaffing',
          'During workforce planning to quantify additional headcount needs',
          'For compliance reporting on mandatory staffing ratio adherence',
        ]}
        keyMetrics={[
          { label: 'Coverage Rate', description: 'Percentage of time slots with adequate staffing (scheduled ≥ required).', interpretation: 'Below 90% indicates systemic understaffing. Below 80% requires urgent intervention.', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Gap Severity', description: 'Minor: 1 staff short, low-risk period. Moderate: 2+ short or during peak. Critical: Below legal minimum or during high-demand.', interpretation: 'Any critical gaps require immediate action — they may constitute regulatory violations.' },
          { label: 'Average Gap Size', description: 'Mean number of staff short across all affected time slots.', interpretation: 'Gap size >2 suggests the shortfall cannot be covered by overtime alone.' },
          { label: 'Estimated Cost Impact', description: 'Financial estimate of unfilled positions based on average shift duration and hourly rate.', interpretation: 'Use this to justify additional recruitment or agency spend.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Immediate risk snapshot:\n• Total Gaps: Sum of all staff-slot shortfalls\n• Critical Gaps: Require immediate escalation\n• Coverage Rate: Should be ≥95% for compliant operations\n• Est. Cost Impact: Financial risk from unfilled positions' },
          { title: 'Severity Distribution', content: 'The pie chart shows the breakdown of gaps by severity. A healthy operation has no critical gaps and minimal moderate gaps. If critical exceeds 10% of total gaps, there is a systemic issue.' },
          { title: 'Gaps by Location', content: 'Stacked bars show which locations have the most gaps by severity. Concentrate resolution efforts on locations with the most critical (red) gaps.' },
          { title: 'Peak Gap Time Slots', content: 'Shows which time slots have the most gaps. Use this to target recruitment and scheduling efforts at specific times of day.' },
          { title: 'Gap Detail Table', content: 'Each row is a specific time slot with a coverage shortfall. Look for patterns in area, time, and reason to identify systemic issues vs. one-off absences.' },
        ]}
        actionableInsights={[
          'Critical gaps should trigger automatic agency broadcast within 2 hours of detection',
          'Recurring gaps at the same time slot suggest a structural headcount deficit — not manageable through overtime alone',
          'Compare gap reasons to identify whether the primary driver is absences, leave, or insufficient base headcount',
          'Use time slot analysis to adjust shift start/end times to better align with demand peaks',
          'Track coverage rate over time — a declining trend signals growing workforce capacity problems',
        ]}
        relatedReports={['Open Shift Fill Rate', 'Staffing Ratio Compliance', 'Attendance Trend', 'Agency Usage']}
      />

      <ReportFilterBar title="Coverage Gap Analysis" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search area or reason..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange}>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </ReportFilterBar>

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Staff Gaps" value={totalGaps} icon={Users} variant={totalGaps > 5 ? 'danger' : 'default'} />
        <StatCard label="Critical Gaps" value={criticalGaps.length} icon={AlertTriangle} variant={criticalGaps.length > 0 ? 'danger' : 'success'} subtitle={criticalGaps.length > 0 ? 'Immediate action' : 'No critical gaps'} />
        <StatCard label="Affected Slots" value={affectedSlots.length} icon={Clock} subtitle={`of ${filtered.length} total slots`} />
        <StatCard label="Coverage Rate" value={`${coverageRate}%`} icon={Shield} variant={coverageRate < 90 ? 'danger' : coverageRate < 95 ? 'warning' : 'success'} sparklineData={[92, 88, 95, 90, 93, coverageRate]} />
        <StatCard label="Avg Gap Size" value={avgGapSize} icon={MapPin} subtitle="staff per gap" />
        <StatCard label="Est. Cost Impact" value={`$${(estCostImpact / 1000).toFixed(1)}k`} icon={TrendingUp} variant={estCostImpact > 5000 ? 'warning' : 'default'} />
      </div>

      <SummaryRow items={[
        { label: 'Locations Affected', value: new Set(affectedSlots.map(r => r.location)).size },
        { label: 'Areas Affected', value: new Set(affectedSlots.map(r => r.area)).size },
        { label: 'Most Affected Area', value: (() => { const c: Record<string, number> = {}; affectedSlots.forEach(r => c[r.area] = (c[r.area] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'; })(), highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Severity Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityDist} cursor="pointer" onClick={(_, index) => { const d = severityDist[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {severityDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gaps by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
              <BarChart data={gapsByLocation} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill={severityFills.critical} />
                <Bar dataKey="moderate" name="Moderate" stackId="a" fill={severityFills.moderate} />
                <Bar dataKey="minor" name="Minor" stackId="a" fill={severityFills.minor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Peak Gap Time Slots</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeSlotData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="slot" type="category" tick={{ fontSize: 9 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="gap" name="Staff Gaps" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Coverage Gap Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} />
        </CardContent>
      </Card>
    </div>
  );
}
