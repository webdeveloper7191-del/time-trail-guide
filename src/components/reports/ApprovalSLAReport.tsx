import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockApprovalSLA } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Clock, Shield, AlertTriangle, CheckCircle2, Timer, Users } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


type ApprovalSLARecord = typeof mockApprovalSLA[0];

const exportColumns: ExportColumn[] = [
  { header: 'Approver', accessor: 'approverName' }, { header: 'Location', accessor: 'location' },
  { header: 'Total Approvals', accessor: 'totalApprovals' }, { header: 'Within SLA', accessor: 'withinSLA' },
  { header: 'Breached', accessor: 'breachedSLA' }, { header: 'Avg Turnaround (h)', accessor: 'avgTurnaroundHours' },
  { header: 'SLA Compliance %', accessor: 'slaCompliancePercent' }, { header: 'Tier', accessor: 'tier' },
];

const tableColumns: DataTableColumn<ApprovalSLARecord>[] = [
  { key: 'approverName', header: 'Approver', type: 'text', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.slaCompliancePercent >= 90 ? 'bg-emerald-500' : r.slaCompliancePercent >= 75 ? 'bg-amber-500' : 'bg-red-500')} />

      <span className="font-medium">{r.approverName}</span>
    </div>
  ), sortValue: (r) => r.approverName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="text-muted-foreground text-xs">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'tier', header: 'Tier', type: 'text', accessor: (r) => <Badge variant="outline" className="text-[10px]">Tier {r.tier}</Badge>, sortValue: (r) => r.tier },
  { key: 'totalApprovals', header: 'Total', type: 'number', accessor: (r) => r.totalApprovals, sortValue: (r) => r.totalApprovals, align: 'right' },
  { key: 'withinSLA', header: 'Within SLA', type: 'number', accessor: (r) => <span className="text-emerald-600">{r.withinSLA}</span>, sortValue: (r) => r.withinSLA, align: 'right' },
  { key: 'breachedSLA', header: 'Breached', type: 'number', align: 'right', sortValue: (r) => r.breachedSLA,
    accessor: (r) => r.breachedSLA > 0 ? <span className="text-destructive font-medium">{r.breachedSLA}</span> : <span className="text-muted-foreground">0</span> },
  { key: 'avgTurnaroundHours', header: 'Avg Turnaround', type: 'number', align: 'right', sortValue: (r) => r.avgTurnaroundHours,
    accessor: (r) => <span className={cn(r.avgTurnaroundHours > 24 ? 'text-destructive font-medium' : '')}>{r.avgTurnaroundHours}h</span> },
  { key: 'slaCompliancePercent', header: 'SLA Compliance', type: 'number', className: 'w-[150px]', sortValue: (r) => r.slaCompliancePercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', r.slaCompliancePercent >= 90 ? 'bg-emerald-500' : r.slaCompliancePercent >= 75 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${r.slaCompliancePercent}%` }} />
        </div>
        <span className={cn('text-xs font-mono w-10 text-right', r.slaCompliancePercent < 75 ? 'text-destructive font-bold' : '')}>{r.slaCompliancePercent}%</span>
      </div>
    ) },
  { key: 'pendingApprovals', header: 'Pending', type: 'number', accessor: (r) => (r.pendingApprovals ?? 0) > 0 ? <Badge variant="secondary" className="text-[10px]">{r.pendingApprovals}</Badge> : <span className="text-muted-foreground text-xs">0</span>, sortValue: (r) => r.pendingApprovals ?? 0, align: 'right' },
  { key: 'fastestTurnaroundHrs', header: 'Fastest', type: 'number', accessor: (r) => `${(r.fastestTurnaroundHrs ?? 0).toFixed(1)}h`, sortValue: (r) => r.fastestTurnaroundHrs ?? 0, align: 'right' },
  { key: 'slowestTurnaroundHrs', header: 'Slowest', type: 'number', accessor: (r) => `${(r.slowestTurnaroundHrs ?? 0).toFixed(1)}h`, sortValue: (r) => r.slowestTurnaroundHrs ?? 0, align: 'right' },
  { key: 'escalations', header: 'Escalations', type: 'number', accessor: (r) => (r.escalations ?? 0) > 0 ? <span className="text-amber-600 font-medium text-xs">{r.escalations}</span> : '—', sortValue: (r) => r.escalations ?? 0, align: 'right' },
  { key: 'rejectionRate', header: 'Reject %', type: 'number', accessor: (r) => `${r.rejectionRate ?? 0}%`, sortValue: (r) => r.rejectionRate ?? 0, align: 'right' },
];

