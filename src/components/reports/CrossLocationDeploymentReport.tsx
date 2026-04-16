import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCrossLocationDeployments, CrossLocationDeployment } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Clock, Users, MapPin, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Role', accessor: 'role' },
  { header: 'Primary Location', accessor: 'primaryLocation' }, { header: 'Deployed To', accessor: 'deployedLocation' },
  { header: 'Primary Hours', accessor: 'hoursAtPrimary' }, { header: 'Deployed Hours', accessor: 'hoursDeployed' },
  { header: 'Deployments', accessor: 'deploymentCount' }, { header: 'Last Deployed', accessor: 'lastDeployed' },
];

const locations = [...new Set([...mockCrossLocationDeployments.map(r => r.primaryLocation), ...mockCrossLocationDeployments.map(r => r.deployedLocation)])];
const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const tableColumns: DataTableColumn<CrossLocationDeployment>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'role', header: 'Role', accessor: (r) => <Badge variant="outline" className="text-xs">{r.role}</Badge>, sortValue: (r) => r.role },
  { key: 'primaryLocation', header: 'Primary', accessor: (r) => r.primaryLocation, sortValue: (r) => r.primaryLocation },
  { key: 'deployedLocation', header: 'Deployed To', accessor: (r) => <span className="text-primary font-medium">{r.deployedLocation}</span>, sortValue: (r) => r.deployedLocation },
  { key: 'hoursAtPrimary', header: 'Primary Hrs', accessor: (r) => `${r.hoursAtPrimary}h`, sortValue: (r) => r.hoursAtPrimary, align: 'right' },
  { key: 'hoursDeployed', header: 'Deployed Hrs', accessor: (r) => <span className="font-medium">{r.hoursDeployed}h</span>, sortValue: (r) => r.hoursDeployed, align: 'right' },
  { key: 'deploymentRatio', header: 'Deploy %', align: 'right', sortValue: (r) => Math.round(r.hoursDeployed / (r.hoursAtPrimary + r.hoursDeployed) * 100),
    accessor: (r) => {
      const pct = Math.round(r.hoursDeployed / (r.hoursAtPrimary + r.hoursDeployed) * 100);
      return <Badge variant={pct > 40 ? 'destructive' : pct > 25 ? 'secondary' : 'default'} className="text-xs">{pct}%</Badge>;
    } },
  { key: 'deploymentCount', header: 'Count', accessor: (r) => r.deploymentCount, sortValue: (r) => r.deploymentCount, align: 'right' },
  { key: 'lastDeployed', header: 'Last Deployed', accessor: (r) => r.lastDeployed, sortValue: (r) => r.lastDeployed },
];

