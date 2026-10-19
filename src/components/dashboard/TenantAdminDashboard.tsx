import { useState } from 'react';
import { Building2, Users, DollarSign, CheckSquare, Briefcase, GraduationCap, ShieldCheck, Calendar, Settings, Sparkles, FileText, BarChart3, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardKpis } from './DashboardKpis';
import { DashboardSection, DashboardLink, ActionQueue, ShortcutGrid, MetricBar, EmptyDashboard } from './DashboardSections';
import { useDashboardData, filterDashboardTimesheets, money, hours, type DashboardPeriod } from './dashboardData';
import { TimesheetChart, ApprovalSummary, TimesheetQueue, timesheetActions } from './TimesheetInsights';

export function TenantAdminDashboard({ period }: { period: DashboardPeriod }) {
  const data = useDashboardData();
  const [location, setLocation] = useState('all');
  const [sort, setSort] = useState('pending');
  const locations = [...new Map(data.timesheets.map(t => [t.location.id, t.location])).values()];
  const records = filterDashboardTimesheets(data.timesheets, period, location === 'all' ? undefined : location);
  const totalHours = records.reduce((s,t) => s+t.totalHours, 0);
  const approved = records.filter(t => t.status === 'approved');
  const runs = data.payroll.runs.filter(r => !r.reversedAt && !r.reversalOfRunId);
  const activeEnrolments = data.learning.enrollments.filter(e => e.status !== 'completed' && e.status !== 'expired');
  const overdue = activeEnrolments.filter(e => e.dueDate && e.dueDate.slice(0,10) < new Date().toISOString().slice(0,10));
  const rows = locations.filter(l => location === 'all' || l.id === location).map(l => {
    const list = records.filter(t => t.location.id === l.id);
    return { ...l, staff: new Set(list.map(t => t.employee.id)).size, hours: list.reduce((s,t)=>s+t.totalHours,0), pending: list.filter(t=>t.status==='pending').length, approved: list.filter(t=>t.status==='approved').length };
  }).sort((a,b) => sort === 'hours' ? b.hours-a.hours : sort === 'name' ? a.name.localeCompare(b.name) : b.pending-a.pending);
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Timesheet overview · selected period</p><Select value={location} onValueChange={setLocation}><SelectTrigger aria-label="Tenant dashboard location" className="h-9 w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All locations</SelectItem>{locations.map(l=><SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
    <DashboardKpis columns={5} items={[
      { label: 'Locations with records', value: String(rows.filter(r=>r.staff>0).length), icon: Building2 },
      { label: 'Staff with timesheets', value: String(new Set(records.map(t=>t.employee.id)).size), icon: Users },
      { label: 'Recorded hours', value: hours(totalHours), icon: Clock },
      { label: 'Approved hours', value: hours(approved.reduce((s,t)=>s+t.totalHours,0)), icon: CheckSquare, hint: 'Payroll-eligible status' },
      { label: 'Awaiting review', value: String(records.filter(t=>t.status==='pending').length), icon: ShieldCheck },
    ]} />
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><TimesheetChart records={records}/><DashboardSection title="Priority actions" action={<DashboardLink to="/my-tasks">Tasks</DashboardLink>}><ActionQueue items={timesheetActions(records)}/></DashboardSection></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><DashboardSection title="Location comparison" subtitle="Based on timesheets in the selected period" action={<Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort location comparison" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending first</SelectItem><SelectItem value="hours">Most hours</SelectItem><SelectItem value="name">Location name</SelectItem></SelectContent></Select>}><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground">{['Location','Staff','Hours','Approved','Pending',''].map((h,i)=><th key={i} className="py-3 pr-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b border-border/60"><td className="py-4 pr-4 font-medium">{r.name}</td><td className="pr-4">{r.staff}</td><td className="pr-4 whitespace-nowrap">{hours(r.hours)}</td><td className="pr-4">{r.approved}</td><td className="pr-4"><Badge variant={r.pending ? 'outline' : 'secondary'}>{r.pending}</Badge></td><td><DashboardLink to="/timesheet-admin">Review</DashboardLink></td></tr>)}</tbody></table></div></DashboardSection><ApprovalSummary records={records}/></div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DashboardSection title="Payroll control" subtitle="All saved pay runs" action={<DashboardLink to="/payroll">Payroll</DashboardLink>}><div className="text-2xl font-semibold">{money(runs.filter(r=>r.status==='posted').reduce((s,r)=>s+r.totals.grossPay,0))}</div><p className="text-xs text-muted-foreground">Posted gross pay · all periods</p><ActionQueue items={[{label:'Draft pay runs',detail:'Preparation in progress',count:runs.filter(r=>r.status==='draft').length,to:'/payroll',icon:FileText},{label:'Runs awaiting approval',detail:'Submitted for review',count:runs.filter(r=>r.status==='review').length,to:'/payroll',icon:CheckSquare}]}/></DashboardSection>
      <DashboardSection title="Hiring pipeline" subtitle="Current recruitment records" action={<DashboardLink to="/recruitment">Recruitment</DashboardLink>}><div className="flex items-baseline gap-2"><span className="text-2xl font-semibold">{data.recruitment.jobs.filter(j=>j.status==='open').length}</span><span className="text-xs text-muted-foreground">open positions</span></div><div className="space-y-3">{data.recruitment.pipeline.filter(p=>!['rejected','withdrawn'].includes(p.id)).map(p=><MetricBar key={p.id} label={p.label} value={data.recruitment.applicants.filter(a=>a.status===p.id).length} max={data.recruitment.applicants.length} caption={String(data.recruitment.applicants.filter(a=>a.status===p.id).length)}/>)}</div></DashboardSection>
      <DashboardSection title="Learning & compliance" subtitle="Current learning records" action={<DashboardLink to="/performance/lms">Learning</DashboardLink>}><ActionQueue items={[{label:'Active enrolments',detail:'Assigned training still in progress',count:activeEnrolments.length,to:'/performance/lms',icon:GraduationCap},{label:'Overdue learning',detail:'Past the assigned due date',count:overdue.length,to:'/performance/lms',icon:Clock,urgent:true},{label:'Certificates',detail:'Issued training records',count:data.learning.certificates.length,to:'/performance/lms',icon:ShieldCheck}]}/></DashboardSection>
    </div>
    <TimesheetQueue records={records}/>
    <DashboardSection title="Workspace shortcuts"><ShortcutGrid items={[{label:'Roster planning',to:'/roster',icon:Calendar},{label:'Staff directory',to:'/workforce',icon:Users},{label:'Reports',to:'/reports',icon:BarChart3},{label:'Recognition',to:'/recognition',icon:Sparkles},{label:'Users & permissions',to:'/settings/permissions',icon:ShieldCheck},{label:'Organisation settings',to:'/settings',icon:Settings}]}/></DashboardSection>
  </div>;
}