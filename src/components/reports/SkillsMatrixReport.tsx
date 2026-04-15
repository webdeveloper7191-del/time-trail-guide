import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilterBar } from './ReportFilterBar';
import { mockSkillsMatrix } from '@/data/mockWorkforceReportData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExportColumn } from '@/lib/reportExport';

const levelColors: Record<string, string> = {
  beginner: 'bg-muted text-muted-foreground',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-emerald-100 text-emerald-800',
  expert: 'bg-purple-100 text-purple-800',
};

export function SkillsMatrixReport() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const filtered = useMemo(() => {
    return mockSkillsMatrix.filter(r => {
      if (location !== 'all' && r.location !== location) return false;
      if (search && !r.staffName.toLowerCase().includes(search.toLowerCase()) && !r.skills.some(s => s.name.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [search, location]);

  const skillCoverage = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => r.skills.forEach(s => { map[s.name] = (map[s.name] || 0) + 1; }));
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const locations = [...new Set(mockSkillsMatrix.map(r => r.location))];
  const exportColumns: ExportColumn[] = [
    { header: 'Staff', accessor: 'staffName' },
    { header: 'Location', accessor: 'location' },
    { header: 'Department', accessor: 'department' },
    { header: 'Skills', accessor: (r) => r.skills.map((s: any) => `${s.name} (${s.level})`).join(', ') },
    { header: 'Total Skills', accessor: 'totalSkills' },
    { header: 'Certifications', accessor: 'certifications' },
  ];

  return (
    <div className="space-y-6">
      <<ReportFilterBar <ReportFilterBar title="Staff Skills Matrix" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or skills..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search staff or skills..." locationFilter={location} onLocationChange={setLocation} locations={locations} exportData={filtered} exportColumns={exportColumns} /> />

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Skill Coverage Across Staff</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skillCoverage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Staff Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Staff Skills Detail</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Skills</TableHead>
              <TableHead className="text-xs text-right">Certs</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.skills.map(s => (
                        <Badge key={s.name} className={`text-[10px] ${levelColors[s.level]}`}>{s.name} • {s.level}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">{r.certifications}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
