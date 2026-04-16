import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockBudgetVsActuals, BudgetVsActualRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, AlertTriangle, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Category', accessor: 'category' },
  { header: 'Budget', accessor: 'budgetAmount' }, { header: 'Actual', accessor: 'actualAmount' },
  { header: 'Variance', accessor: 'variance' }, { header: 'Variance %', accessor: 'variancePercent' },
];

const locations = [...new Set(mockBudgetVsActuals.map(r => r.locationName))];
const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const tableColumns: DataTableColumn<BudgetVsActualRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'category', header: 'Category', accessor: (r) => <Badge variant="outline" className="text-xs">{r.category}</Badge>, sortValue: (r) => r.category },
  { key: 'budgetAmount', header: 'Budget', accessor: (r) => `$${r.budgetAmount.toLocaleString()}`, sortValue: (r) => r.budgetAmount, align: 'right' },
  { key: 'actualAmount', header: 'Actual', accessor: (r) => `$${r.actualAmount.toLocaleString()}`, sortValue: (r) => r.actualAmount, align: 'right' },
  { key: 'variance', header: 'Variance', align: 'right', sortValue: (r) => r.variance,
    accessor: (r) => <span className={cn('font-medium', r.variance > 0 ? 'text-emerald-600' : 'text-destructive')}>{r.variance > 0 ? '+' : ''}${r.variance.toLocaleString()}</span> },
  { key: 'variancePercent', header: 'Var %', align: 'right', sortValue: (r) => r.variancePercent,
    accessor: (r) => <Badge variant={r.variancePercent >= 0 ? 'default' : 'destructive'} className="text-xs">{r.variancePercent > 0 ? '+' : ''}{r.variancePercent}%</Badge> },
];

