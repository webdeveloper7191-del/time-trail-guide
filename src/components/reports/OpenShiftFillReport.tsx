import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOpenShiftFill } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' },
  { header: 'Area', accessor: 'area' },
  { header: 'Total Open', accessor: 'totalOpenShifts' },
  { header: 'Filled', accessor: 'filledShifts' },
  { header: 'Internal', accessor: 'filledByInternal' },
  { header: 'Agency', accessor: 'filledByAgency' },
  { header: 'Fill Rate %', accessor: 'fillRate' },
  { header: 'Avg Time (h)', accessor: 'avgTimeToFillHours' },
  { header: 'Urgency', accessor: 'urgency' },
];

const locations = [...new Set(mockOpenShiftFill.map(r => r.location))];

export function OpenShiftFillReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockOpenShiftFill.filter(r => {
    const matchesSearch = !search || r.area.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalOpen = filtered.reduce((s, r) => s + r.totalOpenShifts, 0);
  const totalFilled = filtered.reduce((s, r) => s + r.filledShifts, 0);
  const avgFillRate = totalOpen > 0 ? Math.round((totalFilled / totalOpen) * 100) : 0;

  // Aggregate by date for trend line
  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; fillRate: number; total: number; filled: number }> = {};
    filtered.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { date: format(parseISO(r.date), 'dd MMM'), fillRate: 0, total: 0, filled: 0 };
      byDate[r.date].total += r.totalOpenShifts;
      byDate[r.date].filled += r.filledShifts;
    });
    return Object.values(byDate).map(d => ({ ...d, fillRate: d.total > 0 ? Math.round((d.filled / d.total) * 100) : 0 }));
  }, [filtered]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const totalInternal = filtered.reduce((s, r) => s + r.filledByInternal, 0);
    const totalAgency = filtered.reduce((s, r) => s + r.filledByAgency, 0);
    const totalUnfilled = filtered.reduce((s, r) => s + r.unfilled, 0);
    return [{ name: 'Internal', value: totalInternal }, { name: 'Agency', value: totalAgency }, { name: 'Unfilled', value: totalUnfilled }];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Open Shift Fill Rate Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search area or location..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Open Shifts</p><p className="text-3xl font-bold tracking-tight mt-1">{totalOpen}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Fill Rate</p><p className="text-3xl font-bold tracking-tight mt-1">{avgFillRate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Time to Fill</p><p className="text-3xl font-bold tracking-tight mt-1">{Math.round(filtered.reduce((s, r) => s + r.avgTimeToFillHours, 0) / (filtered.length || 1))}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Still Unfilled</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalOpen - totalFilled}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Fill Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="fillRate" name="Fill Rate %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Fill Source Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" name="Shifts" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Open Shift Fill Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Area</TableHead>
                <TableHead className="text-xs text-right">Open</TableHead>
                <TableHead className="text-xs text-right">Filled</TableHead>
                <TableHead className="text-xs text-right">Internal</TableHead>
                <TableHead className="text-xs text-right">Agency</TableHead>
                <TableHead className="text-xs text-right">Fill Rate</TableHead>
                <TableHead className="text-xs text-right">Avg Time</TableHead>
                <TableHead className="text-xs">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.area}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalOpenShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledByInternal}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledByAgency}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.fillRate >= 80 ? 'text-emerald-600' : r.fillRate >= 50 ? 'text-amber-600' : 'text-destructive')}>{r.fillRate}%</TableCell>
                  <TableCell className="text-sm text-right">{r.avgTimeToFillHours}h</TableCell>
                  <TableCell><Badge variant="outline" className={cn('text-xs capitalize', r.urgency === 'critical' && 'border-destructive text-destructive', r.urgency === 'high' && 'border-orange-500 text-orange-600')}>{r.urgency}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
