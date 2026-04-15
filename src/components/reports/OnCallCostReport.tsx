import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockOnCallCosts, OnCallCostRecord } from '@/data/mockPayrollReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'type' }, { header: 'Standby Hrs', accessor: 'standbyHours' },
  { header: 'Standby Cost', accessor: 'standbyCost' }, { header: 'Activated Hrs', accessor: 'activatedHours' },
  { header: 'Total Cost', accessor: 'totalCost' },
];

const locations = [...new Set(mockOnCallCosts.map(r => r.location))];

const tableColumns: DataTableColumn<OnCallCostRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'type', header: 'Type', sortValue: (r) => r.type,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.type.replace(/_/g, ' ')}</Badge> },
  { key: 'standbyHours', header: 'Standby Hrs', accessor: (r) => `${r.standbyHours}h`, sortValue: (r) => r.standbyHours, align: 'right' },
  { key: 'standbyCost', header: 'Standby $', accessor: (r) => `$${r.standbyCost.toLocaleString()}`, sortValue: (r) => r.standbyCost, align: 'right' },
  { key: 'activatedHours', header: 'Active Hrs', accessor: (r) => r.activatedHours > 0 ? `${r.activatedHours}h` : '—', sortValue: (r) => r.activatedHours, align: 'right' },
  { key: 'activatedCost', header: 'Active $', accessor: (r) => r.activatedCost > 0 ? `$${r.activatedCost.toLocaleString()}` : '—', sortValue: (r) => r.activatedCost, align: 'right' },
  { key: 'totalCost', header: 'Total', accessor: (r) => <span className="font-semibold">${r.totalCost.toLocaleString()}</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'date', header: 'Date', accessor: (r) => r.date, sortValue: (r) => r.date },
];

export function OnCallCostReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockOnCallCosts.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalStandby = filtered.reduce((s, r) => s + r.standbyCost, 0);
  const totalActivated = filtered.reduce((s, r) => s + r.activatedCost, 0);

  const byType = ['on_call', 'callback', 'recall'].map(t => ({
    name: t.replace(/_/g, ' '),
    standby: filtered.filter(r => r.type === t).reduce((s, r) => s + r.standbyCost, 0),
    activated: filtered.filter(r => r.type === t).reduce((s, r) => s + r.activatedCost, 0),
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="On-Call & Callback Cost Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${totalStandby.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Standby Cost</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${totalActivated.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Activated Cost</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalStandby + totalActivated).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Combined Total</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Type</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="standby" name="Standby" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="activated" name="Activated" fill="#F59E0B" radius={[4, 4, 0, 0]} />
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
