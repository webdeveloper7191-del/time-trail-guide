import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockAgencyUsage, AgencyUsageRecord } from '@/data/mockReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Agency', accessor: 'agencyName' }, { header: 'Shifts', accessor: 'shiftsProvided' },
  { header: 'Hours', accessor: 'totalHours' }, { header: 'Total Cost', accessor: (r: any) => `$${r.totalCost}` },
  { header: 'Avg Rate', accessor: (r: any) => `$${r.avgHourlyRate}/h` }, { header: 'Fill Rate %', accessor: 'fillRate' },
  { header: 'Response Time (h)', accessor: 'avgResponseTimeHours' }, { header: 'Quality Score', accessor: 'qualityScore' },
  { header: 'Cancellation %', accessor: 'cancellationRate' },
];

const tableColumns: DataTableColumn<AgencyUsageRecord>[] = [
  { key: 'agencyName', header: 'Agency', accessor: (r) => <span className="font-medium">{r.agencyName}</span>, sortValue: (r) => r.agencyName },
  { key: 'shiftsProvided', header: 'Shifts', accessor: (r) => r.shiftsProvided, sortValue: (r) => r.shiftsProvided, align: 'right' },
  { key: 'totalHours', header: 'Hours', accessor: (r) => `${r.totalHours}h`, sortValue: (r) => r.totalHours, align: 'right' },
  { key: 'totalCost', header: 'Total Cost', accessor: (r) => <span className="font-medium">${r.totalCost.toLocaleString()}</span>, sortValue: (r) => r.totalCost, align: 'right' },
  { key: 'avgHourlyRate', header: 'Avg Rate', accessor: (r) => `$${r.avgHourlyRate}/h`, sortValue: (r) => r.avgHourlyRate, align: 'right' },
  { key: 'fillRate', header: 'Fill Rate', className: 'w-[120px]', sortValue: (r) => r.fillRate,
    accessor: (r) => <div className="flex items-center gap-2"><Progress value={r.fillRate} className="h-2 flex-1" /><span className="text-xs w-8 text-right">{r.fillRate}%</span></div> },
  { key: 'avgResponseTimeHours', header: 'Response', accessor: (r) => `${r.avgResponseTimeHours}h`, sortValue: (r) => r.avgResponseTimeHours, align: 'right' },
  { key: 'qualityScore', header: 'Quality', className: 'w-[120px]', sortValue: (r) => r.qualityScore,
    accessor: (r) => <div className="flex items-center gap-2"><Progress value={r.qualityScore} className="h-2 flex-1" /><span className="text-xs w-8 text-right">{r.qualityScore}</span></div> },
  { key: 'cancellationRate', header: 'Cancel %', align: 'right', sortValue: (r) => r.cancellationRate,
    accessor: (r) => <span className={cn(r.cancellationRate > 5 && 'text-destructive font-medium')}>{r.cancellationRate}%</span> },
];

export function AgencyUsageReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const filtered = mockAgencyUsage.filter(r => !search || r.agencyName.toLowerCase().includes(search.toLowerCase()));
  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0);
  const chartData = filtered.map(r => ({ name: r.agencyName, cost: r.totalCost, shifts: r.shiftsProvided, quality: r.qualityScore }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Agency Usage & Cost Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search agency..." exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Agency Spend</p><p className="text-3xl font-bold tracking-tight mt-1">${totalCost.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Shifts Filled</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.reduce((s, r) => s + r.shiftsProvided, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Hourly Rate</p><p className="text-3xl font-bold tracking-tight mt-1">${Math.round(filtered.reduce((s, r) => s + r.avgHourlyRate, 0) / (filtered.length || 1))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Cost & Shifts by Agency</CardTitle></CardHeader>
        <CardContent><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cost" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="shifts" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="cost" dataKey="cost" name="Cost ($)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="shifts" dataKey="shifts" name="Shifts" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer></div></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Agency Performance Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable columns={tableColumns} data={filtered} rowKey={(r) => r.agencyName} />
        </CardContent>
      </Card>
    </div>
  );
}
