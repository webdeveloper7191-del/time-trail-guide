import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCapacityUtil, CapacityUtilData, capacityByHourData } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, Users, AlertTriangle, Target, BarChart3 } from 'lucide-react';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Capacity', accessor: 'capacity' }, { header: 'Avg Occupancy', accessor: 'avgOccupancy' },
  { header: 'Peak', accessor: 'peakOccupancy' }, { header: 'Utilisation %', accessor: 'utilisationPercent' },
];

const locations = [...new Set(mockCapacityUtil.map(r => r.locationName))];

const tableColumns: DataTableColumn<CapacityUtilData>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'capacity', header: 'Capacity', accessor: (r) => r.capacity, sortValue: (r) => r.capacity, align: 'right' },
  { key: 'currentOccupancy', header: 'Current', accessor: (r) => r.currentOccupancy, sortValue: (r) => r.currentOccupancy, align: 'right' },
  { key: 'avgOccupancy', header: 'Avg', accessor: (r) => r.avgOccupancy, sortValue: (r) => r.avgOccupancy, align: 'right' },
  { key: 'peakOccupancy', header: 'Peak', accessor: (r) => r.peakOccupancy, sortValue: (r) => r.peakOccupancy, align: 'right' },
  { key: 'utilisationPercent', header: 'Utilisation', className: 'w-[140px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.utilisationPercent} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium w-8 text-right', r.utilisationPercent >= 90 ? 'text-destructive' : 'text-foreground')}>{r.utilisationPercent}%</span>
      </div>
    ) },
  { key: 'trend', header: 'Trend', align: 'center', sortValue: (r) => r.trend,
    accessor: (r) => r.trend === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" /> : r.trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" /> },
];

