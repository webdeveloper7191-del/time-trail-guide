import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockMultiSiteOps, MultiSiteOpsData, locationTrendData } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { AlertTriangle, CheckCircle2, MapPin, Users, Shield, Activity, DollarSign, Target } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', 'hsl(var(--destructive))', '#8B5CF6'];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Status', accessor: 'status' },
  { header: 'On Duty', accessor: 'onDuty' }, { header: 'Total Staff', accessor: 'totalStaff' },
  { header: 'Compliance %', accessor: 'complianceScore' }, { header: 'Budget Used', accessor: 'budgetUsed' },
];

const locations = [...new Set(mockMultiSiteOps.map(r => r.locationName))];

const tableColumns: DataTableColumn<MultiSiteOpsData>[] = [
  { key: 'locationName', header: 'Location', type: 'text', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'status', header: 'Status', type: 'enum', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'online' ? 'default' : r.status === 'partial' ? 'secondary' : 'destructive'} className="text-xs">{r.status}</Badge> },
  { key: 'onDuty', header: 'On Duty / Total', type: 'number', accessor: (r) => `${r.onDuty} / ${r.totalStaff}`, sortValue: (r) => r.onDuty, align: 'right' },
  { key: 'occupancy', header: 'Occupancy', type: 'number', accessor: (r) => `${r.occupancy} / ${r.capacity}`, sortValue: (r) => r.occupancy, align: 'right' },
  { key: 'complianceScore', header: 'Compliance', type: 'number', className: 'w-[140px]', sortValue: (r) => r.complianceScore,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.complianceScore} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium', r.complianceScore >= 90 ? 'text-foreground' : 'text-destructive')}>{r.complianceScore}%</span>
      </div>
    ) },
  { key: 'budgetUsed', header: 'Budget', type: 'number', align: 'right', sortValue: (r) => r.budgetUsed,
    accessor: (r) => { const pct = Math.round((r.budgetUsed / r.budgetTotal) * 100); return <span className={cn('text-xs', pct > 90 ? 'text-destructive font-medium' : '')}>{`$${(r.budgetUsed / 1000).toFixed(1)}k (${pct}%)`}</span>; } },
  { key: 'alerts', header: 'Alerts', type: 'text', align: 'center', sortValue: (r) => r.alerts,
    accessor: (r) => r.alerts > 0 ? <Badge variant="destructive" className="text-xs">{r.alerts}</Badge> : <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> },
  { key: 'occupancyPercent', header: 'Occupancy %', type: 'number', accessor: (r) => <span className={cn('text-xs', (r.occupancyPercent ?? 0) > 90 ? 'text-amber-600 font-medium' : '')}>{r.occupancyPercent ?? 0}%</span>, sortValue: (r) => r.occupancyPercent ?? 0, align: 'right' },
  { key: 'budgetUsedPct', header: 'Budget %', type: 'number', accessor: (r) => <Badge variant={(r.budgetUsedPct ?? 0) > 90 ? 'destructive' : (r.budgetUsedPct ?? 0) > 75 ? 'secondary' : 'outline'} className="text-[10px]">{r.budgetUsedPct ?? 0}%</Badge>, sortValue: (r) => r.budgetUsedPct ?? 0, align: 'right' },
  { key: 'managerName', header: 'Manager', type: 'enum', accessor: (r) => <span className="text-xs">{r.managerName}</span>, sortValue: (r) => r.managerName ?? '' },
  { key: 'openShifts', header: 'Open Shifts', type: 'number', accessor: (r) => (r.openShifts ?? 0) > 0 ? <Badge variant="secondary" className="text-[10px]">{r.openShifts}</Badge> : '0', sortValue: (r) => r.openShifts ?? 0, align: 'right' },
  { key: 'staffOnLeave', header: 'On Leave', type: 'number', accessor: (r) => r.staffOnLeave ?? 0, sortValue: (r) => r.staffOnLeave ?? 0, align: 'right' },
  { key: 'lastUpdated', header: 'Updated', type: 'date', accessor: (r) => <span className="text-[10px] text-muted-foreground">{r.lastUpdated}</span>, sortValue: (r) => r.lastUpdated ?? '' },
];

