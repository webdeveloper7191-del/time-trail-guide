import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAreaCombiningSavings, AreaCombiningSavingsRecord } from '@/data/mockReportData';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' }, { header: 'Combined Areas', accessor: 'combinedAreas' },
  { header: 'Staff Saved', accessor: 'staffSaved' }, { header: 'Hours Saved', accessor: 'hoursSaved' },
  { header: 'Cost Saved ($)', accessor: 'costSaved' }, { header: 'Children Affected', accessor: 'childrenAffected' },
  { header: 'Duration (min)', accessor: 'durationMinutes' },
];

const locations = [...new Set(mockAreaCombiningSavings.map(r => r.location))];

const tableColumns: DataTableColumn<AreaCombiningSavingsRecord>[] = [
  { key: 'date', header: 'Date', accessor: (r) => format(parseISO(r.date), 'dd MMM'), sortValue: (r) => r.date },
  { key: 'location', header: 'Location', accessor: (r) => <span className="text-muted-foreground">{r.location}</span>, sortValue: (r) => r.location },
  { key: 'combinedAreas', header: 'Combined Areas', accessor: (r) => <span className="font-medium">{r.combinedAreas}</span>, sortValue: (r) => r.combinedAreas },
  { key: 'staffSaved', header: 'Staff Saved', accessor: (r) => r.staffSaved, sortValue: (r) => r.staffSaved, align: 'right' },
  { key: 'hoursSaved', header: 'Hours Saved', accessor: (r) => `${r.hoursSaved}h`, sortValue: (r) => r.hoursSaved, align: 'right' },
  { key: 'costSaved', header: 'Cost Saved', accessor: (r) => <span className="font-medium text-emerald-600">${r.costSaved}</span>, sortValue: (r) => r.costSaved, align: 'right' },
  { key: 'childrenAffected', header: 'Children', accessor: (r) => r.childrenAffected, sortValue: (r) => r.childrenAffected, align: 'right' },
  { key: 'durationMinutes', header: 'Duration', accessor: (r) => `${Math.round(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m`, sortValue: (r) => r.durationMinutes, align: 'right' },
];

export function AreaCombiningSavingsReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAreaCombiningSavings.filter(r => {
    const matchesSearch = !search || r.combinedAreas.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    if (dateRange?.from) { const d = parseISO(r.date); if (d < dateRange.from) return false; if (dateRange.to && d > dateRange.to) return false; }
    return matchesSearch && matchesLoc;
  }), [search, locationFilter, dateRange]);

  const totalSaved = filtered.reduce((s, r) => s + r.costSaved, 0);
  const totalHours = filtered.reduce((s, r) => s + r.hoursSaved, 0);
  const chartData = filtered.map(r => ({ name: `${r.combinedAreas.split(' + ')[0]} (${format(parseISO(r.date), 'dd/MM')})`, cost: r.costSaved, hours: r.hoursSaved }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Area Combining Savings Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search areas..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Cost Saved</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">${totalSaved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Hours Saved</p><p className="text-3xl font-bold tracking-tight mt-1">{totalHours}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Combining Events</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Savings per Event</CardTitle></CardHeader>
        <CardContent><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cost" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="hours" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="cost" dataKey="cost" name="Cost Saved ($)" fill="hsl(var(--status-approved))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="hours" dataKey="hours" name="Hours Saved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer></div></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Area Combining Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ReportDataTable columns={tableColumns} data={filtered} rowKey={(_, i) => i} />
        </CardContent>
      </Card>
    </div>
  );
}
