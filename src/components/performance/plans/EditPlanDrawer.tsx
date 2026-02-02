import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Save, X, User, FileText, Clock, Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  AssignedPlan, 
  planStatusLabels, 
  planTypeLabels,
  PlanStatus,
} from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { toast } from 'sonner';

interface EditPlanDrawerProps {
  open: boolean;
  plan: AssignedPlan | null;
  staff: StaffMember[];
  onClose: () => void;
  onSave: (planId: string, updates: Partial<AssignedPlan>) => Promise<void>;
}

export function EditPlanDrawer({
  open,
  plan,
  staff,
  onClose,
  onSave,
}: EditPlanDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    startDate: new Date(),
    endDate: new Date(),
    status: 'active' as PlanStatus,
  });

  const staffMember = staff.find(s => s.id === plan?.staffId);

  useEffect(() => {
    if (plan) {
      setFormData({
        notes: plan.notes || '',
        startDate: parseISO(plan.startDate),
        endDate: parseISO(plan.endDate),
        status: plan.status,
      });
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      await onSave(plan.id, {
        notes: formData.notes,
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        status: formData.status,
      });
      toast.success('Plan updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Edit Performance Plan
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          <div className="space-y-6">
            {/* Staff Member Info (Read-only) */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Assigned To
              </Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={staffMember?.avatar} />
                  <AvatarFallback>
                    {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {staffMember?.firstName} {staffMember?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{staffMember?.position}</p>
                </div>
              </div>
            </div>

            {/* Plan Template Info (Read-only) */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Plan Template
              </Label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">{plan.templateName}</span>
                <Badge variant="secondary" className="ml-auto">
                  {planTypeLabels[plan.type]}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PlanStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(planStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes about this plan..."
                  rows={4}
                />
              </div>

              {/* Plan Stats (Read-only) */}
              <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Plan Components
                </Label>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold">{plan.goalIds.length}</p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{plan.reviewIds.length}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{plan.conversationIds.length}</p>
                    <p className="text-xs text-muted-foreground">1:1s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default EditPlanDrawer;
