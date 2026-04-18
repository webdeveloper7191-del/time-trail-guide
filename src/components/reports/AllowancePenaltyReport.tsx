import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAllowancePenalties, AllowancePenaltyRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Award, Banknote, FileText } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange, computePeriodDelta } from '@/lib/reportDateFilter';
import { PeriodComparisonBar } from './PeriodComparisonBar';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'type' }, { header: 'Category', accessor: 'category' },
  { header: 'Hours', accessor: 'hours' }, { header: 'Rate', accessor: 'rate' },
  { header: 'Amount', accessor: 'amount' }, { header: 'Award', accessor: 'awardReference' },
];

const locations = [...new Set(mockAllowancePenalties.map(r => r.location))];

const tableColumns: DataTableColumn<AllowancePenaltyRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'type', header: 'Type', type: 'enum', sortValue: (r) => r.type,
    accessor: (r) => <Badge variant={r.type === 'penalty' ? 'destructive' : 'default'} className="text-xs">{r.type}</Badge> },
  { key: 'category', header: 'Category', type: 'enum', accessor: (r) => r.category, sortValue: (r) => r.category },
  { key: 'hours', header: 'Hours', type: 'number', accessor: (r) => r.hours > 0 ? <span className="font-mono text-xs">{r.hours}h</span> : '—', sortValue: (r) => r.hours, align: 'right' },
  { key: 'rate', header: 'Rate', type: 'number', accessor: (r) => `$${r.rate.toFixed(2)}`, sortValue: (r) => r.rate, align: 'right' },
  { key: 'amount', header: 'Amount', type: 'number', accessor: (r) => <span className="font-semibold">${r.amount.toLocaleString()}</span>, sortValue: (r) => r.amount, align: 'right' },
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => r.date, sortValue: (r) => r.date },
  { key: 'awardReference', header: 'Award', type: 'text', accessor: (r) => <span className="text-muted-foreground text-xs">{r.awardReference}</span>, sortValue: (r) => r.awardReference },
  { key: 'department', header: 'Dept', type: 'enum', accessor: (r) => r.department ?? '—', sortValue: (r) => r.department ?? '' },
  { key: 'payPeriod', header: 'Pay Period', type: 'text', accessor: (r) => <span className="text-xs text-muted-foreground">{r.payPeriod}</span>, sortValue: (r) => r.payPeriod ?? '' },
  { key: 'taxable', header: 'Taxable', type: 'enum', accessor: (r) => r.taxable ? <Badge variant="secondary" className="text-[10px]">Yes</Badge> : <Badge variant="outline" className="text-[10px]">No</Badge>, sortValue: (r) => r.taxable ? 'Yes' : 'No' },
  { key: 'superApplicable', header: 'Super', type: 'enum', accessor: (r) => r.superApplicable ? '✓' : '—', sortValue: (r) => r.superApplicable ? 1 : 0, align: 'center' },
  { key: 'approvedBy', header: 'Approved By', type: 'enum', accessor: (r) => <span className="text-xs">{r.approvedBy}</span>, sortValue: (r) => r.approvedBy ?? '' },
  { key: 'amountTrend', header: 'Amount Trend (8wk)', type: 'sparkline', trendValues: (r: any) => r.amountTrend ?? [], accessor: () => null },
];

