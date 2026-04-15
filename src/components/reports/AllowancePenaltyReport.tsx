import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAllowancePenalties, AllowancePenaltyRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'type' }, { header: 'Category', accessor: 'category' },
  { header: 'Hours', accessor: 'hours' }, { header: 'Rate', accessor: 'rate' },
  { header: 'Amount', accessor: 'amount' }, { header: 'Award', accessor: 'awardReference' },
];

const locations = [...new Set(mockAllowancePenalties.map(r => r.location))];

const tableColumns: DataTableColumn<AllowancePenaltyRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'type', header: 'Type', sortValue: (r) => r.type,
    accessor: (r) => <Badge variant={r.type === 'penalty' ? 'destructive' : 'default'} className="text-xs">{r.type}</Badge> },
  { key: 'category', header: 'Category', accessor: (r) => r.category, sortValue: (r) => r.category },
  { key: 'hours', header: 'Hours', accessor: (r) => r.hours > 0 ? `${r.hours}h` : '—', sortValue: (r) => r.hours, align: 'right' },
  { key: 'rate', header: 'Rate', accessor: (r) => `$${r.rate.toFixed(2)}`, sortValue: (r) => r.rate, align: 'right' },
  { key: 'amount', header: 'Amount', accessor: (r) => <span className="font-semibold">${r.amount.toLocaleString()}</span>, sortValue: (r) => r.amount, align: 'right' },
  { key: 'date', header: 'Date', accessor: (r) => r.date, sortValue: (r) => r.date },
  { key: 'awardReference', header: 'Award', accessor: (r) => <span className="text-muted-foreground text-xs">{r.awardReference}</span>, sortValue: (r) => r.awardReference },
];

export function AllowancePenaltyReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAllowancePenalties.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalAllowances = filtered.filter(r => r.type === 'allowance').reduce((s, r) => s + r.amount, 0);
  const totalPenalties = filtered.filter(r => r.type === 'penalty').reduce((s, r) => s + r.amount, 0);

  const categories = [...new Set(filtered.map(r => r.category))];
  const chartData = categories.map(cat => ({
    name: cat,
    allowances: filtered.filter(r => r.category === cat && r.type === 'allowance').reduce((s, r) => s + r.amount, 0),
    penalties: filtered.filter(r => r.category === cat && r.type === 'penalty').reduce((s, r) => s + r.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Allowance & Penalty Breakdown" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${totalAllowances.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Allowances</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-destructive">${totalPenalties.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Penalties</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalAllowances + totalPenalties).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Combined Total</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="allowances" name="Allowances" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="penalties" name="Penalties" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
