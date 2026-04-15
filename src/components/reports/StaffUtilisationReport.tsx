import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockStaffUtilisation, StaffUtilisationRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Role', accessor: 'role' },
  { header: 'Location', accessor: 'location' }, { header: 'Scheduled Hours', accessor: 'scheduledHours' },
  { header: 'Capacity Hours', accessor: 'capacityHours' }, { header: 'Utilisation %', accessor: 'utilisationPercent' },
  { header: 'Overtime Hours', accessor: 'overtimeHours' }, { header: 'Leave Hours', accessor: 'leaveHours' },
];

const locations = [...new Set(mockStaffUtilisation.map(r => r.location))];

const tableColumns: DataTableColumn<StaffUtilisationRecord>[] = [
  { key: 'staffName', header: 'Staff', accessor: (r) => <span className="font-medium">{r.staffName}</span>, sortValue: (r) => r.staffName },
  { key: 'role', header: 'Role', accessor: (r) => <span className="text-muted-foreground">{r.role}</span>, sortValue: (r) => r.role },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'scheduledHours', header: 'Scheduled', accessor: (r) => `${r.scheduledHours}h`, sortValue: (r) => r.scheduledHours, align: 'right' },
  { key: 'capacityHours', header: 'Capacity', accessor: (r) => `${r.capacityHours}h`, sortValue: (r) => r.capacityHours, align: 'right' },
  { key: 'utilisationPercent', header: 'Utilisation', className: 'w-[140px]', sortValue: (r) => r.utilisationPercent,
    accessor: (r) => (
      <div className="flex items-center gap-2">
        <Progress value={r.utilisationPercent} className="h-2 flex-1" />
        <span className={cn('text-xs font-medium w-8 text-right', r.utilisationPercent >= 95 ? 'text-destructive' : r.utilisationPercent >= 80 ? 'text-foreground' : 'text-muted-foreground')}>{r.utilisationPercent}%</span>
      </div>
    ),
  },
  { key: 'overtimeHours', header: 'Overtime', align: 'right', sortValue: (r) => r.overtimeHours,
    accessor: (r) => r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—' },
  { key: 'leaveHours', header: 'Leave', align: 'right', sortValue: (r) => r.leaveHours,
    accessor: (r) => r.leaveHours > 0 ? `${r.leaveHours}h` : '—' },
];

export function StaffUtilisationReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockStaffUtilisation.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const avgUtilisation = Math.round(filtered.reduce((s, r) => s + r.utilisationPercent, 0) / (filtered.length || 1));
  const chartData = filtered.map(r => ({ name: r.staffName.split(' ')[0], utilisation: r.utilisationPercent, overtime: r.overtimeHours }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Utilisation Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Average Utilisation</p><p className="text-3xl font-bold tracking-tight mt-1">{avgUtilisation}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Scheduled</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.reduce((s, r) => s + r.scheduledHours, 0)}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Overtime</p><p className="text-3xl font-bold tracking-tight mt-1 text-destructive">{filtered.reduce((s, r) => s + r.overtimeHours, 0)}h</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Utilisation Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 110]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="utilisation" name="Utilisation %" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.utilisation >= 95 ? 'hsl(var(--destructive))' : entry.utilisation >= 80 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Staff Utilisation Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.staffId} />
        </CardContent>
      </Card>
    </div>
  );
}
