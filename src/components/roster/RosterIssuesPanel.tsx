import { useMemo, useState, useEffect } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Bell, Mail, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Shift, StaffMember, Room, DemandData } from '@/types/roster';
import { format } from 'date-fns';
import {
  computeConflicts,
  computeAlerts,
  RosterConflict,
  RosterAlert,
} from '@/lib/roster/rosterIssueEngine';
import { rosterNotificationsStore, RosterNotification } from '@/lib/roster/rosterNotificationsStore';

interface RosterIssuesPanelProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  staff: StaffMember[];
  rooms?: Room[];
  demandData?: DemandData[];
  onNavigateToShift?: (shiftId: string) => void;
  /** Called when the user confirms an override with a reason for a soft conflict. */
  onOverride?: (conflict: RosterConflict, reason: string) => void;
}

export function RosterIssuesPanel({
  open,
  onClose,
  shifts,
  staff,
  rooms = [],
  demandData = [],
  onNavigateToShift,
  onOverride,
}: RosterIssuesPanelProps) {
  const [notifications, setNotifications] = useState<RosterNotification[]>(rosterNotificationsStore.all());
  const [overrideTarget, setOverrideTarget] = useState<RosterConflict | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => { const off = rosterNotificationsStore.subscribe(() => setNotifications(rosterNotificationsStore.all())); return () => { off(); }; }, []);

  const conflicts = useMemo(() => computeConflicts({ shifts, staff, rooms }), [shifts, staff, rooms]);
  const alerts = useMemo(() => computeAlerts({ shifts, staff, rooms, demandData }), [shifts, staff, rooms, demandData]);

  const blockingConflicts = conflicts.filter(c => c.severity === 'blocking');
  const overridableConflicts = conflicts.filter(c => c.severity === 'overridable');
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const confirmOverride = () => {
    if (!overrideTarget || !overrideReason.trim()) return;
    onOverride?.(overrideTarget, overrideReason.trim());
    setOverrideTarget(null);
    setOverrideReason('');
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Conflicts / Alerts / Notifications"
      description="Review issues that block publishing, risks to act on, and recent roster activity"
      icon={ShieldAlert}
      size="md"
      headerActions={
        <div className="flex items-center gap-2">
          {blockingConflicts.length > 0 && (
            <Badge className="bg-destructive/10 text-destructive border border-destructive/30 rounded-full px-3">
              {blockingConflicts.length} blocking
            </Badge>
          )}
          {alerts.length > 0 && (
            <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-300 dark:border-amber-700 rounded-full px-3">
              {alerts.length} alerts
            </Badge>
          )}
        </div>
      }
      showFooter={false}
    >
      {overrideTarget && (
        <div className="mb-4 p-3 rounded-lg border bg-amber-500/5 border-amber-500/30">
          <p className="text-sm font-medium mb-2">Override reason required</p>
          <p className="text-xs text-muted-foreground mb-2">{overrideTarget.reason}</p>
          <Textarea
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
            placeholder="Why is this being overridden?"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="ghost" onClick={() => { setOverrideTarget(null); setOverrideReason(''); }}>Cancel</Button>
            <Button size="sm" disabled={!overrideReason.trim()} onClick={confirmOverride}>Confirm override</Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="conflicts">
        <TabsList className="grid w-full grid-cols-3 bg-background border p-1 rounded-lg">
          <TabsTrigger value="conflicts" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Conflicts ({conflicts.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Notifications {unreadNotifications > 0 ? `(${unreadNotifications})` : ''}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-3">
          <TabsContent value="conflicts" className="space-y-3 m-0">
            <FormSection title="Conflicts">
              {conflicts.length === 0 ? (
                <EmptyState message="No conflicts — the roster looks valid." />
              ) : (
                <div className="space-y-3">
                  {conflicts.map(conflict => (
                    <ConflictRow
                      key={conflict.id}
                      conflict={conflict}
                      onNavigate={() => onNavigateToShift?.(conflict.shiftId)}
                      onOverride={() => setOverrideTarget(conflict)}
                    />
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-3 m-0">
            <FormSection title="Alerts">
              {alerts.length === 0 ? (
                <EmptyState message="No alerts right now." />
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <AlertRow key={alert.id} alert={alert} onNavigate={() => alert.shiftId && onNavigateToShift?.(alert.shiftId)} />
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 m-0">
            <FormSection title="Notifications">
              {notifications.length === 0 ? (
                <EmptyState message="No notifications yet." icon={Mail} />
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onMarkRead={() => rosterNotificationsStore.markRead(n.id)}
                      onNavigate={() => n.shiftId && onNavigateToShift?.(n.shiftId)}
                    />
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>
        </div>
      </Tabs>
    </PrimaryOffCanvas>
  );
}

function EmptyState({ message, icon: Icon = CheckCircle2 }: { message: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-background rounded-lg border">
      <Icon className="h-12 w-12 text-emerald-500 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ConflictRow({
  conflict,
  onNavigate,
  onOverride,
}: {
  conflict: RosterConflict;
  onNavigate: () => void;
  onOverride: () => void;
}) {
  const blocking = conflict.severity === 'blocking';
  return (
    <div
      className={cn(
        'p-4 rounded-lg transition-all bg-background border',
        blocking ? 'bg-destructive/5 border-destructive/30' : 'bg-amber-500/5 border-amber-500/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-lg shrink-0', blocking ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600')}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-foreground">{conflict.reason}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{conflict.staffName} · {conflict.date}</p>
            </div>
            <Badge
              className={cn(
                'shrink-0 text-xs rounded-full px-3',
                blocking
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 border border-red-300 dark:border-red-700'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-300 dark:border-amber-700'
              )}
            >
              {blocking ? 'Blocking' : 'Overridable'}
            </Badge>
          </div>
          {conflict.details && <p className="text-xs mt-2 text-muted-foreground">{conflict.details}</p>}
          <div className="flex items-center justify-end gap-2 mt-3">
            {!blocking && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onOverride}>
                Override with reason
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10" onClick={onNavigate}>
              Go to shift
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ alert, onNavigate }: { alert: RosterAlert; onNavigate: () => void }) {
  const red = alert.urgency === 'red';
  return (
    <div className={cn('p-4 rounded-lg transition-all bg-background border', red ? 'bg-destructive/5 border-destructive/30' : 'bg-amber-500/5 border-amber-500/30')}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-lg shrink-0', red ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600')}>
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{alert.reason}</p>
          {alert.staffName && <p className="text-xs mt-0.5 text-muted-foreground">{alert.staffName}{alert.date ? ` · ${alert.date}` : ''}</p>}
          {alert.shiftId && (
            <div className="flex items-center justify-end mt-3">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10" onClick={onNavigate}>
                Go to shift
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  onNavigate,
}: {
  notification: RosterNotification;
  onMarkRead: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className={cn('p-3 rounded-lg border transition-colors', notification.read ? 'bg-background' : 'bg-primary/5 border-primary/20')} onClick={onMarkRead}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{notification.title}</p>
        <span className="text-xs text-muted-foreground shrink-0">{format(new Date(notification.timestamp), 'MMM d, h:mm a')}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
      {notification.shiftId && (
        <div className="flex items-center justify-end mt-2">
          <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); onNavigate(); }}>
            Go to shift
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
