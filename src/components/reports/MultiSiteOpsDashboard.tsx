import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockMultiSiteOps, MultiSiteOpsData, locationTrendData } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, MapPin, Users } from 'lucide-react';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Status', accessor: 'status' },
  { header: 'On Duty', accessor: 'onDuty' }, { header: 'Total Staff', accessor: 'totalStaff' },
  { header: 'Occupancy', accessor: 'occupancy' }, { header: 'Capacity', accessor: 'capacity' },
  { header: 'Compliance %', accessor: 'complianceScore' }, { header: 'Budget Used', accessor: 'budgetUsed' },
];

const locations = [...new Set(mockMultiSiteOps.map(r => r.locationName))];

const tableColumns: DataTableColumn<MultiSiteOpsData>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'status', header: 'Status', sortValue: (r) => r.status,
    accessor: (r) => <Badge variant={r.status === 'online' ? 'default' : r.status === 'partial' ? 'secondary' : 'destructive'} className="text-xs">{r.status}</Badge> },
  { key: 'onDuty', header: 'On Duty / Total', accessor: (r) => `${r.onDuty} / ${r.totalStaff}`, sortValue: (r) => r.onDuty, align: 'right' },
  { key: 'occupancy', header: 'Occupancy', accessor: (r) => `${r.occupancy} / ${r.capacity}`, sortValue: (r) => r.occupancy, align: 'right' },
  { key: 'complianceScore', header: 'Compliance', className: 'w-[140px]', sortValue: (r) => r.complianceScore,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.complianceScore} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium', r.complianceScore >= 90 ? 'text-foreground' : 'text-destructive')}>{r.complianceScore}%</span>
      </div>
    ) },
  { key: 'budgetUsed', header: 'Budget Used', align: 'right', sortValue: (r) => r.budgetUsed,
    accessor: (r) => `$${(r.budgetUsed / 1000).toFixed(1)}k / $${(r.budgetTotal / 1000).toFixed(1)}k` },
  { key: 'alerts', header: 'Alerts', align: 'center', sortValue: (r) => r.alerts,
    accessor: (r) => r.alerts > 0 ? <Badge variant="destructive" className="text-xs">{r.alerts}</Badge> : <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> },
];

export function MultiSiteOpsDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockMultiSiteOps.filter(r => {
    const matchesSearch = !search || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalOnDuty = filtered.reduce((s, r) => s + r.onDuty, 0);
  const totalAlerts = filtered.reduce((s, r) => s + r.alerts, 0);
  const avgCompliance = Math.round(filtered.reduce((s, r) => s + r.complianceScore, 0) / (filtered.length || 1));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Multi-Site Operations Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search locations..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Locations Online', value: filtered.filter(r => r.status === 'online').length, icon: MapPin, sub: `of ${filtered.length}` },
          { label: 'Staff On Duty', value: totalOnDuty, icon: Users, sub: 'across all sites' },
          { label: 'Avg Compliance', value: `${avgCompliance}%`, icon: CheckCircle2, sub: 'target 95%' },
          { label: 'Active Alerts', value: totalAlerts, icon: AlertTriangle, sub: totalAlerts > 0 ? 'needs attention' : 'all clear' },
        ].map(c => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><c.icon className="h-4 w-4 text-muted-foreground" /></div>
              <p className="text-2xl font-bold tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label} · {c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance & Utilisation Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={locationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avgCompliance" name="Compliance %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avgUtilisation" name="Utilisation %" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Violations by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="totalViolations" name="Violations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Locations</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.locationId} /></CardContent>
      </Card>
    </div>
  );
}
