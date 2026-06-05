import { useMemo, useState, useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Building2, Globe2, RotateCcw, Info, HelpCircle } from 'lucide-react';
import { mockLocations } from '@/data/mockLocationData';
import {
  TimesheetPolicy,
  roundingOptions,
  approvalCadenceOptions,
  linkUnscheduledOptions,
  timeDriftOptions,
  paidMealOptions,
  varianceFlagOptions,
  earlyClockInOptions,
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
    section: S, field: F, label: string, description?: string, example?: React.ReactNode,
  ) => ({
    overridden: isOverridden(section, field),
    onReset: () => clearOverride(section, field),
    label, description, example, isTenant,
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
            'Allow staff to clock in and out via the web app.',
            <><p className="font-medium mb-1">Example</p><p>A reception staff member on a desktop opens the web portal and taps "Clock in" at 8:58 AM. With this OFF, the button is hidden and they must use the mobile app or kiosk.</p></>)}
          value={resolved.timeTracking.enableWebClock}
          onChange={v => setField('timeTracking', 'enableWebClock', v)}
          comingSoon
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'enableMobileClock', 'Enable Mobile App Clock-in/out',
            'Allow staff to clock in and out via the staff mobile app.',
            <><p className="font-medium mb-1">Example</p><p>A field worker arrives on-site and clocks in from the mobile app. Useful for staff who don't have access to a fixed kiosk or computer.</p></>)}
          value={resolved.timeTracking.enableMobileClock}
          onChange={v => setField('timeTracking', 'enableMobileClock', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'captureGpsOnMobile', 'Capture GPS on Mobile Clock-in/out',
            'Record GPS coordinates when staff clock in or out via mobile. Distance from scheduled location will appear in timesheets.',
            <><p className="font-medium mb-1">Example</p><p>Liam clocks in via mobile from 1.2 km away from his assigned location. The timesheet shows "Clocked in 1.2 km from site" so the manager can investigate without blocking the clock-in.</p></>)}
          value={resolved.timeTracking.captureGpsOnMobile}
          onChange={v => setField('timeTracking', 'captureGpsOnMobile', v)}
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'restrictToGeofence', 'Restrict Clock-ins to Geo-fence',
            'Prevent clock-ins from outside a defined distance using GPS location.',
            <><p className="font-medium mb-1">Example</p><p>With the radius set to 100 m, a staff member trying to clock in from a café 500 m away sees: "You must be at the site to clock in." Stops accidental or fraudulent off-site clock-ins.</p></>)}
          value={resolved.timeTracking.restrictToGeofence}
          onChange={v => setField('timeTracking', 'restrictToGeofence', v)}
        />
        {resolved.timeTracking.restrictToGeofence && (
          <NumberRow
            {...fieldProps('timeTracking', 'geofenceRadiusMeters', 'Geo-fence radius (meters)',
              'Maximum distance from scheduled location at which clock-in is allowed.',
              <><p className="font-medium mb-1">Example</p><p>Set to <strong>150</strong>. A large hospital campus allows clock-in from any entrance. A small clinic might use <strong>50</strong> to keep clock-ins precisely on-site.</p></>)}
            value={resolved.timeTracking.geofenceRadiusMeters}
            onChange={v => setField('timeTracking', 'geofenceRadiusMeters', v)}
          />
        )}
        <ToggleRow
          {...fieldProps('timeTracking', 'requireKioskPhoto', 'Require Face Verification',
            'Team members must clock in using face verification at the kiosk when starting or ending a shift.',
            <><p className="font-medium mb-1">Example</p><p>At a warehouse kiosk, the camera takes a quick selfie that's matched against the staff profile photo. Prevents "buddy punching" where one worker clocks in for another.</p></>)}
          value={resolved.timeTracking.requireKioskPhoto}
          onChange={v => setField('timeTracking', 'requireKioskPhoto', v)}
        />

        <NumberRow
          {...fieldProps('timeTracking', 'minTimesheetMinutes', 'Minimum timesheet length (minutes)',
            'Timesheets shorter than the specified duration will not be recorded.',
            <><p className="font-medium mb-1">Example</p><p>Set to <strong>15</strong>. A staff member clocks in, realises they're at the wrong location, and clocks out after 4 minutes. The entry is discarded so it doesn't clutter timesheets or payroll.</p></>)}
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
        <CardTitle className="tracking-tight">Staff Self-Service Permissions</CardTitle>
        <CardDescription>What staff are allowed to do with their own timesheets, clock events and breaks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PermissionGroup title="Editing">
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
            {...fieldProps('permissions', 'editClockTimesAfterSubmission', 'Edit Clock Times After Submission',
              'Allow staff to modify clock-in/out times after a timesheet has been submitted (until it is approved). Audited.')}
            value={resolved.permissions.editClockTimesAfterSubmission}
            onChange={v => setField('permissions', 'editClockTimesAfterSubmission', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'addNotesAndAttachments', 'Add Notes and Attachments',
              'Allow staff to attach notes, files, or photos to their timesheet entries.')}
            value={resolved.permissions.addNotesAndAttachments}
            onChange={v => setField('permissions', 'addNotesAndAttachments', v)}
          />
        </PermissionGroup>

        <PermissionGroup title="Clock-in & Clock-out">
          <SelectRow
            {...fieldProps('permissions', 'earlyClockInPolicy', 'Early Clock-in Policy',
              'Control whether team members can clock in before their scheduled shift start.')}
            value={resolved.permissions.earlyClockInPolicy}
            options={earlyClockInOptions}
            onChange={v => setField('permissions', 'earlyClockInPolicy', v as TimesheetPolicy['permissions']['earlyClockInPolicy'])}
          />
          {resolved.permissions.earlyClockInPolicy === 'within_minutes' && (
            <NumberRow
              {...fieldProps('permissions', 'earlyClockInMinutes', 'Maximum early clock-in (minutes)',
                'How many minutes before the scheduled start a team member can clock in.')}
              value={resolved.permissions.earlyClockInMinutes}
              onChange={v => setField('permissions', 'earlyClockInMinutes', v)}
            />
          )}
          <NumberRow
            {...fieldProps('permissions', 'lateClockInGraceMinutes', 'Late clock-in grace (minutes)',
              'Clock-ins within this many minutes after the scheduled start still count as on-time (no late flag).')}
            value={resolved.permissions.lateClockInGraceMinutes}
            onChange={v => setField('permissions', 'lateClockInGraceMinutes', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'allowEarlyClockOut', 'Allow Early Clock-out',
              'Permit staff to clock out before their scheduled shift end time.')}
            value={resolved.permissions.allowEarlyClockOut}
            onChange={v => setField('permissions', 'allowEarlyClockOut', v)}
          />
          <NumberRow
            {...fieldProps('permissions', 'autoClockOutAfterShiftMinutes', 'Auto clock-out after shift end (minutes)',
              'If a team member forgets to clock out, automatically clock them out this many minutes after the scheduled end. Set 0 to disable.')}
            value={resolved.permissions.autoClockOutAfterShiftMinutes}
            onChange={v => setField('permissions', 'autoClockOutAfterShiftMinutes', v)}
          />
        </PermissionGroup>

        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Looking for break permissions (wrap up sooner, edit own duration, add to past timesheets)?
          They now live in the <span className="font-medium text-foreground">Breaks</span> tab under
          <span className="font-medium text-foreground"> Staff Break Permissions</span>.
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</h4>
      <div className="space-y-1 divide-y border-t">{children}</div>
    </div>
  );
}


