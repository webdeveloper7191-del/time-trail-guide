import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockFairness } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' },
  { header: 'Location', accessor: 'location' },
  { header: 'Total Shifts', accessor: 'totalShifts' },
  { header: 'Weekend', accessor: 'weekendShifts' },
  { header: 'Early', accessor: 'earlyShifts' },
  { header: 'Late', accessor: 'lateShifts' },
  { header: 'Fairness Score', accessor: 'fairnessScore' },
  { header: 'Deviation %', accessor: 'deviationFromAvg' },
];

const locations = [...new Set(mockFairness.map(r => r.location))];

export function FairnessReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockFairness.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const avgScore = Math.round(filtered.reduce((s, r) => s + r.fairnessScore, 0) / (filtered.length || 1));

  const distributionData = filtered.map(r => ({
    name: r.staffName.split(' ')[0],
    weekend: r.weekendShifts,
    early: r.earlyShifts,
    late: r.lateShifts,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Schedule Fairness Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Fairness Score</p><p className="text-3xl font-bold tracking-tight mt-1">{avgScore}/100</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Below Threshold (&lt;70)</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{filtered.filter(r => r.fairnessScore < 70).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Weekend Shifts</p><p className="text-3xl font-bold tracking-tight mt-1">{(filtered.reduce((s, r) => s + r.weekendShifts, 0) / (filtered.length || 1)).toFixed(1)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Shift Type Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="weekend" name="Weekend" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="early" name="Early" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="late" name="Late" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Shift Distribution Equity</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
                <TableHead className="text-xs text-right">Weekend</TableHead>
                <TableHead className="text-xs text-right">Early</TableHead>
                <TableHead className="text-xs text-right">Late</TableHead>
                <TableHead className="text-xs w-[140px]">Fairness</TableHead>
                <TableHead className="text-xs text-right">Deviation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filtered].sort((a, b) => a.fairnessScore - b.fairnessScore).map((r) => (
                <TableRow key={r.staffId}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.weekendShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.earlyShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.lateShifts}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.fairnessScore} className="h-2 flex-1" />
                      <span className={cn('text-xs font-medium w-8 text-right', r.fairnessScore < 70 ? 'text-destructive' : 'text-foreground')}>{r.fairnessScore}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.deviationFromAvg > 10 ? 'text-destructive' : r.deviationFromAvg < -10 ? 'text-amber-600' : 'text-muted-foreground')}>
                    {r.deviationFromAvg > 0 ? '+' : ''}{r.deviationFromAvg}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
