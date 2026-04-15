import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockFairness } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function FairnessReport() {
  const avgScore = Math.round(mockFairness.reduce((s, r) => s + r.fairnessScore, 0) / mockFairness.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Fairness Score</p><p className="text-3xl font-bold tracking-tight mt-1">{avgScore}/100</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Below Threshold (&lt;70)</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{mockFairness.filter(r => r.fairnessScore < 70).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Weekend Shifts</p><p className="text-3xl font-bold tracking-tight mt-1">{(mockFairness.reduce((s, r) => s + r.weekendShifts, 0) / mockFairness.length).toFixed(1)}</p></CardContent></Card>
      </div>
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
              {mockFairness.sort((a, b) => a.fairnessScore - b.fairnessScore).map((r) => (
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
