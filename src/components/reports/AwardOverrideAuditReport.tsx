import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockAwardOverrides, AwardOverrideRecord } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Award', accessor: 'awardName' }, { header: 'Classification', accessor: 'classification' },
  { header: 'Original Rate', accessor: 'originalRate' }, { header: 'Override Rate', accessor: 'overrideRate' },
  { header: 'Approved By', accessor: 'approvedBy' }, { header: 'Reason', accessor: 'reason' },
];

const locations = [...new Set(mockAwardOverrides.map(r => r.location))];

const tableColumns: DataTableColumn<AwardOverrideRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'location', header: 'Location', accessor: (r) => r.location, sortValue: (r) => r.location },
  { key: 'awardName', header: 'Award', accessor: (r) => <span className="text-xs">{r.awardName}</span>, sortValue: (r) => r.awardName },
  { key: 'classification', header: 'Class.', accessor: (r) => <Badge variant="outline" className="text-xs">{r.classification}</Badge>, sortValue: (r) => r.classification },
  { key: 'originalRate', header: 'Original', accessor: (r) => `$${r.originalRate.toFixed(2)}/hr`, sortValue: (r) => r.originalRate, align: 'right' },
  { key: 'overrideRate', header: 'Override', sortValue: (r) => r.overrideRate, align: 'right',
    accessor: (r) => <span className={cn('font-semibold', r.overrideRate > r.originalRate ? 'text-emerald-600' : 'text-destructive')}>${r.overrideRate.toFixed(2)}/hr</span> },
  { key: 'overrideType', header: 'Type', sortValue: (r) => r.overrideType,
    accessor: (r) => <Badge variant={r.overrideType === 'increase' ? 'default' : r.overrideType === 'decrease' ? 'destructive' : 'secondary'} className="text-xs">{r.overrideType}</Badge> },
  { key: 'approvedBy', header: 'Approved By', accessor: (r) => r.approvedBy, sortValue: (r) => r.approvedBy },
  { key: 'approvedDate', header: 'Date', accessor: (r) => r.approvedDate, sortValue: (r) => r.approvedDate },
  { key: 'reason', header: 'Reason', accessor: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>, sortValue: (r) => r.reason },
];

export function AwardOverrideAuditReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAwardOverrides.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.awardName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Award Rate Override Audit" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Active Overrides</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.overrideType === 'increase').length}</p>
          <p className="text-xs text-muted-foreground">Rate Increases</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.expiryDate).length}</p>
          <p className="text-xs text-muted-foreground">With Expiry</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Overrides</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
