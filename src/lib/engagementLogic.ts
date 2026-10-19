import type { WellbeingCheckIn, WellbeingIndicator, PulseSurvey, PulseResponse } from '@/types/advancedPerformance';
import type { PerformanceRules } from '@/lib/performanceTaxonomyStore';

export function happinessHistory(entries: {date: string; score: number}[]) {
  const groups = new Map<string, number[]>();
  entries.forEach(e => { const key=e.date.slice(0,7); groups.set(key,[...(groups.get(key)??[]),e.score]); });
  return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([period,scores])=>({period,score:scores.reduce((s,v)=>s+v,0)/scores.length,responseCount:scores.length}));
}
export function analyseWellbeing(indicator: WellbeingIndicator, checkIn: WellbeingCheckIn | undefined, rules: PerformanceRules['wellbeing']): WellbeingIndicator {
  const workloadScore=checkIn?.workloadRating ?? indicator.workloadScore;
  const engagementScore=checkIn ? checkIn.energyLevel : indicator.engagementScore;
  const riskFactors: string[]=[];
  if(indicator.overtimeHours>=rules.overtimeHoursThreshold) riskFactors.push('Overtime threshold reached');
  if(indicator.consecutiveWorkDays>=rules.consecutiveDaysThreshold) riskFactors.push('Consecutive workday threshold reached');
  if(indicator.daysSinceLastLeave>=rules.daysSinceLeaveThreshold) riskFactors.push('Leave overdue');
  if(workloadScore>=8) riskFactors.push('High reported workload');
  if(checkIn && checkIn.stressLevel>=8) riskFactors.push('High reported stress');
  if(engagementScore<=3) riskFactors.push('Low reported energy');
  return {...indicator,workloadScore,engagementScore,riskFactors,riskLevel:riskFactors.length>=4?'critical':riskFactors.length>=2?'high':riskFactors.length?'moderate':'low',recommendations:riskFactors.length?['Discuss workload and support needs with the staff member','Review upcoming shifts, breaks and leave']:['Continue regular wellbeing check-ins']};
}
export function updateWellbeingIndicators(indicators: WellbeingIndicator[], checkIns: WellbeingCheckIn[], rules: PerformanceRules['wellbeing']): WellbeingIndicator[] {
  const result = [...indicators];
  const latest = new Map<string, WellbeingCheckIn>();
  checkIns.forEach(checkIn => {
    const previous = latest.get(checkIn.staffId);
    if (!previous || checkIn.date > previous.date || (checkIn.date === previous.date && checkIn.createdAt > previous.createdAt)) latest.set(checkIn.staffId, checkIn);
  });
  latest.forEach(checkIn => {
    if (result.some(indicator => indicator.staffId === checkIn.staffId)) return;
    result.push({
      id: `wellbeing-${checkIn.staffId}`, staffId: checkIn.staffId,
      periodStart: checkIn.date, periodEnd: checkIn.date, createdAt: checkIn.createdAt,
      overtimeHours: 0, averageWorkdayLength: 0, consecutiveWorkDays: 0, leaveBalance: 0,
      daysSinceLastLeave: 0, missedBreaks: 0, afterHoursMessages: 0,
      workloadScore: checkIn.workloadRating ?? 5, engagementScore: checkIn.energyLevel,
      riskLevel: 'low', riskFactors: [], recommendations: [],
    });
  });
  return result.map(indicator => {
    const checkIn = latest.get(indicator.staffId);
    return analyseWellbeing(checkIn ? { ...indicator, periodEnd: checkIn.date } : indicator, checkIn, rules);
  });
}
export function pulseResults(survey: PulseSurvey, responses: PulseResponse[], audienceSize: number) {
  const rows=responses.filter(r=>r.surveyId===survey.id);
  return {surveyId:survey.id,totalResponses:rows.length,responseRate:Math.min(100,Math.round(rows.length/Math.max(1,audienceSize)*100)),questionResults:survey.questions.map(q=>{
    const values=rows.flatMap(r=>r.responses.filter(a=>a.questionId===q.id).map(a=>a.value));
    const nums=values.filter((v):v is number=>typeof v==='number');
    return {questionId:q.id,questionText:q.text,questionType:q.type,averageRating:nums.length?nums.reduce((s,v)=>s+v,0)/nums.length:undefined,ratingDistribution:nums.length?[...new Set(nums)].sort((a,b)=>a-b).map(rating=>({rating,count:nums.filter(v=>v===rating).length})):undefined,textResponses:values.filter((v):v is string=>typeof v==='string')};
  })};
}