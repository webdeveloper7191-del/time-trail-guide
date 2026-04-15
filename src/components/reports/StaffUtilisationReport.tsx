import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockStaffUtilisation } from '@/data/mockReportData';
import { cn } from '@/lib/utils';

export function StaffUtilisationReport() {
  const avgUtilisation = Math.round(mockStaffUtilisation.reduce((s, r) => s + r.utilisationPercent, 0) / mockStaffUtilisation.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Average Utilisation</p><p className="text-3xl font-bold tracking-tight mt-1">{avgUtilisation}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Scheduled</p><p className="text-3xl font-bold tracking-tight mt-1">{mockStaffUtilisation.reduce((s, r) => s + r.scheduledHours, 0)}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Overtime</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{mockStaffUtilisation.reduce((s, r) => s + r.overtimeHours, 0)}h</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Staff Utilisation Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs text-right">Scheduled</TableHead>
                <TableHead className="text-xs text-right">Capacity</TableHead>
                <TableHead className="text-xs w-[140px]">Utilisation</TableHead>
                <TableHead className="text-xs text-right">Overtime</TableHead>
                <TableHead className="text-xs text-right">Leave</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaffUtilisation.map((r) => (
                <TableRow key={r.staffId}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.scheduledHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.capacityHours}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.utilisationPercent} className="h-2 flex-1" />
                      <span className={cn('text-xs font-medium w-8 text-right', r.utilisationPercent >= 95 ? 'text-destructive' : r.utilisationPercent >= 80 ? 'text-foreground' : 'text-muted-foreground')}>{r.utilisationPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                  <TableCell className="text-sm text-right">{r.leaveHours > 0 ? `${r.leaveHours}h` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
