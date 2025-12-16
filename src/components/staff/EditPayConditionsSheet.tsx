import { useState } from 'react';
import { StaffMember, PayCondition, employmentTypeLabels, payRateTypeLabels } from '@/types/staff';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, Calendar as CalendarIcon, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditPayConditionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSave?: (condition: PayCondition) => void;
}

export function EditPayConditionsSheet({ open, onOpenChange, staff, onSave }: EditPayConditionsSheetProps) {
  const payCondition = staff.currentPayCondition;
  
  const [formData, setFormData] = useState({
    position: payCondition?.position || '',
    employmentType: payCondition?.employmentType || 'full_time',
    payRateType: payCondition?.payRateType || 'hourly',
    hourlyRate: payCondition?.hourlyRate || 0,
    annualSalary: payCondition?.annualSalary || 0,
    contractedHours: payCondition?.contractedHours || 38,
    payPeriod: payCondition?.payPeriod || 'fortnightly',
    industryAward: payCondition?.industryAward || '',
    classification: payCondition?.classification || '',
    effectiveFrom: payCondition?.effectiveFrom ? new Date(payCondition.effectiveFrom) : new Date(),
    effectiveTo: payCondition?.effectiveTo ? new Date(payCondition.effectiveTo) : undefined,
  });

  const handleSave = () => {
    const updatedCondition: PayCondition = {
      id: payCondition?.id || `pay-${Date.now()}`,
      ...formData,
      effectiveFrom: formData.effectiveFrom.toISOString(),
      effectiveTo: formData.effectiveTo?.toISOString(),
    };
    onSave?.(updatedCondition);
    toast.success('Pay conditions updated successfully');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-5 w-5 text-primary" />
            Edit Pay Conditions
          </SheetTitle>
          <SheetDescription>
            Update pay conditions for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Effective Period */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Effective Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Effective From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.effectiveFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.effectiveFrom ? format(formData.effectiveFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.effectiveFrom}
                        onSelect={(date) => date && setFormData({ ...formData, effectiveFrom: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Effective To (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.effectiveTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.effectiveTo ? format(formData.effectiveTo, "PPP") : "No end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.effectiveTo}
                        onSelect={(date) => setFormData({ ...formData, effectiveTo: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Early Childhood Educator"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(v) => setFormData({ ...formData, employmentType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(employmentTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry Award</Label>
                  <Select
                    value={formData.industryAward}
                    onValueChange={(v) => setFormData({ ...formData, industryAward: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select award" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Children's Services Award 2010">Children's Services Award 2010</SelectItem>
                      <SelectItem value="Educational Services Award">Educational Services Award</SelectItem>
                      <SelectItem value="Social and Community Services">Social and Community Services</SelectItem>
                      <SelectItem value="None">None / Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Classification</Label>
                  <Select
                    value={formData.classification}
                    onValueChange={(v) => setFormData({ ...formData, classification: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 3.1">Level 3.1 - Certificate III</SelectItem>
                      <SelectItem value="Level 3.2">Level 3.2 - Certificate III (Experienced)</SelectItem>
                      <SelectItem value="Level 4.1">Level 4.1 - Diploma</SelectItem>
                      <SelectItem value="Level 4.2">Level 4.2 - Diploma (Experienced)</SelectItem>
                      <SelectItem value="Level 5.1">Level 5.1 - Early Childhood Teacher</SelectItem>
                      <SelectItem value="Level 5.2">Level 5.2 - ECT (Experienced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pay Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pay Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pay Rate Type</Label>
                  <Select
                    value={formData.payRateType}
                    onValueChange={(v) => setFormData({ ...formData, payRateType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(payRateTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pay Period</Label>
                  <Select
                    value={formData.payPeriod}
                    onValueChange={(v) => setFormData({ ...formData, payPeriod: v as any })}
                  >
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Salary ($) (if applicable)</Label>
                  <Input
                    type="number"
                    value={formData.annualSalary}
                    onChange={(e) => setFormData({ ...formData, annualSalary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contracted Hours (per week)</Label>
                <Input
                  type="number"
                  value={formData.contractedHours}
                  onChange={(e) => setFormData({ ...formData, contractedHours: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
