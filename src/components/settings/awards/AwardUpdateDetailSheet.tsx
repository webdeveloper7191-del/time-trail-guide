import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Zap,
  History,
  Shield,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Info,
  Percent,
  CalendarClock,
  FileCheck,
} from 'lucide-react';
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns';
import { AwardUpdate } from '@/types/awardUpdates';

interface AwardUpdateDetailSheetProps {
  update: AwardUpdate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall?: (update: AwardUpdate) => void;
  onSchedule?: (update: AwardUpdate, date: string) => void;
  onSkip?: (update: AwardUpdate) => void;
  isInstalling?: boolean;
}

export function AwardUpdateDetailSheet({
  update,
  open,
  onOpenChange,
  onInstall,
  onSchedule,
  onSkip,
  isInstalling,
}: AwardUpdateDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!update) return null;

  const effectiveDate = parseISO(update.effectiveDate);
  const releaseDate = parseISO(update.releaseDate);
  const isEffective = isPast(effectiveDate);
  const isFutureEffective = isFuture(effectiveDate);
  const daysUntilEffective = differenceInDays(effectiveDate, new Date());

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const getStatusConfig = () => {
    switch (update.status) {
      case 'available':
        return {
          icon: Sparkles,
          color: 'text-amber-600',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          label: 'Update Available',
          description: 'This update is ready to be installed',
        };
      case 'scheduled':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          label: 'Scheduled',
          description: `Scheduled for ${update.scheduledFor ? format(parseISO(update.scheduledFor), 'PPP') : 'installation'}`,
        };
      case 'installed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          label: 'Installed',
          description: update.installedAt ? `Installed on ${format(parseISO(update.installedAt), 'PPP')}` : 'Successfully installed',
        };
      case 'skipped':
        return {
          icon: AlertCircle,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-muted',
          label: 'Skipped',
          description: 'This update was skipped',
        };
      default:
        return {
          icon: FileText,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-muted',
          label: 'Unknown',
          description: '',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Calculate impact statistics
  const totalRateImpact = update.rateChanges.reduce((sum, c) => sum + (c.newRate - c.previousRate), 0);
  const avgRateIncrease = update.rateChanges.length > 0 
    ? update.rateChanges.reduce((sum, c) => sum + c.changePercent, 0) / update.rateChanges.length 
    : 0;
  const totalAllowanceImpact = update.allowanceChanges.reduce((sum, c) => sum + (c.newRate - c.previousRate), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[900px] max-w-[95vw] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
                <StatusIcon className={`h-7 w-7 ${statusConfig.color}`} />
              </div>
              <div>
                <SheetTitle className="text-xl">{update.awardName}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge variant="outline" className="font-mono text-xs">{update.awardCode}</Badge>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Source: {update.source === 'fwc' ? 'Fair Work Commission' : update.source}
                  </span>
                </SheetDescription>
              </div>
            </div>
            {update.status === 'available' && onInstall && (
              <Button 
                onClick={() => onInstall(update)}
                disabled={isInstalling}
                className="gap-2"
              >
                {isInstalling ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install Update
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Version Info */}
          <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Version:</span>
              <span className="text-sm font-medium">{update.previousVersion}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-primary">{update.version}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">{formatPercent(update.rateIncreasePercent)}</span>
              <span className="text-xs text-muted-foreground">rate increase</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="rates" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Rate Changes
                <Badge variant="secondary" className="ml-1 text-xs">{update.rateChanges.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="allowances" className="gap-1.5">
                <Package className="h-4 w-4" />
                Allowances
                <Badge variant="secondary" className="ml-1 text-xs">{update.allowanceChanges.length}</Badge>
              </TabsTrigger>
              {update.penaltyRateChanges.length > 0 && (
                <TabsTrigger value="penalties" className="gap-1.5">
                  <Zap className="h-4 w-4" />
                  Penalties
                  <Badge variant="secondary" className="ml-1 text-xs">{update.penaltyRateChanges.length}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="compliance" className="gap-1.5">
                <Shield className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Key Dates */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Released</p>
                        <p className="text-sm font-semibold">{format(releaseDate, 'PP')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${isEffective ? 'bg-green-500/10' : 'bg-amber-500/10'} flex items-center justify-center`}>
                        <CalendarClock className={`h-5 w-5 ${isEffective ? 'text-green-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Effective From</p>
                        <p className="text-sm font-semibold">{format(effectiveDate, 'PP')}</p>
                        {isFutureEffective && (
                          <p className="text-xs text-amber-600">{daysUntilEffective} days away</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Changes</p>
                        <p className="text-sm font-semibold">{update.totalChanges}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Update Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{update.summaryNotes}</p>
                  {update.detailedNotes && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{update.detailedNotes}</p>
                    </>
                  )}
                  {update.sourceUrl && (
                    <a 
                      href={update.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View source document
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Impact Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Average Rate Increase</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatPercent(avgRateIncrease)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Across {update.rateChanges.length} classifications
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Allowance Adjustments</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{update.allowanceChanges.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: {formatCurrency(totalAllowanceImpact)} increase
                      </p>
                    </div>
                  </div>

                  {/* Change Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Change Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24">Rate Changes</span>
                        <Progress value={(update.rateChanges.length / update.totalChanges) * 100} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-8 text-right">{update.rateChanges.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24">Allowances</span>
                        <Progress value={(update.allowanceChanges.length / update.totalChanges) * 100} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-8 text-right">{update.allowanceChanges.length}</span>
                      </div>
                      {update.penaltyRateChanges.length > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24">Penalties</span>
                          <Progress value={(update.penaltyRateChanges.length / update.totalChanges) * 100} className="flex-1 h-2" />
                          <span className="text-xs font-medium w-8 text-right">{update.penaltyRateChanges.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Rate Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Top Rate Changes
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('rates')}>
                      View All
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {update.rateChanges.slice(0, 5).map((change) => (
                      <div key={change.classificationId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{change.classificationName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{formatCurrency(change.previousRate)}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold">{formatCurrency(change.newRate)}</span>
                          <Badge className="bg-green-500/10 text-green-700 text-xs">
                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                            {formatPercent(change.changePercent)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rate Changes Tab */}
            <TabsContent value="rates" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Classification Rate Changes</CardTitle>
                  <CardDescription>
                    All hourly rate adjustments for each classification level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs uppercase tracking-wide">Classification</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Previous Rate</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">New Rate</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Change</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {update.rateChanges.map((change) => (
                          <TableRow key={change.classificationId}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{change.classificationName}</p>
                                <p className="text-xs text-muted-foreground">{change.classificationId}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(change.previousRate)}/hr
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(change.newRate)}/hr
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={
                                change.changeType === 'increase' 
                                  ? 'bg-green-500/10 text-green-700' 
                                  : change.changeType === 'decrease'
                                  ? 'bg-red-500/10 text-red-700'
                                  : 'bg-muted text-muted-foreground'
                              }>
                                {change.changeType === 'increase' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                {change.changeType === 'decrease' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {formatPercent(change.changePercent)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-xs capitalize">
                                {change.changeType}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Allowances Tab */}
            <TabsContent value="allowances" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Allowance Changes</CardTitle>
                  <CardDescription>
                    Expense-related and special allowance rate adjustments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {update.allowanceChanges.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No allowance changes in this update</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs uppercase tracking-wide">Allowance</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">Previous Rate</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">New Rate</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {update.allowanceChanges.map((change) => (
                            <TableRow key={change.allowanceId}>
                              <TableCell>
                                <p className="font-medium text-sm">{change.allowanceName}</p>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(change.previousRate)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(change.newRate)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-green-500/10 text-green-700">
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  {formatPercent(change.changePercent)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Penalties Tab */}
            <TabsContent value="penalties" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Penalty Rate Changes</CardTitle>
                  <CardDescription>
                    Multiplier adjustments for weekend, public holiday, and shift penalties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {update.penaltyRateChanges.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No penalty rate changes in this update</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs uppercase tracking-wide">Penalty Type</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">Previous Multiplier</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">New Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {update.penaltyRateChanges.map((change, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{change.penaltyType}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {change.previousMultiplier}x
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {change.newMultiplier}x
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compliance Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Source Authority</p>
                      <p className="text-sm font-medium">
                        {update.source === 'fwc' ? 'Fair Work Commission' : 'Manual Entry'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Legal Deadline</p>
                      <p className="text-sm font-medium">{format(effectiveDate, 'PPP')}</p>
                    </div>
                  </div>

                  <Card className={`${isEffective && update.status === 'available' ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      {isEffective && update.status === 'available' ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Action Required</p>
                            <p className="text-xs text-red-700/80 mt-1">
                              This update is already in effect. Installing now will ensure your organization is compliant with current Fair Work Commission rates.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {update.status === 'installed' ? 'Compliant' : 'Upcoming Update'}
                            </p>
                            <p className="text-xs text-green-700/80 mt-1">
                              {update.status === 'installed' 
                                ? 'Your rates are up-to-date with Fair Work Commission requirements.'
                                : `Schedule or install this update before ${format(effectiveDate, 'PPP')} to maintain compliance.`
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {update.sourceUrl && (
                    <div className="p-4 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reference Documents</p>
                      <a 
                        href={update.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Fair Work Commission - {update.awardCode} Documentation
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Installation History */}
              {update.status === 'installed' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Installation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground">Installed At</span>
                        <span className="text-sm font-medium">
                          {update.installedAt ? format(parseISO(update.installedAt), 'PPpp') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground">Installed By</span>
                        <span className="text-sm font-medium">{update.installedBy || 'System'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Previous Version</span>
                        <span className="text-sm font-medium">{update.previousVersion}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        {update.status === 'available' && (
          <div className="p-4 border-t shrink-0 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onSkip && (
                  <Button variant="outline" size="sm" onClick={() => onSkip(update)}>
                    Skip Update
                  </Button>
                )}
                {onSchedule && (
                  <Button variant="outline" size="sm" onClick={() => onSchedule(update, update.effectiveDate)}>
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Schedule
                  </Button>
                )}
              </div>
              {onInstall && (
                <Button onClick={() => onInstall(update)} disabled={isInstalling} className="gap-2">
                  {isInstalling ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Install Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
