import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockCrossLocationDeployments, CrossLocationDeployment } from '@/data/mockLocationReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Role', accessor: 'role' },
  { header: 'Primary Location', accessor: 'primaryLocation' }, { header: 'Deployed To', accessor: 'deployedLocation' },
  { header: 'Primary Hours', accessor: 'hoursAtPrimary' }, { header: 'Deployed Hours', accessor: 'hoursDeployed' },
  { header: 'Deployments', accessor: 'deploymentCount' }, { header: 'Last Deployed', accessor: 'lastDeployed' },
];

const locations = [...new Set([...mockCrossLocationDeployments.map(r => r.primaryLocation), ...mockCrossLocationDeployments.map(r => r.deployedLocation)])];

const tableColumns: DataTableColumn<CrossLocationDeployment>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'role', header: 'Role', accessor: (r) => <Badge variant="outline" className="text-xs">{r.role}</Badge>, sortValue: (r) => r.role },
  { key: 'primaryLocation', header: 'Primary', accessor: (r) => r.primaryLocation, sortValue: (r) => r.primaryLocation },
  { key: 'deployedLocation', header: 'Deployed To', accessor: (r) => r.deployedLocation, sortValue: (r) => r.deployedLocation },
  { key: 'hoursAtPrimary', header: 'Primary Hrs', accessor: (r) => `${r.hoursAtPrimary}h`, sortValue: (r) => r.hoursAtPrimary, align: 'right' },
  { key: 'hoursDeployed', header: 'Deployed Hrs', accessor: (r) => `${r.hoursDeployed}h`, sortValue: (r) => r.hoursDeployed, align: 'right' },
  { key: 'deploymentCount', header: 'Count', accessor: (r) => r.deploymentCount, sortValue: (r) => r.deploymentCount, align: 'right' },
  { key: 'lastDeployed', header: 'Last Deployed', accessor: (r) => r.lastDeployed, sortValue: (r) => r.lastDeployed },
];

export function CrossLocationDeploymentReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockCrossLocationDeployments.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.primaryLocation === locationFilter || r.deployedLocation === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalDeployedHours = filtered.reduce((s, r) => s + r.hoursDeployed, 0);
  const avgDeployments = Math.round(filtered.reduce((s, r) => s + r.deploymentCount, 0) / (filtered.length || 1) * 10) / 10;

  const chartData = locations.slice(0, 5).map(loc => ({
    name: loc.split(' ')[0],
    sentOut: filtered.filter(r => r.primaryLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0),
    received: filtered.filter(r => r.deployedLocation === loc).reduce((s, r) => s + r.hoursDeployed, 0),
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Cross-Location Staff Deployment" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Staff Deployed</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{totalDeployedHours}h</p>
          <p className="text-xs text-muted-foreground">Total Deployed Hours</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{avgDeployments}</p>
          <p className="text-xs text-muted-foreground">Avg Deployments / Staff</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Hours Sent vs Received by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sentOut" name="Sent Out" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" name="Received" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Deployments</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.staffId} /></CardContent>
      </Card>
    </div>
  );
}
