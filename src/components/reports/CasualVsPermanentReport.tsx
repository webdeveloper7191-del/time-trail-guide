import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCasualVsPermanent, CasualVsPermanentRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, AlertTriangle, Target, Banknote } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Period', accessor: 'period' },
  { header: 'Perm HC', accessor: 'permanentHeadcount' }, { header: 'Casual HC', accessor: 'casualHeadcount' },
  { header: 'Perm Cost', accessor: 'permanentCost' }, { header: 'Casual Cost', accessor: 'casualCost' },
  { header: 'Casual $/hr', accessor: 'costPerHourCasual' },
];

const locations = [...new Set(mockCasualVsPermanent.map(r => r.location))];

const tableColumns: DataTableColumn<CasualVsPermanentRecord>[] = [
  { key: 'location', header: 'Location', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'period', header: 'Period', accessor: (r) => r.period, sortValue: (r) => r.period },
  { key: 'permanentHeadcount', header: 'Perm HC', accessor: (r) => r.permanentHeadcount, sortValue: (r) => r.permanentHeadcount, align: 'right' },
  { key: 'casualHeadcount', header: 'Casual HC', accessor: (r) => r.casualHeadcount, sortValue: (r) => r.casualHeadcount, align: 'right' },
  { key: 'permanentHours', header: 'Perm Hrs', accessor: (r) => <span className="font-mono text-xs">{r.permanentHours}h</span>, sortValue: (r) => r.permanentHours, align: 'right' },
  { key: 'casualHours', header: 'Casual Hrs', accessor: (r) => <span className="font-mono text-xs">{r.casualHours}h</span>, sortValue: (r) => r.casualHours, align: 'right' },
  { key: 'permanentCost', header: 'Perm Cost', accessor: (r) => `$${(r.permanentCost / 1000).toFixed(1)}k`, sortValue: (r) => r.permanentCost, align: 'right' },
  { key: 'casualCost', header: 'Casual Cost', accessor: (r) => <span className="text-destructive">${(r.casualCost / 1000).toFixed(1)}k</span>, sortValue: (r) => r.casualCost, align: 'right' },
  { key: 'costPerHourPermanent', header: '$/hr Perm', accessor: (r) => `$${r.costPerHourPermanent}`, sortValue: (r) => r.costPerHourPermanent, align: 'right' },
  { key: 'costPerHourCasual', header: '$/hr Casual', sortValue: (r) => r.costPerHourCasual, align: 'right',
    accessor: (r) => <span className="text-destructive font-medium">${r.costPerHourCasual}</span> },
  { key: 'casualLoadingPercent', header: 'Loading', accessor: (r) => `${r.casualLoadingPercent}%`, sortValue: (r) => r.casualLoadingPercent, align: 'right' },
  { key: 'premiumCost', header: 'Premium', align: 'right', sortValue: (r) => r.casualHours * (r.costPerHourCasual - r.costPerHourPermanent),
    accessor: (r) => { const premium = r.casualHours * (r.costPerHourCasual - r.costPerHourPermanent); return <span className="text-xs text-destructive font-medium">+${premium.toLocaleString()}</span>; }},
];

