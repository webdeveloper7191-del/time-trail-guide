import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { mockAvailabilityVsScheduled, AvailabilityVsScheduledRecord } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Clock, Calendar, AlertTriangle, Target, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

const locations = [...new Set(mockAvailabilityVsScheduled.map(r => r.location))];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Available', accessor: 'availableHours' }, { header: 'Scheduled', accessor: 'scheduledHours' },
  { header: 'Utilisation %', accessor: 'utilisationPct' }, { header: 'Unscheduled', accessor: 'unscheduledHours' },
  { header: 'Overtime', accessor: 'overtimeHours' },
];

const tableColumns: DataTableColumn<AvailabilityVsScheduledRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <div><span className="font-medium">{r.staffName}</span><span className="block text-[10px] text-muted-foreground">{r.department}</span></div>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'availableHours', header: 'Available', accessor: (r) => <span className="font-mono text-xs">{r.availableHours}h</span>, sortValue: (r) => r.availableHours, align: 'right' },
  { key: 'scheduledHours', header: 'Scheduled', accessor: (r) => <span className="font-mono text-xs">{r.scheduledHours}h</span>, sortValue: (r) => r.scheduledHours, align: 'right' },
  { key: 'utilisationPct', header: 'Utilisation', className: 'w-[150px]', sortValue: (r) => r.utilisationPct,
    accessor: (r) => <div className="flex items-center gap-2"><Progress value={Math.min(r.utilisationPct, 100)} className="h-2 flex-1" />

      <DrillFilterBadge filter={drill} onClear={clearDrill} /><span className={cn('text-xs font-semibold', r.utilisationPct > 100 ? 'text-destructive' : r.utilisationPct >= 90 ? 'text-emerald-600' : r.utilisationPct >= 75 ? 'text-foreground' : 'text-amber-600')}>{r.utilisationPct}%</span></div> },
  { key: 'unscheduledHours', header: 'Unused', align: 'right', sortValue: (r) => r.unscheduledHours,
    accessor: (r) => r.unscheduledHours > 0 ? <span className="text-amber-600 text-xs font-medium">{r.unscheduledHours}h</span> : <span className="text-emerald-600 text-xs">—</span> },
  { key: 'overtimeHours', header: 'OT', align: 'right', sortValue: (r) => r.overtimeHours,
    accessor: (r) => r.overtimeHours > 0 ? <Badge variant="destructive" className="text-[10px]">{r.overtimeHours}h</Badge> : <span className="text-xs text-muted-foreground">—</span> },
];

export function AvailabilityVsScheduledReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return mockAvailabilityVsScheduled.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
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


  const totalAvailable = filtered.reduce((s, r) => s + r.availableHours, 0);
  const totalScheduled = filtered.reduce((s, r) => s + r.scheduledHours, 0);
  const totalUnscheduled = filtered.reduce((s, r) => s + r.unscheduledHours, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  const avgUtil = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.utilisationPct, 0) / filtered.length) : 0;
  const overworked = filtered.filter(r => r.utilisationPct > 100).length;
  const underused = filtered.filter(r => r.utilisationPct < 75).length;

  const hoursPie = [
    { name: 'Scheduled', value: totalScheduled }, { name: 'Unscheduled', value: totalUnscheduled }, { name: 'Overtime', value: totalOT },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Availability vs Scheduled" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Availability vs Scheduled Report"
        reportDescription="Compares staff declared availability against actual scheduled hours, revealing underutilisation gaps and overwork situations."
        purpose="Optimises workforce scheduling by ensuring available capacity is fully utilised while preventing excessive overtime."
        whenToUse={[
          'Before creating new rosters to understand available capacity', 'When overtime costs are escalating unexpectedly',
          'To identify staff who could take on more shifts', 'During workforce optimisation reviews',
        ]}
        keyMetrics={[
          { label: 'Avg Utilisation', description: 'Average of (Scheduled ÷ Available × 100) across staff', interpretation: 'Target 85-95%. Below 80% = wasted capacity. Above 100% = overtime risk', goodRange: '85-95%', warningRange: '75-84% or 96-100%', criticalRange: '<75% or >100%' },
          { label: 'Unscheduled Hours', description: 'Total available hours not assigned to shifts', interpretation: 'Represents unused capacity that could fill open shifts or reduce agency usage' },
          { label: 'Overtime Hours', description: 'Hours scheduled beyond availability', interpretation: 'Each OT hour costs 1.5-2x standard rate. Should be minimised through better scheduling' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows aggregate utilisation, total hours breakdown, and staff at risk (overworked/underused). Red cards indicate immediate scheduling concerns.' },
          { title: 'Hours Comparison', content: 'Side-by-side bar chart per staff member comparing available vs scheduled hours. Scheduled exceeding available = overtime.' },
          { title: 'Hours Distribution', content: 'Pie chart showing the split between scheduled, unscheduled, and overtime hours across the workforce.' },
          { title: 'Detail Table', content: 'Progress bars show utilisation with colour coding. Sort by utilisation to find extremes. Amber "unused" flags represent scheduling opportunities.' },
        ]}
        actionableInsights={[
          'Staff below 75% utilisation can absorb open shifts before hiring externally',
          'Staff above 100% should have shifts redistributed to prevent fatigue and burnout',
          'If total unscheduled hours exceed total overtime, scheduling optimisation can eliminate OT entirely',
          'Compare by location to find sites with the best availability-scheduling balance',
        ]}
        relatedReports={['Staff Utilisation', 'Overtime & Fatigue Risk', 'Open Shift Fill Rate', 'Labour Cost by Location']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Avg Utilisation" value={`${avgUtil}%`} icon={Target} variant={avgUtil >= 85 && avgUtil <= 95 ? 'success' : avgUtil >= 75 ? 'warning' : 'danger'} size="sm" />
        <StatCard label="Total Available" value={`${totalAvailable}h`} icon={Calendar} size="sm" />
        <StatCard label="Total Scheduled" value={`${totalScheduled}h`} icon={Clock} size="sm" />
        <StatCard label="Unscheduled" value={`${totalUnscheduled}h`} icon={Zap} variant={totalUnscheduled > 20 ? 'warning' : 'default'} size="sm" />
        <StatCard label="Overtime" value={`${totalOT}h`} icon={AlertTriangle} variant={totalOT > 5 ? 'danger' : 'default'} size="sm" />
        <StatCard label="Staff Count" value={filtered.length} icon={Users} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {overworked > 0 && <InsightCard type="negative" title={`${overworked} Overworked Staff`} description={`${overworked} staff members are scheduled beyond their availability, generating ${totalOT}h of overtime.`} action="Redistribute shifts to underutilised staff" />}
        {underused > 0 && <InsightCard type="action" title={`${underused} Underutilised Staff`} description={`${underused} staff have >25% unused availability (${totalUnscheduled}h total). This capacity could offset overtime costs.`} action="Offer available shifts to underutilised staff first" />}
        {avgUtil >= 85 && avgUtil <= 95 && <InsightCard type="positive" title="Optimal Utilisation" description={`Average ${avgUtil}% utilisation is within the ideal 85-95% range, balancing capacity and flexibility.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Available', value: `${totalAvailable}h` }, { label: 'Scheduled', value: `${totalScheduled}h`, highlight: true },
        { label: 'Unused', value: `${totalUnscheduled}h` }, { label: 'Overtime', value: `${totalOT}h` },
        { label: 'Overworked', value: overworked }, { label: 'Underused', value: underused },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Available vs Scheduled Hours</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered} cursor="pointer" onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="staffName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="availableHours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Available" />
                <Bar dataKey="scheduledHours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Scheduled" />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Hours Distribution</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={hoursPie.filter(h => h.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {hoursPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v}h`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Staff Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.staffName}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
