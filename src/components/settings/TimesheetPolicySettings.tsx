import { useMemo, useState, useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe2, RotateCcw, Info } from 'lucide-react';
import { mockLocations } from '@/data/mockLocationData';
import {
  TimesheetPolicy,
  roundingOptions,
  approvalCadenceOptions,
  linkUnscheduledOptions,
  timeDriftOptions,
  paidMealOptions,
  varianceFlagOptions,
} from '@/types/timesheetPolicy';
import { timesheetPolicyStore, getPolicyVersion } from '@/lib/timesheetPolicyStore';

type SectionKey = keyof TimesheetPolicy;

const TENANT_SCOPE = '__tenant__';

// ---------- Shared scope state (module-level) ----------
let currentScope: string = TENANT_SCOPE;
const scopeListeners = new Set<() => void>();
function setScope(next: string) {
  if (currentScope === next) return;
  currentScope = next;
  scopeListeners.forEach(fn => fn());
}
function useScope(): string {
  return useSyncExternalStore(
    fn => { scopeListeners.add(fn); return () => { scopeListeners.delete(fn); }; },
    () => currentScope,
  );
}

// ---------- Hook that subscribes to both store + scope ----------
function usePolicyAndScope() {
  useSyncExternalStore(timesheetPolicyStore.subscribe, getPolicyVersion);
  const scope = useScope();
  const isTenant = scope === TENANT_SCOPE;
  const tenant = timesheetPolicyStore.getTenantPolicy();
  const resolved = useMemo(
    () => (isTenant ? tenant : timesheetPolicyStore.getResolvedPolicy(scope)),
    [isTenant, scope, tenant],
  );

  function setField<S extends SectionKey, F extends keyof TimesheetPolicy[S]>(
    section: S, field: F, value: TimesheetPolicy[S][F],
  ) {
    if (isTenant) timesheetPolicyStore.setTenantField(section, field, value);
    else timesheetPolicyStore.setLocationOverride(scope, section, field, value);
  }

  function clearOverride<S extends SectionKey, F extends keyof TimesheetPolicy[S]>(
    section: S, field: F,
  ) {
    if (!isTenant) timesheetPolicyStore.clearLocationField(scope, section, field);
  }

  function isOverridden<S extends SectionKey, F extends keyof TimesheetPolicy[S]>(
    section: S, field: F,
  ): boolean {
    if (isTenant) return false;
    return timesheetPolicyStore.isOverridden(scope, section, field);
  }

  const fieldProps = <S extends SectionKey, F extends keyof TimesheetPolicy[S]>(
    section: S, field: F, label: string, description?: string,
  ) => ({
    overridden: isOverridden(section, field),
    onReset: () => clearOverride(section, field),
    label, description, isTenant,
  });

  return { scope, isTenant, resolved, setField, fieldProps };
}

