import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAreaUtil, AreaUtilRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Category', accessor: 'serviceCategory' }, { header: 'Capacity', accessor: 'capacity' },
  { header: 'Avg Occupancy', accessor: 'avgOccupancy' }, { header: 'Utilisation %', accessor: 'utilisationPercent' },
  { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockAreaUtil.map(r => r.locationName))];

const tableColumns: DataTableColumn<AreaUtilRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'serviceCategory', header: 'Category', accessor: (r) => <Badge variant="outline" className="text-xs">{r.serviceCategory}</Badge>, sortValue: (r) => r.serviceCategory },
  { key: 'capacity', header: 'Capacity', accessor: (r) => r.capacity, sortValue: (r) => r.capacity, align: 'right' },
  { key: 'avgOccupancy', header: 'Avg Occ.', accessor: (r) => r.avgOccupancy, sortValue: (r) => r.avgOccupancy, align: 'right' },
  { key: 'peakOccupancy', header: 'Peak', accessor: (r) => r.peakOccupancy, sortValue: (r) => r.peakOccupancy, align: 'right' },
  { key: 'utilisationPercent', header: 'Utilisation', className: 'w-[140px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.utilisationPercent} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium w-8 text-right', r.utilisationPercent >= 90 ? 'text-destructive' : 'text-foreground')}>{r.utilisationPercent}%</span>
      </div>
    ) },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="text-xs">{r.status}</Badge> },
];

export function AreaUtilReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAreaUtil.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.serviceCategory.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc.split(' ')[0], util: Math.round(items.reduce((s, r) => s + r.utilisationPercent, 0) / (items.length || 1)) };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Area Utilisation Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search areas..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Utilisation by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="util" name="Utilisation %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Areas</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
