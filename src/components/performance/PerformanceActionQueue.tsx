import { performanceRecords, usePerformanceRecordsVersion } from '@/lib/api/performanceApi';
import { useLmsState } from '@/lib/lmsStore';
import { usePerformancePlanStore } from '@/lib/performancePlanStore';
import { developmentJourneys } from '@/lib/performanceDevelopmentStore';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { mockStaff } from '@/data/mockStaffData';
export function PerformanceActionQueue({onNavigate}:{onNavigate:(tab:string,id?:string,staffId?:string)=>void}) {
  usePerformanceRecordsVersion();const [certificates]=useLmsState('certificates');const [enrollments]=useLmsState('enrollments');const plans=usePerformancePlanStore();const journeys=useSyncExternalStore(developmentJourneys.subscribe,developmentJourneys.get,developmentJourneys.get);
  const today=new Date().toISOString().slice(0,10);const soon=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  const queue=[
    ...performanceRecords.reviews().filter(r=>['pending_self','pending_manager'].includes(r.status)&&r.periodEnd<today).map(r=>({id:r.id,staffId:r.staffId,tab:'reviews',title:'Overdue review',due:r.periodEnd})),
    ...performanceRecords.goals().filter(g=>!['completed','cancelled'].includes(g.status)&&(g.targetDate<today||Date.parse(g.updatedAt)<Date.now()-30*86400000)).map(g=>({id:g.id,staffId:g.staffId,tab:'goals',title:g.targetDate<today?'Overdue goal':'Goal unchanged for 30 days',due:g.targetDate})),
    ...certificates.filter(c=>c.status!=='revoked'&&c.expiresAt&&c.expiresAt.slice(0,10)<=soon).map(c=>({id:c.id,staffId:c.staffId,tab:'lms',title:'Certificate expired / expiring within 30 days',due:c.expiresAt?.slice(0,10)??''})),
    ...journeys.filter(j=>j.followUpDate<=today&&!performanceRecords.reviews().some(r=>r.id===j.followUpReviewId&&r.status==='completed')).map(j=>({id:j.followUpReviewId,staffId:j.staffId,tab:'reviews',title:'Development follow-up due',due:j.followUpDate})),
    ...enrollments.filter(e=>e.status!=='completed'&&e.dueDate&&e.dueDate<today).map(e=>({id:e.id,staffId:e.staffId,tab:'lms',title:'Learning overdue',due:e.dueDate??''})),
    ...plans.assignedPlans.filter(p=>p.status==='active'&&p.endDate<today).map(p=>({id:p.id,staffId:p.staffId,tab:'plans',title:'Development plan follow-up',due:p.endDate})),
  ].sort((a,b)=>a.due.localeCompare(b.due));
  return <section className="mb-5 border-b border-border pb-5"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">Manager action queue</h2><span className="text-xs text-muted-foreground">{queue.length} items · Includes seeded demonstrations where present</span></div><div className="mt-3 max-h-[280px] overflow-y-auto">{!queue.length&&<p className="text-xs text-muted-foreground">No actions due.</p>}{queue.map((item,index)=>{const staff=mockStaff.find(s=>s.id===item.staffId);return <div key={`${item.title}:${item.id}:${index}`} className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-xs"><span className="font-medium">{item.title}</span><span className="text-muted-foreground">{staff?.firstName} {staff?.lastName} · {item.due}</span><Button variant="link" size="sm" className="ml-auto h-7" onClick={()=>onNavigate(item.tab,item.id,item.staffId)}>Open</Button><Button variant="link" size="sm" className="h-7" onClick={()=>onNavigate('scorecard',undefined,item.staffId)}>Scorecard</Button></div>;})}</div></section>;
}
