import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockContractDistribution } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function ContractDistributionReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockContractDistribution.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.department.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const totals = useMemo(() => {
    return filtered.reduce((a, r) => ({ ft: a.ft + r.fullTime, pt: a.pt + r.partTime, cas: a.cas + r.casual, con: a.con + r.contractor }), { ft: 0, pt: 0, cas: 0, con: 0 });
  }, [filtered]);

  const pieData = [
    { name: 'Full Time', value: totals.ft },
    { name: 'Part Time', value: totals.pt },
    { name: 'Casual', value: totals.cas },
    { name: 'Contractor', value: totals.con },
  ];

  const locations = [...new Set(mockContractDistribution.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Location', accessor: 'location' },
    { header: 'Department', accessor: 'department' },
    { header: 'Full Time', accessor: 'fullTime' },
    { header: 'Part Time', accessor: 'partTime' },
    { header: 'Casual', accessor: 'casual' },
    { header: 'Contractor', accessor: 'contractor' },
    { header: 'Total', accessor: 'totalStaff' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Contract Type Distribution" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} exportFileName="contract-distribution" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Overall Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fullTime" stackId="a" fill={COLORS[0]} name="Full Time" />
                <Bar dataKey="partTime" stackId="a" fill={COLORS[1]} name="Part Time" />
                <Bar dataKey="casual" stackId="a" fill={COLORS[2]} name="Casual" />
                <Bar dataKey="contractor" stackId="a" fill={COLORS[3]} name="Contractor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs text-right">Full Time</TableHead>
              <TableHead className="text-xs text-right">Part Time</TableHead>
              <TableHead className="text-xs text-right">Casual</TableHead>
              <TableHead className="text-xs text-right">Contractor</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.department}</TableCell>
                  <TableCell className="text-sm text-right">{r.fullTime}</TableCell>
                  <TableCell className="text-sm text-right">{r.partTime}</TableCell>
                  <TableCell className="text-sm text-right">{r.casual}</TableCell>
                  <TableCell className="text-sm text-right">{r.contractor}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{r.totalStaff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
