import React, { useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Handshake, GitCompareArrows, Route, AlertTriangle, Target, ClipboardCheck, Users, LifeBuoy, HeartPulse, BarChart3, GraduationCap, Bell, Smile, Wallet, MessageSquare, ClipboardList } from 'lucide-react';
import { performanceTaxonomyStore, PerformanceRules, distributionTotal } from '@/lib/performanceTaxonomyStore';

function useRules(): PerformanceRules {
  return useSyncExternalStore(
    cb => performanceTaxonomyStore.subscribe(cb),
    () => performanceTaxonomyStore.get().rules,
    () => performanceTaxonomyStore.get().rules,
  );
}

function Section({ id, icon: Icon, title, description, children }: { id?: string; icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="p-4 space-y-4 scroll-mt-32">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function NumberField({ label, hint, value, onChange, min = 0 }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={min} value={value} onChange={e => onChange(Number(e.target.value))} />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function TextField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function KeywordField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5 md:col-span-2">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value.join(', ')}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Comma separated words"
      />
      <p className="text-[11px] text-muted-foreground">{value.length} term{value.length === 1 ? '' : 's'} — comma separated.</p>
    </div>
  );
}

const parseDays = (raw: string) =>
  raw
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0);

export function PerformanceRulesPanel() {
  const rules = useRules();
  const set = performanceTaxonomyStore.updateRules.bind(performanceTaxonomyStore);
  const distTotal = distributionTotal(rules.reviews.distributionTargets);

  return (
    <div className="space-y-4">
      <Section id="rules-goals" icon={Target} title="Goals" description="Defaults and guardrails applied when goals are created or assigned.">
        <NumberField label="Default goal duration (days)" value={rules.goals.defaultDurationDays} onChange={v => set('goals', { defaultDurationDays: v })} />
        <NumberField label="Progress update cadence (days)" hint="Staff are nudged to update progress on this rhythm." value={rules.goals.progressUpdateCadenceDays} onChange={v => set('goals', { progressUpdateCadenceDays: v })} />
        <NumberField label="Minimum goals per person" value={rules.goals.minGoalsPerStaff} onChange={v => set('goals', { minGoalsPerStaff: v })} />
        <NumberField label="Maximum goals per person" value={rules.goals.maxGoalsPerStaff} onChange={v => set('goals', { maxGoalsPerStaff: v })} />
        <ToggleField label="Manager approval required" hint="New goals stay in draft until a manager approves." checked={rules.goals.requireManagerApproval} onChange={v => set('goals', { requireManagerApproval: v })} />
        <ToggleField label="Staff can create their own goals" checked={rules.goals.allowSelfCreatedGoals} onChange={v => set('goals', { allowSelfCreatedGoals: v })} />
        <ToggleField label="Milestones required" hint="Every goal must have at least one milestone." checked={rules.goals.requireMilestones} onChange={v => set('goals', { requireMilestones: v })} />
      </Section>

      <Section id="rules-reviews" icon={ClipboardCheck} title="Reviews & calibration" description="How review cycles run and what the calibration curve should look like.">
        <ToggleField label="Self review required" checked={rules.reviews.selfReviewRequired} onChange={v => set('reviews', { selfReviewRequired: v })} />
        <ToggleField label="Peer review required" checked={rules.reviews.peerReviewRequired} onChange={v => set('reviews', { peerReviewRequired: v })} />
        <ToggleField label="Calibration sessions enabled" checked={rules.reviews.calibrationEnabled} onChange={v => set('reviews', { calibrationEnabled: v })} />
        <ToggleField label="Reviewer can see the self rating" checked={rules.reviews.reviewerCanSeeSelfRating} onChange={v => set('reviews', { reviewerCanSeeSelfRating: v })} />
        <ToggleField label="Staff acknowledgement required" hint="Reviews stay open until the employee signs off." checked={rules.reviews.acknowledgementRequired} onChange={v => set('reviews', { acknowledgementRequired: v })} />
        <div className="space-y-1.5">
          <Label className="text-xs">Reminder days before due</Label>
          <Input
            value={rules.reviews.reminderDaysBefore.join(', ')}
            onChange={e => set('reviews', { reminderDaysBefore: parseDays(e.target.value) })}
            placeholder="7, 3, 1"
          />
          <p className="text-[11px] text-muted-foreground">Comma separated.</p>
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Target rating distribution</Label>
            <Badge variant={distTotal === 100 ? 'secondary' : 'destructive'} className="gap-1">
              {distTotal !== 100 && <AlertTriangle className="h-3 w-3" />} {distTotal}%
            </Badge>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {rules.reviews.distributionTargets.map((t, i) => (
              <div key={t.rating} className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Rating {t.rating}</Label>
                <Input
                  type="number"
                  value={t.percentage}
                  onChange={e => {
                    const next = rules.reviews.distributionTargets.map((x, xi) => (xi === i ? { ...x, percentage: Number(e.target.value) } : x));
                    set('reviews', { distributionTargets: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="rules-feedback360" icon={Users} title="360° feedback" description="Responder limits, anonymity and release rules.">
        <NumberField label="Minimum responders" value={rules.feedback360.minResponders} onChange={v => set('feedback360', { minResponders: v })} />
        <NumberField label="Maximum responders" value={rules.feedback360.maxResponders} onChange={v => set('feedback360', { maxResponders: v })} />
        <NumberField label="Default due window (days)" value={rules.feedback360.defaultDueDays} onChange={v => set('feedback360', { defaultDueDays: v })} />
        <NumberField label="Release threshold" hint="Results stay hidden until this many responses arrive." value={rules.feedback360.releaseThreshold} onChange={v => set('feedback360', { releaseThreshold: v })} />
        <ToggleField label="Anonymous by default" checked={rules.feedback360.anonymousByDefault} onChange={v => set('feedback360', { anonymousByDefault: v })} />
        <ToggleField label="Manager approves the responder list" checked={rules.feedback360.managerApprovesResponders} onChange={v => set('feedback360', { managerApprovesResponders: v })} />
      </Section>

      <Section id="rules-pip" icon={LifeBuoy} title="Performance improvement plans" description="Duration, check-in rhythm and approval path for PIPs.">
        <NumberField label="Default duration (days)" value={rules.pip.defaultDurationDays} onChange={v => set('pip', { defaultDurationDays: v })} />
        <NumberField label="Check-in cadence (days)" value={rules.pip.checkInCadenceDays} onChange={v => set('pip', { checkInCadenceDays: v })} />
        <NumberField label="Maximum extension (days)" value={rules.pip.maxExtensionDays} onChange={v => set('pip', { maxExtensionDays: v })} />
        <ToggleField label="HR approval required" checked={rules.pip.requireHrApproval} onChange={v => set('pip', { requireHrApproval: v })} />
        <ToggleField label="Extensions allowed" checked={rules.pip.allowExtension} onChange={v => set('pip', { allowExtension: v })} />
      </Section>

      <Section id="rules-wellbeing" icon={HeartPulse} title="Wellbeing & burnout" description="Thresholds that trigger a wellbeing risk flag.">
        <NumberField label="Overtime hours per fortnight" value={rules.wellbeing.overtimeHoursThreshold} onChange={v => set('wellbeing', { overtimeHoursThreshold: v })} />
        <NumberField label="Consecutive days worked" value={rules.wellbeing.consecutiveDaysThreshold} onChange={v => set('wellbeing', { consecutiveDaysThreshold: v })} />
        <NumberField label="Days since last leave" value={rules.wellbeing.daysSinceLeaveThreshold} onChange={v => set('wellbeing', { daysSinceLeaveThreshold: v })} />
        <NumberField label="Check-in cadence (days)" value={rules.wellbeing.checkInCadenceDays} onChange={v => set('wellbeing', { checkInCadenceDays: v })} />
        <ToggleField label="Notify manager on high risk" checked={rules.wellbeing.notifyManagerOnHighRisk} onChange={v => set('wellbeing', { notifyManagerOnHighRisk: v })} />
      </Section>

      <Section id="rules-surveys" icon={BarChart3} title="Surveys & eNPS" description="Cadence, anonymity protection and the eNPS question wording.">
        <div className="space-y-1.5">
          <Label className="text-xs">Default frequency</Label>
          <Select value={rules.surveys.defaultFrequency} onValueChange={v => set('surveys', { defaultFrequency: v as PerformanceRules['surveys']['defaultFrequency'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi_weekly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NumberField label="Minimum responses to publish" hint="Protects anonymity in small teams." value={rules.surveys.minResponsesToPublish} onChange={v => set('surveys', { minResponsesToPublish: v })} />
        <ToggleField label="Anonymous by default" checked={rules.surveys.anonymousByDefault} onChange={v => set('surveys', { anonymousByDefault: v })} />
        <ToggleField label="eNPS enabled" checked={rules.surveys.enpsEnabled} onChange={v => set('surveys', { enpsEnabled: v })} />
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs">eNPS question</Label>
          <Input value={rules.surveys.enpsQuestion} onChange={e => set('surveys', { enpsQuestion: e.target.value })} />
        </div>
      </Section>

      <Section id="rules-talent" icon={Users} title="Talent & succession" description="Score thresholds that place someone in the talent grid, and bench targets.">
        <NumberField label="High performance from (rating)" value={rules.talent.highPerformanceThreshold} onChange={v => set('talent', { highPerformanceThreshold: v })} />
        <NumberField label="Medium performance from (rating)" value={rules.talent.mediumPerformanceThreshold} onChange={v => set('talent', { mediumPerformanceThreshold: v })} />
        <NumberField label="High potential from (rating)" value={rules.talent.highPotentialThreshold} onChange={v => set('talent', { highPotentialThreshold: v })} />
        <NumberField label="Medium potential from (rating)" value={rules.talent.mediumPotentialThreshold} onChange={v => set('talent', { mediumPotentialThreshold: v })} />
        <NumberField label="Successors per critical role" value={rules.talent.successionCoverageTarget} onChange={v => set('talent', { successionCoverageTarget: v })} />
      </Section>

      <Section id="rules-learning" icon={GraduationCap} title="Learning" description="Defaults applied to courses, certificates and mandatory training.">
        <NumberField label="Default pass mark (%)" value={rules.learning.defaultPassMark} onChange={v => set('learning', { defaultPassMark: v })} />
        <NumberField label="Certificate validity (months)" value={rules.learning.certificateExpiryMonths} onChange={v => set('learning', { certificateExpiryMonths: v })} />
        <NumberField label="Mandatory completion window (days)" value={rules.learning.mandatoryCompletionDays} onChange={v => set('learning', { mandatoryCompletionDays: v })} />
        <ToggleField label="Staff can self-enrol" checked={rules.learning.allowSelfEnrolment} onChange={v => set('learning', { allowSelfEnrolment: v })} />
      </Section>

      <Section id="rules-happiness" icon={Smile} title="Happiness check-ins" description="Cadence and alerting for the happiness pulse widget.">
        <ToggleField label="Happiness check-ins enabled" checked={rules.happiness.enabled} onChange={v => set('happiness', { enabled: v })} />
        <ToggleField label="Anonymous responses" checked={rules.happiness.anonymous} onChange={v => set('happiness', { anonymous: v })} />
        <NumberField label="Check-in cadence (days)" value={rules.happiness.cadenceDays} onChange={v => set('happiness', { cadenceDays: v })} />
        <NumberField label="Scale maximum" min={3} value={rules.happiness.scaleMax} onChange={v => set('happiness', { scaleMax: v })} />
        <NumberField label="Alert when score at or below" value={rules.happiness.lowScoreAlertThreshold} onChange={v => set('happiness', { lowScoreAlertThreshold: v })} />
      </Section>

      <Section id="rules-budget" icon={Wallet} title="Development budget" description="Currency, allowances and approval thresholds for development spend.">
        <TextField label="Currency code" value={rules.budget.currency} onChange={v => set('budget', { currency: v.toUpperCase() })} />
        <NumberField label="Annual allowance per person" value={rules.budget.defaultAnnualAllowancePerStaff} onChange={v => set('budget', { defaultAnnualAllowancePerStaff: v })} />
        <NumberField label="Approval required above" value={rules.budget.approvalRequiredAbove} onChange={v => set('budget', { approvalRequiredAbove: v })} />
        <NumberField label="Carry-over cap (%)" value={rules.budget.carryOverCapPercent} onChange={v => set('budget', { carryOverCapPercent: v })} />
        <ToggleField label="Unspent budget can carry over" checked={rules.budget.carryOverAllowed} onChange={v => set('budget', { carryOverAllowed: v })} />
      </Section>

      <Section id="rules-plans" icon={ClipboardList} title="Performance plans" description="Defaults applied to development and improvement plans.">
        <NumberField label="Default plan duration (days)" value={rules.plans.defaultDurationDays} onChange={v => set('plans', { defaultDurationDays: v })} />
        <div className="space-y-1.5">
          <Label className="text-xs">Reminder days before due</Label>
          <Input value={rules.plans.reminderDaysBefore.join(', ')} onChange={e => set('plans', { reminderDaysBefore: parseDays(e.target.value) })} placeholder="14, 7, 1" />
          <p className="text-[11px] text-muted-foreground">Comma separated.</p>
        </div>
        <ToggleField label="Staff acknowledgement required" checked={rules.plans.requireAcknowledgement} onChange={v => set('plans', { requireAcknowledgement: v })} />
        <ToggleField label="Close plan automatically on completion" checked={rules.plans.autoCloseOnCompletion} onChange={v => set('plans', { autoCloseOnCompletion: v })} />
      </Section>

      <Section id="rules-analytics" icon={BarChart3} title="Analytics defaults" description="Default reporting window and small-group protection.">
        <NumberField label="Default date range (days)" value={rules.analytics.defaultRangeDays} onChange={v => set('analytics', { defaultRangeDays: v })} />
        <NumberField label="Minimum group size for breakdowns" value={rules.analytics.minGroupSizeForBreakdown} onChange={v => set('analytics', { minGroupSizeForBreakdown: v })} />
        <ToggleField label="Compare to previous period" checked={rules.analytics.comparePreviousPeriod} onChange={v => set('analytics', { comparePreviousPeriod: v })} />
      </Section>

      <Section id="rules-sentiment" icon={MessageSquare} title="Sentiment analysis" description="Keyword lexicon and thresholds used to score written feedback.">
        <NumberField label="Positive from (score x100)" min={-100} value={rules.sentiment.positiveThreshold} onChange={v => set('sentiment', { positiveThreshold: v })} />
        <NumberField label="Negative below (score x100)" min={-100} value={rules.sentiment.negativeThreshold} onChange={v => set('sentiment', { negativeThreshold: v })} />
        <ToggleField label="Analyse feedback automatically" checked={rules.sentiment.enableAutoAnalysis} onChange={v => set('sentiment', { enableAutoAnalysis: v })} />
        <ToggleField label="Highlight matched keywords" checked={rules.sentiment.highlightKeywords} onChange={v => set('sentiment', { highlightKeywords: v })} />
        <KeywordField label="Positive keywords" value={rules.sentiment.positiveKeywords} onChange={v => set('sentiment', { positiveKeywords: v })} />
        <KeywordField label="Negative keywords" value={rules.sentiment.negativeKeywords} onChange={v => set('sentiment', { negativeKeywords: v })} />
        <KeywordField label="Intensifiers" value={rules.sentiment.intensifiers} onChange={v => set('sentiment', { intensifiers: v })} />
        <KeywordField label="Negators" value={rules.sentiment.negators} onChange={v => set('sentiment', { negators: v })} />
      </Section>

      <Section id="rules-compensation" icon={DollarSign} title="Compensation & merit" description="Salary bands, compa-ratio guard rails and the merit increase matrix used by the Compensation tab.">
        <TextField label="Currency" value={rules.compensation.currency} onChange={v => set('compensation', { currency: v })} />
        <NumberField label="Merit budget (% of payroll)" value={rules.compensation.meritBudgetPercent} onChange={v => set('compensation', { meritBudgetPercent: v })} />
        <NumberField label="Below range under compa-ratio" hint="e.g. 0.9" value={rules.compensation.compaRatioBelow} onChange={v => set('compensation', { compaRatioBelow: v })} />
        <NumberField label="Above range over compa-ratio" hint="e.g. 1.1" value={rules.compensation.compaRatioAbove} onChange={v => set('compensation', { compaRatioAbove: v })} />
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Salary bands</Label>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => set('compensation', { bands: [...rules.compensation.bands, { id: `band-${Date.now()}`, label: 'New band', min: 0, mid: 0, max: 0 }] })}>Add band</Button>
          </div>
          <div className="space-y-2">
            {rules.compensation.bands.map((b, i) => (
              <div key={b.id} className="grid grid-cols-2 gap-2 rounded-md border border-border p-2 md:grid-cols-5">
                <Input value={b.label} onChange={e => set('compensation', { bands: rules.compensation.bands.map((x, xi) => xi === i ? { ...x, label: e.target.value } : x) })} />
                <Input type="number" value={b.min} onChange={e => set('compensation', { bands: rules.compensation.bands.map((x, xi) => xi === i ? { ...x, min: Number(e.target.value) } : x) })} />
                <Input type="number" value={b.mid} onChange={e => set('compensation', { bands: rules.compensation.bands.map((x, xi) => xi === i ? { ...x, mid: Number(e.target.value) } : x) })} />
                <Input type="number" value={b.max} onChange={e => set('compensation', { bands: rules.compensation.bands.map((x, xi) => xi === i ? { ...x, max: Number(e.target.value) } : x) })} />
                <Button variant="ghost" size="sm" className="h-9 text-xs text-destructive" onClick={() => set('compensation', { bands: rules.compensation.bands.filter((_, xi) => xi !== i) })}>Remove</Button>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">Columns: band name, minimum, midpoint, maximum.</p>
          </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-xs">Merit increase matrix (% by rating and compa-ratio)</Label>
          {rules.compensation.meritByRating.map((row, i) => (
            <div key={row.rating} className="grid grid-cols-4 items-center gap-2 rounded-md border border-border p-2">
              <span className="text-xs font-medium">Rating {row.rating}</span>
              {(['below', 'at', 'above'] as const).map(col => (
                <div key={col} className="flex items-center gap-1.5">
                  <span className="w-10 text-[11px] text-muted-foreground capitalize">{col}</span>
                  <Input type="number" value={row[col]} onChange={e => set('compensation', { meritByRating: rules.compensation.meritByRating.map((r, ri) => ri === i ? { ...r, [col]: Number(e.target.value) } : r) })} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section id="rules-mentorship" icon={Handshake} title="Mentorship matching" description="Points awarded by the matching engine when pairing mentors with mentees.">
        <NumberField label="Points per matched skill" value={rules.mentorship.skillMatchPoints} onChange={v => set('mentorship', { skillMatchPoints: v })} />
        <NumberField label="Points per shared interest" value={rules.mentorship.interestMatchPoints} onChange={v => set('mentorship', { interestMatchPoints: v })} />
        <NumberField label="Points for aligned career goals" value={rules.mentorship.careerGoalPoints} onChange={v => set('mentorship', { careerGoalPoints: v })} />
        <NumberField label="Points for compatible meeting frequency" value={rules.mentorship.meetingFrequencyPoints} onChange={v => set('mentorship', { meetingFrequencyPoints: v })} />
        <NumberField label="Points for high mentor availability" value={rules.mentorship.highAvailabilityPoints} onChange={v => set('mentorship', { highAvailabilityPoints: v })} />
        <NumberField label="Points for medium mentor availability" value={rules.mentorship.mediumAvailabilityPoints} onChange={v => set('mentorship', { mediumAvailabilityPoints: v })} />
        <NumberField label="Minimum score to suggest a match (%)" value={rules.mentorship.minMatchScore} onChange={v => set('mentorship', { minMatchScore: v })} />
        <NumberField label="Default maximum mentees per mentor" value={rules.mentorship.maxMenteesPerMentor} onChange={v => set('mentorship', { maxMenteesPerMentor: v })} />
      </Section>

      <Section id="rules-benchmarking" icon={GitCompareArrows} title="Benchmarking" description="Peer group and metric categories used by the Benchmarking dashboard.">
        <TextField label="Primary industry" value={rules.benchmarking.primaryIndustry} onChange={v => set('benchmarking', { primaryIndustry: v })} />
        <TextField label="Region" value={rules.benchmarking.region} onChange={v => set('benchmarking', { region: v })} />
        <div className="space-y-1.5">
          <Label className="text-xs">Company size</Label>
          <Select value={rules.benchmarking.companySize} onValueChange={v => set('benchmarking', { companySize: v as typeof rules.benchmarking.companySize })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (1-50)</SelectItem>
              <SelectItem value="medium">Medium (51-500)</SelectItem>
              <SelectItem value="large">Large (501-5000)</SelectItem>
              <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TextField label="Fiscal year start (month number)" value={rules.benchmarking.fiscalYearStart} onChange={v => set('benchmarking', { fiscalYearStart: v })} />
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs">Metric categories shown</Label>
          <div className="flex flex-wrap gap-2">
            {['performance', 'engagement', 'development', 'retention'].map(cat => {
              const on = rules.benchmarking.enabledCategories.includes(cat);
              return (
                <Button
                  key={cat}
                  variant={on ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => set('benchmarking', {
                    enabledCategories: on
                      ? rules.benchmarking.enabledCategories.filter(c => c !== cat)
                      : [...rules.benchmarking.enabledCategories, cat],
                  })}
                >
                  {cat}
                </Button>
              );
            })}
          </div>
        </div>
        <KeywordField label="Benchmark sources" value={rules.benchmarking.benchmarkSources} onChange={v => set('benchmarking', { benchmarkSources: v })} />
        <ToggleField label="Show confidence intervals" checked={rules.benchmarking.showConfidenceIntervals} onChange={v => set('benchmarking', { showConfidenceIntervals: v })} />
        <ToggleField label="Quarterly benchmark reports" checked={rules.benchmarking.enableQuarterlyReports} onChange={v => set('benchmarking', { enableQuarterlyReports: v })} />
      </Section>

      <Section id="rules-career" icon={Route} title="Career pathing" description="Readiness rules applied when showing a person's progress to the next career level.">
        <NumberField label="Readiness threshold (%)" hint="Above this someone is flagged ready for promotion." value={rules.careerPathing.readinessThresholdPercent} onChange={v => set('careerPathing', { readinessThresholdPercent: v })} />
        <NumberField label="Minimum time in level (months)" value={rules.careerPathing.minTimeInLevelMonths} onChange={v => set('careerPathing', { minTimeInLevelMonths: v })} />
        <ToggleField label="All core skills required" hint="Every core skill must reach the target level before promotion." checked={rules.careerPathing.requireAllCoreSkills} onChange={v => set('careerPathing', { requireAllCoreSkills: v })} />
        <ToggleField label="Show salary ranges on career paths" checked={rules.careerPathing.showSalaryRanges} onChange={v => set('careerPathing', { showSalaryRanges: v })} />
      </Section>

            <Section id="rules-notifications" icon={Bell} title="Notifications" description="Who gets nudged, when, and how escalation works.">
        <div className="space-y-1.5">
          <Label className="text-xs">Weekly digest day</Label>
          <Select value={rules.notifications.digestDay} onValueChange={v => set('notifications', { digestDay: v as PerformanceRules['notifications']['digestDay'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(d => (
                <SelectItem key={d} value={d} className="capitalize">{d[0].toUpperCase() + d.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumberField label="Escalate overdue items after (days)" value={rules.notifications.overdueEscalationDays} onChange={v => set('notifications', { overdueEscalationDays: v })} />
        <ToggleField label="Weekly digest enabled" checked={rules.notifications.digestEnabled} onChange={v => set('notifications', { digestEnabled: v })} />
        <ToggleField label="Notify manager when a goal is overdue" checked={rules.notifications.notifyManagerOnGoalOverdue} onChange={v => set('notifications', { notifyManagerOnGoalOverdue: v })} />
        <ToggleField label="Notify staff on new assignment" checked={rules.notifications.notifyStaffOnNewAssignment} onChange={v => set('notifications', { notifyStaffOnNewAssignment: v })} />
      </Section>
    </div>
  );
}
