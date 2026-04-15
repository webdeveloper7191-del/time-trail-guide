import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTimesheetExceptions, exceptionTypeLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const typeColors: Record<string, string> = {
  manual_edit: 'bg-amber-100 text-amber-700', manager_override: 'bg-orange-100 text-orange-700',
  time_adjustment: 'bg-sky-100 text-sky-700', retroactive_entry: 'bg-purple-100 text-purple-700',
  system_correction: 'bg-emerald-100 text-emerald-700',
};

const typeFills: Record<string, string> = {
  manual_edit: 'hsl(var(--warning))', manager_override: 'hsl(30, 80%, 50%)',
  time_adjustment: 'hsl(var(--primary))', retroactive_entry: 'hsl(280, 60%, 50%)',
  system_correction: 'hsl(var(--status-approved))',
};

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Type', accessor: (r: any) => exceptionTypeLabels[r.exceptionType] },
  { header: 'Field', accessor: 'field' }, { header: 'Original', accessor: 'originalValue' },
  { header: 'New Value', accessor: 'newValue' }, { header: 'Edited By', accessor: 'editedBy' },
  { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockTimesheetExceptions.map(r => r.location))];

export function TimesheetExceptionReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockTimesheetExceptions.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.editedBy.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach(r => { c[r.exceptionType] = (c[r.exceptionType] || 0) + 1; });
    return Object.entries(c).map(([k, v]) => ({ name: exceptionTypeLabels[k as keyof typeof exceptionTypeLabels], value: v, type: k }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Timesheet Exception Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff or editor..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Exceptions</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Manager Overrides</p><p className="text-3xl font-bold tracking-tight mt-1 text-orange-600">{filtered.filter(r => r.exceptionType === 'manager_override').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Retroactive Entries</p><p className="text-3xl font-bold tracking-tight mt-1 text-amber-600">{filtered.filter(r => r.exceptionType === 'retroactive_entry').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Exceptions by Type</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeCounts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {typeCounts.map((entry, i) => <Cell key={i} fill={typeFills[entry.type] || 'hsl(var(--primary))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Exception Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Field</TableHead><TableHead className="text-xs">Original</TableHead>
              <TableHead className="text-xs">New</TableHead><TableHead className="text-xs">Edited By</TableHead>
              <TableHead className="text-xs">Reason</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell><Badge className={cn('text-xs', typeColors[r.exceptionType])}>{exceptionTypeLabels[r.exceptionType]}</Badge></TableCell>
                  <TableCell className="text-sm">{r.field}</TableCell>
                  <TableCell className="text-sm text-muted-foreground line-through">{r.originalValue}</TableCell>
                  <TableCell className="text-sm font-medium">{r.newValue}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.editedBy}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
