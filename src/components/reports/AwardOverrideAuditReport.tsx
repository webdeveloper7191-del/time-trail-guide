import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAwardOverrides, AwardOverrideRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, FileWarning, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Award', accessor: 'awardName' }, { header: 'Classification', accessor: 'classification' },
  { header: 'Original Rate', accessor: 'originalRate' }, { header: 'Override Rate', accessor: 'overrideRate' },
  { header: 'Approved By', accessor: 'approvedBy' }, { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockAwardOverrides.map(r => r.location))];

const tableColumns: DataTableColumn<AwardOverrideRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'awardName', header: 'Award', accessor: (r) => <span className="text-xs">{r.awardName}</span>, sortValue: (r) => r.awardName },
  { key: 'classification', header: 'Class.', accessor: (r) => <Badge variant="outline" className="text-xs">{r.classification}</Badge>, sortValue: (r) => r.classification },
  { key: 'originalRate', header: 'Original', accessor: (r) => `$${r.originalRate.toFixed(2)}/hr`, sortValue: (r) => r.originalRate, align: 'right' },
  { key: 'overrideRate', header: 'Override', sortValue: (r) => r.overrideRate, align: 'right',
    accessor: (r) => <span className={cn('font-semibold', r.overrideRate > r.originalRate ? 'text-emerald-600' : 'text-destructive')}>${r.overrideRate.toFixed(2)}/hr</span> },
  { key: 'variance', header: 'Variance', align: 'right', sortValue: (r) => r.overrideRate - r.originalRate,
    accessor: (r) => { const diff = r.overrideRate - r.originalRate; return <span className={cn('text-xs font-medium', diff > 0 ? 'text-emerald-600' : 'text-destructive')}>{diff > 0 ? '+' : ''}${diff.toFixed(2)}</span>; }},
  { key: 'overrideType', header: 'Type', sortValue: (r) => r.overrideType,
    accessor: (r) => <Badge variant={r.overrideType === 'increase' ? 'default' : r.overrideType === 'decrease' ? 'destructive' : 'secondary'} className="text-xs">{r.overrideType}</Badge> },
  { key: 'approvedBy', header: 'Approved By', accessor: (r) => r.approvedBy, sortValue: (r) => r.approvedBy },
  { key: 'approvedDate', header: 'Date', accessor: (r) => r.approvedDate, sortValue: (r) => r.approvedDate },
  { key: 'expiryDate', header: 'Expires', accessor: (r) => r.expiryDate || <span className="text-muted-foreground text-xs">Permanent</span>, sortValue: (r) => r.expiryDate || 'z' },
  { key: 'reason', header: 'Reason', accessor: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>, sortValue: (r) => r.reason },
];

export function AwardOverrideAuditReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockAwardOverrides.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.awardName.toLowerCase().includes(search.toLowerCase());
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


  const increases = filtered.filter(r => r.overrideType === 'increase');
  const decreases = filtered.filter(r => r.overrideType === 'decrease');
  const withExpiry = filtered.filter(r => r.expiryDate);
  const permanent = filtered.filter(r => !r.expiryDate);
  const totalCostImpact = filtered.reduce((s, r) => s + (r.overrideRate - r.originalRate) * 38 * 52, 0);
  const avgVariance = filtered.length ? (filtered.reduce((s, r) => s + (r.overrideRate - r.originalRate), 0) / filtered.length).toFixed(2) : '0';

  const typePie = [
    { name: 'Increase', value: increases.length }, { name: 'Decrease', value: decreases.length },
    { name: 'Custom', value: filtered.filter(r => r.overrideType === 'custom').length },
  ];

  const byApprover = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.approvedBy] = (map[r.approvedBy] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Award Rate Override Audit" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Award Rate Override Audit Report"
        reportDescription="Complete audit trail of all award rate overrides, showing who approved them, when, and the financial impact."
        purpose="Provides compliance transparency for rate overrides, ensuring all departures from standard award rates are documented, justified, and authorised."
        whenToUse={[
          'During Fair Work compliance audits', 'When reviewing override expiry dates',
          'For annual override review and renewal', 'When investigating pay discrepancies',
        ]}
        keyMetrics={[
          { label: 'Active Overrides', description: 'Currently effective rate overrides', interpretation: 'Each must have documented justification. Minimise where possible' },
          { label: 'Annual Cost Impact', description: 'Estimated yearly cost of all overrides at 38hr/week', interpretation: 'Positive = above-award payments. Large totals may need budget adjustment' },
          { label: 'Permanent vs Expiring', description: 'Overrides without vs with expiry dates', interpretation: 'Permanent overrides should be minimal — prefer time-limited overrides for flexibility' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows total overrides, split by type, cost impact estimate, and expiry status.' },
          { title: 'Override Type Distribution', content: 'Pie chart showing increases vs decreases. Decrease overrides may indicate compliance risks and should be rare.' },
          { title: 'By Approver', content: 'Bar chart showing which managers approved the most overrides. Concentrated approval authority may indicate governance gaps.' },
          { title: 'Detail Table', content: 'Full audit trail with original and override rates, variance, approver, and reason. Expiry column shows permanent vs time-limited.' },
        ]}
        actionableInsights={[
          'Review all permanent overrides annually — convert to time-limited where possible',
          'Decrease overrides below award minimums may create compliance liability — verify immediately',
          'If one approver has disproportionate overrides, review delegation of authority',
          'Calculate total cost impact and include in annual budget planning',
        ]}
        relatedReports={['Award Compliance Dashboard', 'Pay Run Summary', 'Retrospective Pay Adjustments']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Active Overrides" value={filtered.length} icon={FileWarning} size="sm" />
        <StatCard label="Rate Increases" value={increases.length} icon={TrendingUp} size="sm" />
        <StatCard label="Rate Decreases" value={decreases.length} icon={AlertTriangle} variant={decreases.length > 0 ? 'warning' : 'default'} size="sm" />
        <StatCard label="With Expiry" value={withExpiry.length} icon={Clock} size="sm" />
        <StatCard label="Permanent" value={permanent.length} icon={Shield} variant={permanent.length > filtered.length * 0.5 ? 'warning' : 'default'} size="sm" />
        <StatCard label="Annual Impact" value={`${totalCostImpact >= 0 ? '+' : ''}$${(totalCostImpact / 1000).toFixed(1)}k`} icon={DollarSign} variant={totalCostImpact > 50000 ? 'warning' : 'default'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {decreases.length > 0 && <InsightCard type="negative" title="Below-Award Overrides" description={`${decreases.length} overrides set rates below standard award. Verify these are legally compliant.`} action="Review decrease overrides with legal/HR" />}
        {permanent.length > filtered.length * 0.5 && <InsightCard type="action" title="High Permanent Override Ratio" description={`${Math.round(permanent.length / filtered.length * 100)}% of overrides are permanent. Consider adding expiry dates for better governance.`} action="Convert permanent overrides to time-limited" />}
        {filtered.length <= 5 && <InsightCard type="positive" title="Controlled Override Usage" description={`Only ${filtered.length} active overrides. Override governance is well-managed.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Total', value: filtered.length }, { label: 'Increases', value: increases.length, highlight: true },
        { label: 'Decreases', value: decreases.length }, { label: 'Avg Variance', value: `$${avgVariance}/hr` },
        { label: 'Permanent', value: permanent.length },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Override Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typePie.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overrides by Approver</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byApprover} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Overrides" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Overrides</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
