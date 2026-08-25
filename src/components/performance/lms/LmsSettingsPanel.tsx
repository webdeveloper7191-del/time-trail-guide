import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CalendarClock,
  BellRing,
  ShieldCheck,
  Smartphone,
  Library,
  Info,
  RotateCcw,
  Save,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LmsSettings,
  loadLmsSettings,
  saveLmsSettings,
  resetLmsSettings,
  summariseLmsSettings,
} from '@/lib/lmsSettingsStore';
import { mockLearningPaths } from '@/data/mockLmsData';

interface SettingRowProps {
  label: string;
  help: string;
  tip?: string;
  children: React.ReactNode;
  last?: boolean;
}

function SettingRow({ label, help, tip, children, last }: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8',
        !last && 'border-b border-border/60',
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {tip && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`More about ${label}`} className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">{tip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{help}</p>
      </div>
      <div className="shrink-0 sm:w-56 sm:text-right">{children}</div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="rounded-md bg-primary/10 p-1.5 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function NumberField({
  value,
  onChange,
  suffix,
  min = 0,
  max = 365,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="h-9 w-20 text-right"
      />
      <span className="text-xs text-muted-foreground">{suffix}</span>
    </div>
  );
}

export function LmsSettingsPanel() {
  const [saved, setSaved] = useState<LmsSettings>(() => loadLmsSettings());
  const [draft, setDraft] = useState<LmsSettings>(saved);

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const summary = useMemo(() => summariseLmsSettings(draft), [draft]);

  const set = <K extends keyof LmsSettings>(key: K, value: LmsSettings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveLmsSettings(draft);
    setSaved(draft);
    toast.success('Learning settings saved');
  };

  const handleReset = () => {
    const defaults = resetLmsSettings();
    setSaved(defaults);
    toast.info('Settings restored to recommended defaults');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Plain-language summary */}
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
          <span className="rounded-md bg-primary/10 p-2 text-primary">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-tight">In plain English, this is how learning runs today</p>
            <ul className="space-y-1">
              {summary.map((line) => (
                <li key={line} className="text-xs text-muted-foreground">• {line}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={CalendarClock}
          title="Assigning learning"
          description="Who gets learning, and when it is due."
        >
          <SettingRow
            label="Default due date"
            help="How long staff have to finish a course once it is assigned."
            tip="You can still set a different due date when assigning an individual course."
          >
            <NumberField value={draft.defaultDueDays} onChange={(v) => set('defaultDueDays', v)} suffix="days" min={1} />
          </SettingRow>

          <SettingRow
            label="Enrol new starters automatically"
            help="New staff are given onboarding learning on their first day."
          >
            <Switch checked={draft.autoAssignOnHire} onCheckedChange={(v) => set('autoAssignOnHire', v)} />
          </SettingRow>

          {draft.autoAssignOnHire && (
            <SettingRow label="Onboarding learning path" help="The path new starters are enrolled into.">
              <Select
                value={draft.autoAssignPathId ?? 'none'}
                onValueChange={(v) => set('autoAssignPathId', v === 'none' ? null : v)}
              >
                <SelectTrigger className="h-9 w-full sm:w-56">
                  <SelectValue placeholder="Choose a path" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set yet</SelectItem>
                  {mockLearningPaths.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          )}

          <SettingRow
            label="Location managers can assign learning"
            help="Managers can assign courses to their own team without asking an admin."
          >
            <Switch checked={draft.allowManagerAssign} onCheckedChange={(v) => set('allowManagerAssign', v)} />
          </SettingRow>

          <SettingRow
            label="Staff can enrol themselves"
            help="Staff can pick optional courses from the catalogue in the employee portal."
            last
          >
            <Switch checked={draft.allowSelfEnrol} onCheckedChange={(v) => set('allowSelfEnrol', v)} />
          </SettingRow>
        </SectionCard>

        <SectionCard
          icon={BellRing}
          title="Reminders & nudges"
          description="Keep learning on track without chasing people manually."
        >
          <SettingRow label="Remind before due date" help="A friendly reminder is sent this many days before the due date.">
            <NumberField value={draft.remindBeforeDueDays} onChange={(v) => set('remindBeforeDueDays', v)} suffix="days" />
          </SettingRow>

          <SettingRow label="Overdue reminders" help="How often to follow up once a course is past its due date.">
            <Select
              value={draft.overdueReminderFrequency}
              onValueChange={(v) => set('overdueReminderFrequency', v as LmsSettings['overdueReminderFrequency'])}
            >
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Don't send reminders</SelectItem>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="every_3_days">Every 3 days</SelectItem>
                <SelectItem value="weekly">Once a week</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Tell the manager when learning is overdue" help="The staff member's manager is copied on overdue notices.">
            <Switch checked={draft.notifyManagerOnOverdue} onCheckedChange={(v) => set('notifyManagerOnOverdue', v)} />
          </SettingRow>

          <SettingRow
            label="Weekly summary email"
            help="Admins receive a Monday summary of completions, overdue items and expiring certificates."
            last
          >
            <Switch checked={draft.weeklyDigest} onCheckedChange={(v) => set('weeklyDigest', v)} />
          </SettingRow>
        </SectionCard>

        <SectionCard
          icon={ShieldCheck}
          title="Passing & compliance"
          description="What counts as complete, and how mandatory training stays current."
        >
          <SettingRow label="Pass mark" help="The minimum quiz score needed to complete a course.">
            <NumberField value={draft.passMark} onChange={(v) => set('passMark', v)} suffix="%" min={1} max={100} />
          </SettingRow>

          <SettingRow label="Attempts allowed" help="How many times a staff member can retry a failed quiz.">
            <NumberField value={draft.maxAttempts} onChange={(v) => set('maxAttempts', v)} suffix="tries" min={1} max={10} />
          </SettingRow>

          <SettingRow
            label="Manager must confirm completion"
            help="For hands-on training, a manager signs off before the course is marked complete."
          >
            <Switch checked={draft.requireManagerSignOff} onCheckedChange={(v) => set('requireManagerSignOff', v)} />
          </SettingRow>

          <SettingRow label="Issue a certificate on completion" help="Staff get a downloadable certificate saved to their profile.">
            <Switch checked={draft.issueCertificates} onCheckedChange={(v) => set('issueCertificates', v)} />
          </SettingRow>

          <SettingRow
            label="Refresher warning"
            help="Warn this far ahead of a mandatory certificate expiring so it can be renewed in time."
          >
            <NumberField value={draft.refresherReminderDays} onChange={(v) => set('refresherReminderDays', v)} suffix="days" />
          </SettingRow>

          <SettingRow
            label="Flag on the roster when training has expired"
            help="Staff with expired mandatory training show a warning when they are scheduled."
            tip="This shows a warning badge on the shift — it does not stop you rostering the person."
            last
          >
            <Switch
              checked={draft.blockShiftsOnExpiredCompliance}
              onCheckedChange={(v) => set('blockShiftsOnExpiredCompliance', v)}
            />
          </SettingRow>
        </SectionCard>

        <SectionCard
          icon={Smartphone}
          title="Staff experience"
          description="How learning appears to your team, and how it is paid."
        >
          <SettingRow
            label="Learning time is paid"
            help="Completed learning time can be added to timesheets as paid hours."
          >
            <Switch checked={draft.countLearningAsPaidTime} onCheckedChange={(v) => set('countLearningAsPaidTime', v)} />
          </SettingRow>

          <SettingRow label="Learning hours per week" help="Suggested cap on paid learning time per staff member each week.">
            <NumberField value={draft.maxLearningHoursPerWeek} onChange={(v) => set('maxLearningHoursPerWeek', v)} suffix="hrs" max={40} />
          </SettingRow>

          <SettingRow label="Show ratings and reviews" help="Staff can rate courses and read feedback from colleagues.">
            <Switch checked={draft.showRatingsAndReviews} onCheckedChange={(v) => set('showRatingsAndReviews', v)} />
          </SettingRow>

          <SettingRow label="Allow learning on mobile" help="Courses can be completed from a phone in the employee portal." last>
            <Switch checked={draft.allowMobileLearning} onCheckedChange={(v) => set('allowMobileLearning', v)} />
          </SettingRow>
        </SectionCard>

        <SectionCard
          icon={Library}
          title="Course library"
          description="Defaults applied to every new course you build."
        >
          <SettingRow label="Review before publishing" help="New courses stay as drafts until an admin approves them.">
            <Switch
              checked={draft.requireApprovalBeforePublish}
              onCheckedChange={(v) => set('requireApprovalBeforePublish', v)}
            />
          </SettingRow>

          <SettingRow
            label="Allow SCORM uploads"
            help="Lets you upload training packages bought from an external provider."
            tip="SCORM is a standard file format used by external training providers. Leave this on if you buy off-the-shelf courses."
          >
            <Switch checked={draft.allowScormUpload} onCheckedChange={(v) => set('allowScormUpload', v)} />
          </SettingRow>

          <SettingRow label="Who can see new courses" help="The default audience applied when a new course is published." last>
            <Select
              value={draft.defaultCourseVisibility}
              onValueChange={(v) => set('defaultCourseVisibility', v as LmsSettings['defaultCourseVisibility'])}
            >
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_staff">Everyone</SelectItem>
                <SelectItem value="by_position">Only chosen positions</SelectItem>
                <SelectItem value="by_location">Only chosen locations</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SectionCard>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="flex flex-col gap-3 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {dirty ? (
              <Badge variant="secondary" className="bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]">
                Unsaved changes
              </Badge>
            ) : (
              <Badge variant="secondary">All changes saved</Badge>
            )}
            <span className="hidden sm:inline">Settings apply to every location unless overridden.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restore defaults
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              <Save className="mr-2 h-4 w-4" /> Save settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
