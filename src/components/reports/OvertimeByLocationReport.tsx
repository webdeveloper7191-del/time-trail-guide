import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOvertimeByLocation } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Department', accessor: 'department' },
  { header: 'Staff Count', accessor: 'staffCount' }, { header: 'Total OT Hours', accessor: 'totalOvertimeHours' },
  { header: 'Avg OT/Staff', accessor: 'avgOvertimePerStaff' }, { header: 'OT Cost ($)', accessor: 'overtimeCost' },
  { header: 'Top OT Staff', accessor: 'topOvertimeStaff' }, { header: 'Top OT Hours', accessor: 'topOvertimeHours' },
];

const locations = [...new Set(mockOvertimeByLocation.map(r => r.location))];

export function OvertimeByLocationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockOvertimeByLocation.filter(r => {
    const ms = !search || r.department.toLowerCase().includes(search.toLowerCase()) || r.topOvertimeStaff.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const totalOT = filtered.reduce((s, r) => s + r.totalOvertimeHours, 0);
  const totalCost = filtered.reduce((s, r) => s + r.overtimeCost, 0);

  const chartData = filtered.map(r => ({ name: `${r.department}`, ot: r.totalOvertimeHours, cost: r.overtimeCost }));

  // Weekly trend from all filtered departments
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, i) => ({
      day,
      hours: filtered.reduce((s, r) => s + (r.weekTrend[i] || 0), 0),
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Overtime by Location Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search department..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Overtime</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalOT}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Overtime Cost</p><p className="text-3xl font-bold tracking-tight mt-1">${totalCost.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Departments with OT</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.filter(r => r.totalOvertimeHours > 0).length}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">OT Hours by Department</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="ot" name="OT Hours" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Weekly OT Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="hours" name="OT Hours" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Overtime Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs text-right">Staff</TableHead><TableHead className="text-xs text-right">Total OT</TableHead>
              <TableHead className="text-xs text-right">Avg/Staff</TableHead><TableHead className="text-xs text-right">Cost</TableHead>
              <TableHead className="text-xs">Top Contributor</TableHead><TableHead className="text-xs text-right">Their OT</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.department}</TableCell>
                  <TableCell className="text-sm text-right">{r.staffCount}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.totalOvertimeHours > 5 && 'text-destructive')}>{r.totalOvertimeHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.avgOvertimePerStaff.toFixed(1)}h</TableCell>
                  <TableCell className="text-sm text-right">${r.overtimeCost}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.topOvertimeStaff}</TableCell>
                  <TableCell className="text-sm text-right">{r.topOvertimeHours > 0 ? `${r.topOvertimeHours}h` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
