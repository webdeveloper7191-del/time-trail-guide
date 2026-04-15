import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockRealTimeAttendance, clockStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const statusBadgeColors: Record<string, string> = {
  clocked_in: 'bg-emerald-100 text-emerald-700',
  on_break: 'bg-amber-100 text-amber-700',
  clocked_out: 'bg-muted text-muted-foreground',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-orange-100 text-orange-700',
  not_started: 'bg-sky-100 text-sky-700',
};

const pieColors = ['hsl(var(--status-approved))', 'hsl(var(--warning))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', 'hsl(30, 80%, 50%)', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' },
  { header: 'Location', accessor: 'location' },
  { header: 'Role', accessor: 'role' },
  { header: 'Scheduled', accessor: (r: any) => `${r.scheduledStart} - ${r.scheduledEnd}` },
  { header: 'Clock In', accessor: (r: any) => r.actualClockIn || '—' },
  { header: 'Status', accessor: (r: any) => clockStatusLabels[r.status] },
  { header: 'Late (min)', accessor: (r: any) => r.lateMinutes || 0 },
  { header: 'Hours', accessor: (r: any) => r.currentShiftHours || 0 },
];

const locations = [...new Set(mockRealTimeAttendance.map(r => r.location))];

export function RealTimeAttendanceDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockRealTimeAttendance.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const clockedIn = filtered.filter(r => r.status === 'clocked_in' || r.status === 'late').length;
  const onBreak = filtered.filter(r => r.status === 'on_break').length;
  const absent = filtered.filter(r => r.status === 'absent').length;
  const late = filtered.filter(r => r.lateMinutes && r.lateMinutes > 0).length;

  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: clockStatusLabels[k as keyof typeof clockStatusLabels], value: v }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Real-Time Attendance" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff or role..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Scheduled</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Clocked In</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">{clockedIn}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">On Break</p><p className="text-3xl font-bold tracking-tight mt-1 text-amber-600">{onBreak}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Absent</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{absent}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Late Arrivals</p><p className="text-3xl font-bold tracking-tight mt-1 text-orange-600">{late}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Live Staff Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Staff</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Scheduled</TableHead>
                  <TableHead className="text-xs">Clock In</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.staffId}>
                    <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.role}</TableCell>
                    <TableCell className="text-xs">{r.scheduledStart} - {r.scheduledEnd}</TableCell>
                    <TableCell className="text-sm">{r.actualClockIn || '—'}{r.lateMinutes && r.lateMinutes > 5 ? <span className="text-destructive ml-1 text-xs">(+{r.lateMinutes}m)</span> : ''}</TableCell>
                    <TableCell><Badge className={cn('text-xs', statusBadgeColors[r.status])}>{clockStatusLabels[r.status]}</Badge></TableCell>
                    <TableCell className="text-sm text-right">{r.currentShiftHours ? `${r.currentShiftHours}h` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
