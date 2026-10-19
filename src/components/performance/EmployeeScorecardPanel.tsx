import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, Target, ClipboardCheck, Users2, MessageSquareHeart, Info } from 'lucide-react';
import { mockStaff } from '@/data/mockStaffData';
import { usePerformanceOperations } from '@/lib/performanceOperationsStore';
import { performanceRecords, usePerformanceRecordsVersion } from '@/lib/api/performanceApi';
import { usePerformanceStaffSkills, usePerformanceSkills } from '@/lib/performanceLocalData';
import { skillLevelValues } from '@/types/advancedPerformance';

interface ScorePart {
  key: string;
  label: string;
  weight: number;
  /** 0-100, or null when there is no saved data for this section. */
  value: number | null;
  detail: string;
  icon: typeof Gauge;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function EmployeeScorecardPanel() {
  const [staffId, setStaffId] = useState(mockStaff[0]?.id ?? '');
  const operations = usePerformanceOperations();
  usePerformanceRecordsVersion();
  const [staffSkills] = usePerformanceStaffSkills();
  const [skills] = usePerformanceSkills();

  const staff = mockStaff.find(s => s.id === staffId);

  const scorecard = useMemo(() => {
    const latestAssessment = operations.talentAssessments
      .filter(a => a.staffId === staffId)
      .sort((a, b) => new Date(b.assessmentDate || b.updatedAt).getTime() - new Date(a.assessmentDate || a.updatedAt).getTime())[0];

    const reviews = performanceRecords.reviews().filter(r => r.staffId === staffId);
    const latestCompletedReview = reviews
      .filter(r => r.status === 'completed' && r.overallManagerRating)
      .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime())[0];

    const goals = performanceRecords.goals().filter(g => g.staffId === staffId);
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    const completed360 = operations.feedback360Responses.filter(
      r => r.status === 'completed' &&
        operations.feedback360Requests.some(req => req.id === r.requestId && req.subjectStaffId === staffId),
    );
    const rated360 = completed360.flatMap(r => r.ratings).filter(r => r.rating > 0);
    const avg360 = rated360.length ? rated360.reduce((sum, r) => sum + r.rating, 0) / rated360.length : null;

    const receivedFeedback = performanceRecords.feedback().filter(f => f.toStaffId === staffId);

    const parts: ScorePart[] = [
      {
        key: 'talent',
        label: 'Talent assessment',
        weight: 40,
        value: latestAssessment ? (latestAssessment.performanceScore / 5) * 100 : null,
        detail: latestAssessment
          ? `Performance ${latestAssessment.performanceScore.toFixed(1)}/5 · Potential ${latestAssessment.potentialScore.toFixed(1)}/5 · ${latestAssessment.flightRisk} flight risk`
          : 'No saved assessment',
        icon: Gauge,
      },
      {
        key: 'review',
        label: 'Latest review',
        weight: 25,
        value: latestCompletedReview?.overallManagerRating ? (latestCompletedReview.overallManagerRating / 5) * 100 : null,
        detail: latestCompletedReview?.overallManagerRating
          ? `Manager rating ${latestCompletedReview.overallManagerRating.toFixed(1)}/5`
          : 'No completed review',
        icon: ClipboardCheck,
      },
      {
        key: 'goals',
        label: 'Goal completion',
        weight: 20,
        value: goals.length ? (completedGoals / goals.length) * 100 : null,
        detail: goals.length ? `${completedGoals} of ${goals.length} goals completed` : 'No goals set',
        icon: Target,
      },
      {
        key: '360',
        label: '360° feedback',
        weight: 15,
        value: avg360 !== null ? (avg360 / 5) * 100 : null,
        detail: avg360 !== null ? `Average ${avg360.toFixed(1)}/5 across ${completed360.length} response${completed360.length === 1 ? '' : 's'}` : 'No completed 360° responses',
        icon: Users2,
      },
    ];

    const available = parts.filter(p => p.value !== null);
    const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
    const composite = totalWeight
      ? available.reduce((sum, p) => sum + (p.value! * p.weight) / totalWeight, 0)
      : null;

    const personSkills = staffSkills[staffId] ?? [];
    const metSkills = personSkills.filter(s => skillLevelValues[s.currentLevel] >= skillLevelValues[s.targetLevel]).length;

    return { parts, composite, latestAssessment, latestCompletedReview, goals, completedGoals, receivedFeedback, personSkills, metSkills };
  }, [staffId, operations, staffSkills]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.025em]">Employee scorecard</h2>
          <p className="text-xs text-muted-foreground">
            One-page view combining saved talent assessments, reviews, goals and 360° feedback.
          </p>
        </div>
        <Select value={staffId} onValueChange={setStaffId}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Choose a staff member" /></SelectTrigger>
          <SelectContent>
            {mockStaff.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {staff && (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{staff.firstName.charAt(0)}{staff.lastName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{staff.firstName} {staff.lastName}</div>
                <div className="text-xs text-muted-foreground">{staff.position}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tracking-[-0.025em]">
                  {scorecard.composite !== null ? formatPercent(scorecard.composite) : '—'}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Overall score</div>
              </div>
              {scorecard.latestAssessment && (
                <Badge variant="secondary" className="capitalize">
                  {scorecard.latestAssessment.performanceLevel} performance · {scorecard.latestAssessment.potentialLevel} potential
                </Badge>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {scorecard.parts.map(part => {
              const Icon = part.icon;
              return (
                <Card key={part.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{part.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xl font-semibold tracking-[-0.025em]">
                      {part.value !== null ? formatPercent(part.value) : '—'}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{part.detail}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareHeart className="h-4 w-4" /> Recent feedback received
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {scorecard.receivedFeedback.length === 0 && (
                  <p className="text-xs text-muted-foreground">No feedback received yet.</p>
                )}
                {scorecard.receivedFeedback.slice(0, 5).map(f => (
                  <div key={f.id} className="rounded-md border border-border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] capitalize">{f.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4" /> Skills & strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {scorecard.personSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No skills assessed yet.</p>
                ) : (
                  <>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {scorecard.metSkills} of {scorecard.personSkills.length} skills at or above target level
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {scorecard.personSkills.map(s => {
                        const skill = skills.find(k => k.id === s.skillId);
                        const met = skillLevelValues[s.currentLevel] >= skillLevelValues[s.targetLevel];
                        return (
                          <Badge key={s.skillId} variant={met ? 'default' : 'outline'} className="text-[10px]">
                            {skill?.name ?? s.skillId}: {s.currentLevel}
                          </Badge>
                        );
                      })}
                    </div>
                  </>
                )}
                {scorecard.latestCompletedReview?.strengths?.length ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium">Review strengths</div>
                    <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                      {scorecard.latestCompletedReview.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Overall score weights the talent assessment (40%), latest completed review (25%), goal completion (20%) and 360° feedback (15%).
              Sections without saved data are excluded and the remaining weights re-balanced, so the score always reflects real records only.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
