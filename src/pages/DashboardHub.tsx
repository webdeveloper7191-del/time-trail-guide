import { useState } from 'react';
import { format } from 'date-fns';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, UserCircle, CalendarDays, Download } from 'lucide-react';
import { TenantAdminDashboard } from '@/components/dashboard/TenantAdminDashboard';
import { LocationAdminDashboard } from '@/components/dashboard/LocationAdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { useDashboardData, filterDashboardTimesheets, type DashboardPeriod } from '@/components/dashboard/dashboardData';
import { employeePortalProfile } from '@/components/employee/employeePortalProfile';

type Persona = 'tenant-admin' | 'location-admin' | 'staff';
const personas = [
  { id: 'tenant-admin' as const, label: 'Tenant Admin', icon: Building2, description: 'Organisation-wide operations, payroll, hiring and learning.' },
  { id: 'location-admin' as const, label: 'Location Admin', icon: MapPin, description: 'Team workload, attendance and approvals by location.' },
  { id: 'staff' as const, label: 'Staff', icon: UserCircle, description: 'Your time, learning, recognition and personal work records.' },
];
export default function DashboardHub() {
  const [persona, setPersona] = useState<Persona>('tenant-admin');
  const [period, setPeriod] = useState<DashboardPeriod>('all');
  const data = useDashboardData();
  const active = personas.find(p=>p.id===persona) ?? personas[0];
  const exportOverview = () => {
    const records = filterDashboardTimesheets(data.timesheets,period,undefined,persona==='staff'?employeePortalProfile.email:undefined);
    const rows = [['Employee','Location','Period start','Status','Recorded hours','Overtime hours'], ...records.map(t=>[t.employee.name,t.location.name,t.weekStartDate,t.status,t.totalHours,t.overtimeHours])];
    const csv = rows.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download=`dashboard-${persona}-${period}.csv`;a.click();URL.revokeObjectURL(url);
  };
  return <div className="flex h-screen bg-background"><div className="hidden shrink-0 md:block"><AdminSidebar/></div><main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5"/>{format(new Date(),'EEEE, d MMMM yyyy')}</p><h1 className="text-2xl font-semibold text-foreground">{active.label} Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">{active.description}</p></div><Badge variant="outline">Role preview · {active.label}</Badge></div><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><Tabs value={persona} onValueChange={v=>{if(v==='tenant-admin'||v==='location-admin'||v==='staff')setPersona(v);}}><TabsList className="h-10">{personas.map(p=><TabsTrigger key={p.id} value={p.id} className="gap-1.5 px-2 text-xs sm:px-4"><p.icon className="h-3.5 w-3.5 shrink-0"/>{p.label}</TabsTrigger>)}</TabsList></Tabs><div className="flex items-center gap-2"><Select value={period} onValueChange={v=>{if(v==='all'||v==='week'||v==='last-week'||v==='month')setPeriod(v);}}><SelectTrigger aria-label="Dashboard period" className="h-9 w-40 text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All recorded periods</SelectItem><SelectItem value="week">This week</SelectItem><SelectItem value="last-week">Last week</SelectItem><SelectItem value="month">Last 30 days</SelectItem></SelectContent></Select><Button variant="outline" size="sm" onClick={exportOverview} className="h-9 gap-2 text-xs" title="Download timesheet overview"><Download className="h-3.5 w-3.5"/>Export</Button></div></div><p className="text-xs text-muted-foreground">Browser workspace records include sample data. Role preview does not change account access.</p>{persona==='tenant-admin'&&<TenantAdminDashboard period={period}/>} {persona==='location-admin'&&<LocationAdminDashboard period={period}/>} {persona==='staff'&&<StaffDashboard period={period}/>}</div></main></div>;
}