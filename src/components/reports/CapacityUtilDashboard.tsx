import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCapacityUtil, CapacityUtilData, capacityByHourData } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

  const locationSummary = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc, avgUtil: Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / (items.length || 1)), totalCapacity: items.reduce((s, r) => s + r.capacity, 0) };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Capacity Utilisation Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search areas..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{avgUtil}%</p>
          <p className="text-xs text-muted-foreground">Average Utilisation</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.utilisationPercent >= 90).length}</p>
          <p className="text-xs text-muted-foreground">Areas Near Capacity</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.utilisationPercent < 50).length}</p>
          <p className="text-xs text-muted-foreground">Underutilised Areas</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Occupancy Throughout Day</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={capacityByHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="occupancy" name="Occupancy" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Area type="monotone" dataKey="capacity" name="Capacity" fill="transparent" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Utilisation by Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locationSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
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