export function CrossLocationDeploymentReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockCrossLocationDeployments.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.primaryLocation === locationFilter || r.deployedLocation === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalDeployedHours = filtered.reduce((s, r) => s + r.hoursDeployed, 0);
  const totalPrimaryHours = filtered.reduce((s, r) => s + r.hoursAtPrimary, 0);
  const avgDeployments = Math.round(filtered.reduce((s, r) => s + r.deploymentCount, 0) / (filtered.length || 1) * 10) / 10;
  const deploymentRatio = Math.round(totalDeployedHours / (totalPrimaryHours + totalDeployedHours) * 100);
  const uniqueStaff = filtered.length;
  const roles = [...new Set(filtered.map(r => r.role))];
  const heavilyDeployed = filtered.filter(r => r.hoursDeployed / (r.hoursAtPrimary + r.hoursDeployed) > 0.3);
  const topDeployed = [...filtered].sort((a, b) => b.hoursDeployed - a.hoursDeployed).slice(0, 5);

  // Flow analysis
  const flowData = locations.slice(0, 6).map(loc => ({
    name: loc.split(' ')[0],
    sentOut: filtered.filter(r => r.primaryLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0),
    received: filtered.filter(r => r.deployedLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0),
  }));

  // Role distribution
  const roleData = roles.map(role => ({
    name: role,
    value: filtered.filter(r => r.role === role).length,
  }));

  // Location dependency radar
  const radarData = locations.slice(0, 6).map(loc => {
    const sent = filtered.filter(r => r.primaryLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0);
    const received = filtered.filter(r => r.deployedLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0);
    return { location: loc.split(' ')[0], dependency: Math.min(100, Math.round((received / (totalDeployedHours || 1)) * 100 * locations.length)) };
  });

  // Net flow
  const netFlowData = locations.slice(0, 6).map(loc => {
    const sent = filtered.filter(r => r.primaryLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0);
    const received = filtered.filter(r => r.deployedLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0);
    return { name: loc.split(' ')[0], net: received - sent };
  });

  const sparkline = [45, 52, 48, 55, 50, totalDeployedHours];

  const insights = useMemo(() => {
    const result: { type: 'positive' | 'negative' | 'action' | 'neutral'; title: string; description: string; metric?: string; action?: string }[] = [];
    if (deploymentRatio <= 15) {
      result.push({ type: 'positive', title: 'Healthy Deployment Ratio', description: `Only ${deploymentRatio}% of total hours are cross-location deployments. Staff primarily work at their home locations.`, metric: `${deploymentRatio}% deployed` });
    } else if (deploymentRatio <= 25) {
      result.push({ type: 'action', title: 'Moderate Cross-Deployment', description: `${deploymentRatio}% deployment ratio. While manageable, consider whether receiving locations need permanent headcount.`, action: 'Review if deployments are covering structural gaps' });
    } else {
      result.push({ type: 'negative', title: 'High Deployment Dependency', description: `${deploymentRatio}% of hours are cross-location, indicating locations cannot sustain operations independently.`, metric: `${totalDeployedHours}h deployed`, action: 'Evaluate permanent staffing increases at receiving locations' });
    }
    if (heavilyDeployed.length > 0) {
      result.push({ type: 'action', title: `${heavilyDeployed.length} Staff Over-Deployed`, description: `These staff spend >30% of hours at non-primary locations: ${heavilyDeployed.slice(0, 3).map(r => r.staffName).join(', ')}${heavilyDeployed.length > 3 ? '…' : ''}.`, metric: `${heavilyDeployed.length} staff affected`, action: 'Review primary location assignments or formalise transfers' });
    }
    const biggestReceiver = flowData.reduce((max, loc) => loc.received > max.received ? loc : max, flowData[0]);
    if (biggestReceiver && biggestReceiver.received > 0) {
      result.push({ type: 'neutral', title: `${biggestReceiver.name} Receives Most Hours`, description: `${biggestReceiver.received}h received from other locations. This may indicate chronic understaffing.`, action: 'Assess permanent headcount increase for this location' });
    }
    const biggestSender = flowData.reduce((max, loc) => loc.sentOut > max.sentOut ? loc : max, flowData[0]);
    if (biggestSender && biggestSender.sentOut > 0) {
      result.push({ type: 'neutral', title: `${biggestSender.name} Sends Most Hours`, description: `${biggestSender.sentOut}h sent to other locations. This location may be overstaffed or have flexible capacity.`, metric: `${biggestSender.sentOut}h exported` });
    }
    return result;
  }, [filtered, deploymentRatio, totalDeployedHours, heavilyDeployed, flowData]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Cross-Location Staff Deployment" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Cross-Location Staff Deployment"
        reportDescription="Comprehensive analysis of staff movements between locations, tracking deployment hours, frequency, and flow patterns. Identifies dependency risks, over-deployed staff, and opportunities for permanent staffing optimisation."
        purpose="This report helps workforce planners understand how staff are shared across locations. It reveals which locations are net importers vs exporters of labour, identifies staff being deployed too frequently, and provides data to support decisions about permanent transfers, headcount changes, and operational efficiency."
        whenToUse={[
          'During workforce planning to identify locations that consistently need borrowed staff',
          'When evaluating whether to convert frequent deployments into permanent transfers',
          'To assess staff wellbeing — frequent cross-location travel affects engagement and fatigue',
          'Before budget reviews to quantify the cost of cross-location deployment (travel, overtime)',
          'When optimising roster schedules to reduce unnecessary cross-deployment',
        ]}
        keyMetrics={[
          { label: 'Staff Deployed', description: 'Count of unique staff members who have worked at non-primary locations.', interpretation: 'Higher numbers may indicate workforce flexibility or structural staffing shortfalls. Compare against total headcount for context.', goodRange: '< 15% of headcount', warningRange: '15-25%', criticalRange: '> 25%' },
          { label: 'Total Deployed Hours', description: 'Sum of hours worked at non-primary locations.', interpretation: 'Each deployed hour potentially incurs additional costs (travel, overtime) and reduces efficiency at the primary location.' },
          { label: 'Deployment Ratio', description: 'Deployed hours as a percentage of total hours (primary + deployed).', interpretation: 'Indicates how reliant the organisation is on cross-deployment. Lower is generally better.', goodRange: '< 15%', warningRange: '15-25%', criticalRange: '> 25%' },
          { label: 'Avg Deployments/Staff', description: 'Average number of cross-location assignments per deployed staff member.', interpretation: 'High frequency deployments disrupt routines and may indicate chronic understaffing at receiving locations.', goodRange: '1-3', warningRange: '4-6', criticalRange: '> 6' },
          { label: 'Over-Deployed Staff', description: 'Staff spending >30% of hours at non-primary locations.', interpretation: 'These staff are effectively split between locations. Consider formalising dual-location roles or transferring them.', goodRange: '0', warningRange: '1-3', criticalRange: '> 3' },
          { label: 'Net Flow', description: 'Difference between hours received and hours sent per location.', interpretation: 'Positive net flow = net importer (may need more permanent staff). Negative = net exporter (may have surplus capacity).' },
        ]}
        howToRead={[
          { title: 'KPI Summary Cards', content: 'Six cards show key deployment metrics. The Deployment Ratio card is the primary health indicator — green (<15%) means low dependency, amber (15-25%) needs monitoring, red (>25%) signals structural staffing issues. Sparklines show recent trends.' },
          { title: 'Hours Sent vs Received', content: 'Grouped bar chart showing each location as both sender and receiver of deployed hours. Balanced bars indicate mutual support; imbalanced bars reveal dependency. Locations with large "Received" bars and small "Sent" bars are understaffed.' },
          { title: 'Net Staff Flow', content: 'Bar chart showing the net difference (received minus sent) per location. Positive bars (net importers) may need headcount increases. Negative bars (net exporters) may have capacity to spare.' },
          { title: 'Role Distribution', content: 'Pie chart showing which roles are most frequently deployed. Concentration in one role may indicate a specific skills shortage across the organisation.' },
          { title: 'Location Dependency Radar', content: 'Spider chart showing how dependent each location is on receiving deployed staff. Points near the outer edge indicate high dependency. Even shapes suggest balanced deployment; uneven shapes highlight problem locations.' },
          { title: 'Detail Table', content: 'Full deployment records with deployment ratio percentage for each staff member. Sort by Deploy % to find over-deployed staff. The ratio badge uses colour coding: green (<25%), grey (25-40%), red (>40%).' },
        ]}
        actionableInsights={[
          'Staff with >30% deployment ratio should be evaluated for permanent transfer to their most frequent deployment location',
          'Locations that are consistent net importers should have their permanent headcount reviewed against demand',
          'Track deployment costs (travel time, overtime premiums) against the cost of hiring permanent staff at receiving locations',
          'High-frequency deployments for the same role suggest a skills gap — consider targeted recruitment for that role',
          'Use net flow data to identify locations with surplus capacity that could accept more work or reduce headcount',
        ]}
        relatedReports={['Staffing Ratio Compliance (NQF)', 'Coverage Gap Analysis', 'Labour Cost by Location', 'Staff Utilisation Report']}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Staff Deployed" value={uniqueStaff} icon={Users} sparklineData={[8, 10, 9, 12, 11, uniqueStaff]}
          trend={{ value: 2, label: 'vs prior period' }} />
        <StatCard label="Deployed Hours" value={`${totalDeployedHours}h`} icon={Clock} sparklineData={sparkline}
          trend={{ value: 5.2, label: 'vs prior period', isPositiveGood: false }} />
        <StatCard label="Deployment Ratio" value={`${deploymentRatio}%`} icon={ArrowLeftRight}
          variant={deploymentRatio > 25 ? 'danger' : deploymentRatio > 15 ? 'warning' : 'success'}
          sparklineData={[12, 14, 13, 16, 15, deploymentRatio]} />
        <StatCard label="Avg Deployments" value={avgDeployments} icon={BarChart3}
          subtitle="per staff member" />
        <StatCard label="Over-Deployed (>30%)" value={heavilyDeployed.length} icon={TrendingUp}
          variant={heavilyDeployed.length > 3 ? 'danger' : heavilyDeployed.length > 0 ? 'warning' : 'success'} />
        <StatCard label="Locations Involved" value={locations.length} icon={MapPin} subtitle={`${roles.length} roles deployed`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
      </div>

      <SummaryRow items={[
        { label: 'Primary Hours', value: `${totalPrimaryHours}h` },
        { label: 'Deployed Hours', value: `${totalDeployedHours}h`, highlight: true },
        { label: 'Roles', value: roles.length },
        { label: 'Top Deployed', value: topDeployed.length > 0 ? `${topDeployed[0].staffName} (${topDeployed[0].hoursDeployed}h)` : '-' },
        { label: 'Avg Deploy Hrs', value: `${Math.round(totalDeployedHours / (uniqueStaff || 1))}h` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hours Sent vs Received by Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sentOut" name="Sent Out" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" name="Received" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Net Staff Flow (Received − Sent)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={netFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="net" name="Net Flow (hrs)" radius={[4, 4, 0, 0]}>
                  {netFlowData.map((entry, i) => <Cell key={i} fill={entry.net >= 0 ? '#10B981' : 'hsl(var(--destructive))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Deployed Role Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Location Deployment Dependency</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="location" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Dependency" dataKey="dependency" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Deployments — Detailed</CardTitle>
        </CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.staffId} /></CardContent>
      </Card>
    </div>
  );
}
