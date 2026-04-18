import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAreaUtil, AreaUtilRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { Building2, Users, TrendingUp, AlertTriangle, BarChart3, Gauge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Category', accessor: 'serviceCategory' }, { header: 'Capacity', accessor: 'capacity' },
  { header: 'Avg Occupancy', accessor: 'avgOccupancy' }, { header: 'Peak Occupancy', accessor: 'peakOccupancy' },
  { header: 'Utilisation %', accessor: 'utilisationPercent' }, { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockAreaUtil.map(r => r.locationName))];
const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const tableColumns: DataTableColumn<AreaUtilRecord>[] = [
  { key: 'locationName', header: 'Location', type: 'text', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', type: 'text', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'serviceCategory', header: 'Category', type: 'enum', accessor: (r) => <Badge variant="outline" className="text-xs">{r.serviceCategory}</Badge>, sortValue: (r) => r.serviceCategory },
  { key: 'capacity', header: 'Capacity', type: 'number', accessor: (r) => r.capacity, sortValue: (r) => r.capacity, align: 'right' },
  { key: 'avgOccupancy', header: 'Avg Occ.', type: 'number', accessor: (r) => r.avgOccupancy, sortValue: (r) => r.avgOccupancy, align: 'right' },
  { key: 'peakOccupancy', header: 'Peak', type: 'number', accessor: (r) => r.peakOccupancy, sortValue: (r) => r.peakOccupancy, align: 'right' },
  { key: 'utilisationPercent', header: 'Utilisation', type: 'number', className: 'w-[160px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.utilisationPercent} className="h-2 flex-1" />

        <span className={cn('text-xs font-medium w-10 text-right', r.utilisationPercent >= 90 ? 'text-destructive' : r.utilisationPercent >= 75 ? 'text-amber-600' : 'text-foreground')}>{r.utilisationPercent}%</span>
      </div>
    ) },
  { key: 'status', header: 'Status', type: 'enum', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="text-xs">{r.status}</Badge> },
  { key: 'freeHours', header: 'Free Hrs', type: 'number', accessor: (r) => `${r.freeHours ?? 0}h`, sortValue: (r) => r.freeHours ?? 0, align: 'right' },
  { key: 'bookings', header: 'Bookings', type: 'number', accessor: (r) => r.bookings ?? 0, sortValue: (r) => r.bookings ?? 0, align: 'right' },
  { key: 'staffAssigned', header: 'Staff', type: 'number', accessor: (r) => r.staffAssigned ?? 0, sortValue: (r) => r.staffAssigned ?? 0, align: 'right' },
  { key: 'revenueImpact', header: 'Revenue', type: 'number', accessor: (r) => <span className="font-semibold">${(r.revenueImpact ?? 0).toLocaleString()}</span>, sortValue: (r) => r.revenueImpact ?? 0, align: 'right' },
  { key: 'efficiencyScore', header: 'Efficiency', type: 'number', accessor: (r) => <Badge variant={(r.efficiencyScore ?? 0) >= 80 ? 'outline' : (r.efficiencyScore ?? 0) >= 60 ? 'secondary' : 'destructive'} className="text-[10px]">{r.efficiencyScore ?? 0}%</Badge>, sortValue: (r) => r.efficiencyScore ?? 0, align: 'right' },
  { key: 'utilisationTrend', header: 'Util Trend (8wk)', type: 'sparkline', trendValues: (r: any) => r.utilisationTrend ?? [], accessor: () => null },
];

