import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
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

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', 'hsl(var(--destructive))', '#8B5CF6'];

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Status', accessor: 'status' },
  { header: 'On Duty', accessor: 'onDuty' }, { header: 'Total Staff', accessor: 'totalStaff' },
  { header: 'Occupancy', accessor: 'occupancy' }, { header: 'Capacity', accessor: 'capacity' },
  { header: 'Compliance %', accessor: 'complianceScore' }, { header: 'Budget Used', accessor: 'budgetUsed' },
];

const locations = [...new Set(mockMultiSiteOps.map(r => r.locationName))];

const tableColumns: DataTableColumn<MultiSiteOpsData>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'online' ? 'default' : r.status === 'partial' ? 'secondary' : 'destructive'} className="text-xs">{r.status}</Badge> },
  { key: 'onDuty', header: 'On Duty / Total', accessor: (r) => `${r.onDuty} / ${r.totalStaff}`, sortValue: (r) => r.onDuty, align: 'right' },
  { key: 'occupancy', header: 'Occupancy', accessor: (r) => `${r.occupancy} / ${r.capacity}`, sortValue: (r) => r.occupancy, align: 'right' },
  { key: 'complianceScore', header: 'Compliance', className: 'w-[140px]', sortValue: (r) => r.complianceScore,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.complianceScore} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium', r.complianceScore >= 90 ? 'text-foreground' : 'text-destructive')}>{r.complianceScore}%</span>
      </div>
    ) },
  { key: 'budgetUsed', header: 'Budget Used', align: 'right', sortValue: (r) => r.budgetUsed,
    accessor: (r) => {
      const pct = Math.round((r.budgetUsed / r.budgetTotal) * 100);
      return <span className={cn('text-xs', pct > 90 ? 'text-destructive font-medium' : '')}>{`$${(r.budgetUsed / 1000).toFixed(1)}k / $${(r.budgetTotal / 1000).toFixed(1)}k (${pct}%)`}</span>;
    } },
  { key: 'alerts', header: 'Alerts', align: 'center', sortValue: (r) => r.alerts,
    accessor: (r) => r.alerts > 0 ? <Badge variant="destructive" className="text-xs">{r.alerts}</Badge> : <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> },
];

