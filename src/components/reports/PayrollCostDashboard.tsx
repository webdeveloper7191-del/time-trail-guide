import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportFilterBar } from './ReportFilterBar';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { mockPayRunRecords, payrollTrendData } from '@/data/mockPayrollReportData';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#F59E0B', '#10B981', '#8B5CF6'];

const exportColumns: ExportColumn[] = [
  { header: 'Month', accessor: 'month' }, { header: 'Total Labour', accessor: 'totalLabour' },
  { header: 'Overtime', accessor: 'overtime' }, { header: 'Penalties', accessor: 'penalties' },
  { header: 'Budget', accessor: 'budget' },
];

const locations = [...new Set(mockPayRunRecords.map(r => r.location))];

export function PayrollCostDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockPayRunRecords.filter(r => {
    const matchesSearch = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = locationFilter === 'all' || r.location === locationFilter;
    return matchesSearch && matchesLoc;
  }), [search, locationFilter]);

  const totalGross = filtered.reduce((s, r) => s + r.totalGross, 0);
  const totalOvertime = filtered.reduce((s, r) => s + r.overtimePay, 0);
  const totalAllowances = filtered.reduce((s, r) => s + r.allowances, 0);
  const totalPenalties = filtered.reduce((s, r) => s + r.penalties, 0);

  const costBreakdown = [
    { name: 'Base Pay', value: filtered.reduce((s, r) => s + r.basePay, 0) },
    { name: 'Overtime', value: totalOvertime },
    { name: 'Penalties', value: totalPenalties },
    { name: 'Allowances', value: totalAllowances },
    { name: 'Super', value: filtered.reduce((s, r) => s + r.superannuation, 0) },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Payroll Cost Dashboard" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff..."
        locationFilter={locationFilter} onLocationChange={setLocationFilter} locations={locations}
        exportColumns={exportColumns} exportData={payrollTrendData} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Gross Pay', value: `$${(totalGross / 1000).toFixed(1)}k`, icon: DollarSign },
          { label: 'Overtime Cost', value: `$${(totalOvertime / 1000).toFixed(1)}k`, icon: AlertTriangle },
          { label: 'Allowances', value: `$${totalAllowances.toLocaleString()}`, icon: TrendingUp },
          { label: 'Staff in Period', value: filtered.length, icon: Users },
        ].map(c => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <c.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Labour Cost Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={payrollTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="totalLabour" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="overtime" name="Overtime" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Location</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locations.map(loc => {
              const items = filtered.filter(r => r.location === loc);
              return { name: loc.split(' ')[0], base: items.reduce((s, r) => s + r.basePay, 0), overtime: items.reduce((s, r) => s + r.overtimePay, 0), penalties: items.reduce((s, r) => s + r.penalties, 0) };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="base" name="Base" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="overtime" name="OT" stackId="a" fill="#F59E0B" />
              <Bar dataKey="penalties" name="Penalties" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