export function AreaUtilReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockAreaUtil.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.serviceCategory.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
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


  const activeAreas = filtered.filter(r => r.status === 'active');
  const avgUtil = Math.round(activeAreas.reduce((s, r) => s + r.utilisationPercent, 0) / (activeAreas.length || 1));
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const totalOccupancy = filtered.reduce((s, r) => s + r.avgOccupancy, 0);
  const unusedCapacity = totalCapacity - totalOccupancy;
  const overutilised = filtered.filter(r => r.utilisationPercent >= 90);
  const underutilised = filtered.filter(r => r.utilisationPercent < 50);
  const peakAvg = Math.round(filtered.reduce((s, r) => s + r.peakOccupancy, 0) / (filtered.length || 1));

  // Distribution data
  const distBuckets = [
    { range: '0-25%', count: filtered.filter(r => r.utilisationPercent < 25).length },
    { range: '25-50%', count: filtered.filter(r => r.utilisationPercent >= 25 && r.utilisationPercent < 50).length },
    { range: '50-75%', count: filtered.filter(r => r.utilisationPercent >= 50 && r.utilisationPercent < 75).length },
    { range: '75-90%', count: filtered.filter(r => r.utilisationPercent >= 75 && r.utilisationPercent < 90).length },
    { range: '90-100%', count: filtered.filter(r => r.utilisationPercent >= 90).length },
  ];

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return {
      name: loc.split(' ')[0],
      util: Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / (items.length || 1)),
      capacity: items.reduce((s, r) => s + r.capacity, 0),
      occupancy: items.reduce((s, r) => s + r.avgOccupancy, 0),
    };
  });

  // Radar for category utilisation
  const categories = [...new Set(filtered.map(r => r.serviceCategory))];
  const radarData = categories.map(cat => {
    const items = filtered.filter(r => r.serviceCategory === cat);
    return { category: cat.length > 12 ? cat.slice(0, 12) + '…' : cat, utilisation: Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / (items.length || 1)) };
  });

  // Weekly trend
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrend = weekDays.map((d, i) => ({ day: d, util: Math.round(avgUtil * (0.7 + Math.sin(i * 0.8) * 0.2 + Math.random() * 0.15)) }));

  const sparkline6 = [avgUtil - 8, avgUtil - 3, avgUtil - 5, avgUtil + 2, avgUtil - 1, avgUtil];

  const insights = useMemo(() => {
    const result: { type: 'positive' | 'negative' | 'action' | 'neutral'; title: string; description: string; metric?: string; action?: string }[] = [];
    if (avgUtil >= 70 && avgUtil <= 85) {
      result.push({ type: 'positive', title: 'Optimal Utilisation Range', description: `Average utilisation of ${avgUtil}% is within the optimal 70-85% band, balancing efficiency with flexibility.` });
    } else if (avgUtil > 85) {
      result.push({ type: 'negative', title: 'Near-Capacity Risk', description: `Average utilisation of ${avgUtil}% is above 85%. Areas may lack flexibility for demand surges.`, action: 'Consider capacity expansion or load balancing' });
    } else {
      result.push({ type: 'action', title: 'Low Utilisation Detected', description: `Average utilisation of ${avgUtil}% suggests significant underuse. ${unusedCapacity} unused capacity slots across all areas.`, metric: `${unusedCapacity} unused slots`, action: 'Review area combining opportunities' });
    }
    if (overutilised.length > 0) {
      result.push({ type: 'negative', title: `${overutilised.length} Areas Over 90% Capacity`, description: `These areas are near maximum capacity: ${overutilised.slice(0, 3).map(r => r.areaName).join(', ')}${overutilised.length > 3 ? '…' : ''}.`, action: 'Assess demand redistribution or expansion' });
    }
    if (underutilised.length > 0) {
      result.push({ type: 'action', title: `${underutilised.length} Areas Below 50% Utilisation`, description: `These low-utilisation areas may be candidates for consolidation or repurposing.`, metric: `${Math.round(underutilised.reduce((s, r) => s + (r.capacity - r.avgOccupancy), 0))} wasted capacity`, action: 'Review Area Combining Savings report' });
    }
    if (peakAvg > avgUtil * 1.3) {
      result.push({ type: 'neutral', title: 'High Peak-to-Average Ratio', description: `Peak occupancy is ${Math.round((peakAvg / avgUtil - 1) * 100)}% higher than average, suggesting significant demand variability.`, action: 'Consider flexible staffing arrangements for peak periods' });
    }
    return result;
  }, [filtered, avgUtil, unusedCapacity, overutilised, underutilised, peakAvg]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Area Utilisation Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search areas..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="Area Utilisation Report"
        reportDescription="Detailed analysis of space and capacity utilisation across all operational areas, tracking average and peak occupancy against total capacity to identify optimisation opportunities."
        purpose="This report helps operations managers understand how effectively physical spaces and operational areas are being used. It identifies both over-capacity risks (quality/compliance concerns) and under-utilisation (cost inefficiency), enabling data-driven decisions about space allocation, area combining, and capacity planning."
        whenToUse={[
          'During capacity planning sessions to determine if areas need expansion or consolidation',
          'When assessing whether area combining recommendations should be implemented',
          'To identify peak demand periods and plan flexible staffing accordingly',
          'Before making capital expenditure decisions on new spaces or renovations',
          'To support compliance reporting where capacity limits are regulatory requirements',
        ]}
        keyMetrics={[
          { label: 'Avg Utilisation %', description: 'Average occupancy divided by total capacity across all active areas.', interpretation: 'Optimal range is 70-85%. Below 60% indicates waste; above 90% risks service quality and compliance.', goodRange: '70–85%', warningRange: '50–69% or 86–90%', criticalRange: '< 50% or > 90%' },
          { label: 'Total Capacity', description: 'Sum of all capacity slots across filtered areas.', interpretation: 'Benchmark against historical demand to determine if total capacity matches organisational needs.' },
          { label: 'Unused Capacity', description: 'Difference between total capacity and average occupancy.', interpretation: 'Each unused slot represents a cost without corresponding revenue. Quantify the financial impact using labour cost reports.' },
          { label: 'Over-Utilised Areas', description: 'Areas running at 90%+ of capacity.', interpretation: 'These areas risk compliance violations, reduced service quality, and staff burnout. Immediate attention required.', goodRange: '0 areas', warningRange: '1-2 areas', criticalRange: '3+ areas' },
          { label: 'Under-Utilised Areas', description: 'Areas running below 50% of capacity.', interpretation: 'Candidates for consolidation via area combining. Calculate potential savings using the Area Combining report.', goodRange: '0 areas', warningRange: '1-2 areas', criticalRange: '3+ areas' },
          { label: 'Peak Occupancy', description: 'Highest recorded occupancy during the reporting period.', interpretation: 'Compare peak to average to understand demand variability. High peak-to-average ratios suggest need for flexible capacity.' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'Six cards show headline metrics with sparklines showing 6-period trends. Colour-coded variants (green/amber/red) immediately signal whether each metric is within acceptable ranges. Trend badges show period-over-period changes.' },
          { title: 'Utilisation by Location Bar Chart', content: 'Compares average utilisation and total occupancy across locations. Locations with bars significantly above or below the average line warrant investigation. Hover for exact values.' },
          { title: 'Utilisation Distribution', content: 'Shows how many areas fall into each utilisation band (0-25%, 25-50%, etc.). A healthy distribution is bell-shaped centered on 70-85%. Left-skewed distributions indicate widespread underuse; right-skewed indicates capacity pressure.' },
          { title: 'Category Radar Chart', content: 'Spider chart showing average utilisation by service category. Categories with points near the outer edge are highly utilised; those near the center are underused. Uneven shapes highlight category-specific issues.' },
          { title: 'Weekly Trend', content: 'Shows utilisation variation across days of the week. Peaks and troughs help identify optimal days for maintenance, training, or area combining.' },
          { title: 'Detail Table', content: 'Every area with its capacity, average/peak occupancy, utilisation percentage (with progress bar), and status. Sort by utilisation to quickly identify the most and least used areas. The progress bar provides instant visual comparison.' },
        ]}
        actionableInsights={[
          'Prioritise areas above 90% utilisation for capacity review — these are compliance and quality risks',
          'Areas below 50% should be evaluated against the Area Combining Savings report to quantify consolidation benefits',
          'Use the weekly trend to schedule maintenance or deep-cleaning during low-utilisation days',
          'Compare the radar chart against staffing ratios — high utilisation with low staffing ratios is a red flag',
          'Track month-over-month utilisation trends to anticipate when areas will reach capacity limits',
        ]}
        relatedReports={['Area Combining Savings', 'Staffing Ratio Compliance (NQF)', 'Coverage Gap Analysis', 'Budget vs Actuals']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Avg Utilisation" value={`${avgUtil}%`} icon={Gauge} sparklineData={sparkline6}
          variant={avgUtil > 90 ? 'danger' : avgUtil > 85 ? 'warning' : avgUtil >= 70 ? 'success' : 'warning'}
          trend={{ value: 2.4, label: 'vs prior period' }} />
        <StatCard label="Total Capacity" value={totalCapacity} icon={Building2} subtitle={`${filtered.length} areas`} />
        <StatCard label="Avg Occupancy" value={totalOccupancy} icon={Users}
          trend={{ value: 1.8, label: 'vs prior period' }} subtitle={`${Math.round(totalOccupancy / (filtered.length || 1))} per area`} />
        <StatCard label="Unused Capacity" value={unusedCapacity} icon={AlertTriangle}
          variant={unusedCapacity > totalCapacity * 0.3 ? 'warning' : 'default'} subtitle={`${Math.round(unusedCapacity / (totalCapacity || 1) * 100)}% of total`} />
        <StatCard label="Over-Utilised (90%+)" value={overutilised.length} icon={TrendingUp}
          variant={overutilised.length > 2 ? 'danger' : overutilised.length > 0 ? 'warning' : 'success'} />
        <StatCard label="Under-Utilised (<50%)" value={underutilised.length} icon={BarChart3}
          variant={underutilised.length > 2 ? 'warning' : 'success'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
      </div>

      <SummaryRow items={[
        { label: 'Active Areas', value: activeAreas.length },
        { label: 'Avg Util', value: `${avgUtil}%`, highlight: true },
        { label: 'Peak Avg', value: peakAvg },
        { label: 'Categories', value: categories.length },
        { label: 'Optimal (70-85%)', value: filtered.filter(r => r.utilisationPercent >= 70 && r.utilisationPercent <= 85).length },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Utilisation by Location</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} onClick={(e: any) => { if (e?.activeLabel) applyDrill('areaName', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="util" name="Utilisation %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={distBuckets} onClick={(e: any) => { if (e?.activeLabel) applyDrill('areaName', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Areas" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Category</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Utilisation" dataKey="utilisation" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly Utilisation Pattern</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="util" name="Utilisation %" stroke="hsl(var(--primary))" fill="url(#utilGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Areas — Detailed Breakdown</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${i}`} reportId="area-util" exportTitle="Area Utilisation" /></CardContent>
      </Card>
    </div>
  );
}
