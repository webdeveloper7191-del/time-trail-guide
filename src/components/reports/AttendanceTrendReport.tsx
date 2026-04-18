import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAttendanceTrends } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingDown, AlertTriangle, CheckCircle2, Calendar, Heart } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type AttendanceTrendRecord = typeof mockAttendanceTrends[0];

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Scheduled', accessor: 'totalScheduled' },
  { header: 'Present', accessor: 'present' }, { header: 'Absent', accessor: 'absent' },
  { header: 'Late', accessor: 'late' }, { header: 'Attendance %', accessor: 'attendanceRate' },
];

const locations = [...new Set(mockAttendanceTrends.map(r => r.location))];

const tableColumns: DataTableColumn<AttendanceTrendRecord>[] = [
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'totalScheduled', header: 'Scheduled', type: 'number', accessor: (r) => r.totalScheduled, sortValue: (r) => r.totalScheduled, align: 'right' },
  { key: 'present', header: 'Present', type: 'text', accessor: (r) => <span className="text-emerald-600">{r.present}</span>, sortValue: (r) => r.present, align: 'right' },
  { key: 'absent', header: 'Absent', type: 'text', align: 'right', sortValue: (r) => r.absent,
    accessor: (r) => <span className={cn(r.absent > 2 ? 'text-destructive font-medium' : 'text-muted-foreground')}>{r.absent}</span> },
  { key: 'late', header: 'Late', type: 'text', align: 'right', sortValue: (r) => r.late,
    accessor: (r) => <span className={cn(r.late > 1 ? 'text-amber-600' : 'text-muted-foreground')}>{r.late}</span> },
  { key: 'attendanceRate', header: 'Rate', type: 'number', align: 'right', sortValue: (r) => r.attendanceRate,
    accessor: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.attendanceRate >= 95 ? 'bg-emerald-500' : r.attendanceRate >= 85 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${r.attendanceRate}%` }} />
        </div>
        <span className={cn('text-xs font-mono w-10', r.attendanceRate < 85 ? 'text-destructive font-bold' : '')}>{r.attendanceRate}%</span>
      </div>
    ) },
  { key: 'sick', header: 'Sick', type: 'text', accessor: (r) => r.absenceType.sick || '—', sortValue: (r) => r.absenceType.sick, align: 'right' },
  { key: 'noShow', header: 'No Show', type: 'text', align: 'right', sortValue: (r) => r.absenceType.noShow,
    accessor: (r) => r.absenceType.noShow > 0 ? <span className="text-destructive font-medium">{r.absenceType.noShow}</span> : <span className="text-muted-foreground">—</span> },
  { key: 'weekday', header: 'Day', type: 'enum', accessor: (r) => <Badge variant="outline" className="text-[10px]">{r.weekday}</Badge>, sortValue: (r) => r.weekday ?? '' },
  { key: 'area', header: 'Area', type: 'enum', accessor: (r) => r.area ?? '—', sortValue: (r) => r.area ?? '' },
  { key: 'fillRatePct', header: 'Fill %', type: 'number', accessor: (r) => <span className={cn('text-xs', (r.fillRatePct ?? 0) < 90 ? 'text-destructive font-medium' : '')}>{r.fillRatePct ?? 0}%</span>, sortValue: (r) => r.fillRatePct ?? 0, align: 'right' },
  { key: 'costOfAbsence', header: 'Absence Cost', type: 'number', accessor: (r) => (r.costOfAbsence ?? 0) > 0 ? `$${(r.costOfAbsence ?? 0).toLocaleString()}` : '—', sortValue: (r) => r.costOfAbsence ?? 0, align: 'right' },
  { key: 'forecastVariance', header: 'Forecast Δ', type: 'number', accessor: (r) => <span className={cn('text-xs font-mono', Math.abs(r.forecastVariance ?? 0) > 2 ? 'text-amber-600' : '')}>{(r.forecastVariance ?? 0) > 0 ? '+' : ''}{r.forecastVariance ?? 0}</span>, sortValue: (r) => r.forecastVariance ?? 0, align: 'right' },
];

export function AttendanceTrendReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockAttendanceTrends.filter(r => {
    const ms = !search || r.location.toLowerCase().includes(search.toLowerCase());
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


  const avgRate = Math.round(filtered.reduce((s, r) => s + r.attendanceRate, 0) / (filtered.length || 1));
  const totalAbsent = filtered.reduce((s, r) => s + r.absent, 0);
  const totalLate = filtered.reduce((s, r) => s + r.late, 0);
  const totalScheduled = filtered.reduce((s, r) => s + r.totalScheduled, 0);
  const noShows = filtered.reduce((s, r) => s + r.absenceType.noShow, 0);
  const sickDays = filtered.reduce((s, r) => s + r.absenceType.sick, 0);
  const estAbsentCost = totalAbsent * 280; // avg daily cost per absent employee

  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; rate: number; count: number; absent: number }> = {};
    filtered.forEach(r => {
      const key = r.date;
      if (!byDate[key]) byDate[key] = { date: format(parseISO(r.date), 'dd MMM'), rate: 0, count: 0, absent: 0 };
      byDate[key].rate += r.attendanceRate;
      byDate[key].count++;
      byDate[key].absent += r.absent;
    });
    return Object.values(byDate).map(d => ({ date: d.date, rate: Math.round(d.rate / d.count), absent: d.absent }));
  }, [filtered]);

  const absenceBreakdown = useMemo(() => {
    const totals = { sick: 0, annual: 0, personal: 0, noShow: 0 };
    filtered.forEach(r => {
      totals.sick += r.absenceType.sick;
      totals.annual += r.absenceType.annual;
      totals.personal += r.absenceType.personal;
      totals.noShow += r.absenceType.noShow;
    });
    return [
      { name: 'Sick', value: totals.sick, fill: '#F59E0B' },
      { name: 'Annual', value: totals.annual, fill: 'hsl(var(--primary))' },
      { name: 'Personal', value: totals.personal, fill: '#8B5CF6' },
      { name: 'No Show', value: totals.noShow, fill: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
  }, [filtered]);

  const insights = useMemo(() => {
    const result = [];
    if (avgRate < 90) result.push({ type: 'negative' as const, title: `Attendance rate at ${avgRate}% — below 90% benchmark`, description: `${totalAbsent} absences out of ${totalScheduled} scheduled shifts. Low attendance rates directly impact service delivery and force costly last-minute replacements.`, metric: `Est. cost: $${estAbsentCost.toLocaleString()}`, action: 'Investigate root causes and implement absence management program' });
    if (noShows > 0) result.push({ type: 'negative' as const, title: `${noShows} no-show incidents`, description: `No-shows are the most disruptive absence type — they provide zero notice for replacement. Each no-show requires emergency coverage at premium rates. Track individuals with multiple no-shows for formal management.`, action: 'Implement no-show escalation policy with progressive discipline' });
    if (sickDays > totalAbsent * 0.5) result.push({ type: 'neutral' as const, title: `Sick leave accounts for ${Math.round(sickDays / totalAbsent * 100)}% of absences`, description: `High sick leave rates may indicate workplace health issues, seasonal illness peaks, or potential policy concerns. Consider whether a wellness program would reduce sick leave frequency.`, metric: `${sickDays} sick days this period` });
    const lowDays = trendData.filter(d => d.rate < 85);
    if (lowDays.length > 0) result.push({ type: 'action' as const, title: `${lowDays.length} days with attendance below 85%`, description: `These critical low-attendance days likely required emergency coverage or reduced service levels. Analyse whether they correlate with specific events, weather, or seasonal patterns.`, action: 'Build contingency plans for predictable low-attendance periods' });
    return result;
  }, [filtered, avgRate, totalAbsent, totalScheduled, noShows, sickDays, estAbsentCost, trendData]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Attendance Trend Report"
        reportDescription="Analyses daily attendance patterns across locations, tracking absenteeism rates, absence types (sick, annual, personal, no-show), and identifying trends that impact operations."
        purpose="To monitor workforce attendance reliability, identify absenteeism patterns, quantify the operational and financial impact of absences, and support evidence-based absence management strategies."
        whenToUse={['Weekly to monitor attendance trends', 'During workforce planning and capacity reviews', 'When investigating service quality issues', 'For absence management reporting and proceedings']}
        keyMetrics={[
          { label: 'Attendance Rate', description: 'Percentage of scheduled staff who were present for their shift.', interpretation: 'Below 90% indicates significant staffing reliability issues.', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'No-Show Rate', description: 'Instances where staff failed to attend without prior notification.', interpretation: 'Any no-shows are concerning. Multiple no-shows from one individual requires formal management.' },
          { label: 'Absence Cost', description: 'Estimated financial impact of absences based on average daily employee cost + replacement cost premium.', interpretation: 'Use for ROI calculation on absence reduction initiatives.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Overall attendance health. Focus on rate trend, no-shows, and cost impact.' },
          { title: 'Attendance Trend Line', content: 'Shows daily attendance rate over time. Look for patterns: weekday vs weekend, seasonal dips, correlation with events.' },
          { title: 'Absence Type Breakdown', content: 'Pie chart showing reasons for absences. High no-show proportion is most concerning. High sick leave may indicate workplace issues.' },
          { title: 'Daily Detail Table', content: 'Each row is a day-location combination with full attendance breakdown. Visual gauges make low-attendance days immediately visible.' },
        ]}
        actionableInsights={['Implement return-to-work conversations for all unplanned absences', 'Track no-show individuals for pattern-based intervention', 'Correlate low-attendance days with external factors (weather, transport, events)', 'Consider wellness programs if sick leave exceeds industry benchmarks', 'Build overtime/agency contingency budget based on historical absence rates']}
        relatedReports={['Late Clock-In / Early Clock-Out', 'Coverage Gap Analysis', 'Overtime by Location', 'Weekly Timesheet Summary']}
      />

      <ReportFilterBar title="Attendance Trend Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search location..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Avg Attendance Rate" value={`${avgRate}%`} icon={CheckCircle2}
          variant={avgRate < 90 ? 'danger' : avgRate < 95 ? 'warning' : 'success'} sparklineData={trendData.map(d => d.rate)} />
        <StatCard label="Total Absences" value={totalAbsent} icon={Users} variant={totalAbsent > 10 ? 'warning' : 'default'} />
        <StatCard label="Late Arrivals" value={totalLate} icon={AlertTriangle} />
        <StatCard label="No Shows" value={noShows} icon={TrendingDown} variant={noShows > 0 ? 'danger' : 'success'} />
        <StatCard label="Sick Days" value={sickDays} icon={Heart} />
        <StatCard label="Est. Absence Cost" value={`$${(estAbsentCost / 1000).toFixed(1)}k`} icon={Calendar} subtitle={`${totalAbsent} × $280 avg`} />
      </div>

      <SummaryRow items={[
        { label: 'Total Scheduled', value: totalScheduled }, { label: 'Present', value: totalScheduled - totalAbsent },
        { label: 'Data Points', value: filtered.length },
        { label: 'Worst Day', value: trendData.length > 0 ? [...trendData].sort((a, b) => a.rate - b.rate)[0]?.date || 'N/A' : 'N/A', highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="rate" name="Attendance %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="absent" name="Absences" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Absence Type Breakdown</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={absenceBreakdown} cursor="pointer" onClick={(_, index) => { const d = absenceBreakdown[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {absenceBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Attendance Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
