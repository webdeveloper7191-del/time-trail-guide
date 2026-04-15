import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAttendanceTrends } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Scheduled', accessor: 'totalScheduled' },
  { header: 'Present', accessor: 'present' }, { header: 'Absent', accessor: 'absent' },
  { header: 'Late', accessor: 'late' }, { header: 'Attendance %', accessor: 'attendanceRate' },
  { header: 'Sick', accessor: (r: any) => r.absenceType.sick }, { header: 'Annual', accessor: (r: any) => r.absenceType.annual },
  { header: 'No Show', accessor: (r: any) => r.absenceType.noShow },
];

const locations = [...new Set(mockAttendanceTrends.map(r => r.location))];

export function AttendanceTrendReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAttendanceTrends.filter(r => {
    const ms = !search || r.location.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const avgRate = Math.round(filtered.reduce((s, r) => s + r.attendanceRate, 0) / (filtered.length || 1));
  const totalAbsent = filtered.reduce((s, r) => s + r.absent, 0);
  const totalLate = filtered.reduce((s, r) => s + r.late, 0);

  // Attendance trend line
  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; rate: number; count: number; absent: number }> = {};
    filtered.forEach(r => {
      const key = r.date;
      if (!byDate[key]) byDate[key] = { date: format(parseISO(r.date), 'dd MMM'), rate: 0, count: 0, absent: 0 };
      byDate[key].rate += r.attendanceRate;
      byDate[key].count++;
      byDate[key].absent += r.absent;
    });
    return Object.values(byDate).map(d => ({ date: d.date, rate: Math.round(d.rate / d.count), absent: d.absent }));
  }, [filtered]);

  // Absence type breakdown
  const absenceBreakdown = useMemo(() => {
    const totals = { sick: 0, annual: 0, personal: 0, noShow: 0 };
    filtered.forEach(r => {
      totals.sick += r.absenceType.sick;
      totals.annual += r.absenceType.annual;
      totals.personal += r.absenceType.personal;
      totals.noShow += r.absenceType.noShow;
    });
    return [
      { name: 'Sick', value: totals.sick },
      { name: 'Annual', value: totals.annual },
      { name: 'Personal', value: totals.personal },
      { name: 'No Show', value: totals.noShow },
    ];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Attendance Trend Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search location..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Attendance Rate</p><p className="text-3xl font-bold tracking-tight mt-1">{avgRate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Absences</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalAbsent}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Late Arrivals</p><p className="text-3xl font-bold tracking-tight mt-1 text-amber-600">{totalLate}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Data Points</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Attendance Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="rate" name="Attendance %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Absence Type Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absenceBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" name="Absences" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Daily Attendance Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs text-right">Scheduled</TableHead><TableHead className="text-xs text-right">Present</TableHead>
              <TableHead className="text-xs text-right">Absent</TableHead><TableHead className="text-xs text-right">Late</TableHead>
              <TableHead className="text-xs text-right">Rate</TableHead>
              <TableHead className="text-xs text-right">Sick</TableHead><TableHead className="text-xs text-right">Annual</TableHead>
              <TableHead className="text-xs text-right">No Show</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalScheduled}</TableCell>
                  <TableCell className="text-sm text-right">{r.present}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.absent > 0 && 'text-destructive font-medium')}>{r.absent}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.late > 0 && 'text-amber-600')}>{r.late}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.attendanceRate < 85 ? 'text-destructive' : 'text-foreground')}>{r.attendanceRate}%</TableCell>
                  <TableCell className="text-sm text-right">{r.absenceType.sick || '—'}</TableCell>
                  <TableCell className="text-sm text-right">{r.absenceType.annual || '—'}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.absenceType.noShow > 0 && 'text-destructive')}>{r.absenceType.noShow || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
