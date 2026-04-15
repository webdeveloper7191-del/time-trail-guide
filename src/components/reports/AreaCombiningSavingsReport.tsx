import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAreaCombiningSavings } from '@/data/mockReportData';
import { format, parseISO } from 'date-fns';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportDataTable, DataTableColumn } from './ReportDataTable';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const exportColumns: ExportColumn[] = [
  { header: 'Date', accessor: (r: any) => format(parseISO(r.date), 'dd MMM yyyy') },
  { header: 'Location', accessor: 'location' },
  { header: 'Combined Areas', accessor: 'combinedAreas' },
  { header: 'Staff Saved', accessor: 'staffSaved' },
  { header: 'Hours Saved', accessor: 'hoursSaved' },
  { header: 'Cost Saved ($)', accessor: 'costSaved' },
  { header: 'Children Affected', accessor: 'childrenAffected' },
  { header: 'Duration (min)', accessor: 'durationMinutes' },
];

const locations = [...new Set(mockAreaCombiningSavings.map(r => r.location))];

export function AreaCombiningSavingsReport() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockAreaCombiningSavings.filter(r => {
    const matchesSearch = !search || r.combinedAreas.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalSaved = filtered.reduce((s, r) => s + r.costSaved, 0);
  const totalHours = filtered.reduce((s, r) => s + r.hoursSaved, 0);

  const chartData = filtered.map(r => ({
    name: `${r.combinedAreas.split(' + ')[0]} (${format(parseISO(r.date), 'dd/MM')})`,
    cost: r.costSaved,
    hours: r.hoursSaved,
  }));

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Area Combining Savings Report" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search areas..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Cost Saved</p><p className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">${totalSaved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Hours Saved</p><p className="text-3xl font-bold tracking-tight mt-1">{totalHours}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Combining Events</p><p className="text-3xl font-bold tracking-tight mt-1">{filtered.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Savings per Event</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="cost" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="hours" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="cost" dataKey="cost" name="Cost Saved ($)" fill="hsl(var(--status-approved))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="hours" dataKey="hours" name="Hours Saved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Area Combining Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Combined Areas</TableHead>
                <TableHead className="text-xs text-right">Staff Saved</TableHead>
                <TableHead className="text-xs text-right">Hours Saved</TableHead>
                <TableHead className="text-xs text-right">Cost Saved</TableHead>
                <TableHead className="text-xs text-right">Children</TableHead>
                <TableHead className="text-xs text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(parseISO(r.date), 'dd MMM')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm font-medium">{r.combinedAreas}</TableCell>
                  <TableCell className="text-sm text-right">{r.staffSaved}</TableCell>
                  <TableCell className="text-sm text-right">{r.hoursSaved}h</TableCell>
                  <TableCell className="text-sm text-right font-medium text-emerald-600">${r.costSaved}</TableCell>
                  <TableCell className="text-sm text-right">{r.childrenAffected}</TableCell>
                  <TableCell className="text-sm text-right">{Math.round(r.durationMinutes / 60)}h {r.durationMinutes % 60}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
