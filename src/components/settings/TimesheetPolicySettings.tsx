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
  noShiftClockInActionOptions,
  unscheduledRosterFlagOptions,
  unscheduledShiftCreationOptions,
  unscheduledEndTimeRuleOptions,
  paidMealOptions,
  
  earlyClockInOptions,
  kioskVerificationOptions,
  anomalySeverityOptions,
  clockBoundaryReferenceOptions,
} from '@/types/timesheetPolicy';

import { timesheetPolicyStore, getPolicyVersion } from '@/lib/timesheetPolicyStore';
import {
  validateUnscheduledEndTimeSettings,
  resolveUnscheduledShiftWindow,
  type EndTimeValidationIssue,
} from '@/lib/unscheduledShiftEndTime';


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
            'Allow staff to clock in and out via the web app (Employee Portal self-service).',
            <><p className="font-medium mb-1">Example</p><p>A staff member opens the Employee Portal on a desktop or browser and taps "Clock in" at 8:58 AM. With this OFF, the web clock button is hidden.</p></>)}
          value={resolved.timeTracking.enableWebClock}
          onChange={v => setField('timeTracking', 'enableWebClock', v)}
          comingSoon
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'enableStaffMobileApp', 'Enable Staff Mobile App Clock-in/out',
            'Allow staff to clock in and out using their personal staff mobile app (self-service).',
            <><p className="font-medium mb-1">Example</p><p>A field worker arrives on-site and clocks in from their own phone. Useful for staff who do not have access to a fixed kiosk or computer.</p></>)}
          value={resolved.timeTracking.enableStaffMobileApp}
          onChange={v => setField('timeTracking', 'enableStaffMobileApp', v)}
          comingSoon
        />
        <ToggleRow
          {...fieldProps('timeTracking', 'enableMobileClock', 'Enable Rostered.ai Kiosk App (Fixed Location)',
            'Allow clock in and out from a shared, fixed-location kiosk device. This is not a self-service channel — it is a shared device at the location.',
            <><p className="font-medium mb-1">Example</p><p>At the front desk of a location, a shared tablet displays the Rostered.ai Kiosk App. Staff enter their PIN or scan a QR code to clock in before their shift starts.</p></>)}
          value={resolved.timeTracking.enableMobileClock}
          onChange={v => setField('timeTracking', 'enableMobileClock', v)}
        />
        {resolved.timeTracking.enableStaffMobileApp && (
          <ToggleRow
            {...fieldProps('timeTracking', 'captureGpsOnMobile', 'Capture GPS on Staff Mobile App Clock-in/out',
              'Record GPS coordinates when staff clock in or out via the staff mobile app. Distance from scheduled location will appear in timesheets.',
              <><p className="font-medium mb-1">Example</p><p>Liam clocks in from the staff mobile app 1.2 km away from his assigned location. The timesheet shows "Clocked in 1.2 km from site" so the manager can investigate without blocking the clock-in.</p></>)}
            value={resolved.timeTracking.captureGpsOnMobile}
            onChange={v => setField('timeTracking', 'captureGpsOnMobile', v)}
            comingSoon
          />
        )}
        {resolved.timeTracking.enableMobileClock && (
          <>
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
            <SelectRow
              {...fieldProps('timeTracking', 'kioskVerificationMode', 'Kiosk Identity Verification',
                'How staff identify themselves at the Rostered.ai Kiosk App when clocking in or out.',
                <>
                  <p className="font-medium mb-1">Example</p>
                  <p>Choose <em>PIN only</em> for the fastest queue at shift change. Choose <em>Face verification only</em> for a hands-free, no-PIN-to-forget flow. Choose <em>PIN + face verification</em> for the strongest protection against "buddy punching" (one worker clocking in for another).</p>
                  <div className="mt-2 space-y-1">
                    <p><strong>PIN only</strong> — staff enter their personal PIN. Fast, no camera required.</p>
                    <p><strong>Face verification only</strong> — the kiosk camera matches a selfie against the staff profile photo.</p>
                    <p><strong>PIN + face verification</strong> — both are required; the clock event is rejected if either fails.</p>
                  </div>
                </>)}
              value={resolved.timeTracking.kioskVerificationMode}
              options={kioskVerificationOptions}
              onChange={v => {
                const mode = v as TimesheetPolicy['timeTracking']['kioskVerificationMode'];
                setField('timeTracking', 'kioskVerificationMode', mode);
                setField('timeTracking', 'requireKioskPhoto', mode !== 'pin');
              }}
            />
            <NumberRow
              {...fieldProps('timeTracking', 'minTimesheetMinutes', 'Minimum timesheet length (minutes)',
                'Timesheets shorter than the specified duration will not be recorded.',
                <><p className="font-medium mb-1">Example</p><p>Set to <strong>15</strong>. A staff member clocks in, realises they're at the wrong location, and clocks out after 4 minutes. The entry is discarded so it doesn't clutter timesheets or payroll.</p></>)}
              value={resolved.timeTracking.minTimesheetMinutes}
              onChange={v => setField('timeTracking', 'minTimesheetMinutes', v)}
            />
          </>
        )}
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
          <CardDescription>
            What staff are allowed to do with their own timesheets, clock events and breaks via the
            web app or Staff Mobile App. Kiosk permissions are configured under Time Tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PermissionGroup title="Editing">
            <ToggleRow
              {...fieldProps('permissions', 'createAndEditTimesheets', 'Create and Edit Timesheets',
                'Allow team members to create and edit their timesheets via the web or Staff Mobile App.',
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
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Up to X minutes early"</em> to prevent staff clocking in 45 minutes before their shift (and accumulating unwanted early-start pay). Choose <em>"Not allowed"</em> for strict on-the-minute starts.</p>{earlyClockInOptionGuide}</>)}
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
  const a = resolved.approving;
  const roundingOn = a.roundingEnabled;
  const autoApprovalOn = a.autoApproval !== 'never';

  const warnings: { title: string; body: React.ReactNode }[] = [];
  if (a.autoApproval === 'on_submit' && !a.skipAutoApprovalIfFlagged) {
    warnings.push({
      title: 'Every timesheet will be approved without review',
      body: <>Auto-approval is set to <strong>On submission</strong> and <strong>Skip auto-approval if flagged</strong> is off, so even timesheets with missing clock-outs or compliance breaches are approved straight to payroll. Turn on “Skip auto-approval if flagged” or choose “When matches scheduled shift”.</>,
    });
  }
  if (autoApprovalOn && a.autoApprovalMaxDailyHours === 0) {
    warnings.push({
      title: 'No safety cap on auto-approved hours',
      body: <>Max auto-approvable daily hours is <strong>0</strong> (disabled), so a 20-hour day caused by a forgotten punch could auto-approve. A cap of 10–12 hours is recommended.</>,
    });
  }
  if (!roundingOn && (a.adjustStartToScheduledIfEarlier || a.adjustEndToScheduledIfDelayed || a.startTimeAdjustment !== 'never' || a.endTimeAdjustment !== 'never')) {
    warnings.push({
      title: 'Rounding rules are configured but inactive',
      body: <>The master switch <strong>Timesheet Rounding (Auto)</strong> is off, so the snap and rounding rules below are ignored and exact recorded times are used.</>,
    });
  }
  if (roundingOn && a.startTimeAdjustment === 'down_nearest_15' && a.endTimeAdjustment === 'down_nearest_15') {
    warnings.push({
      title: 'Rounding always trims paid time',
      body: <>Both start and end round <strong>down to 15 minutes</strong>, which systematically reduces recorded hours in the employer’s favour. In most jurisdictions this creates underpayment risk — use “Nearest” rounding for a neutral split.</>,
    });
  }

  const autoApprovalSummary = (() => {
    if (!autoApprovalOn) return 'Every timesheet is routed through the approval chain manually.';
    const base =
      a.autoApproval === 'on_submit' ? 'Timesheets are approved as soon as staff submit them'
      : a.autoApproval === 'matches_schedule' ? `Timesheets are approved automatically when start and end are within ${a.autoApprovalMatchToleranceMinutes} min of the roster`
      : 'Qualifying timesheets are batch-approved at end of day';
    const flagged = a.skipAutoApprovalIfFlagged ? ', unless any anomaly flag is raised' : ', even if anomaly flags are raised';
    const cap = a.autoApprovalMaxDailyHours > 0 ? `, and never for days over ${a.autoApprovalMaxDailyHours} hours` : ', with no daily-hours cap';
    return `${base}${flagged}${cap}. ${a.notifyStaffOnAdjustment ? 'Staff are notified of any auto-adjustment.' : 'Staff are not notified of auto-adjustments.'}`;
  })();

  const roundingSummary = (() => {
    if (!roundingOn) return 'Recorded times are used exactly as captured — no rounding is applied.';
    const label = (v: string) => roundingOptions.find(o => o.value === v)?.label ?? v;
    return `Early clock-ins ${a.adjustStartToScheduledIfEarlier ? 'snap forward to the scheduled start' : 'are kept as recorded'}; other starts round to ${label(a.startTimeAdjustment)}. Late clock-outs ${a.adjustEndToScheduledIfDelayed ? 'snap back to the scheduled end' : 'are kept as recorded'}; other ends round to ${label(a.endTimeAdjustment)}.`;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Timesheet Approving</CardTitle>
        <CardDescription>Automatic approval, rounding and approval routing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map(w => (
              <div key={w.title} className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-medium mb-1">{w.title}</p>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        )}

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
                {autoApprovalOptionGuide}
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
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Current outcome: </span>{autoApprovalSummary}
          </div>
        </PermissionGroup>


        <PermissionGroup title="Rounding">
          <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-foreground/80 mb-2">
            <p className="font-medium text-foreground mb-1">Rounding vs. clock-event flags — what's the difference?</p>
            <ul className="space-y-1 list-disc pl-4">
              <li><span className="font-medium">Rounding</span> silently <em>changes</em> the recorded time → affects what gets paid.</li>
              <li><span className="font-medium">Out-of-bounds clock flags</span> (in the <span className="font-medium">Anomaly Flags</span> tab) leave times untouched and just raise a flag → affects what gets reviewed.</li>
              <li>If both are on, rounding runs first, so flags only fire on what's left over. Keep your early/late tolerances higher than your rounding step to avoid double-handling.</li>
            </ul>

          </div>
          <ToggleRow
            {...fieldProps('approving', 'roundingEnabled', 'Timesheet Rounding (Auto)',
              'Master switch for automatic rounding of start and end times. When off, the rules below are ignored.',
              <>
                <p className="font-medium mb-1">What it does</p>
                <p>Turns on the rounding engine. When OFF, recorded times are used verbatim and the four rules below are ignored (even if individually set).</p>
                <p className="font-medium mt-2 mb-1">Example</p>
                <p>Clock-in 8:52 AM, clock-out 5:06 PM. With this <strong>OFF</strong> payroll sees 8:52 AM – 5:06 PM (8h 14m). With it <strong>ON</strong> and "Nearest 15 minutes" set, payroll sees 9:00 AM – 5:00 PM (8h 00m).</p>
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
                    {roundingOptionGuide}
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
                    {roundingOptionGuide}
                  </>)}
                value={resolved.approving.endTimeAdjustment}
                options={roundingOptions}
                onChange={v => setField('approving', 'endTimeAdjustment', v as TimesheetPolicy['approving']['endTimeAdjustment'])}
              />
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Current outcome: </span>{roundingSummary}
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

function IssueList({ issues }: { issues: EndTimeValidationIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="pb-3 pl-0.5 space-y-1">
      {issues.map((issue, i) => (
        <p
          key={i}
          className={
            issue.level === 'error'
              ? 'text-xs text-destructive'
              : issue.level === 'warning'
                ? 'text-xs text-amber-700'
                : 'text-xs text-muted-foreground'
          }
        >
          {issue.level === 'error' ? 'Invalid: ' : issue.level === 'warning' ? 'Heads up: ' : ''}
          {issue.message}
        </p>
      ))}
    </div>
  );
}

export function PolicyUnscheduled() {

  const { resolved, setField, fieldProps, scope, isTenant } = usePolicyAndScope();
  const location = isTenant ? undefined : mockLocations.find(l => l.id === scope);
  const validationIssues = useMemo(() => validateUnscheduledEndTimeSettings(resolved.unscheduled, {
    isTenantScope: isTenant,
    hasOperatingHours: isTenant
      ? mockLocations.every(l => (l.operatingHours ?? []).some(h => h.isOpen))
      : (location?.operatingHours ?? []).some(h => h.isOpen),
    hasAreaDefaultShiftEnd: false,
  }), [resolved.unscheduled, isTenant, location]);
  const issuesFor = (field: string) => validationIssues.filter(i => i.field === field);
  const previewTz = location?.timezone ?? 'Australia/Melbourne';
  const preview = useMemo(() => {
    if (resolved.unscheduled.createShiftInRoster === 'never') return null;
    const now = new Date();
    const clockIn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 7));
    try {
      return resolveUnscheduledShiftWindow({
        settings: resolved.unscheduled,
        clockIn: clockIn.getTime(),
        timezone: previewTz,
        operatingHours: location?.operatingHours,
        provisional: true,
      });
    } catch {
      return null;
    }
  }, [resolved.unscheduled, previewTz, location]);
  const fmtPreview = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat('en-AU', {
          timeZone: previewTz, hour: 'numeric', minute: '2-digit', hour12: true,
          weekday: 'short',
        }).format(new Date(iso))
      : 'Open-ended';

  const u = resolved.unscheduled;
  const blocked = u.noShiftClockInAction === 'block';
  const flagged = u.noShiftClockInAction === 'allow_flag';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tight">Unscheduled Shifts</CardTitle>
        <CardDescription>
          What happens when someone clocks in without a matching rostered shift.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">

        <SectionHeading
          title="1. Match to an existing shift"
          description="Before treating a punch as unscheduled, try to attach it to a shift already on the roster."
        />
        <SelectRow
          {...fieldProps('unscheduled', 'linkUnscheduledToScheduled', 'Match unscheduled timesheets to a rostered shift',
            'If a suitable rostered shift exists, the timesheet is linked to it instead of being treated as unscheduled.',
            linkUnscheduledOptionGuide)}
          value={u.linkUnscheduledToScheduled}
          options={linkUnscheduledOptions}
          onChange={v => setField('unscheduled', 'linkUnscheduledToScheduled', v as TimesheetPolicy['unscheduled']['linkUnscheduledToScheduled'])}
        />
        {u.linkUnscheduledToScheduled !== 'never' && (
          <SelectRow
            {...fieldProps('unscheduled', 'allowTimeDriftMatching', 'Allowed time difference when matching',
              'How far the clock-in can sit from the rostered start and still be treated as the same shift.',
              timeDriftOptionGuide)}
            value={u.allowTimeDriftMatching}
            options={timeDriftOptions}
            onChange={v => setField('unscheduled', 'allowTimeDriftMatching', v as TimesheetPolicy['unscheduled']['allowTimeDriftMatching'])}
          />
        )}

        <SectionHeading
          title="2. No rostered shift found"
          description="How the device and the roster respond to an unrostered clock-in."
        />
        <SelectRow
          {...fieldProps('unscheduled', 'noShiftClockInAction', 'When there is no rostered shift',
            'Controls whether the punch is accepted at all, and whether it is marked for review.',
            noShiftClockInActionGuide)}
          value={u.noShiftClockInAction}
          options={noShiftClockInActionOptions}
          onChange={v => setField('unscheduled', 'noShiftClockInAction', v as TimesheetPolicy['unscheduled']['noShiftClockInAction'])}
        />
        {!blocked && (
          <ToggleRow
            {...fieldProps('unscheduled', 'requireTrainingForUnscheduled', 'Only allow if required training is complete',
              'Blocks the unscheduled clock-in when the area has training requirements the staff member has not met.',
              <><p className="font-medium mb-1">Example</p><p>Room 2 requires a current First Aid certificate. Ben turns up unrostered with an expired certificate. With this <strong>ON</strong> the kiosk refuses the punch: "Training not current for this area." With OFF he clocks in and the gap is only picked up later in review.</p></>)}
            value={u.requireTrainingForUnscheduled}
            onChange={v => setField('unscheduled', 'requireTrainingForUnscheduled', v)}
          />
        )}
        {flagged && (
          <SelectRow
            {...fieldProps('unscheduled', 'rosterFlagSeverity', 'Flag severity on the roster',
              'The marker shown on the roster cell. Critical also raises a compliance alert.',
              rosterFlagSeverityGuide)}
            value={u.rosterFlagSeverity}
            options={unscheduledRosterFlagOptions}
            onChange={v => setField('unscheduled', 'rosterFlagSeverity', v as TimesheetPolicy['unscheduled']['rosterFlagSeverity'])}
          />
        )}
        {!blocked && (
          <ToggleRow
            {...fieldProps('unscheduled', 'notifyManagerOnUnscheduledClockIn', 'Notify the location manager',
              'Send a notification the moment an unrostered clock-in is recorded.',
              <><p className="font-medium mb-1">Example</p><p>Priya clocks in at 6:04 AM with no rostered shift. The location manager gets a push/email at 6:04 AM: "Unrostered clock-in — Priya, Room 3." With this OFF, it is only seen when the timesheet is reviewed at week's end.</p></>)}
            value={u.notifyManagerOnUnscheduledClockIn}
            onChange={v => setField('unscheduled', 'notifyManagerOnUnscheduledClockIn', v)}
          />
        )}

        {!blocked && (
          <>
            <SectionHeading
              title="3. Add the shift to the roster"
              description="Optionally create a matching shift so the roster reflects who was actually on site."
            />
            <SelectRow
              {...fieldProps('unscheduled', 'createShiftInRoster', 'Create a shift in the roster',
                'When the shift is created. Creating on clock-out gives exact times; creating on clock-in shows live coverage.',
                createShiftGuide)}
              value={u.createShiftInRoster}
              options={unscheduledShiftCreationOptions}
              onChange={v => setField('unscheduled', 'createShiftInRoster', v as TimesheetPolicy['unscheduled']['createShiftInRoster'])}
            />

            {u.createShiftInRoster !== 'never' && (
              <>
                <SelectRow
                  {...fieldProps('unscheduled', 'createdShiftEndTimeRule', 'End time for the created shift',
                    'How the end time is set. On clock-in creation the end time is provisional and corrected at clock-out.',
                    endTimeRuleGuide)}
                  value={u.createdShiftEndTimeRule}
                  options={unscheduledEndTimeRuleOptions}
                  onChange={v => setField('unscheduled', 'createdShiftEndTimeRule', v as TimesheetPolicy['unscheduled']['createdShiftEndTimeRule'])}
                />
                <IssueList issues={issuesFor('createdShiftEndTimeRule')} />
                {u.createdShiftEndTimeRule === 'fixed_duration' && (
                  <>
                    <NumberRow
                      {...fieldProps('unscheduled', 'createdShiftFixedDurationHours', 'Fixed shift length (hours)',
                        'Provisional length applied from the clock-in time.',
                      <><p className="font-medium mb-1">Example</p><p>Set to <strong>8</strong>. A clock-in at 7:15 AM creates a provisional shift of 7:15 AM – 3:15 PM on the roster. When the actual clock-out lands at 3:40 PM, the shift is corrected to the real end time.</p></>)}
                      value={u.createdShiftFixedDurationHours}
                      onChange={v => setField('unscheduled', 'createdShiftFixedDurationHours', v)}
                    />
                    <IssueList issues={issuesFor('createdShiftFixedDurationHours')} />
                  </>
                )}
                <NumberRow
                  {...fieldProps('unscheduled', 'createdShiftMaxDurationHours', 'Maximum shift length (hours)',
                    'Safety cap for every end-time rule. Without a clock-out the shift closes here and is flagged. Range 1–24 hours.',
                    <><p className="font-medium mb-1">Example</p><p>Set to <strong>12</strong>. Sam clocks in at 6:00 AM and forgets to clock out. Instead of a runaway 24-hour shift, the roster shift closes at 6:00 PM and is flagged "Auto-closed at max duration" for a manager to correct.</p></>)}
                  value={u.createdShiftMaxDurationHours}
                  onChange={v => setField('unscheduled', 'createdShiftMaxDurationHours', v)}
                />
                <IssueList issues={issuesFor('createdShiftMaxDurationHours')} />
                <NumberRow
                  {...fieldProps('unscheduled', 'createdShiftRoundToMinutes', 'Round created shift times to (minutes)',
                    'Tidies the roster only — pay is always calculated from the timesheet. Set 0 to keep exact times.',
                    <><p className="font-medium mb-1">Example</p><p>Set to <strong>15</strong>. A clock-in at 7:07 AM and clock-out at 3:23 PM show on the roster as 7:00 AM – 3:30 PM, so the grid stays aligned with other shifts. Pay is still calculated on the exact 7:07 AM – 3:23 PM times. Set to <strong>0</strong> to show the exact times.</p></>)}
                  value={u.createdShiftRoundToMinutes}
                  onChange={v => setField('unscheduled', 'createdShiftRoundToMinutes', v)}
                />
                <IssueList issues={issuesFor('createdShiftRoundToMinutes')} />
                <ToggleRow
                  {...fieldProps('unscheduled', 'markCreatedShiftUnapproved', 'Mark created shift as unapproved',
                    'Keeps the shift out of published rosters and budget actuals until a manager confirms it.',
                    <><p className="font-medium mb-1">Example</p><p>With <strong>ON</strong>, Priya's auto-created shift appears with a dashed "Unapproved" outline, is excluded from labour cost actuals, and is not visible to other staff until the manager accepts it. With OFF it is published immediately and counts toward the week's budget.</p></>)}
                  value={u.markCreatedShiftUnapproved}
                  onChange={v => setField('unscheduled', 'markCreatedShiftUnapproved', v)}
                />
                <IssueList issues={issuesFor('markCreatedShiftUnapproved')} />

                {preview && (
                  <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs">
                    <p className="font-medium text-foreground mb-1">Worked example</p>
                    <p className="text-muted-foreground">
                      A staff member clocks in at{' '}
                      <span className="font-medium text-foreground">{fmtPreview(preview.startIso)}</span>{' '}
                      ({previewTz}) with no rostered shift. The created shift ends at{' '}
                      <span className="font-medium text-foreground">{fmtPreview(preview.endIso)}</span>
                      {preview.durationHours != null && <> — {preview.durationHours}h</>}
                      {preview.cappedByMaxDuration && <> (truncated by the maximum shift length)</>}
                      {preview.roundedToMinutes > 0 && <>, rounded to {preview.roundedToMinutes}-minute boundaries</>}.
                    </p>
                    {preview.warnings.map((w, i) => (
                      <p key={i} className="mt-1 text-amber-700">{w}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {blocked && (
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Unrostered clock-ins are blocked at the device, so roster flagging and shift creation do not apply.
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="pt-5 pb-1">
      <p className="text-sm font-medium tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
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
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Never (unpaid)"</em> to deduct meal breaks from paid time, or <em>"Always paid"</em> to keep meal breaks paid. Award rules (if defined) always take precedence over this fallback.</p>{paidMealOptionGuide}</>)}
            value={resolved.breaks.paidMealBreaks}
            options={paidMealOptions}
            onChange={v => setField('breaks', 'paidMealBreaks', v as TimesheetPolicy['breaks']['paidMealBreaks'])}
          />
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Current outcome: </span>
            {paidMealSummary(resolved.breaks)}
          </div>

        </PermissionGroup>


        <PermissionGroup title="Rounding">
          <SelectRow
            {...fieldProps('approving', 'breakRoundingAdjustment', 'Break Time Rounding',
              'How recorded break durations are rounded before payroll. Leave on "Never" to use the exact recorded times.',
              <><p className="font-medium mb-1">Example</p><p>Choose <em>"Nearest 5 minutes"</em>. A 32-min break records as 30 min. A 38-min break records as 40 min. Keeps timesheet entries tidy and consistent for payroll.</p>{roundingOptionGuide}</>)}
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

  // ---- Variance helpers: map enum <-> {enabled, minutes} for clearer UX ----
  type VFlag = TimesheetPolicy['issues']['flagShiftTimeVariance'];
  const varianceMinutes = (v: VFlag): number =>
    v === 'over_5m' ? 5 : v === 'over_10m' ? 10 : v === 'over_15m' ? 15 : v === 'always' ? 0 : 10;
  const varianceEnabled = (v: VFlag) => v !== 'never';
  const buildVariance = (enabled: boolean, mins: number): VFlag => {
    if (!enabled) return 'never';
    if (mins <= 0) return 'always';
    if (mins <= 5) return 'over_5m';
    if (mins <= 10) return 'over_10m';
    return 'over_15m';
  };
  const thresholdOptions: { value: string; label: string }[] = [
    { value: '5', label: 'More than 5 minutes' },
    { value: '10', label: 'More than 10 minutes' },
    { value: '15', label: 'More than 15 minutes' },
    { value: '0', label: 'Any difference at all' },
  ];

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




        <PermissionGroup title="Missing & Unusual Entries">
          <SelectRow
            {...fieldProps('issues', 'flagMissingClockOut', 'Missing Clock-Out',
              'Severity assigned when a shift has a clock-in but no clock-out (likely a forgotten punch).',
              <><p className="font-medium mb-1">Example</p><p>Set to <em>Critical</em>. Ava clocked in at 7:00 and never clocked out. The timesheet cannot be submitted until a manager corrects the missing punch — preventing a 24-hour pay event.</p>{severityOptionGuide}</>)}
            value={resolved.issues.flagMissingClockOut}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagMissingClockOut', v as TimesheetPolicy['issues']['flagMissingClockOut'])}
          />
          <SelectRow
            {...fieldProps('issues', 'flagClockBoundaryBreach', 'Flag Out-of-Bounds Clock Events',
              'Raise a flag when staff clock in too early or clock out too late, relative to the boundary chosen below.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Warning</em>, boundary = <em>Scheduled shift</em>, early tolerance = <em>15 min</em>. Clock-in 20 min before shift start → flagged. 10 min early → no flag.</p>{severityOptionGuide}</>)}
            value={resolved.issues.flagClockBoundaryBreach}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagClockBoundaryBreach', v as TimesheetPolicy['issues']['flagClockBoundaryBreach'])}
          />
          <SelectRow
            {...fieldProps('issues', 'clockBoundaryReference', 'Boundary Reference',
              'Decide whether the tolerances below are measured against each staff member\'s scheduled shift, or against the location\'s operating hours (configured in Location settings). Choose Scheduled shift for roster-driven sites; choose Operating window for open-floor / drop-in sites.',
              <><p className="font-medium mb-1">Example</p><p>A 24/7 hospital sets operating hours to "always open" in Location settings, then picks <em>Scheduled shift</em> here so flags fire only when a punch drifts from the rostered start/end.</p>{boundaryReferenceOptionGuide}</>)}
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

        <PermissionGroup title="Hours & Overtime">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            Daily hours, weekly hours, rest between shifts and consecutive days are set once in{' '}
            <span className="font-medium text-foreground">Compliance flag thresholds</span> (card below). The flags here
            cover what those limits don't: unbroken shifts and overtime volume.
          </div>


          <SelectRow
            {...fieldProps('issues', 'flagLongShiftWithoutBreak', 'Long Shift Without Break',
              'Flag shifts that exceed the threshold but have no break recorded — a common compliance risk.',
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>6h</em>, severity = <em>Warning</em>. Mia worked 7h15m with zero breaks recorded. The timesheet is held for review since a meal break is legally required after 5 hours under most awards.</p>{severityOptionGuide}</>)}
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
              <><p className="font-medium mb-1">Example</p><p>Threshold = <em>8h</em>, severity = <em>Warning</em>. Sam logged 12h of overtime in one week. The timesheet routes to a senior manager for sign-off before payroll.</p>{severityOptionGuide}</>)}
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
          <ToggleRow
            {...fieldProps('issues', 'flagBreakDurationVariance', 'Flag break duration variance',
              'Raise a flag when the recorded break is shorter or longer than the required duration (from the applicable Break Rule, or the scheduled break) by more than the threshold below.',
              <>
                <p className="font-medium mb-1">Example</p>
                <p>Threshold = <em>more than 10 minutes</em>. A 30-min meal break is required. Tom records only 14 min (16 min short) — flagged. A 45-min break (15 min long) — also flagged.</p>
              </>)}
            value={varianceEnabled(resolved.issues.flagBreakDurationVariance)}
            onChange={v => setField('issues', 'flagBreakDurationVariance', buildVariance(v, varianceMinutes(resolved.issues.flagBreakDurationVariance)))}
          />
          {varianceEnabled(resolved.issues.flagBreakDurationVariance) && (
            <SelectRow
              {...fieldProps('issues', 'flagBreakDurationVariance', 'Flag when break differs by',
                'How many minutes the recorded break may differ (short or long) from the required duration before a flag is raised.',
                <>
                  <p className="font-medium mb-1">Example</p>
                  <p>Set to <em>more than 10 minutes</em>. Required 30-min break taken in 22 min (8 min short) → no flag. Taken in 18 min (12 min short) → flagged.</p>
                  {varianceThresholdOptionGuide}
                </>)}
              value={String(varianceMinutes(resolved.issues.flagBreakDurationVariance))}
              options={thresholdOptions}
              onChange={v => setField('issues', 'flagBreakDurationVariance', buildVariance(true, Number(v)))}
            />
          )}
        </PermissionGroup>


        <PermissionGroup title="Behavioural Patterns">

          <SelectRow
            {...fieldProps('issues', 'flagBuddyPunching', 'Suspected Buddy Punching',
              'Detect when two staff clock in/out from the same device within seconds of each other — a classic indicator of one person punching for another.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Critical</em>. Two clock-ins from the same kiosk within 4 seconds on different staff IDs route the timesheets to HR for investigation before payroll.</p>{severityOptionGuide}</>)}
            value={resolved.issues.flagBuddyPunching}
            options={anomalySeverityOptions}
            onChange={v => setField('issues', 'flagBuddyPunching', v as TimesheetPolicy['issues']['flagBuddyPunching'])}
          />
          <SelectRow
            {...fieldProps('issues', 'flagIrregularPunchPattern', 'Irregular Punch Pattern',
              'Catch unusual punch sequences such as multiple clock-ins without a clock-out, rapid in/out cycles, or out-of-order timestamps.',
              <><p className="font-medium mb-1">Example</p><p>Severity = <em>Warning</em>. Mia clocks in, out, in, and out three times within 20 minutes. The pattern is flagged so a manager can confirm whether a device or training issue is to blame.</p>{severityOptionGuide}</>)}
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
        <TooltipContent side="top" className="max-w-sm text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------- Reusable "All options" guide ----------
function OptionGuide({ items }: { items: { label: string; description: string }[] }) {
  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <p className="font-medium mb-1.5">All options</p>
      <ul className="space-y-1.5">
        {items.map(o => (
          <li key={o.label}>
            <span className="font-medium text-foreground">{o.label}</span>
            <span className="text-muted-foreground"> — {o.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const severityOptionGuide = (
  <OptionGuide items={[
    { label: 'Off', description: 'Detection disabled. No flag is ever raised.' },
    { label: 'Info', description: 'Logged for reporting only. Does not affect approval.' },
    { label: 'Warning', description: 'Blocks auto-approval and surfaces to the reviewer.' },
    { label: 'Critical', description: 'As above, plus blocks submission when "Block on critical" is on.' },
  ]} />
);

const roundingOptionGuide = (
  <OptionGuide items={[
    { label: 'Never', description: 'Use the exact recorded time. No rounding applied.' },
    { label: 'Nearest 5 / 10 / 15 minutes', description: 'Round to the closest interval (fair split — half up, half down).' },
    { label: 'Round up to 15 minutes', description: 'Always round forward. Favours the employee on late starts, the employer on early ends.' },
    { label: 'Round down to 15 minutes', description: 'Always round backward. Strictest trim — may shave minutes off pay.' },
  ]} />
);

const earlyClockInOptionGuide = (
  <OptionGuide items={[
    { label: 'Not allowed', description: 'Clock-in is blocked until the scheduled start time.' },
    { label: 'Up to X minutes early', description: 'Allow a buffer (set below). Common for sites where staff need setup time.' },
    { label: 'Anytime before shift', description: 'No restriction. Use cautiously — can create unwanted early-start pay.' },
  ]} />
);

const autoApprovalOptionGuide = (
  <OptionGuide items={[
    { label: 'Never', description: 'Every timesheet goes through the approval chain manually.' },
    { label: 'On submission', description: 'Approves immediately when staff submit — fastest path, weakest control.' },
    { label: 'When matches scheduled shift', description: 'Approves only if actual times sit within the match tolerance of the roster.' },
    { label: 'Daily (end of day)', description: 'Batch-approves qualifying entries at end of day. Useful for high-volume sites.' },
  ]} />
);

const linkUnscheduledOptionGuide = (
  <OptionGuide items={[
    { label: 'Never', description: 'Unscheduled entries stay standalone — they always need manual review.' },
    { label: 'Best Fit (±8 hours)', description: 'Match to the nearest scheduled shift within an 8-hour window. Most forgiving.' },
    { label: 'Exact start/end match', description: 'Only link if start and end match the roster precisely. Strictest.' },
    { label: 'Same location/area only', description: 'Link any same-day shift at the same location, regardless of time drift.' },
  ]} />
);

const noShiftClockInActionGuide = (
  <OptionGuide items={[
    { label: 'Block the clock-in', description: 'Device refuses the punch and tells the staff member to contact their manager. Strongest cost control.' },
    { label: 'Allow and flag for review', description: 'Punch is accepted, timesheet is created and marked as unrostered so a manager must review it. Recommended default.' },
    { label: 'Allow without flagging', description: 'Punch is accepted silently. Only use where ad-hoc attendance is normal.' },
  ]} />
);

const rosterFlagSeverityGuide = (
  <OptionGuide items={[
    { label: 'No roster flag', description: 'Nothing appears on the roster grid — the entry lives only in timesheets.' },
    { label: 'Info', description: 'Neutral marker on the day cell. Visible, but not counted as an issue.' },
    { label: 'Warning', description: 'Amber "Unrostered" badge on the shift and a line item in the roster alerts panel.' },
    { label: 'Critical', description: 'Red badge plus a compliance alert — use where unrostered attendance breaches ratios or budget rules.' },
  ]} />
);

const createShiftGuide = (
  <OptionGuide items={[
    { label: 'Never', description: 'The roster stays as planned; the unrostered hours exist only as a timesheet.' },
    { label: 'On clock-in', description: 'A live shift appears immediately so the roster reflects who is on site right now. End time is provisional until clock-out.' },
    { label: 'On clock-out', description: 'The shift is written once both actual times are known — cleanest roster history.' },
    { label: 'On timesheet approval', description: 'Only approved unrostered hours reach the roster and budget actuals.' },
  ]} />
);

const endTimeRuleGuide = (
  <OptionGuide items={[
    { label: 'Actual clock-out time', description: 'Shift ends exactly when the staff member clocks out. Most accurate; requires a clock-out.' },
    { label: 'Clock-in + fixed duration', description: 'Assumes a standard shift length (e.g. 8h) from the punch. Good for live coverage views.' },
    { label: 'Location closing time', description: 'Ends at the location\'s operating close for that day. Suits sites with fixed trading hours.' },
    { label: 'Area default shift end', description: 'Uses the area\'s default shift pattern end time — keeps the grid aligned with normal shifts.' },
    { label: 'Leave open-ended', description: 'Shift shows as in-progress with no end until a clock-out arrives, then closes at the max duration cap.' },
  ]} />
);

const timeDriftOptionGuide = (
  <OptionGuide items={[
    { label: 'Never', description: 'No drift tolerance — times must align exactly to link.' },
    { label: 'Within 15 / 30 minutes', description: 'Small buffer for routine variation in clock-in habits.' },
    { label: 'Within 1 / 2 hours', description: 'Broad buffer for variable start times (e.g. on-call, callouts).' },
    { label: 'Within 4 hours', description: 'Very loose — useful only for fully ad-hoc rostering.' },
  ]} />
);

const paidMealOptionGuide = (
  <OptionGuide items={[
    { label: 'Never (unpaid)', description: 'Meal breaks are always unpaid (default for most awards).' },
    { label: 'Always paid', description: 'Meal breaks are always paid regardless of shift length.' },
  ]} />
);

function paidMealSummary(b: TimesheetPolicy['breaks']): string {
  if (b.paidMealBreaks === 'never') return 'Meal breaks are unpaid and deducted from paid time.';
  return 'Every meal break is paid and not deducted from paid time.';
}


const boundaryReferenceOptionGuide = (
  <OptionGuide items={[
    { label: 'Scheduled shift (per staff roster)', description: 'Tolerances measured against each staff member\'s rostered start/end. Use for roster-driven sites.' },
    { label: 'Operating window (location hours)', description: 'Tolerances measured against the location\'s open/close hours. Use for drop-in, open-floor, or kiosk sites without strict rosters.' },
  ]} />
);

const varianceThresholdOptionGuide = (
  <OptionGuide items={[
    { label: 'More than 5 minutes', description: 'Tight tolerance. Surfaces small drifts; can be noisy on busy sites.' },
    { label: 'More than 10 minutes', description: 'Balanced default. Catches genuine deviations without flooding reviewers.' },
    { label: 'More than 15 minutes', description: 'Lenient. Use when rounding is on at a 10–15 min step.' },
    { label: 'Any difference at all', description: 'Strictest — fires whenever actual ≠ scheduled. Use sparingly.' },
  ]} />
);


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
