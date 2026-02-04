import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { AssignedPlan } from '@/types/performancePlan';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

interface ExtendPlanDrawerProps {
  open: boolean;
  plan: AssignedPlan | null;
  loading?: boolean;
  onExtend: (newEndDate: string) => void;
  onCancel: () => void;
}

export function ExtendPlanDrawer({
  open,
  plan,
  loading = false,
  onExtend,
  onCancel,
}: ExtendPlanDrawerProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(
    plan ? addDays(parseISO(plan.endDate), 14) : undefined
  );

  React.useEffect(() => {
    if (plan) {
      setNewEndDate(addDays(parseISO(plan.endDate), 14));
    }
  }, [plan]);

  if (!plan) return null;

  const currentEndDate = parseISO(plan.endDate);
  const extensionDays = newEndDate ? differenceInDays(newEndDate, currentEndDate) : 0;

  const handleExtend = () => {
    if (newEndDate) {
      onExtend(newEndDate.toISOString());
    }
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onCancel}
      title="Extend Plan Duration"
      size="md"
      actions={[
        {
          label: 'Cancel',
          onClick: onCancel,
          variant: 'secondary',
          disabled: loading,
        },
        {
          label: loading ? 'Extending...' : 'Extend Plan',
          onClick: handleExtend,
          variant: 'primary',
          disabled: loading || !newEndDate || extensionDays <= 0,
        },
      ]}
    >
      {/* Plan Information Section */}
      <FormSection title="Plan Information" tooltip="Current plan details">
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="font-medium">{plan.templateName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Current end date: {format(currentEndDate, 'MMMM d, yyyy')}
          </p>
        </div>
      </FormSection>

      {/* Extension Details Section */}
      <FormSection title="Extension Details" tooltip="Configure the new end date">
        <FormRow>
          <FormField label="Current End Date" tooltip="The existing end date">
            <div className="flex items-center gap-2 text-sm font-medium p-3 bg-muted rounded-lg">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {format(currentEndDate, 'MMM d, yyyy')}
            </div>
          </FormField>
          <FormField label="Extension" tooltip="Number of days being added">
            <div className="flex items-center gap-2 text-sm font-medium text-primary p-3 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4" />
              +{extensionDays} days
            </div>
          </FormField>
        </FormRow>

        <FormField label="New End Date" required tooltip="Select the new end date for the plan">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !newEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newEndDate ? format(newEndDate, 'PPP') : 'Select new end date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newEndDate}
                onSelect={setNewEndDate}
                disabled={(date) => date <= currentEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormField>
      </FormSection>
    </PrimaryOffCanvas>
  );
}