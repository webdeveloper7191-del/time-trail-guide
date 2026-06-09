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
  anomalySeverityOptions,
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
              'Allow team members to create and edit their timesheets via the web or mobile app.',
              <><p className="font-medium mb-1">Example</p><p>Maya forgot to clock in yesterday. With this <strong>ON</strong>, she can add the missing entry herself; with OFF, she must ask her manager to add it.</p></>)}
            value={resolved.permissions.createAndEditTimesheets}
            onChange={v => setField('permissions', 'createAndEditTimesheets', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'updateTimesheetsDuringShift', 'Update Timesheets During Shifts',
              'Allow team members to make timesheet updates while they are active on shift.',
              <><p className="font-medium mb-1">Example</p><p>A nurse mid-shift realises she clocked in 10 minutes late. With this <strong>ON</strong>, she fixes the start time before the shift ends; with OFF, the edit is only possible after clock-out.</p></>)}
            value={resolved.permissions.updateTimesheetsDuringShift}
            onChange={v => setField('permissions', 'updateTimesheetsDuringShift', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'editClockTimesAfterSubmission', 'Edit Clock Times After Submission',
              'Allow staff to modify clock-in/out times after a timesheet has been submitted (until it is approved). Audited.',
              <><p className="font-medium mb-1">Example</p><p>Alex submits Friday's timesheet then notices his clock-out was 15 min off. With this <strong>ON</strong>, he edits and re-submits — the change is logged in the audit trail. Once a manager approves, edits are locked.</p></>)}
            value={resolved.permissions.editClockTimesAfterSubmission}
            onChange={v => setField('permissions', 'editClockTimesAfterSubmission', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'addNotesAndAttachments', 'Add Notes and Attachments',
              'Allow staff to attach notes, files, or photos to their timesheet entries.',
              <><p className="font-medium mb-1">Example</p><p>A driver attaches a photo of a delayed delivery to explain a late clock-out, plus a note: "Traffic on M1, arrived 22 min late." Approver sees the context immediately.</p></>)}
            value={resolved.permissions.addNotesAndAttachments}
            onChange={v => setField('permissions', 'addNotesAndAttachments', v)}
          />
        </PermissionGroup>

        <PermissionGroup title="Clock-in & Clock-out">
          <SelectRow
            {...fieldProps('permissions', 'earlyClockInPolicy', 'Early Clock-in Policy',
              'Control whether team members can clock in before their scheduled shift start.',
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Up to X minutes early"</em> to prevent staff clocking in 45 minutes before their shift (and accumulating unwanted early-start pay). Choose <em>"Not allowed"</em> for strict on-the-minute starts.</p></>)}
            value={resolved.permissions.earlyClockInPolicy}
            options={earlyClockInOptions}
            onChange={v => setField('permissions', 'earlyClockInPolicy', v as TimesheetPolicy['permissions']['earlyClockInPolicy'])}
          />
          {resolved.permissions.earlyClockInPolicy === 'within_minutes' && (
            <NumberRow
              {...fieldProps('permissions', 'earlyClockInMinutes', 'Maximum early clock-in (minutes)',
                'How many minutes before the scheduled start a team member can clock in.',
                <><p className="font-medium mb-1">Example</p><p>Set to <strong>15</strong>. Roster start 9:00. Clock-in at 8:50 → allowed. Clock-in at 8:40 → blocked with: "Too early, try again in 10 min."</p></>)}
              value={resolved.permissions.earlyClockInMinutes}
              onChange={v => setField('permissions', 'earlyClockInMinutes', v)}
            />
          )}
          <NumberRow
            {...fieldProps('permissions', 'lateClockInGraceMinutes', 'Late clock-in grace (minutes)',
              'Clock-ins within this many minutes after the scheduled start still count as on-time (no late flag).',
              <><p className="font-medium mb-1">Example</p><p>Set to <strong>5</strong>. Roster start 9:00. Clock-in 9:04 → on-time. Clock-in 9:08 → flagged "Late by 8 min" for the manager.</p></>)}
            value={resolved.permissions.lateClockInGraceMinutes}
            onChange={v => setField('permissions', 'lateClockInGraceMinutes', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'allowEarlyClockOut', 'Allow Early Clock-out',
              'Permit staff to clock out before their scheduled shift end time.',
              <><p className="font-medium mb-1">Example</p><p>Roster end 17:00. With <strong>ON</strong>, staff can clock out at 16:30 (paid only for time worked). With OFF, they're asked to confirm or request manager approval.</p></>)}
            value={resolved.permissions.allowEarlyClockOut}
            onChange={v => setField('permissions', 'allowEarlyClockOut', v)}
          />
          <NumberRow
            {...fieldProps('permissions', 'autoClockOutAfterShiftMinutes', 'Auto clock-out after shift end (minutes)',
              'If a team member forgets to clock out, automatically clock them out this many minutes after the scheduled end. Set 0 to disable.',
              <><p className="font-medium mb-1">Example</p><p>Set to <strong>30</strong>. Roster end 17:00. Staff forgets to clock out → at 17:30 the system auto-closes the shift at 17:00 and flags it for review. Prevents runaway 24-hour timesheets.</p></>)}
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
              "Automatically add any unrecorded scheduled breaks to the timesheet at clock-out. Inserted breaks inherit their paid/unpaid status from the matching Break Rule. If team members don't have edit permissions, they won't be able to remove these breaks afterwards.",
              <><p className="font-medium mb-1">Example</p><p>Dan was rostered with a 30-min unpaid lunch but forgot to log it. At clock-out the system auto-inserts the 30-min break, so the timesheet correctly shows 7.5 paid hours instead of 8.</p></>)}
            value={resolved.breaks.autoIncludeScheduledOnClockOut}
            onChange={v => setField('breaks', 'autoIncludeScheduledOnClockOut', v)}
          />
          <SelectRow
            {...fieldProps('breaks', 'paidMealBreaks', 'Paid Meal Breaks (fallback)',
              "Applies only when no Break Rule and no Award rule defines whether a meal break is paid. Acts as the final fallback.",
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Paid if shift exceeds threshold"</em>. A 4-hour shift → meal break is unpaid. A 9-hour shift exceeding the threshold below → meal break is paid. Award rules (if defined) always take precedence over this fallback.</p></>)}
            value={resolved.breaks.paidMealBreaks}
            options={paidMealOptions}
            onChange={v => setField('breaks', 'paidMealBreaks', v as TimesheetPolicy['breaks']['paidMealBreaks'])}
          />
          {resolved.breaks.paidMealBreaks === 'over_threshold' && (
            <NumberRow
              {...fieldProps('breaks', 'paidMealOverMinutesThreshold', 'Paid if shift exceeds (minutes)',
                'Meal breaks become paid when the shift exceeds this duration.',
                <><p className="font-medium mb-1">Example</p><p>Set to <strong>360</strong> (6 hours). A 5-hour shift → meal break unpaid. A 7-hour shift → meal break paid because total time exceeds the threshold.</p></>)}
              value={resolved.breaks.paidMealOverMinutesThreshold}
              onChange={v => setField('breaks', 'paidMealOverMinutesThreshold', v)}
            />
          )}
        </PermissionGroup>


        <PermissionGroup title="Rounding">
          <ToggleRow
            {...fieldProps('approving', 'roundShortBreakUpToScheduled', 'Round short breaks up to scheduled',
              'Automatically extend short breaks to match the scheduled duration. Longer breaks follow the rule below.',
              <><p className="font-medium mb-1">Example</p><p>Scheduled 30-min unpaid break, staff took 24 min. With <strong>ON</strong>, the recorded break becomes 30 min — so 6 min are deducted from paid time (matches the schedule). With OFF, only 24 min are deducted.</p></>)}
            value={resolved.approving.roundShortBreakUpToScheduled}
            onChange={v => setField('approving', 'roundShortBreakUpToScheduled', v)}
          />
          <SelectRow
            {...fieldProps('approving', 'breakRoundingAdjustment', 'Break Time Rounding',
              'How non-snapped break durations are rounded. Later rounding may reduce payable time.',
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Nearest 5 minutes"</em>. A 32-min break records as 30 min. A 38-min break records as 40 min. Keeps timesheet entries tidy and consistent for payroll.</p></>)}
            value={resolved.approving.breakRoundingAdjustment}
            options={roundingOptions}
            onChange={v => setField('approving', 'breakRoundingAdjustment', v as TimesheetPolicy['approving']['breakRoundingAdjustment'])}
          />
        </PermissionGroup>


        <PermissionGroup title="Staff Break Permissions">
          <ToggleRow
            {...fieldProps('permissions', 'wrapUpBreaksSooner', 'Wrap up Breaks Sooner',
              'Allow team members to end their breaks early and resume work before the scheduled time.',
              <><p className="font-medium mb-1">Example</p><p>Sam's 30-min break starts at 12:00. At 12:18 the floor gets busy. With <strong>ON</strong>, he taps "End break" and returns. With OFF, the system locks him out of clock-in until 12:30.</p></>)}
            value={resolved.permissions.wrapUpBreaksSooner}
            onChange={v => setField('permissions', 'wrapUpBreaksSooner', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'editOwnBreakDuration', 'Edit Own Break Duration',
              'Allow staff to adjust the duration of breaks on their own timesheet entries.',
              <><p className="font-medium mb-1">Example</p><p>Recorded break shows 22 min but Mia actually took 30 min (forgot to clock back from break). With <strong>ON</strong>, she corrects it on her own timesheet; with OFF, she must ask a manager.</p></>)}
            value={resolved.permissions.editOwnBreakDuration}
            onChange={v => setField('permissions', 'editOwnBreakDuration', v)}
          />
          <ToggleRow
            {...fieldProps('permissions', 'addBreaksToPastTimesheets', 'Add Breaks to Past Timesheets',
              'Allow staff to retroactively add break entries to previously submitted timesheets (until approved).',
              <><p className="font-medium mb-1">Example</p><p>Jordan forgot to log Tuesday's lunch break. With <strong>ON</strong>, he opens Tuesday's submitted timesheet and adds the break before the manager approves. After approval, edits are locked.</p></>)}
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
        <CardTitle className="tracking-tight">Anomaly Flags</CardTitle>
        <CardDescription>
          Decide which timesheet anomalies are detected, how serious each one is, and whether they
          should block submission or just notify managers. Severity feeds into auto-approval (the
          Approving tab skips auto-approval if any flag is raised when "Skip if flagged" is on).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Severity levels:</span>{' '}
          <span className="text-foreground">Off</span> – disabled ·{' '}
          <span className="text-foreground">Info</span> – logged only ·{' '}
          <span className="text-foreground">Warning</span> – blocks auto-approval, manager review ·{' '}
          <span className="text-foreground">Critical</span> – blocks submission when "Block submission on critical" is on.
        </div>

        <PermissionGroup title="Time Variance">
          <SelectRow
            {...fieldProps('issues', 'flagShiftTimeVariance', 'Flag Shift Time Variance',
              'Raise a flag when actual clock-in/out differs from the scheduled start/end by more than this threshold.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>Over 10 minutes</em>. Priya was rostered 9:00–17:00 but clocked 8:42–17:24. Both ends drift &gt;10 min, so the timesheet is flagged for review instead of auto-approving.</p></>)}
            value={resolved.issues.flagShiftTimeVariance}
            options={varianceFlagOptions}
            onChange={v => setField('issues', 'flagShiftTimeVariance', v as TimesheetPolicy['issues']['flagShiftTimeVariance'])}
          />
          <SelectRow
            {...fieldProps('issues', 'flagBreakDurationVariance', 'Flag Break Duration Variance',
              'Raise a flag when the recorded break duration differs from what was scheduled.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>Over 10 minutes</em>. A 30-min meal break is scheduled. Tom records only 14 min — flagged. A 32-min break — within tolerance, no flag.</p></>)}
            value={resolved.issues.flagBreakDurationVariance}
            options={varianceFlagOptions}
            onChange={v => setField('issues', 'flagBreakDurationVariance', v as TimesheetPolicy['issues']['flagBreakDurationVariance'])}
          />
        </PermissionGroup>

        <PermissionGroup title="Missing & Unusual Entries">
          <SelectRow
            {...fieldProps('issues', 'flagMissingClockOut', 'Missing Clock-Out',
              'Severity assigned when a shift has a clock-in but no clock-out (likely a forgotten punch).',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>Critical</em>. Ava clocked in at 7:00 and never clocked out. The timesheet cannot be submitted until a manager corrects the missing punch — preventing a 24-hour pay event.</p></>)}
            value={resolved.issues.flagMissingClockOut}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagMissingClockOut', v as TimesheetPolicy['issues']['flagMissingClockOut'])}
          />
          <SelectRow
            {...fieldProps('issues', 'flagClockBoundaryBreach', 'Flag Out-of-Bounds Clock Events',
              'Raise a flag when staff clock in too early or clock out too late, relative to the boundary chosen below.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Warning</em>, boundary = <em>Scheduled shift</em>, early tolerance = <em>15 min</em>. Clock-in 20 min before shift start → flagged. 10 min early → no flag.</p></>)}
            value={resolved.issues.flagClockBoundaryBreach}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagClockBoundaryBreach', v as TimesheetPolicy['issues']['flagClockBoundaryBreach'])}
          />
          <SelectRow
            {...fieldProps('issues', 'clockBoundaryReference', 'Boundary Reference',
              'Decide whether the tolerances below are measured against each staff member\'s scheduled shift, or against the location\'s operating hours (configured in Location settings). Choose Scheduled shift for roster-driven sites; choose Operating window for open-floor / drop-in sites.',
              <><p className="font-medium mb-1">Example</p><p>A 24/7 hospital sets operating hours to "always open" in Location settings, then picks <em>Scheduled shift</em> here so flags fire only when a punch drifts from the rostered start/end.</p></>)}
            value={resolved.issues.clockBoundaryReference}
            options={clockBoundaryReferenceOptions}
            onChange={v => setField('issues', 'clockBoundaryReference', v as TimesheetPolicy['issues']['clockBoundaryReference'])}
          />
          <NumberRow
            {...fieldProps('issues', 'earlyClockInToleranceMinutes', 'Early Clock-In Tolerance (minutes)',
              'How many minutes a clock-in may precede the boundary (shift start or operating window open) without being flagged.',
              <><p className="font-medium mb-1">Example</p><p>Set to <strong>30</strong>. Roster start 9:00 AM. Clock-in 8:35 AM → ok. Clock-in 8:20 AM → flagged.</p></>)}
            value={resolved.issues.earlyClockInToleranceMinutes}
            onChange={v => setField('issues', 'earlyClockInToleranceMinutes', Math.max(0, v))}
          />
          <NumberRow
            {...fieldProps('issues', 'lateClockOutToleranceMinutes', 'Late Clock-Out Tolerance (minutes)',
              'How many minutes a clock-out may exceed the boundary (shift end or operating window close) without being flagged.',
              <><p className="font-medium mb-1">Example</p><p>Set to <strong>30</strong>. Roster end 5:00 PM. Clock-out 5:25 PM → ok. Clock-out 5:45 PM → flagged.</p></>)}
            value={resolved.issues.lateClockOutToleranceMinutes}
            onChange={v => setField('issues', 'lateClockOutToleranceMinutes', Math.max(0, v))}
          />


        </PermissionGroup>

        <PermissionGroup title="Excessive Hours">
          <SelectRow
            {...fieldProps('issues', 'flagExcessiveDailyHours', 'Excessive Daily Hours',
              'Severity when a single day exceeds the maximum allowed working hours.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>12h</em>, severity = <em>Critical</em>. Liam records a 13h25m shift. The system blocks submission until a manager verifies it was a genuine emergency callout.</p></>)}
            value={resolved.issues.flagExcessiveDailyHours}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagExcessiveDailyHours', v as TimesheetPolicy['issues']['flagExcessiveDailyHours'])}
          />
          <NumberRow
            {...fieldProps('issues', 'excessiveDailyHoursThreshold', 'Daily Hours Threshold',
              'Maximum hours per day before the excessive-hours flag fires.',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>12</em>. A 12h shift is fine; a 12h05m shift triggers the flag.</p></>)}
            value={resolved.issues.excessiveDailyHoursThreshold}
            onChange={v => setField('issues', 'excessiveDailyHoursThreshold', Math.max(0, v))}
          />
          <SelectRow
            {...fieldProps('issues', 'flagLongShiftWithoutBreak', 'Long Shift Without Break',
              'Flag shifts that exceed the threshold but have no break recorded — a common compliance risk.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>6h</em>, severity = <em>Warning</em>. Mia worked 7h15m with zero breaks recorded. The timesheet is held for review since a meal break is legally required after 5 hours under most awards.</p></>)}
            value={resolved.issues.flagLongShiftWithoutBreak}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagLongShiftWithoutBreak', v as TimesheetPolicy['issues']['flagLongShiftWithoutBreak'])}
          />
          <NumberRow
            {...fieldProps('issues', 'longShiftWithoutBreakHours', 'Hours Before Break Required',
              'Minimum continuous hours worked without a break before the flag fires.',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>6</em>. A 5h45m shift with no break is fine; 6h01m with no break triggers the anomaly.</p></>)}
            value={resolved.issues.longShiftWithoutBreakHours}
            onChange={v => setField('issues', 'longShiftWithoutBreakHours', Math.max(0, v))}
          />
          <SelectRow
            {...fieldProps('issues', 'flagHighWeeklyOvertime', 'High Weekly Overtime',
              'Flag weeks where overtime exceeds a threshold so payroll and managers are alerted to budget impact.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>8h</em>, severity = <em>Warning</em>. Sam logged 12h of overtime in one week. The timesheet routes to a senior manager for sign-off before payroll.</p></>)}
            value={resolved.issues.flagHighWeeklyOvertime}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagHighWeeklyOvertime', v as TimesheetPolicy['issues']['flagHighWeeklyOvertime'])}
          />
          <NumberRow
            {...fieldProps('issues', 'highWeeklyOvertimeThreshold', 'Weekly Overtime Threshold',
              'Overtime hours per week above which the flag fires.',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>8</em>. 7.5h of weekly overtime — no flag. 8.5h — flagged for senior review.</p></>)}
            value={resolved.issues.highWeeklyOvertimeThreshold}
            onChange={v => setField('issues', 'highWeeklyOvertimeThreshold', Math.max(0, v))}
          />
        </PermissionGroup>

        <PermissionGroup title="Break Behaviour">
          <SelectRow
            {...fieldProps('issues', 'flagExceededBreak', 'Exceeded Break Duration',
              'Flag when a recorded break runs longer than the allowed/scheduled duration by more than the percentage below.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>150%</em>, severity = <em>Info</em>. A 30-min meal break stretches to 50 min (167%) — flagged so the manager can decide whether to deduct unpaid time.</p></>)}
            value={resolved.issues.flagExceededBreak}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagExceededBreak', v as TimesheetPolicy['issues']['flagExceededBreak'])}
          />
          <NumberRow
            {...fieldProps('issues', 'exceededBreakPercent', 'Exceeded Break Threshold (%)',
              'Break duration above this percentage of the scheduled length triggers the flag.',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>150</em>. A 30-min scheduled break is fine up to 45 min; 46 min triggers the flag.</p></>)}
            value={resolved.issues.exceededBreakPercent}
            onChange={v => setField('issues', 'exceededBreakPercent', Math.max(100, v))}
          />
        </PermissionGroup>

        <PermissionGroup title="Behavioural Patterns">
          <SelectRow
            {...fieldProps('issues', 'flagPatternDrift', 'Pattern Drift',
              'Detect when clock-in times deviate significantly from a staff member\'s historical average — possible buddy-punching or schedule confusion.',
              <><p className="font-medium mb-1">Example</p><p>Drift = <em>60 min</em>, severity = <em>Info</em>. Noah usually clocks in around 8:30 AM. He clocks in at 10:15 AM — flagged as informational so managers can spot a missed shift swap.</p></>)}
            value={resolved.issues.flagPatternDrift}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagPatternDrift', v as TimesheetPolicy['issues']['flagPatternDrift'])}
          />
          <NumberRow
            {...fieldProps('issues', 'patternDriftMinutes', 'Pattern Drift Threshold (min)',
              'Minutes of deviation from the historical average clock-in time before the flag fires.',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>60</em>. A 45-min deviation is ignored; a 75-min deviation is flagged.</p></>)}
            value={resolved.issues.patternDriftMinutes}
            onChange={v => setField('issues', 'patternDriftMinutes', Math.max(0, v))}
          />
          <SelectRow
            {...fieldProps('issues', 'flagBuddyPunching', 'Suspected Buddy Punching',
              'Detect when two staff clock in/out from the same device within seconds of each other — a classic indicator of one person punching for another.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Critical</em>. Two clock-ins from the same kiosk within 4 seconds on different staff IDs route the timesheets to HR for investigation before payroll.</p></>)}
            value={resolved.issues.flagBuddyPunching}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagBuddyPunching', v as TimesheetPolicy['issues']['flagBuddyPunching'])}
          />
          <SelectRow
            {...fieldProps('issues', 'flagIrregularPunchPattern', 'Irregular Punch Pattern',
              'Catch unusual punch sequences such as multiple clock-ins without a clock-out, rapid in/out cycles, or out-of-order timestamps.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Warning</em>. Mia clocks in, out, in, and out three times within 20 minutes. The pattern is flagged so a manager can confirm whether a device or training issue is to blame.</p></>)}
            value={resolved.issues.flagIrregularPunchPattern}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagIrregularPunchPattern', v as TimesheetPolicy['issues']['flagIrregularPunchPattern'])}
          />
        </PermissionGroup>


        <PermissionGroup title="Submission Behaviour">
          <ToggleRow
            {...fieldProps('issues', 'blockSubmissionOnCritical', 'Block Submission on Critical',
              'Prevent staff from submitting timesheets that contain any Critical-severity anomaly until it is resolved.',
              <><p className="font-medium mb-1">Example</p><p>With <strong>ON</strong>, a missing clock-out (Critical) blocks the weekly submit button until a manager corrects it. With OFF, the timesheet submits but stays in a "Needs review" queue.</p></>)}
            value={resolved.issues.blockSubmissionOnCritical}
            onChange={v => setField('issues', 'blockSubmissionOnCritical', v)}
          />
        </PermissionGroup>
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

// ---------- Operating Hours composite row ----------
function formatTime12(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`;
}

const TIME_SLOTS: { value: string; label: string }[] = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * 30;
  return { value: String(minutes), label: formatTime12(minutes) };
});

function OperatingHoursRow(props: {
  isTenant: boolean;
  modeOverridden: boolean;
  startOverridden: boolean;
  endOverridden: boolean;
  sevOverridden: boolean;
  onResetAll: () => void;
  mode: 'fixed_window' | 'always_open';
  startMinutes: number;
  endMinutes: number;
  severity: 'off' | 'info' | 'warning' | 'critical';
  onModeChange: (v: 'fixed_window' | 'always_open') => void;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  onSeverityChange: (v: 'off' | 'info' | 'warning' | 'critical') => void;
}) {
  const {
    isTenant, modeOverridden, startOverridden, endOverridden, sevOverridden, onResetAll,
    mode, startMinutes, endMinutes, severity,
    onModeChange, onStartChange, onEndChange, onSeverityChange,
  } = props;
  const anyOverridden = modeOverridden || startOverridden || endOverridden || sevOverridden;
  const wraps = mode === 'fixed_window' && endMinutes < startMinutes;

  const preview = mode === 'always_open'
    ? 'Time-of-day checks are disabled — clock events at any hour are accepted without flagging.'
    : `Clock-ins or clock-outs outside ${formatTime12(startMinutes)} – ${formatTime12(endMinutes)}${wraps ? ' (wraps past midnight)' : ''} will be flagged as ${severity}.`;

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm font-medium tracking-tight">Operating Hours Window</Label>
            <HelpHint content={
              <>
                <p className="font-medium mb-1">What it does</p>
                <p className="mb-2">Replaces the old "Unusual Early Clock-In" and "Unusual Late Clock-Out" rules with a single operating window. Any clock event recorded outside this window is flagged.</p>
                <p className="font-medium mb-1">For 24/7 operations</p>
                <p>Choose <em>"24/7 operations"</em> to disable the time-of-day check entirely. Other anomaly flags (missing clock-out, excessive hours, pattern drift) keep working.</p>
              </>
            } />
            {!isTenant && (
              anyOverridden ? (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] h-5">Overridden</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground gap-1">
                  <Info className="h-3 w-3" /> Inherited
                </Badge>
              )
            )}
            {!isTenant && anyOverridden && (
              <button type="button" onClick={onResetAll} className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2">
                Reset to tenant
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Define when your business operates. Clock events outside this window are flagged so managers can catch forgotten punches or overnight errors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Operating model</Label>
          <Select value={mode} onValueChange={v => onModeChange(v as 'fixed_window' | 'always_open')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed_window">Fixed operating window</SelectItem>
              <SelectItem value="always_open">24/7 operations (no time-of-day check)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Severity when outside window</Label>
          <Select
            value={severity}
            onValueChange={v => onSeverityChange(v as 'off' | 'info' | 'warning' | 'critical')}
            disabled={mode === 'always_open'}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {anomalySeverityOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === 'fixed_window' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Opens at</Label>
              <Select value={String(startMinutes)} onValueChange={v => onStartChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIME_SLOTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Closes at</Label>
              <Select value={String(endMinutes)} onValueChange={v => onEndChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIME_SLOTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {preview}
      </div>
    </div>
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
