import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockStaffingRatios, StaffingRatioRecord } from '@/data/mockLocationReportData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';

const exportColumns: ExportColumn[] = [
  { header: 'Location', accessor: 'locationName' }, { header: 'Area', accessor: 'areaName' },
  { header: 'Required Ratio', accessor: 'requiredRatio' }, { header: 'Actual Ratio', accessor: 'actualRatio' },
  { header: 'Attendance', accessor: 'attendance' }, { header: 'Required Staff', accessor: 'requiredStaff' },
  { header: 'Actual Staff', accessor: 'actualStaff' }, { header: 'Compliant', accessor: 'isCompliant' },
];

const locations = [...new Set(mockStaffingRatios.map(r => r.locationName))];

const tableColumns: DataTableColumn<StaffingRatioRecord>[] = [
  { key: 'locationName', header: 'Location', accessor: (r) => <span className="font-medium">{r.locationName}</span>, sortValue: (r) => r.locationName },
  { key: 'areaName', header: 'Area', accessor: (r) => r.areaName, sortValue: (r) => r.areaName },
  { key: 'timeSlot', header: 'Time', accessor: (r) => r.timeSlot, sortValue: (r) => r.timeSlot },
  { key: 'serviceCategory', header: 'Category', accessor: (r) => <Badge variant="outline" className="text-xs">{r.serviceCategory}</Badge>, sortValue: (r) => r.serviceCategory },
  { key: 'attendance', header: 'Attendance', accessor: (r) => r.attendance, sortValue: (r) => r.attendance, align: 'right' },
  { key: 'requiredRatio', header: 'Req. Ratio', accessor: (r) => r.requiredRatio, sortValue: (r) => r.requiredRatio },
  { key: 'actualRatio', header: 'Act. Ratio', sortValue: (r) => r.actualRatio,
    accessor: (r) => <span className={cn('font-medium', r.isCompliant ? '' : 'text-destructive')}>{r.actualRatio}</span> },
  { key: 'requiredStaff', header: 'Req. Staff', accessor: (r) => r.requiredStaff, sortValue: (r) => r.requiredStaff, align: 'right' },
  { key: 'actualStaff', header: 'Act. Staff', accessor: (r) => r.actualStaff, sortValue: (r) => r.actualStaff, align: 'right' },
  { key: 'isCompliant', header: 'Status', align: 'center', sortValue: (r) => r.isCompliant ? 1 : 0,
    accessor: (r) => r.isCompliant ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" /> },
];

export function StaffingRatioComplianceReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockStaffingRatios.filter(r => {
    const matchesSearch = !search || r.areaName.toLowerCase().includes(search.toLowerCase()) || r.locationName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.locationName === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const complianceRate = Math.round(filtered.filter(r => r.isCompliant).length / (filtered.length || 1) * 100);
  const breachCount = filtered.filter(r => !r.isCompliant).length;

  const byLocation = locations.map(loc => {
    const items = filtered.filter(r => r.locationName === loc);
    return { name: loc.split(' ')[0], compliant: items.filter(r => r.isCompliant).length, nonCompliant: items.filter(r => !r.isCompliant).length };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staffing Ratio Compliance (NQF)" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60"><CardContent className="p-4">
          <p className={cn('text-2xl font-bold tracking-tight', complianceRate >= 95 ? 'text-emerald-600' : 'text-destructive')}>{complianceRate}%</p>
          <p className="text-xs text-muted-foreground">Compliance Rate</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight text-destructive">{breachCount}</p>
          <p className="text-xs text-muted-foreground">Ratio Breaches</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4">
          <p className="text-2xl font-bold tracking-tight">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Checks Performed</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Compliance by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLocation}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="compliant" name="Compliant" stackId="a" fill="hsl(142 76% 36%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="nonCompliant" name="Non-Compliant" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">All Ratio Checks</CardTitle></CardHeader>
        <CardContent><ReportDataTable columns={tableColumns} data={filtered} rowKey={(r, i) => `${r.locationName}-${r.areaName}-${r.timeSlot}-${i}`} /></CardContent>
      </Card>
    </div>
  );
}
