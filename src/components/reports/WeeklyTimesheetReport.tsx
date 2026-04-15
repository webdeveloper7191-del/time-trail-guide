import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockWeeklyTimesheets, approvalStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700', escalated: 'bg-orange-100 text-orange-700', auto_approved: 'bg-sky-100 text-sky-700',
};

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Department', accessor: 'department' }, { header: 'Regular Hours', accessor: 'regularHours' },
  { header: 'Overtime', accessor: 'overtimeHours' }, { header: 'Total', accessor: 'totalHours' },
  { header: 'Days Worked', accessor: 'daysWorked' }, { header: 'Status', accessor: (r: any) => approvalStatusLabels[r.status] },
];

const locations = [...new Set(mockWeeklyTimesheets.map(r => r.location))];

export function WeeklyTimesheetReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockWeeklyTimesheets.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const totalHours = filtered.reduce((s, r) => s + r.totalHours, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);

  const chartData = filtered.map(r => ({ name: r.staffName.split(' ')[0], regular: r.regularHours, overtime: r.overtimeHours }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Weekly Timesheet Summary" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Hours</p><p className="text-3xl font-bold tracking-tight mt-1">{totalHours}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Regular Hours</p><p className="text-3xl font-bold tracking-tight mt-1">{totalHours - totalOT}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Overtime</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalOT}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Staff Count</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Hours by Staff</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="regular" name="Regular" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="overtime" name="Overtime" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Timesheet Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Dept</TableHead><TableHead className="text-xs text-right">Regular</TableHead>
              <TableHead className="text-xs text-right">OT</TableHead><TableHead className="text-xs text-right">Total</TableHead>
              <TableHead className="text-xs text-right">Break</TableHead><TableHead className="text-xs text-right">Days</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.department}</TableCell>
                  <TableCell className="text-sm text-right">{r.regularHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{r.totalHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.breakMinutes}m</TableCell>
                  <TableCell className="text-sm text-right">{r.daysWorked}</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', statusColors[r.status])}>{approvalStatusLabels[r.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
