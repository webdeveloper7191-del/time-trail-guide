import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockRealTimeAttendance, clockStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Clock, AlertTriangle, CheckCircle2, Coffee, UserX } from 'lucide-react';

const statusBadgeColors: Record<string, string> = {
  clocked_in: 'bg-emerald-100 text-emerald-700',
  on_break: 'bg-amber-100 text-amber-700',
  clocked_out: 'bg-muted text-muted-foreground',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-orange-100 text-orange-700',
  not_started: 'bg-sky-100 text-sky-700',
};

const pieColors = ['#10B981', '#F59E0B', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', '#F97316', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Role', accessor: 'role' }, { header: 'Scheduled', accessor: (r: any) => `${r.scheduledStart} - ${r.scheduledEnd}` },
  { header: 'Clock In', accessor: (r: any) => r.actualClockIn || '—' },
  { header: 'Status', accessor: (r: any) => clockStatusLabels[r.status] },
  { header: 'Late (min)', accessor: (r: any) => r.lateMinutes || 0 },
  { header: 'Hours', accessor: (r: any) => r.currentShiftHours || 0 },
];

const locations = [...new Set(mockRealTimeAttendance.map(r => r.location))];

export function RealTimeAttendanceDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockRealTimeAttendance.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const clockedIn = filtered.filter(r => r.status === 'clocked_in' || r.status === 'late').length;
  const onBreak = filtered.filter(r => r.status === 'on_break').length;
  const absent = filtered.filter(r => r.status === 'absent').length;
  const late = filtered.filter(r => r.lateMinutes && r.lateMinutes > 0).length;
  const notStarted = filtered.filter(r => r.status === 'not_started').length;
  const clockedOut = filtered.filter(r => r.status === 'clocked_out').length;
  const attendanceRate = filtered.length > 0 ? Math.round(((filtered.length - absent) / filtered.length) * 100) : 0;
  const avgLateMinutes = late > 0 ? Math.round(filtered.filter(r => r.lateMinutes && r.lateMinutes > 0).reduce((s, r) => s + (r.lateMinutes || 0), 0) / late) : 0;
  const totalHours = filtered.reduce((s, r) => s + (r.currentShiftHours || 0), 0);

  const statusPie = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: clockStatusLabels[k as keyof typeof clockStatusLabels], value: v }));
  }, [filtered]);

  const lateByLocation = useMemo(() => locations.map(loc => {
    const locStaff = filtered.filter(r => r.location === loc);
    return {
      name: loc.split(' ')[0],
      late: locStaff.filter(r => r.lateMinutes && r.lateMinutes > 0).length,
      onTime: locStaff.filter(r => r.status === 'clocked_in' && (!r.lateMinutes || r.lateMinutes === 0)).length,
      absent: locStaff.filter(r => r.status === 'absent').length,
    };
  }), [filtered]);

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Real-Time Attendance" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff or role..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Real-Time Attendance Dashboard"
        reportDescription="Live view of staff attendance status including clock-ins, breaks, absences, and late arrivals across all locations."
        purpose="Provides real-time visibility into workforce presence for operational decision-making, enabling immediate response to attendance issues."
        whenToUse={[
          'Throughout the day to monitor live attendance status', 'When responding to unexpected absences or coverage gaps',
          'During shift changeover periods to verify handoffs', 'For end-of-day attendance reconciliation',
        ]}
        keyMetrics={[
          { label: 'Attendance Rate', description: 'Percentage of scheduled staff who are present (not absent)', interpretation: 'Below 90% indicates a coverage risk', goodRange: '≥95%', warningRange: '90-94%', criticalRange: '<90%' },
          { label: 'Late Arrivals', description: 'Staff who clocked in after their scheduled start', interpretation: 'Chronic lateness (>10% of staff) suggests scheduling or transport issues', goodRange: '0-5%', warningRange: '5-10%', criticalRange: '>10%' },
          { label: 'Avg Late Minutes', description: 'Average tardiness among late arrivals', interpretation: '>15 min average significantly impacts service delivery and team morale' },
          { label: 'Absent Count', description: 'Staff who are absent without coverage', interpretation: 'Each absence may require agency fill or overtime to maintain ratios' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Eight real-time metrics with conditional coloring. Red = immediate action required.' },
          { title: 'Status Pie', content: 'Visual breakdown of all attendance statuses. A healthy distribution has clocked-in dominating.' },
          { title: 'Location Breakdown', content: 'Stacked bar chart shows late, on-time, and absent counts per location to identify problem sites.' },
          { title: 'Staff Table', content: 'Live detail view with late indicators, shift hours, and status badges for every scheduled staff member.' },
        ]}
        actionableInsights={[
          'Absent staff without replacement coverage should trigger immediate agency or on-call activation',
          'Locations with >2 late arrivals may need shift start time review',
          'Staff consistently late >15 minutes should have performance conversations',
          'Monitor on-break duration to ensure compliance with break policies',
        ]}
        relatedReports={['Late & Punctuality', 'Attendance Trend', 'Break Compliance', 'Timesheet Exception']}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Scheduled" value={filtered.length} icon={Users} size="sm" />
        <StatCard label="Clocked In" value={clockedIn} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="On Break" value={onBreak} icon={Coffee} size="sm" />
        <StatCard label="Absent" value={absent} icon={UserX} size="sm" variant={absent > 2 ? 'danger' : absent > 0 ? 'warning' : 'success'} />
        <StatCard label="Late Arrivals" value={late} icon={AlertTriangle} size="sm" variant={late > 3 ? 'danger' : late > 0 ? 'warning' : 'success'} />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={Users} size="sm" variant={attendanceRate >= 95 ? 'success' : attendanceRate >= 90 ? 'warning' : 'danger'} />
        <StatCard label="Avg Late (min)" value={avgLateMinutes} icon={Clock} size="sm" variant={avgLateMinutes > 15 ? 'danger' : 'default'} />
        <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {absent > 2 && <InsightCard type="negative" title="High Absence Count" description={`${absent} staff absent today (${100 - attendanceRate}% of scheduled). Coverage gaps likely in multiple areas.`} action="Activate agency or on-call staff immediately" />}
        {late > 3 && <InsightCard type="action" title="Multiple Late Arrivals" description={`${late} staff arrived late with an average tardiness of ${avgLateMinutes} minutes. Review scheduling patterns.`} action="Investigate common causes and adjust shift times" />}
        {attendanceRate >= 95 && <InsightCard type="positive" title="Strong Attendance" description={`${attendanceRate}% attendance rate. Operations running at full capacity.`} />}
        {absent === 0 && late === 0 && <InsightCard type="positive" title="Perfect Attendance" description="All scheduled staff are present and on time. Excellent operational day." />}
      </div>

      <SummaryRow items={[
        { label: 'Scheduled', value: filtered.length }, { label: 'Present', value: clockedIn + onBreak, highlight: true },
        { label: 'Absent', value: absent }, { label: 'Late', value: late },
        { label: 'Not Started', value: notStarted }, { label: 'Clocked Out', value: clockedOut },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Attendance by Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lateByLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10B981" />
                <Bar dataKey="late" name="Late" stackId="a" fill="#F59E0B" />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Live Staff Status</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Scheduled</TableHead>
                <TableHead className="text-xs">Clock In</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.staffId}>
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
