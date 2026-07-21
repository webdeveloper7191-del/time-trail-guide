import { useMemo } from 'react';
import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CalendarClock,
  Moon,
  RotateCw,
  Timer,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { deriveAvailability, DerivedBlockKind } from '@/lib/availabilityDerivation';
import { format } from 'date-fns';

interface Props {
  staff: StaffMember;
}

const KIND_STYLES: Record<DerivedBlockKind, { badge: string; icon: JSX.Element }> = {
  rdo_scheduled:         { badge: 'bg-rose-50 text-rose-700 border-rose-200',   icon: <CalendarClock className="h-3.5 w-3.5" /> },
  ado_scheduled:         { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Timer className="h-3.5 w-3.5" /> },
  toil_leave:            { badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Timer className="h-3.5 w-3.5" /> },
  rotation_preferred:    { badge: 'bg-sky-50 text-sky-700 border-sky-200',      icon: <RotateCw className="h-3.5 w-3.5" /> },
  shift_worker_extended: { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Moon className="h-3.5 w-3.5" /> },
};

export function DerivedAvailabilityCard({ staff }: Props) {
  const summary = useMemo(() => deriveAvailability(staff), [staff]);
  const anyEnabled =
    summary.shiftWorker.enabled ||
    summary.rdo.optedIn ||
    summary.ado.optedIn ||
    summary.toil.optedIn;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Derived Availability — RDO / ADO / TOIL &amp; Shift Worker
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Auto-Schedule aware
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!anyEnabled && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No leave-accrual schemes or shift-worker flags enabled. The weekly availability
              above is the only source of scheduling constraints for this staff member.
            </AlertDescription>
          </Alert>
        )}

        {/* Shift Worker band */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Shift-worker eligibility
              </p>
              <Badge variant={summary.shiftWorker.enabled ? 'default' : 'secondary'} className="text-xs">
                {summary.shiftWorker.enabled ? 'Enabled' : 'Off'}
              </Badge>
            </div>
            <p className="text-sm font-medium">{summary.shiftWorker.eligibilityWindow}</p>
            {summary.shiftWorker.rotating && (
              <p className="text-xs text-muted-foreground mt-1">
                Rotating: {summary.shiftWorker.pattern} · cycle {summary.shiftWorker.cycleWeeks} wks
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              TOIL balance
            </p>
            <p className="text-2xl font-semibold">
              {summary.toil.balanceHours.toFixed(1)}
              <span className="text-sm text-muted-foreground font-normal"> hrs</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.toil.optedIn
                ? `${summary.toil.capHours ? `Cap ${summary.toil.capHours}h · ` : ''}${summary.toil.expiryDays ? `Expires in ${summary.toil.expiryDays}d` : 'No expiry'} · Requires approval to consume`
                : 'Not opted in'}
            </p>
          </div>
        </div>

        {/* RDO / ADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">RDO — Rostered Day Off</p>
              <Badge variant={summary.rdo.optedIn ? 'default' : 'secondary'} className="text-xs">
                {summary.rdo.optedIn ? `${summary.rdo.cycleWeeks}-wk cycle` : 'Off'}
              </Badge>
            </div>
            {summary.rdo.optedIn && summary.rdo.nextDates.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Upcoming scheduled RDO dates (hard block):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.rdo.nextDates.slice(0, 6).map(d => (
                    <Badge key={d} variant="outline" className={KIND_STYLES.rdo_scheduled.badge}>
                      {format(new Date(d), 'EEE d MMM')}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {summary.rdo.optedIn ? 'Set an anchor date to generate blocks.' : 'Not applicable.'}
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">ADO — Accrued Day Off</p>
              <Badge variant={summary.ado.optedIn ? 'default' : 'secondary'} className="text-xs">
                {summary.ado.optedIn ? (summary.ado.autoSchedule ? 'Auto-book' : 'On request') : 'Off'}
              </Badge>
            </div>
            {summary.ado.optedIn ? (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Balance {summary.ado.balanceHours.toFixed(1)}h
                  </span>
                  <span className="text-muted-foreground">
                    Target {summary.ado.targetHours}h
                  </span>
                </div>
                <Progress value={summary.ado.progressPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {summary.ado.progressPct >= 100
                    ? summary.ado.autoSchedule
                      ? 'Threshold reached — day off has been auto-booked.'
                      : 'Threshold reached — employee can request the day off.'
                    : `${(100 - summary.ado.progressPct).toFixed(0)}% remaining before next day off.`}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Not applicable.</p>
            )}
          </div>
        </div>

        {/* Precedence legend */}
        <div className="rounded-lg border bg-muted/10 p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Availability precedence applied by the scheduler
          </p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
            <li><span className="font-medium text-foreground">Approved leave</span> (incl. TOIL-drawn) — hard block</li>
            <li><span className="font-medium text-foreground">Scheduled RDO / auto-booked ADO</span> — hard block, override triggers a compliance alert</li>
            <li><span className="font-medium text-foreground">Staff-declared unavailability</span> — hard block</li>
            <li><span className="font-medium text-foreground">Rotating shift pattern</span> — soft preference (fairness penalty if broken)</li>
            <li><span className="font-medium text-foreground">Shift-worker eligibility</span> — expands allowable hours to 24/7</li>
            <li><span className="font-medium text-foreground">Weekly availability</span> — baseline window shown above</li>
          </ol>
        </div>

        {/* Derived blocks feed */}
        {summary.blocks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              System-generated overlays fed to Auto-Schedule
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {summary.blocks.map((b, i) => {
                const styles = KIND_STYLES[b.kind];
                return (
                  <div
                    key={`${b.kind}-${b.date}-${i}`}
                    className="flex items-start gap-3 text-xs border rounded-md p-2 bg-background"
                  >
                    <Badge variant="outline" className={`${styles.badge} flex items-center gap-1 shrink-0`}>
                      {styles.icon}
                      {b.severity === 'hard' ? 'Hard' : b.severity === 'soft' ? 'Soft' : 'Info'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.label}</p>
                      {b.detail && <p className="text-muted-foreground truncate">{b.detail}</p>}
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {format(new Date(b.date), 'd MMM')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