export function CasualVsPermanentReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockCasualVsPermanent.filter(r => {
    const matchesSearch = !search || r.location.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), dateRange)), [search, locationFilter, dateRange]);

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


  const totalPerm = filtered.reduce((s, r) => s + r.permanentCost, 0);
  const totalCasual = filtered.reduce((s, r) => s + r.casualCost, 0);
  const totalCombined = totalPerm + totalCasual;
  const casualPercent = totalCombined > 0 ? Math.round(totalCasual / totalCombined * 100) : 0;
  const totalCasualHrs = filtered.reduce((s, r) => s + r.casualHours, 0);
  const avgCasualRate = filtered.length ? (filtered.reduce((s, r) => s + r.costPerHourCasual, 0) / filtered.length).toFixed(2) : '0';
  const avgPermRate = filtered.length ? (filtered.reduce((s, r) => s + r.costPerHourPermanent, 0) / filtered.length).toFixed(2) : '0';
  const totalPremium = filtered.reduce((s, r) => s + r.casualHours * (r.costPerHourCasual - r.costPerHourPermanent), 0);

  const periods = [...new Set(filtered.map(r => r.period))];
  const trendData = periods.map(p => {
    const items = filtered.filter(r => r.period === p);
    return { period: p, permanent: items.reduce((s, r) => s + r.permanentCost, 0), casual: items.reduce((s, r) => s + r.casualCost, 0), casualPct: 0 };
  });
  trendData.forEach(d => { d.casualPct = Math.round(d.casual / (d.permanent + d.casual) * 100); });

  const costPie = [{ name: 'Permanent', value: totalPerm }, { name: 'Casual', value: totalCasual }];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Casual vs Permanent Cost Comparison" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Casual vs Permanent Cost Comparison"
        reportDescription="Compares the total cost of casual versus permanent employment, including hourly rate premiums and loading analysis."
        purpose="Quantifies the financial impact of casual dependency to inform strategic workforce composition decisions."
        whenToUse={[
          'During workforce planning to evaluate contract mix strategy', 'When building the business case for casual-to-permanent conversions',
          'For annual budget forecasting by employment type', 'When assessing the true cost impact of casual loading',
        ]}
        keyMetrics={[
          { label: 'Casual %', description: 'Casual cost as percentage of total labour', interpretation: 'Above 20% indicates over-reliance on expensive casual labour', goodRange: '<15%', warningRange: '15-25%', criticalRange: '>25%' },
          { label: 'Rate Premium', description: 'Difference between casual and permanent hourly rates', interpretation: 'Typically 25% loading. Multiplied by total casual hours shows the cost of not converting' },
          { label: 'Casual Loading Premium', description: 'Total additional cost from casual rates vs permanent', interpretation: 'This is the amount you could save by converting casuals to permanent contracts' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows permanent vs casual costs, the ratio, hourly rate comparison, and total premium from casual loading.' },
          { title: 'Cost Trend', content: 'Stacked bars show permanent vs casual costs over time. Rising casual proportion indicates growing cost inefficiency.' },
          { title: 'Cost Split Pie', content: 'Proportional view of permanent vs casual spending. Casual slice above 20% warrants conversion program.' },
          { title: 'Detail Table', content: 'Premium column shows the per-record cost of casual loading — the savings available through conversion.' },
        ]}
        actionableInsights={[
          'If casual loading premium exceeds permanent conversion costs, prioritise conversion program',
          'Track casual % trend — rising values indicate scheduling dependency growing faster than permanent hiring',
          'Compare locations to identify sites with the most cost-effective contract mix',
          'Calculate the ROI of converting top-hour casuals: loading savings vs onboarding and entitlement costs',
        ]}
        relatedReports={['Contract Type Distribution', 'Labour Cost by Location', 'Payroll Cost Dashboard', 'Headcount & FTE']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Permanent Cost" value={`$${(totalPerm / 1000).toFixed(0)}k`} icon={DollarSign} size="sm" />
        <StatCard label="Casual Cost" value={`$${(totalCasual / 1000).toFixed(0)}k`} icon={AlertTriangle} variant={casualPercent > 25 ? 'danger' : casualPercent > 15 ? 'warning' : 'default'} size="sm" />
        <StatCard label="Casual as % Total" value={`${casualPercent}%`} icon={Target} variant={casualPercent > 25 ? 'danger' : casualPercent > 15 ? 'warning' : 'success'} size="sm" />
        <StatCard label="Perm $/hr" value={`$${avgPermRate}`} icon={Banknote} size="sm" />
        <StatCard label="Casual $/hr" value={`$${avgCasualRate}`} icon={TrendingUp} size="sm" />
        <StatCard label="Loading Premium" value={`$${(totalPremium / 1000).toFixed(1)}k`} icon={Users} variant={totalPremium > 50000 ? 'danger' : 'default'} subtitle="potential savings" size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {casualPercent > 20 && <InsightCard type="action" title="High Casual Dependency" description={`${casualPercent}% of labour costs are casual. Converting top-hour casuals could save $${(totalPremium / 1000).toFixed(0)}k in loading premiums.`} action="Build casual-to-permanent conversion business case" />}
        {casualPercent <= 15 && <InsightCard type="positive" title="Efficient Contract Mix" description={`Casual costs at ${casualPercent}% of total are within the optimal range, balancing flexibility with cost efficiency.`} />}
        {totalPremium > 20000 && <InsightCard type="neutral" title="Conversion Opportunity" description={`$${(totalPremium / 1000).toFixed(1)}k annual premium from casual loading. Assess if conversion reduces net costs after entitlements.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Permanent', value: `$${(totalPerm / 1000).toFixed(0)}k`, highlight: true }, { label: 'Casual', value: `$${(totalCasual / 1000).toFixed(0)}k` },
        { label: 'Casual %', value: `${casualPercent}%` }, { label: 'Rate Diff', value: `+$${(Number(avgCasualRate) - Number(avgPermRate)).toFixed(2)}/hr` },
        { label: 'Total Premium', value: `$${(totalPremium / 1000).toFixed(1)}k` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Trend by Period</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="permanent" name="Permanent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="casual" name="Casual" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Split</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={costPie} cursor="pointer" onClick={(_, index) => { const d = costPie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.location}-${r.period}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
