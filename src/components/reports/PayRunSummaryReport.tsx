import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockPayRunRecords, PayRunRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, AlertTriangle, Banknote, Clock } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Role', accessor: 'role' }, { header: 'Contract', accessor: 'contractType' },
  { header: 'Regular Hrs', accessor: 'regularHours' }, { header: 'OT Hrs', accessor: 'overtimeHours' },
  { header: 'Base Pay', accessor: 'basePay' }, { header: 'Total Gross', accessor: 'totalGross' },
];

const locations = [...new Set(mockPayRunRecords.map(r => r.location))];

const tableColumns: DataTableColumn<PayRunRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <div><span className="font-medium">{r.staffName}</span><span className="block text-[10px] text-muted-foreground">{r.staffId}</span></div>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'role', header: 'Role', type: 'enum', accessor: (r) => <Badge variant="outline" className="text-xs">{r.role}</Badge>, sortValue: (r) => r.role },
  { key: 'contractType', header: 'Contract', type: 'enum', sortValue: (r) => r.contractType,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.contractType.replace('_', ' ')}</Badge> },
  { key: 'regularHours', header: 'Reg Hrs', type: 'number', accessor: (r) => <span className="font-mono text-xs">{r.regularHours}h</span>, sortValue: (r) => r.regularHours, align: 'right' },
  { key: 'overtimeHours', header: 'OT Hrs', type: 'number', sortValue: (r) => r.overtimeHours, align: 'right',
    accessor: (r) => r.overtimeHours > 0 ? <span className="text-destructive font-medium text-xs">{r.overtimeHours}h</span> : <span className="text-muted-foreground text-xs">—</span> },
  { key: 'basePay', header: 'Base Pay', type: 'number', accessor: (r) => `$${r.basePay.toLocaleString()}`, sortValue: (r) => r.basePay, align: 'right' },
  { key: 'overtimePay', header: 'OT Pay', type: 'number', accessor: (r) => r.overtimePay > 0 ? `$${r.overtimePay.toLocaleString()}` : '—', sortValue: (r) => r.overtimePay, align: 'right' },
  { key: 'allowances', header: 'Allow.', type: 'number', accessor: (r) => r.allowances > 0 ? `$${r.allowances}` : '—', sortValue: (r) => r.allowances, align: 'right' },
  { key: 'superannuation', header: 'Super', type: 'number', accessor: (r) => `$${r.superannuation.toLocaleString()}`, sortValue: (r) => r.superannuation, align: 'right' },
  { key: 'totalGross', header: 'Total Gross', type: 'number', accessor: (r) => <span className="font-semibold">${r.totalGross.toLocaleString()}</span>, sortValue: (r) => r.totalGross, align: 'right' },
  { key: 'taxWithheld', header: 'Tax', type: 'number', accessor: (r) => `$${(r.taxWithheld ?? 0).toLocaleString()}`, sortValue: (r) => r.taxWithheld ?? 0, align: 'right' },
  { key: 'netPay', header: 'Net Pay', type: 'number', accessor: (r) => <span className="font-semibold text-foreground">${(r.netPay ?? 0).toLocaleString()}</span>, sortValue: (r) => r.netPay ?? 0, align: 'right' },
  { key: 'ytdGross', header: 'YTD Gross', type: 'number', accessor: (r) => `$${((r.ytdGross ?? 0) / 1000).toFixed(1)}k`, sortValue: (r) => r.ytdGross ?? 0, align: 'right' },
  { key: 'ytdSuper', header: 'YTD Super', type: 'number', accessor: (r) => `$${((r.ytdSuper ?? 0) / 1000).toFixed(1)}k`, sortValue: (r) => r.ytdSuper ?? 0, align: 'right' },
  { key: 'bankAccount', header: 'Bank A/C', type: 'text', accessor: (r) => <span className="font-mono text-[10px] text-muted-foreground">{r.bankAccount}</span>, sortValue: (r) => r.bankAccount ?? '' },
  { key: 'payrollDate', header: 'Pay Date', type: 'date', accessor: (r) => r.payrollDate ?? '—', sortValue: (r) => r.payrollDate ?? '' },
  { key: 'grossTrend', header: 'Gross Trend (8wk)', type: 'sparkline', trendValues: (r) => r.grossTrend ?? [], accessor: () => null },
];

