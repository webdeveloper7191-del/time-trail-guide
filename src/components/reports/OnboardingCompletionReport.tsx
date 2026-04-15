import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockOnboardingData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

const statusLabels: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started', overdue: 'Overdue' };
const statusVariant: Record<string, string> = { completed: 'bg-emerald-100 text-emerald-800', in_progress: 'bg-blue-100 text-blue-800', not_started: 'bg-muted text-muted-foreground', overdue: 'bg-destructive/10 text-destructive' };

export function OnboardingCompletionReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockOnboardingData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const completionRate = useMemo(() => {
    if (!filtered.length) return 0;
    return Math.round((filtered.filter(r => r.status === 'completed').length / filtered.length) * 100);
  }, [filtered]);

  const avgDays = useMemo(() => {
    const completed = filtered.filter(r => r.status === 'completed');
    if (!completed.length) return 0;
    return Math.round(completed.reduce((s, r) => s + r.daysInPipeline, 0) / completed.length);
  }, [filtered]);

  const locations = [...new Set(mockOnboardingData.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Staff', accessor: 'staffName' },
    { header: 'Position', accessor: 'position' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: (r) => statusLabels[r.status] },
    { header: 'Completion %', accessor: 'completionPct' },
    { header: 'Days', accessor: 'daysInPipeline' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Onboarding Completion Rate" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} <ReportFilterBar title="Onboarding Completion Rate" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4"><p className="text-2xl font-bold tracking-tight">{completionRate}%</p><p className="text-xs text-muted-foreground">Completion Rate</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><p className="text-2xl font-bold tracking-tight">{avgDays}d</p><p className="text-xs text-muted-foreground">Avg Days to Complete</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.status === 'overdue').length}</p><p className="text-xs text-muted-foreground">Overdue</p></CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Completion by Staff</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={filtered} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="staffName" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="completionPct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Position</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Progress</TableHead>
              <TableHead className="text-xs text-right">Days</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.position}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusVariant[r.status]}`}>{statusLabels[r.status]}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={r.completionPct} className="h-2 w-20" /><span className="text-xs">{r.completionPct}%</span></div></TableCell>
                  <TableCell className="text-sm text-right">{r.daysInPipeline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
