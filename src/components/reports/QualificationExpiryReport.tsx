import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockQualificationData } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';
import { format, parseISO } from 'date-fns';

const statusColors: Record<string, string> = { valid: 'bg-emerald-100 text-emerald-800', expiring_soon: 'bg-amber-100 text-amber-800', expired: 'bg-destructive/10 text-destructive' };
const statusLabels: Record<string, string> = { valid: 'Valid', expiring_soon: 'Expiring Soon', expired: 'Expired' };
const COLORS = ['hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(var(--destructive))'];

export function QualificationExpiryReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockQualificationData.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.qualification.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, location]);

  const statusPie = useMemo(() => {
    const counts = { valid: 0, expiring_soon: 0, expired: 0 };
    filtered.forEach(r => counts[r.status]++);
    return Object.entries(counts).map(([k, v]) => ({ name: statusLabels[k], value: v }));
  }, [filtered]);

  const locations = [...new Set(mockQualificationData.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Staff', accessor: 'staffName' },
    { header: 'Location', accessor: 'location' },
    { header: 'Qualification', accessor: 'qualification' },
    { header: 'Expiry Date', accessor: (r) => format(parseISO(r.expiryDate), 'dd MMM yyyy') },
    { header: 'Days Until Expiry', accessor: 'daysUntilExpiry' },
    { header: 'Status', accessor: (r) => statusLabels[r.status] },
  ];

  return (
    <div className="space-y-6">
      <<ReportFilterBar title="Qualification & Certification Expiry" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or qualifications..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> title="Qualification & Certification Expiry" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or qualifications..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> />

      <div className="grid grid-cols-3 gap-3">
        {statusPie.map((s, i) => (
          <Card key={s.name} className="border-border/60"><CardContent className="p-4"><p className="text-2xl font-bold tracking-tight">{s.value}</p><p className="text-xs text-muted-foreground">{s.name}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Days Until Expiry</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filtered.filter(r => r.status !== 'valid').sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="staffName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v} days`} />
                <Bar dataKey="daysUntilExpiry" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">All Qualifications</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Qualification</TableHead>
              <TableHead className="text-xs">Expiry</TableHead>
              <TableHead className="text-xs text-right">Days</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.qualification}</TableCell>
                  <TableCell className="text-sm">{format(parseISO(r.expiryDate), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-sm text-right">{r.daysUntilExpiry}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColors[r.status]}`}>{statusLabels[r.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
