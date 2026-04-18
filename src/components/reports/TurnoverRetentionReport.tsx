import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockTurnoverData, TurnoverRecord } from '@/data/mockWorkforceReportData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { format, parseISO } from 'date-fns';
import { Users, TrendingDown, UserMinus, UserPlus, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: (r: any) => format(parseISO(r.month + '-01'), 'MMM yyyy') },
  { header: 'Hires', accessor: 'hires' }, { header: 'Terminations', accessor: 'terminations' },
  { header: 'Headcount', accessor: 'headcount' }, { header: 'Turnover %', accessor: 'turnoverRate' },
  { header: 'Retention %', accessor: 'retentionRate' }, { header: 'Avg Tenure', accessor: 'avgTenureMonths' },
];

const tableColumns: DataTableColumn<TurnoverRecord>[] = [
  { key: 'month', header: 'Month', type: 'date', accessor: (r) => <span className="font-medium">{format(parseISO(r.month + '-01'), 'MMM yyyy')}</span>, sortValue: (r) => r.month },
  { key: 'hires', header: 'Hires', type: 'text', accessor: (r) => <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">+{r.hires}</Badge>, sortValue: (r) => r.hires, align: 'right' },
  { key: 'voluntaryExits', header: 'Voluntary', type: 'text', accessor: (r) => r.voluntaryExits > 0 ? <span className="text-amber-600">{r.voluntaryExits}</span> : '—', sortValue: (r) => r.voluntaryExits, align: 'right' },
  { key: 'involuntaryExits', header: 'Involuntary', type: 'text', accessor: (r) => r.involuntaryExits > 0 ? <span className="text-destructive">{r.involuntaryExits}</span> : '—', sortValue: (r) => r.involuntaryExits, align: 'right' },
  { key: 'terminations', header: 'Total Terms', type: 'number', accessor: (r) => r.terminations, sortValue: (r) => r.terminations, align: 'right' },
  { key: 'headcount', header: 'Headcount', type: 'number', accessor: (r) => <span className="font-semibold">{r.headcount}</span>, sortValue: (r) => r.headcount, align: 'right' },
  { key: 'turnoverRate', header: 'Turnover %', type: 'number', align: 'right', sortValue: (r) => r.turnoverRate,
    accessor: (r) => <Badge variant={r.turnoverRate > 2 ? 'destructive' : 'secondary'} className="text-[10px]">{r.turnoverRate}%</Badge> },
  { key: 'retentionRate', header: 'Retention %', type: 'number', align: 'right', sortValue: (r) => r.retentionRate,
    accessor: (r) => <span className={cn('text-xs font-medium', r.retentionRate >= 98 ? 'text-emerald-600' : 'text-amber-600')}>{r.retentionRate}%</span> },
  { key: 'avgTenureMonths', header: 'Avg Tenure', type: 'number', accessor: (r) => `${r.avgTenureMonths}m`, sortValue: (r) => r.avgTenureMonths, align: 'right' },
  { key: 'netChange', header: 'Net', type: 'number', align: 'right', sortValue: (r) => r.hires - r.terminations,
    accessor: (r) => { const net = r.hires - r.terminations; return <span className={cn('font-medium text-xs', net > 0 ? 'text-emerald-600' : net < 0 ? 'text-destructive' : 'text-foreground')}>{net > 0 ? '+' : ''}{net}</span>; }},
  { key: 'turnoverRateTrend', header: 'Turnover Trend (8mo)', type: 'sparkline', accessor: () => null, trendValues: (r: any) => r.turnoverRateTrend ?? [] },
];

export function TurnoverRetentionReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    if (!search) return mockTurnoverData;
    return filterByDateRange(mockTurnoverData.filter(r => r.month.includes(search)), dateRange);
  }, [search]);

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


  const totalHires = filtered.reduce((s, r) => s + r.hires, 0);
  const totalTerms = filtered.reduce((s, r) => s + r.terminations, 0);
  const totalVoluntary = filtered.reduce((s, r) => s + r.voluntaryExits, 0);
  const avgRetention = filtered.length ? (filtered.reduce((s, r) => s + r.retentionRate, 0) / filtered.length).toFixed(1) : '0';
  const avgTurnover = filtered.length ? (filtered.reduce((s, r) => s + r.turnoverRate, 0) / filtered.length).toFixed(1) : '0';
  const latestHeadcount = filtered.length ? filtered[filtered.length - 1].headcount : 0;
  const voluntaryPct = totalTerms > 0 ? Math.round((totalVoluntary / totalTerms) * 100) : 0;

  const exitPie = [
    { name: 'Voluntary', value: totalVoluntary },
    { name: 'Involuntary', value: totalTerms - totalVoluntary },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Turnover & Retention" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search months..." exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Staff Turnover & Retention Report"
        reportDescription="Tracks workforce stability by measuring hiring, separations, retention rates, and tenure trends over time. Distinguishes between voluntary and involuntary exits."
        purpose="Enables proactive workforce retention management by identifying turnover patterns, seasonal spikes, and departments at risk of losing talent."
        whenToUse={[
          'Monthly HR review meetings to track workforce stability',
          'When planning retention initiatives or salary reviews',
          'During budgeting to forecast recruitment costs',
          'When investigating sudden staffing shortfalls',
          'For board-level workforce health reporting',
        ]}
        keyMetrics={[
          { label: 'Turnover Rate', description: 'Terminations ÷ Headcount × 100 (monthly)', interpretation: 'Industry average is ~1.5%/month. Sustained rates above 2% indicate systemic issues', goodRange: '<1.5%', warningRange: '1.5-2.5%', criticalRange: '>2.5%' },
          { label: 'Retention Rate', description: '100% − Turnover Rate', interpretation: 'Should consistently stay above 97%. Dropping below indicates accelerating attrition', goodRange: '≥98%', warningRange: '96-97.9%', criticalRange: '<96%' },
          { label: 'Voluntary Exit %', description: 'Proportion of exits that are employee-initiated', interpretation: 'High voluntary rates (>70%) suggest engagement or compensation issues', goodRange: '<50%', warningRange: '50-70%', criticalRange: '>70%' },
          { label: 'Net Change', description: 'Hires − Terminations per period', interpretation: 'Negative values mean the workforce is shrinking. Sustained negative trend requires immediate action' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Top row shows period aggregates. The retention sparkline helps spot declining trends. Red/amber variants signal metrics outside acceptable ranges.' },
          { title: 'Hires vs Terminations', content: 'Stacked bar chart compares monthly inflows and outflows. The net change line overlaid shows whether you\'re growing or shrinking. Bars above the line = growth.' },
          { title: 'Retention Trend', content: 'Area chart showing retention rate over time with a 97% target line. Dips below the line require investigation. The gradient fill makes trends visually obvious.' },
          { title: 'Exit Type Analysis', content: 'Pie chart breaking down voluntary vs involuntary separations. High voluntary percentages indicate pull factors (better offers) or push factors (poor engagement).' },
        ]}
        actionableInsights={[
          'If voluntary exits exceed 60%, conduct stay interviews to identify retention drivers',
          'When turnover rate exceeds 2% for 3+ consecutive months, escalate to leadership for intervention',
          'Cross-reference high-turnover months with annual events (bonus payouts, performance reviews) to find patterns',
          'Calculate cost of turnover at ~$15,000 per departure to quantify business impact for leadership',
        ]}
        relatedReports={['Headcount & FTE', 'Onboarding Completion', 'Labour Cost by Location', 'Contract Type Distribution']}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Current Headcount" value={latestHeadcount} icon={Users} sparklineData={filtered.map(d => d.headcount)} size="sm" />
        <StatCard label="Total Hires" value={totalHires} icon={UserPlus} variant="success" size="sm" />
        <StatCard label="Total Separations" value={totalTerms} icon={UserMinus} variant={totalTerms > totalHires ? 'danger' : 'default'} size="sm" />
        <StatCard label="Avg Turnover" value={`${avgTurnover}%`} icon={TrendingDown} variant={Number(avgTurnover) > 2 ? 'danger' : 'default'} size="sm" />
        <StatCard label="Avg Retention" value={`${avgRetention}%`} icon={Target} sparklineData={filtered.map(d => d.retentionRate)} variant={Number(avgRetention) >= 98 ? 'success' : 'warning'} size="sm" />
        <StatCard label="Voluntary Exit %" value={`${voluntaryPct}%`} icon={Clock} variant={voluntaryPct > 70 ? 'danger' : voluntaryPct > 50 ? 'warning' : 'default'} size="sm" />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totalHires > totalTerms && <InsightCard type="positive" title="Net Workforce Growth" description={`+${totalHires - totalTerms} net new staff over ${filtered.length} months. Recruitment is outpacing attrition.`} metric={`${((totalHires - totalTerms) / latestHeadcount * 100).toFixed(1)}% growth`} />}
        {voluntaryPct > 60 && <InsightCard type="negative" title="High Voluntary Exits" description={`${voluntaryPct}% of departures are employee-initiated, suggesting engagement or compensation concerns.`} action="Schedule stay interviews with high-risk teams" />}
        {Number(avgRetention) >= 98 && <InsightCard type="positive" title="Strong Retention" description={`Average retention of ${avgRetention}% exceeds the 97% benchmark. Current strategies are effective.`} />}
        {Number(avgTurnover) > 2 && <InsightCard type="action" title="Elevated Turnover" description={`Average monthly turnover of ${avgTurnover}% exceeds the 1.5% benchmark. Estimated cost: $${(totalTerms * 15000).toLocaleString()}.`} action="Review compensation and exit interview data" />}
      </div>

      <SummaryRow items={[
        { label: 'Period', value: `${filtered.length} months` }, { label: 'Total Hires', value: totalHires, highlight: true },
        { label: 'Total Exits', value: totalTerms }, { label: 'Voluntary', value: totalVoluntary },
        { label: 'Net Change', value: `+${totalHires - totalTerms}`, highlight: true },
      ]} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Hires vs Terminations</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.map(r => ({ ...r, label: format(parseISO(r.month + '-01'), 'MMM'), net: r.hires - r.terminations }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hires" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Hires" />
                <Bar dataKey="terminations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Terminations" />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Retention Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <AreaChart data={filtered.map(r => ({ ...r, label: format(parseISO(r.month + '-01'), 'MMM'), target: 97 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={[95, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="retentionRate" name="Retention %" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="Target" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Exit Type Analysis</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={exitPie} cursor="pointer" onClick={(_, index) => { const d = exitPie[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {exitPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Monthly Details</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.month} reportId="turnover-retention" exportTitle="Turnover &amp; Retention" /></CardContent>
      </Card>
    </div>
  );
}
