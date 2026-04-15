import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockPayRunRecords, PayRunRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Role', accessor: 'role' }, { header: 'Contract', accessor: 'contractType' },
  { header: 'Regular Hrs', accessor: 'regularHours' }, { header: 'OT Hrs', accessor: 'overtimeHours' },
  { header: 'Base Pay', accessor: 'basePay' }, { header: 'Total Gross', accessor: 'totalGross' },
];

const locations = [...new Set(mockPayRunRecords.map(r => r.location))];

const tableColumns: DataTableColumn<PayRunRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'role', header: 'Role', accessor: (r) => r.role, sortValue: (r) => r.role },
  { key: 'contractType', header: 'Contract', sortValue: (r) => r.contractType,
    accessor: (r) => <Badge variant="outline" className="text-xs">{r.contractType.replace('_', ' ')}</Badge> },
  { key: 'regularHours', header: 'Reg Hrs', accessor: (r) => `${r.regularHours}h`, sortValue: (r) => r.regularHours, align: 'right' },
  { key: 'overtimeHours', header: 'OT Hrs', sortValue: (r) => r.overtimeHours, align: 'right',
    accessor: (r) => r.overtimeHours > 0 ? <span className="text-destructive font-medium">{r.overtimeHours}h</span> : '—' },
  { key: 'basePay', header: 'Base Pay', accessor: (r) => `$${r.basePay.toLocaleString()}`, sortValue: (r) => r.basePay, align: 'right' },
  { key: 'overtimePay', header: 'OT Pay', accessor: (r) => r.overtimePay > 0 ? `$${r.overtimePay.toLocaleString()}` : '—', sortValue: (r) => r.overtimePay, align: 'right' },
  { key: 'allowances', header: 'Allow.', accessor: (r) => r.allowances > 0 ? `$${r.allowances}` : '—', sortValue: (r) => r.allowances, align: 'right' },
  { key: 'superannuation', header: 'Super', accessor: (r) => `$${r.superannuation.toLocaleString()}`, sortValue: (r) => r.superannuation, align: 'right' },
  { key: 'totalGross', header: 'Total Gross', accessor: (r) => <span className="font-semibold">${r.totalGross.toLocaleString()}</span>, sortValue: (r) => r.totalGross, align: 'right' },
];

export function PayRunSummaryReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockPayRunRecords.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalGross = filtered.reduce((s, r) => s + r.totalGross, 0);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Pay Run Summary Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${(totalGross / 1000).toFixed(1)}k</p>
          <p className="text-xs text-muted-foreground">Total Gross</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Staff Paid</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">${Math.round(totalGross / (filtered.length || 1)).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Avg Gross / Staff</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pay Run Detail — {filtered[0]?.payPeriod}</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
