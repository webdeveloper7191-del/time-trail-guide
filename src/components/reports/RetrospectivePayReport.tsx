import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockRetrospectivePay, RetrospectivePayRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Clock, AlertTriangle, CheckCircle2, FileText, TrendingUp } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  processed: 'default', approved: 'secondary', pending: 'secondary', rejected: 'destructive',
};
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(142, 76%, 36%)', 'hsl(var(--destructive))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'adjustmentType' }, { header: 'Original', accessor: 'originalAmount' },
  { header: 'Adjusted', accessor: 'adjustedAmount' }, { header: 'Difference', accessor: 'difference' },
  { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockRetrospectivePay.map(r => r.location))];

const tableColumns: DataTableColumn<RetrospectivePayRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'adjustmentType', header: 'Type', type: 'enum', sortValue: (r) => r.adjustmentType,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.adjustmentType.replace(/_/g, ' ')}</Badge> },
  { key: 'originalAmount', header: 'Original', type: 'number', accessor: (r) => `$${r.originalAmount.toLocaleString()}`, sortValue: (r) => r.originalAmount, align: 'right' },
  { key: 'adjustedAmount', header: 'Adjusted', type: 'number', accessor: (r) => `$${r.adjustedAmount.toLocaleString()}`, sortValue: (r) => r.adjustedAmount, align: 'right' },
  { key: 'difference', header: 'Difference', type: 'text', align: 'right', sortValue: (r) => r.difference,
    accessor: (r) => <span className="font-semibold text-emerald-600">+${r.difference.toLocaleString()}</span> },
  { key: 'effectiveFrom', header: 'Effective', type: 'text', accessor: (r) => r.effectiveFrom, sortValue: (r) => r.effectiveFrom },
  { key: 'status', header: 'Status', type: 'enum', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={STATUS_VARIANT[r.status]} className="text-xs">{r.status}</Badge> },
  { key: 'reason', header: 'Reason', type: 'text', accessor: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>, sortValue: (r) => r.reason },
  { key: 'department', header: 'Dept', type: 'enum', accessor: (r) => r.department ?? '—', sortValue: (r) => r.department ?? '' },
  { key: 'affectedShifts', header: 'Shifts Affected', type: 'number', accessor: (r) => r.affectedShifts ?? 0, sortValue: (r) => r.affectedShifts ?? 0, align: 'right' },
  { key: 'taxImpact', header: 'Tax Impact', type: 'number', accessor: (r) => `$${(r.taxImpact ?? 0).toLocaleString()}`, sortValue: (r) => r.taxImpact ?? 0, align: 'right' },
  { key: 'superImpact', header: 'Super Impact', type: 'number', accessor: (r) => `$${(r.superImpact ?? 0).toLocaleString()}`, sortValue: (r) => r.superImpact ?? 0, align: 'right' },
  { key: 'paymentDate', header: 'Payment Date', type: 'date', accessor: (r) => r.paymentDate ?? '—', sortValue: (r) => r.paymentDate ?? '' },
  { key: 'approvedBy', header: 'Approved By', type: 'enum', accessor: (r) => <span className="text-xs">{r.approvedBy}</span>, sortValue: (r) => r.approvedBy ?? '' },
];

