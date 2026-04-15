import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockHeadcountData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

export function HeadcountFTEReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockHeadcountData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.department.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const byDepartment = useMemo(() => {
    const map: Record<string, { department: string; headcount: number; fte: number }> = {};
    filtered.forEach(r => {
      if (!map[r.department]) map[r.department] = { department: r.department, headcount: 0, fte: 0 };
      map[r.department].headcount += r.totalHeadcount;
      map[r.department].fte += r.fte;
    });
    return Object.values(map);
  }, [filtered]);

  const locations = [...new Set(mockHeadcountData.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Department', accessor: 'department' },
    { header: 'Location', accessor: 'location' },
    { header: 'Headcount', accessor: 'totalHeadcount' },
    { header: 'FTE', accessor: 'fte' },
    { header: 'Full Time', accessor: 'fullTime' },
    { header: 'Part Time', accessor: 'partTime' },
    { header: 'Casual', accessor: 'casual' },
    { header: 'Contractor', accessor: 'contractor' },
  ];

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Staff Headcount & FTE Report" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} exportFileName="headcount-fte" />

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Headcount vs FTE by Department</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDepartment}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="headcount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Headcount" />
              <Bar dataKey="fte" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="FTE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Detailed Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs text-right">Headcount</TableHead>
              <TableHead className="text-xs text-right">FTE</TableHead>
              <TableHead className="text-xs text-right">Full Time</TableHead>
              <TableHead className="text-xs text-right">Part Time</TableHead>
              <TableHead className="text-xs text-right">Casual</TableHead>
              <TableHead className="text-xs text-right">Contractor</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.department}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{r.totalHeadcount}</TableCell>
                  <TableCell className="text-sm text-right">{r.fte}</TableCell>
                  <TableCell className="text-sm text-right">{r.fullTime}</TableCell>
                  <TableCell className="text-sm text-right">{r.partTime}</TableCell>
                  <TableCell className="text-sm text-right">{r.casual}</TableCell>
                  <TableCell className="text-sm text-right">{r.contractor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