export function MultiSiteOpsDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => filterByDateRange(mockMultiSiteOps.filter(r => {
    const matchesSearch = !search || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), dateRange), [search, locationFilter, dateRange]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'location') return baseFiltered.filter(r => r.locationName === drill.value);
    if (drill.type === 'status') return baseFiltered.filter(r => r.status === drill.value);
    return baseFiltered;
  }, [baseFiltered, drill]);

  const totalOnDuty = filtered.reduce((s, r) => s + r.onDuty, 0);
  const totalStaff = filtered.reduce((s, r) => s + r.totalStaff, 0);
  const totalAlerts = filtered.reduce((s, r) => s + r.alerts, 0);
  const avgCompliance = Math.round(filtered.reduce((s, r) => s + r.complianceScore, 0) / (filtered.length || 1));
  const totalOccupancy = filtered.reduce((s, r) => s + r.occupancy, 0);
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
  const totalBudgetUsed = filtered.reduce((s, r) => s + r.budgetUsed, 0);
  const totalBudgetTotal = filtered.reduce((s, r) => s + r.budgetTotal, 0);
  const budgetPct = totalBudgetTotal > 0 ? Math.round((totalBudgetUsed / totalBudgetTotal) * 100) : 0;
  const onlineCount = filtered.filter(r => r.status === 'online').length;
  const staffingRate = totalStaff > 0 ? Math.round((totalOnDuty / totalStaff) * 100) : 0;

  const statusPie = [
    { name: 'Online', value: filtered.filter(r => r.status === 'online').length, status: 'online' },
    { name: 'Partial', value: filtered.filter(r => r.status === 'partial').length, status: 'partial' },
    { name: 'Offline', value: filtered.filter(r => r.status === 'offline').length, status: 'offline' },
  ].filter(s => s.value > 0);

  const radarData = filtered.map(r => ({
    location: r.locationName.split(' ')[0], fullName: r.locationName,
    compliance: r.complianceScore, occupancy: Math.round((r.occupancy / r.capacity) * 100),
    staffing: Math.round((r.onDuty / r.totalStaff) * 100),
  }));

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const month = data.activePayload[0].payload.month;
      if (month) setDrill({ type: 'month', value: month, label: 'Month' });
    }
  };

  const handlePieClick = (_: any, index: number) => {
    const item = statusPie[index];
    if (item) setDrill({ type: 'status', value: item.status, label: 'Status' });
  };

  const handleRadarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Multi-Site Operations Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search locations..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Multi-Site Operations Dashboard" reportDescription="Real-time operational command centre for all locations."
        purpose="Monitor all sites simultaneously with drill-through to individual locations."
        whenToUse={['Daily morning checks', 'Incident response', 'Executive briefings']}
        keyMetrics={[
          { label: 'Sites Online', description: 'Locations reporting online', interpretation: 'All should be online during hours', goodRange: '100%', criticalRange: '<100%' },
          { label: 'Avg Compliance', description: 'Mean compliance score', interpretation: 'Below 90% = systemic issues', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
        ]}
        howToRead={[
          { title: 'Interactive Drill-Through', content: 'Click any chart element (pie slice, radar point, bar) to filter the entire dashboard to that selection. All KPIs, insights, and the table update. Click ✕ on the filter badge to reset.' },
        ]}
        actionableInsights={['Partial/offline sites need investigation', 'High budget burn with low period elapsed needs cost review']}
        relatedReports={['Multi-Location Overview', 'Compliance Violations', 'Budget vs Actuals']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Sites Online" value={`${onlineCount}/${filtered.length}`} icon={MapPin} size="sm" variant={onlineCount === filtered.length ? 'success' : 'warning'} />
        <StatCard label="Staff On Duty" value={totalOnDuty} icon={Users} size="sm" />
        <StatCard label="Staffing Rate" value={`${staffingRate}%`} icon={Activity} size="sm" variant={staffingRate >= 80 ? 'success' : 'warning'} />
        <StatCard label="Occupancy" value={`${occupancyRate}%`} icon={Target} size="sm" />
        <StatCard label="Avg Compliance" value={`${avgCompliance}%`} icon={Shield} size="sm" variant={avgCompliance >= 95 ? 'success' : avgCompliance >= 90 ? 'warning' : 'danger'} sparklineData={locationTrendData.map(d => d.avgCompliance)} />
        <StatCard label="Active Alerts" value={totalAlerts} icon={AlertTriangle} size="sm" variant={totalAlerts > 3 ? 'danger' : totalAlerts > 0 ? 'warning' : 'success'} />
        <StatCard label="Budget Used" value={`${budgetPct}%`} icon={DollarSign} size="sm" variant={budgetPct > 90 ? 'danger' : 'default'} />
        <StatCard label="Total Budget" value={`$${(totalBudgetTotal / 1000).toFixed(0)}k`} icon={DollarSign} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totalAlerts > 0 && <InsightCard type="negative" title={`${totalAlerts} Active Alerts`} description={`Across ${filtered.filter(r => r.alerts > 0).length} location(s).`} action="Review alerts" />}
        {avgCompliance >= 95 && <InsightCard type="positive" title="Strong Compliance" description={`${avgCompliance}% exceeds target.`} />}
        {budgetPct > 85 && <InsightCard type="action" title="High Budget Burn" description={`${budgetPct}% consumed.`} action="Review cost drivers" />}
      </div>

      <SummaryRow items={[
        { label: 'Locations', value: filtered.length }, { label: 'On Duty', value: totalOnDuty },
        { label: 'Capacity', value: totalCapacity }, { label: 'Occupancy', value: `${occupancyRate}%`, highlight: true }, { label: 'Alerts', value: totalAlerts },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Site Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} onClick={handleRadarClick}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="location" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Compliance" dataKey="compliance" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Occupancy" dataKey="occupancy" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance & Utilisation Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={locationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="avgCompliance" name="Compliance %" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="avgUtilisation" name="Utilisation %" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Site Status & Violations</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={locationTrendData} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="totalViolations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Locations {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>}</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.locationId} /></CardContent>
      </Card>
    </div>
  );
}
