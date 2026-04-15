import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockRetrospectivePay, RetrospectivePayRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Type', accessor: 'adjustmentType' }, { header: 'Original', accessor: 'originalAmount' },
  { header: 'Adjusted', accessor: 'adjustedAmount' }, { header: 'Difference', accessor: 'difference' },
  { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockRetrospectivePay.map(r => r.location))];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  processed: 'default', approved: 'secondary', pending: 'secondary', rejected: 'destructive',
};

const tableColumns: DataTableColumn<RetrospectivePayRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'adjustmentType', header: 'Type', sortValue: (r) => r.adjustmentType,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.adjustmentType.replace(/_/g, ' ')}</Badge> },
  { key: 'originalAmount', header: 'Original', accessor: (r) => `$${r.originalAmount.toLocaleString()}`, sortValue: (r) => r.originalAmount, align: 'right' },
  { key: 'adjustedAmount', header: 'Adjusted', accessor: (r) => `$${r.adjustedAmount.toLocaleString()}`, sortValue: (r) => r.adjustedAmount, align: 'right' },
  { key: 'difference', header: 'Difference', align: 'right', sortValue: (r) => r.difference,
    accessor: (r) => <span className="font-semibold text-emerald-600">+${r.difference.toLocaleString()}</span> },
  { key: 'effectiveFrom', header: 'Effective', accessor: (r) => r.effectiveFrom, sortValue: (r) => r.effectiveFrom },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={STATUS_VARIANT[r.status]} className="text-xs">{r.status}</Badge> },
  { key: 'reason', header: 'Reason', accessor: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>, sortValue: (r) => r.reason },
];

export function RetrospectivePayReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockRetrospectivePay.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalAdjustment = filtered.reduce((s, r) => s + r.difference, 0);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Retrospective Pay Adjustment Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Adjustments</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-emerald-600">+${totalAdjustment.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Back-Pay</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Pending Approval</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Adjustments</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
