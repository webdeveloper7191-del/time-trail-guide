import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockAgencyUsage, AgencyUsageRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { Building2, DollarSign, Clock, Star, AlertTriangle, TrendingDown } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Agency', accessor: 'agencyName' }, { header: 'Shifts', accessor: 'shiftsProvided' },
  { header: 'Hours', accessor: 'totalHours' }, { header: 'Total Cost', accessor: (r: any) => `$${r.totalCost}` },
  { header: 'Avg Rate', accessor: (r: any) => `$${r.avgHourlyRate}/h` }, { header: 'Fill Rate %', accessor: 'fillRate' },
  { header: 'Response Time (h)', accessor: 'avgResponseTimeHours' }, { header: 'Quality Score', accessor: 'qualityScore' },
  { header: 'Cancellation %', accessor: 'cancellationRate' },
];

const tableColumns: DataTableColumn<AgencyUsageRecord>[] = [
  { key: 'agencyName', header: 'Agency', accessor: (r) => (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', r.qualityScore >= 85 ? 'bg-emerald-500' : r.qualityScore >= 70 ? 'bg-amber-500' : 'bg-red-500')} />

      <span className="font-medium">{r.agencyName}</span>
    </div>
  ), sortValue: (r) => r.agencyName },
  { key: 'shiftsProvided', header: 'Shifts', type: 'number', accessor: (r) => r.shiftsProvided, sortValue: (r) => r.shiftsProvided, align: 'right' },
  { key: 'totalHours', header: 'Hours', type: 'number', accessor: (r) => `${r.totalHours}h`, sortValue: (r) => r.totalHours, align: 'right' },
  { key: 'totalCost', header: 'Total Cost', type: 'number', accessor: (r) => <span className="font-semibold">${r.totalCost.toLocaleString()}</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'avgHourlyRate', header: 'Avg Rate', type: 'number', accessor: (r) => (
    <span className={cn('text-xs', r.avgHourlyRate > 55 ? 'text-destructive font-medium' : '')}>${r.avgHourlyRate}/h</span>
  ), sortValue: (r) => r.avgHourlyRate, align: 'right' },
  { key: 'fillRate', header: 'Fill Rate', type: 'number', className: 'w-[130px]', sortValue: (r) => r.fillRate,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.fillRate} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium w-10 text-right', r.fillRate < 70 ? 'text-destructive' : '')}>{r.fillRate}%</span>
      </div>
    ) },
  { key: 'avgResponseTimeHours', header: 'Response', type: 'number', sortValue: (r) => r.avgResponseTimeHours, align: 'right',
    accessor: (r) => <span className={cn('text-xs', r.avgResponseTimeHours > 3 ? 'text-destructive font-medium' : '')}>{r.avgResponseTimeHours}h</span> },
  { key: 'qualityScore', header: 'Quality', type: 'number', className: 'w-[130px]', sortValue: (r) => r.qualityScore,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.qualityScore} className={cn('h-2 flex-1')} />
        <span className={cn('text-xs font-medium w-8 text-right', r.qualityScore < 70 ? 'text-destructive' : '')}>{r.qualityScore}</span>
      </div>
    ) },
  { key: 'cancellationRate', header: 'Cancel %', type: 'number', align: 'right', sortValue: (r) => r.cancellationRate,
    accessor: (r) => <span className={cn(r.cancellationRate > 5 ? 'text-destructive font-medium' : 'text-muted-foreground')}>{r.cancellationRate}%</span> },
];

