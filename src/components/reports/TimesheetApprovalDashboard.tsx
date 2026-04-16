import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockApprovalPipeline, approvalStatusLabels } from '@/data/mockTimesheetReportData';
import { cn } from '@/lib/utils';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportHelpGuide } from './ReportHelpGuide';
import { StatCard, InsightCard, SummaryRow } from './ReportWidgets';
import { DrillFilterBadge, DrillFilter } from './DrillFilterBadge';
import { DateRange } from 'react-day-picker';
import { ExportColumn } from '@/lib/reportExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, CheckCircle2, AlertTriangle, FileWarning, Users, Target, TrendingUp, Shield } from 'lucide-react';
import { filterByDateRange } from '@/lib/reportDateFilter';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700', escalated: 'bg-orange-100 text-orange-700',
  auto_approved: 'bg-sky-100 text-sky-700',
};
const pieColors = ['#F59E0B', '#10B981', 'hsl(var(--destructive))', '#F97316', 'hsl(var(--primary))'];

const exportColumns: ExportColumn[] = [
  { header: 'Staff', accessor: 'staffName' }, { header: 'Location', accessor: 'location' },
  { header: 'Status', accessor: (r: any) => approvalStatusLabels[r.status] },
  { header: 'Hours', accessor: 'totalHours' }, { header: 'Tier', accessor: 'tier' },
];
const locations = [...new Set(mockApprovalPipeline.map(r => r.location))];

