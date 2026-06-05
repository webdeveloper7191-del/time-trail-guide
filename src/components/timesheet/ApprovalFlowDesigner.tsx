import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ApprovalRule,
  ApprovalTier,
  ApprovalTriggerSet,
  SlaBreachAction,
} from '@/types/compliance';
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  Zap,
  Filter,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationManagerStepConfig {
  enabled: boolean;
  skipWhenAutoApproved: boolean;
  slaHours: number;
  reminderHours: number;
  breachAction: SlaBreachAction;
  requireCommentOnReject: boolean;
  notifyStaffOnRoute: boolean;
}

interface ApproverDirectoryUser {
  id: string;
  name: string;
  tier: ApprovalTier;
}

interface LocationOption { id: string; name: string }
interface LocationGroupOption { id: string; name: string }

interface Props {
  autoApproveClean: boolean;
  onAutoApproveCleanChange: (v: boolean) => void;
  locationManagerStep: LocationManagerStepConfig;
  onLocationManagerChange: (next: LocationManagerStepConfig) => void;
  rules: ApprovalRule[];
  onAddRule: () => void;
  onUpdateRule: (id: string, patch: Partial<ApprovalRule>) => void;
  onRemoveRule: (id: string) => void;
  approverDirectory: ApproverDirectoryUser[];
  locations: LocationOption[];
  locationGroups?: LocationGroupOption[];
  employmentTypes: string[];
  onOpenDelegations: () => void;
  onDirty?: () => void;
}

const tierLabel: Record<ApprovalTier, string> = {
  auto: 'Auto',
  manager: 'Location Manager',
  senior_manager: 'Senior / Area Manager',
  director: 'Director / State Manager',
  hr: 'HR / Payroll',
};

const tierIcon: Record<ApprovalTier, React.ComponentType<{ className?: string }>> = {
  auto: Zap,
  manager: UserCheck,
  senior_manager: Users,
  director: Users,
  hr: FileCheck,
};

function summarizeTriggers(t: ApprovalTriggerSet = {}): string[] {
  const parts: string[] = [];
  if (t.hasOvertime) parts.push('any overtime');
  if (t.overtimeOverHours !== undefined) parts.push(`OT > ${t.overtimeOverHours}h`);
  if (t.dailyHoursOver !== undefined) parts.push(`day > ${t.dailyHoursOver}h`);
  if (t.hasComplianceFlag) parts.push('compliance flag');
  if (t.hasException) parts.push('any exception');
  return parts.length ? parts : ['always (no triggers set)'];
}

