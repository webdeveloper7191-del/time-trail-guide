import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOvertimeFatigue } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

const riskColors: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function OvertimeFatigueReport() {
  const criticalCount = mockOvertimeFatigue.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">High/Critical Risk Staff</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{criticalCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Overtime Hours</p><p className="text-3xl font-bold tracking-tight mt-1">{mockOvertimeFatigue.reduce((s, r) => s + r.overtimeHours, 0)}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Fatigue Score</p><p className="text-3xl font-bold tracking-tight mt-1">{Math.round(mockOvertimeFatigue.reduce((s, r) => s + r.fatigueScore, 0) / mockOvertimeFatigue.length)}</p></CardContent></Card>
      </div>
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
              {mockOvertimeFatigue.sort((a, b) => b.fatigueScore - a.fatigueScore).map((r) => (
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
