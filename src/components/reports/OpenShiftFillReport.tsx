import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOpenShiftFill } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export function OpenShiftFillReport() {
  const totalOpen = mockOpenShiftFill.reduce((s, r) => s + r.totalOpenShifts, 0);
  const totalFilled = mockOpenShiftFill.reduce((s, r) => s + r.filledShifts, 0);
  const avgFillRate = Math.round((totalFilled / totalOpen) * 100);
  const avgTimeToFill = Math.round(mockOpenShiftFill.reduce((s, r) => s + r.avgTimeToFillHours, 0) / mockOpenShiftFill.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Open Shifts</p><p className="text-3xl font-bold tracking-tight mt-1">{totalOpen}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Fill Rate</p><p className="text-3xl font-bold tracking-tight mt-1">{avgFillRate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Time to Fill</p><p className="text-3xl font-bold tracking-tight mt-1">{avgTimeToFill}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Still Unfilled</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{totalOpen - totalFilled}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Open Shift Fill Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Area</TableHead>
                <TableHead className="text-xs text-right">Open</TableHead>
                <TableHead className="text-xs text-right">Filled</TableHead>
                <TableHead className="text-xs text-right">Internal</TableHead>
                <TableHead className="text-xs text-right">Agency</TableHead>
                <TableHead className="text-xs text-right">Fill Rate</TableHead>
                <TableHead className="text-xs text-right">Avg Time</TableHead>
                <TableHead className="text-xs">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOpenShiftFill.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.area}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalOpenShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledShifts}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledByInternal}</TableCell>
                  <TableCell className="text-sm text-right">{r.filledByAgency}</TableCell>
                  <TableCell className={cn('text-sm text-right font-medium', r.fillRate >= 80 ? 'text-emerald-600' : r.fillRate >= 50 ? 'text-amber-600' : 'text-destructive')}>{r.fillRate}%</TableCell>
                  <TableCell className="text-sm text-right">{r.avgTimeToFillHours}h</TableCell>
                  <TableCell><Badge variant="outline" className={cn('text-xs capitalize', r.urgency === 'critical' && 'border-destructive text-destructive', r.urgency === 'high' && 'border-orange-500 text-orange-600')}>{r.urgency}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