export function ApprovalSLAReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = mockApprovalSLA.filter(r => !search || r.approverName.toLowerCase().includes(search.toLowerCase()));

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

  const avgCompliance = Math.round(filtered.reduce((s, r) => s + r.slaCompliancePercent, 0) / (filtered.length || 1));
  const totalBreached = filtered.reduce((s, r) => s + r.breachedSLA, 0);
  const totalApprovals = filtered.reduce((s, r) => s + r.totalApprovals, 0);
  const avgTurnaround = (filtered.reduce((s, r) => s + r.avgTurnaroundHours, 0) / (filtered.length || 1)).toFixed(1);
  const worstApprover = [...filtered].sort((a, b) => a.slaCompliancePercent - b.slaCompliancePercent)[0];
  const bestApprover = [...filtered].sort((a, b) => b.slaCompliancePercent - a.slaCompliancePercent)[0];

  const chartData = filtered.map(r => ({ name: r.approverName.split(' ')[0], withinSLA: r.withinSLA, breached: r.breachedSLA }));
  const complianceDist = [
    { name: 'Within SLA', value: filtered.reduce((s, r) => s + r.withinSLA, 0), fill: '#10B981' },
    { name: 'Breached', value: totalBreached, fill: 'hsl(var(--destructive))' },
  ];

  const insights = useMemo(() => {
    const result = [];
    if (totalBreached > 0) result.push({ type: 'negative' as const, title: `${totalBreached} SLA breaches this period`, description: `${totalBreached} timesheets were not approved within the SLA window, potentially delaying payroll processing. Each breach increases the risk of late or incorrect pay.`, metric: `${Math.round(totalBreached / totalApprovals * 100)}% breach rate`, action: 'Implement escalation triggers for approaching SLA deadlines' });
    if (worstApprover && worstApprover.slaCompliancePercent < 80) result.push({ type: 'action' as const, title: `Lowest compliance: ${worstApprover.approverName} at ${worstApprover.slaCompliancePercent}%`, description: `This approver's turnaround of ${worstApprover.avgTurnaroundHours}h is significantly above the SLA target. This may indicate excessive workload, lack of mobile approval access, or process confusion.`, action: 'Discuss approval workflow with this approver and offer support' });
    if (Number(avgTurnaround) > 12) result.push({ type: 'neutral' as const, title: `Average turnaround: ${avgTurnaround}h`, description: `The average time from timesheet submission to approval is ${avgTurnaround} hours. Target is under 8 hours for same-day payroll processing readiness.`, metric: `Target: <8h` });
    if (bestApprover && bestApprover.slaCompliancePercent >= 95) result.push({ type: 'positive' as const, title: `Best performer: ${bestApprover.approverName} at ${bestApprover.slaCompliancePercent}%`, description: `Consistently fast turnaround of ${bestApprover.avgTurnaroundHours}h. Their approval workflow could be used as a model for underperforming approvers.` });
    return result;
  }, [filtered, totalBreached, totalApprovals, worstApprover, bestApprover, avgTurnaround]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Approval SLA Report"
        reportDescription="Tracks timesheet approval turnaround times against SLA targets by approver, tier, and location. Identifies bottlenecks in the approval pipeline."
        purpose="To ensure timely timesheet approvals for accurate payroll processing, identify slow approvers, and optimise the multi-tier approval workflow."
        whenToUse={['Before payroll cut-off to identify pending bottlenecks', 'Monthly to review approver performance', 'When redesigning approval chains', 'During process improvement reviews']}
        keyMetrics={[
          { label: 'SLA Compliance %', description: 'Percentage of approvals completed within the defined SLA window (typically 24-48h).', interpretation: 'Below 90% indicates approval bottlenecks. Below 75% will consistently delay payroll.', goodRange: '≥90%', warningRange: '75-89%', criticalRange: '<75%' },
          { label: 'Average Turnaround', description: 'Mean time from timesheet submission to final approval, measured in hours.', interpretation: 'Target <8h for same-day processing capability.', goodRange: '≤8h', warningRange: '8-24h', criticalRange: '>24h' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'SLA health snapshot. Focus on breach count and average turnaround as leading indicators of payroll delays.' },
          { title: 'Approval Performance Chart', content: 'Stacked bars show within-SLA (green) vs breached (red) per approver. Tall red segments identify bottleneck approvers.' },
          { title: 'SLA Distribution', content: 'Pie chart showing overall compliance ratio. The goal is 100% green.' },
        ]}
        actionableInsights={['Enable mobile approval notifications to reduce turnaround time', 'Implement auto-escalation for timesheets approaching SLA deadline', 'Review tier assignments — overloaded approvers may need reassignment', 'Consider auto-approval rules for routine timesheets to reduce approval volume']}
        relatedReports={['Weekly Timesheet Summary', 'Timesheet Exception', 'Overtime by Location']}
      />

      <ReportFilterBar title="Approval SLA Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search approver..." exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Avg SLA Compliance" value={`${avgCompliance}%`} icon={Shield}
          variant={avgCompliance < 80 ? 'danger' : avgCompliance < 90 ? 'warning' : 'success'} sparklineData={[78, 82, 85, 88, avgCompliance]} />
        <StatCard label="SLA Breaches" value={totalBreached} icon={AlertTriangle} variant={totalBreached > 0 ? 'danger' : 'success'} />
        <StatCard label="Total Approvals" value={totalApprovals} icon={CheckCircle2} />
        <StatCard label="Avg Turnaround" value={`${avgTurnaround}h`} icon={Timer}
          variant={Number(avgTurnaround) > 24 ? 'danger' : Number(avgTurnaround) > 12 ? 'warning' : 'default'} subtitle="Target: <8h" />
        <StatCard label="Approvers" value={filtered.length} icon={Users} />
        <StatCard label="Fastest Approver" value={`${Math.min(...filtered.map(r => r.avgTurnaroundHours))}h`} icon={Clock} variant="success" />
      </div>

      <SummaryRow items={[
        { label: 'Breach Rate', value: `${Math.round(totalBreached / (totalApprovals || 1) * 100)}%`, highlight: totalBreached > 0 },
        { label: 'Best', value: bestApprover?.approverName.split(' ')[0] || 'N/A' },
        { label: 'Needs Improvement', value: worstApprover?.approverName.split(' ')[0] || 'N/A', highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">SLA Performance by Approver</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="withinSLA" name="Within SLA" fill="#10B981" stackId="a" />
                <Bar dataKey="breached" name="Breached" fill="hsl(var(--destructive))" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">SLA Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={complianceDist} cursor="pointer" onClick={(_, index) => { const d = complianceDist[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {complianceDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Approver SLA Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(_, i) => i} /></CardContent>
      </Card>
    </div>
  );
}
