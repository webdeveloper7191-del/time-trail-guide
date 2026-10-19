import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Timesheet } from '@/types/timesheet';
import { DashboardSection, DashboardLink, EmptyDashboard, MetricBar } from './DashboardSections';
import { hours } from './dashboardData';

export function TimesheetChart({ records }: { records: Timesheet[] }) {
  const daily = new Map<string, { date: string; ordinary: number; overtime: number }>();
  records.forEach(t => t.entries.forEach(e => {
    const row = daily.get(e.date) ?? { date: e.date, ordinary: 0, overtime: 0 };
    row.ordinary += Math.max(0, e.netHours - e.overtime); row.overtime += e.overtime; daily.set(e.date, row);
  }));
  const data = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  return <DashboardSection title="Recorded hours" subtitle="Ordinary hours and overtime from timesheet entries"><div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />Ordinary</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground" />Overtime</span></div>{data.length === 0 ? <EmptyDashboard>No recorded hours in this period.</EmptyDashboard> : <div className="h-60 w-full" role="img" aria-label={`Daily recorded hours, ${hours(data.reduce((s, d) => s + d.ordinary + d.overtime, 0))} total`}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 15, right: 5, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="date" tickFormatter={v => format(parseISO(v), 'd MMM')} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip labelFormatter={v => format(parseISO(String(v)), 'EEE, d MMM yyyy')} formatter={(v: number, name: string) => [hours(v), name]} contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--foreground))' }} /><Bar name="Ordinary" dataKey="ordinary" stackId="hours" fill="hsl(var(--primary))" maxBarSize={30} /><Bar name="Overtime" dataKey="overtime" stackId="hours" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div>}</DashboardSection>;
}
export function ApprovalSummary({ records }: { records: Timesheet[] }) {
  return <DashboardSection title="Timesheet readiness" action={<DashboardLink to="/timesheet-admin">Review</DashboardLink>}><div className="space-y-5">{(['approved', 'pending', 'rejected'] as const).map(status => {
    const list = records.filter(t => t.status === status);
    return <MetricBar key={status} label={status === 'approved' ? 'Approved for payroll' : status === 'pending' ? 'Awaiting review' : 'Needs correction'} value={list.length} max={records.length} caption={`${list.length} · ${hours(list.reduce((s, t) => s + t.totalHours, 0))}`} />;
  })}</div></DashboardSection>;
}
export function TimesheetQueue({ records, staff = false }: { records: Timesheet[]; staff?: boolean }) {
  const [query, setQuery] = useState('');
  const list = records.filter(t => `${t.employee.name} ${t.location.name}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => Number(a.status === 'approved') - Number(b.status === 'approved'));
  return <DashboardSection title={staff ? 'My timesheet history' : 'Review queue'} subtitle={`${records.length} timesheets in the selected period`} action={<DashboardLink to={staff ? '/employee-portal?tab=current' : '/timesheet-admin'}>View all</DashboardLink>}><Input aria-label="Search dashboard timesheets" placeholder="Search staff or location" value={query} onChange={e => setQuery(e.target.value)} className="max-w-sm h-9" />{list.length === 0 ? <EmptyDashboard>No matching timesheets.</EmptyDashboard> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="py-3 pr-4 font-medium">{staff ? 'Period' : 'Staff'}</th><th className="py-3 pr-4 font-medium">Location</th><th className="py-3 pr-4 font-medium">Hours</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 font-medium">Action</th></tr></thead><tbody>{list.slice(0, 8).map(t => <tr key={t.id} className="border-b border-border/60"><td className="py-3 pr-4"><p className="font-medium">{staff ? format(parseISO(t.weekStartDate), 'd MMM yyyy') : t.employee.name}</p>{!staff && <p className="mt-0.5 text-muted-foreground">{format(parseISO(t.weekStartDate), 'd MMM yyyy')}</p>}</td><td className="py-3 pr-4">{t.location.name}</td><td className="py-3 pr-4 whitespace-nowrap">{hours(t.totalHours)}</td><td className="py-3 pr-4"><Badge variant={t.status === 'rejected' ? 'destructive' : t.status === 'approved' ? 'secondary' : 'outline'}>{t.status === 'approved' ? 'Approved' : t.status === 'pending' ? 'Pending' : 'Correction'}</Badge></td><td><DashboardLink to={staff ? '/employee-portal?tab=current' : '/timesheet-admin'}>Open</DashboardLink></td></tr>)}</tbody></table>{list.length > 8 && <p className="pt-3 text-xs text-muted-foreground">Showing 8 of {list.length}</p>}</div>}</DashboardSection>;
}
export function timesheetActions(records: Timesheet[], staff = false) {
  const to = staff ? '/employee-portal?tab=current' : '/timesheet-admin';
  return [
    { label: staff ? 'Awaiting approval' : 'Timesheets awaiting review', detail: 'Pending timesheets', count: records.filter(t => t.status === 'pending').length, to, icon: CheckSquare },
    { label: 'Corrections required', detail: 'Returned timesheets', count: records.filter(t => t.status === 'rejected').length, to, icon: AlertTriangle, urgent: true },
    { label: 'Unresolved exceptions', detail: 'Clock entries needing attention', count: records.flatMap(t => t.entries).filter(e => e.exception && !e.exception.resolved).length, to, icon: Clock, urgent: true },
    { label: 'Approved for payroll', detail: 'Ready for pay-run processing', count: records.filter(t => t.status === 'approved').length, to: staff ? '/employee-portal?tab=payslips' : '/payroll', icon: CheckCircle2 },
  ];
}