export function BudgetVsActualsReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockBudgetVsActuals.filter(r => {
    const matchesSearch = !search || r.locationName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
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


  const totalBudget = filtered.reduce((s, r) => s + r.budgetAmount, 0);
  const totalActual = filtered.reduce((s, r) => s + r.actualAmount, 0);
  const totalVariance = totalBudget - totalActual;
  const variancePct = totalBudget > 0 ? Math.round((totalVariance / totalBudget) * 1000) / 10 : 0;
  const overBudgetItems = filtered.filter(r => r.variance < 0);
  const underBudgetItems = filtered.filter(r => r.variance > 0);
  const largestOverrun = overBudgetItems.length > 0 ? overBudgetItems.reduce((max, r) => Math.abs(r.variance) > Math.abs(max.variance) ? r : max, overBudgetItems[0]) : null;
  const budgetUtilisation = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // Category breakdown for pie
  const categories = [...new Set(filtered.map(r => r.category))];
  const categoryData = categories.map(cat => {
    const items = filtered.filter(r => r.category === cat);
    return { name: cat, budget: items.reduce((s, r) => s + r.budgetAmount, 0), actual: items.reduce((s, r) => s + r.actualAmount, 0) };
  });

  // Monthly trend simulation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = months.map((m, i) => ({
    name: m,
    budget: Math.round(totalBudget / 6 * (0.85 + Math.random() * 0.3)),
    actual: Math.round(totalActual / 6 * (0.8 + Math.random() * 0.4)),
  }));

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc.split(' ')[0], budget: items.reduce((s, r) => s + r.budgetAmount, 0), actual: items.reduce((s, r) => s + r.actualAmount, 0) };
  });

  // Sparkline data
  const budgetSparkline = months.map((_, i) => Math.round(totalBudget / 6 * (0.9 + i * 0.03)));
  const actualSparkline = months.map((_, i) => Math.round(totalActual / 6 * (0.85 + i * 0.05)));

  // Insights
  const insights = useMemo(() => {
    const result: { type: 'positive' | 'negative' | 'action' | 'neutral'; title: string; description: string; metric?: string; action?: string }[] = [];
    if (totalActual <= totalBudget) {
      result.push({ type: 'positive', title: 'Under Budget Overall', description: `Organisation is $${totalVariance.toLocaleString()} under budget across all locations.`, metric: `${variancePct}% savings` });
    } else {
      result.push({ type: 'negative', title: 'Over Budget Alert', description: `Organisation is $${Math.abs(totalVariance).toLocaleString()} over budget. Immediate review required.`, metric: `${Math.abs(variancePct)}% overrun`, action: 'Review top spending categories' });
    }
    if (largestOverrun) {
      result.push({ type: 'negative', title: `Largest Overrun: ${largestOverrun.category}`, description: `${largestOverrun.locationName} exceeded ${largestOverrun.category} budget by $${Math.abs(largestOverrun.variance).toLocaleString()}.`, metric: `${Math.abs(largestOverrun.variancePercent)}% over`, action: 'Investigate root cause and adjust forecast' });
    }
    if (underBudgetItems.length > filtered.length * 0.6) {
      result.push({ type: 'positive', title: 'Strong Budget Discipline', description: `${Math.round(underBudgetItems.length / filtered.length * 100)}% of line items are under budget, indicating effective cost management.` });
    }
    if (overBudgetItems.length > 0) {
      result.push({ type: 'action', title: `${overBudgetItems.length} Items Over Budget`, description: `Review these items for potential reallocation or approval of additional funding.`, action: 'Filter table by negative variance to identify priorities' });
    }
    return result;
  }, [filtered, totalBudget, totalActual, totalVariance, variancePct, largestOverrun, overBudgetItems, underBudgetItems]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Location Budget vs Actuals" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Location Budget vs Actuals"
        reportDescription="Comprehensive financial comparison report tracking budgeted amounts against actual expenditure across all locations, categories, and time periods. Enables proactive cost management and forecasting accuracy assessment."
        purpose="This report provides a real-time view of financial performance by comparing planned budgets against actual spending. It helps identify cost overruns before they become critical, validates forecasting accuracy, and supports data-driven budget reallocation decisions."
        whenToUse={[
          'During monthly or quarterly financial reviews to assess spending against plan',
          'When preparing budget submissions for the next fiscal period — use variance trends to calibrate forecasts',
          'To identify locations or categories consistently over/under budget for operational adjustments',
          'Before board or executive reporting to summarise organisational financial health',
          'When considering reallocation of funds between locations or cost categories',
        ]}
        keyMetrics={[
          { label: 'Total Budget', description: 'Sum of all planned budget allocations across filtered locations and categories.', interpretation: 'Baseline for measuring financial performance. Compare against actuals to assess overall spending discipline.', goodRange: 'Aligned with strategic plan', warningRange: 'Significant mid-year revisions', criticalRange: 'Unplanned budget changes' },
          { label: 'Total Actual', description: 'Sum of all real expenditure recorded against budget line items.', interpretation: 'When actual exceeds budget, investigate which categories or locations are driving the overrun.', goodRange: '< 100% of budget', warningRange: '100–105% of budget', criticalRange: '> 105% of budget' },
          { label: 'Variance', description: 'Difference between budget and actual (positive = under budget, negative = over budget).', interpretation: 'Positive variance indicates savings; negative indicates overspend. Large positive variance may indicate under-investment.', goodRange: '0% to +5%', warningRange: '-5% to 0%', criticalRange: 'Below -5%' },
          { label: 'Budget Utilisation', description: 'Percentage of budget actually consumed (Actual / Budget × 100).', interpretation: 'Optimal utilisation is 90–100%. Below 80% may indicate delayed projects; above 100% requires investigation.', goodRange: '90–100%', warningRange: '80–89% or 101–105%', criticalRange: '< 80% or > 105%' },
          { label: 'Over-Budget Items', description: 'Count of individual line items where actual spending exceeds the planned budget.', interpretation: 'High count signals systemic forecasting issues. Focus on categories with the largest absolute overruns.', goodRange: '< 10% of items', warningRange: '10–20% of items', criticalRange: '> 20% of items' },
          { label: 'Largest Overrun', description: 'The single line item with the highest absolute negative variance.', interpretation: 'Prioritise investigation here for maximum impact. Determine if the overrun is one-off or recurring.' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'The six cards at the top provide an executive-level snapshot. Green values indicate positive performance (under budget), while red indicates overruns. Sparklines show the 6-month trend for each metric — look for upward or downward trends that may require intervention. The trend badges show period-over-period change.' },
          { title: 'Monthly Budget vs Actual Trend', content: 'The area chart overlays budget allocations against actual spending month by month. When the actual line rises above the budget line, that month had an overrun. Consistent gaps between the lines (actual below budget) indicate strong cost control. Widening gaps may indicate accelerating underspend or overspend.' },
          { title: 'Budget vs Actual by Location', content: 'The grouped bar chart compares each location side-by-side. Locations where the "Actual" bar exceeds the "Budget" bar need immediate attention. Equal bars indicate accurate forecasting. Significantly shorter actual bars may indicate delayed operations or under-investment.' },
          { title: 'Spending by Category', content: 'The pie chart shows proportional spending across cost categories. Compare against budget allocation to identify categories consuming disproportionate resources. Click on legend items to focus on specific categories.' },
          { title: 'Automated Insights', content: 'The system analyses your data and surfaces key findings automatically. Green cards highlight positive trends, red cards flag concerns, and amber cards suggest specific actions. Each insight includes the relevant metric and a recommended next step.' },
          { title: 'Detail Table', content: 'The sortable table shows every budget line item. Use column headers to sort by variance to quickly find the biggest overruns or savings. The variance percentage column uses colour coding: green for under budget, red for over budget. Export this data for further analysis in spreadsheets.' },
        ]}
        actionableInsights={[
          'Review all items with variance > -10% — these are at risk of significant overrun by period end',
          'For locations consistently under budget, investigate whether this reflects genuine savings or delayed expenditure that will appear in future periods',
          'Use the category breakdown to identify systemic issues — if one category is over budget across multiple locations, the forecasting methodology may need revision',
          'Compare month-over-month trends to identify whether overruns are accelerating or decelerating — this affects urgency of intervention',
          'Cross-reference with Labour Cost and Staffing reports to determine if budget variances correlate with workforce changes',
        ]}
        relatedReports={['Labour Cost by Location', 'Payroll Cost Dashboard', 'Area Utilisation Report', 'Headcount & FTE Report']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Budget" value={`$${(totalBudget / 1000).toFixed(0)}k`} icon={DollarSign} sparklineData={budgetSparkline}
          trend={{ value: 3.2, label: 'vs prior period' }} />
        <StatCard label="Total Actual" value={`$${(totalActual / 1000).toFixed(0)}k`} icon={BarChart3} sparklineData={actualSparkline}
          trend={{ value: totalActual <= totalBudget ? -2.1 : 4.5, label: 'vs prior period', isPositiveGood: false }} />
        <StatCard label="Overall Variance" value={`${totalVariance >= 0 ? '+' : '-'}$${Math.abs(totalVariance).toLocaleString()}`}
          icon={totalVariance >= 0 ? TrendingUp : TrendingDown}
          variant={totalVariance >= 0 ? 'success' : 'danger'}
          trend={{ value: variancePct, label: 'of total budget' }} />
        <StatCard label="Budget Utilisation" value={`${budgetUtilisation}%`} icon={Target}
          variant={budgetUtilisation > 105 ? 'danger' : budgetUtilisation > 100 ? 'warning' : 'success'}
          sparklineData={[88, 91, 94, 92, 96, budgetUtilisation]} />
        <StatCard label="Over-Budget Items" value={overBudgetItems.length} icon={AlertTriangle}
          variant={overBudgetItems.length > filtered.length * 0.2 ? 'danger' : overBudgetItems.length > 0 ? 'warning' : 'success'}
          subtitle={`of ${filtered.length} total`} />
        <StatCard label="Under-Budget Items" value={underBudgetItems.length} icon={TrendingUp}
          variant="success" subtitle={`${Math.round(underBudgetItems.length / (filtered.length || 1) * 100)}% of items`} />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </div>

      <SummaryRow items={[
        { label: 'Locations', value: locations.length },
        { label: 'Categories', value: categories.length },
        { label: 'Avg Variance', value: `${variancePct > 0 ? '+' : ''}${variancePct}%`, highlight: true },
        { label: 'Best Location', value: chartData.length > 0 ? chartData.reduce((best, loc) => (loc.budget - loc.actual) > (best.budget - best.actual) ? loc : best, chartData[0]).name : '-' },
        { label: 'Worst Location', value: chartData.length > 0 ? chartData.reduce((worst, loc) => (loc.budget - loc.actual) < (worst.budget - worst.actual) ? loc : worst, chartData[0]).name : '-' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Budget vs Actual Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="budget" name="Budget" stroke="hsl(var(--primary))" fill="url(#budgetGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#10B981" fill="url(#actualGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Budget vs Actual by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" name="Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Spending Distribution by Category</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cursor="pointer" onClick={(_, index) => { const d = categoryData[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="actual" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
            <div className="space-y-2">
              {categoryData.map((cat, i) => {
                const variance = cat.budget - cat.actual;
                const pct = cat.budget > 0 ? Math.round((variance / cat.budget) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">B: ${(cat.budget / 1000).toFixed(0)}k</span>
                      <span>A: ${(cat.actual / 1000).toFixed(0)}k</span>
                      <span className={cn('font-medium', pct >= 0 ? 'text-emerald-600' : 'text-destructive')}>{pct >= 0 ? '+' : ''}{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detailed Budget Line Items</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.category}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
