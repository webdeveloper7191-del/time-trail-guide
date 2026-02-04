import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CalendarIcon,
  Target,
  ClipboardCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PerformancePlanTemplate, planTypeLabels, planTypeColors } from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { toast } from 'sonner';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';

interface AssignPlanDrawerProps {
  open: boolean;
  template: PerformancePlanTemplate | null;
  staff: StaffMember[];
  currentUserId: string;
  onClose: () => void;
  onAssign: (data: {
    templateId: string;
    staffIds: string[];
    startDate: Date;
    notes?: string;
    selectedGoals: string[];
    selectedReviews: string[];
    selectedConversations: string[];
  }) => Promise<void>;
}

export function AssignPlanDrawer({
  open,
  template,
  staff,
  currentUserId,
  onClose,
  onAssign,
}: AssignPlanDrawerProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoals, setShowGoals] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showConversations, setShowConversations] = useState(true);
  
  // Track selected items (all selected by default)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      setSelectedGoals(template.goals.map(g => g.id));
      setSelectedReviews(template.reviews.map(r => r.id));
      setSelectedConversations(template.conversations.map(c => c.id));
      setSelectedStaffIds([]);
      setStaffSearch('');
      setStartDate(new Date());
      setNotes('');
    }
  }, [template]);

  const activeStaff = useMemo(() => {
    return staff.filter(s => s.status === 'active' && s.id !== currentUserId);
  }, [staff, currentUserId]);

  const filteredStaff = useMemo(() => {
    return activeStaff
      .filter(s => !selectedStaffIds.includes(s.id))
      .filter(s =>
        staffSearch.trim() === '' ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.position?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.department?.toLowerCase().includes(staffSearch.toLowerCase())
      );
  }, [activeStaff, selectedStaffIds, staffSearch]);

  const handleAddStaff = (staffId: string) => {
    setSelectedStaffIds(prev => [...prev, staffId]);
    setStaffSearch('');
  };

  const handleRemoveStaff = (staffId: string) => {
    setSelectedStaffIds(prev => prev.filter(id => id !== staffId));
  };

  const getStaffById = (id: string) => staff.find(s => s.id === id);

  const endDate = useMemo(() => {
    if (!template) return null;
    return addDays(startDate, template.durationDays);
  }, [startDate, template]);

  const handleSubmit = async () => {
    if (!template || selectedStaffIds.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    if (selectedGoals.length === 0 && selectedReviews.length === 0 && selectedConversations.length === 0) {
      toast.error('Please select at least one goal, review, or conversation');
      return;
    }

    setLoading(true);
    try {
      await onAssign({
        templateId: template.id,
        staffIds: selectedStaffIds,
        startDate,
        notes: notes.trim() || undefined,
        selectedGoals,
        selectedReviews,
        selectedConversations,
      });
      
      toast.success(`Plan assigned to ${selectedStaffIds.length} employee${selectedStaffIds.length > 1 ? 's' : ''}`);
      onClose();
    } catch (error) {
      toast.error('Failed to assign plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleReview = (id: string) => {
    setSelectedReviews(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleConversation = (id: string) => {
    setSelectedConversations(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (!template) return null;

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Assign Performance Plan"
      size="xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary', disabled: loading },
        { 
          label: loading ? 'Assigning...' : `Assign to ${selectedStaffIds.length} Employee${selectedStaffIds.length !== 1 ? 's' : ''}`, 
          onClick: handleSubmit, 
          variant: 'primary', 
          disabled: loading || selectedStaffIds.length === 0 
        },
      ]}
    >
      {/* Template Info Section */}
      <FormSection title="Plan Template" tooltip="The template being assigned">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={planTypeColors[template.type]}>
                {planTypeLabels[template.type]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {template.durationDays} days
              </span>
            </div>
            <h3 className="font-medium">{template.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {template.goals.length} goals
              </span>
              <span className="flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {template.reviews.length} reviews
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {template.conversations.length} conversations
              </span>
            </div>
          </CardContent>
        </Card>
      </FormSection>

      {/* Employee Selection Section */}
      <FormSection title="Assign To" tooltip="Select the employees to assign this plan to">
        <FormField label="Team Members" required tooltip="Select one or more employees">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {filteredStaff.length > 0 && selectedStaffIds.length < activeStaff.length && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedStaffIds(activeStaff.map(s => s.id))}
                  className="h-auto py-1 px-2 text-xs text-primary"
                >
                  Select All
                </Button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Employee List */}
            {filteredStaff.length > 0 && (
              <Card className="bg-background border">
                <ScrollArea className="h-40">
                  <div className="p-2 space-y-1">
                    {filteredStaff.slice(0, 10).map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleAddStaff(s.id)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={s.avatar} />
                          <AvatarFallback className="text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.position}</p>
                        </div>
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    ))}
                    {filteredStaff.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{filteredStaff.length - 10} more — use search to filter
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {/* Selected Staff */}
            {selectedStaffIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStaffIds.map(id => {
                  const member = getStaffById(id);
                  if (!member) return null;
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1 pr-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">{member.firstName[0]}{member.lastName[0]}</AvatarFallback>
                      </Avatar>
                      {member.firstName} {member.lastName}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => handleRemoveStaff(id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </FormField>
      </FormSection>

      {/* Plan Schedule Section */}
      <FormSection title="Plan Schedule" tooltip="Set the start date for this plan">
        <FormField label="Start Date" required>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-full justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {endDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
              <Clock className="h-3.5 w-3.5" />
              Plan ends: {format(endDate, 'MMMM d, yyyy')}
            </p>
          )}
        </FormField>

        <FormField label="Notes" tooltip="Add any additional context or instructions">
          <Textarea
            placeholder="Add context or special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormField>
      </FormSection>

      {/* Customize Plan Items Section */}
      <FormSection title="Plan Items" tooltip="Customize which items to include in this plan">
        <div className="space-y-3">
          {/* Goals */}
          <Collapsible open={showGoals} onOpenChange={setShowGoals}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">Goals</span>
                  <Badge variant="secondary">{selectedGoals.length}/{template.goals.length}</Badge>
                </div>
                {showGoals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 px-2 pt-2">
              {template.goals.map((goal) => (
                <div 
                  key={goal.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    selectedGoals.includes(goal.id) 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-muted bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={selectedGoals.includes(goal.id)}
                    onCheckedChange={() => toggleGoal(goal.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Due: Day {goal.targetDaysFromStart}</span>
                      <Badge variant="outline" className="text-xs">
                        {goal.priority}
                      </Badge>
                      <span>{goal.milestones.length} milestones</span>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Reviews */}
          <Collapsible open={showReviews} onOpenChange={setShowReviews}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">Reviews</span>
                  <Badge variant="secondary">{selectedReviews.length}/{template.reviews.length}</Badge>
                </div>
                {showReviews ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 px-2 pt-2">
              {template.reviews.map((review) => (
                <div 
                  key={review.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    selectedReviews.includes(review.id) 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-muted bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={selectedReviews.includes(review.id)}
                    onCheckedChange={() => toggleReview(review.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{review.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Day {review.daysFromStart}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {review.reviewCycle.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Conversations */}
          <Collapsible open={showConversations} onOpenChange={setShowConversations}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium">1:1 Conversations</span>
                  <Badge variant="secondary">{selectedConversations.length}/{template.conversations.length}</Badge>
                </div>
                {showConversations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 px-2 pt-2">
              {template.conversations.map((conv) => (
                <div 
                  key={conv.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    selectedConversations.includes(conv.id) 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-muted bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={selectedConversations.includes(conv.id)}
                    onCheckedChange={() => toggleConversation(conv.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{conv.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Day {conv.daysFromStart}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {conv.type.replace('_', ' ')}
                      </Badge>
                      <span>{conv.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
}
