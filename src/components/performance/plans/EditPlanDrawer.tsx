import React, { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarIcon, Save, User, FileText, Clock, Target, BookOpen, MessageSquare, Users, RefreshCw, Trash2, Plus, GripVertical } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  AssignedPlan, 
  planStatusLabels, 
  planTypeLabels,
  planTypeColors,
  PlanStatus,
  PlanType,
  PerformancePlanTemplate,
} from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';
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
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    templateId: '',
    templateName: '',
    staffId: '',
    type: 'onboarding' as PlanType,
    notes: '',
    startDate: new Date(),
    endDate: new Date(),
    status: 'active' as PlanStatus,
  });

  // Get all templates
  const allTemplates = useMemo(() => performancePlanTemplates, []);

  // Find the selected template
  const selectedTemplate = useMemo(() => 
    allTemplates.find(t => t.id === formData.templateId),
    [allTemplates, formData.templateId]
  );

  const staffMember = staff.find(s => s.id === formData.staffId);

  useEffect(() => {
    if (plan) {
      setFormData({
        templateId: plan.templateId,
        templateName: plan.templateName,
        staffId: plan.staffId,
        type: plan.type,
        notes: plan.notes || '',
        startDate: parseISO(plan.startDate),
        endDate: parseISO(plan.endDate),
        status: plan.status,
      });
      setActiveTab('general');
    }
  }, [plan]);

  // When template changes, update related fields
  const handleTemplateChange = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (template) {
      const newEndDate = addDays(formData.startDate, template.durationDays);
      setFormData(prev => ({
        ...prev,
        templateId,
        templateName: template.name,
        type: template.type,
        endDate: newEndDate,
      }));
    }
  };

  // When start date changes, recalculate end date based on template duration
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    const template = allTemplates.find(t => t.id === formData.templateId);
    const durationDays = template?.durationDays || 90;
    setFormData(prev => ({
      ...prev,
      startDate: date,
      endDate: addDays(date, durationDays),
    }));
  };

  const handleSave = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      await onSave(plan.id, {
        templateId: formData.templateId,
        templateName: formData.templateName,
        staffId: formData.staffId,
        type: formData.type,
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
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Edit Performance Plan
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b bg-muted/30">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
              <TabsTrigger value="conversations" className="text-xs">1:1s</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6">
            {/* General Tab */}
            <TabsContent value="general" className="mt-4 space-y-6">
              {/* Staff Member Selection */}
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={formData.staffId}
                  onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={s.avatar} />
                            <AvatarFallback className="text-xs">
                              {s.firstName[0]}{s.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{s.firstName} {s.lastName}</span>
                          <span className="text-muted-foreground">- {s.position}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Template Selection */}
              <div className="space-y-2">
                <Label>Plan Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan template" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{template.name}</span>
                          <Badge variant="secondary" className="text-xs ml-1">
                            {template.durationDays}d
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              {/* Plan Type */}
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as PlanType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(planTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs', planTypeColors[key as PlanType])}>
                            {label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
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
                        onSelect={handleStartDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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

              {/* Plan Summary Stats */}
              {selectedTemplate && (
                <Card className="bg-muted/30">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Template Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-lg font-semibold">{selectedTemplate.goals.length}</p>
                        <p className="text-xs text-muted-foreground">Goals</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{selectedTemplate.reviews.length}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{selectedTemplate.conversations.length}</p>
                        <p className="text-xs text-muted-foreground">1:1s</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{selectedTemplate.durationDays}</p>
                        <p className="text-xs text-muted-foreground">Days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Goals from the selected template that will be created for the assignee.
                </p>
              </div>

              {selectedTemplate?.goals.length ? (
                <Accordion type="multiple" className="space-y-2">
                  {selectedTemplate.goals.map((goal, index) => (
                    <AccordionItem 
                      key={goal.id} 
                      value={goal.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {goal.category}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  'text-xs',
                                  goal.priority === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                  goal.priority === 'high' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                  goal.priority === 'medium' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                  goal.priority === 'low' && 'bg-muted text-muted-foreground',
                                )}
                              >
                                {goal.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Day {goal.targetDaysFromStart}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                        {goal.milestones.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Milestones
                            </p>
                            <div className="space-y-2 pl-2 border-l-2 border-muted">
                              {goal.milestones.map((milestone, mIndex) => (
                                <div key={mIndex} className="flex items-center justify-between text-sm">
                                  <span>{milestone.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Day {milestone.daysFromStart}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No goals defined in this template</p>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Scheduled performance reviews based on the template.
                </p>
              </div>

              {selectedTemplate?.reviews.length ? (
                <div className="space-y-3">
                  {selectedTemplate.reviews.map((review, index) => (
                    <Card key={review.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{review.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {review.reviewCycle.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Day {review.daysFromStart}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reviews defined in this template</p>
                </div>
              )}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Scheduled 1:1 conversations and check-ins.
                </p>
              </div>

              {selectedTemplate?.conversations.length ? (
                <div className="space-y-3">
                  {selectedTemplate.conversations.map((conv, index) => (
                    <Card key={conv.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{conv.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {conv.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {conv.duration} min
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Day {conv.daysFromStart}
                                </span>
                              </div>
                              {conv.agendaItems && conv.agendaItems.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    Agenda: {conv.agendaItems.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations defined in this template</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="flex-row gap-2 px-6 py-4 border-t">
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
