import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockContractDistribution, ContractDistributionRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Users, Briefcase, Clock, AlertTriangle, Target, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const locations = [...new Set(mockContractDistribution.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Department', accessor: 'department' },
  { header: 'Full Time', accessor: 'fullTime' }, { header: 'Part Time', accessor: 'partTime' },
  { header: 'Casual', accessor: 'casual' }, { header: 'Contractor', accessor: 'contractor' },
  { header: 'Total', accessor: 'totalStaff' },
];

const tableColumns: DataTableColumn<ContractDistributionRecord>[] = [
  { key: 'location', header: 'Location', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'department', header: 'Department', accessor: (r) => r.department, sortValue: (r) => r.department },
  { key: 'fullTime', header: 'Full Time', accessor: (r) => r.fullTime, sortValue: (r) => r.fullTime, align: 'right' },
  { key: 'partTime', header: 'Part Time', accessor: (r) => r.partTime, sortValue: (r) => r.partTime, align: 'right' },
  { key: 'casual', header: 'Casual', accessor: (r) => r.casual > 0 ? <span className="text-amber-600 font-medium">{r.casual}</span> : '—', sortValue: (r) => r.casual, align: 'right' },
  { key: 'contractor', header: 'Contractor', accessor: (r) => r.contractor > 0 ? <span className="text-blue-600">{r.contractor}</span> : '—', sortValue: (r) => r.contractor, align: 'right' },
  { key: 'totalStaff', header: 'Total', accessor: (r) => <span className="font-semibold">{r.totalStaff}</span>, sortValue: (r) => r.totalStaff, align: 'right' },
  { key: 'permanentPct', header: 'Perm %', align: 'right', sortValue: (r) => (r.fullTime + r.partTime) / r.totalStaff * 100,
    accessor: (r) => { const pct = Math.round((r.fullTime + r.partTime) / r.totalStaff * 100); return <span className={cn('text-xs font-medium', pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-foreground' : 'text-amber-600')}>{pct}%</span>; }},
  { key: 'casualPct', header: 'Casual %', align: 'right', sortValue: (r) => r.casual / r.totalStaff * 100,
    accessor: (r) => { const pct = Math.round(r.casual / r.totalStaff * 100); return <span className={cn('text-xs', pct > 20 ? 'text-destructive font-medium' : 'text-muted-foreground')}>{pct}%</span>; }},
];

export function ContractDistributionReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockContractDistribution.filter(r => {
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
    ft: a.ft + r.fullTime, pt: a.pt + r.partTime, cas: a.cas + r.casual, con: a.con + r.contractor, total: a.total + r.totalStaff,
  }), { ft: 0, pt: 0, cas: 0, con: 0, total: 0 }), [filtered, dateRange]);

  const permanentPct = totals.total > 0 ? Math.round((totals.ft + totals.pt) / totals.total * 100) : 0;
  const casualPct = totals.total > 0 ? Math.round(totals.cas / totals.total * 100) : 0;
  const contractorPct = totals.total > 0 ? Math.round(totals.con / totals.total * 100) : 0;

  const pieData = [
    { name: 'Full Time', value: totals.ft }, { name: 'Part Time', value: totals.pt },
    { name: 'Casual', value: totals.cas }, { name: 'Contractor', value: totals.con },
  ];

  const byLocation = useMemo(() => {
    const map: Record<string, { location: string; fullTime: number; partTime: number; casual: number; contractor: number }> = {};
    filtered.forEach(r => {
      if (!map[r.location]) map[r.location] = { location: r.location, fullTime: 0, partTime: 0, casual: 0, contractor: 0 };
      map[r.location].fullTime += r.fullTime; map[r.location].partTime += r.partTime;
      map[r.location].casual += r.casual; map[r.location].contractor += r.contractor;
    });
    return Object.values(map);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Contract Type Distribution" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Contract Type Distribution Report"
        reportDescription="Analyses the composition of your workforce by employment contract type across locations and departments."
        purpose="Helps optimise the balance between permanent stability and contingent workforce flexibility while managing associated cost implications."
        whenToUse={[
          'During workforce planning to assess contract mix health', 'When evaluating casual-to-permanent conversion programs',
          'For budgeting — different contract types have different cost profiles', 'When assessing risk of over-reliance on contingent workers',
        ]}
        keyMetrics={[
          { label: 'Permanent %', description: '(Full Time + Part Time) ÷ Total × 100', interpretation: 'Healthy organisations maintain 70-85% permanent for operational stability', goodRange: '≥75%', warningRange: '60-74%', criticalRange: '<60%' },
          { label: 'Casual %', description: 'Casual ÷ Total × 100', interpretation: 'Casuals provide flexibility but cost 25% more due to loading', goodRange: '<15%', warningRange: '15-25%', criticalRange: '>25%' },
          { label: 'Contractor %', description: 'Contractor ÷ Total × 100', interpretation: 'High contractor rates may indicate difficulty retaining permanent staff', goodRange: '<5%', warningRange: '5-10%', criticalRange: '>10%' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Top row shows totals by contract type and key ratios. Amber/red variants flag unhealthy proportions.' },
          { title: 'Overall Distribution Pie', content: 'Shows proportional split across all contract types. A healthy pie should be dominated by Full Time and Part Time segments.' },
          { title: 'Distribution by Location', content: 'Stacked bars compare the contract mix at each location. Inconsistent patterns may indicate local management practices that need standardisation.' },
          { title: 'Detail Table', content: 'Perm % and Casual % columns are colour-coded to highlight departments with unhealthy ratios. Sort to find outliers.' },
        ]}
        actionableInsights={[
          'Departments with >25% casual should be evaluated for permanent conversion opportunities',
          'If contractor rates exceed 10%, review whether permanent hires would be more cost-effective long-term',
          'Compare contract mix across locations to identify sites deviating from organisational targets',
          'Calculate the annual cost premium of the current casual workforce vs permanent equivalents',
        ]}
        relatedReports={['Headcount & FTE', 'Casual vs Permanent Cost', 'Labour Cost by Location', 'Turnover & Retention']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Staff" value={totals.total} icon={Users} size="sm" />
        <StatCard label="Full Time" value={totals.ft} icon={Briefcase} size="sm" />
        <StatCard label="Part Time" value={totals.pt} icon={Clock} size="sm" />
        <StatCard label="Casual" value={totals.cas} icon={AlertTriangle} variant={casualPct > 25 ? 'danger' : casualPct > 15 ? 'warning' : 'default'} size="sm" />
        <StatCard label="Permanent %" value={`${permanentPct}%`} icon={Target} variant={permanentPct >= 75 ? 'success' : permanentPct >= 60 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Contingent %" value={`${casualPct + contractorPct}%`} icon={UserCheck} variant={casualPct + contractorPct > 30 ? 'danger' : 'default'} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {permanentPct >= 75 && <InsightCard type="positive" title="Healthy Permanent Base" description={`${permanentPct}% of workforce is permanent, providing operational stability and lower per-hour costs.`} />}
        {casualPct > 20 && <InsightCard type="action" title="Elevated Casual Dependency" description={`${casualPct}% casual workers adds ~${Math.round(totals.cas * 38 * 52 * 0.25 / 1000)}k annual cost premium from loading.`} action="Evaluate casual-to-permanent conversion program" />}
        {contractorPct > 5 && <InsightCard type="neutral" title="Contractor Usage" description={`${contractorPct}% contractor workforce. Review whether these roles can be converted to permanent for cost savings.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Full Time', value: totals.ft, highlight: true }, { label: 'Part Time', value: totals.pt },
        { label: 'Casual', value: totals.cas }, { label: 'Contractor', value: totals.con },
        { label: 'Permanent %', value: `${permanentPct}%`, highlight: true },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Overall Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cursor="pointer" onClick={(_, index) => { const d = pieData[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribution by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byLocation} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="location" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fullTime" stackId="a" fill={COLORS[0]} name="Full Time" />
                <Bar dataKey="partTime" stackId="a" fill={COLORS[1]} name="Part Time" />
                <Bar dataKey="casual" stackId="a" fill={COLORS[2]} name="Casual" />
                <Bar dataKey="contractor" stackId="a" fill={COLORS[3]} name="Contractor" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Department Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.location}-${r.department}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
