import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockBreakCompliance } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Shield, AlertTriangle, Clock, CheckCircle2, Coffee, Users } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type BreakComplianceRecord = typeof mockBreakCompliance[0];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Shift (h)', accessor: 'shiftDuration' }, { header: 'Required Break', accessor: (r: any) => `${r.requiredBreakMinutes}m` },
  { header: 'Actual Break', accessor: (r: any) => `${r.actualBreakMinutes}m` }, { header: 'Compliant', accessor: (r: any) => r.compliant ? 'Yes' : 'No' },
  { header: 'Violation', accessor: (r: any) => r.violation || '' },
];

const locations = [...new Set(mockBreakCompliance.map(r => r.location))];

const tableColumns: DataTableColumn<BreakComplianceRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.compliant ? 'bg-emerald-500' : 'bg-red-500')} />

      <span className="font-medium">{r.staffName}</span>
    </div>
  ), sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'date', header: 'Date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'shiftDuration', header: 'Shift', accessor: (r) => `${r.shiftDuration}h`, sortValue: (r) => r.shiftDuration, align: 'right' },
  { key: 'requiredBreakMinutes', header: 'Required', accessor: (r) => `${r.requiredBreakMinutes}m`, sortValue: (r) => r.requiredBreakMinutes, align: 'right' },
  { key: 'actualBreakMinutes', header: 'Actual', align: 'right', sortValue: (r) => r.actualBreakMinutes,
    accessor: (r) => <span className={cn('font-medium', !r.compliant ? 'text-destructive' : '')}>{r.actualBreakMinutes}m</span> },
  { key: 'breakTimings', header: 'Timings', accessor: (r) => <span className="text-xs text-muted-foreground font-mono">{r.breakTimings}</span>, sortValue: (r) => r.breakTimings },
  { key: 'compliant', header: 'Status', sortValue: (r) => r.compliant ? 1 : 0,
    accessor: (r) => r.compliant ? <Badge className="text-xs bg-emerald-100 text-emerald-700">Compliant</Badge> : <Badge className="text-xs bg-red-100 text-red-700">Violation</Badge> },
  { key: 'violation', header: 'Violation Detail', accessor: (r) => r.violation ? <span className="text-xs text-destructive">{r.violation}</span> : <span className="text-muted-foreground text-xs">—</span>, sortValue: (r) => r.violation || '' },
];

