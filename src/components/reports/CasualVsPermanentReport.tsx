import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCasualVsPermanent, CasualVsPermanentRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Period', accessor: 'period' },
  { header: 'Perm HC', accessor: 'permanentHeadcount' }, { header: 'Casual HC', accessor: 'casualHeadcount' },
  { header: 'Perm Cost', accessor: 'permanentCost' }, { header: 'Casual Cost', accessor: 'casualCost' },
  { header: 'Casual $/hr', accessor: 'costPerHourCasual' },
];

const locations = [...new Set(mockCasualVsPermanent.map(r => r.location))];

const tableColumns: DataTableColumn<CasualVsPermanentRecord>[] = [
  { key: 'location', header: 'Location', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'period', header: 'Period', accessor: (r) => r.period, sortValue: (r) => r.period },
  { key: 'permanentHeadcount', header: 'Perm HC', accessor: (r) => r.permanentHeadcount, sortValue: (r) => r.permanentHeadcount, align: 'right' },
  { key: 'casualHeadcount', header: 'Casual HC', accessor: (r) => r.casualHeadcount, sortValue: (r) => r.casualHeadcount, align: 'right' },
  { key: 'permanentHours', header: 'Perm Hrs', accessor: (r) => `${r.permanentHours}h`, sortValue: (r) => r.permanentHours, align: 'right' },
  { key: 'casualHours', header: 'Casual Hrs', accessor: (r) => `${r.casualHours}h`, sortValue: (r) => r.casualHours, align: 'right' },
  { key: 'permanentCost', header: 'Perm Cost', accessor: (r) => `$${(r.permanentCost / 1000).toFixed(1)}k`, sortValue: (r) => r.permanentCost, align: 'right' },
  { key: 'casualCost', header: 'Casual Cost', accessor: (r) => `$${(r.casualCost / 1000).toFixed(1)}k`, sortValue: (r) => r.casualCost, align: 'right' },
  { key: 'costPerHourPermanent', header: '$/hr Perm', accessor: (r) => `$${r.costPerHourPermanent}`, sortValue: (r) => r.costPerHourPermanent, align: 'right' },
  { key: 'costPerHourCasual', header: '$/hr Casual', sortValue: (r) => r.costPerHourCasual, align: 'right',
    accessor: (r) => <span className="text-destructive font-medium">${r.costPerHourCasual}</span> },
  { key: 'casualLoadingPercent', header: 'Loading', accessor: (r) => `${r.casualLoadingPercent}%`, sortValue: (r) => r.casualLoadingPercent, align: 'right' },
];

export function CasualVsPermanentReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockCasualVsPermanent.filter(r => {
    const matchesSearch = !search || r.location.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const periods = [...new Set(filtered.map(r => r.period))];
  const trendData = periods.map(p => {
    const items = filtered.filter(r => r.period === p);
    return { period: p, permanent: items.reduce((s, r) => s + r.permanentCost, 0), casual: items.reduce((s, r) => s + r.casualCost, 0) };
  });

  const totalPerm = filtered.reduce((s, r) => s + r.permanentCost, 0);
  const totalCasual = filtered.reduce((s, r) => s + r.casualCost, 0);
  const casualPercent = Math.round(totalCasual / (totalPerm + totalCasual) * 100);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Casual vs Permanent Cost Comparison" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalPerm / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Permanent Cost</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-destructive">${(totalCasual / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Casual Cost</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{casualPercent}%</p>
          <p className="text-xs text-muted-foreground">Casual as % of Total</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="permanent" name="Permanent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="casual" name="Casual" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.location}-${r.period}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
