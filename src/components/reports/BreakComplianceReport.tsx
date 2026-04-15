import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockBreakCompliance } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Shift (h)', accessor: 'shiftDuration' }, { header: 'Required Break', accessor: (r: any) => `${r.requiredBreakMinutes}m` },
  { header: 'Actual Break', accessor: (r: any) => `${r.actualBreakMinutes}m` }, { header: 'Compliant', accessor: (r: any) => r.compliant ? 'Yes' : 'No' },
  { header: 'Violation', accessor: (r: any) => r.violation || '' },
];

const locations = [...new Set(mockBreakCompliance.map(r => r.location))];

export function BreakComplianceReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockBreakCompliance.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const compliant = filtered.filter(r => r.compliant).length;
  const violations = filtered.filter(r => !r.compliant).length;
  const complianceRate = filtered.length > 0 ? Math.round((compliant / filtered.length) * 100) : 0;

  const pieData = [{ name: 'Compliant', value: compliant }, { name: 'Violation', value: violations }];
  const pieColors = ['hsl(var(--status-approved))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Break Compliance Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Compliance Rate</p><p className="text-3xl font-bold tracking-tight mt-1">{complianceRate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Compliant Shifts</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">{compliant}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Violations</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{violations}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Compliance Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} /></PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Break Duration Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered.map(r => ({ name: r.staffName.split(' ')[0], required: r.requiredBreakMinutes, actual: r.actualBreakMinutes }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="required" name="Required (min)" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
                  <Bar dataKey="actual" name="Actual (min)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Break Compliance Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Date</TableHead><TableHead className="text-xs text-right">Shift</TableHead>
              <TableHead className="text-xs text-right">Required</TableHead><TableHead className="text-xs text-right">Actual</TableHead>
              <TableHead className="text-xs">Timings</TableHead><TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Violation</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-right">{r.shiftDuration}h</TableCell>
                  <TableCell className="text-sm text-right">{r.requiredBreakMinutes}m</TableCell>
                  <TableCell className={cn('text-sm text-right', !r.compliant && 'text-destructive font-medium')}>{r.actualBreakMinutes}m</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.breakTimings}</TableCell>
                  <TableCell>{r.compliant ? <Badge className="text-xs bg-emerald-100 text-emerald-700">OK</Badge> : <Badge className="text-xs bg-red-100 text-red-700">Violation</Badge>}</TableCell>
                  <TableCell className="text-xs text-destructive">{r.violation || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
