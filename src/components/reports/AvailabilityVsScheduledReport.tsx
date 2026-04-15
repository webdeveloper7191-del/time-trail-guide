import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { mockAvailabilityVsScheduled } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

export function AvailabilityVsScheduledReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => {
    return mockAvailabilityVsScheduled.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const locations = [...new Set(mockAvailabilityVsScheduled.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Staff', accessor: 'staffName' },
    { header: 'Location', accessor: 'location' },
    { header: 'Available Hours', accessor: 'availableHours' },
    { header: 'Scheduled Hours', accessor: 'scheduledHours' },
    { header: 'Utilisation %', accessor: 'utilisationPct' },
    { header: 'Unscheduled', accessor: 'unscheduledHours' },
    { header: 'Overtime', accessor: 'overtimeHours' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Availability vs Scheduled" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Available vs Scheduled Hours</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="staffName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="availableHours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Available" />
              <Bar dataKey="scheduledHours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Scheduled" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs text-right">Available</TableHead>
              <TableHead className="text-xs text-right">Scheduled</TableHead>
              <TableHead className="text-xs">Utilisation</TableHead>
              <TableHead className="text-xs text-right">Unscheduled</TableHead>
              <TableHead className="text-xs text-right">Overtime</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell className="text-sm text-right">{r.availableHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.scheduledHours}h</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={Math.min(r.utilisationPct, 100)} className="h-2 w-16" /><span className="text-xs">{r.utilisationPct}%</span></div></TableCell>
                  <TableCell className="text-sm text-right">{r.unscheduledHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-[10px]">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
