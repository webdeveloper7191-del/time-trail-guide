import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockAgencyUsage } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function AgencyUsageReport() {
  const totalCost = mockAgencyUsage.reduce((s, r) => s + r.totalCost, 0);
  const totalShifts = mockAgencyUsage.reduce((s, r) => s + r.shiftsProvided, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Agency Spend</p><p className="text-3xl font-bold tracking-tight mt-1">${totalCost.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Shifts Filled</p><p className="text-3xl font-bold tracking-tight mt-1">{totalShifts}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Hourly Rate</p><p className="text-3xl font-bold tracking-tight mt-1">${Math.round(mockAgencyUsage.reduce((s, r) => s + r.avgHourlyRate, 0) / mockAgencyUsage.length)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Agency Performance Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Agency</TableHead>
                <TableHead className="text-xs text-right">Shifts</TableHead>
                <TableHead className="text-xs text-right">Hours</TableHead>
                <TableHead className="text-xs text-right">Total Cost</TableHead>
                <TableHead className="text-xs text-right">Avg Rate</TableHead>
                <TableHead className="text-xs w-[120px]">Fill Rate</TableHead>
                <TableHead className="text-xs text-right">Response Time</TableHead>
                <TableHead className="text-xs w-[120px]">Quality</TableHead>
                <TableHead className="text-xs text-right">Cancellation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAgencyUsage.map((r) => (
                <TableRow key={r.agencyName}>
                  <TableCell className="text-sm font-medium">{r.agencyName}</TableCell>
                  <TableCell className="text-sm text-right">{r.shiftsProvided}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalHours}h</TableCell>
                  <TableCell className="text-sm text-right font-medium">${r.totalCost.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-right">${r.avgHourlyRate}/h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.fillRate} className="h-2 flex-1" />
                      <span className="text-xs w-8 text-right">{r.fillRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">{r.avgResponseTimeHours}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.qualityScore} className="h-2 flex-1" />
                      <span className="text-xs w-8 text-right">{r.qualityScore}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn('text-sm text-right', r.cancellationRate > 5 && 'text-destructive font-medium')}>{r.cancellationRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
