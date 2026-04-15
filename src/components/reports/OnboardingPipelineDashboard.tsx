import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockOnboardingData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  not_started: 'bg-muted text-muted-foreground',
  overdue: 'bg-destructive/10 text-destructive',
};
const statusLabels: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started', overdue: 'Overdue' };
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--primary))', 'hsl(var(--chart-3))', 'hsl(var(--destructive))'];

export function OnboardingPipelineDashboard() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockOnboardingData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.position.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const statusSummary = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, not_started: 0, overdue: 0 };
    filtered.forEach(r => counts[r.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name: statusLabels[name], value }));
  }, [filtered]);

  const avgCompletion = useMemo(() => {
    if (!filtered.length) return 0;
    return Math.round(filtered.reduce((s, r) => s + r.completionPct, 0) / filtered.length);
  }, [filtered]);

  const locations = [...new Set(mockOnboardingData.map(r => r.location))];

  const exportColumns: ExportColumn[] = [
    { header: 'Staff Name', accessor: 'staffName' },
    { header: 'Position', accessor: 'position' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: (r) => statusLabels[r.status] },
    { header: 'Completion %', accessor: 'completionPct' },
    { header: 'Days in Pipeline', accessor: 'daysInPipeline' },
    { header: 'Assigned To', accessor: 'assignedTo' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Onboarding Pipeline" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} <ReportFilterBar title="Onboarding Pipeline" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statusSummary.map((s, i) => (
          <Card key={s.name} className="border-border/60"><CardContent className="p-4">
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.name}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pipeline Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusSummary} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Avg Completion: {avgCompletion}%</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="staffName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="completionPct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Onboarding Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Position</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Progress</TableHead>
              <TableHead className="text-xs text-right">Days</TableHead>
              <TableHead className="text-xs">Assigned To</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.position}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColors[r.status]}`}>{statusLabels[r.status]}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={r.completionPct} className="h-2 w-20" /><span className="text-xs text-muted-foreground">{r.stepsCompleted}/{r.totalSteps}</span></div></TableCell>
                  <TableCell className="text-sm text-right">{r.daysInPipeline}</TableCell>
                  <TableCell className="text-sm">{r.assignedTo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
