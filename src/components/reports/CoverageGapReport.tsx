import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCoverageGaps } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const severityColors: Record<string, string> = {
  minor: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

export function CoverageGapReport() {
  const criticalGaps = mockCoverageGaps.filter(r => r.gapSeverity === 'critical').length;
  const totalGap = mockCoverageGaps.reduce((s, r) => s + r.gap, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Coverage Gaps</p><p className="text-3xl font-bold tracking-tight mt-1">{totalGap}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical Gaps</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{criticalGaps}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Affected Time Slots</p><p className="text-3xl font-bold tracking-tight mt-1">{mockCoverageGaps.filter(r => r.gap > 0).length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Coverage Gap Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Area</TableHead>
                <TableHead className="text-xs">Time Slot</TableHead>
                <TableHead className="text-xs text-right">Required</TableHead>
                <TableHead className="text-xs text-right">Scheduled</TableHead>
                <TableHead className="text-xs text-right">Gap</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCoverageGaps.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.area}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.timeSlot}</TableCell>
                  <TableCell className="text-sm text-right">{r.requiredStaff}</TableCell>
                  <TableCell className="text-sm text-right">{r.scheduledStaff}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.gap > 0 && 'text-destructive')}>{r.gap > 0 ? `-${r.gap}` : '✓'}</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', severityColors[r.gapSeverity])}>{r.gapSeverity}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.reason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
