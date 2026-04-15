import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockLabourCosts, LabourCostRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'location' }, { header: 'Department', accessor: 'department' },
  { header: 'Headcount', accessor: 'headcount' }, { header: 'Regular', accessor: 'regularCost' },
  { header: 'Overtime', accessor: 'overtimeCost' }, { header: 'Total', accessor: 'totalCost' },
  { header: 'Budget', accessor: 'budgetAmount' }, { header: 'Variance', accessor: 'variance' },
];

const locations = [...new Set(mockLabourCosts.map(r => r.location))];

const tableColumns: DataTableColumn<LabourCostRecord>[] = [
  { key: 'location', header: 'Location', accessor: (r) => <span className="font-medium">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'department', header: 'Department', accessor: (r) => r.department, sortValue: (r) => r.department },
  { key: 'headcount', header: 'HC', accessor: (r) => r.headcount, sortValue: (r) => r.headcount, align: 'right' },
  { key: 'regularCost', header: 'Regular', accessor: (r) => `$${(r.regularCost / 1000).toFixed(1)}k`, sortValue: (r) => r.regularCost, align: 'right' },
  { key: 'overtimeCost', header: 'OT', accessor: (r) => `$${(r.overtimeCost / 1000).toFixed(1)}k`, sortValue: (r) => r.overtimeCost, align: 'right' },
  { key: 'allowanceCost', header: 'Allowances', accessor: (r) => `$${r.allowanceCost}`, sortValue: (r) => r.allowanceCost, align: 'right' },
  { key: 'penaltyCost', header: 'Penalties', accessor: (r) => `$${r.penaltyCost}`, sortValue: (r) => r.penaltyCost, align: 'right' },
  { key: 'agencyCost', header: 'Agency', sortValue: (r) => r.agencyCost, align: 'right',
    accessor: (r) => r.agencyCost > 0 ? <span className="text-destructive">${(r.agencyCost / 1000).toFixed(1)}k</span> : '—' },
  { key: 'totalCost', header: 'Total', accessor: (r) => <span className="font-semibold">${(r.totalCost / 1000).toFixed(1)}k</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'variance', header: 'Variance', align: 'right', sortValue: (r) => r.variance,
    accessor: (r) => <span className={cn('font-medium', r.variance >= 0 ? 'text-emerald-600' : 'text-destructive')}>{r.variance >= 0 ? '+' : ''}${r.variance}</span> },
];

export function LabourCostReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockLabourCosts.filter(r => {
    const matchesSearch = !search || r.location.toLowerCase().includes(search.toLowerCase()) || r.department.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const chartData = locations.map(loc => {
    const items = filtered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], regular: items.reduce((s, r) => s + r.regularCost, 0), overtime: items.reduce((s, r) => s + r.overtimeCost, 0), agency: items.reduce((s, r) => s + r.agencyCost, 0) };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Labour Cost by Location/Department" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Breakdown by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="regular" name="Regular" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="overtime" name="Overtime" stackId="a" fill="#F59E0B" />
              <Bar dataKey="agency" name="Agency" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Detail</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.location}-${r.department}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