// ---------- Scope bar (exported) ----------
export function TimesheetPolicyScopeBar() {
  const scope = useScope();
  const isTenant = scope === TENANT_SCOPE;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {isTenant ? <Globe2 className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
            <div>
              <p className="text-sm font-medium tracking-tight">
                {isTenant ? 'Editing tenant defaults' : 'Editing location override'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isTenant
                  ? 'These settings apply to every location unless explicitly overridden.'
                  : 'Only changed fields override the tenant default. Reset a field to fall back to tenant.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TENANT_SCOPE}>Tenant defaults (global)</SelectItem>
                {mockLocations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isTenant && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => timesheetPolicyStore.resetLocation(scope)}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset all
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Tab content (one per section, exported) ----------
export function PolicyTimeTracking() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Time Tracking Settings</CardTitle>
        <CardDescription>How staff can clock in and out.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <ToggleRow
          {...fieldProps('timeTracking', 'enableWebClock', 'Enable Web Clock-in/out',
            'Allow staff to clock in and out via the web app.')}
          value={resolved.timeTracking.enableWebClock}
          onChange={v => setField('timeTracking', 'enableWebClock', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'enableMobileClock', 'Enable Mobile App Clock-in/out',
            'Allow staff to clock in and out via the mobile app.')}
          value={resolved.timeTracking.enableMobileClock}
          onChange={v => setField('timeTracking', 'enableMobileClock', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'captureGpsOnMobile', 'Capture GPS on Mobile Clock-in/out',
            'Record GPS coordinates when staff clock in or out via mobile. Distance from scheduled location will appear in timesheets.')}
          value={resolved.timeTracking.captureGpsOnMobile}
          onChange={v => setField('timeTracking', 'captureGpsOnMobile', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'restrictToGeofence', 'Restrict Clock-ins to Geo-fence',
            'Prevent clock-ins from outside a defined distance using GPS location.')}
          value={resolved.timeTracking.restrictToGeofence}
          onChange={v => setField('timeTracking', 'restrictToGeofence', v)}
        />
        {resolved.timeTracking.restrictToGeofence && (
          <NumberRow
            {...fieldProps('timeTracking', 'geofenceRadiusMeters', 'Geo-fence radius (meters)',
              'Maximum distance from scheduled location at which clock-in is allowed.')}
            value={resolved.timeTracking.geofenceRadiusMeters}
            onChange={v => setField('timeTracking', 'geofenceRadiusMeters', v)}
          />
        )}
        <ToggleRow
          {...fieldProps('timeTracking', 'enableSmsClock', 'Enable SMS Clock-in/out',
            'Staff can clock in/out by replying to SMS with commands like "start shift", "end shift", or "break shift".')}
          value={resolved.timeTracking.enableSmsClock}
          onChange={v => setField('timeTracking', 'enableSmsClock', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'requireKioskPhoto', 'Require Kiosk Photo Verification',
            'Team members must take a photo at the kiosk when starting or ending a shift.')}
          value={resolved.timeTracking.requireKioskPhoto}
          onChange={v => setField('timeTracking', 'requireKioskPhoto', v)}
        />
        <NumberRow
          {...fieldProps('timeTracking', 'minTimesheetMinutes', 'Minimum timesheet length (minutes)',
            'Timesheets shorter than the specified duration will not be recorded.')}
          value={resolved.timeTracking.minTimesheetMinutes}
          onChange={v => setField('timeTracking', 'minTimesheetMinutes', v)}
        />
      </CardContent>
    </Card>
  );
}

export function PolicyPermissions() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Team Member Permissions</CardTitle>
        <CardDescription>What staff are allowed to do with their own timesheets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <ToggleRow
          {...fieldProps('permissions', 'createAndEditTimesheets', 'Create and Edit Timesheets',
            'Allow team members to create and edit their timesheets via the web or mobile app.')}
          value={resolved.permissions.createAndEditTimesheets}
          onChange={v => setField('permissions', 'createAndEditTimesheets', v)}
        />
        <ToggleRow
          {...fieldProps('permissions', 'updateTimesheetsDuringShift', 'Update Timesheets During Shifts',
            'Allow team members to make timesheet updates while they are active on shift.')}
          value={resolved.permissions.updateTimesheetsDuringShift}
          onChange={v => setField('permissions', 'updateTimesheetsDuringShift', v)}
        />
        <ToggleRow
          {...fieldProps('permissions', 'clockInAnytimeBeforeShift', 'Clock in anytime before the shift',
            'Permit early clock-ins before the scheduled shift start time.')}
          value={resolved.permissions.clockInAnytimeBeforeShift}
          onChange={v => setField('permissions', 'clockInAnytimeBeforeShift', v)}
        />
        <NumberRow
          {...fieldProps('permissions', 'earlyClockInMinutes', 'How early team members can start shifts (minutes)',
            'Set how many minutes early a team member is allowed to clock in before their scheduled shift.')}
          value={resolved.permissions.earlyClockInMinutes}
          onChange={v => setField('permissions', 'earlyClockInMinutes', v)}
        />
        <ToggleRow
          {...fieldProps('permissions', 'wrapUpBreaksSooner', 'Wrap up breaks sooner',
            'Allow team members to end their breaks early and resume work before the scheduled time.')}
          value={resolved.permissions.wrapUpBreaksSooner}
          onChange={v => setField('permissions', 'wrapUpBreaksSooner', v)}
        />
      </CardContent>
    </Card>
  );
}

