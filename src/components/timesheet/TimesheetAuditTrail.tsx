import { useMemo } from 'react';
import { Timesheet } from '@/types/timesheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  FileText,
  User,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  timesheetId: string;
  employeeName: string;
  action: 'submitted' | 'approved' | 'rejected' | 'edited' | 'flagged' | 'auto_approved';
  timestamp: string;
  performedBy: string;
  details?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

interface TimesheetAuditTrailProps {
  timesheets: Timesheet[];
}

export function TimesheetAuditTrail({ timesheets }: TimesheetAuditTrailProps) {
  // Generate mock audit entries from timesheets
  const auditEntries = useMemo(() => {
    const entries: AuditEntry[] = [];
    
    timesheets.forEach(ts => {
      // Submitted entry
      entries.push({
        id: `${ts.id}-submitted`,
        timesheetId: ts.id,
        employeeName: ts.employee.name,
        action: 'submitted',
        timestamp: ts.submittedAt,
        performedBy: ts.employee.name,
        details: `Timesheet for ${format(parseISO(ts.weekStartDate), 'MMM d')} - ${format(parseISO(ts.weekEndDate), 'MMM d')} submitted`,
      });

      // Review entry if reviewed
      if (ts.reviewedAt) {
        entries.push({
          id: `${ts.id}-reviewed`,
          timesheetId: ts.id,
          employeeName: ts.employee.name,
          action: ts.status === 'approved' ? 'approved' : 'rejected',
          timestamp: ts.reviewedAt,
          performedBy: ts.reviewedBy || 'System',
          details: ts.status === 'approved' 
            ? `Approved ${ts.totalHours}h total (${ts.overtimeHours}h overtime)`
            : `Rejected - requires revision`,
        });
      }
    });

    // Sort by timestamp descending
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [timesheets]);

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'submitted':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'edited':
        return <Edit3 className="h-4 w-4" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4" />;
      case 'auto_approved':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: AuditEntry['action']) => {
    switch (action) {
      case 'approved':
      case 'auto_approved':
        return 'text-status-approved bg-status-approved/10';
      case 'rejected':
        return 'text-status-rejected bg-status-rejected/10';
      case 'flagged':
        return 'text-status-pending bg-status-pending/10';
      case 'submitted':
        return 'text-primary bg-primary/10';
      case 'edited':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getActionLabel = (action: AuditEntry['action']) => {
    switch (action) {
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'edited':
        return 'Edited';
      case 'flagged':
        return 'Flagged';
      case 'auto_approved':
        return 'Auto-Approved';
      default:
        return action;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {auditEntries.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                      getActionColor(entry.action)
                    )}
                  >
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                entry.action === 'approved' && "border-status-approved/30 text-status-approved",
                                entry.action === 'rejected' && "border-status-rejected/30 text-status-rejected",
                                entry.action === 'submitted' && "border-primary/30 text-primary",
                                entry.action === 'flagged' && "border-status-pending/30 text-status-pending"
                              )}
                            >
                              {getActionLabel(entry.action)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })}
                            </span>
                          </div>

                          <p className="font-medium text-sm text-card-foreground">
                            {entry.employeeName}'s timesheet
                          </p>

                          {entry.details && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.details}
                            </p>
                          )}

                          {entry.changes && entry.changes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {entry.changes.map((change, i) => (
                                <div key={i} className="text-xs text-muted-foreground">
                                  <span className="font-medium">{change.field}:</span>{' '}
                                  <span className="line-through">{change.oldValue}</span>
                                  {' → '}
                                  <span className="text-foreground">{change.newValue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {getInitials(entry.performedBy)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {entry.performedBy}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(entry.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
