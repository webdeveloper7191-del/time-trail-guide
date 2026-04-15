import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAreaCombiningSavings } from '@/data/mockReportData';
import { format, parseISO } from 'date-fns';

export function AreaCombiningSavingsReport() {
  const totalSaved = mockAreaCombiningSavings.reduce((s, r) => s + r.costSaved, 0);
  const totalHours = mockAreaCombiningSavings.reduce((s, r) => s + r.hoursSaved, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Cost Saved</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">${totalSaved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Hours Saved</p><p className="text-3xl font-bold tracking-tight mt-1">{totalHours}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Combining Events</p><p className="text-3xl font-bold tracking-tight mt-1">{mockAreaCombiningSavings.length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Area Combining Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Combined Areas</TableHead>
                <TableHead className="text-xs text-right">Staff Saved</TableHead>
                <TableHead className="text-xs text-right">Hours Saved</TableHead>
                <TableHead className="text-xs text-right">Cost Saved</TableHead>
                <TableHead className="text-xs text-right">Children</TableHead>
                <TableHead className="text-xs text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAreaCombiningSavings.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm font-medium">{r.combinedAreas}</TableCell>
                  <TableCell className="text-sm text-right">{r.staffSaved}</TableCell>
                  <TableCell className="text-sm text-right">{r.hoursSaved}h</TableCell>
                  <TableCell className="text-sm text-right font-medium text-emerald-600">${r.costSaved}</TableCell>
                  <TableCell className="text-sm text-right">{r.childrenAffected}</TableCell>
                  <TableCell className="text-sm text-right">{Math.round(r.durationMinutes / 60)}h {r.durationMinutes % 60}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
