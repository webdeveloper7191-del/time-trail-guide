import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarIcon,
  Target,
  ClipboardCheck,
  MessageSquare,
  Users,
  Clock,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PerformancePlanTemplate, planTypeLabels, planTypeColors } from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { toast } from 'sonner';

interface StaffAssignment {
  staffId: string;
  startDate: Date;
  notes?: string;
}

interface BulkAssignPlanDrawerProps {
  open: boolean;
  template: PerformancePlanTemplate | null;
  staff: StaffMember[];
  currentUserId: string;
  onClose: () => void;
  onAssign: (assignments: StaffAssignment[], selectedGoals: string[], selectedReviews: string[], selectedConversations: string[]) => Promise<void>;
}

export function BulkAssignPlanDrawer({
  open,
  template,
  staff,
  currentUserId,
  onClose,
  onAssign,
}: BulkAssignPlanDrawerProps) {
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [baseStartDate, setBaseStartDate] = useState<Date>(new Date());
  const [staggerDays, setStaggerDays] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Selected items (all by default)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  const activeStaff = useMemo(() => {
    return staff.filter(s => s.status === 'active' && s.id !== currentUserId);
  }, [staff, currentUserId]);

  const availableStaff = useMemo(() => {
    const assignedIds = assignments.map(a => a.staffId);
    return activeStaff.filter(s => !assignedIds.includes(s.id));
  }, [activeStaff, assignments]);

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      setSelectedGoals(template.goals.map(g => g.id));
      setSelectedReviews(template.reviews.map(r => r.id));
      setSelectedConversations(template.conversations.map(c => c.id));
      setAssignments([]);
      setBaseStartDate(new Date());
      setStaggerDays(0);
    }
  }, [template]);

  const addStaffMember = (staffId: string) => {
    const staggeredDate = addDays(baseStartDate, staggerDays * assignments.length);
    setAssignments([...assignments, { staffId, startDate: staggeredDate }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignmentDate = (index: number, date: Date) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], startDate: date };
    setAssignments(updated);
  };

  const updateAssignmentNotes = (index: number, notes: string) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], notes };
    setAssignments(updated);
  };

  const applyStaggeredDates = () => {
    const updated = assignments.map((a, i) => ({
      ...a,
      startDate: addDays(baseStartDate, staggerDays * i),
    }));
    setAssignments(updated);
    toast.success('Staggered dates applied');
  };

  const handleSubmit = async () => {
    if (!template) return;
    
    if (assignments.length === 0) {
      toast.error('Please add at least one team member');
      return;
    }

    if (selectedGoals.length === 0 && selectedReviews.length === 0 && selectedConversations.length === 0) {
      toast.error('Please select at least one goal, review, or conversation');
      return;
    }

    setLoading(true);
    try {
      await onAssign(assignments, selectedGoals, selectedReviews, selectedConversations);
      toast.success(`Plan assigned to ${assignments.length} team members`);
      onClose();
    } catch (error) {
      toast.error('Failed to assign plans');
    } finally {
      setLoading(false);
    }
  };

  const getStaffById = (id: string) => staff.find(s => s.id === id);

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-1 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Assign Plan
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Badge className={planTypeColors[template.type]}>
              {planTypeLabels[template.type]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {template.name}
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Stagger Settings */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium">Staggered Start Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(baseStartDate, 'MMM d, yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={baseStartDate}
                          onSelect={(d) => d && setBaseStartDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Days Between Each Start</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={staggerDays}
                        onChange={(e) => setStaggerDays(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                      {assignments.length > 0 && staggerDays > 0 && (
                        <Button size="sm" variant="outline" onClick={applyStaggeredDates}>
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {staggerDays > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Each person will start {staggerDays} days after the previous
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add Staff Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Team Members ({assignments.length})</Label>
              </div>
              
              {/* Staff Selector */}
              {availableStaff.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  {availableStaff.slice(0, 10).map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant="outline"
                      onClick={() => addStaffMember(s.id)}
                      className="h-8"
                    >
                      <Avatar className="h-5 w-5 mr-1">
                        <AvatarImage src={s.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {s.firstName[0]}{s.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {s.firstName} {s.lastName}
                      <Plus className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                  {availableStaff.length > 10 && (
                    <span className="text-sm text-muted-foreground self-center">
                      +{availableStaff.length - 10} more
                    </span>
                  )}
                </div>
              )}

              {/* Assignment List */}
              <div className="space-y-2">
                {assignments.map((assignment, index) => {
                  const staffMember = getStaffById(assignment.staffId);
                  const endDate = addDays(assignment.startDate, template.durationDays);
                  
                  return (
                    <Card key={assignment.staffId}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staffMember?.avatar} />
                            <AvatarFallback>
                              {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {staffMember?.firstName} {staffMember?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {staffMember?.position}
                                </p>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => removeAssignment(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    {format(assignment.startDate, 'MMM d, yyyy')}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={assignment.startDate}
                                    onSelect={(d) => d && updateAssignmentDate(index, d)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <span className="text-xs text-muted-foreground">
                                → {format(endDate, 'MMM d, yyyy')}
                              </span>
                            </div>

                            <Input
                              placeholder="Optional notes..."
                              value={assignment.notes || ''}
                              onChange={(e) => updateAssignmentNotes(index, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {assignments.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click team members above to add them</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Plan Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Target className="h-4 w-4" />
                      <span className="font-bold">{selectedGoals.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="font-bold">{selectedReviews.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-bold">{selectedConversations.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">1:1 Meetings</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="text-center">
                  <p className="text-sm">
                    <span className="font-bold text-lg">{assignments.length}</span> team members × {template.durationDays} days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-auto">
          <div className="text-sm text-muted-foreground">
            {assignments.length} assignments ready
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || assignments.length === 0}>
              {loading ? 'Assigning...' : `Assign to ${assignments.length} People`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
