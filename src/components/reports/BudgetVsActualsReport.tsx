import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockBudgetVsActuals, BudgetVsActualRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Category', accessor: 'category' },
  { header: 'Budget', accessor: 'budgetAmount' }, { header: 'Actual', accessor: 'actualAmount' },
  { header: 'Variance', accessor: 'variance' }, { header: 'Variance %', accessor: 'variancePercent' },
];

const locations = [...new Set(mockBudgetVsActuals.map(r => r.locationName))];

const tableColumns: DataTableColumn<BudgetVsActualRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'category', header: 'Category', accessor: (r) => r.category, sortValue: (r) => r.category },
  { key: 'budgetAmount', header: 'Budget', accessor: (r) => `$${r.budgetAmount.toLocaleString()}`, sortValue: (r) => r.budgetAmount, align: 'right' },
  { key: 'actualAmount', header: 'Actual', accessor: (r) => `$${r.actualAmount.toLocaleString()}`, sortValue: (r) => r.actualAmount, align: 'right' },
  { key: 'variance', header: 'Variance', align: 'right', sortValue: (r) => r.variance,
    accessor: (r) => <span className={cn('font-medium', r.variance > 0 ? 'text-emerald-600' : 'text-destructive')}>{r.variance > 0 ? '+' : ''}${r.variance.toLocaleString()}</span> },
  { key: 'variancePercent', header: 'Var %', align: 'right', sortValue: (r) => r.variancePercent,
    accessor: (r) => <Badge variant={r.variancePercent >= 0 ? 'default' : 'destructive'} className="text-xs">{r.variancePercent > 0 ? '+' : ''}{r.variancePercent}%</Badge> },
];

export function BudgetVsActualsReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockBudgetVsActuals.filter(r => {
    const matchesSearch = !search || r.locationName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalBudget = filtered.reduce((s, r) => s + r.budgetAmount, 0);
  const totalActual = filtered.reduce((s, r) => s + r.actualAmount, 0);

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc.split(' ')[0], budget: items.reduce((s, r) => s + r.budgetAmount, 0), actual: items.reduce((s, r) => s + r.actualAmount, 0) };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Location Budget vs Actuals" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalBudget / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Total Budget</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalActual / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Total Actual</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className={cn('text-2xl font-bold tracking-tight', totalActual <= totalBudget ? 'text-emerald-600' : 'text-destructive')}>
            {totalActual <= totalBudget ? '+' : '-'}${Math.abs(totalBudget - totalActual).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Overall Variance</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Budget vs Actual by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name="Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.category}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
