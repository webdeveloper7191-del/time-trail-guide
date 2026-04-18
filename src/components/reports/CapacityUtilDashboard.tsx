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
import { mockCapacityUtil, CapacityUtilData, capacityByHourData } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, Users, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Capacity', accessor: 'capacity' }, { header: 'Utilisation %', accessor: 'utilisationPercent' },
];

const locations = [...new Set(mockCapacityUtil.map(r => r.locationName))];

const tableColumns: DataTableColumn<CapacityUtilData>[] = [
  { key: 'locationName', header: 'Location', type: 'text', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', type: 'text', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'capacity', header: 'Capacity', type: 'number', accessor: (r) => r.capacity, sortValue: (r) => r.capacity, align: 'right' },
  { key: 'currentOccupancy', header: 'Current', type: 'number', accessor: (r) => r.currentOccupancy, sortValue: (r) => r.currentOccupancy, align: 'right' },
  { key: 'avgOccupancy', header: 'Avg', type: 'number', accessor: (r) => r.avgOccupancy, sortValue: (r) => r.avgOccupancy, align: 'right' },
  { key: 'peakOccupancy', header: 'Peak', type: 'number', accessor: (r) => r.peakOccupancy, sortValue: (r) => r.peakOccupancy, align: 'right' },
  { key: 'utilisationPercent', header: 'Utilisation', type: 'number', className: 'w-[140px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (<div className="flex items-center gap-2"><Progress value={r.utilisationPercent} className="h-2 flex-1" /><span className={cn('text-xs font-medium w-8 text-right', r.utilisationPercent >= 90 ? 'text-destructive' : 'text-foreground')}>{r.utilisationPercent}%</span></div>) },
  { key: 'trend', header: 'Trend', type: 'text', align: 'center', sortValue: (r) => r.trend,
    accessor: (r) => r.trend === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" /> : r.trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" /> },
  { key: 'freeCapacity', header: 'Free', type: 'number', accessor: (r) => r.freeCapacity ?? 0, sortValue: (r) => r.freeCapacity ?? 0, align: 'right' },
  { key: 'utilisationVsTarget', header: 'vs Target', type: 'number', accessor: (r) => <span className={cn('text-xs font-mono', (r.utilisationVsTarget ?? 0) < 0 ? 'text-amber-600' : 'text-emerald-600')}>{(r.utilisationVsTarget ?? 0) > 0 ? '+' : ''}{r.utilisationVsTarget ?? 0}%</span>, sortValue: (r) => r.utilisationVsTarget ?? 0, align: 'right' },
  { key: 'hourPeakStart', header: 'Peak Hour', type: 'text', accessor: (r) => <span className="font-mono text-xs">{r.hourPeakStart}</span>, sortValue: (r) => r.hourPeakStart ?? '' },
  { key: 'forecastNext7d', header: 'Forecast 7d', type: 'number', accessor: (r) => r.forecastNext7d ?? 0, sortValue: (r) => r.forecastNext7d ?? 0, align: 'right' },
  { key: 'revenuePerSeat', header: '$/Seat', type: 'number', accessor: (r) => `$${r.revenuePerSeat ?? 0}`, sortValue: (r) => r.revenuePerSeat ?? 0, align: 'right' },
];

export function CapacityUtilDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => filterByDateRange(mockCapacityUtil.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), dateRange), [search, locationFilter, dateRange]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'location') return baseFiltered.filter(r => r.locationName.startsWith(drill.value) || r.locationName === drill.value);
    if (drill.type === 'trend') return baseFiltered.filter(r => r.trend === drill.value);
    return baseFiltered;
  }, [baseFiltered, drill]);

  const avgUtil = Math.round(filtered.reduce((s, r) => s + r.utilisationPercent, 0) / (filtered.length || 1));
  const nearCapacity = filtered.filter(r => r.utilisationPercent >= 90).length;
  const underUtilised = filtered.filter(r => r.utilisationPercent < 50).length;
  const totalCapacity = filtered.reduce((s, r) => s + r.capacity, 0);
  const totalCurrent = filtered.reduce((s, r) => s + r.currentOccupancy, 0);
  const peakMax = filtered.length ? Math.max(...filtered.map(r => r.peakOccupancy)) : 0;
  const trendingUp = filtered.filter(r => r.trend === 'up').length;

  const locationSummary = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc.split(' ')[0], fullName: loc, avgUtil: items.length ? Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / items.length) : 0, totalCapacity: items.reduce((s, r) => s + r.capacity, 0) };
  });

  const radarData = locationSummary.map(l => ({ ...l, utilisation: l.avgUtil, occupancyRate: l.totalCapacity > 0 ? Math.round((filtered.filter(r => r.locationName === l.fullName).reduce((s, r) => s + r.currentOccupancy, 0) / l.totalCapacity) * 100) : 0 }));

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  const handleRadarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Capacity Utilisation Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search areas..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Capacity Utilisation Dashboard" reportDescription="Space utilisation across all areas and locations with drill-through."
        purpose="Optimise space allocation and identify overcrowded or underused areas."
        whenToUse={['Daily occupancy monitoring', 'Area combining decisions', 'Capacity expansion planning']}
        keyMetrics={[
          { label: 'Avg Utilisation', description: 'Mean occupancy as % of capacity', interpretation: 'Target 70-85%', goodRange: '70-85%', warningRange: '50-69% or 86-90%', criticalRange: '<50% or >90%' },
          { label: 'Near Capacity', description: 'Areas ≥90% utilisation', interpretation: 'Risk of exceeding capacity', goodRange: '0', warningRange: '1-2', criticalRange: '≥3' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click any bar or radar point to filter the dashboard to that location. Click ✕ to clear.' }]}
        actionableInsights={['Areas >85% should be considered for capacity expansion', 'Underutilised areas are candidates for combining']}
        relatedReports={['Area Utilisation', 'Staffing Ratio Compliance', 'Area Combining Savings']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Avg Utilisation" value={`${avgUtil}%`} icon={BarChart3} size="sm" variant={avgUtil >= 70 && avgUtil <= 85 ? 'success' : avgUtil > 90 ? 'danger' : 'warning'} sparklineData={filtered.slice(0, 8).map(r => r.utilisationPercent)} />
        <StatCard label="Near Capacity" value={nearCapacity} icon={AlertTriangle} size="sm" variant={nearCapacity >= 3 ? 'danger' : nearCapacity > 0 ? 'warning' : 'success'} />
        <StatCard label="Underutilised" value={underUtilised} icon={TrendingDown} size="sm" variant={underUtilised >= 4 ? 'danger' : underUtilised > 1 ? 'warning' : 'default'} />
        <StatCard label="Total Capacity" value={totalCapacity} icon={Building2} size="sm" />
        <StatCard label="Current Occ." value={totalCurrent} icon={Users} size="sm" />
        <StatCard label="Peak Max" value={peakMax} icon={TrendingUp} size="sm" />
        <StatCard label="Trending Up" value={trendingUp} icon={TrendingUp} size="sm" variant="success" className="cursor-pointer" />
        <StatCard label="Total Areas" value={filtered.length} icon={Target} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {nearCapacity > 2 && <InsightCard type="negative" title="Near Capacity" description={`${nearCapacity} areas at ≥90%.`} action="Review overflow plans" />}
        {underUtilised > 3 && <InsightCard type="action" title="Underutilisation" description={`${underUtilised} areas below 50%.`} action="Run area combining analysis" />}
        {avgUtil >= 70 && avgUtil <= 85 && <InsightCard type="positive" title="Optimal Range" description={`${avgUtil}% is within ideal 70-85%.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Areas', value: filtered.length }, { label: 'Avg Util', value: `${avgUtil}%`, highlight: true },
        { label: 'Near Cap', value: nearCapacity }, { label: 'Under', value: underUtilised }, { label: 'Capacity', value: totalCapacity },
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
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Location Utilisation Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} onClick={handleRadarClick}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Utilisation" dataKey="utilisation" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Occupancy %" dataKey="occupancyRate" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationSummary} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="avgUtil" name="Avg Utilisation %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Area Detail {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>}</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
