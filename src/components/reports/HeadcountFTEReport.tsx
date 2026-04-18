import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockHeadcountData, HeadcountRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Users, Briefcase, TrendingUp, AlertTriangle, Target, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const locations = [...new Set(mockHeadcountData.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Department', accessor: 'department' }, { header: 'Location', accessor: 'location' },
  { header: 'Headcount', accessor: 'totalHeadcount' }, { header: 'FTE', accessor: 'fte' },
  { header: 'Full Time', accessor: 'fullTime' }, { header: 'Part Time', accessor: 'partTime' },
  { header: 'Casual', accessor: 'casual' }, { header: 'Contractor', accessor: 'contractor' },
];

const tableColumns: DataTableColumn<HeadcountRecord>[] = [
  { key: 'department', header: 'Department', type: 'enum', accessor: (r) => <span className="font-medium">{r.department}</span>, sortValue: (r) => r.department },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'totalHeadcount', header: 'Headcount', type: 'number', accessor: (r) => <span className="font-semibold">{r.totalHeadcount}</span>, sortValue: (r) => r.totalHeadcount, align: 'right' },
  { key: 'fte', header: 'FTE', type: 'number', accessor: (r) => r.fte.toFixed(1), sortValue: (r) => r.fte, align: 'right' },
  { key: 'fteRatio', header: 'FTE Ratio', type: 'number', align: 'right', sortValue: (r) => r.fte / r.totalHeadcount,
    accessor: (r) => {
      const ratio = (r.fte / r.totalHeadcount * 100);
      return <span className={cn('text-xs font-medium', ratio >= 85 ? 'text-emerald-600' : ratio >= 70 ? 'text-foreground' : 'text-amber-600')}>{ratio.toFixed(0)}%</span>;
    }
  },
  { key: 'fullTime', header: 'Full Time', type: 'date', accessor: (r) => r.fullTime, sortValue: (r) => r.fullTime, align: 'right' },
  { key: 'partTime', header: 'Part Time', type: 'date', accessor: (r) => r.partTime, sortValue: (r) => r.partTime, align: 'right' },
  { key: 'casual', header: 'Casual', type: 'text', accessor: (r) => r.casual > 0 ? <span className="text-amber-600">{r.casual}</span> : '—', sortValue: (r) => r.casual, align: 'right' },
  { key: 'contractor', header: 'Contractor', type: 'text', accessor: (r) => r.contractor > 0 ? <span className="text-blue-600">{r.contractor}</span> : '—', sortValue: (r) => r.contractor, align: 'right' },
  { key: 'newHires', header: 'New Hires', type: 'text', accessor: (r) => r.newHires > 0 ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">+{r.newHires}</Badge> : '—', sortValue: (r) => r.newHires, align: 'right' },
  { key: 'terminations', header: 'Terms', type: 'number', accessor: (r) => r.terminations > 0 ? <Badge variant="destructive" className="text-[10px]">-{r.terminations}</Badge> : '—', sortValue: (r) => r.terminations, align: 'right' },
  { key: 'turnoverRate', header: 'Turnover', type: 'number', align: 'right', sortValue: (r) => r.turnoverRate,
    accessor: (r) => r.turnoverRate > 0 ? <span className={cn('text-xs font-medium', r.turnoverRate > 5 ? 'text-destructive' : 'text-foreground')}>{r.turnoverRate}%</span> : <span className="text-emerald-600 text-xs">0%</span> },
  { key: 'avgTenureMonths', header: 'Avg Tenure', type: 'number', accessor: (r) => `${r.avgTenureMonths ?? 0}mo`, sortValue: (r) => r.avgTenureMonths ?? 0, align: 'right' },
  { key: 'vacancies', header: 'Vacancies', type: 'number', accessor: (r) => (r.vacancies ?? 0) > 0 ? <Badge variant="secondary" className="text-[10px]">{r.vacancies}</Badge> : <span className="text-muted-foreground text-xs">0</span>, sortValue: (r) => r.vacancies ?? 0, align: 'right' },
  { key: 'avgSalary', header: 'Avg Salary', type: 'number', accessor: (r) => `$${((r.avgSalary ?? 0) / 1000).toFixed(0)}k`, sortValue: (r) => r.avgSalary ?? 0, align: 'right' },
  { key: 'diversityPct', header: 'Diversity %', type: 'number', accessor: (r) => `${r.diversityPct ?? 0}%`, sortValue: (r) => r.diversityPct ?? 0, align: 'right' },
  { key: 'manager', header: 'Manager', type: 'enum', accessor: (r) => <span className="text-xs">{r.manager}</span>, sortValue: (r) => r.manager ?? '' },
  { key: 'headcountTrend', header: 'HC Trend (8wk)', type: 'sparkline', accessor: () => null, trendValues: (r: any) => r.headcountTrend ?? [] },
  { key: 'fteTrend', header: 'FTE Trend (8wk)', type: 'sparkline', accessor: () => null, trendValues: (r: any) => r.fteTrend ?? [] },
];

// Simulated trend data
const monthlyTrend = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m, i) => ({
  month: m, headcount: 110 + i * 2 + Math.round(Math.random() * 3), fte: 95 + i * 1.5, target: 125,
}));