export function PolicyApproving() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Timesheet Approving</CardTitle>
        <CardDescription>Automatic approval and rounding behaviour.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <SelectRow
          {...fieldProps('approving', 'autoApproval', 'Automatic Timesheet Approval',
            'Automatically approve timesheets if they align with the scheduled shift or fall within the defined grace period.')}
          value={resolved.approving.autoApproval}
          options={approvalCadenceOptions}
          onChange={v => setField('approving', 'autoApproval', v as TimesheetPolicy['approving']['autoApproval'])}
        />
        <ToggleRow
          {...fieldProps('approving', 'roundingEnabled', 'Timesheet Rounding (Auto)',
            'Enable automatic rounding of start times, end times, and breaks based on the preferences below.')}
          value={resolved.approving.roundingEnabled}
          onChange={v => setField('approving', 'roundingEnabled', v)}
        />
        <ToggleRow
          {...fieldProps('approving', 'adjustStartToScheduledIfEarlier', 'Adjust to scheduled start time if earlier',
            'Early clock-ins will be rounded to the scheduled start time. Later clock-ins will follow the rounding rule below.')}
          value={resolved.approving.adjustStartToScheduledIfEarlier}
          onChange={v => setField('approving', 'adjustStartToScheduledIfEarlier', v)}
        />
        <SelectRow
          {...fieldProps('approving', 'startTimeAdjustment', 'Start Time Adjustment',
            'Set how early or late start times are rounded. Later rounding may reduce payable hours.')}
          value={resolved.approving.startTimeAdjustment}
          options={roundingOptions}
          onChange={v => setField('approving', 'startTimeAdjustment', v as TimesheetPolicy['approving']['startTimeAdjustment'])}
        />
        <ToggleRow
          {...fieldProps('approving', 'adjustEndToScheduledIfDelayed', 'Adjust to scheduled end time if delayed',
            'Round late clock-outs to the scheduled end time. Early clock-outs will follow the end time rounding rule below.')}
          value={resolved.approving.adjustEndToScheduledIfDelayed}
          onChange={v => setField('approving', 'adjustEndToScheduledIfDelayed', v)}
        />
        <SelectRow
          {...fieldProps('approving', 'endTimeAdjustment', 'End Time Adjustment',
            'Set how early or late end times are rounded. Earlier rounding may reduce total hours paid.')}
          value={resolved.approving.endTimeAdjustment}
          options={roundingOptions}
          onChange={v => setField('approving', 'endTimeAdjustment', v as TimesheetPolicy['approving']['endTimeAdjustment'])}
        />
        <ToggleRow
          {...fieldProps('approving', 'roundShortBreakUpToScheduled', "Round break duration if it's shorter than scheduled",
            'Automatically round short breaks up to the scheduled duration. Longer breaks will follow the rule set below.')}
          value={resolved.approving.roundShortBreakUpToScheduled}
          onChange={v => setField('approving', 'roundShortBreakUpToScheduled', v)}
        />
        <SelectRow
          {...fieldProps('approving', 'breakRoundingAdjustment', 'Break Time Rounding Adjustment',
            'Define how short or long breaks are rounded. Later rounding may reduce payable time.')}
          value={resolved.approving.breakRoundingAdjustment}
          options={roundingOptions}
          onChange={v => setField('approving', 'breakRoundingAdjustment', v as TimesheetPolicy['approving']['breakRoundingAdjustment'])}
        />
      </CardContent>
    </Card>
  );
}

export function PolicyUnscheduled() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Unscheduled Shifts</CardTitle>
        <CardDescription>How timesheets without a scheduled shift are handled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <SelectRow
          {...fieldProps('unscheduled', 'linkUnscheduledToScheduled', 'Link Unscheduled Timesheets to Scheduled Shifts',
            "Automatically associate unscheduled timesheets with a scheduled shift if they match the same location or area. 'Best Fit' links timesheets starting up to 8 hours before or after the scheduled shift.")}
          value={resolved.unscheduled.linkUnscheduledToScheduled}
          options={linkUnscheduledOptions}
          onChange={v => setField('unscheduled', 'linkUnscheduledToScheduled', v as TimesheetPolicy['unscheduled']['linkUnscheduledToScheduled'])}
        />
        <SelectRow
          {...fieldProps('unscheduled', 'allowTimeDriftMatching', 'Allow Time Drift Matching',
            'Set the acceptable time range (drift) for linking unscheduled timesheets to scheduled shifts based on start/end time differences.')}
          value={resolved.unscheduled.allowTimeDriftMatching}
          options={timeDriftOptions}
          onChange={v => setField('unscheduled', 'allowTimeDriftMatching', v as TimesheetPolicy['unscheduled']['allowTimeDriftMatching'])}
        />
        <ToggleRow
          {...fieldProps('unscheduled', 'requireTrainingForUnscheduled', 'Require Training for Unscheduled Clock-ins',
            "All team members must complete required training before clocking into unscheduled shifts in areas with training requirements — even if they're marked as preferred.")}
          value={resolved.unscheduled.requireTrainingForUnscheduled}
          onChange={v => setField('unscheduled', 'requireTrainingForUnscheduled', v)}
        />
      </CardContent>
    </Card>
  );
}

