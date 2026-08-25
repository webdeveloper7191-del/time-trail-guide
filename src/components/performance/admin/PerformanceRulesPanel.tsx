import React, { useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Target, ClipboardCheck, Users, LifeBuoy, HeartPulse, BarChart3, GraduationCap, Bell } from 'lucide-react';
import { performanceTaxonomyStore, PerformanceRules, distributionTotal } from '@/lib/performanceTaxonomyStore';

function useRules(): PerformanceRules {
  return useSyncExternalStore(
    cb => performanceTaxonomyStore.subscribe(cb),
    () => performanceTaxonomyStore.get().rules,
    () => performanceTaxonomyStore.get().rules,
  );
}

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 space-y-4">
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
      <Section icon={Target} title="Goals" description="Defaults and guardrails applied when goals are created or assigned.">
        <NumberField label="Default goal duration (days)" value={rules.goals.defaultDurationDays} onChange={v => set('goals', { defaultDurationDays: v })} />
        <NumberField label="Progress update cadence (days)" hint="Staff are nudged to update progress on this rhythm." value={rules.goals.progressUpdateCadenceDays} onChange={v => set('goals', { progressUpdateCadenceDays: v })} />
        <NumberField label="Minimum goals per person" value={rules.goals.minGoalsPerStaff} onChange={v => set('goals', { minGoalsPerStaff: v })} />
        <NumberField label="Maximum goals per person" value={rules.goals.maxGoalsPerStaff} onChange={v => set('goals', { maxGoalsPerStaff: v })} />
        <ToggleField label="Manager approval required" hint="New goals stay in draft until a manager approves." checked={rules.goals.requireManagerApproval} onChange={v => set('goals', { requireManagerApproval: v })} />
        <ToggleField label="Staff can create their own goals" checked={rules.goals.allowSelfCreatedGoals} onChange={v => set('goals', { allowSelfCreatedGoals: v })} />
        <ToggleField label="Milestones required" hint="Every goal must have at least one milestone." checked={rules.goals.requireMilestones} onChange={v => set('goals', { requireMilestones: v })} />
      </Section>

      <Section icon={ClipboardCheck} title="Reviews & calibration" description="How review cycles run and what the calibration curve should look like.">
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

      <Section icon={Users} title="360° feedback" description="Responder limits, anonymity and release rules.">
        <NumberField label="Minimum responders" value={rules.feedback360.minResponders} onChange={v => set('feedback360', { minResponders: v })} />
        <NumberField label="Maximum responders" value={rules.feedback360.maxResponders} onChange={v => set('feedback360', { maxResponders: v })} />
        <NumberField label="Default due window (days)" value={rules.feedback360.defaultDueDays} onChange={v => set('feedback360', { defaultDueDays: v })} />
        <NumberField label="Release threshold" hint="Results stay hidden until this many responses arrive." value={rules.feedback360.releaseThreshold} onChange={v => set('feedback360', { releaseThreshold: v })} />
        <ToggleField label="Anonymous by default" checked={rules.feedback360.anonymousByDefault} onChange={v => set('feedback360', { anonymousByDefault: v })} />
        <ToggleField label="Manager approves the responder list" checked={rules.feedback360.managerApprovesResponders} onChange={v => set('feedback360', { managerApprovesResponders: v })} />
      </Section>

      <Section icon={LifeBuoy} title="Performance improvement plans" description="Duration, check-in rhythm and approval path for PIPs.">
        <NumberField label="Default duration (days)" value={rules.pip.defaultDurationDays} onChange={v => set('pip', { defaultDurationDays: v })} />
        <NumberField label="Check-in cadence (days)" value={rules.pip.checkInCadenceDays} onChange={v => set('pip', { checkInCadenceDays: v })} />
        <NumberField label="Maximum extension (days)" value={rules.pip.maxExtensionDays} onChange={v => set('pip', { maxExtensionDays: v })} />
        <ToggleField label="HR approval required" checked={rules.pip.requireHrApproval} onChange={v => set('pip', { requireHrApproval: v })} />
        <ToggleField label="Extensions allowed" checked={rules.pip.allowExtension} onChange={v => set('pip', { allowExtension: v })} />
      </Section>

      <Section icon={HeartPulse} title="Wellbeing & burnout" description="Thresholds that trigger a wellbeing risk flag.">
        <NumberField label="Overtime hours per fortnight" value={rules.wellbeing.overtimeHoursThreshold} onChange={v => set('wellbeing', { overtimeHoursThreshold: v })} />
        <NumberField label="Consecutive days worked" value={rules.wellbeing.consecutiveDaysThreshold} onChange={v => set('wellbeing', { consecutiveDaysThreshold: v })} />
        <NumberField label="Days since last leave" value={rules.wellbeing.daysSinceLeaveThreshold} onChange={v => set('wellbeing', { daysSinceLeaveThreshold: v })} />
        <NumberField label="Check-in cadence (days)" value={rules.wellbeing.checkInCadenceDays} onChange={v => set('wellbeing', { checkInCadenceDays: v })} />
        <ToggleField label="Notify manager on high risk" checked={rules.wellbeing.notifyManagerOnHighRisk} onChange={v => set('wellbeing', { notifyManagerOnHighRisk: v })} />
      </Section>

      <Section icon={BarChart3} title="Surveys & eNPS" description="Cadence, anonymity protection and the eNPS question wording.">
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

      <Section icon={Users} title="Talent & succession" description="Score thresholds that place someone in the talent grid, and bench targets.">
        <NumberField label="High performance from (rating)" value={rules.talent.highPerformanceThreshold} onChange={v => set('talent', { highPerformanceThreshold: v })} />
        <NumberField label="Medium performance from (rating)" value={rules.talent.mediumPerformanceThreshold} onChange={v => set('talent', { mediumPerformanceThreshold: v })} />
        <NumberField label="High potential from (rating)" value={rules.talent.highPotentialThreshold} onChange={v => set('talent', { highPotentialThreshold: v })} />
        <NumberField label="Medium potential from (rating)" value={rules.talent.mediumPotentialThreshold} onChange={v => set('talent', { mediumPotentialThreshold: v })} />
        <NumberField label="Successors per critical role" value={rules.talent.successionCoverageTarget} onChange={v => set('talent', { successionCoverageTarget: v })} />
      </Section>

      <Section icon={GraduationCap} title="Learning" description="Defaults applied to courses, certificates and mandatory training.">
        <NumberField label="Default pass mark (%)" value={rules.learning.defaultPassMark} onChange={v => set('learning', { defaultPassMark: v })} />
        <NumberField label="Certificate validity (months)" value={rules.learning.certificateExpiryMonths} onChange={v => set('learning', { certificateExpiryMonths: v })} />
        <NumberField label="Mandatory completion window (days)" value={rules.learning.mandatoryCompletionDays} onChange={v => set('learning', { mandatoryCompletionDays: v })} />
        <ToggleField label="Staff can self-enrol" checked={rules.learning.allowSelfEnrolment} onChange={v => set('learning', { allowSelfEnrolment: v })} />
      </Section>

      <Section icon={Bell} title="Notifications" description="Who gets nudged, when, and how escalation works.">
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
