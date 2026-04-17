import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockOnCallCosts, OnCallCostRecord } from '@/data/mockPayrollReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Phone, Clock, DollarSign, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';


const COLORS = ['hsl(var(--primary))', '#F59E0B', 'hsl(var(--chart-3))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'type' }, { header: 'Standby Hrs', accessor: 'standbyHours' },
  { header: 'Standby Cost', accessor: 'standbyCost' }, { header: 'Activated Hrs', accessor: 'activatedHours' },
  { header: 'Total Cost', accessor: 'totalCost' },
];

const locations = [...new Set(mockOnCallCosts.map(r => r.location))];

const tableColumns: DataTableColumn<OnCallCostRecord>[] = [
  { key: 'staffName', header: 'Staff', type: 'text', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', type: 'enum', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'type', header: 'Type', type: 'enum', sortValue: (r) => r.type,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.type.replace(/_/g, ' ')}</Badge> },
  { key: 'standbyHours', header: 'Standby Hrs', type: 'number', accessor: (r) => <span className="font-mono text-xs">{r.standbyHours}h</span>, sortValue: (r) => r.standbyHours, align: 'right' },
  { key: 'standbyRate', header: 'Standby Rate', type: 'number', accessor: (r) => `$${r.standbyRate}/hr`, sortValue: (r) => r.standbyRate, align: 'right' },
  { key: 'standbyCost', header: 'Standby $', type: 'number', accessor: (r) => `$${r.standbyCost.toLocaleString()}`, sortValue: (r) => r.standbyCost, align: 'right' },
  { key: 'activatedHours', header: 'Active Hrs', type: 'number', accessor: (r) => r.activatedHours > 0 ? <span className="text-amber-600 font-medium text-xs">{r.activatedHours}h</span> : <span className="text-muted-foreground text-xs">—</span>, sortValue: (r) => r.activatedHours, align: 'right' },
  { key: 'activatedCost', header: 'Active $', type: 'number', accessor: (r) => r.activatedCost > 0 ? `$${r.activatedCost.toLocaleString()}` : '—', sortValue: (r) => r.activatedCost, align: 'right' },
  { key: 'totalCost', header: 'Total', type: 'number', accessor: (r) => <span className="font-semibold">${r.totalCost.toLocaleString()}</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'date', header: 'Date', type: 'date', accessor: (r) => r.date, sortValue: (r) => r.date },
  { key: 'activationRate', header: 'Activation %', type: 'number', align: 'right', sortValue: (r) => r.standbyHours > 0 ? (r.activatedHours / r.standbyHours * 100) : 0,
    accessor: (r) => { const rate = r.standbyHours > 0 ? Math.round(r.activatedHours / r.standbyHours * 100) : 0; return <span className={cn('text-xs font-medium', rate > 50 ? 'text-destructive' : rate > 0 ? 'text-amber-600' : 'text-muted-foreground')}>{rate}%</span>; }},
];

export function OnCallCostReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => filterByDateRange(mockOnCallCosts.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
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


  const totalStandby = filtered.reduce((s, r) => s + r.standbyCost, 0);
  const totalActivated = filtered.reduce((s, r) => s + r.activatedCost, 0);
  const totalCombined = totalStandby + totalActivated;
  const totalStandbyHrs = filtered.reduce((s, r) => s + r.standbyHours, 0);
  const totalActivatedHrs = filtered.reduce((s, r) => s + r.activatedHours, 0);
  const activationRate = totalStandbyHrs > 0 ? Math.round((totalActivatedHrs / totalStandbyHrs) * 100) : 0;
  const costPerActivatedHr = totalActivatedHrs > 0 ? Math.round(totalCombined / totalActivatedHrs) : 0;

  const byType = ['on_call', 'callback', 'recall'].map(t => ({
    name: t.replace(/_/g, ' '),
    standby: filtered.filter(r => r.type === t).reduce((s, r) => s + r.standbyCost, 0),
    activated: filtered.filter(r => r.type === t).reduce((s, r) => s + r.activatedCost, 0),
  }));

  const typePie = byType.map(t => ({ name: t.name, value: t.standby + t.activated }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="On-Call & Callback Cost Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <ReportHelpGuide
        reportName="On-Call & Callback Cost Report"
        reportDescription="Analyses the cost of on-call arrangements including standby payments, callback activations, and recall expenses."
        purpose="Optimises on-call roster design by understanding the true cost of maintaining standby coverage and activation patterns."
        whenToUse={[
          'When reviewing on-call roster costs and efficiency', 'During budget planning for standby arrangements',
          'When comparing activation rates to justify on-call positions', 'For negotiating on-call allowance rates',
        ]}
        keyMetrics={[
          { label: 'Total Combined Cost', description: 'Standby + Activated costs combined', interpretation: 'Compare against the cost of having permanent staff on-site for cost-effectiveness analysis' },
          { label: 'Activation Rate', description: 'Activated Hours ÷ Standby Hours × 100', interpretation: 'Below 15% suggests over-rostering on-call. Above 50% suggests understaffing', goodRange: '15-30%', warningRange: '5-14% or 31-50%', criticalRange: '<5% or >50%' },
          { label: 'Effective Cost/Active Hour', description: 'Total Combined Cost ÷ Activated Hours', interpretation: 'The true cost per productive on-call hour. Compare to standard hourly rates.' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Shows standby vs activation costs, activation rate, and effective cost per productive hour.' },
          { title: 'Cost by Type', content: 'Grouped bars compare standby vs activated costs across on-call, callback, and recall categories.' },
          { title: 'Cost Distribution', content: 'Pie chart shows which on-call type drives the most cost. Focus optimisation on the largest slice.' },
          { title: 'Detail Table', content: 'Activation Rate column shows how often each staff member is actually called in. Very low rates suggest they don\'t need to be on-call.' },
        ]}
        actionableInsights={[
          'If activation rate is below 10%, consider reducing on-call positions',
          'High callback costs may be reduced with better primary scheduling to prevent gaps',
          'Compare cost-per-activated-hour against regular time rates to assess on-call ROI',
          'Staff with 0% activation may not need to be on the on-call roster',
        ]}
        relatedReports={['Payroll Cost Dashboard', 'Overtime & Fatigue Risk', 'Labour Cost by Location']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Standby Cost" value={`$${totalStandby.toLocaleString()}`} icon={Clock} size="sm" />
        <StatCard label="Activated Cost" value={`$${totalActivated.toLocaleString()}`} icon={Zap} size="sm" />
        <StatCard label="Combined Total" value={`$${totalCombined.toLocaleString()}`} icon={DollarSign} size="sm" />
        <StatCard label="Activation Rate" value={`${activationRate}%`} icon={Phone} variant={activationRate < 5 || activationRate > 50 ? 'danger' : activationRate < 15 ? 'warning' : 'success'} size="sm" />
        <StatCard label="Eff. $/Active Hr" value={`$${costPerActivatedHr}`} icon={TrendingUp} size="sm" />
        <StatCard label="Staff on Call" value={filtered.length} icon={AlertTriangle} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {activationRate < 10 && <InsightCard type="action" title="Low Activation Rate" description={`Only ${activationRate}% of standby hours result in actual work. Consider reducing on-call positions.`} action="Review on-call roster sizing" />}
        {activationRate > 40 && <InsightCard type="negative" title="High Activation Rate" description={`${activationRate}% activation suggests chronic understaffing requiring regular call-ins.`} action="Consider adding scheduled shifts instead" />}
        {activationRate >= 15 && activationRate <= 30 && <InsightCard type="positive" title="Balanced On-Call Coverage" description={`${activationRate}% activation rate is within the optimal 15-30% range.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Standby Hrs', value: `${totalStandbyHrs}h` }, { label: 'Activated Hrs', value: `${totalActivatedHrs}h` },
        { label: 'Standby $', value: `$${totalStandby.toLocaleString()}`, highlight: true },
        { label: 'Activated $', value: `$${totalActivated.toLocaleString()}` }, { label: 'Activation %', value: `${activationRate}%` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Type</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <BarChart data={byType} onClick={(e: any) => { if (e?.activeLabel) applyDrill('location', e.activeLabel); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="standby" name="Standby" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activated" name="Activated" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Distribution by Type</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typePie.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable key={animKey} columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