export function AgencyUsageReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const baseFiltered = mockAgencyUsage.filter(r => !search || r.agencyName.toLowerCase().includes(search.toLowerCase()));

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
  const totalShifts = filtered.reduce((s, r) => s + r.shiftsProvided, 0);
  const totalHours = filtered.reduce((s, r) => s + r.totalHours, 0);
  const avgRate = Math.round(filtered.reduce((s, r) => s + r.avgHourlyRate, 0) / (filtered.length || 1));
  const avgFillRate = Math.round(filtered.reduce((s, r) => s + r.fillRate, 0) / (filtered.length || 1));
  const avgQuality = Math.round(filtered.reduce((s, r) => s + r.qualityScore, 0) / (filtered.length || 1));
  const avgResponse = (filtered.reduce((s, r) => s + r.avgResponseTimeHours, 0) / (filtered.length || 1)).toFixed(1);
  const highCancelAgencies = filtered.filter(r => r.cancellationRate > 5).length;
  const internalRate = 35; // estimated internal avg hourly cost
  const agencyPremium = Math.round(((avgRate - internalRate) / internalRate) * 100);

  const costShare = filtered.map(r => ({ name: r.agencyName, value: r.totalCost }));
  const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--destructive))', '#10B981', '#8B5CF6', '#EC4899'];

  const radarData = filtered.slice(0, 5).map(r => ({
    agency: r.agencyName.split(' ')[0],
    fill: Math.min(100, r.fillRate),
    quality: r.qualityScore,
    response: Math.max(0, 100 - r.avgResponseTimeHours * 20),
    reliability: Math.max(0, 100 - r.cancellationRate * 10),
    value: Math.min(100, 100 - ((r.avgHourlyRate - 30) / 30) * 100),
  }));

  const performanceChart = filtered.map(r => ({
    name: r.agencyName.split(' ')[0],
    cost: r.totalCost,
    quality: r.qualityScore,
    fillRate: r.fillRate,
  }));

  const insights = useMemo(() => {
    const result = [];
    const bestValue = filtered.reduce((best, r) => (!best || (r.qualityScore / r.avgHourlyRate) > (best.qualityScore / best.avgHourlyRate)) ? r : best, null as AgencyUsageRecord | null);
    if (bestValue) result.push({ type: 'positive' as const, title: `Best value: ${bestValue.agencyName}`, description: `Highest quality-to-cost ratio with quality score ${bestValue.qualityScore} at $${bestValue.avgHourlyRate}/hr. Consider increasing allocation to this agency.`, metric: `${bestValue.qualityScore} quality / $${bestValue.avgHourlyRate} rate` });
    if (highCancelAgencies > 0) result.push({ type: 'negative' as const, title: `${highCancelAgencies} agencies with high cancellation rates`, description: `Cancellation rates above 5% disrupt operations and create last-minute staffing gaps. Each cancelled shift costs approximately $150-200 in rebooking and operational disruption.`, metric: `Est. $${(highCancelAgencies * 175 * 4).toLocaleString()} monthly disruption cost`, action: 'Review agency SLAs and consider penalty clauses for cancellations' });
    if (agencyPremium > 30) result.push({ type: 'action' as const, title: `Agency premium at ${agencyPremium}% above internal rates`, description: `The average agency rate of $${avgRate}/hr is ${agencyPremium}% higher than the estimated internal cost of $${internalRate}/hr. Converting ${Math.ceil(totalShifts * 0.2)} agency shifts to permanent roles could save ~$${Math.round(totalCost * 0.15).toLocaleString()}/period.`, action: 'Analyse top agency-dependent shifts for permanent hire conversion' });
    const slowAgency = filtered.find(r => r.avgResponseTimeHours > 4);
    if (slowAgency) result.push({ type: 'neutral' as const, title: `Slow response from ${slowAgency.agencyName}`, description: `Average response time of ${slowAgency.avgResponseTimeHours}h is above the 2-hour SLA target. Slow responses reduce fill rates and force reliance on backup agencies at higher rates.`, action: 'Discuss SLA improvements or deprioritise in broadcast order' });
    return result;
  }, [filtered, highCancelAgencies, agencyPremium, avgRate, totalCost, totalShifts]);

  return (
    <div className="space-y-6">
      <ReportHelpGuide
        reportName="Agency Usage & Cost Report"
        reportDescription="A comprehensive analysis of external agency performance, costs, and value-for-money across all staffing partners. Combines financial data with quality and reliability metrics."
        purpose="To optimise agency spending by identifying the best-performing agencies, flagging underperformers, and providing data for contract renegotiations and permanent hire decisions."
        whenToUse={[
          'Quarterly agency contract reviews and renegotiations',
          'When agency spend exceeds budget thresholds',
          'Before onboarding a new staffing agency',
          'When evaluating whether to convert agency shifts to permanent roles',
          'During annual workforce planning and budgeting cycles',
        ]}
        keyMetrics={[
          { label: 'Fill Rate', description: 'Percentage of requested shifts that the agency successfully filled with qualified staff.', interpretation: 'Below 70% indicates the agency lacks capacity or suitable candidates for your requirements.', goodRange: '≥85%', warningRange: '70-84%', criticalRange: '<70%' },
          { label: 'Quality Score (0-100)', description: 'Composite score based on staff feedback, qualification match accuracy, punctuality of placed workers, and manager satisfaction ratings.', interpretation: 'Below 70 suggests persistent quality issues that may affect service delivery.', goodRange: '≥85', warningRange: '70-84', criticalRange: '<70' },
          { label: 'Response Time', description: 'Average time from shift broadcast to agency confirmation, measured in hours.', interpretation: 'Faster response = higher fill likelihood. Above 4 hours for same-day requests is poor.', goodRange: '≤2h', warningRange: '2-4h', criticalRange: '>4h' },
          { label: 'Cancellation Rate', description: 'Percentage of confirmed shifts subsequently cancelled by the agency. Excludes client-initiated cancellations.', interpretation: 'High cancellation rates create operational disruption and additional costs.', goodRange: '≤3%', warningRange: '3-5%', criticalRange: '>5%' },
          { label: 'Agency Premium', description: 'Percentage difference between average agency hourly rate and internal staff cost (including on-costs).', interpretation: 'A premium above 30% may justify converting frequent agency shifts to permanent positions.' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'The top row shows aggregate metrics across all agencies:\n• Total Spend: Monitor against budget allocation\n• Avg Fill Rate: Below 80% means agencies aren\'t meeting demand\n• Avg Quality: Industry benchmark is 80+\n• Agency Premium: The markup over internal costs — use to justify permanent hires' },
          { title: 'Cost Share Pie Chart', content: 'Shows the distribution of spend across agencies. Over-reliance on a single agency (>50%) creates supply risk. Aim for 2-3 primary agencies with roughly equal share, plus 1-2 backup agencies.' },
          { title: 'Performance Comparison Bar Chart', content: 'Compare cost against quality side by side. The ideal agency has high quality (tall green bars) with moderate cost (shorter blue bars). Agencies with high cost but low quality are prime candidates for replacement.' },
          { title: 'Agency Performance Table', content: 'Sorted by total cost (highest first). Key visual cues:\n• Green dot = Quality ≥85\n• Red fill rate = Below 70%\n• Red response time = Above 3 hours\n• Red cancel % = Above 5% — potential SLA breach' },
        ]}
        actionableInsights={[
          'Rank agencies by quality-to-cost ratio (quality score ÷ hourly rate) to find best value',
          'For agencies with >5% cancellation, implement penalty clauses or move to backup status',
          'Calculate the breakeven point where converting agency shifts to permanent roles saves money',
          'Use response time data to optimise broadcast priority order for open shifts',
          'Review agencies with fill rates below 70% — they may lack suitable candidates for your sector',
        ]}
        relatedReports={['Open Shift Fill Rate', 'Labour Cost by Location', 'Casual vs Permanent Cost']}
      />

      <ReportFilterBar title="Agency Usage & Cost Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search agency..." exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Agency Spend" value={`$${(totalCost / 1000).toFixed(1)}k`} icon={DollarSign}
          trend={{ value: 5.2, label: 'vs last period' }} sparklineData={[18, 22, 19, 25, 24, 28]} />
        <StatCard label="Total Shifts" value={totalShifts} icon={Building2}
          subtitle={`${totalHours}h total`} />
        <StatCard label="Avg Fill Rate" value={`${avgFillRate}%`} icon={Star}
          variant={avgFillRate < 80 ? 'warning' : 'success'} sparklineData={[78, 82, 80, 85, 83, avgFillRate]} />
        <StatCard label="Avg Quality" value={`${avgQuality}/100`} icon={Star}
          variant={avgQuality < 70 ? 'danger' : avgQuality < 80 ? 'warning' : 'default'} />
        <StatCard label="Avg Response" value={`${avgResponse}h`} icon={Clock}
          variant={Number(avgResponse) > 3 ? 'warning' : 'default'} subtitle="Target: ≤2h" />
        <StatCard label="Agency Premium" value={`+${agencyPremium}%`} icon={TrendingDown}
          variant={agencyPremium > 30 ? 'danger' : agencyPremium > 20 ? 'warning' : 'default'} subtitle={`vs $${internalRate}/h internal`} />
      </div>

      <SummaryRow items={[
        { label: 'Agencies Active', value: filtered.length },
        { label: 'High Cancel (>5%)', value: highCancelAgencies, highlight: highCancelAgencies > 0 },
        { label: 'Low Quality (<70)', value: filtered.filter(r => r.qualityScore < 70).length },
        { label: 'Est. Savings if 20% Converted', value: `$${Math.round(totalCost * 0.15).toLocaleString()}`, highlight: true },
      ]} />

      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Share by Agency</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={costShare} cursor="pointer" onClick={(_, index) => { const d = costShare[index]; if (d) applyDrill(d.name ? 'category' : 'type', d.name || String(index), d.name || String(index)); }} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                  {costShare.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
        <Card className="border-border/60 col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Comparison</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={240}>
              <BarChart data={performanceChart} onClick={(e: any) => { if (e?.activeLabel) applyDrill('agencyName', e.activeLabel); }} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="cost" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis yAxisId="quality" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="cost" dataKey="cost" name="Cost ($)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="quality" dataKey="quality" name="Quality" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar yAxisId="quality" dataKey="fillRate" name="Fill Rate %" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Agency Performance Detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.agencyName} />
        </CardContent>
      </Card>
    </div>
  );
}
