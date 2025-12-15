import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { StatusBadge } from './StatusBadge';
import { CompliancePanel } from './CompliancePanel';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { OvertimeBreakdown } from './OvertimeBreakdown';
import { AllowancesPanel } from './AllowancesPanel';
import { validateCompliance, calculateOvertime, determineApprovalChain, defaultJurisdiction } from '@/lib/complianceEngine';
import { calculateAllowanceTotal } from '@/types/allowances';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Coffee,
  DollarSign,
  TrendingUp,
  Timer,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TimesheetDetailModalProps {
  timesheet: Timesheet | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function TimesheetDetailModal({
  timesheet,
  open,
  onClose,
  onApprove,
  onReject,
}: TimesheetDetailModalProps) {
const [expandedDays, setExpandedDays] = useState<string[]>([]);

  // Compliance validation
  const compliance = useMemo(() => 
    timesheet ? validateCompliance(timesheet) : null, 
    [timesheet]
  );

  // Overtime calculation
  const overtimeCalc = useMemo(() => 
    timesheet && timesheet.employee.hourlyRate 
      ? calculateOvertime(timesheet, timesheet.employee.hourlyRate)
      : null,
    [timesheet]
  );

  // Approval chain
  const approvalChain = useMemo(() => 
    timesheet && compliance ? determineApprovalChain(timesheet, compliance) : null,
    [timesheet, compliance]
  );

  if (!timesheet) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'EEEE');
  };

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getBreakTypeBadge = (type: BreakEntry['type']) => {
    const config = {
      lunch: { label: 'Lunch', className: 'bg-orange-100 text-orange-700' },
      short: { label: 'Short', className: 'bg-blue-100 text-blue-700' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-700' },
    };
    return config[type];
  };

  const toggleDayExpanded = (entryId: string) => {
    setExpandedDays((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const estimatedPay = timesheet.employee.hourlyRate
    ? (timesheet.regularHours * timesheet.employee.hourlyRate) +
      (timesheet.overtimeHours * timesheet.employee.hourlyRate * 1.5)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Timesheet Details</span>
            <StatusBadge status={timesheet.status} />
          </DialogTitle>
          <DialogDescription>
            Review timesheet for {timesheet.employee.name} - Week of {format(new Date(timesheet.weekStartDate), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-center gap-4">
                <Avatar className={`h-14 w-14 ${getAvatarColor(timesheet.employee.name)}`}>
                  <AvatarFallback className="text-white text-lg font-medium">
                    {getInitials(timesheet.employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{timesheet.employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{timesheet.employee.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {timesheet.employee.position} • {timesheet.employee.department}
                  </p>
                </div>
                {timesheet.employee.hourlyRate && (
                  <Badge variant="secondary" className="text-sm">
                    ${timesheet.employee.hourlyRate}/hr
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Week Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Week:</span>
                  <span className="font-medium">
                    {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
                    {format(new Date(timesheet.weekEndDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{timesheet.location.name}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Timer className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-card-foreground">{timesheet.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Net Hours</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold text-card-foreground">{timesheet.regularHours}h</p>
                  <p className="text-xs text-muted-foreground">Regular</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-status-pending" />
                  <p className="text-2xl font-bold text-status-pending">{timesheet.overtimeHours}h</p>
                  <p className="text-xs text-muted-foreground">Overtime</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Coffee className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-card-foreground">
                    {formatMinutesToTime(timesheet.totalBreakMinutes)}
                  </p>
                  <p className="text-xs text-muted-foreground">Breaks</p>
                </div>
              </div>

              {/* Compliance Summary */}
              {compliance && (
                <CompliancePanel validation={compliance} compact />
              )}

              {/* Estimated Pay with Advanced Breakdown */}
              {overtimeCalc && timesheet.employee.hourlyRate && (
                <OvertimeBreakdown 
                  calculation={overtimeCalc} 
                  hourlyRate={timesheet.employee.hourlyRate} 
                />
              )}
            </TabsContent>

            <TabsContent value="entries" className="space-y-3">
              {timesheet.entries.map((entry) => {
                const isExpanded = expandedDays.includes(entry.id);
                const hasIssue = !entry.clockOut || entry.netHours === 0;
                
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'rounded-lg border border-border overflow-hidden transition-all',
                      hasIssue && 'border-status-rejected/50 bg-status-rejected-bg/30'
                    )}
                  >
                    <button
                      onClick={() => toggleDayExpanded(entry.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{getDayName(entry.date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {hasIssue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Issue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Clock In</p>
                          <p className="font-medium">{entry.clockIn}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Clock Out</p>
                          <p className={cn('font-medium', !entry.clockOut && 'text-status-rejected')}>
                            {entry.clockOut || 'Missing'}
                          </p>
                        </div>
                        <div className="text-center min-w-[50px]">
                          <p className="text-muted-foreground text-xs">Net</p>
                          <p className="font-medium">{entry.netHours}h</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
                        {/* Time Details */}
                        <div className="grid grid-cols-4 gap-4 py-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Gross Hours</p>
                            <p className="font-medium">{entry.grossHours}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Break Time</p>
                            <p className="font-medium">{formatMinutesToTime(entry.totalBreakMinutes)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Net Hours</p>
                            <p className="font-medium">{entry.netHours}h</p>
                          </div>
                          {entry.overtime > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Overtime</p>
                              <p className="font-medium text-status-pending">+{entry.overtime}h</p>
                            </div>
                          )}
                        </div>

                        {/* Breaks */}
                        {entry.breaks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Coffee className="h-3 w-3" /> Breaks
                            </p>
                            <div className="space-y-2">
                              {entry.breaks.map((breakEntry) => {
                                const badgeConfig = getBreakTypeBadge(breakEntry.type);
                                return (
                                  <div
                                    key={breakEntry.id}
                                    className="flex items-center justify-between bg-background rounded-md px-3 py-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge className={cn('text-xs', badgeConfig.className)}>
                                        {badgeConfig.label}
                                      </Badge>
                                      <span>
                                        {breakEntry.startTime} - {breakEntry.endTime || 'Ongoing'}
                                      </span>
                                    </div>
                                    <span className="font-medium">
                                      {formatMinutesToTime(breakEntry.duration)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {entry.breaks.length === 0 && (
                          <p className="text-sm text-muted-foreground italic mt-2">
                            No breaks recorded
                          </p>
                        )}

                        {/* Notes */}
                        {entry.notes && (
                          <div className="mt-3 flex items-start gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              {compliance && (
                <CompliancePanel validation={compliance} />
              )}

              {/* Jurisdiction Info */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Active Compliance Rules
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jurisdiction</p>
                    <p className="font-medium">{defaultJurisdiction.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Daily Hours</p>
                    <p className="font-medium">{defaultJurisdiction.maxDailyHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Weekly Hours</p>
                    <p className="font-medium">{defaultJurisdiction.maxWeeklyHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">OT Threshold</p>
                    <p className="font-medium">&gt;{defaultJurisdiction.overtimeThresholdDaily}h/day or &gt;{defaultJurisdiction.overtimeThresholdWeekly}h/week</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Required Breaks</p>
                  <div className="space-y-1">
                    {defaultJurisdiction.breakRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-sm">
                        <span>{rule.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {rule.breakDurationMinutes}m after {rule.minWorkHoursRequired}h • {rule.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-4">
              {approvalChain && (
                <ApprovalWorkflow 
                  chain={approvalChain}
                  isAdmin={true}
                  onApprove={() => onApprove?.(timesheet.id)}
                  onReject={() => onReject?.(timesheet.id)}
                />
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              {/* Submission Info */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-3">Submission Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted At:</span>
                    <span>{format(new Date(timesheet.submittedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {timesheet.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed At:</span>
                      <span>{format(new Date(timesheet.reviewedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {timesheet.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed By:</span>
                      <span>{timesheet.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-3">Hours Breakdown</h4>
                <div className="space-y-2">
                  {timesheet.entries.map((entry) => (
                    <div key={entry.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(entry.date), 'EEE, MMM d')}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>{entry.netHours}h</span>
                        {entry.overtime > 0 && (
                          <span className="text-status-pending text-xs">+{entry.overtime}h OT</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{timesheet.totalHours}h</span>
                  </div>
                </div>
              </div>

              {/* Allowances Section */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Allowances & Entitlements
                </h4>
                <AllowancesPanel 
                  allowances={timesheet.appliedAllowances || []} 
                  awardType={timesheet.awardType}
                />
              </div>

              {/* Pay Summary */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Total Pay Summary
                </h4>
                <div className="space-y-2 text-sm">
                  {overtimeCalc && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular Pay</span>
                        <span>${overtimeCalc.regularPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime Pay</span>
                        <span>${overtimeCalc.overtimePay.toFixed(2)}</span>
                      </div>
                      {overtimeCalc.doubleTimePay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Double Time Pay</span>
                          <span>${overtimeCalc.doubleTimePay.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances</span>
                    <span>${calculateAllowanceTotal(timesheet.appliedAllowances || []).toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Estimated Total</span>
                    <span className="text-primary">
                      ${((overtimeCalc?.totalPay || 0) + calculateAllowanceTotal(timesheet.appliedAllowances || [])).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {timesheet.notes && (
                <div className="flex items-start gap-2 p-4 rounded-lg bg-status-rejected-bg">
                  <AlertCircle className="h-5 w-5 text-status-rejected mt-0.5" />
                  <div>
                    <p className="font-medium text-status-rejected">Review Notes</p>
                    <p className="text-sm text-foreground mt-1">{timesheet.notes}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Actions for Pending */}
        {timesheet.status === 'pending' && (
          <>
            <Separator />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onReject?.(timesheet.id)}
                className="text-status-rejected border-status-rejected hover:bg-status-rejected-bg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove?.(timesheet.id)}
                className="bg-status-approved hover:bg-status-approved/90"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
