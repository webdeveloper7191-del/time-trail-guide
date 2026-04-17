import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockLabourCosts, LabourCostRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Target, Users, Banknote } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--destructive))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Department', accessor: 'department' },
  { header: 'Headcount', accessor: 'headcount' }, { header: 'Regular', accessor: 'regularCost' },
  { header: 'Overtime', accessor: 'overtimeCost' }, { header: 'Total', accessor: 'totalCost' },
  { header: 'Budget', accessor: 'budgetAmount' }, { header: 'Variance', accessor: 'variance' },
];

const locations = [...new Set(mockLabourCosts.map(r => r.location))];

const tableColumns: DataTableColumn<LabourCostRecord>[] = [
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'department', header: 'Department', type: 'enum', accessor: (r) => r.department, sortValue: (r) => r.department },
  { key: 'headcount', header: 'HC', type: 'number', accessor: (r) => r.headcount, sortValue: (r) => r.headcount, align: 'right' },
  { key: 'regularCost', header: 'Regular', type: 'number', accessor: (r) => `$${(r.regularCost / 1000).toFixed(1)}k`, sortValue: (r) => r.regularCost, align: 'right' },
  { key: 'overtimeCost', header: 'OT', type: 'number', accessor: (r) => `$${(r.overtimeCost / 1000).toFixed(1)}k`, sortValue: (r) => r.overtimeCost, align: 'right' },
  { key: 'allowanceCost', header: 'Allow.', type: 'number', accessor: (r) => `$${r.allowanceCost}`, sortValue: (r) => r.allowanceCost, align: 'right' },
  { key: 'penaltyCost', header: 'Penalties', type: 'number', accessor: (r) => `$${r.penaltyCost}`, sortValue: (r) => r.penaltyCost, align: 'right' },
  { key: 'agencyCost', header: 'Agency', type: 'number', sortValue: (r) => r.agencyCost, align: 'right',
    accessor: (r) => r.agencyCost > 0 ? <span className="text-destructive font-medium">${(r.agencyCost / 1000).toFixed(1)}k</span> : <span className="text-muted-foreground text-xs">—</span> },
  { key: 'totalCost', header: 'Total', type: 'number', accessor: (r) => <span className="font-semibold">${(r.totalCost / 1000).toFixed(1)}k</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'budgetAmount', header: 'Budget', type: 'number', accessor: (r) => `$${(r.budgetAmount / 1000).toFixed(1)}k`, sortValue: (r) => r.budgetAmount, align: 'right' },
  { key: 'variance', header: 'Variance', type: 'number', align: 'right', sortValue: (r) => r.variance,
    accessor: (r) => <span className={cn('font-medium text-xs', r.variance >= 0 ? 'text-emerald-600' : 'text-destructive')}>{r.variance >= 0 ? '+' : ''}${r.variance}</span> },
  { key: 'costPerHead', header: '$/Head', type: 'number', align: 'right', sortValue: (r) => r.headcount > 0 ? r.totalCost / r.headcount : 0,
    accessor: (r) => <span className="font-mono text-xs">${r.headcount > 0 ? Math.round(r.totalCost / r.headcount).toLocaleString() : '—'}</span> },
];

