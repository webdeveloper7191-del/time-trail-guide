import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockRecurringPatterns } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Pattern', accessor: 'patternName' },
  { header: 'Location', accessor: 'location' },
  { header: 'Expected Shifts', accessor: 'totalExpectedShifts' },
  { header: 'Actual Shifts', accessor: 'actualShifts' },
  { header: 'Adherence %', accessor: 'adherencePercent' },
  { header: 'Deviations', accessor: 'deviations' },
  { header: 'Reasons', accessor: (r: any) => r.deviationReasons.join('; ') },
];

const locations = [...new Set(mockRecurringPatterns.map(r => r.location))];

export function RecurringPatternReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockRecurringPatterns.filter(r => {
    const matchesSearch = !search || r.patternName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const avgAdherence = Math.round(filtered.reduce((s, r) => s + r.adherencePercent, 0) / (filtered.length || 1));

  const chartData = filtered.map(r => ({
    name: r.patternName.length > 15 ? r.patternName.substring(0, 15) + '…' : r.patternName,
    expected: r.totalExpectedShifts,
    actual: r.actualShifts,
    adherence: r.adherencePercent,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Recurring Pattern Adherence Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search pattern..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Adherence</p><p className="text-3xl font-bold tracking-tight mt-1">{avgAdherence}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Deviations</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{filtered.reduce((s, r) => s + r.deviations, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Patterns</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Expected vs Actual Shifts</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expected" name="Expected" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Pattern Adherence Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Pattern</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs text-right">Expected</TableHead>
                <TableHead className="text-xs text-right">Actual</TableHead>
                <TableHead className="text-xs w-[140px]">Adherence</TableHead>
                <TableHead className="text-xs text-right">Deviations</TableHead>
                <TableHead className="text-xs">Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.patternName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalExpectedShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.actualShifts}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.adherencePercent} className="h-2 flex-1" />
                      <span className={cn('text-xs font-medium w-8 text-right', r.adherencePercent < 80 ? 'text-destructive' : 'text-foreground')}>{r.adherencePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">{r.deviations > 0 ? <Badge variant="outline" className="text-xs">{r.deviations}</Badge> : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.deviationReasons.join(', ') || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