export function PayRunSummaryReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockPayRunRecords.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
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


  const totalGross = filtered.reduce((s, r) => s + r.totalGross, 0);
  const totalBase = filtered.reduce((s, r) => s + r.basePay, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimePay, 0);
  const totalHours = filtered.reduce((s, r) => s + r.regularHours + r.overtimeHours, 0);
  const avgGross = filtered.length ? Math.round(totalGross / filtered.length) : 0;
  const staffWithOT = filtered.filter(r => r.overtimeHours > 0).length;
  const otPct = totalGross > 0 ? ((totalOT / totalGross) * 100).toFixed(1) : '0';

  const byContract = ['full_time', 'part_time', 'casual', 'contractor'].map(ct => ({
    name: ct.replace('_', ' '), value: filtered.filter(r => r.contractType === ct).reduce((s, r) => s + r.totalGross, 0),
  }));

  const byLocation = locations.map(loc => {
    const items = filtered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], gross: items.reduce((s, r) => s + r.totalGross, 0), count: items.length };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Pay Run Summary Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Pay Run Summary Report"
        reportDescription="Detailed breakdown of the current pay run showing every staff member's earnings, hours, and pay components."
        purpose="Provides complete pay run transparency for verification, approval, and audit purposes before finalising payroll."
        whenToUse={[
          'Before approving each pay run for processing', 'When staff query their pay amounts',
          'During payroll reconciliation with accounting', 'For auditing individual pay calculations',
        ]}
        keyMetrics={[
          { label: 'Total Gross', description: 'Sum of all pay components for this pay period', interpretation: 'Compare against previous pay runs to detect anomalies' },
          { label: 'Avg Gross/Staff', description: 'Total Gross ÷ Staff Count', interpretation: 'Significant deviation from normal suggests data entry errors or unusual OT' },
          { label: 'OT %', description: 'Overtime pay as percentage of total gross', interpretation: 'Above 10% warrants investigation into scheduling efficiency', goodRange: '<8%', warningRange: '8-12%', criticalRange: '>12%' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows pay run totals and key ratios. Variance from normal pay run values is highlighted.' },
          { title: 'Cost by Contract Type', content: 'Pie chart shows where pay dollars are going by employment type. Useful for workforce cost modelling.' },
          { title: 'Cost by Location', content: 'Bar chart compares total gross by location with staff counts for cost-per-head analysis.' },
          { title: 'Detail Table', content: 'Full line-by-line breakdown. Sort by Total Gross to find highest-cost staff. OT hours in red flag overtime.' },
        ]}
        actionableInsights={[
          'Review any staff with gross pay >20% above their usual — may indicate data errors',
          'Staff with high OT should have shifts redistributed next roster cycle',
          'Verify allowances are correctly applied per award conditions',
          'Cross-check superannuation calculations against the 11.5% rate',
        ]}
        relatedReports={['Payroll Cost Dashboard', 'Allowance & Penalty Breakdown', 'Overtime by Location']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Gross" value={`$${(totalGross / 1000).toFixed(1)}k`} icon={DollarSign} size="sm" />
        <StatCard label="Staff Paid" value={filtered.length} icon={Users} size="sm" />
        <StatCard label="Avg Gross/Staff" value={`$${avgGross.toLocaleString()}`} icon={Banknote} size="sm" />
        <StatCard label="Total Hours" value={`${totalHours}h`} icon={Clock} size="sm" />
        <StatCard label="Staff with OT" value={staffWithOT} icon={AlertTriangle} variant={staffWithOT > filtered.length * 0.3 ? 'warning' : 'default'} size="sm" />
        <StatCard label="OT as % Gross" value={`${otPct}%`} icon={TrendingUp} variant={Number(otPct) > 12 ? 'danger' : Number(otPct) > 8 ? 'warning' : 'success'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {staffWithOT > filtered.length * 0.3 && <InsightCard type="action" title="Widespread Overtime" description={`${Math.round(staffWithOT / filtered.length * 100)}% of staff worked overtime. Consider hiring to reduce OT dependency.`} action="Review scheduling for next period" />}
        {Number(otPct) <= 8 && <InsightCard type="positive" title="Efficient Pay Run" description={`Overtime at ${otPct}% of gross is within the healthy range. Pay structure is well-balanced.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Base Pay', value: `$${(totalBase / 1000).toFixed(0)}k`, highlight: true }, { label: 'OT Pay', value: `$${(totalOT / 1000).toFixed(1)}k` },
        { label: 'Total Hours', value: `${totalHours}h` }, { label: 'Pay Period', value: filtered[0]?.payPeriod || '—' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Contract Type</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byContract.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byContract.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gross Pay by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byLocation} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="gross" name="Gross Pay" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pay Run Detail — {filtered[0]?.payPeriod}</CardTitle></CardHeader>
        <CardContent><ReportDataTable reportId="pay-run-summary" key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
