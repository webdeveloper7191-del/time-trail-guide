import { useState, useMemo } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle2, 
  X,
  TrendingUp,
  Calendar,
  Shield,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, RosterComplianceFlag } from '@/types/roster';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';

interface Alert {
  id: string;
  type: 'budget' | 'overtime' | 'compliance' | 'coverage' | 'agency' | 'recurring';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface AlertNotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  staff: StaffMember[];
  complianceFlags: RosterComplianceFlag[];
  weeklyBudget: number;
  totalCost: number;
  centreId: string;
}

export function AlertNotificationsPanel({
  open,
  onClose,
  shifts,
  staff,
  complianceFlags,
  weeklyBudget,
  totalCost,
  centreId,
}: AlertNotificationsPanelProps) {
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    const alertList: Alert[] = [];
    const now = new Date();

    // Budget alerts
    const budgetPercent = (totalCost / weeklyBudget) * 100;
    if (budgetPercent >= 100) {
      alertList.push({
        id: 'budget-over',
        type: 'budget',
        severity: 'critical',
        title: 'Over Budget',
        message: `Weekly labor cost ($${totalCost.toLocaleString()}) has exceeded budget ($${weeklyBudget.toLocaleString()}) by ${Math.round(budgetPercent - 100)}%`,
        timestamp: now,
        read: readAlerts.has('budget-over'),
        actionLabel: 'Review Shifts',
      });
    } else if (budgetPercent >= 90) {
      alertList.push({
        id: 'budget-near',
        type: 'budget',
        severity: 'warning',
        title: 'Approaching Budget Limit',
        message: `Weekly labor cost is at ${Math.round(budgetPercent)}% of budget. $${(weeklyBudget - totalCost).toLocaleString()} remaining.`,
        timestamp: now,
        read: readAlerts.has('budget-near'),
      });
    }

    // Overtime alerts
    const centreShifts = shifts.filter(s => s.centreId === centreId);
    const staffHours: Record<string, number> = {};
    centreShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      staffHours[shift.staffId] = (staffHours[shift.staffId] || 0) + hours;
    });

    const overtimeStaff = Object.entries(staffHours)
      .filter(([staffId, hours]) => {
        const member = staff.find(s => s.id === staffId);
        return member && hours > member.maxHoursPerWeek;
      })
      .map(([staffId, hours]) => {
        const member = staff.find(s => s.id === staffId)!;
        return { name: member.name, overtime: Math.round((hours - member.maxHoursPerWeek) * 10) / 10 };
      });

    if (overtimeStaff.length > 0) {
      alertList.push({
        id: 'overtime-excess',
        type: 'overtime',
        severity: 'warning',
        title: 'Overtime Hours Detected',
        message: `${overtimeStaff.length} staff member(s) exceeding regular hours: ${overtimeStaff.map(s => `${s.name} (+${s.overtime}h)`).join(', ')}`,
        timestamp: now,
        read: readAlerts.has('overtime-excess'),
        actionLabel: 'Review',
      });
    }

    // Compliance alerts from flags
    const centreFlags = complianceFlags.filter(f => f.centreId === centreId);
    const criticalFlags = centreFlags.filter(f => f.severity === 'critical');
    const warningFlags = centreFlags.filter(f => f.severity === 'warning');

    criticalFlags.forEach((flag, idx) => {
      alertList.push({
        id: `compliance-critical-${idx}`,
        type: 'compliance',
        severity: 'critical',
        title: flag.message,
        message: `Room ${flag.roomId} on ${flag.date}: ${flag.type} violation`,
        timestamp: now,
        read: readAlerts.has(`compliance-critical-${idx}`),
        actionLabel: 'Fix Now',
      });
    });

    warningFlags.forEach((flag, idx) => {
      alertList.push({
        id: `compliance-warning-${idx}`,
        type: 'compliance',
        severity: 'warning',
        title: flag.message,
        message: `Room ${flag.roomId} on ${flag.date}`,
        timestamp: now,
        read: readAlerts.has(`compliance-warning-${idx}`),
      });
    });

    // Agency staff alert
    const agencyShiftCount = centreShifts.filter(s => staff.find(st => st.id === s.staffId)?.agency).length;
    const agencyPercent = (agencyShiftCount / Math.max(1, centreShifts.length)) * 100;
    if (agencyPercent > 25) {
      alertList.push({
        id: 'agency-high',
        type: 'agency',
        severity: 'warning',
        title: 'High Agency Usage',
        message: `${Math.round(agencyPercent)}% of shifts are filled by agency staff. Consider internal coverage.`,
        timestamp: now,
        read: readAlerts.has('agency-high'),
      });
    }

    // Recurring shift expiry alerts
    const seriesMap = new Map<string, { shifts: Shift[]; staffName: string }>();
    centreShifts.forEach(shift => {
      if (shift.recurring?.isRecurring && shift.recurring.recurrenceGroupId) {
        const groupId = shift.recurring.recurrenceGroupId;
        if (!seriesMap.has(groupId)) {
          const staffMember = staff.find(s => s.id === shift.staffId);
          seriesMap.set(groupId, { shifts: [], staffName: staffMember?.name || 'Unknown' });
        }
        seriesMap.get(groupId)!.shifts.push(shift);
      }
    });

    seriesMap.forEach((data, groupId) => {
      const { shifts: seriesShifts, staffName } = data;
      const sortedShifts = seriesShifts.sort((a, b) => 
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      
      const firstShift = sortedShifts[0];
      const lastShift = sortedShifts[sortedShifts.length - 1];
      
      const futureShifts = sortedShifts.filter(s => isAfter(parseISO(s.date), now) || format(parseISO(s.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'));
      const remainingCount = futureShifts.length;

      // Check if ending within 14 days
      const endDate = firstShift.recurring?.endDate;
      if (endDate) {
        const daysUntilEnd = differenceInDays(parseISO(endDate), now);
        if (daysUntilEnd <= 14 && daysUntilEnd >= 0) {
          alertList.push({
            id: `recurring-expiry-${groupId}`,
            type: 'recurring',
            severity: daysUntilEnd <= 7 ? 'critical' : 'warning',
            title: 'Recurring Series Ending Soon',
            message: `${staffName}'s recurring shift series ends in ${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''} (${remainingCount} shifts remaining)`,
            timestamp: now,
            read: readAlerts.has(`recurring-expiry-${groupId}`),
            actionLabel: 'Extend Series',
          });
        }
      } else if (firstShift.recurring?.endType === 'after_occurrences') {
        // Check if only a few occurrences left
        if (remainingCount <= 3 && remainingCount > 0) {
          alertList.push({
            id: `recurring-low-${groupId}`,
            type: 'recurring',
            severity: remainingCount === 1 ? 'critical' : 'warning',
            title: 'Recurring Series Almost Complete',
            message: `${staffName}'s recurring shift series has ${remainingCount} shift${remainingCount !== 1 ? 's' : ''} remaining`,
            timestamp: now,
            read: readAlerts.has(`recurring-low-${groupId}`),
            actionLabel: 'Extend Series',
          });
        }
      }
    });

    return alertList.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [shifts, staff, complianceFlags, weeklyBudget, totalCost, centreId, readAlerts]);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (alertId: string) => {
    setReadAlerts(prev => new Set([...prev, alertId]));
  };

  const markAllAsRead = () => {
    setReadAlerts(new Set(alerts.map(a => a.id)));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'budget': return DollarSign;
      case 'overtime': return TrendingUp;
      case 'compliance': return Shield;
      case 'coverage': return Calendar;
      case 'agency': return Users;
      case 'recurring': return RefreshCw;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 border-destructive text-destructive';
      case 'warning': return 'bg-amber-500/10 border-amber-500 text-amber-600';
      default: return 'bg-primary/10 border-primary text-primary';
    }
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Alerts & Notifications"
      description="Monitor budget, compliance, and scheduling alerts"
      icon={Bell}
      size="sm"
      headerActions={
        unreadCount > 0 ? <Badge variant="destructive">{unreadCount} new</Badge> : null
      }
      showFooter={false}
    >
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="warnings">Warnings</TabsTrigger>
          </TabsList>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <TabsContent value="all" className="space-y-3 m-0">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <p className="font-medium">All Clear!</p>
              <p className="text-sm text-muted-foreground">No alerts at this time</p>
            </div>
          ) : (
            alerts.map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                getIcon={getAlertIcon}
                getSeverityColor={getSeverityColor}
                onMarkRead={() => markAsRead(alert.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-3 m-0">
          {alerts.filter(a => a.severity === 'critical').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <p className="text-sm text-muted-foreground">No critical alerts</p>
            </div>
          ) : (
            alerts.filter(a => a.severity === 'critical').map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                getIcon={getAlertIcon}
                getSeverityColor={getSeverityColor}
                onMarkRead={() => markAsRead(alert.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="warnings" className="space-y-3 m-0">
          {alerts.filter(a => a.severity === 'warning').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <p className="text-sm text-muted-foreground">No warnings</p>
            </div>
          ) : (
            alerts.filter(a => a.severity === 'warning').map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                getIcon={getAlertIcon}
                getSeverityColor={getSeverityColor}
                onMarkRead={() => markAsRead(alert.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
}

interface AlertItemProps {
  alert: Alert;
  getIcon: (type: Alert['type']) => React.ElementType;
  getSeverityColor: (severity: Alert['severity']) => string;
  onMarkRead: () => void;
}

function AlertItem({ alert, getIcon, getSeverityColor, onMarkRead }: AlertItemProps) {
  const Icon = getIcon(alert.type);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        getSeverityColor(alert.severity),
        !alert.read && "ring-2 ring-offset-2 ring-offset-background",
        alert.read && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          alert.severity === 'critical' ? 'bg-destructive/20' : 
          alert.severity === 'warning' ? 'bg-amber-500/20' : 'bg-primary/20'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm">{alert.title}</p>
            {!alert.read && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onMarkRead}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs mt-1 opacity-80">{alert.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-60">
              {format(alert.timestamp, 'h:mm a')}
            </span>
            {alert.actionLabel && (
              <Button variant="outline" size="sm" className="h-6 text-xs">
                {alert.actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