export function CapacityUtilDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockCapacityUtil.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const avgUtil = Math.round(filtered.reduce((s, r) => s + r.utilisationPercent, 0) / (filtered.length || 1));
  const nearCapacity = filtered.filter(r => r.utilisationPercent >= 90).length;
  const underUtilised = filtered.filter(r => r.utilisationPercent < 50).length;
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const totalCurrent = filtered.reduce((s, r) => s + r.currentOccupancy, 0);
  const totalAvgOcc = filtered.reduce((s, r) => s + r.avgOccupancy, 0);
  const peakMax = Math.max(...filtered.map(r => r.peakOccupancy));
  const trendingUp = filtered.filter(r => r.trend === 'up').length;

  const locationSummary = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return {
      name: loc.split(' ')[0],
      avgUtil: Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / (items.length || 1)),
      totalCapacity: items.reduce((s, r) => s + r.capacity, 0),
      currentOcc: items.reduce((s, r) => s + r.currentOccupancy, 0),
    };
  });

  const radarData = locationSummary.map(l => ({
    ...l,
    utilisation: l.avgUtil,
    occupancyRate: l.totalCapacity > 0 ? Math.round((l.currentOcc / l.totalCapacity) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Capacity Utilisation Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search areas..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Capacity Utilisation Dashboard"
        reportDescription="Monitors space utilisation across all areas and locations, tracking current, average, and peak occupancy against capacity limits."
        purpose="Enables facilities and operations managers to optimise space allocation, identify overcrowded or underused areas, and plan capacity expansion."
        whenToUse={[
          'During daily operations to monitor real-time occupancy levels',
          'When planning area combining during low-attendance periods',
          'For strategic capacity planning and expansion decisions',
          'To justify resource requests with utilisation data',
        ]}
        keyMetrics={[
          { label: 'Average Utilisation', description: 'Mean occupancy as percentage of capacity across all areas', interpretation: 'Target 70-85%. Below 50% = underutilised. Above 90% = near capacity risk', goodRange: '70-85%', warningRange: '50-69% or 86-90%', criticalRange: '<50% or >90%' },
          { label: 'Near Capacity Areas', description: 'Areas with ≥90% utilisation', interpretation: 'These areas risk exceeding capacity. Plan overflow or redistribution', goodRange: '0', warningRange: '1-2', criticalRange: '≥3' },
          { label: 'Underutilised Areas', description: 'Areas with <50% utilisation', interpretation: 'Candidates for consolidation, area combining, or repurposing', goodRange: '0-1', warningRange: '2-3', criticalRange: '≥4' },
          { label: 'Peak Occupancy', description: 'Highest recorded occupancy across all areas', interpretation: 'Indicates maximum demand pressure. Should not exceed capacity' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Top row shows aggregate metrics with conditional coloring. Red near-capacity count = immediate attention needed.' },
          { title: 'Hourly Occupancy', content: 'Area chart shows occupancy fluctuation throughout the day against capacity ceiling (dashed red line). Peak period = staffing priority window.' },
          { title: 'Radar Chart', content: 'Compares utilisation and occupancy rate across locations. Balanced shape = even distribution.' },
          { title: 'Location Bars', content: 'Bar chart ranks locations by average utilisation. Easy visual to spot best and worst performers.' },
        ]}
        actionableInsights={[
          'Areas consistently above 85% should be considered for capacity expansion or split scheduling',
          'Underutilised areas during peak hours may indicate enrolment or demand issues',
          'Compare hourly occupancy patterns to optimise staff rostering for peak windows',
          'Consider area combining for spaces with <50% utilisation during the same time blocks',
        ]}
        relatedReports={['Area Utilisation', 'Staffing Ratio Compliance', 'Multi-Location Overview', 'Area Combining Savings']}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Avg Utilisation" value={`${avgUtil}%`} icon={BarChart3} size="sm" variant={avgUtil >= 70 && avgUtil <= 85 ? 'success' : avgUtil > 90 ? 'danger' : 'warning'} sparklineData={filtered.slice(0, 8).map(r => r.utilisationPercent)} />
        <StatCard label="Near Capacity" value={nearCapacity} icon={AlertTriangle} size="sm" variant={nearCapacity >= 3 ? 'danger' : nearCapacity > 0 ? 'warning' : 'success'} />
        <StatCard label="Underutilised" value={underUtilised} icon={TrendingDown} size="sm" variant={underUtilised >= 4 ? 'danger' : underUtilised > 1 ? 'warning' : 'default'} />
        <StatCard label="Total Capacity" value={totalCapacity} icon={Building2} size="sm" />
        <StatCard label="Current Occ." value={totalCurrent} icon={Users} size="sm" />
        <StatCard label="Avg Occupancy" value={totalAvgOcc} icon={Target} size="sm" />
        <StatCard label="Peak Max" value={peakMax} icon={TrendingUp} size="sm" />
        <StatCard label="Trending Up" value={trendingUp} icon={TrendingUp} size="sm" variant="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {nearCapacity > 2 && <InsightCard type="negative" title="Multiple Areas Near Capacity" description={`${nearCapacity} areas are at ≥90% utilisation. Risk of exceeding licensed capacity or compliance breach.`} action="Review area combining or overflow plans" />}
        {underUtilised > 3 && <InsightCard type="action" title="High Underutilisation" description={`${underUtilised} areas below 50% utilisation. Consider consolidation to reduce operational costs.`} metric={`Potential savings from combining ${underUtilised} areas`} action="Run area combining analysis" />}
        {avgUtil >= 70 && avgUtil <= 85 && <InsightCard type="positive" title="Optimal Utilisation" description={`Average utilisation at ${avgUtil}% is within the ideal 70-85% range. Space allocation is well balanced.`} />}
        {trendingUp > filtered.length / 2 && <InsightCard type="neutral" title="Upward Demand Trend" description={`${trendingUp} of ${filtered.length} areas showing increasing utilisation. Monitor for capacity pressure.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Total Areas', value: filtered.length }, { label: 'Avg Util', value: `${avgUtil}%`, highlight: true },
        { label: 'Near Capacity', value: nearCapacity }, { label: 'Underutilised', value: underUtilised },
        { label: 'Total Capacity', value: totalCapacity },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Occupancy Throughout Day</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={capacityByHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="occupancy" name="Occupancy" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="capacity" name="Capacity" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Location Utilisation Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Utilisation" dataKey="utilisation" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Occupancy Rate" dataKey="occupancyRate" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgUtil" name="Avg Utilisation %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Area Capacity Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
