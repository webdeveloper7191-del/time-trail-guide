import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithCreate } from '@/components/ui/select-with-create';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { PerformanceReview, ReviewCycle, reviewCycleLabels, ReviewCriteria, defaultReviewCriteria } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { CalendarIcon, ClipboardCheck, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { toast } from 'sonner';

const reviewSchema = z.object({
  staffId: z.string().min(1, 'Team member is required'),
  reviewCycle: z.enum(['annual', 'semi_annual', 'quarterly', 'monthly']),
  periodStart: z.date({ required_error: 'Start date is required' }),
  periodEnd: z.date({ required_error: 'End date is required' }),
});

interface CustomCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface StartReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'> & { customCriteria?: CustomCriteria[] }) => Promise<void>;
  staff: StaffMember[];
  reviewerId: string;
}

export function StartReviewDrawer({ open, onOpenChange, onSubmit, staff, reviewerId }: StartReviewDrawerProps) {
  const [staffId, setStaffId] = useState('');
  const [reviewCycle, setReviewCycle] = useState<ReviewCycle>('quarterly');
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [useCustomCriteria, setUseCustomCriteria] = useState(false);
  const [criteria, setCriteria] = useState<CustomCriteria[]>(
    defaultReviewCriteria.map(c => ({ ...c }))
  );
  const [showAddCriteria, setShowAddCriteria] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newCriteriaDesc, setNewCriteriaDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customCycles, setCustomCycles] = useState<{value: string; label: string}[]>([]);

  const defaultCycleOptions = Object.entries(reviewCycleLabels).map(([value, label]) => ({ value, label }));
  const cycleOptions = useMemo(() => 
    [...defaultCycleOptions, ...customCycles], [customCycles]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const handleCycleChange = (cycle: ReviewCycle) => {
    setReviewCycle(cycle);
    const now = new Date();
    switch (cycle) {
      case 'annual':
        setPeriodStart(startOfYear(now));
        setPeriodEnd(endOfYear(now));
        break;
      case 'semi_annual':
        setPeriodStart(subMonths(now, 6));
        setPeriodEnd(now);
        break;
      case 'quarterly':
        setPeriodStart(startOfQuarter(now));
        setPeriodEnd(endOfQuarter(now));
        break;
      case 'monthly':
        setPeriodStart(subMonths(now, 1));
        setPeriodEnd(now);
        break;
    }
  };

  const handleAddCriteria = () => {
    if (!newCriteriaName.trim()) return;
    
    const remainingWeight = Math.max(0, 100 - totalWeight);
    const defaultWeight = Math.min(15, remainingWeight);
    
    setCriteria([...criteria, {
      id: `custom-${Date.now()}`,
      name: newCriteriaName.trim(),
      description: newCriteriaDesc.trim() || 'Custom evaluation criteria',
      weight: defaultWeight,
    }]);
    setNewCriteriaName('');
    setNewCriteriaDesc('');
    setShowAddCriteria(false);
  };

  const handleRemoveCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleUpdateWeight = (id: string, weight: number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, weight } : c));
  };

  const handleSubmit = async () => {
    const validation = reviewSchema.safeParse({ staffId, reviewCycle, periodStart, periodEnd });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (useCustomCriteria && totalWeight !== 100) {
      setErrors({ criteria: 'Total weight must equal 100%' });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        staffId,
        reviewerId,
        reviewCycle,
        periodStart: format(periodStart!, 'yyyy-MM-dd'),
        periodEnd: format(periodEnd!, 'yyyy-MM-dd'),
        status: 'pending_self',
        ratings: [],
        customCriteria: useCustomCriteria ? criteria : undefined,
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStaffId('');
    setReviewCycle('quarterly');
    setPeriodStart(undefined);
    setPeriodEnd(undefined);
    setUseCustomCriteria(false);
    setCriteria(defaultReviewCriteria.map(c => ({ ...c })));
    setShowAddCriteria(false);
    setNewCriteriaName('');
    setNewCriteriaDesc('');
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const activeStaff = staff.filter(s => s.status === 'active');

  return (
    <PrimaryOffCanvas
      title="Start Performance Review"
      icon={ClipboardCheck}
      size="lg"
      open={open}
      onClose={handleClose}
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'secondary' },
        { label: loading ? 'Starting...' : 'Start Review', onClick: handleSubmit, variant: 'primary', disabled: loading, loading },
      ]}
    >
      {/* Review Setup Section */}
      <FormSection title="Review Setup" tooltip="Configure the review cycle and team member">
        <FormField label="Team Member" required error={errors.staffId}>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className={errors.staffId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {activeStaff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.avatar} />
                      <AvatarFallback className="text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                    </Avatar>
                    {s.firstName} {s.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Review Cycle" required tooltip="Select the review frequency">
          <SelectWithCreate
            value={reviewCycle}
            onValueChange={v => handleCycleChange(v as ReviewCycle)}
            options={cycleOptions}
            onCreateNew={(newCycle) => {
              setCustomCycles(prev => [...prev, { value: newCycle.toLowerCase().replace(/\s+/g, '_'), label: newCycle }]);
              toast.success(`Review cycle "${newCycle}" created`);
            }}
            placeholder="Select cycle"
            createLabel="Create new cycle"
          />
        </FormField>
      </FormSection>

      {/* Review Period Section */}
      <FormSection title="Review Period" tooltip="Define the evaluation period dates">
        <FormRow>
          <FormField label="Period Start" required>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !periodStart && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStart ? format(periodStart, 'MMM d, yyyy') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} initialFocus />
              </PopoverContent>
            </Popover>
          </FormField>

          <FormField label="Period End" required>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !periodEnd && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEnd ? format(periodEnd, 'MMM d, yyyy') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} initialFocus />
              </PopoverContent>
            </Popover>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Rating Criteria Section */}
      <FormSection title="Rating Criteria" tooltip="Customize the evaluation criteria and weights">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={useCustomCriteria ? 'default' : 'secondary'} className="text-xs">
            {useCustomCriteria ? 'Custom Criteria' : 'Default Criteria'}
          </Badge>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setUseCustomCriteria(!useCustomCriteria)}
            className="text-primary"
          >
            {useCustomCriteria ? 'Use Default' : 'Customize'}
          </Button>
        </div>

        {useCustomCriteria && (
          <>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground">Total Weight:</span>
              <Badge variant={totalWeight === 100 ? 'default' : 'destructive'}>
                {totalWeight}%
              </Badge>
            </div>
            {errors.criteria && <p className="text-xs text-destructive mb-2">{errors.criteria}</p>}

            <ScrollArea className="h-64">
              <div className="space-y-3 pr-2">
                {criteria.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 mt-1 text-muted-foreground cursor-grab" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{c.name}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleRemoveCriteria(c.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[c.weight]}
                              onValueChange={([val]) => handleUpdateWeight(c.id, val)}
                              max={50}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-10 text-right">{c.weight}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {showAddCriteria ? (
              <Card className="mt-3">
                <CardContent className="p-3 space-y-2">
                  <Input
                    placeholder="Criteria name (e.g., Innovation)"
                    value={newCriteriaName}
                    onChange={e => setNewCriteriaName(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newCriteriaDesc}
                    onChange={e => setNewCriteriaDesc(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddCriteria} disabled={!newCriteriaName.trim()}>
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddCriteria(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full mt-3 text-primary"
                onClick={() => setShowAddCriteria(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Custom Criteria
              </Button>
            )}
          </>
        )}

        {!useCustomCriteria && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-2">Default criteria includes:</p>
            <ul className="space-y-1">
              {defaultReviewCriteria.slice(0, 4).map(c => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-xs">{c.weight}%</span>
                </li>
              ))}
              <li className="text-xs text-muted-foreground">+ 2 more criteria</li>
            </ul>
          </div>
        )}
      </FormSection>

      {/* Info Section */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          The team member will receive a notification to complete their self-review first.
        </p>
      </div>
    </PrimaryOffCanvas>
  );
}

export default StartReviewDrawer;
