import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLatePunctuality } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const typeColors: Record<string, string> = { late_in: 'bg-amber-100 text-amber-700', early_out: 'bg-orange-100 text-orange-700', both: 'bg-red-100 text-red-700' };
const typeLabels: Record<string, string> = { late_in: 'Late In', early_out: 'Early Out', both: 'Both' };

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Scheduled Start', accessor: 'scheduledStart' }, { header: 'Actual Clock In', accessor: 'actualClockIn' },
  { header: 'Late (min)', accessor: 'lateMinutes' }, { header: 'Scheduled End', accessor: 'scheduledEnd' },
  { header: 'Actual Clock Out', accessor: 'actualClockOut' }, { header: 'Early (min)', accessor: 'earlyMinutes' },
  { header: 'Type', accessor: (r: any) => typeLabels[r.type] },
];

const locations = [...new Set(mockLatePunctuality.map(r => r.location))];

export function LatePunctualityReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockLatePunctuality.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const totalLateMinutes = filtered.reduce((s, r) => s + r.lateMinutes, 0);
  const totalEarlyMinutes = filtered.reduce((s, r) => s + r.earlyMinutes, 0);

  // Aggregate by staff
  const staffAgg = useMemo(() => {
    const agg: Record<string, { name: string; lateCount: number; totalLate: number; earlyCount: number }> = {};
    filtered.forEach(r => {
      if (!agg[r.staffName]) agg[r.staffName] = { name: r.staffName.split(' ')[0], lateCount: 0, totalLate: 0, earlyCount: 0 };
      if (r.lateMinutes > 0) { agg[r.staffName].lateCount++; agg[r.staffName].totalLate += r.lateMinutes; }
      if (r.earlyMinutes > 0) agg[r.staffName].earlyCount++;
    });
    return Object.values(agg);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Late Clock-In / Early Clock-Out Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Incidents</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Late Minutes</p><p className="text-3xl font-bold tracking-tight mt-1 text-amber-600">{totalLateMinutes}m</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Early Minutes</p><p className="text-3xl font-bold tracking-tight mt-1 text-orange-600">{totalEarlyMinutes}m</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Repeat Offenders</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{staffAgg.filter(s => s.lateCount >= 2).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Late Incidents by Staff</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffAgg} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lateCount" name="Late Ins" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earlyCount" name="Early Outs" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Punctuality Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Scheduled</TableHead>
              <TableHead className="text-xs">Actual In</TableHead><TableHead className="text-xs text-right">Late</TableHead>
              <TableHead className="text-xs">Actual Out</TableHead><TableHead className="text-xs text-right">Early</TableHead>
              <TableHead className="text-xs">Type</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.scheduledStart}</TableCell>
                  <TableCell className="text-sm">{r.actualClockIn}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.lateMinutes > 10 && 'text-destructive font-medium')}>{r.lateMinutes > 0 ? `+${r.lateMinutes}m` : '—'}</TableCell>
                  <TableCell className="text-sm">{r.actualClockOut}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.earlyMinutes > 10 && 'text-destructive font-medium')}>{r.earlyMinutes > 0 ? `-${r.earlyMinutes}m` : '—'}</TableCell>
                  <TableCell><Badge className={cn('text-xs', typeColors[r.type])}>{typeLabels[r.type]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
