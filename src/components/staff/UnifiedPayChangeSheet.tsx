import { useState, useMemo } from 'react';
import { StaffMember, PayCondition, employmentTypeLabels, payRateTypeLabels } from '@/types/staff';
import { australianAwards, getAwardById } from '@/data/australianAwards';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, TrendingUp, TrendingDown, AlertCircle, Check, Download, 
  History, Calculator, Clock, DollarSign, ArrowRight, Zap, CalendarPlus,
  ArrowLeftCircle, Save, FileText, PenTool, Send, ArrowLeft
} from 'lucide-react';
import { format, isBefore, startOfDay, addDays, subMonths, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { calculateRetrospectivePay, BackPayCalculation, formatBackPayReport } from '@/lib/retrospectivePayCalculator';

interface UnifiedPayChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  initialMode?: 'previous' | 'current' | 'future';
}

type ChangeMode = 'previous' | 'current' | 'future';

const modeConfig = {
  previous: {
    icon: History,
    title: 'Previous Pay Cycle',
    description: 'Apply changes retroactively with back-pay calculation',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  current: {
    icon: Zap,
    title: 'Current Pay Cycle',
    description: 'Apply changes immediately from today',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  future: {
    icon: CalendarPlus,
    title: 'Future Pay Cycle',
    description: 'Schedule changes for an upcoming date',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
};

export function UnifiedPayChangeSheet({ open, onOpenChange, staff, initialMode = 'current' }: UnifiedPayChangeSheetProps) {
  const currentCondition = staff.currentPayCondition;
  
  const [mode, setMode] = useState<ChangeMode>(initialMode);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(addDays(new Date(), 14));
  const [retroStartDate, setRetroStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [retroEndDate, setRetroEndDate] = useState<Date | undefined>(new Date());
  const [payRateType, setPayRateType] = useState(currentCondition?.payRateType || 'award');
  const [selectedAward, setSelectedAward] = useState(
    australianAwards.find(a => a.name === currentCondition?.industryAward)?.id || ''
  );
  const [selectedClassification, setSelectedClassification] = useState(currentCondition?.classification || '');
  const [employmentType, setEmploymentType] = useState(currentCondition?.employmentType || 'full_time');
  const [hourlyRate, setHourlyRate] = useState(currentCondition?.hourlyRate?.toString() || '');
  const [annualSalary, setAnnualSalary] = useState(currentCondition?.annualSalary?.toString() || '');
  const [position, setPosition] = useState(currentCondition?.position || '');
  const [contractedHours, setContractedHours] = useState(currentCondition?.contractedHours?.toString() || '38');
  const [payPeriod, setPayPeriod] = useState(currentCondition?.payPeriod || 'fortnightly');
  const [reason, setReason] = useState('');
  const [backPayCalculation, setBackPayCalculation] = useState<BackPayCalculation | null>(null);
  const [showDocumentStep, setShowDocumentStep] = useState(false);

  const selectedAwardData = getAwardById(selectedAward);
  const selectedClassificationData = selectedAwardData?.classifications.find(
    c => c.level === selectedClassification
  );

  // Calculate new rate based on award selection
  const calculateNewRate = () => {
    if (payRateType === 'award' && selectedClassificationData) {
      const baseRate = selectedClassificationData.baseHourlyRate;
      if (employmentType === 'casual') {
        return baseRate * (1 + (selectedAwardData?.casualLoading || 25) / 100);
      }
      return baseRate;
    }
    if (payRateType === 'salary' && annualSalary) {
      return parseFloat(annualSalary) / 52 / 38;
    }
    return parseFloat(hourlyRate) || 0;
  };

  const newRate = calculateNewRate();
  const currentRate = currentCondition?.hourlyRate || 0;
  const rateDifference = newRate - currentRate;
  const percentageChange = currentRate > 0 ? ((rateDifference / currentRate) * 100).toFixed(1) : '0';

  const handleCalculateBackPay = () => {
    if (!retroStartDate || !retroEndDate) {
      toast.error('Please select a date range for retrospective calculation');
      return;
    }

    if (rateDifference === 0) {
      toast.warning('No rate difference', {
        description: 'Please change the pay rate first before calculating back-pay',
      });
      return;
    }

    const calculation = calculateRetrospectivePay({
      employeeId: staff.id,
      employeeName: `${staff.firstName} ${staff.lastName}`,
      effectiveFrom: retroStartDate,
      effectiveTo: retroEndDate,
      oldHourlyRate: currentRate,
      newHourlyRate: newRate,
    });

    setBackPayCalculation(calculation);
    toast.success('Back-pay calculated', {
      description: `Total adjustment: $${calculation.totalAdjustment.toFixed(2)}`,
    });
  };

  const handleDownloadReport = () => {
    if (!backPayCalculation) return;
    
    const report = formatBackPayReport(backPayCalculation);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backpay-report-${staff.lastName}-${format(new Date(), 'yyyyMMdd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const handleSubmit = () => {
    if (mode === 'future' && !effectiveDate) {
      toast.error('Please select an effective date');
      return;
    }

    if (mode === 'future' && effectiveDate && isBefore(effectiveDate, startOfDay(new Date()))) {
      toast.error('Effective date must be in the future');
      return;
    }

    if (mode === 'previous' && !backPayCalculation) {
      toast.error('Please calculate back-pay first');
      return;
    }

    const messages = {
      previous: `Retrospective pay adjustment submitted: $${backPayCalculation?.totalAdjustment.toFixed(2)} queued for payroll`,
      current: 'Pay conditions updated immediately',
      future: `Pay change scheduled for ${format(effectiveDate!, 'dd MMM yyyy')}`,
    };

    toast.success(messages[mode]);
    setShowDocumentStep(true);
  };

  const handleGenerateContract = () => {
    toast.success('Employment contract generated', {
      description: `Contract for ${staff.firstName} ${staff.lastName} has been generated and is ready for review.`,
    });
    onOpenChange(false);
    setShowDocumentStep(false);
  };

  const handleSendForSigning = () => {
    toast.success('Document sent for e-signature', {
      description: `A signing request has been sent to ${staff.email || `${staff.firstName} ${staff.lastName}`}.`,
    });
    onOpenChange(false);
    setShowDocumentStep(false);
  };

  const handleSkipDocuments = () => {
    onOpenChange(false);
    setShowDocumentStep(false);
  };

  const config = modeConfig[mode];
  const ModeIcon = config.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Manage Pay Conditions
          </SheetTitle>
          <SheetDescription>
            Update pay conditions for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Mode Selection - Three Clear Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">When should this change apply?</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(modeConfig) as ChangeMode[]).map((modeKey) => {
                const cfg = modeConfig[modeKey];
                const Icon = cfg.icon;
                const isActive = mode === modeKey;
                
                return (
                  <button
                    key={modeKey}
                    onClick={() => {
                      setMode(modeKey);
                      setBackPayCalculation(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                      isActive
                        ? `${cfg.borderColor} ${cfg.bgColor}`
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      isActive ? cfg.bgColor : "bg-muted"
                    )}>
                      <Icon className={cn("h-5 w-5", isActive ? cfg.color : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className={cn("font-medium text-sm", isActive && cfg.color)}>
                        {cfg.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {cfg.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Change Summary Card */}
          <Card className={cn("border-2", config.borderColor, config.bgColor)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ModeIcon className={cn("h-4 w-4", config.color)} />
                Pay Change Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Rate</p>
                  <p className="text-xl font-bold">${currentRate.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">/hr</p>
                </div>
                <div className="flex items-center justify-center">
                  {rateDifference > 0 ? (
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  ) : rateDifference < 0 ? (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  ) : (
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">New Rate</p>
                  <p className="text-xl font-bold">${newRate.toFixed(2)}</p>
                  <Badge 
                    variant={rateDifference > 0 ? "default" : rateDifference < 0 ? "destructive" : "secondary"} 
                    className="mt-1"
                  >
                    {rateDifference > 0 ? '+' : ''}{percentageChange}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode-Specific Date Selection */}
          {mode === 'previous' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retrospective From *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !retroStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {retroStartDate ? format(retroStartDate, 'PPP') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={retroStartDate}
                        onSelect={setRetroStartDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Retrospective To *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !retroEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {retroEndDate ? format(retroEndDate, 'PPP') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={retroEndDate}
                        onSelect={setRetroEndDate}
                        disabled={(date) => date > new Date() || (retroStartDate && date < retroStartDate)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Warning if no rate difference */}
              {rateDifference === 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3 items-center">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">
                        Change the pay rate below before calculating back-pay
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button 
                onClick={handleCalculateBackPay} 
                variant="outline" 
                className="w-full gap-2"
                disabled={rateDifference === 0}
              >
                <Calculator className="h-4 w-4" />
                Calculate Back-Pay
              </Button>

              {/* Back-Pay Results */}
              {backPayCalculation && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Back-Pay Calculation
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={handleDownloadReport} className="gap-1">
                        <Download className="h-3 w-3" />
                        Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-background/80 text-center">
                        <p className="text-xs text-muted-foreground">Timesheets</p>
                        <p className="text-xl font-bold">{backPayCalculation.totalAffectedTimesheets}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/80 text-center">
                        <p className="text-xs text-muted-foreground">Total Hours</p>
                        <p className="text-xl font-bold">{backPayCalculation.totalAffectedHours.toFixed(1)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/80 text-center">
                        <p className="text-xs text-muted-foreground">Adjustment</p>
                        <p className={cn(
                          "text-xl font-bold",
                          backPayCalculation.adjustmentType === 'increase' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                          {backPayCalculation.adjustmentType === 'increase' ? '+' : '-'}${Math.abs(backPayCalculation.totalAdjustment).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <ScrollArea className="h-[150px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Week Ending</TableHead>
                              <TableHead className="text-xs text-right">Hours</TableHead>
                              <TableHead className="text-xs text-right">Adjustment</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backPayCalculation.affectedTimesheets.map((ts) => (
                              <TableRow key={ts.id}>
                                <TableCell className="text-xs">{format(new Date(ts.weekEnding), 'dd MMM')}</TableCell>
                                <TableCell className="text-xs text-right">{ts.regularHours + ts.overtimeHours}h</TableCell>
                                <TableCell className={cn(
                                  "text-xs text-right font-medium",
                                  ts.adjustment > 0 ? 'text-emerald-600' : ts.adjustment < 0 ? 'text-red-600' : ''
                                )}>
                                  {ts.adjustment > 0 ? '+' : ''}${ts.adjustment.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={ts.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                    {ts.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {mode === 'current' && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 items-center">
                  <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Changes will take effect immediately from <strong>{format(new Date(), 'dd MMM yyyy')}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'future' && (
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={effectiveDate}
                    onSelect={setEffectiveDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Changes will automatically apply on this date
              </p>
            </div>
          )}

          <Separator />

          {/* Pay Condition Fields */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Pay Details</h3>
            
            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Educator"
              />
            </div>

            {/* Pay Rate Type */}
            <div className="space-y-3">
              <Label>Pay Rate Type</Label>
              <RadioGroup value={payRateType} onValueChange={(v) => setPayRateType(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="award" id="award" />
                  <Label htmlFor="award" className="font-normal cursor-pointer">Award Rate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly" className="font-normal cursor-pointer">Custom Hourly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="salary" id="salary" />
                  <Label htmlFor="salary" className="font-normal cursor-pointer">Annual Salary</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Award Selection */}
            {payRateType === 'award' && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry Award</Label>
                    <Select value={selectedAward} onValueChange={setSelectedAward}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an award" />
                      </SelectTrigger>
                      <SelectContent>
                        {australianAwards.map((award) => (
                          <SelectItem key={award.id} value={award.id}>
                            {award.shortName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAwardData && (
                    <div className="space-y-2">
                      <Label>Classification</Label>
                      <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedAwardData.classifications.map((classification) => (
                            <SelectItem key={classification.id} value={classification.level}>
                              <div className="flex justify-between items-center gap-4">
                                <span>{classification.level}</span>
                                <span className="text-muted-foreground text-xs">
                                  ${classification.baseHourlyRate.toFixed(2)}/hr
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Hourly Rate */}
            {payRateType === 'hourly' && (
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Annual Salary */}
            {payRateType === 'salary' && (
              <div className="space-y-2">
                <Label>Annual Salary ($)</Label>
                <Input
                  type="number"
                  value={annualSalary}
                  onChange={(e) => setAnnualSalary(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Equivalent hourly rate: ${annualSalary ? (parseFloat(annualSalary) / 52 / 38).toFixed(2) : '0.00'}/hr
                </p>
              </div>
            )}

            {/* Employment Type & Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employmentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contracted Hours (per week)</Label>
                <Input
                  type="number"
                  value={contractedHours}
                  onChange={(e) => setContractedHours(e.target.value)}
                  placeholder="38"
                />
              </div>
            </div>

            {/* Pay Period */}
            <div className="space-y-2">
              <Label>Pay Period</Label>
              <Select value={payPeriod} onValueChange={(v) => setPayPeriod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual review, promotion, award increase"
              />
            </div>
          </div>

          {/* Warning if reducing pay */}
          {rateDifference < 0 && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">Pay Reduction Notice</p>
                    <p className="text-xs text-amber-600 mt-1">
                      This change will reduce the employee's hourly rate. Ensure compliance with employment agreements and award conditions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Generation Step */}
          {showDocumentStep && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Generate Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pay conditions have been saved. Would you like to generate or send any documents?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:border-primary/50 hover:bg-primary/5"
                    onClick={handleGenerateContract}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Generate Contract</p>
                      <p className="text-xs text-muted-foreground">Create updated employment contract</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:border-primary/50 hover:bg-primary/5"
                    onClick={handleSendForSigning}
                  >
                    <PenTool className="h-5 w-5 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Send for Signing</p>
                      <p className="text-xs text-muted-foreground">E-sign the updated conditions</p>
                    </div>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleSkipDocuments}
                >
                  Skip — I'll do this later
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {showDocumentStep ? (
              <Button variant="outline" onClick={() => setShowDocumentStep(false)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className={cn("flex-1", mode === 'previous' && !backPayCalculation && "opacity-50")}
                  disabled={mode === 'previous' && !backPayCalculation}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {mode === 'previous' ? 'Submit Adjustment' : mode === 'current' ? 'Apply Now' : 'Schedule Change'}
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
