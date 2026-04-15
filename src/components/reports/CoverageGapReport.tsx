import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCoverageGaps } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const severityColors: Record<string, string> = {
  minor: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const severityFills: Record<string, string> = {
  minor: 'hsl(var(--status-approved))',
  moderate: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
};

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' },
  { header: 'Area', accessor: 'area' },
  { header: 'Time Slot', accessor: 'timeSlot' },
  { header: 'Required', accessor: 'requiredStaff' },
  { header: 'Scheduled', accessor: 'scheduledStaff' },
  { header: 'Gap', accessor: 'gap' },
  { header: 'Severity', accessor: 'gapSeverity' },
  { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockCoverageGaps.map(r => r.location))];

export function CoverageGapReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockCoverageGaps.filter(r => {
    const matchesSearch = !search || r.area.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    const matchesSev = severityFilter === 'all' || r.gapSeverity === severityFilter;
    return matchesSearch && matchesLoc && matchesSev;
  }), [search, locationFilter, severityFilter]);

  const chartData = filtered.filter(r => r.gap > 0).map((r, i) => ({
    name: `${r.area} (${format(parseISO(r.date), 'dd/MM')})`,
    gap: r.gap,
    severity: r.gapSeverity,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Coverage Gap Analysis" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search area or reason..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange}>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </ReportFilterBar>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Coverage Gaps</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.reduce((s, r) => s + r.gap, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical Gaps</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{filtered.filter(r => r.gapSeverity === 'critical').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Affected Slots</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.filter(r => r.gap > 0).length}</p></CardContent></Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Gap Distribution by Area</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="gap" name="Staff Gap" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={severityFills[entry.severity]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Coverage Gap Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Area</TableHead>
                <TableHead className="text-xs">Time Slot</TableHead>
                <TableHead className="text-xs text-right">Required</TableHead>
                <TableHead className="text-xs text-right">Scheduled</TableHead>
                <TableHead className="text-xs text-right">Gap</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.area}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.timeSlot}</TableCell>
                  <TableCell className="text-sm text-right">{r.requiredStaff}</TableCell>
                  <TableCell className="text-sm text-right">{r.scheduledStaff}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.gap > 0 && 'text-destructive')}>{r.gap > 0 ? `-${r.gap}` : '✓'}</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', severityColors[r.gapSeverity])}>{r.gapSeverity}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.reason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