export function PolicyBreaks() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Breaks (Policy)</CardTitle>
        <CardDescription>Break handling and paid-meal policy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <div className="mb-3 flex gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Precedence: Award rules win over these policies.</p>
            <p>
              When an applicable Award (or Enterprise Agreement) defines mandatory break
              duration, timing, or paid/unpaid status, those rules override the tenant/location
              settings below. These policies act as the <span className="font-medium">fallback</span> when
              no award rule applies, and control the <span className="font-medium">UX behaviour</span>
              {' '}(auto-include on clock-out, flagging, rounding) that awards don't specify.
            </p>
            <p>
              Order of precedence: <span className="font-medium">Award/EA → Location override → Tenant default</span>.
            </p>
          </div>
        </div>

        <ToggleRow
          {...fieldProps('breaks', 'autoIncludeScheduledOnClockOut', 'Auto-Include Scheduled Breaks on Clock-Out',
            "Automatically add any unrecorded scheduled breaks to the timesheet at clock-out. Note: If team members don't have edit permissions, they won't be able to remove these breaks afterwards.")}
          value={resolved.breaks.autoIncludeScheduledOnClockOut}
          onChange={v => setField('breaks', 'autoIncludeScheduledOnClockOut', v)}
        />
        <ToggleRow
          {...fieldProps('breaks', 'flagShortOrMissedBreaks', 'Flag Short or Missed Breaks in Timesheets',
            'Show a warning when a scheduled break is shorter than expected or completely missed.')}
          value={resolved.breaks.flagShortOrMissedBreaks}
          onChange={v => setField('breaks', 'flagShortOrMissedBreaks', v)}
        />
        <SelectRow
          {...fieldProps('breaks', 'paidMealBreaks', 'Paid Meal Breaks',
            "Specify if meal breaks are paid. In most cases, it's recommended to use 'Rest breaks' for paid time.")}
          value={resolved.breaks.paidMealBreaks}
          options={paidMealOptions}
          onChange={v => setField('breaks', 'paidMealBreaks', v as TimesheetPolicy['breaks']['paidMealBreaks'])}
        />
        {resolved.breaks.paidMealBreaks === 'over_threshold' && (
          <NumberRow
            {...fieldProps('breaks', 'paidMealOverMinutesThreshold', 'Paid if shift exceeds (minutes)',
              'Meal breaks become paid when the shift exceeds this duration.')}
            value={resolved.breaks.paidMealOverMinutesThreshold}
            onChange={v => setField('breaks', 'paidMealOverMinutesThreshold', v)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function PolicyIssues() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Timesheet Issues</CardTitle>
        <CardDescription>When to alert managers about timesheet anomalies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <SelectRow
          {...fieldProps('issues', 'flagShiftTimeVariance', 'Flag Shift Time Variance',
            'Alert managers if the recorded shift start or end time differs from the scheduled time.')}
          value={resolved.issues.flagShiftTimeVariance}
          options={varianceFlagOptions}
          onChange={v => setField('issues', 'flagShiftTimeVariance', v as TimesheetPolicy['issues']['flagShiftTimeVariance'])}
        />
        <SelectRow
          {...fieldProps('issues', 'flagBreakDurationVariance', 'Flag Break Duration Variance',
            'Alert managers when the actual break taken differs from the scheduled break duration.')}
          value={resolved.issues.flagBreakDurationVariance}
          options={varianceFlagOptions}
          onChange={v => setField('issues', 'flagBreakDurationVariance', v as TimesheetPolicy['issues']['flagBreakDurationVariance'])}
        />
      </CardContent>
    </Card>
  );
}

// ---------- Row primitives ----------

interface BaseRowProps {
  label: string;
  description?: string;
  isTenant: boolean;
  overridden: boolean;
  onReset: () => void;
}

function RowShell({ label, description, isTenant, overridden, onReset, control }: BaseRowProps & { control: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium tracking-tight">{label}</Label>
          {!isTenant && (
            overridden ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] h-5">
                Overridden
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground gap-1">
                <Info className="h-3 w-3" /> Inherited
              </Badge>
            )
          )}
          {!isTenant && overridden && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Reset to tenant
            </button>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function ToggleRow(props: BaseRowProps & { value: boolean; onChange: (v: boolean) => void }) {
  const { value, onChange, ...rest } = props;
  return <RowShell {...rest} control={<Switch checked={value} onCheckedChange={onChange} />} />;
}

function NumberRow(props: BaseRowProps & { value: number; onChange: (v: number) => void }) {
  const { value, onChange, ...rest } = props;
  return (
    <RowShell
      {...rest}
      control={
        <Input
          type="number"
          className="w-28"
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
        />
      }
    />
  );
}

function SelectRow<T extends string>(props: BaseRowProps & {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const { value, options, onChange, ...rest } = props;
  return (
    <RowShell
      {...rest}
      control={
        <Select value={value} onValueChange={v => onChange(v as T)}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      }
    />
  );
}

// ---------- Backward-compat default export (unused now, kept for safety) ----------
export function TimesheetPolicySettings() {
  const [tab, setTab] = useState<string>('time-tracking');
  return (
    <div className="space-y-6">
      <TimesheetPolicyScopeBar />
      <div className="space-y-4">
        {tab === 'time-tracking' && <PolicyTimeTracking />}
        {tab === 'permissions' && <PolicyPermissions />}
        {tab === 'approving' && <PolicyApproving />}
        {tab === 'unscheduled' && <PolicyUnscheduled />}
        {tab === 'policy-breaks' && <PolicyBreaks />}
        {tab === 'issues' && <PolicyIssues />}
        <div className="flex gap-2 text-xs">
          {['time-tracking','permissions','approving','unscheduled','policy-breaks','issues'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="underline">{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
