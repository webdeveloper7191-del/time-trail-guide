import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockApprovalSLA } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Approver', accessor: 'approverName' }, { header: 'Location', accessor: 'location' },
  { header: 'Total Approvals', accessor: 'totalApprovals' }, { header: 'Within SLA', accessor: 'withinSLA' },
  { header: 'Breached', accessor: 'breachedSLA' }, { header: 'Avg Turnaround (h)', accessor: 'avgTurnaroundHours' },
  { header: 'SLA Compliance %', accessor: 'slaCompliancePercent' }, { header: 'Tier', accessor: 'tier' },
];

export function ApprovalSLAReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = mockApprovalSLA.filter(r => !search || r.approverName.toLowerCase().includes(search.toLowerCase()));
  const avgCompliance = Math.round(filtered.reduce((s, r) => s + r.slaCompliancePercent, 0) / (filtered.length || 1));
  const totalBreached = filtered.reduce((s, r) => s + r.breachedSLA, 0);

  const chartData = filtered.map(r => ({ name: r.approverName.split(' ')[0], withinSLA: r.withinSLA, breached: r.breachedSLA, turnaround: r.avgTurnaroundHours }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Approval SLA Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search approver..." exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg SLA Compliance</p><p className="text-3xl font-bold tracking-tight mt-1">{avgCompliance}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total SLA Breaches</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalBreached}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Turnaround</p><p className="text-3xl font-bold tracking-tight mt-1">{(filtered.reduce((s, r) => s + r.avgTurnaroundHours, 0) / (filtered.length || 1)).toFixed(1)}h</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">SLA Performance by Approver</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="withinSLA" name="Within SLA" fill="hsl(var(--status-approved))" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="breached" name="Breached" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approver SLA Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Approver</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead><TableHead className="text-xs text-right">Within SLA</TableHead>
              <TableHead className="text-xs text-right">Breached</TableHead><TableHead className="text-xs text-right">Avg Turnaround</TableHead>
              <TableHead className="text-xs w-[140px]">SLA Compliance</TableHead><TableHead className="text-xs">Tier</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.approverName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalApprovals}</TableCell>
                  <TableCell className="text-sm text-right">{r.withinSLA}</TableCell>
                  <TableCell className={cn('text-sm text-right', r.breachedSLA > 0 && 'text-destructive font-medium')}>{r.breachedSLA}</TableCell>
                  <TableCell className="text-sm text-right">{r.avgTurnaroundHours}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.slaCompliancePercent} className="h-2 flex-1" />
                      <span className={cn('text-xs font-medium w-8 text-right', r.slaCompliancePercent < 75 ? 'text-destructive' : 'text-foreground')}>{r.slaCompliancePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">Tier {r.tier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
