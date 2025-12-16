import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, TrendingUp, AlertCircle, Check } from 'lucide-react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SchedulePayChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

export function SchedulePayChangeSheet({ open, onOpenChange, staff }: SchedulePayChangeSheetProps) {
  const currentCondition = staff.currentPayCondition;
  
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(addDays(new Date(), 14));
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

  const handleSchedule = () => {
    if (!effectiveDate) {
      toast({ title: 'Please select an effective date', variant: 'destructive' });
      return;
    }

    if (isBefore(effectiveDate, startOfDay(new Date()))) {
      toast({ title: 'Effective date must be in the future', variant: 'destructive' });
      return;
    }

    toast({
      title: 'Pay Change Scheduled',
      description: `New pay conditions will take effect on ${format(effectiveDate, 'dd MMM yyyy')}`,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Future Pay Change
          </SheetTitle>
          <SheetDescription>
            Schedule pay changes for {staff.firstName} {staff.lastName} to take effect on a future date
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
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
                  <TrendingUp className={cn(
                    "h-6 w-6",
                    rateDifference > 0 ? "text-green-500" : rateDifference < 0 ? "text-red-500" : "text-muted-foreground"
                  )} />
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

          {/* Effective Date */}
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
              Schedule Change
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