export function PolicyApproving() {
  const { resolved, setField, fieldProps } = usePolicyAndScope();
  const roundingOn = resolved.approving.roundingEnabled;
  const autoApprovalOn = resolved.approving.autoApproval !== 'never';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Timesheet Approving</CardTitle>
        <CardDescription>Automatic approval, rounding and approval routing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Precedence chain</p>
            <p>
              <span className="font-medium">Award / EA</span> →{' '}
              <span className="font-medium">Location override</span> →{' '}
              <span className="font-medium">Tenant default</span>. Rounding never reduces hours below
              what an applicable Award guarantees.
            </p>
          </div>
        </div>

        <PermissionGroup title="Auto-Approval">
          <SelectRow
            {...fieldProps('approving', 'autoApproval', 'Automatic Timesheet Approval',
              'Automatically approve timesheets if they align with the scheduled shift or fall within the defined grace period.',
              <>
                <p className="font-medium mb-1">What it does</p>
                <p className="mb-2">Decides when timesheets bypass manual approval.</p>
                <p className="font-medium mb-1">Example</p>
                <p>Choose <em>"When matches scheduled shift"</em>. Sarah was rostered 9:00–17:00 and clocked 9:02–17:01. The system auto-approves because the drift sits within the match tolerance below.</p>
              </>)}
            value={resolved.approving.autoApproval}
            options={approvalCadenceOptions}
            onChange={v => setField('approving', 'autoApproval', v as TimesheetPolicy['approving']['autoApproval'])}
          />
          <div className={autoApprovalOn ? '' : 'opacity-50 pointer-events-none select-none'}>
            <div className="space-y-1 divide-y">
              {resolved.approving.autoApproval === 'matches_schedule' && (
                <NumberRow
                  {...fieldProps('approving', 'autoApprovalMatchToleranceMinutes', 'Match tolerance (minutes)',
                    'How far recorded start/end can drift from the scheduled shift and still be considered a match.',
                    <>
                      <p className="font-medium mb-1">Example</p>
                      <p>Set to <strong>5</strong>. Roster 9:00–17:00. Clock 8:57–17:04 → auto-approves (within 5 min). Clock 9:08–17:00 → routes to a manager because the start drifted 8 minutes.</p>
                    </>)}
                  value={resolved.approving.autoApprovalMatchToleranceMinutes}
                  onChange={v => setField('approving', 'autoApprovalMatchToleranceMinutes', v)}
                />
              )}
              <ToggleRow
                {...fieldProps('approving', 'skipAutoApprovalIfFlagged', 'Skip auto-approval if flagged',
                  'Hold timesheets for manual review when any anomaly flag is raised (variance, missed break, overtime threshold, etc.).',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Tom missed his scheduled meal break. With this <strong>ON</strong>, the timesheet skips auto-approval and waits for a manager — even if everything else looks fine. With it OFF, it would auto-approve and the flag would only be visible in reports.</p>
                  </>)}
                value={resolved.approving.skipAutoApprovalIfFlagged}
                onChange={v => setField('approving', 'skipAutoApprovalIfFlagged', v)}
              />
              <NumberRow
                {...fieldProps('approving', 'autoApprovalMaxDailyHours', 'Max auto-approvable daily hours',
                  'Timesheets exceeding this many hours in a day will not auto-approve. Set 0 to disable the cap.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Set to <strong>10</strong>. A 9.5-hour shift auto-approves. An 11-hour shift routes to a manager so that long days are always reviewed before pay. Set to <strong>0</strong> to disable this safety cap.</p>
                  </>)}
                value={resolved.approving.autoApprovalMaxDailyHours}
                onChange={v => setField('approving', 'autoApprovalMaxDailyHours', v)}
              />
              <ToggleRow
                {...fieldProps('approving', 'notifyStaffOnAdjustment', 'Notify staff on auto-adjustment',
                  'Send the team member a notification when rounding or auto-approval changes their recorded times.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Priya clocks out at 17:07; rounding snaps it back to 17:00. With this <strong>ON</strong>, she receives a push notification: "Your clock-out was rounded from 17:07 to 17:00." Keeps staff trust by showing all adjustments transparently.</p>
                  </>)}
                value={resolved.approving.notifyStaffOnAdjustment}
                onChange={v => setField('approving', 'notifyStaffOnAdjustment', v)}
              />
            </div>
          </div>
        </PermissionGroup>

        <PermissionGroup title="Rounding">
          <ToggleRow
            {...fieldProps('approving', 'roundingEnabled', 'Timesheet Rounding (Auto)',
              'Master switch for automatic rounding of start and end times. When off, the rules below are ignored.',
              <>
                <p className="font-medium mb-1">What it does</p>
                <p>Turns on the rounding engine. When OFF, recorded times are used verbatim and the four rules below are ignored (even if individually set).</p>
              </>)}
            value={resolved.approving.roundingEnabled}
            onChange={v => setField('approving', 'roundingEnabled', v)}
          />
          <div className={roundingOn ? '' : 'opacity-50 pointer-events-none select-none'}>
            <div className="space-y-1 divide-y">
              <ToggleRow
                {...fieldProps('approving', 'adjustStartToScheduledIfEarlier', 'Snap start to scheduled if earlier',
                  'Early clock-ins are rounded forward to the scheduled start. Later clock-ins follow the rounding rule below.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Roster start 9:00. Staff clocks in 8:52. With <strong>ON</strong>, the recorded start becomes 9:00 (no early-start pay). With OFF, 8:52 is preserved and rounded per the rule below.</p>
                  </>)}
                value={resolved.approving.adjustStartToScheduledIfEarlier}
                onChange={v => setField('approving', 'adjustStartToScheduledIfEarlier', v)}
              />
              <SelectRow
                {...fieldProps('approving', 'startTimeAdjustment', 'Start Time Rounding',
                  'How non-snapped start times are rounded. Later rounding may reduce payable hours.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Choose <em>"Nearest 15 minutes"</em>. Clock-in 9:07 → recorded as 9:00. Clock-in 9:08 → 9:15. Choose <em>"Round up to 15"</em> to always favour the employee on late starts.</p>
                  </>)}
                value={resolved.approving.startTimeAdjustment}
                options={roundingOptions}
                onChange={v => setField('approving', 'startTimeAdjustment', v as TimesheetPolicy['approving']['startTimeAdjustment'])}
              />
              <ToggleRow
                {...fieldProps('approving', 'adjustEndToScheduledIfDelayed', 'Snap end to scheduled if delayed',
                  'Late clock-outs are rounded back to the scheduled end. Early clock-outs follow the rounding rule below.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Roster end 17:00. Staff clocks out 17:09. With <strong>ON</strong>, the recorded end becomes 17:00 (no unapproved overtime). With OFF, 17:09 is preserved and rounded per the rule below — and may trigger overtime.</p>
                  </>)}
                value={resolved.approving.adjustEndToScheduledIfDelayed}
                onChange={v => setField('approving', 'adjustEndToScheduledIfDelayed', v)}
              />
              <SelectRow
                {...fieldProps('approving', 'endTimeAdjustment', 'End Time Rounding',
                  'How non-snapped end times are rounded. Earlier rounding may reduce total hours paid.',
                  <>
                    <p className="font-medium mb-1">Example</p>
                    <p>Choose <em>"Nearest 15 minutes"</em>. Clock-out 16:53 → 16:45 (staff loses 5 min). Choose <em>"Round down to 15"</em> for strict trimming, or <em>"Nearest 5"</em> for a fairer split.</p>
                  </>)}
                value={resolved.approving.endTimeAdjustment}
                options={roundingOptions}
                onChange={v => setField('approving', 'endTimeAdjustment', v as TimesheetPolicy['approving']['endTimeAdjustment'])}
              />
            </div>
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            Break rounding now lives in the <span className="font-medium text-foreground">Breaks</span> tab under <span className="font-medium text-foreground">Rounding</span>.
          </div>
        </PermissionGroup>

        <PermissionGroup title="Approval Chain">
          <div className="py-2 text-xs text-muted-foreground space-y-1">
            <p>
              Multi-tier approval routing (Manager → Senior Manager → Director / HR) with SLA
              deadlines and escalation is configured per workflow.
            </p>
            <p>
              Note: when <span className="font-medium text-foreground">Automatic Timesheet Approval</span>
              {' '}is enabled, qualifying timesheets bypass the chain entirely unless
              {' '}<span className="font-medium text-foreground">Skip auto-approval if flagged</span> holds them.
            </p>
          </div>
        </PermissionGroup>
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
        <CardDescription>Break behaviour, flagging and staff break permissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Precedence chain</p>
            <p>
              <span className="font-medium">Award / EA</span> → <span className="font-medium">Break Rules library</span> →{' '}
              <span className="font-medium">Location override</span> → <span className="font-medium">Tenant default</span>.
            </p>
            <p>
              When an applicable Award (or Enterprise Agreement) defines mandatory break duration,
              timing, or paid/unpaid status, those rules win. Otherwise the{' '}
              <span className="font-medium">Break Rules</span> defined below this card determine when
              breaks apply and whether they're paid. The settings here control{' '}
              <span className="font-medium">UX behaviour</span> (auto-include on clock-out, variance flagging)
              and <span className="font-medium">staff self-service</span> permissions.
            </p>
          </div>
        </div>

        <PermissionGroup title="Behaviour">
          <ToggleRow
            {...fieldProps('breaks', 'autoIncludeScheduledOnClockOut', 'Auto-Include Scheduled Breaks on Clock-Out',
              "Automatically add any unrecorded scheduled breaks to the timesheet at clock-out. Inserted breaks inherit their paid/unpaid status from the matching Break Rule. If team members don't have edit permissions, they won't be able to remove these breaks afterwards.")}
            value={resolved.breaks.autoIncludeScheduledOnClockOut}
            onChange={v => setField('breaks', 'autoIncludeScheduledOnClockOut', v)}
          />
          <SelectRow
            {...fieldProps('breaks', 'paidMealBreaks', 'Paid Meal Breaks (fallback)',
              "Applies only when no Break Rule and no Award rule defines whether a meal break is paid. Acts as the final fallback.")}
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
        </PermissionGroup>

        <PermissionGroup title="Flagging">
          <SelectRow
            {...fieldProps('issues', 'flagBreakDurationVariance', 'Flag Break Duration Variance',
              'Alert managers when the actual break taken differs from the scheduled break duration. Replaces the legacy on/off "flag short or missed breaks" toggle.')}
            value={resolved.issues.flagBreakDurationVariance}
            options={varianceFlagOptions}
            onChange={v => setField('issues', 'flagBreakDurationVariance', v as TimesheetPolicy['issues']['flagBreakDurationVariance'])}
          />
        </PermissionGroup>

        <PermissionGroup title="Rounding">
          <ToggleRow
            {...fieldProps('approving', 'roundShortBreakUpToScheduled', 'Round short breaks up to scheduled',
              'Automatically extend short breaks to match the scheduled duration. Longer breaks follow the rule below.')}
            value={resolved.approving.roundShortBreakUpToScheduled}
            onChange={v => setField('approving', 'roundShortBreakUpToScheduled', v)}
          />
          <SelectRow
            {...fieldProps('approving', 'breakRoundingAdjustment', 'Break Time Rounding',
              'How non-snapped break durations are rounded. Later rounding may reduce payable time.')}
            value={resolved.approving.breakRoundingAdjustment}
            options={roundingOptions}
            onChange={v => setField('approving', 'breakRoundingAdjustment', v as TimesheetPolicy['approving']['breakRoundingAdjustment'])}
          />
        </PermissionGroup>


        <PermissionGroup title="Staff Break Permissions">
          <ToggleRow
            {...fieldProps('permissions', 'wrapUpBreaksSooner', 'Wrap up Breaks Sooner',
              'Allow team members to end their breaks early and resume work before the scheduled time.')}
            value={resolved.permissions.wrapUpBreaksSooner}
            onChange={v => setField('permissions', 'wrapUpBreaksSooner', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'editOwnBreakDuration', 'Edit Own Break Duration',
              'Allow staff to adjust the duration of breaks on their own timesheet entries.')}
            value={resolved.permissions.editOwnBreakDuration}
            onChange={v => setField('permissions', 'editOwnBreakDuration', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'addBreaksToPastTimesheets', 'Add Breaks to Past Timesheets',
              'Allow staff to retroactively add break entries to previously submitted timesheets (until approved).')}
            value={resolved.permissions.addBreaksToPastTimesheets}
            onChange={v => setField('permissions', 'addBreaksToPastTimesheets', v)}
          />
        </PermissionGroup>

        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          The <span className="font-medium text-foreground">Break Rules library</span> (when breaks
          are required, their duration, and paid/unpaid status) is configured in the table below.
        </div>
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
        <div className="pt-2 text-xs text-muted-foreground">
          Break duration variance flagging now lives in the <span className="font-medium text-foreground">Breaks</span> tab under <span className="font-medium text-foreground">Flagging</span>.
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Row primitives ----------

interface BaseRowProps {
  label: string;
  description?: string;
  example?: React.ReactNode;
  isTenant: boolean;
  overridden: boolean;
  onReset: () => void;
  comingSoon?: boolean;
}

function HelpHint({ content }: { content: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RowShell({ label, description, example, isTenant, overridden, onReset, comingSoon, control }: BaseRowProps & { control: React.ReactNode }) {
  return (
    <div className={`flex items-start justify-between gap-6 py-4 ${comingSoon ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium tracking-tight">{label}</Label>
          {example && <HelpHint content={example} />}
          {comingSoon && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] h-5 dark:text-amber-400">
              Coming Soon
            </Badge>
          )}
          {!isTenant && !comingSoon && (
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
          {!isTenant && overridden && !comingSoon && (
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
      <div className="flex-shrink-0 pointer-events-auto">{control}</div>
    </div>
  );
}

function ToggleRow(props: BaseRowProps & { value: boolean; onChange: (v: boolean) => void }) {
  const { value, onChange, comingSoon, ...rest } = props;
  return <RowShell {...rest} comingSoon={comingSoon} control={<Switch checked={value} onCheckedChange={onChange} disabled={comingSoon} />} />;
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
