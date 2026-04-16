import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockPayRunRecords, payrollTrendData } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Users, Target, Banknote } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#F59E0B', '#10B981', '#8B5CF6'];
const COST_NAMES = ['Base Pay', 'Overtime', 'Penalties', 'Allowances', 'Super'];

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: 'month' }, { header: 'Total Labour', accessor: 'totalLabour' },
  { header: 'Overtime', accessor: 'overtime' }, { header: 'Budget', accessor: 'budget' },
];
const locations = [...new Set(mockPayRunRecords.map(r => r.location))];

export function PayrollCostDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => filterByDateRange(mockPayRunRecords.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), dateRange)), [search, locationFilter, dateRange]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'location') return baseFiltered.filter(r => r.location === drill.value);
    if (drill.type === 'costType') {
      // Filter to staff with significant amounts in that cost type
      if (drill.value === 'Overtime') return baseFiltered.filter(r => r.overtimePay > 0);
      if (drill.value === 'Penalties') return baseFiltered.filter(r => r.penalties > 0);
      if (drill.value === 'Allowances') return baseFiltered.filter(r => r.allowances > 0);
      return baseFiltered;
    }
    return baseFiltered;
  }, [baseFiltered, drill]);

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

  const locationCosts = locations.map(loc => {
    const items = baseFiltered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], fullName: loc, base: items.reduce((s, r) => s + r.basePay, 0), overtime: items.reduce((s, r) => s + r.overtimePay, 0), penalties: items.reduce((s, r) => s + r.penalties, 0) };
  });

  const handlePieClick = (_: any, index: number) => {
    const item = costBreakdown[index];
    if (item) setDrill({ type: 'costType', value: item.name, label: 'Cost Type' });
  };

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Payroll Cost Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={payrollTrendData} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Payroll Cost Dashboard" reportDescription="Labour cost analytics with interactive drill-through to cost types and locations."
        purpose="Financial oversight with click-to-drill capability for detailed cost analysis."
        whenToUse={['Pay run reviews', 'Budget variance analysis', 'Location cost comparison']}
        keyMetrics={[
          { label: 'Total Gross', description: 'Sum of all pay components', interpretation: 'Compare against budget', goodRange: 'Within 5%', warningRange: '5-10% over', criticalRange: '>10% over' },
          { label: 'OT %', description: 'Overtime as % of gross', interpretation: 'Below 8% is healthy', goodRange: '<8%', warningRange: '8-12%', criticalRange: '>12%' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click pie slices to filter by cost type (e.g. show only staff with overtime). Click location bars to filter by site. All KPIs update.' }]}
        actionableInsights={['OT >10% — redistribute shifts', 'Compare location cost structures for anomalies']}
        relatedReports={['Pay Run Summary', 'Labour Cost by Location', 'Overtime by Location']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Gross" value={`$${(totalGross / 1000).toFixed(1)}k`} icon={DollarSign} sparklineData={payrollTrendData.map(d => d.totalLabour)} size="sm" />
        <StatCard label="Overtime Cost" value={`$${(totalOvertime / 1000).toFixed(1)}k`} icon={AlertTriangle} variant={Number(otPct) > 12 ? 'danger' : Number(otPct) > 8 ? 'warning' : 'default'} size="sm" />
        <StatCard label="OT % of Gross" value={`${otPct}%`} icon={TrendingUp} variant={Number(otPct) > 12 ? 'danger' : Number(otPct) > 8 ? 'warning' : 'success'} size="sm" />
        <StatCard label="Budget Var" value={`${budgetVariance >= 0 ? '+' : '-'}$${(Math.abs(budgetVariance) / 1000).toFixed(1)}k`} icon={Target} variant={budgetVariance >= 0 ? 'success' : 'danger'} size="sm" />
        <StatCard label="Avg/Staff" value={`$${avgGrossPerStaff.toLocaleString()}`} icon={Banknote} size="sm" />
        <StatCard label="Staff Paid" value={filtered.length} icon={Users} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {budgetVariance >= 0 && <InsightCard type="positive" title="Under Budget" description={`$${(budgetVariance / 1000).toFixed(1)}k under.`} metric={`${((budgetVariance / latestBudget) * 100).toFixed(1)}% savings`} />}
        {budgetVariance < 0 && <InsightCard type="negative" title="Over Budget" description={`$${(Math.abs(budgetVariance) / 1000).toFixed(1)}k over.`} action="Investigate cost drivers" />}
        {Number(otPct) > 10 && <InsightCard type="action" title="High OT" description={`${otPct}% of gross.`} action="Redistribute shifts" />}
        {Number(otPct) <= 8 && <InsightCard type="positive" title="Controlled OT" description={`${otPct}% within benchmark.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Base', value: `$${(totalBase / 1000).toFixed(0)}k`, highlight: true }, { label: 'OT', value: `$${(totalOvertime / 1000).toFixed(1)}k` },
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
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="totalLabour" name="Total Labour" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Area type="monotone" dataKey="overtime" name="Overtime" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Breakdown <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Location {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>} <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={locationCosts} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="base" name="Base" stackId="a" fill="hsl(var(--primary))" style={{ cursor: 'pointer' }} />
              <Bar dataKey="overtime" name="OT" stackId="a" fill="#F59E0B" style={{ cursor: 'pointer' }} />
              <Bar dataKey="penalties" name="Penalties" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