export function RetrospectivePayReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockRetrospectivePay.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase());
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


  const totalAdjustment = filtered.reduce((s, r) => s + r.difference, 0);
  const pendingCount = filtered.filter(r => r.status === 'pending').length;
  const processedCount = filtered.filter(r => r.status === 'processed').length;
  const avgDifference = filtered.length ? Math.round(totalAdjustment / filtered.length) : 0;

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.adjustmentType] = (map[r.adjustmentType] || 0) + r.difference; });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [filtered]);

  const statusPie = [
    { name: 'Pending', value: pendingCount }, { name: 'Approved', value: filtered.filter(r => r.status === 'approved').length },
    { name: 'Processed', value: processedCount }, { name: 'Rejected', value: filtered.filter(r => r.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Retrospective Pay Adjustment Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Retrospective Pay Adjustment Report"
        reportDescription="Tracks all back-pay calculations and retrospective adjustments arising from rate changes, reclassifications, and correction errors."
        purpose="Ensures accurate remediation of historical pay discrepancies while maintaining audit trail compliance."
        whenToUse={[
          'After award rate increases to track back-pay processing', 'During payroll audits to verify historical corrections',
          'When staff raise pay queries about past periods', 'For financial forecasting of adjustment liabilities',
        ]}
        keyMetrics={[
          { label: 'Total Back-Pay', description: 'Sum of all positive adjustments owed', interpretation: 'Large totals may indicate systemic pay calculation issues requiring process review' },
          { label: 'Pending Approvals', description: 'Adjustments awaiting management approval', interpretation: 'Delays increase underpayment liability exposure. Target <48hr approval SLA', goodRange: '0', warningRange: '1-3', criticalRange: '>3' },
          { label: 'Avg Adjustment', description: 'Average back-pay per affected staff member', interpretation: 'High averages suggest significant rate discrepancies were missed initially' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows total liability, pending items needing action, and average adjustment size.' },
          { title: 'By Adjustment Type', content: 'Bar chart shows which categories of adjustments drive the most back-pay cost.' },
          { title: 'Status Distribution', content: 'Pie chart shows processing pipeline health. Large pending/approved slices indicate bottlenecks.' },
          { title: 'Detail Table', content: 'Sort by difference to find largest adjustments. Status badges track processing pipeline. Reasons provide audit context.' },
        ]}
        actionableInsights={[
          'Process all pending adjustments within 48 hours to minimise underpayment exposure',
          'If rate_change adjustments are common, review the rate update process for earlier detection',
          'Track adjustment frequency — increasing trends suggest systemic calculation issues',
          'Verify rejected adjustments have documented reasons for audit compliance',
        ]}
        relatedReports={['Pay Run Summary', 'Award Override Audit', 'Award Compliance Dashboard']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Back-Pay" value={`+$${totalAdjustment.toLocaleString()}`} icon={DollarSign} variant="success" size="sm" />
        <StatCard label="Adjustments" value={filtered.length} icon={FileText} size="sm" />
        <StatCard label="Avg Adjustment" value={`$${avgDifference.toLocaleString()}`} icon={TrendingUp} size="sm" />
        <StatCard label="Pending" value={pendingCount} icon={Clock} variant={pendingCount > 3 ? 'danger' : pendingCount > 0 ? 'warning' : 'success'} size="sm" />
        <StatCard label="Processed" value={processedCount} icon={CheckCircle2} variant="success" size="sm" />
        <StatCard label="Rejected" value={filtered.filter(r => r.status === 'rejected').length} icon={AlertTriangle} variant={filtered.some(r => r.status === 'rejected') ? 'danger' : 'default'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pendingCount > 0 && <InsightCard type="action" title={`${pendingCount} Pending Approval${pendingCount > 1 ? 's' : ''}`} description="Back-pay adjustments awaiting approval represent ongoing underpayment liability." action="Expedite approval within 48-hour SLA" />}
        {processedCount === filtered.length && <InsightCard type="positive" title="All Adjustments Processed" description="Every retrospective pay adjustment has been fully processed. No outstanding liabilities." />}
        {totalAdjustment > 1000 && <InsightCard type="neutral" title="Significant Liability" description={`$${totalAdjustment.toLocaleString()} in total adjustments. Review root causes to prevent future accumulation.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Total Back-Pay', value: `+$${totalAdjustment.toLocaleString()}`, highlight: true },
        { label: 'Pending', value: pendingCount }, { label: 'Processed', value: processedCount },
        { label: 'Avg Adjustment', value: `$${avgDifference}` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Adjustment Type</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byType} onClick={(e: any) => { if (e?.activeLabel) applyDrill('adjustmentType', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" name="Amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Adjustments</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} reportId="retrospective-pay" exportTitle="Retrospective Pay" /></CardContent>
      </Card>
    </div>
  );
}
