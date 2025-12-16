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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  ShieldCheck,
  GitBranch,
  Briefcase,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

  const compliance = useMemo(() => 
    timesheet ? validateCompliance(timesheet) : null, 
    [timesheet]
  );

  const overtimeCalc = useMemo(() => 
    timesheet && timesheet.employee.hourlyRate 
      ? calculateOvertime(timesheet, timesheet.employee.hourlyRate)
      : null,
    [timesheet]
  );

  const approvalChain = useMemo(() => 
    timesheet && compliance ? determineApprovalChain(timesheet, compliance) : null,
    [timesheet, compliance]
  );

  if (!timesheet) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getDayName = (dateStr: string) => format(new Date(dateStr), 'EEE');
  const getDayDate = (dateStr: string) => format(new Date(dateStr), 'd');

  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getBreakTypeBadge = (type: BreakEntry['type']) => {
    const config = {
      lunch: { label: 'Lunch', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
      short: { label: 'Short', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      other: { label: 'Other', className: 'bg-muted text-muted-foreground' },
    };
    return config[type];
  };

  const toggleDayExpanded = (entryId: string) => {
    setExpandedDays((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Timesheet Details</SheetTitle>
            <StatusBadge status={timesheet.status} />
          </div>
          <SheetDescription className="sr-only">
            Timesheet for {timesheet.employee.name}
          </SheetDescription>
        </SheetHeader>

        {/* Employee Card */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials(timesheet.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{timesheet.employee.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{timesheet.employee.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {timesheet.employee.position}
                </Badge>
                {timesheet.employee.hourlyRate && (
                  <Badge variant="outline" className="text-xs font-normal">
                    ${timesheet.employee.hourlyRate}/hr
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-xl font-bold">{timesheet.totalHours}h</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Total</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-xl font-bold">{timesheet.regularHours}h</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Regular</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-xl font-bold text-amber-600">{timesheet.overtimeHours}h</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Overtime</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-xl font-bold">{formatMinutesToTime(timesheet.totalBreakMinutes)}</p>
              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Breaks</p>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="entries" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start px-6 pt-2 pb-0 h-auto bg-transparent border-b border-border rounded-none gap-0">
            <TabsTrigger value="entries" className="rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Entries
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="workflow" className="rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <GitBranch className="h-3.5 w-3.5 mr-1.5" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              Pay
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="entries" className="m-0 p-4 space-y-2">
              {/* Week info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(timesheet.weekStartDate), 'MMM d')} - {format(new Date(timesheet.weekEndDate), 'MMM d')}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {timesheet.location.name}
                </div>
              </div>

              {timesheet.entries.map((entry) => {
                const isExpanded = expandedDays.includes(entry.id);
                const hasIssue = !entry.clockOut || entry.netHours === 0;
                
                return (
                  <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => toggleDayExpanded(entry.id)}>
                    <CollapsibleTrigger className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      "hover:bg-muted/50",
                      hasIssue ? "border-amber-500/50 bg-amber-500/5" : "border-border",
                      isExpanded && "rounded-b-none border-b-0"
                    )}>
                      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">{getDayName(entry.date)}</span>
                        <span className="text-sm font-bold -mt-0.5">{getDayDate(entry.date)}</span>
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{entry.clockIn}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn("font-medium", !entry.clockOut && "text-amber-600")}>
                            {entry.clockOut || '--:--'}
                          </span>
                          {hasIssue && <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.breaks.length} break{entry.breaks.length !== 1 ? 's' : ''} · {formatMinutesToTime(entry.totalBreakMinutes)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{entry.netHours}h</p>
                        {entry.overtime > 0 && (
                          <p className="text-xs text-amber-600">+{entry.overtime} OT</p>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className={cn(
                        "px-3 pb-3 pt-3 space-y-3 border border-t-0 rounded-b-lg",
                        hasIssue ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-muted/20"
                      )}>
                        {/* Hours detail */}
                        <div className="flex items-center justify-between text-xs bg-background rounded-md px-3 py-2">
                          <span className="text-muted-foreground">Gross: <span className="text-foreground font-medium">{entry.grossHours}h</span></span>
                          <span className="text-muted-foreground">Breaks: <span className="text-foreground font-medium">{formatMinutesToTime(entry.totalBreakMinutes)}</span></span>
                          <span className="text-muted-foreground">Net: <span className="text-foreground font-medium">{entry.netHours}h</span></span>
                        </div>

                        {/* Breaks */}
                        {entry.breaks.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Coffee className="h-3.5 w-3.5" /> Breaks
                            </p>
                            <div className="space-y-1.5">
                              {entry.breaks.map((breakEntry) => {
                                const badgeConfig = getBreakTypeBadge(breakEntry.type);
                                return (
                                  <div key={breakEntry.id} className="flex items-center justify-between bg-background rounded-md px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={cn('text-xs', badgeConfig.className)}>
                                        {badgeConfig.label}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {breakEntry.startTime} - {breakEntry.endTime || 'Ongoing'}
                                      </span>
                                    </div>
                                    <span className="font-medium">{formatMinutesToTime(breakEntry.duration)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {entry.breaks.length === 0 && (
                          <p className="text-xs text-muted-foreground italic text-center py-1">No breaks recorded</p>
                        )}

                        {entry.notes && (
                          <div className="flex items-start gap-2 text-sm bg-background rounded-md px-3 py-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground text-xs">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </TabsContent>

            <TabsContent value="compliance" className="m-0 p-4 space-y-4">
              {compliance && <CompliancePanel validation={compliance} />}
              
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Active Compliance Rules
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Daily</p>
                    <p className="font-medium">{defaultJurisdiction.maxDailyHours}h</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Weekly</p>
                    <p className="font-medium">{defaultJurisdiction.maxWeeklyHours}h</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">OT Daily</p>
                    <p className="font-medium">&gt;{defaultJurisdiction.overtimeThresholdDaily}h</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">OT Weekly</p>
                    <p className="font-medium">&gt;{defaultJurisdiction.overtimeThresholdWeekly}h</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="m-0 p-4 space-y-4">
              {approvalChain && (
                <ApprovalWorkflow 
                  chain={approvalChain}
                  isAdmin={true}
                  onApprove={() => onApprove?.(timesheet.id)}
                  onReject={() => onReject?.(timesheet.id)}
                />
              )}
            </TabsContent>

            <TabsContent value="summary" className="m-0 p-4 space-y-4">
              {/* Submission Info */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm">Submission Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(new Date(timesheet.submittedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {timesheet.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed</span>
                      <span>{format(new Date(timesheet.reviewedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {timesheet.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed By</span>
                      <span>{timesheet.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm">Hours Breakdown</h4>
                <div className="space-y-1.5">
                  {timesheet.entries.map((entry) => (
                    <div key={entry.id} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">
                        {format(new Date(entry.date), 'EEE, MMM d')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{entry.netHours}h</span>
                        {entry.overtime > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-600/30">
                            +{entry.overtime}h OT
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allowances */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Allowances
                </h4>
                <AllowancesPanel 
                  allowances={timesheet.appliedAllowances || []} 
                  awardType={timesheet.awardType}
                />
              </div>

              {/* Pay Summary */}
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
                <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Estimated Pay
                </h4>
                <div className="space-y-2 text-sm">
                  {overtimeCalc && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular</span>
                        <span>${overtimeCalc.regularPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime</span>
                        <span>${overtimeCalc.overtimePay.toFixed(2)}</span>
                      </div>
                      {overtimeCalc.doubleTimePay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Double Time</span>
                          <span>${overtimeCalc.doubleTimePay.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances</span>
                    <span>${calculateAllowanceTotal(timesheet.appliedAllowances || []).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-primary">
                      ${((overtimeCalc?.totalPay || 0) + calculateAllowanceTotal(timesheet.appliedAllowances || [])).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {timesheet.notes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 text-sm">Notes</p>
                    <p className="text-sm text-foreground mt-0.5">{timesheet.notes}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        {timesheet.status === 'pending' && (
          <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onReject?.(timesheet.id)}
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => onApprove?.(timesheet.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