export function BreakComplianceReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockBreakCompliance.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }, dateRange)), [search, locationFilter, dateRange]);

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


  const compliant = filtered.filter(r => r.compliant).length;
  const violations = filtered.filter(r => !r.compliant).length;
  const complianceRate = filtered.length > 0 ? Math.round((compliant / filtered.length) * 100) : 0;
  const avgActualBreak = Math.round(filtered.reduce((s, r) => s + r.actualBreakMinutes, 0) / (filtered.length || 1));
  const avgRequiredBreak = Math.round(filtered.reduce((s, r) => s + r.requiredBreakMinutes, 0) / (filtered.length || 1));
  const breakDeficit = avgRequiredBreak - avgActualBreak;

  // Violations by type
  const violationTypes = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(r => !r.compliant && r.violation).forEach(r => { map[r.violation!] = (map[r.violation!] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ name: type, value: count }));
  }, [filtered]);

  // Repeat violators
  const repeatViolators = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(r => !r.compliant).forEach(r => { map[r.staffName] = (map[r.staffName] || 0) + 1; });
    return Object.entries(map).filter(([_, count]) => count >= 2).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const pieData = [{ name: 'Compliant', value: compliant, fill: '#10B981' }, { name: 'Violation', value: violations, fill: 'hsl(var(--destructive))' }];
  const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--destructive))', '#8B5CF6'];

  const insights = useMemo(() => {
    const result = [];
    if (complianceRate < 90) result.push({ type: 'negative' as const, title: `Break compliance at ${complianceRate}% — below 90% target`, description: `${violations} out of ${filtered.length} shifts had break violations. Under most Modern Awards, employers are obligated to provide breaks — non-compliance creates legal liability.`, metric: `${violations} violations`, action: 'Review break scheduling and implement automated reminders' });
    if (repeatViolators.length > 0) result.push({ type: 'negative' as const, title: `${repeatViolators.length} repeat break violators`, description: `Staff with multiple break violations: ${repeatViolators.map(v => `${v.name} (${v.count}×)`).join(', ')}. This may indicate workload issues preventing staff from taking breaks.`, action: 'Investigate whether workload or culture is preventing breaks' });
    if (breakDeficit > 5) result.push({ type: 'action' as const, title: `Average break deficit: ${breakDeficit} minutes`, description: `Staff are taking ${breakDeficit} fewer minutes of break than required on average. This accumulates to ${Math.round(breakDeficit * filtered.length / 60)}h of missing break time across the period.`, metric: `${avgActualBreak}m actual vs ${avgRequiredBreak}m required` });
    if (complianceRate >= 95) result.push({ type: 'positive' as const, title: `Strong break compliance at ${complianceRate}%`, description: `Most shifts are meeting break requirements. Continue monitoring to maintain this standard.` });
    return result;
  }, [filtered, complianceRate, violations, repeatViolators, breakDeficit, avgActualBreak, avgRequiredBreak]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Break Compliance Report"
        reportDescription="Audits break duration and timing against legal requirements and Award provisions. Identifies violations, patterns, and staff consistently missing their entitled breaks."
        purpose="To ensure legal compliance with break entitlements under Australian Modern Awards and WHS legislation. Break violations create liability and increase fatigue risk."
        whenToUse={['Weekly to monitor ongoing compliance', 'During WHS audits and investigations', 'When staff report being unable to take breaks', 'Before FairWork compliance reviews']}
        keyMetrics={[
          { label: 'Compliance Rate', description: 'Percentage of shifts where actual break meets or exceeds the minimum required break.', interpretation: 'Below 90% indicates systemic issues. Below 80% is a serious compliance risk.', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Break Deficit', description: 'Difference between average required and actual break minutes.', interpretation: 'Any deficit means staff are not receiving their full entitlement.', goodRange: '0 min', warningRange: '1-5 min', criticalRange: '>5 min' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Immediate compliance snapshot. Focus on compliance rate and repeat violators — these drive legal risk.' },
          { title: 'Compliance Pie Chart', content: 'Visual ratio of compliant vs non-compliant shifts. Any red segment warrants investigation.' },
          { title: 'Break Duration Comparison', content: 'Bar chart comparing required vs actual break per staff. Staff consistently under the required line need workload review.' },
        ]}
        actionableInsights={['Repeat violators may need workload adjustment, not disciplinary action', 'Implement automated break reminders via the scheduling system', 'Long shifts (>8h) have higher violation rates — ensure adequate coverage for break relief', 'Track compliance by location to identify management practice differences']}
        relatedReports={['Overtime & Fatigue Risk', 'Weekly Timesheet Summary', 'Attendance Trend']}
      />

      <ReportFilterBar title="Break Compliance Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Compliance Rate" value={`${complianceRate}%`} icon={Shield}
          variant={complianceRate < 90 ? 'danger' : complianceRate < 95 ? 'warning' : 'success'} sparklineData={[88, 92, 90, 94, complianceRate]} />
        <StatCard label="Compliant Shifts" value={compliant} icon={CheckCircle2} variant="success" />
        <StatCard label="Violations" value={violations} icon={AlertTriangle} variant={violations > 0 ? 'danger' : 'success'} />
        <StatCard label="Avg Actual Break" value={`${avgActualBreak}m`} icon={Coffee} subtitle={`Required: ${avgRequiredBreak}m`} />
        <StatCard label="Break Deficit" value={`${breakDeficit}m`} icon={Clock} variant={breakDeficit > 5 ? 'warning' : 'default'} />
        <StatCard label="Repeat Violators" value={repeatViolators.length} icon={Users} variant={repeatViolators.length > 0 ? 'danger' : 'default'} />
      </div>

      <SummaryRow items={[
        { label: 'Shifts Assessed', value: filtered.length },
        { label: 'Total Break Deficit', value: `${Math.round(breakDeficit * filtered.length)}m` },
        { label: 'Violation Types', value: violationTypes.length },
        { label: 'Top Violation', value: violationTypes[0]?.name || 'None', highlight: violationTypes.length > 0 },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance Overview</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cursor="pointer" onClick={(_, index) => { const d = pieData[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Break Duration: Required vs Actual</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <BarChart data={filtered.map(r => ({ name: r.staffName.split(' ')[0], required: r.requiredBreakMinutes, actual: r.actualBreakMinutes }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="required" name="Required" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Break Compliance Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
