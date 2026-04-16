import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { DateRange } from 'react-day-picker';
import { mockHeadcountData, mockTurnoverData } from '@/data/mockWorkforceReportData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { Users, TrendingDown, UserPlus, Clock } from 'lucide-react';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { useDrillFilter } from './useDrillFilter';
import { AnimatedChartWrapper } from './AnimatedChartWrapper';
import { filterByDateRange } from '@/lib/reportDateFilter';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function WorkforceOverviewDashboard() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const baseFiltered = useMemo(() => {
    return filterByDateRange(mockHeadcountData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.department.toLowerCase().includes(search.toLowerCase()) && !r.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), dateRange);
  }, [search, location]);

  const { drill, drilled: filtered, applyDrill, clearDrill, animKey } = useDrillFilter(
    baseFiltered,
    (item: any, d: DrillFilter) => {
      if (d.type === 'department') return item.department === d.value;
      if (d.type === 'contractType') {
        if (d.value === 'Full Time') return item.fullTime > 0;
        if (d.value === 'Part Time') return item.partTime > 0;
        if (d.value === 'Casual') return item.casual > 0;
        if (d.value === 'Contractor') return item.contractor > 0;
      }
      return String(item[d.type]) === d.value;
    }
  );

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => ({
      headcount: acc.headcount + r.totalHeadcount,
      fte: acc.fte + r.fte,
      newHires: acc.newHires + r.newHires,
      terminations: acc.terminations + r.terminations,
    }), { headcount: 0, fte: 0, newHires: 0, terminations: 0 });
  }, [filtered]);

  const contractPie = useMemo(() => {
    const sums = filtered.reduce((a, r) => ({ ft: a.ft + r.fullTime, pt: a.pt + r.partTime, cas: a.cas + r.casual, con: a.con + r.contractor }), { ft: 0, pt: 0, cas: 0, con: 0 });
    return [
      { name: 'Full Time', value: sums.ft },
      { name: 'Part Time', value: sums.pt },
      { name: 'Casual', value: sums.cas },
      { name: 'Contractor', value: sums.con },
    ];
  }, [filtered]);

  const exportColumns: ExportColumn[] = [
    { header: 'Department', accessor: 'department' },
    { header: 'Location', accessor: 'location' },
    { header: 'Headcount', accessor: 'totalHeadcount' },
    { header: 'FTE', accessor: 'fte' },
    { header: 'New Hires', accessor: 'newHires' },
    { header: 'Terminations', accessor: 'terminations' },
    { header: 'Turnover %', accessor: 'turnoverRate' },
  ];

  const locations = [...new Set(mockHeadcountData.map(r => r.location))];

  return (
    <div className="space-y-6">
      <ReportFilterBar
        title="Workforce Overview"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."
        locationFilter={location}
        onLocationChange={setLocation}
        locations={locations}
        exportData={filtered}
        exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange}
      />

      <DrillFilterBadge filter={drill} onClear={clearDrill} />

      <AnimatedChartWrapper animKey={animKey}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/60"><CardContent className="p-4">
            <Users className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold tracking-tight">{totals.headcount}</p>
            <p className="text-xs text-muted-foreground">Total Headcount</p>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-4">
            <Clock className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold tracking-tight">{totals.fte.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Total FTE</p>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-4">
            <UserPlus className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold tracking-tight">{totals.newHires}</p>
            <p className="text-xs text-muted-foreground">New Hires (Period)</p>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-4">
            <TrendingDown className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold tracking-tight">{totals.terminations}</p>
            <p className="text-xs text-muted-foreground">Terminations</p>
          </CardContent></Card>
        </div>
      </AnimatedChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount Trend</CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mockTurnoverData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="headcount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </AnimatedChartWrapper>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Contract Type Breakdown <span className="text-[10px] text-muted-foreground font-normal">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <AnimatedChartWrapper animKey={animKey}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={contractPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" cursor="pointer"
                    onClick={(_, index) => { const d = contractPie[index]; if (d) applyDrill('contractType', d.name, `Contract: ${d.name}`); }}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {contractPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </AnimatedChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount by Department & Location <span className="text-[10px] text-muted-foreground font-normal">(click row to drill)</span></CardTitle></CardHeader>
        <CardContent>
          <AnimatedChartWrapper animKey={animKey}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs text-right">Headcount</TableHead>
                  <TableHead className="text-xs text-right">FTE</TableHead>
                  <TableHead className="text-xs text-right">New Hires</TableHead>
                  <TableHead className="text-xs text-right">Terms</TableHead>
                  <TableHead className="text-xs text-right">Turnover %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => applyDrill('department', r.department)}>
                    <TableCell className="text-sm font-medium">{r.department}</TableCell>
                    <TableCell className="text-sm">{r.location}</TableCell>
                    <TableCell className="text-sm text-right">{r.totalHeadcount}</TableCell>
                    <TableCell className="text-sm text-right">{r.fte}</TableCell>
                    <TableCell className="text-sm text-right">{r.newHires}</TableCell>
                    <TableCell className="text-sm text-right">{r.terminations}</TableCell>
                    <TableCell className="text-sm text-right">
                      <Badge variant={r.turnoverRate > 5 ? 'destructive' : 'secondary'} className="text-[10px]">{r.turnoverRate}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AnimatedChartWrapper>
        </CardContent>
      </Card>
    </div>
  );
}