export function HeadcountFTEReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockHeadcountData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.department.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), dateRange);
  }, [search, location]);

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


  const totals = useMemo(() => filtered.reduce((a, r) => ({
    headcount: a.headcount + r.totalHeadcount, fte: a.fte + r.fte,
    ft: a.ft + r.fullTime, pt: a.pt + r.partTime, cas: a.cas + r.casual, con: a.con + r.contractor,
    hires: a.hires + r.newHires, terms: a.terms + r.terminations,
  }), { headcount: 0, fte: 0, ft: 0, pt: 0, cas: 0, con: 0, hires: 0, terms: 0 }), [filtered, dateRange]);

  const fteRatio = totals.headcount > 0 ? (totals.fte / totals.headcount * 100).toFixed(1) : '0';
  const casualPct = totals.headcount > 0 ? Math.round((totals.cas / totals.headcount) * 100) : 0;

  const contractPie = [
    { name: 'Full Time', value: totals.ft }, { name: 'Part Time', value: totals.pt },
    { name: 'Casual', value: totals.cas }, { name: 'Contractor', value: totals.con },
  ];

  const byDepartment = useMemo(() => {
    const map: Record<string, { department: string; headcount: number; fte: number }> = {};
    filtered.forEach(r => {
      if (!map[r.department]) map[r.department] = { department: r.department, headcount: 0, fte: 0 };
      map[r.department].headcount += r.totalHeadcount;
      map[r.department].fte += r.fte;
    });
    return Object.values(map);
  }, [filtered]);

  const radarData = byDepartment.map(d => ({ department: d.department, headcount: d.headcount, fte: d.fte }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Headcount & FTE Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Staff Headcount & FTE Report"
        reportDescription="Comprehensive workforce sizing analysis showing actual headcount versus full-time equivalent (FTE) calculations across departments and locations."
        purpose="Provides a real-time view of workforce composition to support strategic planning, budgeting, and compliance reporting. The FTE metric normalises part-time and casual workers to enable accurate capacity comparisons."
        whenToUse={[
          'During quarterly workforce planning and budgeting cycles',
          'When assessing department staffing levels against operational demand',
          'For compliance reporting requiring FTE figures',
          'When evaluating the balance between permanent and contingent workforce',
          'Before making hiring or restructuring decisions',
        ]}
        keyMetrics={[
          { label: 'Total Headcount', description: 'Count of all active staff regardless of hours worked', interpretation: 'Shows the total number of people on payroll — useful for administrative capacity planning', goodRange: 'Within ±5% of target', warningRange: '5-10% deviation', criticalRange: '>10% deviation' },
          { label: 'Total FTE', description: 'Full-Time Equivalent — normalised to 38hr standard week', interpretation: 'A headcount of 10 part-timers at 19hrs = 5 FTE. Compare FTE to demand for true capacity assessment' },
          { label: 'FTE Ratio', description: 'FTE ÷ Headcount × 100', interpretation: 'Below 80% indicates heavy reliance on part-time/casual staff which increases scheduling complexity', goodRange: '≥85%', warningRange: '70-84%', criticalRange: '<70%' },
          { label: 'Casual %', description: 'Proportion of workforce on casual contracts', interpretation: 'High casual rates (>20%) increase labour costs due to loading but provide flexibility', goodRange: '<15%', warningRange: '15-25%', criticalRange: '>25%' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'The top row shows headline metrics with sparkline trends. Coloured variants (green/amber/red) indicate whether the metric is within acceptable thresholds. The trend indicator shows period-over-period change.' },
          { title: 'Headcount Trend Chart', content: 'The line chart tracks total headcount and FTE over the past 6 months against a target line. Growing gaps between headcount and FTE suggest increasing part-time/casual dependency.' },
          { title: 'Contract Mix Pie Chart', content: 'Shows the proportional split of contract types. Hover for exact numbers. A healthy mix typically has 60-70% full-time for operational stability.' },
          { title: 'Department Radar', content: 'Compares headcount and FTE across departments simultaneously. Departments where the FTE polygon is much smaller than headcount indicate high part-time usage.' },
          { title: 'Detail Table', content: 'Sortable and filterable by every column. The FTE Ratio column is colour-coded: green (≥85%), default (70-84%), amber (<70%). New hires show as green badges, terminations as red badges.' },
        ]}
        actionableInsights={[
          'If FTE Ratio drops below 80%, evaluate whether part-time roles can be consolidated into full-time positions',
          'Compare Net Change (Hires - Terms) month-over-month to detect attrition trends before they become critical',
          'Use the contract mix to assess cost implications — casuals carry 25% loading vs permanent staff',
          'Departments with high turnover rates (>5%) need immediate retention strategy review',
        ]}
        relatedReports={['Turnover & Retention', 'Contract Type Distribution', 'Labour Cost by Location', 'Availability vs Scheduled']}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Headcount" value={totals.headcount} icon={Users} sparklineData={monthlyTrend.map(d => d.headcount)} trend={{ value: totals.hires - totals.terms, label: 'net change this period' }} size="sm" />
        <StatCard label="Total FTE" value={totals.fte.toFixed(1)} icon={Briefcase} sparklineData={monthlyTrend.map(d => d.fte)} size="sm" />
        <StatCard label="FTE Ratio" value={`${fteRatio}%`} icon={Target} variant={Number(fteRatio) >= 85 ? 'success' : Number(fteRatio) >= 70 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="New Hires" value={totals.hires} icon={UserCheck} variant="success" size="sm" />
        <StatCard label="Terminations" value={totals.terms} icon={AlertTriangle} variant={totals.terms > 3 ? 'danger' : 'default'} size="sm" />
        <StatCard label="Casual %" value={`${casualPct}%`} icon={TrendingUp} variant={casualPct > 25 ? 'danger' : casualPct > 15 ? 'warning' : 'default'} size="sm" />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totals.hires > totals.terms && <InsightCard type="positive" title="Positive Net Growth" description={`${totals.hires - totals.terms} net new staff added this period, indicating healthy workforce expansion.`} metric={`+${totals.hires - totals.terms} net headcount`} />}
        {casualPct > 20 && <InsightCard type="action" title="High Casual Dependency" description={`${casualPct}% of workforce is casual, increasing labour costs by approximately ${Math.round(casualPct * 0.25)}% due to loading.`} action="Review casual-to-permanent conversion opportunities" />}
        {Number(fteRatio) < 80 && <InsightCard type="negative" title="Low FTE Efficiency" description={`FTE ratio of ${fteRatio}% suggests significant part-time fragmentation. Consider consolidating roles for better coverage.`} metric={`${(totals.headcount - totals.fte).toFixed(0)} headcount-FTE gap`} />}
        {totals.terms === 0 && <InsightCard type="positive" title="Zero Terminations" description="No staff departures this period — excellent retention performance across all departments." />}
      </div>

      <SummaryRow items={[
        { label: 'Full Time', value: totals.ft, highlight: true }, { label: 'Part Time', value: totals.pt },
        { label: 'Casual', value: totals.cas }, { label: 'Contractor', value: totals.con },
        { label: 'Net Change', value: `+${totals.hires - totals.terms}`, highlight: true },
      ]} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="headcount" name="Headcount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fte" name="FTE" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Contract Type Mix</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={contractPie} cursor="pointer" onClick={(_, index) => { const d = contractPie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {contractPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Department Profile</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="department" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Headcount" dataKey="headcount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                <Radar name="FTE" dataKey="fte" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Department Bar Chart */}
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount vs FTE by Department</CardTitle></CardHeader>
        <CardContent>
          <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDepartment} onClick={(e: any) => { if (e?.activeLabel) applyDrill('department', e.activeLabel); }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="headcount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Headcount" />
              <Bar dataKey="fte" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="FTE" />
            </BarChart>
          </ResponsiveContainer></AnimatedChartWrapper>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Detailed Breakdown</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.department}-${r.location}-${i}`} reportId="headcount-fte" exportTitle="Headcount &amp; FTE" /></CardContent>
      </Card>
    </div>
  );
}
