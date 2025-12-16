import { useState } from 'react';
import { StaffMember, employmentTypeLabels } from '@/types/staff';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { locations } from '@/data/mockStaffData';

interface StaffPayConfigurationSectionProps {
  staff: StaffMember;
}

export function StaffPayConfigurationSection({ staff }: StaffPayConfigurationSectionProps) {
  const [effectiveOption, setEffectiveOption] = useState('current');
  const [availabilityPattern, setAvailabilityPattern] = useState(staff.availabilityPattern);

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
        <Card className="w-72 bg-slate-800 text-white border-0">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-cyan-400 mb-2">Applicable Pay Rates</p>
            <p className="text-xs text-slate-300 mb-3">
              {staff.currentPayCondition?.industryAward || 'Fast Food Industry Award 2020'}
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Base hourly rate:</span>
                <span>${staff.currentPayCondition?.hourlyRate.toFixed(2) || '28.12'}/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Every Day:</span>
                <span>${staff.currentPayCondition?.hourlyRate.toFixed(2) || '28.12'}/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sundays:</span>
                <span>${((staff.currentPayCondition?.hourlyRate || 28.12) * 1.5).toFixed(2)}/hour</span>
              </div>
            </div>
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
                  Select this option if 23Digital's pay conditions changed last pay cycle
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="current" id="current" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="current" className="font-medium cursor-pointer">
                  From start of pay conditions ({format(new Date(), 'dd MMM yyyy')})
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select this option to fix an error with 23Digital's current pay conditions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="date_only" id="date_only" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="date_only" className="font-medium cursor-pointer">
                  Date change only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select this option if you just want to change the start date of 23Digital's current pay conditions
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Contract Hours & Position */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Contracted weekly hours
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input 
                type="number" 
                defaultValue={staff.currentPayCondition?.contractedHours || 0} 
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
                  <SelectValue placeholder="Select Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior Educator">Senior Educator</SelectItem>
                  <SelectItem value="Lead Educator">Lead Educator</SelectItem>
                  <SelectItem value="Assistant Educator">Assistant Educator</SelectItem>
                  <SelectItem value="Trainee Educator">Trainee Educator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pay Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Payrate Type
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input value="Base Hourly Rate" readOnly className="bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Employment Type
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Select defaultValue={staff.currentPayCondition?.employmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Hourly Rate</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    defaultValue={staff.currentPayCondition?.hourlyRate} 
                    className="pl-8"
                    placeholder="Enter Your Hourly Rate"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                Annual Salary
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  className="pl-8"
                  placeholder="Enter Your Annual Salary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
