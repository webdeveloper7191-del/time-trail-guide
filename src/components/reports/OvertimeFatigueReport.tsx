import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOvertimeFatigue } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

const riskColors: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const riskFills: Record<string, string> = {
  low: 'hsl(var(--status-approved))',
  medium: 'hsl(var(--warning))',
  high: 'hsl(30, 80%, 50%)',
  critical: 'hsl(var(--destructive))',
};

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' },
  { header: 'Location', accessor: 'location' },
  { header: 'Weekly Hours', accessor: 'weeklyHours' },
  { header: 'Max Hours', accessor: 'maxHours' },
  { header: 'Overtime', accessor: 'overtimeHours' },
  { header: 'Consec. Days', accessor: 'consecutiveDays' },
  { header: 'Rest Hours', accessor: 'restHoursBetweenShifts' },
  { header: 'Fatigue Score', accessor: 'fatigueScore' },
  { header: 'Risk Level', accessor: 'riskLevel' },
];

const locations = [...new Set(mockOvertimeFatigue.map(r => r.location))];

export function OvertimeFatigueReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = useMemo(() => mockOvertimeFatigue.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const criticalCount = filtered.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length;
  const chartData = filtered.map(r => ({ name: r.staffName.split(' ')[0], fatigue: r.fatigueScore, risk: r.riskLevel }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Overtime & Fatigue Risk Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">High/Critical Risk</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{criticalCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Overtime</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.reduce((s, r) => s + r.overtimeHours, 0)}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Fatigue Score</p><p className="text-3xl font-bold tracking-tight mt-1">{Math.round(filtered.reduce((s, r) => s + r.fatigueScore, 0) / (filtered.length || 1))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Fatigue Score by Staff</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="fatigue" name="Fatigue Score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={riskFills[entry.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Fatigue Risk Assessment</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs text-right">Weekly Hrs</TableHead>
                <TableHead className="text-xs text-right">Overtime</TableHead>
                <TableHead className="text-xs text-right">Consec. Days</TableHead>
                <TableHead className="text-xs text-right">Rest Hrs</TableHead>
                <TableHead className="text-xs text-right">Fatigue Score</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filtered].sort((a, b) => b.fatigueScore - a.fatigueScore).map((r) => (
                <TableRow key={r.staffId}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.weeklyHours}h / {r.maxHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.consecutiveDays >= 6 && 'text-destructive font-medium')}>{r.consecutiveDays}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.restHoursBetweenShifts < 10 && 'text-destructive font-medium')}>{r.restHoursBetweenShifts}h</TableCell>
                  <TableCell className="text-sm text-right font-mono">{r.fatigueScore}/100</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', riskColors[r.riskLevel])}>{r.riskLevel}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