export function AllowancePenaltyReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonRange, setComparisonRange] = useState<DateRange | undefined>();

  const searchLocFilter = useMemo(() => mockAllowancePenalties.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const baseFiltered = useMemo(() => filterByDateRange(searchLocFilter, dateRange), [searchLocFilter, dateRange]);
  const comparisonData = useMemo(() => comparisonEnabled && comparisonRange?.from ? filterByDateRange(searchLocFilter, comparisonRange) : [], [searchLocFilter, comparisonEnabled, comparisonRange]);

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


  const allowances = filtered.filter(r => r.type === 'allowance');
  const penalties = filtered.filter(r => r.type === 'penalty');
  const totalAllowances = allowances.reduce((s, r) => s + r.amount, 0);
  const totalPenalties = penalties.reduce((s, r) => s + r.amount, 0);
  const combined = totalAllowances + totalPenalties;
  const avgPenaltyRate = penalties.length ? (penalties.reduce((s, r) => s + r.rate, 0) / penalties.length).toFixed(2) : '0';
  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.category] = (map[r.category] || 0) + r.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  }, [filtered]);

  const categories = [...new Set(filtered.map(r => r.category))];
  const chartData = categories.map(cat => ({
    name: cat,
    allowances: filtered.filter(r => r.category === cat && r.type === 'allowance').reduce((s, r) => s + r.amount, 0),
    penalties: filtered.filter(r => r.category === cat && r.type === 'penalty').reduce((s, r) => s + r.amount, 0),
  }));

  const typePie = [{ name: 'Allowances', value: totalAllowances }, { name: 'Penalties', value: totalPenalties }];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Allowance & Penalty Breakdown" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange}
        comparisonEnabled={comparisonEnabled} onComparisonToggle={() => setComparisonEnabled(v => !v)}
        comparisonRange={comparisonRange} onComparisonRangeChange={setComparisonRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Allowance & Penalty Breakdown Report"
        reportDescription="Itemised breakdown of all allowance payments and penalty rate loadings applied during the pay period."
        purpose="Ensures award-compliant application of allowances and penalties while tracking their cost impact on total labour expenditure."
        whenToUse={[
          'During pay run verification to check correct application', 'When analysing which penalty categories drive the most cost',
          'For award compliance auditing', 'When optimising scheduling to reduce penalty rate exposure',
        ]}
        keyMetrics={[
          { label: 'Total Allowances', description: 'Sum of all allowance payments (travel, meals, first aid, etc.)', interpretation: 'Should remain stable period-to-period unless staffing patterns change' },
          { label: 'Total Penalties', description: 'Sum of all penalty rate loadings (weekend, public holiday, night)', interpretation: 'High penalty costs suggest scheduling can be optimised to reduce weekend/evening shifts' },
          { label: 'Top Category', description: 'Highest-cost allowance or penalty category', interpretation: 'Focus cost reduction efforts on the largest category first for maximum impact' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows totals for allowances and penalties, combined cost, and the top cost category. Red indicates penalty-heavy pay runs.' },
          { title: 'Category Breakdown', content: 'Grouped bar chart comparing allowance vs penalty amounts by category. Tallest bars show the biggest cost drivers.' },
          { title: 'Type Distribution', content: 'Pie chart showing the split between allowances and penalties. Penalty-dominant runs suggest scheduling optimisation opportunities.' },
          { title: 'Detail Table', content: 'Line-by-line breakdown sorted by amount. Badge colours distinguish allowances from penalties. Award references enable compliance verification.' },
        ]}
        actionableInsights={[
          'If penalties exceed allowances, review shift scheduling to reduce weekend/evening allocations',
          'Verify all allowances are award-mandated — remove any incorrectly applied allowances',
          'Compare penalty rates against award minimums to ensure no overpayment',
          'Track top-cost categories month-over-month for cost trend analysis',
        ]}
        relatedReports={['Pay Run Summary', 'Award Compliance Dashboard', 'Labour Cost by Location']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Allowances" value={`$${totalAllowances.toLocaleString()}`} icon={Award} size="sm" />
        <StatCard label="Total Penalties" value={`$${totalPenalties.toLocaleString()}`} icon={AlertTriangle} variant={totalPenalties > totalAllowances * 2 ? 'danger' : 'default'} size="sm" />
        <StatCard label="Combined Total" value={`$${combined.toLocaleString()}`} icon={DollarSign} size="sm" />
        <StatCard label="Records" value={filtered.length} icon={FileText} size="sm" />
        <StatCard label="Avg Penalty Rate" value={`$${avgPenaltyRate}/hr`} icon={Banknote} size="sm" />
        <StatCard label="Top Category" value={topCategory?.[0] || '—'} icon={TrendingUp} subtitle={topCategory ? `$${topCategory[1].toLocaleString()}` : ''} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totalPenalties > totalAllowances * 2 && <InsightCard type="action" title="Penalty-Heavy Period" description={`Penalties ($${totalPenalties.toLocaleString()}) are ${Math.round(totalPenalties / totalAllowances)}x allowances. Review weekend and evening shift scheduling.`} action="Optimise shift patterns to reduce penalty exposure" />}
        {totalPenalties <= totalAllowances && <InsightCard type="positive" title="Balanced Cost Structure" description={`Allowances ($${totalAllowances.toLocaleString()}) exceed penalties ($${totalPenalties.toLocaleString()}), indicating efficient shift scheduling.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Allowances', value: `$${totalAllowances.toLocaleString()}`, highlight: true }, { label: 'Penalties', value: `$${totalPenalties.toLocaleString()}` },
        { label: 'Combined', value: `$${combined.toLocaleString()}` }, { label: 'Categories', value: categories.length },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('category', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allowances" name="Allowances" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="penalties" name="Penalties" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typePie} cursor="pointer" onClick={(_, index) => { const d = typePie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} reportId="allowance-penalty" exportTitle="Allowance & Penalty" /></CardContent>
      </Card>
    </div>
  );
}
