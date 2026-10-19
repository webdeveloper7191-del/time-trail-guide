import { useState } from 'react';
import type { Goal, PerformanceReview, Feedback, Conversation } from '@/types/performance';
import { usePerformanceOperations } from '@/lib/performanceOperationsStore';
import { usePerformanceRules } from '@/hooks/usePerformanceTaxonomy';
import { dashboardMetrics, monthlyActivity, periodForDays, previousPeriod } from '@/lib/performanceDashboardMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadPerformanceCsv } from '@/lib/performanceExperienceStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
export interface ReportingProps { goals:Goal[];reviews:PerformanceReview[];feedback:Feedback[];conversations:Conversation[] }
export function PerformanceReportingView(props:ReportingProps) {
  const operations=usePerformanceOperations();const rules=usePerformanceRules();
  const [period,setPeriod]=useState(()=>periodForDays(rules.analytics.defaultRangeDays));
  const source={...props,happiness:operations.happinessEntries,surveys:operations.pulseSurveys,responses:operations.pulseResponses};
  const minimum=Math.max(rules.analytics.minGroupSizeForBreakdown,rules.surveys.minResponsesToPublish);
  const current=dashboardMetrics(source,period,minimum), prior=dashboardMetrics(source,previousPeriod(period),minimum);
  const metrics=[
    {name:'Goal completion',value:current.goalRate,previous:prior.goalRate,count:current.goals.length,unit:'%',source:'Goals due in period'},
    {name:'Review completion',value:current.reviewRate,previous:prior.reviewRate,count:current.reviews.length,unit:'%',source:'Reviews ending in period'},
    {name:'Manager review rating',value:current.reviewRating,previous:prior.reviewRating,count:current.reviewRatingCount,unit:'/5',source:'Completed review ratings'},
    {name:'Happiness',value:current.happiness.value,previous:prior.happiness.value,count:current.happiness.count,unit:`/${rules.happiness.scaleMax}`,source:'Dated happiness responses'},
    {name:'eNPS',value:current.enps.value,previous:prior.enps.value,count:current.enps.count,unit:'',source:'Dated eNPS answers'},
    {name:'Feedback',value:current.feedback.length,previous:prior.feedback.length,count:current.feedback.length,unit:'',source:'Feedback created in period'},
    {name:'1:1 conversations',value:current.conversations.length,previous:prior.conversations.length,count:current.conversations.length,unit:'',source:'Conversations scheduled in period'},
  ];
  const chart=monthlyActivity(props,period);
  return <div className="space-y-5"><div className="flex flex-wrap items-end gap-3">
    <label className="text-xs">From<Input aria-label="Reporting start date" type="date" value={period.start} max={period.end} onChange={e=>setPeriod(p=>({...p,start:e.target.value}))}/></label>
    <label className="text-xs">To<Input aria-label="Reporting end date" type="date" value={period.end} min={period.start} onChange={e=>setPeriod(p=>({...p,end:e.target.value}))}/></label>
    <Button variant="outline" size="sm" onClick={()=>downloadPerformanceCsv('\uFEFFMetric,Value,Sample size,Source,Start,End\r\n'+metrics.map(m=>[m.name,m.value??'Withheld or unavailable',m.count,m.source,period.start,period.end].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'),'performance-metrics.csv')}><Download className="mr-2 h-4 w-4"/>Export</Button>
  </div><p className="text-xs text-muted-foreground">Browser records · {period.start} to {period.end} · Includes seeded demonstration records where present. Happiness and eNPS require at least {minimum} responses. Completion rates describe the current status of the selected due-date cohort.</p>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m=><Card key={m.name}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{m.name}</p><p className="mt-2 text-xl font-semibold">{m.value===null?'Not enough data':`${Number(m.value.toFixed(1))}${m.unit}`}</p><p className="mt-2 text-xs text-muted-foreground">{m.source} · n={m.count}</p>{rules.analytics.comparePreviousPeriod && m.value!==null && m.previous!==null && <p className="mt-1 text-xs text-muted-foreground">{(m.value-m.previous)>0?'+':''}{(m.value-m.previous).toFixed(1)} vs previous equal period</p>}</CardContent></Card>)}</div>
  <section className="border-t border-border pt-4"><h3 className="mb-2 text-sm font-semibold">Dated activity</h3><p className="mb-3 text-xs text-muted-foreground">Completed goals and reviews by completion date; feedback by creation date; conversations by scheduled date. No historical score is inferred.</p><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="month"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="goals" name="Goals completed" fill="hsl(var(--primary))"/><Bar dataKey="reviews" name="Reviews completed" fill="hsl(var(--success))"/><Bar dataKey="feedback" name="Feedback" fill="hsl(var(--warning))"/><Bar dataKey="count" name="Conversations" fill="hsl(var(--info))"/></BarChart></ResponsiveContainer></div></section>
  </div>;
}
