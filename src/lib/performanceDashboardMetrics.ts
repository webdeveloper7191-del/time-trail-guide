import type { Goal, PerformanceReview, Feedback, Conversation } from '@/types/performance';
import type { HappinessEntry } from '@/lib/performanceOperationsStore';
import type { PulseSurvey, PulseResponse, TalentAssessment } from '@/types/advancedPerformance';
export interface DatePeriod { start: string; end: string }
export const inPeriod = (date: string | undefined, period: DatePeriod) => !!date && date.slice(0,10) >= period.start && date.slice(0,10) <= period.end;
export function periodForDays(days: number, now = new Date()): DatePeriod { return { start: new Date(now.getTime() - (days-1)*86400000).toISOString().slice(0,10), end: now.toISOString().slice(0,10) }; }
export function previousPeriod(period: DatePeriod): DatePeriod { const length=Date.parse(period.end)-Date.parse(period.start)+86400000; return {start:new Date(Date.parse(period.start)-length).toISOString().slice(0,10),end:new Date(Date.parse(period.start)-86400000).toISOString().slice(0,10)}; }
export const average = (values: number[]) => values.length ? values.reduce((sum,n)=>sum+n,0)/values.length : null;
export const completionRate = (complete: number, total: number) => total ? complete / total * 100 : null;
export function enpsMetric(surveys: PulseSurvey[], responses: PulseResponse[], period: DatePeriod, minimum: number) {
  const values = responses.filter(r=>inPeriod(r.submittedAt,period)).flatMap(r=>{
    const question = surveys.find(s=>s.id===r.surveyId)?.questions.find(q=>q.type==='enps');
    const n=r.responses.find(a=>a.questionId===question?.id)?.value;
    return typeof n==='number' && n>=0 && n<=10 ? [n] : [];
  });
  return {count:values.length,value:values.length>=minimum && values.length ? (values.filter(n=>n>=9).length-values.filter(n=>n<=6).length)/values.length*100 : null};
}
export function dashboardMetrics(data: {goals:Goal[];reviews:PerformanceReview[];feedback:Feedback[];conversations:Conversation[];happiness:HappinessEntry[];surveys:PulseSurvey[];responses:PulseResponse[]}, period: DatePeriod, minimum: number) {
  // Goal/review cohort uses due/period end; charts represent completion status today, not historic snapshots.
  const goals=data.goals.filter(g=>g.status!=='cancelled' && inPeriod(g.targetDate,period));
  const reviews=data.reviews.filter(r=>r.status!=='cancelled' && inPeriod(r.periodEnd,period));
  const feedback=data.feedback.filter(f=>inPeriod(f.createdAt,period));
  const conversations=data.conversations.filter(c=>inPeriod(c.scheduledDate,period));
  const happiness=data.happiness.filter(h=>inPeriod(h.date,period));
  const ratings=reviews.filter(r=>r.status==='completed').flatMap(r=>typeof r.overallManagerRating==='number' ? [r.overallManagerRating] : []);
  return {goals,reviews,feedback,conversations,
    goalRate:completionRate(goals.filter(g=>g.status==='completed').length,goals.length),
    reviewRate:completionRate(reviews.filter(r=>r.status==='completed').length,reviews.length),
    reviewRating:average(ratings),reviewRatingCount:ratings.length,
    happiness:{count:happiness.length,value:happiness.length>=minimum?average(happiness.map(h=>h.score)):null},
    enps:enpsMetric(data.surveys,data.responses,period,minimum),
  };
}
export function monthlyActivity(data: {goals:Goal[];reviews:PerformanceReview[];feedback:Feedback[];conversations:Conversation[]},period:DatePeriod) {
  const rows=[]; const cursor=new Date(period.start+'T00:00:00Z');cursor.setUTCDate(1);
  while(cursor.toISOString().slice(0,10)<=period.end) {
    const key=cursor.toISOString().slice(0,7);const match=(d?:string)=>!!d && d.slice(0,7)===key && inPeriod(d,period);
    rows.push({month:key,goals:data.goals.filter(g=>g.status==='completed' && match(g.completedAt)).length,reviews:data.reviews.filter(r=>r.status==='completed' && match(r.completedAt)).length,feedback:data.feedback.filter(f=>match(f.createdAt)).length,count:data.conversations.filter(c=>match(c.scheduledDate)).length});
    cursor.setUTCMonth(cursor.getUTCMonth()+1);
  }
  return rows;
}
export function latestTalentAt(assessments:TalentAssessment[],end:string) {
  const byStaff=new Map<string,TalentAssessment>();
  for(const a of assessments.filter(a=>a.assessmentDate.slice(0,10)<=end)) { const existing=byStaff.get(a.staffId); if(!existing || a.assessmentDate>existing.assessmentDate)byStaff.set(a.staffId,a); }
  return [...byStaff.values()];
}
export function fixedScore(parts:{value:number|null;weight:number}[]) { return parts.every(p=>p.value!==null) ? parts.reduce((sum,p)=>sum+(p.value ?? 0)*p.weight/100,0) : null; }
export const talentLevel=(score:number)=>score<=2?'low':score<=3.5?'medium':'high';
