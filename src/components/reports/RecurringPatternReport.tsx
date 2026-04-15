import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockRecurringPatterns } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function RecurringPatternReport() {
  const avgAdherence = Math.round(mockRecurringPatterns.reduce((s, r) => s + r.adherencePercent, 0) / mockRecurringPatterns.length);
  const totalDeviations = mockRecurringPatterns.reduce((s, r) => s + r.deviations, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Adherence</p><p className="text-3xl font-bold tracking-tight mt-1">{avgAdherence}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Deviations</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalDeviations}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Patterns</p><p className="text-3xl font-bold tracking-tight mt-1">{mockRecurringPatterns.length}</p></CardContent></Card>
      </div>
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
              {mockRecurringPatterns.map((r, i) => (
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
