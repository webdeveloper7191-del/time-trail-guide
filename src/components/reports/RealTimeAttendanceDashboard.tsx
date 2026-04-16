import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockRealTimeAttendance, clockStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, Clock, AlertTriangle, CheckCircle2, Coffee, UserX } from 'lucide-react';

const statusBadgeColors: Record<string, string> = {
  clocked_in: 'bg-emerald-100 text-emerald-700', on_break: 'bg-amber-100 text-amber-700',
  clocked_out: 'bg-muted text-muted-foreground', absent: 'bg-red-100 text-red-700',
  late: 'bg-orange-100 text-orange-700', not_started: 'bg-sky-100 text-sky-700',
};
const pieColors = ['#10B981', '#F59E0B', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', '#F97316', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Status', accessor: (r: any) => clockStatusLabels[r.status] },
  { header: 'Hours', accessor: (r: any) => r.currentShiftHours || 0 },
];
const locations = [...new Set(mockRealTimeAttendance.map(r => r.location))];

export function RealTimeAttendanceDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => mockRealTimeAttendance.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'status') return baseFiltered.filter(r => r.status === drill.value);
    if (drill.type === 'location') return baseFiltered.filter(r => r.location.startsWith(drill.value) || r.location === drill.value);
    return baseFiltered;
  }, [baseFiltered, drill]);

  const clockedIn = filtered.filter(r => r.status === 'clocked_in' || r.status === 'late').length;
  const onBreak = filtered.filter(r => r.status === 'on_break').length;
  const absent = filtered.filter(r => r.status === 'absent').length;
  const late = filtered.filter(r => r.lateMinutes && r.lateMinutes > 0).length;
  const attendanceRate = filtered.length > 0 ? Math.round(((filtered.length - absent) / filtered.length) * 100) : 0;
  const avgLateMinutes = late > 0 ? Math.round(filtered.filter(r => r.lateMinutes && r.lateMinutes > 0).reduce((s, r) => s + (r.lateMinutes || 0), 0) / late) : 0;
  const totalHours = filtered.reduce((s, r) => s + (r.currentShiftHours || 0), 0);

  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: clockStatusLabels[k as keyof typeof clockStatusLabels], value: v, status: k }));
  }, [filtered]);

  const lateByLocation = useMemo(() => locations.map(loc => {
    const locStaff = baseFiltered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], fullName: loc, late: locStaff.filter(r => r.lateMinutes && r.lateMinutes > 0).length, onTime: locStaff.filter(r => r.status === 'clocked_in' && (!r.lateMinutes || r.lateMinutes === 0)).length, absent: locStaff.filter(r => r.status === 'absent').length };
  }), [baseFiltered]);

  const handlePieClick = (_: any, index: number) => {
    const item = statusPie[index];
    if (item) setDrill({ type: 'status', value: item.status, label: clockStatusLabels[item.status as keyof typeof clockStatusLabels] || item.status });
  };

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Real-Time Attendance" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Real-Time Attendance Dashboard" reportDescription="Live staff attendance with drill-through filtering."
        purpose="Real-time workforce visibility. Click any chart element to drill into specific statuses or locations."
        whenToUse={['Throughout the day for live monitoring', 'During shift changeovers', 'When responding to absences']}
        keyMetrics={[
          { label: 'Attendance Rate', description: '% of scheduled staff present', interpretation: 'Below 90% = coverage risk', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Late Arrivals', description: 'Staff clocked in after schedule', interpretation: '>10% indicates systemic issues' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click a pie slice to filter by status. Click a location bar to filter by site. All metrics and the staff table update instantly.' }]}
        actionableInsights={['Absent staff trigger agency/on-call activation', 'Locations with >2 late arrivals need shift time review']}
        relatedReports={['Late & Punctuality', 'Attendance Trend', 'Break Compliance']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Scheduled" value={filtered.length} icon={Users} size="sm" />
        <StatCard label="Clocked In" value={clockedIn} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="On Break" value={onBreak} icon={Coffee} size="sm" />
        <StatCard label="Absent" value={absent} icon={UserX} size="sm" variant={absent > 2 ? 'danger' : absent > 0 ? 'warning' : 'success'} />
        <StatCard label="Late Arrivals" value={late} icon={AlertTriangle} size="sm" variant={late > 3 ? 'danger' : late > 0 ? 'warning' : 'success'} />
        <StatCard label="Attendance %" value={`${attendanceRate}%`} icon={Users} size="sm" variant={attendanceRate >= 95 ? 'success' : attendanceRate >= 90 ? 'warning' : 'danger'} />
        <StatCard label="Avg Late (min)" value={avgLateMinutes} icon={Clock} size="sm" variant={avgLateMinutes > 15 ? 'danger' : 'default'} />
        <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {absent > 2 && <InsightCard type="negative" title="High Absences" description={`${absent} staff absent.`} action="Activate agency/on-call" />}
        {late > 3 && <InsightCard type="action" title="Multiple Late" description={`${late} late, avg ${avgLateMinutes}min.`} action="Review scheduling" />}
        {attendanceRate >= 95 && <InsightCard type="positive" title="Strong Attendance" description={`${attendanceRate}% present.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Scheduled', value: filtered.length }, { label: 'Present', value: clockedIn + onBreak, highlight: true },
        { label: 'Absent', value: absent }, { label: 'Late', value: late }, { label: 'Hours', value: `${totalHours.toFixed(1)}h` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Status Distribution <span className="text-[10px] text-muted-foreground ml-1">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Attendance by Location <span className="text-[10px] text-muted-foreground ml-1">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lateByLocation} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10B981" style={{ cursor: 'pointer' }} />
                <Bar dataKey="late" name="Late" stackId="a" fill="#F59E0B" style={{ cursor: 'pointer' }} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Live Staff Status {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Role</TableHead><TableHead className="text-xs">Scheduled</TableHead>
                <TableHead className="text-xs">Clock In</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.staffId} className="cursor-pointer hover:bg-muted/50" onClick={() => setDrill({ type: 'status', value: r.status, label: clockStatusLabels[r.status] })}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="text-xs">{r.scheduledStart} - {r.scheduledEnd}</TableCell>
                  <TableCell className="text-sm">{r.actualClockIn || '—'}{r.lateMinutes && r.lateMinutes > 5 ? <span className="text-destructive ml-1 text-xs">(+{r.lateMinutes}m)</span> : ''}</TableCell>
                  <TableCell><Badge className={cn('text-xs', statusBadgeColors[r.status])}>{clockStatusLabels[r.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-right">{r.currentShiftHours ? `${r.currentShiftHours}h` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