export function TimesheetApprovalDashboard() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [drill, setDrill] = useState<DrillFilter | null>(null);

  const baseFiltered = useMemo(() => filterByDateRange(mockApprovalPipeline.filter(r => {
    const ms = !search || r.staffName.toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === 'all' || r.location === locationFilter;
    return ms && ml;
  }), dateRange)), [search, locationFilter, dateRange]);

  const filtered = useMemo(() => {
    if (!drill) return baseFiltered;
    if (drill.type === 'status') return baseFiltered.filter(r => r.status === drill.value);
    if (drill.type === 'tier') return baseFiltered.filter(r => `Tier ${r.tier}` === drill.value);
    if (drill.type === 'location') return baseFiltered.filter(r => r.location.startsWith(drill.value) || r.location === drill.value);
    return baseFiltered;
  }, [baseFiltered, drill]);

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
    return Object.entries(counts).map(([k, v]) => ({ name: approvalStatusLabels[k as keyof typeof approvalStatusLabels], value: v, status: k }));
  }, [filtered]);

  const tierData = [1, 2, 3].map(t => ({
    name: `Tier ${t}`, count: filtered.filter(r => r.tier === t).length,
    pending: filtered.filter(r => r.tier === t && r.status === 'pending').length,
    approved: filtered.filter(r => r.tier === t && (r.status === 'approved' || r.status === 'auto_approved')).length,
  })).filter(t => t.count > 0);

  const locationBreakdown = locations.map(loc => {
    const items = baseFiltered.filter(r => r.location === loc);
    return { name: loc.split(' ')[0], fullName: loc, pending: items.filter(r => r.status === 'pending').length, approved: items.filter(r => r.status === 'approved' || r.status === 'auto_approved').length, escalated: items.filter(r => r.status === 'escalated').length };
  });

  const handlePieClick = (_: any, index: number) => {
    const item = pieData[index];
    if (item) setDrill({ type: 'status', value: item.status, label: item.name });
  };

  const handleTierClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.name) {
      setDrill({ type: 'tier', value: data.activePayload[0].payload.name, label: 'Tier' });
    }
  };

  const handleLocationClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      setDrill({ type: 'location', value: data.activePayload[0].payload.fullName, label: 'Location' });
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar title="Timesheet Approval Pipeline" searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search staff..." locationFilter={locationFilter} onLocationChange={setLocationFilter}
        locations={locations} exportColumns={exportColumns} exportData={filtered} dateRange={dateRange} onDateRangeChange={setDateRange} />

      <ReportHelpGuide reportName="Timesheet Approval Pipeline" reportDescription="Approval workflow tracker with drill-through to status, tier, and location."
        purpose="Monitor approval bottlenecks and ensure timely payroll processing."
        whenToUse={['Before payroll cut-off', 'To identify approval bottlenecks', 'SLA compliance reporting']}
        keyMetrics={[
          { label: 'Approval Rate', description: '% approved of total', interpretation: 'Should be >90% by cut-off', goodRange: '≥90%', warningRange: '75-89%', criticalRange: '<75%' },
          { label: 'Avg Turnaround', description: 'Hours from submission to decision', interpretation: 'SLA target 24h', goodRange: '<24h', warningRange: '24-48h', criticalRange: '>48h' },
        ]}
        howToRead={[{ title: 'Drill-Through', content: 'Click pie slices to filter by status. Click tier bars to filter by tier. Click location bars to filter by site. Table rows are also clickable.' }]}
        actionableInsights={['Pending >48h should be escalated', 'High exception rates suggest scheduling issues']}
        relatedReports={['Approval SLA', 'Weekly Timesheet', 'Overtime by Location']}
      />

      <DrillFilterBadge filter={drill} onClear={() => setDrill(null)} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Pending" value={pending} icon={Clock} size="sm" variant={pending > 5 ? 'danger' : pending > 2 ? 'warning' : 'default'} />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} size="sm" variant="success" />
        <StatCard label="Escalated" value={escalated} icon={AlertTriangle} size="sm" variant={escalated > 2 ? 'danger' : escalated > 0 ? 'warning' : 'default'} />
        <StatCard label="Rejected" value={rejected} icon={FileWarning} size="sm" variant={rejected > 0 ? 'warning' : 'default'} />
        <StatCard label="Approval %" value={`${approvalRate}%`} icon={Target} size="sm" variant={approvalRate >= 90 ? 'success' : approvalRate >= 75 ? 'warning' : 'danger'} />
        <StatCard label="Turnaround" value={`${avgTurnaround}h`} icon={TrendingUp} size="sm" variant={avgTurnaround > 48 ? 'danger' : avgTurnaround > 24 ? 'warning' : 'success'} />
        <StatCard label="Exceptions" value={withExceptions} icon={Shield} size="sm" variant={withExceptions > 3 ? 'danger' : 'default'} />
        <StatCard label="Total Hours" value={`${totalHours}h`} icon={Users} size="sm" subtitle={`OT: ${totalOT}h`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pending > 5 && <InsightCard type="negative" title="Bottleneck" description={`${pending} pending.`} action="Notify approvers" />}
        {approvalRate >= 90 && <InsightCard type="positive" title="Healthy Pipeline" description={`${approvalRate}% approved.`} />}
        {avgTurnaround <= 24 && <InsightCard type="positive" title="Fast Turnaround" description={`${avgTurnaround}h meets SLA.`} />}
      </div>

      <SummaryRow items={[
        { label: 'Submissions', value: filtered.length }, { label: 'Approved', value: approved, highlight: true },
        { label: 'Pending', value: pending }, { label: 'Escalated', value: escalated }, { label: 'Hours', value: `${totalHours}h` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Status <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" onClick={handlePieClick} style={{ cursor: 'pointer' }}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3"><CardTitle className="text-sm">By Tier <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tierData} onClick={handleTierClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" style={{ cursor: 'pointer' }} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60 cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3"><CardTitle className="text-sm">By Location <span className="text-[10px] text-muted-foreground">(click to drill)</span></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationBreakdown} onClick={handleLocationClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" style={{ cursor: 'pointer' }} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" style={{ cursor: 'pointer' }} />
                <Bar dataKey="escalated" name="Escalated" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Approval Queue {drill && <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Staff</TableHead><TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Period</TableHead><TableHead className="text-xs text-right">Hours</TableHead>
              <TableHead className="text-xs text-right">OT</TableHead><TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Tier</TableHead><TableHead className="text-xs text-right">Turn.</TableHead>
              <TableHead className="text-xs">Exc.</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDrill({ type: 'status', value: r.status, label: approvalStatusLabels[r.status] })}>
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
