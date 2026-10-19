import { useState, useSyncExternalStore } from 'react';
import { performanceRecords, performanceApi, usePerformanceRecordsVersion } from '@/lib/api/performanceApi';
import { usePerformanceStaffSkills, usePerformanceSkills } from '@/lib/performanceLocalData';
import { performancePlanStore, usePerformancePlanStore } from '@/lib/performancePlanStore';
import { useLmsState } from '@/lib/lmsStore';
import { developmentJourneys } from '@/lib/performanceDevelopmentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { skillLevelValues } from '@/types/advancedPerformance';
import { toast } from 'sonner';
import { Plus, ArrowRight } from 'lucide-react';
export function ConnectedDevelopmentPanel({staffId,currentUserId,onNavigate}:{staffId:string;currentUserId:string;onNavigate:(tab:string,id?:string)=>void}) {
  usePerformanceRecordsVersion();const [skills]=usePerformanceSkills();const [staffSkills,setStaffSkills]=usePerformanceStaffSkills();
  const [courses]=useLmsState('courses');const [enrollments,setEnrollments]=useLmsState('enrollments');const plans=usePerformancePlanStore();
  const journeys=useSyncExternalStore(developmentJourneys.subscribe,developmentJourneys.get,developmentJourneys.get).filter(j=>j.staffId===staffId);
  const reviews=performanceRecords.reviews().filter(r=>r.staffId===staffId&&r.status==='completed');
  const gaps=(staffSkills[staffId]??[]).filter(s=>skillLevelValues[s.currentLevel]<skillLevelValues[s.targetLevel]);
  const [reviewId,setReviewId]=useState(''),[skillId,setSkillId]=useState(''),[courseId,setCourseId]=useState(''),[date,setDate]=useState(''),[busy,setBusy]=useState(false);
  async function create(resumeId?: string) {
    const pending=journeys.find(j=>j.id===resumeId);
    const selectedReview=pending?.reviewId??reviewId, selectedSkill=pending?.skillId??skillId, selectedCourse=pending?.courseId??courseId, selectedDate=pending?.followUpDate??date;
    const review=reviews.find(r=>r.id===selectedReview);const skill=skills.find(s=>s.id===selectedSkill);const course=courses.find(c=>c.id===selectedCourse);
    if(!review||!skill||!course||!selectedDate||(!pending&&selectedDate<=new Date().toISOString().slice(0,10))){toast.error('Select evidence, a skill gap, a course and a future follow-up date');return;}
    if(!pending&&journeys.some(j=>j.reviewId===selectedReview&&j.skillId===selectedSkill&&j.courseId===selectedCourse)){toast.error('This development journey already exists');return;}
    setBusy(true);try {
      const timestamp=pending?.createdAt??new Date().toISOString();const start=timestamp.slice(0,10);
      const id=pending?.id??crypto.randomUUID();
      const journey=pending??{id,staffId,reviewId:selectedReview,skillId:selectedSkill,courseId:selectedCourse,followUpDate:selectedDate,createdAt:timestamp,goalId:`${id}:goal`,planId:`${id}:plan`,enrollmentId:`${id}:enrolment`,followUpReviewId:`${id}:review`,status:'pending' as const};
      if(!pending) developmentJourneys.set(prev=>[...prev,journey]);
      if(!(staffSkills[staffId]??[]).some(s=>s.skillId===selectedSkill)) setStaffSkills(prev=>({...prev,[staffId]:[...(prev[staffId]??[]),{skillId:selectedSkill,currentLevel:'none',targetLevel:'beginner',lastAssessedAt:timestamp,notes:`Development need identified from review ${review.id}`}]}));
      const goal=await performanceApi.createGoal({staffId,title:`Develop ${skill.name}`,description:review.areasForImprovement?.join('\n')||review.developmentPlan||`Build ${skill.name} through ${course.title}`,category:'Skill Development',priority:'medium',status:'not_started',progress:0,startDate:start,targetDate:selectedDate,milestones:[],linkedReviewId:review.id,createdBy:currentUserId},journey.goalId);
      const followup=await performanceApi.createReview({staffId,reviewerId:currentUserId,reviewCycle:'monthly',periodStart:start,periodEnd:selectedDate,status:'pending_self',ratings:[],customCriteria:review.customCriteria,ratingScaleSnapshot:review.ratingScaleSnapshot},journey.followUpReviewId);
      let enrollment=enrollments.find(e=>e.staffId===staffId&&e.courseId===course.id&&e.status!=='expired'&&e.status!=='failed');
      if(!enrollment){enrollment={id:journey.enrollmentId,staffId,courseId:course.id,status:'not_started',progress:0,moduleProgress:[],assessmentAttempts:[],assignedBy:currentUserId,dueDate:selectedDate,createdAt:timestamp,updatedAt:timestamp};setEnrollments(prev=>[...prev,enrollment as typeof prev[number]]);}
      const plan=performancePlanStore.createPlan({templateId:'connected-development',templateName:`${skill.name} development`,staffId,assignedBy:currentUserId,type:'skill_development',status:'active',startDate:start,endDate:selectedDate,notes:`Review evidence: ${review.id}\nSkill: ${skill.id}\n${review.developmentPlan??''}`,goalIds:[goal.data.id],reviewIds:[followup.data.id],conversationIds:[],learningPathIds:[],courseIds:[course.id]},journey.planId);
      developmentJourneys.set(prev=>prev.map(j=>j.id===journey.id?{...journey,planId:plan.id,enrollmentId:enrollment.id,followUpReviewId:followup.data.id,status:'complete'}:j));
      toast.success('Development plan, learning assignment and follow-up review created');
    }catch(error){toast.error(error instanceof Error?error.message:'Could not create development journey');}finally{setBusy(false);}
  }
  const choices=[{label:'Completed review evidence',value:reviewId,set:setReviewId,items:reviews.map(r=>({id:r.id,name:`${r.periodStart} – ${r.periodEnd}`}))},{label:'Skill gap',value:skillId,set:setSkillId,items:skills.map(s=>({id:s.id,name:`${s.name}${gaps.some(g=>g.skillId===s.id)?' · existing gap':''}`}))},{label:'Published course',value:courseId,set:setCourseId,items:courses.filter(c=>c.status==='published').map(c=>({id:c.id,name:c.title}))}];
  return <section className="space-y-4 border-t border-border pt-5"><h3 className="text-sm font-semibold">Connected development</h3><div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">{choices.map(c=><label key={c.label} className="text-xs">{c.label}<Select value={c.value} onValueChange={c.set}><SelectTrigger aria-label={c.label}><SelectValue placeholder="Select…"/></SelectTrigger><SelectContent>{c.items.map(i=><SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select></label>)}<label className="text-xs">Follow-up date<Input aria-label="Development follow-up date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><Button disabled={busy} onClick={()=>create()}><Plus className="mr-2 h-4 w-4"/>{busy?'Creating…':'Create development journey'}</Button>
  <div className="space-y-3">{journeys.map(j=>{const enrollment=enrollments.find(e=>e.id===j.enrollmentId);const plan=plans.assignedPlans.find(p=>p.id===j.planId);const followup=performanceRecords.reviews().find(r=>r.id===j.followUpReviewId);return <div key={j.id} className="border-b border-border py-3"><p className="text-sm font-medium">{skills.find(s=>s.id===j.skillId)?.name} · {courses.find(c=>c.id===j.courseId)?.title}</p>{j.status==='pending'&&<Button size="sm" disabled={busy} onClick={()=>create(j.id)}>Resume unfinished setup</Button>}<p className="mt-1 text-xs text-muted-foreground">Plan: {plan?.status??'Unavailable'} · Learning: {enrollment?.progress??0}% · Follow-up: {j.followUpDate} · {followup?.status??'Unavailable'}</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>onNavigate('reviews',j.reviewId)}>Review evidence</Button><Button size="sm" variant="outline" onClick={()=>onNavigate('plans',j.planId)}>Plan</Button><Button size="sm" variant="outline" onClick={()=>onNavigate('lms',j.courseId)}>Learning</Button><Button size="sm" variant="outline" onClick={()=>onNavigate('reviews',j.followUpReviewId)}>Follow-up <ArrowRight className="ml-2 h-3 w-3"/></Button></div></div>;})}</div>
  </section>;
}
