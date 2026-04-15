import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockTurnoverData } from '@/data/mockWorkforceReportData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { format, parseISO } from 'date-fns';

export function TurnoverRetentionReport() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return mockTurnoverData;
    return mockTurnoverData.filter(r => r.month.includes(search));
  }, [search]);

  const exportColumns: ExportColumn[] = [
    { header: 'Month', accessor: (r) => format(parseISO(r.month + '-01'), 'MMM yyyy') },
    { header: 'Hires', accessor: 'hires' },
    { header: 'Terminations', accessor: 'terminations' },
    { header: 'Headcount', accessor: 'headcount' },
    { header: 'Turnover %', accessor: 'turnoverRate' },
    { header: 'Retention %', accessor: 'retentionRate' },
    { header: 'Avg Tenure (months)', accessor: 'avgTenureMonths' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Turnover & Retention" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search months..." exportData={filtered} exportColumns={exportColumns} exportFileName="turnover-retention" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Hires vs Terminations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hires" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Hires" />
                <Bar dataKey="terminations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Terminations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Retention Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[95, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="retentionRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Retention %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Monthly Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Month</TableHead>
              <TableHead className="text-xs text-right">Hires</TableHead>
              <TableHead className="text-xs text-right">Voluntary</TableHead>
              <TableHead className="text-xs text-right">Involuntary</TableHead>
              <TableHead className="text-xs text-right">Total Terms</TableHead>
              <TableHead className="text-xs text-right">Headcount</TableHead>
              <TableHead className="text-xs text-right">Turnover %</TableHead>
              <TableHead className="text-xs text-right">Retention %</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="text-sm font-medium">{format(parseISO(r.month + '-01'), 'MMM yyyy')}</TableCell>
                  <TableCell className="text-sm text-right">{r.hires}</TableCell>
                  <TableCell className="text-sm text-right">{r.voluntaryExits}</TableCell>
                  <TableCell className="text-sm text-right">{r.involuntaryExits}</TableCell>
                  <TableCell className="text-sm text-right">{r.terminations}</TableCell>
                  <TableCell className="text-sm text-right">{r.headcount}</TableCell>
                  <TableCell className="text-sm text-right"><Badge variant={r.turnoverRate > 2 ? 'destructive' : 'secondary'} className="text-[10px]">{r.turnoverRate}%</Badge></TableCell>
                  <TableCell className="text-sm text-right">{r.retentionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
