import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockPayRunRecords, payrollTrendData } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Users, Target, Banknote } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#F59E0B', '#10B981', '#8B5CF6'];

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: 'month' }, { header: 'Total Labour', accessor: 'totalLabour' },
  { header: 'Overtime', accessor: 'overtime' }, { header: 'Penalties', accessor: 'penalties' },
  { header: 'Budget', accessor: 'budget' },
];

const locations = [...new Set(mockPayRunRecords.map(r => r.location))];

export function PayrollCostDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockPayRunRecords.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalGross = filtered.reduce((s, r) => s + r.totalGross, 0);
  const totalOvertime = filtered.reduce((s, r) => s + r.overtimePay, 0);
  const totalAllowances = filtered.reduce((s, r) => s + r.allowances, 0);
  const totalPenalties = filtered.reduce((s, r) => s + r.penalties, 0);
  const totalBase = filtered.reduce((s, r) => s + r.basePay, 0);
  const totalSuper = filtered.reduce((s, r) => s + r.superannuation, 0);
  const avgGrossPerStaff = filtered.length ? Math.round(totalGross / filtered.length) : 0;
  const otPct = totalGross > 0 ? ((totalOvertime / totalGross) * 100).toFixed(1) : '0';
  const latestBudget = payrollTrendData[payrollTrendData.length - 1]?.budget || 0;
  const latestActual = payrollTrendData[payrollTrendData.length - 1]?.totalLabour || 0;
  const budgetVariance = latestBudget - latestActual;

  const costBreakdown = [
    { name: 'Base Pay', value: totalBase }, { name: 'Overtime', value: totalOvertime },
    { name: 'Penalties', value: totalPenalties }, { name: 'Allowances', value: totalAllowances },
    { name: 'Super', value: totalSuper },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Payroll Cost Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={payrollTrendData} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Payroll Cost Dashboard"
        reportDescription="Real-time view of total labour costs including base pay, overtime, penalties, allowances and superannuation across all locations."
        purpose="Provides financial oversight of labour expenditure against budget targets, enabling proactive cost management and variance analysis."
        whenToUse={[
          'During weekly/fortnightly pay run reviews', 'When labour costs are trending above budget',
          'For monthly P&L preparation and cost forecasting', 'When comparing cost structures across locations',
        ]}
        keyMetrics={[
          { label: 'Total Gross Pay', description: 'Sum of all pay components before tax deductions', interpretation: 'Compare against budget to ensure costs are within tolerance', goodRange: 'Within 5% of budget', warningRange: '5-10% over', criticalRange: '>10% over' },
          { label: 'Overtime %', description: 'Overtime cost as proportion of total gross', interpretation: 'Should stay below 8%. Above 12% indicates scheduling inefficiency', goodRange: '<8%', warningRange: '8-12%', criticalRange: '>12%' },
          { label: 'Budget Variance', description: 'Budget − Actual labour cost', interpretation: 'Positive = under budget (good). Negative = over budget (requires action)' },
          { label: 'Cost per Staff', description: 'Total Gross ÷ Staff Count', interpretation: 'Rising cost-per-staff without headcount change may indicate award reclassifications or overtime creep' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Top row shows total costs, overtime percentage, budget variance and per-staff averages with trend indicators.' },
          { title: 'Labour Cost Trend', content: 'Area chart tracks total labour against budget over time. The gap between actual and budget lines shows variance trend.' },
          { title: 'Cost Breakdown Pie', content: 'Shows proportional split of pay components. Base Pay should dominate (>70%). High OT/penalty slices need investigation.' },
          { title: 'Cost by Location', content: 'Stacked bars compare cost structure across locations. Inconsistent patterns reveal location-specific issues.' },
        ]}
        actionableInsights={[
          'If overtime exceeds 10% of gross, review scheduling to redistribute shifts to available staff',
          'Track cost-per-staff month-over-month to detect wage drift before budget blowouts',
          'Compare location cost structures to identify sites with disproportionate penalty or overtime costs',
          'Use budget variance trends to forecast year-end position and adjust hiring plans',
        ]}
        relatedReports={['Pay Run Summary', 'Labour Cost by Location', 'Overtime by Location', 'Casual vs Permanent Cost']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Gross Pay" value={`$${(totalGross / 1000).toFixed(1)}k`} icon={DollarSign} sparklineData={payrollTrendData.map(d => d.totalLabour)} size="sm" />
        <StatCard label="Overtime Cost" value={`$${(totalOvertime / 1000).toFixed(1)}k`} icon={AlertTriangle} variant={Number(otPct) > 12 ? 'danger' : Number(otPct) > 8 ? 'warning' : 'default'} size="sm" />
        <StatCard label="OT as % of Gross" value={`${otPct}%`} icon={TrendingUp} variant={Number(otPct) > 12 ? 'danger' : Number(otPct) > 8 ? 'warning' : 'success'} size="sm" />
        <StatCard label="Budget Variance" value={`${budgetVariance >= 0 ? '+' : '-'}$${(Math.abs(budgetVariance) / 1000).toFixed(1)}k`} icon={Target} variant={budgetVariance >= 0 ? 'success' : 'danger'} size="sm" />
        <StatCard label="Avg Gross/Staff" value={`$${avgGrossPerStaff.toLocaleString()}`} icon={Banknote} size="sm" />
        <StatCard label="Staff Paid" value={filtered.length} icon={Users} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {budgetVariance >= 0 && <InsightCard type="positive" title="Under Budget" description={`Labour costs are $${(budgetVariance / 1000).toFixed(1)}k under budget this period.`} metric={`${((budgetVariance / latestBudget) * 100).toFixed(1)}% savings`} />}
        {budgetVariance < 0 && <InsightCard type="negative" title="Over Budget" description={`Labour costs exceed budget by $${(Math.abs(budgetVariance) / 1000).toFixed(1)}k. Review overtime and agency usage.`} action="Investigate cost drivers by location" />}
        {Number(otPct) > 10 && <InsightCard type="action" title="High Overtime Ratio" description={`Overtime represents ${otPct}% of total gross — well above the 8% benchmark.`} action="Redistribute shifts to available staff" />}
        {Number(otPct) <= 8 && <InsightCard type="positive" title="Controlled Overtime" description={`Overtime at ${otPct}% of gross is within the 8% benchmark. Scheduling is efficient.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Base Pay', value: `$${(totalBase / 1000).toFixed(0)}k`, highlight: true }, { label: 'Overtime', value: `$${(totalOvertime / 1000).toFixed(1)}k` },
        { label: 'Penalties', value: `$${totalPenalties.toLocaleString()}` }, { label: 'Allowances', value: `$${totalAllowances.toLocaleString()}` },
        { label: 'Super', value: `$${(totalSuper / 1000).toFixed(1)}k` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Labour Cost Trend vs Budget</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={payrollTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="totalLabour" name="Total Labour" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Area type="monotone" dataKey="overtime" name="Overtime" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={locations.map(loc => {
              const items = filtered.filter(r => r.location === loc);
              return { name: loc.split(' ')[0], base: items.reduce((s, r) => s + r.basePay, 0), overtime: items.reduce((s, r) => s + r.overtimePay, 0), penalties: items.reduce((s, r) => s + r.penalties, 0) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="base" name="Base" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="overtime" name="OT" stackId="a" fill="#F59E0B" />
              <Bar dataKey="penalties" name="Penalties" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
