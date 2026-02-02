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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CalendarIcon, Save, FileText, Clock, Target, BookOpen, MessageSquare, 
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  AssignedPlan, 
  planStatusLabels, 
  planTypeLabels,
  planTypeColors,
  PlanStatus,
  PlanType,
  PlanGoalTemplate,
  PlanReviewTemplate,
  PlanConversationTemplate,
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

// Editable goal item component
function EditableGoalItem({
  goal,
  index,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
}: {
  goal: PlanGoalTemplate;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<PlanGoalTemplate>) => void;
  onRemove: () => void;
}) {
  const priorityOptions = ['low', 'medium', 'high', 'critical'] as const;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{goal.title || 'Untitled Goal'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">{goal.category}</Badge>
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
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {expanded && (
        <div className="p-4 space-y-4 border-t">
          <div className="space-y-2">
            <Label className="text-xs">Goal Title</Label>
            <Input
              value={goal.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Enter goal title"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={goal.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe the goal..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Input
                value={goal.category}
                onChange={(e) => onUpdate({ category: e.target.value })}
                placeholder="Category"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Priority</Label>
              <Select
                value={goal.priority}
                onValueChange={(value) => onUpdate({ priority: value as typeof goal.priority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target Day</Label>
              <Input
                type="number"
                value={goal.targetDaysFromStart}
                onChange={(e) => onUpdate({ targetDaysFromStart: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>
          
          {/* Milestones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Milestones</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onUpdate({
                  milestones: [...goal.milestones, { title: '', daysFromStart: goal.targetDaysFromStart }]
                })}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {goal.milestones.map((milestone, mIdx) => (
                <div key={mIdx} className="flex items-center gap-2">
                  <Input
                    value={milestone.title}
                    onChange={(e) => {
                      const newMilestones = [...goal.milestones];
                      newMilestones[mIdx] = { ...milestone, title: e.target.value };
                      onUpdate({ milestones: newMilestones });
                    }}
                    placeholder="Milestone title"
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    value={milestone.daysFromStart}
                    onChange={(e) => {
                      const newMilestones = [...goal.milestones];
                      newMilestones[mIdx] = { ...milestone, daysFromStart: parseInt(e.target.value) || 0 };
                      onUpdate({ milestones: newMilestones });
                    }}
                    className="w-20 h-8 text-sm"
                    min={0}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newMilestones = goal.milestones.filter((_, i) => i !== mIdx);
                      onUpdate({ milestones: newMilestones });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {goal.milestones.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No milestones added</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Editable review item component
function EditableReviewItem({
  review,
  index,
  onUpdate,
  onRemove,
}: {
  review: PlanReviewTemplate;
  index: number;
  onUpdate: (updates: Partial<PlanReviewTemplate>) => void;
  onRemove: () => void;
}) {
  const cycleOptions = ['monthly', 'quarterly', 'semi_annual', 'annual'] as const;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <Input
                value={review.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Review title"
                className="flex-1 h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={review.reviewCycle}
                onValueChange={(value) => onUpdate({ reviewCycle: value as typeof review.reviewCycle })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cycleOptions.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize text-xs">
                      {c.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Day</span>
                <Input
                  type="number"
                  value={review.daysFromStart}
                  onChange={(e) => onUpdate({ daysFromStart: parseInt(e.target.value) || 0 })}
                  className="w-16 h-8 text-xs"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Editable conversation item component
function EditableConversationItem({
  conversation,
  index,
  onUpdate,
  onRemove,
}: {
  conversation: PlanConversationTemplate;
  index: number;
  onUpdate: (updates: Partial<PlanConversationTemplate>) => void;
  onRemove: () => void;
}) {
  const typeOptions = ['one_on_one', 'check_in', 'coaching', 'feedback', 'career'] as const;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <Input
                value={conversation.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Conversation title"
                className="flex-1 h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={conversation.type}
                onValueChange={(value) => onUpdate({ type: value as typeof conversation.type })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize text-xs">
                      {t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  value={conversation.duration}
                  onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 30 })}
                  className="w-14 h-8 text-xs"
                  min={15}
                  step={15}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Day</span>
                <Input
                  type="number"
                  value={conversation.daysFromStart}
                  onChange={(e) => onUpdate({ daysFromStart: parseInt(e.target.value) || 0 })}
                  className="w-14 h-8 text-xs"
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Agenda Items</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onUpdate({
                    agendaItems: [...(conversation.agendaItems || []), '']
                  })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              {(conversation.agendaItems || []).map((item, aIdx) => (
                <div key={aIdx} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(conversation.agendaItems || [])];
                      newItems[aIdx] = e.target.value;
                      onUpdate({ agendaItems: newItems });
                    }}
                    placeholder="Agenda item"
                    className="flex-1 h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newItems = (conversation.agendaItems || []).filter((_, i) => i !== aIdx);
                      onUpdate({ agendaItems: newItems });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  
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

  // Local editable copies of template items
  const [customGoals, setCustomGoals] = useState<PlanGoalTemplate[]>([]);
  const [customReviews, setCustomReviews] = useState<PlanReviewTemplate[]>([]);
  const [customConversations, setCustomConversations] = useState<PlanConversationTemplate[]>([]);

  const allTemplates = useMemo(() => performancePlanTemplates, []);

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
      
      // Load template items as editable copies
      const template = allTemplates.find(t => t.id === plan.templateId);
      if (template) {
        setCustomGoals(template.goals.map(g => ({ ...g, milestones: [...g.milestones] })));
        setCustomReviews(template.reviews.map(r => ({ ...r })));
        setCustomConversations(template.conversations.map(c => ({ ...c, agendaItems: c.agendaItems ? [...c.agendaItems] : [] })));
      }
      
      setActiveTab('general');
      setExpandedGoals(new Set());
    }
  }, [plan, allTemplates]);

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
      // Reset to template defaults
      setCustomGoals(template.goals.map(g => ({ ...g, milestones: [...g.milestones] })));
      setCustomReviews(template.reviews.map(r => ({ ...r })));
      setCustomConversations(template.conversations.map(c => ({ ...c, agendaItems: c.agendaItems ? [...c.agendaItems] : [] })));
      setExpandedGoals(new Set());
    }
  };

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

  // Goal handlers
  const handleUpdateGoal = (goalId: string, updates: Partial<PlanGoalTemplate>) => {
    setCustomGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  };

  const handleRemoveGoal = (goalId: string) => {
    setCustomGoals(prev => prev.filter(g => g.id !== goalId));
    setExpandedGoals(prev => {
      const next = new Set(prev);
      next.delete(goalId);
      return next;
    });
  };

  const handleAddGoal = () => {
    const newGoal: PlanGoalTemplate = {
      id: `goal-${Date.now()}`,
      title: '',
      description: '',
      category: 'Development',
      priority: 'medium',
      targetDaysFromStart: 30,
      milestones: [],
    };
    setCustomGoals(prev => [...prev, newGoal]);
    setExpandedGoals(prev => new Set(prev).add(newGoal.id));
  };

  const toggleGoalExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  // Review handlers
  const handleUpdateReview = (reviewId: string, updates: Partial<PlanReviewTemplate>) => {
    setCustomReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));
  };

  const handleRemoveReview = (reviewId: string) => {
    setCustomReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const handleAddReview = () => {
    const newReview: PlanReviewTemplate = {
      id: `review-${Date.now()}`,
      title: 'New Review',
      reviewCycle: 'quarterly',
      daysFromStart: 90,
    };
    setCustomReviews(prev => [...prev, newReview]);
  };

  // Conversation handlers
  const handleUpdateConversation = (convId: string, updates: Partial<PlanConversationTemplate>) => {
    setCustomConversations(prev => prev.map(c => c.id === convId ? { ...c, ...updates } : c));
  };

  const handleRemoveConversation = (convId: string) => {
    setCustomConversations(prev => prev.filter(c => c.id !== convId));
  };

  const handleAddConversation = () => {
    const newConv: PlanConversationTemplate = {
      id: `conv-${Date.now()}`,
      title: 'New 1:1',
      type: 'one_on_one',
      daysFromStart: 7,
      duration: 30,
      agendaItems: [],
    };
    setCustomConversations(prev => [...prev, newConv]);
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
        // Note: In a real implementation, you'd save customGoals, customReviews, customConversations
        // to the backend as part of the plan's custom configuration
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
              <TabsTrigger value="goals" className="text-xs">
                Goals ({customGoals.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">
                Reviews ({customReviews.length})
              </TabsTrigger>
              <TabsTrigger value="conversations" className="text-xs">
                1:1s ({customConversations.length})
              </TabsTrigger>
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
              <Card className="bg-muted/30">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Plan Configuration</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-semibold">{customGoals.length}</p>
                      <p className="text-xs text-muted-foreground">Goals</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{customReviews.length}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{customConversations.length}</p>
                      <p className="text-xs text-muted-foreground">1:1s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="mt-4 space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Customize goals for this plan assignment.
                </p>
                <Button size="sm" onClick={handleAddGoal}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>

              {customGoals.length > 0 ? (
                <div className="space-y-3">
                  {customGoals.map((goal, index) => (
                    <EditableGoalItem
                      key={goal.id}
                      goal={goal}
                      index={index}
                      expanded={expandedGoals.has(goal.id)}
                      onToggle={() => toggleGoalExpand(goal.id)}
                      onUpdate={(updates) => handleUpdateGoal(goal.id, updates)}
                      onRemove={() => handleRemoveGoal(goal.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No goals defined</p>
                  <Button variant="link" size="sm" onClick={handleAddGoal} className="mt-2">
                    Add your first goal
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4 space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Configure performance reviews for this plan.
                </p>
                <Button size="sm" onClick={handleAddReview}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Review
                </Button>
              </div>

              {customReviews.length > 0 ? (
                <div className="space-y-3">
                  {customReviews.map((review, index) => (
                    <EditableReviewItem
                      key={review.id}
                      review={review}
                      index={index}
                      onUpdate={(updates) => handleUpdateReview(review.id, updates)}
                      onRemove={() => handleRemoveReview(review.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reviews defined</p>
                  <Button variant="link" size="sm" onClick={handleAddReview} className="mt-2">
                    Add your first review
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-4 space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Schedule 1:1 conversations and check-ins.
                </p>
                <Button size="sm" onClick={handleAddConversation}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add 1:1
                </Button>
              </div>

              {customConversations.length > 0 ? (
                <div className="space-y-3">
                  {customConversations.map((conv, index) => (
                    <EditableConversationItem
                      key={conv.id}
                      conversation={conv}
                      index={index}
                      onUpdate={(updates) => handleUpdateConversation(conv.id, updates)}
                      onRemove={() => handleRemoveConversation(conv.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations defined</p>
                  <Button variant="link" size="sm" onClick={handleAddConversation} className="mt-2">
                    Add your first 1:1
                  </Button>
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
