import { useState, useMemo } from 'react';
import { StaffMember, employmentTypeLabels, PayRateType, EmploymentType } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Plus,
  Trash2,
  Info,
  Clock,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { locations } from '@/data/mockStaffData';
import { australianAwards, getAwardById, calculateRates, AustralianAward, AwardClassification } from '@/data/australianAwards';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StaffPayConfigurationSectionProps {
  staff: StaffMember;
}

export function StaffPayConfigurationSection({ staff }: StaffPayConfigurationSectionProps) {
  const [effectiveOption, setEffectiveOption] = useState('current');
  const [availabilityPattern, setAvailabilityPattern] = useState(staff.availabilityPattern);
  
  // Pay configuration state
  const [payRateType, setPayRateType] = useState<PayRateType>(staff.currentPayCondition?.payRateType || 'award');
  const [selectedAwardId, setSelectedAwardId] = useState<string>(
    staff.currentPayCondition?.industryAward 
      ? australianAwards.find(a => a.name === staff.currentPayCondition?.industryAward)?.id || ''
      : ''
  );
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>(
    staff.currentPayCondition?.classification || ''
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    staff.currentPayCondition?.employmentType || 'full_time'
  );
  const [hourlyRate, setHourlyRate] = useState<number>(staff.currentPayCondition?.hourlyRate || 0);
  const [annualSalary, setAnnualSalary] = useState<number>(staff.currentPayCondition?.annualSalary || 0);

  // Derived values
  const selectedAward = useMemo(() => getAwardById(selectedAwardId), [selectedAwardId]);
  const selectedClassification = useMemo(() => 
    selectedAward?.classifications.find(c => c.id === selectedClassificationId),
    [selectedAward, selectedClassificationId]
  );

  const calculatedRates = useMemo(() => {
    if (payRateType === 'award' && selectedAward && selectedClassification) {
      return calculateRates(selectedAward, selectedClassification, employmentType);
    }
    return null;
  }, [payRateType, selectedAward, selectedClassification, employmentType]);

  // Update hourly rate when classification changes
  const effectiveHourlyRate = useMemo(() => {
    if (payRateType === 'award' && calculatedRates) {
      return calculatedRates.effectiveRate;
    }
    if (payRateType === 'salary' && annualSalary > 0) {
      // Calculate hourly from annual (assuming 38hr week, 52 weeks)
      return annualSalary / (38 * 52);
    }
    return hourlyRate;
  }, [payRateType, calculatedRates, hourlyRate, annualSalary]);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Set Pay Conditions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure pay rates, hours, and availability settings
          </p>
        </div>
        
        {/* Applicable Pay Rates Card */}
        <Card className="w-80 bg-slate-800 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-cyan-400" />
              <p className="text-sm font-medium text-cyan-400">Applicable Pay Rates</p>
            </div>
            {payRateType === 'award' && selectedAward ? (
              <>
                <p className="text-xs text-slate-300 mb-1">{selectedAward.name}</p>
                {selectedClassification && (
                  <p className="text-xs text-slate-400 mb-3">
                    {selectedClassification.level} - {selectedClassification.description}
                  </p>
                )}
                {calculatedRates && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base rate:</span>
                      <span>${calculatedRates.baseHourlyRate.toFixed(2)}/hr</span>
                    </div>
                    {employmentType === 'casual' && calculatedRates.casualLoadedRate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">+ Casual loading ({selectedAward.casualLoading}%):</span>
                        <span className="text-green-400">${calculatedRates.casualLoadedRate.toFixed(2)}/hr</span>
                      </div>
                    )}
                    <Separator className="bg-slate-600 my-2" />
                    <div className="flex justify-between">
                      <span className="text-slate-400">Saturday ({selectedAward.saturdayPenalty}%):</span>
                      <span>${calculatedRates.saturdayRate.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sunday ({selectedAward.sundayPenalty}%):</span>
                      <span>${calculatedRates.sundayRate.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Public Holiday:</span>
                      <span>${calculatedRates.publicHolidayRate.toFixed(2)}/hr</span>
                    </div>
                    {calculatedRates.eveningRate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Evening:</span>
                        <span>${calculatedRates.eveningRate.toFixed(2)}/hr</span>
                      </div>
                    )}
                    <Separator className="bg-slate-600 my-2" />
                    <div className="flex justify-between">
                      <span className="text-slate-400">OT (first 2hrs):</span>
                      <span>${calculatedRates.overtime.first2Hours.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">OT (after 2hrs):</span>
                      <span>${calculatedRates.overtime.after2Hours.toFixed(2)}/hr</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hourly rate:</span>
                  <span>${effectiveHourlyRate.toFixed(2)}/hr</span>
                </div>
                {payRateType === 'salary' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual salary:</span>
                    <span>${annualSalary.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Effective Date Options */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">
            When do you want these pay conditions to take effect?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={effectiveOption} onValueChange={setEffectiveOption} className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="previous" id="previous" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="previous" className="font-medium cursor-pointer">
                  From start of previous pay cycle ({format(new Date(), 'dd MMM yyyy')})
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select this option if {staff.firstName}'s pay conditions changed last pay cycle
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="current" id="current" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="current" className="font-medium cursor-pointer">
                  From start of current pay period ({format(new Date(), 'dd MMM yyyy')})
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select this option to fix an error with {staff.firstName}'s current pay conditions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="future" id="future" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="future" className="font-medium cursor-pointer">
                  Schedule for future date
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select this option to schedule pay condition changes for a future date
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pay Rate Type Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pay Rate Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pay Rate Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pay Rate Type</Label>
            <RadioGroup 
              value={payRateType} 
              onValueChange={(v) => setPayRateType(v as PayRateType)} 
              className="grid grid-cols-3 gap-4"
            >
              <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${payRateType === 'award' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="award" id="award" />
                <div>
                  <Label htmlFor="award" className="font-medium cursor-pointer">Award Rate</Label>
                  <p className="text-xs text-muted-foreground">Based on Modern Award</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${payRateType === 'hourly' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="hourly" id="hourly_rate" />
                <div>
                  <Label htmlFor="hourly_rate" className="font-medium cursor-pointer">Hourly Rate</Label>
                  <p className="text-xs text-muted-foreground">Custom hourly rate</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${payRateType === 'salary' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="salary" id="salary" />
                <div>
                  <Label htmlFor="salary" className="font-medium cursor-pointer">Annual Salary</Label>
                  <p className="text-xs text-muted-foreground">Fixed annual salary</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Award Selection (shown when award type selected) */}
          {payRateType === 'award' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Award className="h-4 w-4" />
                Australian Modern Award Configuration
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    Select Award
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Select the applicable Modern Award that covers this employee's role</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select value={selectedAwardId} onValueChange={(value) => {
                    setSelectedAwardId(value);
                    setSelectedClassificationId(''); // Reset classification when award changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an Award" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {australianAwards.map((award) => (
                        <SelectItem key={award.id} value={award.id}>
                          <div className="flex flex-col">
                            <span>{award.shortName}</span>
                            <span className="text-xs text-muted-foreground">{award.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAward && (
                    <p className="text-xs text-muted-foreground">
                      {selectedAward.name} • Effective {selectedAward.effectiveDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    Classification Level
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Select the classification level based on the employee's qualifications and experience</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select 
                    value={selectedClassificationId} 
                    onValueChange={setSelectedClassificationId}
                    disabled={!selectedAward}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedAward ? "Select Classification" : "Select Award first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50 max-h-[300px]">
                      {selectedAward?.classifications.map((classification) => (
                        <SelectItem key={classification.id} value={classification.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <div>
                              <span className="font-medium">{classification.level}</span>
                              <span className="text-muted-foreground ml-2">- {classification.description}</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">
                              ${classification.baseHourlyRate.toFixed(2)}/hr
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClassification?.qualificationRequired && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Requires: {selectedClassification.qualificationRequired}
                    </div>
                  )}
                </div>
              </div>

              {/* Award Allowances */}
              {selectedAward && selectedAward.allowances.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-medium">Available Award Allowances</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAward.allowances.map((allowance) => (
                      <div key={allowance.id} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>{allowance.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ${allowance.amount.toFixed(2)}/{allowance.type.replace('per_', '')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hourly Rate Input (shown when hourly type selected) */}
          {payRateType === 'hourly' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Custom Hourly Rate</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="Enter hourly rate"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Annual Salary Input (shown when salary type selected) */}
          {payRateType === 'salary' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Annual Salary</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      value={annualSalary}
                      onChange={(e) => setAnnualSalary(parseFloat(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="Enter annual salary"
                    />
                  </div>
                  {annualSalary > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Equivalent to ${(annualSalary / (38 * 52)).toFixed(2)}/hr (based on 38hr week)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Employment Type & Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Employment Type
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
              {employmentType === 'casual' && payRateType === 'award' && selectedAward && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  +{selectedAward.casualLoading}% casual loading applied
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Contracted Hours/Week
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input 
                type="number" 
                defaultValue={staff.currentPayCondition?.contractedHours || 38} 
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Position
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select defaultValue={staff.position}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="Senior Educator">Senior Educator</SelectItem>
                  <SelectItem value="Lead Educator">Lead Educator</SelectItem>
                  <SelectItem value="Assistant Educator">Assistant Educator</SelectItem>
                  <SelectItem value="Trainee Educator">Trainee Educator</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Educational Leader">Educational Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Availability Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Weekly Availability Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={availabilityPattern} onValueChange={(v) => setAvailabilityPattern(v as 'same_every_week' | 'alternate_weekly')} className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="same_every_week" id="same" />
              <div>
                <Label htmlFor="same" className="font-medium cursor-pointer">Same Every Week</Label>
                <p className="text-xs text-muted-foreground">Lorem Ipsum</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="alternate_weekly" id="alternate" />
              <div>
                <Label htmlFor="alternate" className="font-medium cursor-pointer">Alternate Weekly (Week A / Week B)</Label>
                <p className="text-xs text-muted-foreground">Lorem Ipsum</p>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              Select Effective Date
              <Info className="h-3 w-3 text-muted-foreground" />
            </Label>
            <div className="relative w-64">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date" 
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Same Every Week</h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-8 gap-0 bg-muted/50 text-sm font-medium">
                <div className="px-4 py-3">Date From {format(new Date(), 'dd MMM yyyy')}</div>
                <div className="px-4 py-3 text-center">Start</div>
                <div className="px-4 py-3 text-center">Finish</div>
                <div className="px-4 py-3 text-center">Hours Total</div>
                <div className="px-4 py-3 text-center">Breaks Paid/Unpaid</div>
                <div className="px-4 py-3 text-center">Hours Total</div>
                <div className="px-4 py-3 text-center">Area</div>
                <div className="px-4 py-3"></div>
              </div>
              {daysOfWeek.map((day, index) => {
                const availability = staff.weeklyAvailability.find(a => a.dayOfWeek === day.key);
                const date = new Date();
                date.setDate(date.getDate() + index);
                
                return (
                  <div key={day.key} className="grid grid-cols-8 gap-0 border-t items-center">
                    <div className="px-4 py-3">
                      <p className="font-medium">{day.label}</p>
                      <p className="text-xs text-muted-foreground">{format(date, 'dd MMM yyyy')}</p>
                    </div>
                    {availability?.isAvailable ? (
                      <>
                        <div className="px-2 py-3">
                          <Input 
                            type="time" 
                            defaultValue={availability.startTime} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="px-2 py-3">
                          <Input 
                            type="time" 
                            defaultValue={availability.endTime}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="px-4 py-3 text-center text-sm">
                          {availability.startTime && availability.endTime ? '8' : '0'}
                        </div>
                        <div className="px-4 py-3 text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <span>{availability.breakMinutes || 0} min</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Clock className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">0 min</span>
                        </div>
                        <div className="px-4 py-3 text-center text-sm">
                          {availability.startTime && availability.endTime ? '8' : '0'}
                        </div>
                        <div className="px-2 py-3">
                          <Select defaultValue={availability.area}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select Area" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="px-2 py-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-6 px-4 py-3">
                          <Button variant="outline" size="sm" className="h-8">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Hours
                          </Button>
                        </div>
                        <div className="px-2 py-3"></div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Contract & Documents */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Employment Contract & Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Select & Send Employment Contracts *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Contract" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time Employment Contract</SelectItem>
                  <SelectItem value="part-time">Part Time Employment Contract</SelectItem>
                  <SelectItem value="casual">Casual Employment Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Select Documents *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handbook">Employee Handbook</SelectItem>
                  <SelectItem value="policy">Workplace Policy</SelectItem>
                  <SelectItem value="safety">Safety Guidelines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Additional Documents Required</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Select a file or drag and drop here</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG or PDF, file size no more than 10MB</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Select File</Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              Document 1
              <button className="ml-1 text-destructive hover:text-destructive/80">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              Document 2
              <button className="ml-1 text-destructive hover:text-destructive/80">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="w-32">Back</Button>
        <Button className="bg-primary w-40">Review & Update</Button>
      </div>
    </div>
  );
}
