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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  History, Calculator, FileText, Clock, DollarSign, ArrowRight
} from 'lucide-react';
import { format, isBefore, startOfDay, addDays, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { calculateRetrospectivePay, BackPayCalculation, formatBackPayReport } from '@/lib/retrospectivePayCalculator';

interface SchedulePayChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

type ChangeType = 'future' | 'retrospective';

export function SchedulePayChangeSheet({ open, onOpenChange, staff }: SchedulePayChangeSheetProps) {
  const currentCondition = staff.currentPayCondition;
  
  const [changeType, setChangeType] = useState<ChangeType>('future');
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
  const [reason, setReason] = useState('');
  const [backPayCalculation, setBackPayCalculation] = useState<BackPayCalculation | null>(null);

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

  const handleSchedule = () => {
    if (changeType === 'future' && !effectiveDate) {
      toast.error('Please select an effective date');
      return;
    }

    if (changeType === 'future' && effectiveDate && isBefore(effectiveDate, startOfDay(new Date()))) {
      toast.error('Effective date must be in the future');
      return;
    }

    if (changeType === 'retrospective' && !backPayCalculation) {
      toast.error('Please calculate back-pay first');
      return;
    }

    if (changeType === 'future') {
      toast.success(`Pay change scheduled for ${format(effectiveDate!, 'dd MMM yyyy')}`);
    } else {
      toast.success('Retrospective pay adjustment submitted', {
        description: `$${backPayCalculation!.totalAdjustment.toFixed(2)} adjustment queued for payroll`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Pay Change
          </SheetTitle>
          <SheetDescription>
            Schedule pay changes for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Change Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Change Type</Label>
            <RadioGroup value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)} className="grid grid-cols-2 gap-4">
              <div 
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  changeType === 'future' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setChangeType('future')}
              >
                <RadioGroupItem value="future" id="future" className="mt-1" />
                <div>
                  <Label htmlFor="future" className="font-medium cursor-pointer">Future Date</Label>
                  <p className="text-sm text-muted-foreground">Schedule changes for an upcoming date</p>
                </div>
              </div>
              <div 
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  changeType === 'retrospective' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setChangeType('retrospective')}
              >
                <RadioGroupItem value="retrospective" id="retrospective" className="mt-1" />
                <div>
                  <Label htmlFor="retrospective" className="font-medium cursor-pointer">Previous Pay Cycle</Label>
                  <p className="text-sm text-muted-foreground">Apply changes retroactively with back-pay</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Current vs New Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pay Change Summary</CardTitle>
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
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : rateDifference < 0 ? (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  ) : (
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">New Rate</p>
                  <p className="text-xl font-bold">${newRate.toFixed(2)}</p>
                  <Badge variant={rateDifference > 0 ? "default" : rateDifference < 0 ? "destructive" : "secondary"} className="mt-1">
                    {rateDifference > 0 ? '+' : ''}{percentageChange}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection - Future */}
          {changeType === 'future' && (
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

          {/* Date Selection - Retrospective */}
          {changeType === 'retrospective' && (
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
                    {/* Summary Stats */}
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

                    {/* Affected Timesheets Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <ScrollArea className="h-[200px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Week Ending</TableHead>
                              <TableHead className="text-xs text-right">Hours</TableHead>
                              <TableHead className="text-xs text-right">Original</TableHead>
                              <TableHead className="text-xs text-right">Adjustment</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backPayCalculation.affectedTimesheets.map((ts) => (
                              <TableRow key={ts.id}>
                                <TableCell className="text-xs">{format(new Date(ts.weekEnding), 'dd MMM')}</TableCell>
                                <TableCell className="text-xs text-right">{ts.regularHours + ts.overtimeHours}h</TableCell>
                                <TableCell className="text-xs text-right">${ts.originalPay.toFixed(2)}</TableCell>
                                <TableCell className={cn(
                                  "text-xs text-right font-medium",
                                  ts.adjustment > 0 ? 'text-emerald-600' : ts.adjustment < 0 ? 'text-red-600' : ''
                                )}>
                                  {ts.adjustment > 0 ? '+' : ''}{ts.adjustment.toFixed(2)}
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

          <Separator />

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
            <RadioGroup value={payRateType} onValueChange={(v) => setPayRateType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="award" id="award" />
                <Label htmlFor="award" className="font-normal">Award Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hourly" id="hourly" />
                <Label htmlFor="hourly" className="font-normal">Custom Hourly Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="salary" id="salary" />
                <Label htmlFor="salary" className="font-normal">Annual Salary</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Award Selection */}
          {payRateType === 'award' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
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

          {/* Employment Type */}
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

          {/* Contracted Hours */}
          <div className="space-y-2">
            <Label>Contracted Hours (per week)</Label>
            <Input
              type="number"
              value={contractedHours}
              onChange={(e) => setContractedHours(e.target.value)}
              placeholder="38"
            />
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSchedule} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              {changeType === 'future' ? 'Schedule Change' : 'Submit Adjustment'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