export function LabourCostReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockLabourCosts.filter(r => {
    const matchesSearch = !search || r.location.toLowerCase().includes(search.toLowerCase()) || r.department.toLowerCase().includes(search.toLowerCase());
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


  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0);
  const totalBudget = filtered.reduce((s, r) => s + r.budgetAmount, 0);
  const totalVariance = totalBudget - totalCost;
  const totalOT = filtered.reduce((s, r) => s + r.overtimeCost, 0);
  const totalAgency = filtered.reduce((s, r) => s + r.agencyCost, 0);
  const totalHC = filtered.reduce((s, r) => s + r.headcount, 0);
  const costPerHead = totalHC > 0 ? Math.round(totalCost / totalHC) : 0;
  const overBudgetCount = filtered.filter(r => r.variance < 0).length;

  const costPie = [
    { name: 'Regular', value: filtered.reduce((s, r) => s + r.regularCost, 0) },
    { name: 'Overtime', value: totalOT },
    { name: 'Agency', value: totalAgency },
    { name: 'Allowances', value: filtered.reduce((s, r) => s + r.allowanceCost, 0) },
    { name: 'Penalties', value: filtered.reduce((s, r) => s + r.penaltyCost, 0) },
  ];

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], regular: items.reduce((s, r) => s + r.regularCost, 0), overtime: items.reduce((s, r) => s + r.overtimeCost, 0), agency: items.reduce((s, r) => s + r.agencyCost, 0) };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Labour Cost by Location/Department" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Labour Cost by Location/Department Report"
        reportDescription="Multi-dimensional analysis of labour costs broken down by location, department, and cost component."
        purpose="Enables location-level cost accountability and budget variance management for targeted cost optimisation."
        whenToUse={[
          'Monthly budget review meetings', 'When comparing cost efficiency across locations',
          'For identifying departments driving budget overruns', 'When evaluating the ROI of agency vs permanent staff',
        ]}
        keyMetrics={[
          { label: 'Total Cost', description: 'Sum of all labour cost components', interpretation: 'Compare against total budget allocation' },
          { label: 'Budget Variance', description: 'Budget − Actual (positive = under budget)', interpretation: 'Negative variance requires immediate cost reduction action', goodRange: 'Positive', warningRange: '0 to -5%', criticalRange: '>-5%' },
          { label: 'Cost/Head', description: 'Total Cost ÷ Headcount', interpretation: 'Enables fair comparison between locations of different sizes. Rising values indicate wage drift' },
          { label: 'Agency Cost', description: 'Total spent on agency/temporary staff', interpretation: 'Agency workers typically cost 30-50% more than permanent. Minimise for cost efficiency' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows total cost, budget status, agency spending, and cost-per-head. Red cards flag budget overruns.' },
          { title: 'Cost by Location', content: 'Stacked bars show cost composition per location. Compare stack heights and proportions for efficiency differences.' },
          { title: 'Cost Mix Pie', content: 'Overall proportional breakdown. Regular pay should dominate (>75%). High OT/agency slices indicate inefficiency.' },
          { title: 'Detail Table', content: 'Full breakdown with variance and cost-per-head columns. Sort by variance to find problem areas. Red values = over budget.' },
        ]}
        actionableInsights={[
          'Locations with negative variance need immediate cost review and corrective scheduling',
          'If agency costs exceed 10% of total, accelerate permanent recruitment',
          'Compare cost-per-head across locations to identify operational efficiency leaders',
          'Track overtime as percentage of regular cost — should stay below 10%',
        ]}
        relatedReports={['Payroll Cost Dashboard', 'Overtime by Location', 'Casual vs Permanent Cost', 'Allowance & Penalty Breakdown']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Labour Cost" value={`$${(totalCost / 1000).toFixed(0)}k`} icon={DollarSign} size="sm" />
        <StatCard label="Budget Variance" value={`${totalVariance >= 0 ? '+' : '-'}$${(Math.abs(totalVariance) / 1000).toFixed(1)}k`} icon={Target} variant={totalVariance >= 0 ? 'success' : 'danger'} size="sm" />
        <StatCard label="Overtime Cost" value={`$${(totalOT / 1000).toFixed(1)}k`} icon={AlertTriangle} size="sm" />
        <StatCard label="Agency Cost" value={`$${(totalAgency / 1000).toFixed(1)}k`} icon={Users} variant={totalAgency > totalCost * 0.1 ? 'danger' : 'default'} size="sm" />
        <StatCard label="Cost/Head" value={`$${costPerHead.toLocaleString()}`} icon={Banknote} size="sm" />
        <StatCard label="Over Budget" value={overBudgetCount} icon={TrendingUp} variant={overBudgetCount > 0 ? 'danger' : 'success'} subtitle={`of ${filtered.length} depts`} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totalVariance >= 0 && <InsightCard type="positive" title="Under Budget" description={`Total labour costs are $${(totalVariance / 1000).toFixed(1)}k under budget across all locations.`} />}
        {totalVariance < 0 && <InsightCard type="negative" title="Budget Overrun" description={`Labour costs exceed budget by $${(Math.abs(totalVariance) / 1000).toFixed(1)}k. ${overBudgetCount} departments over budget.`} action="Review highest-variance departments" />}
        {totalAgency > totalCost * 0.1 && <InsightCard type="action" title="High Agency Dependency" description={`Agency costs represent ${((totalAgency / totalCost) * 100).toFixed(1)}% of total labour — well above the 10% benchmark.`} action="Accelerate permanent recruitment pipeline" />}
      </div>

      <SummaryRow items={[
        { label: 'Total Cost', value: `$${(totalCost / 1000).toFixed(0)}k`, highlight: true }, { label: 'Budget', value: `$${(totalBudget / 1000).toFixed(0)}k` },
        { label: 'Variance', value: `${totalVariance >= 0 ? '+' : ''}$${(totalVariance / 1000).toFixed(1)}k`, highlight: true },
        { label: 'Headcount', value: totalHC }, { label: 'Agency %', value: `${((totalAgency / totalCost) * 100).toFixed(1)}%` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="regular" name="Regular" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="overtime" name="Overtime" stackId="a" fill="#F59E0B" />
                <Bar dataKey="agency" name="Agency" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Mix</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={costPie.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.location}-${r.department}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
