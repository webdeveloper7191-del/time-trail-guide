import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockDemandVsActuals } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

export function DemandVsActualsDashboard() {
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const filtered = useMemo(() => 
    areaFilter === 'all' ? mockDemandVsActuals : mockDemandVsActuals.filter(r => r.area === areaFilter),
    [areaFilter]
  );

  const avgDemandAccuracy = Math.round(filtered.reduce((s, r) => s + r.demandAccuracy, 0) / filtered.length);
  const avgStaffAccuracy = Math.round(filtered.reduce((s, r) => s + r.staffingAccuracy, 0) / filtered.length);
  const totalOverstaffed = filtered.filter(r => r.actualStaff > r.forecastedStaff).length;
  const totalUnderstaffed = filtered.filter(r => r.actualStaff < r.forecastedStaff).length;

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="Nursery">Nursery</SelectItem>
            <SelectItem value="Toddler">Toddler</SelectItem>
            <SelectItem value="Preschool">Preschool</SelectItem>
            <SelectItem value="Kindy">Kindy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Target className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{avgDemandAccuracy}%</p><p className="text-xs text-muted-foreground">Demand Accuracy</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Target className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{avgStaffAccuracy}%</p><p className="text-xs text-muted-foreground">Staffing Accuracy</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold tracking-tight text-emerald-600">{totalOverstaffed}</p><p className="text-xs text-muted-foreground">Overstaffed Slots</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold tracking-tight text-destructive">{totalUnderstaffed}</p><p className="text-xs text-muted-foreground">Understaffed Slots</p></div></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Demand vs Actual Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Area</TableHead>
                <TableHead className="text-xs text-right">Forecast Children</TableHead>
                <TableHead className="text-xs text-right">Actual Children</TableHead>
                <TableHead className="text-xs text-right">Variance</TableHead>
                <TableHead className="text-xs text-right">Forecast Staff</TableHead>
                <TableHead className="text-xs text-right">Actual Staff</TableHead>
                <TableHead className="text-xs text-right">Demand Acc.</TableHead>
                <TableHead className="text-xs text-right">Staff Acc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => {
                const childVariance = r.actualChildren - r.forecastedChildren;
                const staffVariance = r.actualStaff - r.forecastedStaff;
                return (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{format(parseISO(r.date), 'EEE dd MMM')}</TableCell>
                    <TableCell className="text-sm">{r.area}</TableCell>
                    <TableCell className="text-sm text-right">{r.forecastedChildren}</TableCell>
                    <TableCell className="text-sm text-right">{r.actualChildren}</TableCell>
                    <TableCell className={cn('text-sm text-right font-medium', childVariance > 0 ? 'text-amber-600' : childVariance < 0 ? 'text-emerald-600' : 'text-muted-foreground')}>
                      {childVariance > 0 ? '+' : ''}{childVariance}
                    </TableCell>
                    <TableCell className="text-sm text-right">{r.forecastedStaff}</TableCell>
                    <TableCell className={cn('text-sm text-right', staffVariance < 0 && 'text-destructive font-medium')}>{r.actualStaff}</TableCell>
                    <TableCell className={cn('text-sm text-right', r.demandAccuracy < 80 ? 'text-destructive' : 'text-foreground')}>{r.demandAccuracy}%</TableCell>
                    <TableCell className={cn('text-sm text-right', r.staffingAccuracy < 80 ? 'text-destructive' : 'text-foreground')}>{r.staffingAccuracy}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
