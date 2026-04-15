import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockApprovalPipeline, approvalStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  escalated: 'bg-orange-100 text-orange-700',
  auto_approved: 'bg-sky-100 text-sky-700',
};

const pieColors = ['hsl(var(--warning))', 'hsl(var(--status-approved))', 'hsl(var(--destructive))', 'hsl(30, 80%, 50%)', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' },
  { header: 'Location', accessor: 'location' },
  { header: 'Period', accessor: 'period' },
  { header: 'Total Hours', accessor: 'totalHours' },
  { header: 'Overtime', accessor: 'overtimeHours' },
  { header: 'Status', accessor: (r: any) => approvalStatusLabels[r.status] },
  { header: 'Tier', accessor: 'tier' },
  { header: 'Turnaround (h)', accessor: (r: any) => r.turnaroundHours ?? 'Pending' },
];

const locations = [...new Set(mockApprovalPipeline.map(r => r.location))];

export function TimesheetApprovalDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockApprovalPipeline.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const pending = filtered.filter(r => r.status === 'pending').length;
  const escalated = filtered.filter(r => r.status === 'escalated').length;
  const approved = filtered.filter(r => r.status === 'approved' || r.status === 'auto_approved').length;

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: approvalStatusLabels[k as keyof typeof approvalStatusLabels], value: v }));
  }, [filtered]);

  const tierData = [1, 2, 3].map(t => ({
    name: `Tier ${t}`,
    count: filtered.filter(r => r.tier === t).length,
    pending: filtered.filter(r => r.tier === t && r.status === 'pending').length,
  })).filter(t => t.count > 0);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Timesheet Approval Pipeline" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-3xl font-bold tracking-tight mt-1 text-amber-600">{pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Escalated</p><p className="text-3xl font-bold tracking-tight mt-1 text-orange-600">{escalated}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Approved</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">{approved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">With Exceptions</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{filtered.filter(r => r.hasExceptions).length}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">By Approval Tier</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approval Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs text-right">Hours</TableHead>
                <TableHead className="text-xs text-right">OT</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Tier</TableHead>
                <TableHead className="text-xs text-right">Turnaround</TableHead>
                <TableHead className="text-xs">Exceptions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.period}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', statusColors[r.status])}>{approvalStatusLabels[r.status]}</Badge></TableCell>
                  <TableCell className="text-sm">Tier {r.tier}</TableCell>
                  <TableCell className="text-sm text-right">{r.turnaroundHours != null ? `${r.turnaroundHours}h` : '—'}</TableCell>
                  <TableCell>{r.hasExceptions ? <Badge variant="outline" className="text-xs border-destructive text-destructive">Yes</Badge> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