export function MultiSiteOpsDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockMultiSiteOps.filter(r => {
    const matchesSearch = !search || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

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
    { name: 'Online', value: filtered.filter(r => r.status === 'online').length },
    { name: 'Partial', value: filtered.filter(r => r.status === 'partial').length },
    { name: 'Offline', value: filtered.filter(r => r.status === 'offline').length },
  ].filter(s => s.value > 0);

  const radarData = filtered.map(r => ({
    location: r.locationName.split(' ')[0],
    compliance: r.complianceScore,
    occupancy: Math.round((r.occupancy / r.capacity) * 100),
    staffing: Math.round((r.onDuty / r.totalStaff) * 100),
    budget: Math.round((1 - (r.budgetUsed / r.budgetTotal - 0.7) * 3) * 100),
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Multi-Site Operations Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search locations..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Multi-Site Operations Dashboard"
        reportDescription="Real-time operational command centre showing status, staffing, occupancy, compliance, and budget health for all managed locations."
        purpose="Enables operations managers to monitor all sites simultaneously, identify issues instantly, and coordinate cross-site responses."
        whenToUse={[
          'As a daily morning check to ensure all sites are operational',
          'During incident response to assess impact across sites',
          'For executive briefings on operational status',
          'When planning resource reallocation between locations',
        ]}
        keyMetrics={[
          { label: 'Sites Online', description: 'Number of locations reporting online status', interpretation: 'All sites should be online during operating hours. Partial/offline requires investigation', goodRange: '100%', criticalRange: '<100%' },
          { label: 'Avg Compliance', description: 'Mean compliance score across all locations', interpretation: 'Below 90% indicates systemic staffing or regulatory issues', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Budget Utilisation', description: 'Percentage of total budget consumed', interpretation: 'Track against period progress — 75% budget at 50% period = overspend trajectory', goodRange: 'Pro-rata ±5%', criticalRange: '>10% ahead' },
          { label: 'Active Alerts', description: 'Total unresolved alerts across all sites', interpretation: 'Each alert represents a potential compliance or safety issue', goodRange: '0', warningRange: '1-3', criticalRange: '>3' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Eight headline metrics with variant coloring. Green = within target, amber = monitor, red = immediate action required.' },
          { title: 'Radar Chart', content: 'Multi-dimensional comparison of each location across compliance, occupancy, staffing, and budget. Larger polygons = stronger performance.' },
          { title: 'Trend Charts', content: 'Historical compliance/utilisation trend shows improvement trajectory. Violations chart tracks regulatory incident frequency.' },
          { title: 'Location Table', content: 'Sortable detail view with inline progress bars for compliance and budget burn rate per site.' },
        ]}
        actionableInsights={[
          'Sites with partial/offline status need immediate operational investigation',
          'Locations with >90% budget burn and <75% period elapsed need cost review',
          'Cross-reference low-compliance sites with high alert counts for root cause',
          'Compare staffing rates to identify sites that can share resources',
        ]}
        relatedReports={['Multi-Location Overview', 'Compliance Violation Summary', 'Budget vs Actuals', 'Cross-Location Deployment']}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Sites Online" value={`${onlineCount}/${filtered.length}`} icon={MapPin} size="sm" variant={onlineCount === filtered.length ? 'success' : 'warning'} />
        <StatCard label="Staff On Duty" value={totalOnDuty} icon={Users} size="sm" sparklineData={[28, 30, 32, 29, totalOnDuty]} />
        <StatCard label="Staffing Rate" value={`${staffingRate}%`} icon={Activity} size="sm" variant={staffingRate >= 80 ? 'success' : 'warning'} />
        <StatCard label="Occupancy" value={`${occupancyRate}%`} icon={Target} size="sm" variant={occupancyRate > 95 ? 'danger' : 'default'} />
        <StatCard label="Avg Compliance" value={`${avgCompliance}%`} icon={Shield} size="sm" variant={avgCompliance >= 95 ? 'success' : avgCompliance >= 90 ? 'warning' : 'danger'} sparklineData={locationTrendData.map(d => d.avgCompliance)} />
        <StatCard label="Active Alerts" value={totalAlerts} icon={AlertTriangle} size="sm" variant={totalAlerts > 3 ? 'danger' : totalAlerts > 0 ? 'warning' : 'success'} />
        <StatCard label="Budget Used" value={`${budgetPct}%`} icon={DollarSign} size="sm" variant={budgetPct > 90 ? 'danger' : 'default'} />
        <StatCard label="Total Budget" value={`$${(totalBudgetTotal / 1000).toFixed(0)}k`} icon={DollarSign} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {totalAlerts > 0 && <InsightCard type="negative" title={`${totalAlerts} Active Alert${totalAlerts > 1 ? 's' : ''}`} description={`Unresolved alerts across ${filtered.filter(r => r.alerts > 0).length} location(s) require immediate attention.`} action="Review alerts by location" />}
        {avgCompliance >= 95 && <InsightCard type="positive" title="Strong Compliance" description={`All-site average of ${avgCompliance}% exceeds the 95% target benchmark.`} />}
        {budgetPct > 85 && <InsightCard type="action" title="Budget Burn Rate High" description={`${budgetPct}% of total budget consumed. Review cost drivers at high-spend locations.`} action="Analyse cost breakdown by site" />}
        {staffingRate >= 85 && <InsightCard type="positive" title="Healthy Staffing" description={`${staffingRate}% of total staff are on duty. Coverage is strong across sites.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Locations', value: filtered.length }, { label: 'On Duty', value: totalOnDuty },
        { label: 'Total Capacity', value: totalCapacity }, { label: 'Occupancy', value: `${occupancyRate}%`, highlight: true },
        { label: 'Alerts', value: totalAlerts },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Site Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
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

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Site Status & Violations</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={locationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="totalViolations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Locations</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.locationId} /></CardContent>
      </Card>
    </div>
  );
}
