import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockComplianceViolations, ComplianceViolationRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Type', accessor: 'violationType' }, { header: 'Severity', accessor: 'severity' },
  { header: 'Date', accessor: 'date' }, { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockComplianceViolations.map(r => r.locationName))];
const SEVERITY_COLORS = { critical: 'hsl(var(--destructive))', warning: '#F59E0B', info: 'hsl(var(--primary))' };

const tableColumns: DataTableColumn<ComplianceViolationRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'violationType', header: 'Type', type: 'number', accessor: (r) => r.violationType, sortValue: (r) => r.violationType },
  { key: 'severity', header: 'Severity', sortValue: (r) => r.severity === 'critical' ? 3 : r.severity === 'warning' ? 2 : 1,
    accessor: (r) => <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{r.severity}</Badge> },
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => r.date, sortValue: (r) => r.date },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'resolved' ? 'default' : r.status === 'acknowledged' ? 'secondary' : 'destructive'} className="text-xs">{r.status}</Badge> },
];

export function ComplianceViolationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockComplianceViolations.filter(r => {
    const matchesSearch = !search || r.violationType.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
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


  const openViolations = filtered.filter(r => r.status === 'open');
  const criticalCount = filtered.filter(r => r.severity === 'critical').length;
  const resolvedCount = filtered.filter(r => r.status === 'resolved').length;
  const acknowledgedCount = filtered.filter(r => r.status === 'acknowledged').length;
  const resolutionRate = filtered.length > 0 ? Math.round(resolvedCount / filtered.length * 100) : 0;
  const criticalOpen = filtered.filter(r => r.severity === 'critical' && r.status === 'open').length;

  // Violation types
  const violationTypes = [...new Set(filtered.map(r => r.violationType))];
  const byType = violationTypes.map(t => ({ name: t, count: filtered.filter(r => r.violationType === t).length })).sort((a, b) => b.count - a.count);

  const bySeverity = [
    { name: 'Critical', value: filtered.filter(r => r.severity === 'critical').length, fill: SEVERITY_COLORS.critical },
    { name: 'Warning', value: filtered.filter(r => r.severity === 'warning').length, fill: SEVERITY_COLORS.warning },
    { name: 'Info', value: filtered.filter(r => r.severity === 'info').length, fill: SEVERITY_COLORS.info },
  ];

  const byStatus = [
    { name: 'Open', value: openViolations.length, fill: 'hsl(var(--destructive))' },
    { name: 'Acknowledged', value: acknowledgedCount, fill: '#F59E0B' },
    { name: 'Resolved', value: resolvedCount, fill: '#10B981' },
  ];

  const byLocation = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return {
      name: loc.split(' ')[0],
      critical: items.filter(r => r.severity === 'critical').length,
      warning: items.filter(r => r.severity === 'warning').length,
      info: items.filter(r => r.severity === 'info').length,
    };
  });

  // Monthly trend
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = months.map((m, i) => ({
    name: m,
    violations: Math.max(1, Math.round(filtered.length / 6 * (0.8 + Math.random() * 0.4))),
    resolved: Math.max(0, Math.round(resolvedCount / 6 * (0.7 + Math.random() * 0.5))),
  }));

  const sparkline = [12, 15, 11, 9, 13, openViolations.length];

  const insights = useMemo(() => {
    const result: { type: 'positive' | 'negative' | 'action' | 'neutral'; title: string; description: string; metric?: string; action?: string }[] = [];
    if (criticalOpen > 0) {
      result.push({ type: 'negative', title: `${criticalOpen} Critical Violations Unresolved`, description: `Critical violations require immediate attention. These represent the highest regulatory risk and potential for penalties.`, metric: `${criticalOpen} critical open`, action: 'Escalate to compliance officer immediately' });
    }
    if (resolutionRate >= 80) {
      result.push({ type: 'positive', title: 'Strong Resolution Rate', description: `${resolutionRate}% of violations have been resolved, indicating effective compliance management processes.`, metric: `${resolvedCount} resolved` });
    } else {
      result.push({ type: 'action', title: 'Resolution Rate Below Target', description: `Only ${resolutionRate}% of violations resolved. Target is 80%+. ${openViolations.length} violations still require action.`, metric: `${openViolations.length} pending`, action: 'Review open violations and assign owners' });
    }
    const worstLocation = byLocation.reduce((worst, loc) => (loc.critical + loc.warning + loc.info) > (worst.critical + worst.warning + worst.info) ? loc : worst, byLocation[0]);
    if (worstLocation) {
      result.push({ type: 'neutral', title: `Highest Violation Location: ${worstLocation.name}`, description: `This location has ${worstLocation.critical + worstLocation.warning + worstLocation.info} total violations (${worstLocation.critical} critical). Consider targeted compliance training.`, action: 'Schedule compliance review for this location' });
    }
    if (byType.length > 0) {
      result.push({ type: 'action', title: `Most Common: ${byType[0].name}`, description: `"${byType[0].name}" accounts for ${byType[0].count} violations (${Math.round(byType[0].count / filtered.length * 100)}%). Addressing this category would have the highest impact.`, action: 'Implement preventive measures for this violation type' });
    }
    return result;
  }, [filtered, criticalOpen, resolutionRate, resolvedCount, openViolations, byLocation, byType]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Compliance Violation Summary" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search violations..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Compliance Violation Summary"
        reportDescription="Comprehensive tracking and analysis of all compliance violations across locations, categorised by severity, type, and resolution status. Supports regulatory reporting and continuous improvement initiatives."
        purpose="This report provides a centralised view of all compliance violations to help compliance officers and operations managers identify patterns, prioritise remediation, and demonstrate regulatory compliance. It tracks violations from detection through to resolution, supporting audit trails and improvement planning."
        whenToUse={[
          'During daily compliance checks to monitor open and critical violations',
          'Before regulatory inspections or audits to assess compliance posture',
          'During monthly compliance review meetings to track resolution progress',
          'When investigating patterns or recurring violations at specific locations',
          'To generate compliance reports for board or regulatory submissions',
        ]}
        keyMetrics={[
          { label: 'Open Violations', description: 'Count of violations not yet resolved or acknowledged.', interpretation: 'Should trend toward zero. Any open violation is a potential regulatory risk.', goodRange: '0', warningRange: '1-5', criticalRange: '> 5' },
          { label: 'Critical Violations', description: 'Violations classified as critical severity — highest regulatory risk.', interpretation: 'Critical violations may result in penalties, sanctions, or operational restrictions if not resolved promptly.', goodRange: '0', warningRange: '1-2', criticalRange: '> 2' },
          { label: 'Resolution Rate', description: 'Percentage of total violations that have been resolved.', interpretation: 'Higher is better. Track trend over time — declining rates indicate process issues.', goodRange: '> 80%', warningRange: '60-80%', criticalRange: '< 60%' },
          { label: 'Most Common Type', description: 'The violation type with the highest frequency.', interpretation: 'Recurring violations of the same type indicate systemic issues requiring process changes rather than individual remediation.' },
          { label: 'Worst Location', description: 'Location with the highest number of total violations.', interpretation: 'May indicate insufficient training, resources, or management attention at that location.' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'Six cards at the top provide an at-a-glance compliance status. Red-highlighted cards signal immediate attention areas. The sparkline shows the 6-month trend for open violations — downward trends are positive.' },
          { title: 'Severity & Status Pie Charts', content: 'The severity chart shows the proportion of critical vs warning vs info violations. The status chart shows resolution progress. A healthy chart has a large "Resolved" segment and small "Open" segment.' },
          { title: 'Violations by Location', content: 'Stacked bar chart showing total violations per location, split by severity. Locations with tall bars or significant critical (red) segments need priority attention.' },
          { title: 'Monthly Trend', content: 'Area chart showing new violations detected vs violations resolved over time. When the resolved line consistently exceeds the violation line, the organisation is reducing its compliance backlog.' },
          { title: 'Violation Type Breakdown', content: 'Horizontal bar chart ranking violation types by frequency. Focus improvement efforts on the top categories for maximum impact.' },
          { title: 'Detail Table', content: 'Full list of all violations with sorting and filtering. Sort by severity or status to prioritise your review. Export for audit documentation.' },
        ]}
        actionableInsights={[
          'Resolve all critical-severity open violations within 24 hours — these carry the highest regulatory risk',
          'If one violation type dominates, implement systematic prevention (training, process changes, automated checks)',
          'Locations with disproportionately high violation counts should receive targeted compliance audits',
          'Track resolution rate monthly — if declining, review staffing and accountability for compliance management',
          'Use this report alongside Staffing Ratio Compliance to identify if violations correlate with understaffing',
        ]}
        relatedReports={['Staffing Ratio Compliance (NQF)', 'Area Utilisation Report', 'Break Compliance Report', 'Overtime & Fatigue Risk']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Open Violations" value={openViolations.length} icon={ShieldAlert} variant={openViolations.length > 5 ? 'danger' : openViolations.length > 0 ? 'warning' : 'success'} sparklineData={sparkline}
          trend={{ value: -8, label: 'vs prior period', isPositiveGood: false }} />
        <StatCard label="Critical" value={criticalCount} icon={XCircle} variant={criticalCount > 0 ? 'danger' : 'success'} />
        <StatCard label="Warning" value={filtered.filter(r => r.severity === 'warning').length} icon={AlertTriangle} variant="warning" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} variant="success"
          trend={{ value: 12, label: 'vs prior period' }} />
        <StatCard label="Resolution Rate" value={`${resolutionRate}%`} icon={BarChart3} variant={resolutionRate >= 80 ? 'success' : resolutionRate >= 60 ? 'warning' : 'danger'}
          sparklineData={[65, 70, 72, 78, 75, resolutionRate]} />
        <StatCard label="Acknowledged" value={acknowledgedCount} icon={Clock} subtitle="Pending resolution" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
      </div>

      <SummaryRow items={[
        { label: 'Total Violations', value: filtered.length },
        { label: 'Locations Affected', value: new Set(filtered.map(r => r.locationName)).size },
        { label: 'Violation Types', value: violationTypes.length },
        { label: 'Critical Open', value: criticalOpen, highlight: criticalOpen > 0 },
        { label: 'Resolution Rate', value: `${resolutionRate}%`, highlight: true },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Severity</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bySeverity} cursor="pointer" onClick={(_, index) => { const d = bySeverity[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {bySeverity.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Status</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} cursor="pointer" onClick={(_, index) => { const d = byStatus[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Violation Types</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byType.slice(0, 6).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / (byType[0]?.count || 1)) * 100}%` }} />
                    </div>
                    <span className="font-medium w-6 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Violations by Location (Stacked by Severity)</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byLocation} onClick={(e: any) => { if (e?.activeLabel) applyDrill('category', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill="hsl(var(--destructive))" />
                <Bar dataKey="warning" name="Warning" stackId="a" fill="#F59E0B" />
                <Bar dataKey="info" name="Info" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Violation Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="violGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="violations" name="New Violations" stroke="hsl(var(--destructive))" fill="url(#violGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Violations — Full Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
