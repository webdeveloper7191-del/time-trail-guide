import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockApprovalPipeline, approvalStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Clock, CheckCircle2, AlertTriangle, FileWarning, Users, Target, TrendingUp, Shield } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700', escalated: 'bg-orange-100 text-orange-700',
  auto_approved: 'bg-sky-100 text-sky-700',
};
const pieColors = ['#F59E0B', '#10B981', 'hsl(var(--destructive))', '#F97316', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Period', accessor: 'period' }, { header: 'Total Hours', accessor: 'totalHours' },
  { header: 'Overtime', accessor: 'overtimeHours' }, { header: 'Status', accessor: (r: any) => approvalStatusLabels[r.status] },
  { header: 'Tier', accessor: 'tier' }, { header: 'Turnaround (h)', accessor: (r: any) => r.turnaroundHours ?? 'Pending' },
];

const locations = [...new Set(mockApprovalPipeline.map(r => r.location))];

export function TimesheetApprovalDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => mockApprovalPipeline.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), [search, locationFilter]);

  const pending = filtered.filter(r => r.status === 'pending').length;
  const escalated = filtered.filter(r => r.status === 'escalated').length;
  const approved = filtered.filter(r => r.status === 'approved' || r.status === 'auto_approved').length;
  const rejected = filtered.filter(r => r.status === 'rejected').length;
  const withExceptions = filtered.filter(r => r.hasExceptions).length;
  const approvalRate = filtered.length > 0 ? Math.round((approved / filtered.length) * 100) : 0;
  const completedWithTime = filtered.filter(r => r.turnaroundHours != null);
  const avgTurnaround = completedWithTime.length > 0 ? Math.round(completedWithTime.reduce((s, r) => s + (r.turnaroundHours || 0), 0) / completedWithTime.length) : 0;
  const totalHours = filtered.reduce((s, r) => s + r.totalHours, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: approvalStatusLabels[k as keyof typeof approvalStatusLabels], value: v }));
  }, [filtered]);

  const tierData = [1, 2, 3].map(t => ({
    name: `Tier ${t}`, count: filtered.filter(r => r.tier === t).length,
    pending: filtered.filter(r => r.tier === t && r.status === 'pending').length,
    approved: filtered.filter(r => r.tier === t && (r.status === 'approved' || r.status === 'auto_approved')).length,
  })).filter(t => t.count > 0);

  const locationBreakdown = locations.map(loc => {
    const items = filtered.filter(r => r.location === loc);
    return {
      name: loc.split(' ')[0],
      pending: items.filter(r => r.status === 'pending').length,
      approved: items.filter(r => r.status === 'approved' || r.status === 'auto_approved').length,
      escalated: items.filter(r => r.status === 'escalated').length,
    };
  });

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Timesheet Approval Pipeline" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered}
        dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide
        reportName="Timesheet Approval Pipeline"
        reportDescription="Tracks the status and flow of timesheet submissions through multi-tier approval workflows including turnaround times and exceptions."
        purpose="Ensures timely payroll processing by monitoring approval bottlenecks, SLA compliance, and exception management."
        whenToUse={[
          'Before payroll cut-off to ensure all timesheets are approved', 'To identify approval bottlenecks causing payroll delays',
          'When investigating escalated or rejected timesheets', 'For SLA compliance reporting to management',
        ]}
        keyMetrics={[
          { label: 'Approval Rate', description: 'Percentage of submissions approved (including auto-approved)', interpretation: 'Should be >90% by payroll cut-off. Low rates delay payroll', goodRange: '≥90%', warningRange: '75-89%', criticalRange: '<75%' },
          { label: 'Avg Turnaround', description: 'Average hours from submission to approval decision', interpretation: 'SLA target is typically 24h. Above 48h = bottleneck', goodRange: '<24h', warningRange: '24-48h', criticalRange: '>48h' },
          { label: 'Pending Count', description: 'Timesheets awaiting review', interpretation: 'High pending count near payroll cut-off = urgent action needed' },
          { label: 'Exception Rate', description: 'Timesheets flagged with exceptions (overtime, discrepancies)', interpretation: 'Exceptions require manual review and slow the pipeline' },
        ]}
        howToRead={[
          { title: 'KPI Cards', content: 'Eight pipeline metrics with traffic-light coloring. Monitor pending and escalated counts closely near payroll deadlines.' },
          { title: 'Status Pie', content: 'Visual breakdown of approval pipeline. Healthy pipeline: approved dominates with minimal pending/escalated.' },
          { title: 'Tier Analysis', content: 'Shows distribution across approval tiers. Higher tiers (2-3) indicate complex approvals or overtime reviews.' },
          { title: 'Location Breakdown', content: 'Identifies which sites have the most pending or escalated timesheets.' },
        ]}
        actionableInsights={[
          'Pending timesheets >48h old should be escalated to the next approval tier',
          'Locations with disproportionate pending counts may have inactive approvers',
          'High exception rates suggest scheduling issues generating excessive overtime',
          'Auto-approval thresholds can be adjusted to reduce Tier 1 bottlenecks',
        ]}
        relatedReports={['Approval SLA', 'Weekly Timesheet', 'Timesheet Exception', 'Overtime by Location']}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Pending Review" value={pending} icon={Clock} size="sm" variant={pending > 5 ? 'danger' : pending > 2 ? 'warning' : 'default'} />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="Escalated" value={escalated} icon={AlertTriangle} size="sm" variant={escalated > 2 ? 'danger' : escalated > 0 ? 'warning' : 'default'} />
        <StatCard label="Rejected" value={rejected} icon={FileWarning} size="sm" variant={rejected > 0 ? 'warning' : 'default'} />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={Target} size="sm" variant={approvalRate >= 90 ? 'success' : approvalRate >= 75 ? 'warning' : 'danger'} />
        <StatCard label="Avg Turnaround" value={`${avgTurnaround}h`} icon={TrendingUp} size="sm" variant={avgTurnaround > 48 ? 'danger' : avgTurnaround > 24 ? 'warning' : 'success'} />
        <StatCard label="With Exceptions" value={withExceptions} icon={Shield} size="sm" variant={withExceptions > 3 ? 'danger' : 'default'} />
        <StatCard label="Total Hours" value={`${totalHours}h`} icon={Users} size="sm" subtitle={`OT: ${totalOT}h`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pending > 5 && <InsightCard type="negative" title="Approval Bottleneck" description={`${pending} timesheets pending review. Risk of payroll processing delay.`} action="Notify approvers and escalate aged submissions" />}
        {escalated > 2 && <InsightCard type="action" title="High Escalation Count" description={`${escalated} timesheets escalated to higher tiers. Review escalation triggers.`} action="Check escalation reasons and resolve" />}
        {approvalRate >= 90 && <InsightCard type="positive" title="Healthy Pipeline" description={`${approvalRate}% approval rate. Pipeline is flowing smoothly.`} />}
        {avgTurnaround <= 24 && <InsightCard type="positive" title="Fast Turnaround" description={`Average ${avgTurnaround}h turnaround meets the 24h SLA target.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Total Submissions', value: filtered.length }, { label: 'Approved', value: approved, highlight: true },
        { label: 'Pending', value: pending }, { label: 'Escalated', value: escalated },
        { label: 'Total Hours', value: `${totalHours}h` }, { label: 'OT Hours', value: `${totalOT}h` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">By Approval Tier</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">By Location</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" />
                <Bar dataKey="escalated" name="Escalated" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approval Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs text-right">Hours</TableHead>
                <TableHead className="text-xs text-right">OT</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Tier</TableHead>
                <TableHead className="text-xs text-right">Turnaround</TableHead>
                <TableHead className="text-xs">Exceptions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm">{r.period}</TableCell>
                  <TableCell className="text-sm text-right">{r.totalHours}h</TableCell>
                  <TableCell className="text-sm text-right">{r.overtimeHours > 0 ? <Badge variant="destructive" className="text-xs">{r.overtimeHours}h</Badge> : '—'}</TableCell>
                  <TableCell><Badge className={cn('text-xs capitalize', statusColors[r.status])}>{approvalStatusLabels[r.status]}</Badge></TableCell>
                  <TableCell className="text-sm">Tier {r.tier}</TableCell>
                  <TableCell className="text-sm text-right">{r.turnaroundHours != null ? `${r.turnaroundHours}h` : '—'}</TableCell>
                  <TableCell>{r.hasExceptions ? <Badge variant="outline" className="text-xs border-destructive text-destructive">Yes</Badge> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
