import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockDemandVsActuals } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';


const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Area', accessor: 'area' },
  { header: 'Forecast Children', accessor: 'forecastedChildren' },
  { header: 'Actual Children', accessor: 'actualChildren' },
  { header: 'Forecast Staff', accessor: 'forecastedStaff' },
  { header: 'Actual Staff', accessor: 'actualStaff' },
  { header: 'Demand Accuracy %', accessor: 'demandAccuracy' },
  { header: 'Staffing Accuracy %', accessor: 'staffingAccuracy' },
];

export function DemandVsActualsDashboard() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const areas = [...new Set(mockDemandVsActuals.map(r => r.area))];

  const baseFiltered = useMemo(() => mockDemandVsActuals.filter(r => {
    const matchesSearch = !search || r.area.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase());
    const matchesArea = areaFilter === 'all' || r.area === areaFilter;
    return matchesSearch && matchesArea;
  }), [search, areaFilter]);

  const { drill, drilled: filtered, applyDrill, clearDrill, animKey } = useDrillFilter(
    baseFiltered,
    (item: any, d: DrillFilter) => {
      if (d.type === 'location' && 'location' in item) return item.location === d.value;
      if (d.type === 'department' && 'department' in item) return item.department === d.value;
      if (d.type === 'category' && 'category' in item) return item.category === d.value;
      if (d.type === 'status' && 'status' in item) return item.status === d.value;
      if (d.type === 'type' && 'type' in item) return item.type === d.value;
      if (d.type === 'severity' && 'gapSeverity' in item) return item.gapSeverity === d.value;
      if (d.type === 'staffName' && 'staffName' in item) return item.staffName === d.value;
      if (d.type === 'agencyName' && 'agencyName' in item) return item.agencyName === d.value;
      if (d.type === 'adjustmentType' && 'adjustmentType' in item) return item.adjustmentType === d.value;
      if (d.type === 'areaName' && 'areaName' in item) return item.areaName === d.value;
      if (d.type === 'sourceLocation' && 'sourceLocation' in item) return item.sourceLocation === d.value;
      return String((item as any)[d.type]) === d.value;
    }
  );


  const avgDemandAccuracy = Math.round(filtered.reduce((s, r) => s + r.demandAccuracy, 0) / (filtered.length || 1));
  const avgStaffAccuracy = Math.round(filtered.reduce((s, r) => s + r.staffingAccuracy, 0) / (filtered.length || 1));
  const totalOverstaffed = filtered.filter(r => r.actualStaff > r.forecastedStaff).length;
  const totalUnderstaffed = filtered.filter(r => r.actualStaff < r.forecastedStaff).length;

  // Trend by day
  const trendData = useMemo(() => {
    const byDate: Record<string, { date: string; demandAcc: number; staffAcc: number; count: number }> = {};
    filtered.forEach(r => {
      const key = r.date;
      if (!byDate[key]) byDate[key] = { date: format(parseISO(r.date), 'EEE'), demandAcc: 0, staffAcc: 0, count: 0 };
      byDate[key].demandAcc += r.demandAccuracy;
      byDate[key].staffAcc += r.staffingAccuracy;
      byDate[key].count++;
    });
    return Object.values(byDate).map(d => ({
      date: d.date,
      demand: Math.round(d.demandAcc / d.count),
      staffing: Math.round(d.staffAcc / d.count),
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Demand vs Actuals Dashboard" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search area..." exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange}>
        <select className="h-9 px-3 text-sm border rounded-md bg-background" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
          <option value="all">All Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </ReportFilterBar>

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Target className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{avgDemandAccuracy}%</p><p className="text-xs text-muted-foreground">Demand Accuracy</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><Target className="h-5 w-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold tracking-tight">{avgStaffAccuracy}%</p><p className="text-xs text-muted-foreground">Staffing Accuracy</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold tracking-tight text-emerald-600">{totalOverstaffed}</p><p className="text-xs text-muted-foreground">Overstaffed Slots</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold tracking-tight text-destructive">{totalUnderstaffed}</p><p className="text-xs text-muted-foreground">Understaffed Slots</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Accuracy Trend by Day</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <AnimatedChartWrapper animKey={animKey}><ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="demand" name="Demand Accuracy %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="staffing" name="Staffing Accuracy %" stroke="hsl(var(--status-approved))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer></AnimatedChartWrapper>
          </div>
        </CardContent>
      </Card>

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
                    <TableCell className={cn('text-sm text-right', r.actualStaff < r.forecastedStaff && 'text-destructive font-medium')}>{r.actualStaff}</TableCell>
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