export function ApprovalFlowDesigner({
  autoApproveClean,
  onAutoApproveCleanChange,
  locationManagerStep,
  onLocationManagerChange,
  rules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  approverDirectory,
  locations,
  locationGroups = [],
  employmentTypes,
  onOpenDelegations,
  onDirty,
}: Props) {
  const [editingLM, setEditingLM] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const mark = () => onDirty?.();
  const updateLM = (patch: Partial<LocationManagerStepConfig>) => {
    onLocationManagerChange({ ...locationManagerStep, ...patch });
    mark();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-primary" />
              Approval Flow
            </CardTitle>
            <CardDescription>
              The journey every timesheet takes, from submission to payroll. Edit each step inline.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onOpenDelegations} className="gap-2">
            <Users className="h-4 w-4" />
            Approvers &amp; delegations
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Node: Staff submits */}
        <FlowNode
          icon={Send}
          title="Staff submits timesheet"
          subtitle="Triggered when an employee submits hours for a pay period."
          tone="muted"
        />

        <Connector />

        {/* Node: Auto-approve decision */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Auto-approve clean timesheets</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Skip the Location Manager when there are no flags, no overtime, and no exceptions.
                  </p>
                </div>
                <Switch
                  checked={autoApproveClean}
                  onCheckedChange={(c) => { onAutoApproveCleanChange(c); mark(); }}
                />
              </div>
              {autoApproveClean && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  Clean timesheets will go straight to payroll. Flagged ones still route to Step 1.
                </p>
              )}
            </div>
          </div>
        </div>

        <Connector />

        {/* Node: Step 1 Location Manager (locked) */}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.03] overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <StepBadge n={1} />
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">Location Manager</p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Always first</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SLA {locationManagerStep.slaHours}h · remind at {locationManagerStep.slaHours - locationManagerStep.reminderHours}h ·
                    on breach: {breachLabel(locationManagerStep.breachAction)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingLM((v) => !v)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  {editingLM ? 'Done' : 'Edit'}
                </Button>
              </div>

              {editingLM && (
                <div className="mt-4 grid gap-4 md:grid-cols-3 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">SLA (hours)</Label>
                    <Input
                      type="number"
                      value={locationManagerStep.slaHours}
                      onChange={(e) => updateLM({ slaHours: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Remind before breach (hrs)</Label>
                    <Input
                      type="number"
                      value={locationManagerStep.reminderHours}
                      onChange={(e) => updateLM({ reminderHours: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">On SLA breach</Label>
                    <Select
                      value={locationManagerStep.breachAction}
                      onValueChange={(v: SlaBreachAction) => updateLM({ breachAction: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="escalate">Escalate to backup manager</SelectItem>
                        <SelectItem value="auto_approve">Auto-approve</SelectItem>
                        <SelectItem value="auto_reject">Auto-reject</SelectItem>
                        <SelectItem value="hold">Hold for review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={locationManagerStep.requireCommentOnReject}
                        onCheckedChange={(c) => updateLM({ requireCommentOnReject: !!c })}
                      />
                      Require comment on reject
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={locationManagerStep.notifyStaffOnRoute}
                        onCheckedChange={(c) => updateLM({ notifyStaffOnRoute: !!c })}
                      />
                      Notify staff when routed
                    </label>
                  </div>
                  <p className="md:col-span-3 text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    The primary Location Manager comes from each location's <strong>&nbsp;Manager&nbsp;</strong> field.
                    On breach, the system uses the Backup Manager.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Escalation steps */}
        {rules.map((rule, idx) => {
          const expanded = expandedRuleId === rule.id;
          return (
            <div key={rule.id}>
              <Connector label="if conditions match" />
              <EscalationCard
                rule={rule}
                index={idx + 2}
                expanded={expanded}
                onToggle={() => setExpandedRuleId(expanded ? null : rule.id)}
                onUpdate={(patch) => { onUpdateRule(rule.id, patch); mark(); }}
                onRemove={() => { onRemoveRule(rule.id); mark(); }}
                approverDirectory={approverDirectory}
                locations={locations}
                locationGroups={locationGroups}
                employmentTypes={employmentTypes}
              />
            </div>
          );
        })}

        <div className="pl-12">
          <Button variant="outline" size="sm" onClick={() => { onAddRule(); mark(); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add escalation step
          </Button>
        </div>

        <Connector />

        <FlowNode
          icon={Wallet}
          title="Export to payroll"
          subtitle="Approved timesheets are queued for the next pay run."
          tone="success"
        />
      </CardContent>
    </Card>
  );
}

/* ─────────────── Sub-components ─────────────── */

function StepBadge({ n }: { n: number }) {
  return (
    <Badge variant="outline" className="font-mono shrink-0 h-7 w-7 p-0 flex items-center justify-center">
      {n}
    </Badge>
  );
}

function Connector({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 pl-[26px]">
      <div className="w-px h-6 bg-border" />
      {label && <span className="text-[11px] text-muted-foreground italic">{label}</span>}
    </div>
  );
}

function FlowNode({
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: 'muted' | 'success';
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
      <div
        className={cn(
          'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
          tone === 'success' ? 'bg-status-approved/15 text-status-approved' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function breachLabel(a: SlaBreachAction): string {
  switch (a) {
    case 'escalate': return 'escalate';
    case 'auto_approve': return 'auto-approve';
    case 'auto_reject': return 'auto-reject';
    case 'hold': return 'hold';
  }
}

/* ─────────────── Escalation step card ─────────────── */

function EscalationCard({
  rule, index, expanded, onToggle, onUpdate, onRemove,
  approverDirectory, locations, employmentTypes,
}: {
  rule: ApprovalRule;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ApprovalRule>) => void;
  onRemove: () => void;
  approverDirectory: ApproverDirectoryUser[];
  locations: LocationOption[];
  employmentTypes: string[];
}) {
  const Icon = tierIcon[rule.requiredTier] ?? Users;
  const t = rule.triggers ?? {};
  const setTrigger = (patch: Partial<ApprovalTriggerSet>) =>
    onUpdate({ triggers: { ...t, ...patch } });

  const triggerSummary = summarizeTriggers(t);
  const scopeChips: string[] = [];
  if (rule.locationIds?.length) scopeChips.push(`${rule.locationIds.length} location${rule.locationIds.length > 1 ? 's' : ''}`);
  else scopeChips.push('All locations');
  if (rule.employmentTypes?.length) scopeChips.push(rule.employmentTypes.join(' · '));

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Summary row (always visible) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <StepBadge n={index} />
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {/* Line 1: trigger conditions */}
          <p className="text-sm font-medium truncate">
            <span className="text-muted-foreground font-normal">When </span>
            {triggerSummary.join(' or ')}
          </p>
          {/* Line 2: approver + SLA + scope */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">{tierLabel[rule.requiredTier]}</Badge>
            <span>· SLA {rule.slaHours ?? 24}h</span>
            <span>· on breach: {breachLabel(rule.slaBreachAction ?? 'escalate')}</span>
            {scopeChips.map((c) => (
              <Badge key={c} variant="outline" className="font-normal gap-1">
                <Filter className="h-2.5 w-2.5" />{c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(); } }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-5">
          {/* Step name */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Step name</Label>
            <Input
              value={rule.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="max-w-sm"
            />
          </div>

          {/* WHEN: triggers */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">When</Label>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border bg-card">
                <Checkbox checked={!!t.hasOvertime} onCheckedChange={(c) => setTrigger({ hasOvertime: !!c })} />
                Timesheet has any overtime
              </label>
              <label className="flex items-center gap-2 text-sm p-2 rounded border bg-card">
                <Checkbox
                  checked={t.overtimeOverHours !== undefined}
                  onCheckedChange={(c) => setTrigger({ overtimeOverHours: c ? (t.overtimeOverHours ?? 4) : undefined })}
                />
                Overtime over
                <Input
                  type="number" className="w-16 h-7"
                  disabled={t.overtimeOverHours === undefined}
                  value={t.overtimeOverHours ?? 4}
                  onChange={(e) => setTrigger({ overtimeOverHours: Number(e.target.value) })}
                />
                hrs
              </label>
              <label className="flex items-center gap-2 text-sm p-2 rounded border bg-card">
                <Checkbox
                  checked={t.dailyHoursOver !== undefined}
                  onCheckedChange={(c) => setTrigger({ dailyHoursOver: c ? (t.dailyHoursOver ?? 12) : undefined })}
                />
                Any day over
                <Input
                  type="number" className="w-16 h-7"
                  disabled={t.dailyHoursOver === undefined}
                  value={t.dailyHoursOver ?? 12}
                  onChange={(e) => setTrigger({ dailyHoursOver: Number(e.target.value) })}
                />
                hrs
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border bg-card">
                <Checkbox checked={!!t.hasComplianceFlag} onCheckedChange={(c) => setTrigger({ hasComplianceFlag: !!c })} />
                Any compliance flag
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border bg-card">
                <Checkbox checked={!!t.hasException} onCheckedChange={(c) => setTrigger({ hasException: !!c })} />
                Manual exception raised
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This step runs if <strong>any</strong> selected condition matches.
            </p>
          </div>

          {/* WHO + SLA */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Who &amp; SLA</Label>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Approver role</Label>
                <Select
                  value={rule.requiredTier}
                  onValueChange={(v: ApprovalTier) => onUpdate({ requiredTier: v, assignedApproverId: undefined })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senior_manager">Senior / Area Manager</SelectItem>
                    <SelectItem value="director">Director / State Manager</SelectItem>
                    <SelectItem value="hr">HR / Payroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Specific person</Label>
                <Select
                  value={rule.assignedApproverId || 'any'}
                  onValueChange={(v) => onUpdate({ assignedApproverId: v === 'any' ? undefined : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any in role</SelectItem>
                    {approverDirectory.filter((u) => u.tier === rule.requiredTier).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">SLA (hours)</Label>
                <Input
                  type="number"
                  value={rule.slaHours ?? 24}
                  onChange={(e) => onUpdate({ slaHours: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">On SLA breach</Label>
                <Select
                  value={rule.slaBreachAction || 'escalate'}
                  onValueChange={(v: SlaBreachAction) => onUpdate({ slaBreachAction: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escalate">Escalate to next role</SelectItem>
                    <SelectItem value="auto_approve">Auto-approve</SelectItem>
                    <SelectItem value="auto_reject">Auto-reject</SelectItem>
                    <SelectItem value="hold">Hold for review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={!!rule.parallelApproval}
                  onCheckedChange={(c) => onUpdate({ parallelApproval: !!c })}
                />
                Parallel approval (all approvers must approve)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={rule.requireCommentOnReject ?? true}
                  onCheckedChange={(c) => onUpdate({ requireCommentOnReject: !!c })}
                />
                Require comment on reject
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={!!rule.notifyStaffOnRoute}
                  onCheckedChange={(c) => onUpdate({ notifyStaffOnRoute: !!c })}
                />
                Notify staff when routed
              </label>
            </div>
          </div>

          {/* Applies to (scope) */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Applies to</Label>
            <div className="flex flex-wrap items-center gap-2">
              <ScopePopover
                label={rule.locationIds?.length ? `${rule.locationIds.length} location${rule.locationIds.length > 1 ? 's' : ''}` : 'All locations'}
                options={locations.map((l) => ({ id: l.id, label: l.name }))}
                selected={rule.locationIds ?? []}
                onChange={(ids) => onUpdate({ locationIds: ids.length ? ids : undefined })}
                emptyLabel="All locations"
              />
              <ScopePopover
                label={rule.employmentTypes?.length ? rule.employmentTypes.join(' · ') : 'All employment types'}
                options={employmentTypes.map((et) => ({ id: et, label: et }))}
                selected={rule.employmentTypes ?? []}
                onChange={(ids) => onUpdate({ employmentTypes: ids.length ? ids : undefined })}
                emptyLabel="All employment types"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScopePopover({
  label, options, selected, onChange, emptyLabel,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyLabel: string;
}) {
  const toggle = (id: string) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange(Array.from(set));
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Filter className="h-3 w-3" />
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium">{emptyLabel.replace('All ', 'Select ')}</span>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onChange([])}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1.5 rounded hover:bg-muted">
              <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
              {o.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
