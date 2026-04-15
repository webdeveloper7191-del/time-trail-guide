import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockComplianceViolations, ComplianceViolationRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Type', accessor: 'violationType' }, { header: 'Severity', accessor: 'severity' },
  { header: 'Date', accessor: 'date' }, { header: 'Status', accessor: 'status' },
];

const locations = [...new Set(mockComplianceViolations.map(r => r.locationName))];
const SEVERITY_COLORS = { critical: 'hsl(var(--destructive))', warning: '#F59E0B', info: 'hsl(var(--primary))' };

const tableColumns: DataTableColumn<ComplianceViolationRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'violationType', header: 'Type', accessor: (r) => r.violationType, sortValue: (r) => r.violationType },
  { key: 'severity', header: 'Severity', sortValue: (r) => r.severity,
    accessor: (r) => <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{r.severity}</Badge> },
  { key: 'date', header: 'Date', accessor: (r) => r.date, sortValue: (r) => r.date },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'resolved' ? 'default' : r.status === 'acknowledged' ? 'secondary' : 'destructive'} className="text-xs">{r.status}</Badge> },
];

export function ComplianceViolationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockComplianceViolations.filter(r => {
    const matchesSearch = !search || r.violationType.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const bySeverity = ['critical', 'warning', 'info'].map(s => ({ name: s, value: filtered.filter(r => r.severity === s).length }));
  const byLocation = locations.map(loc => ({ name: loc.split(' ')[0], violations: filtered.filter(r => r.locationName === loc).length }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Compliance Violation Summary" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search violations..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-destructive">{filtered.filter(r => r.status === 'open').length}</p>
          <p className="text-xs text-muted-foreground">Open Violations</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.filter(r => r.severity === 'critical').length}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-emerald-600">{filtered.filter(r => r.status === 'resolved').length}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bySeverity} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {bySeverity.map((entry) => <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="violations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Violations</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.id} /></CardContent>
      </Card>
    </div>
  );
}
