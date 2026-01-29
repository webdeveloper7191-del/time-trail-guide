import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  Target,
  ClipboardCheck,
  MessageSquare,
  Search,
  Clock,
  Building2,
  FileText,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  PerformancePlanTemplate, 
  planTypeLabels, 
  planTypeColors,
  PlanType 
} from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';
import { toast } from 'sonner';

interface QuickAssignPlanDrawerProps {
  open: boolean;
  staff: StaffMember[];
  currentUserId: string;
  onClose: () => void;
  onAssign: (data: {
    templateId: string;
    staffId: string;
    startDate: Date;
    notes?: string;
    selectedGoals: string[];
    selectedReviews: string[];
    selectedConversations: string[];
  }) => Promise<void>;
}

export function QuickAssignPlanDrawer({
  open,
  staff,
  currentUserId,
  onClose,
  onAssign,
}: QuickAssignPlanDrawerProps) {
  const [step, setStep] = useState<'select-template' | 'configure'>('select-template');
  const [selectedTemplate, setSelectedTemplate] = useState<PerformancePlanTemplate | null>(null);
  const [staffId, setStaffId] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PlanType | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Reset form when drawer closes
  React.useEffect(() => {
    if (!open) {
      setStep('select-template');
      setSelectedTemplate(null);
      setStaffId('');
      setStartDate(new Date());
      setNotes('');
      setSearchQuery('');
      setTypeFilter('all');
      setIndustryFilter('all');
    }
  }, [open]);

  const activeStaff = useMemo(() => {
    return staff.filter(s => s.status === 'active' && s.id !== currentUserId);
  }, [staff, currentUserId]);

  const filteredTemplates = useMemo(() => {
    return performancePlanTemplates.filter(t => {
      const matchesSearch = searchQuery === '' || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesIndustry = industryFilter === 'all' || t.industry === industryFilter;
      return matchesSearch && matchesType && matchesIndustry;
    });
  }, [searchQuery, typeFilter, industryFilter]);

  const uniqueIndustries = useMemo(() => {
    const industries = performancePlanTemplates
      .map(t => t.industry)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    return industries as string[];
  }, []);

  const endDate = useMemo(() => {
    if (!selectedTemplate) return null;
    return addDays(startDate, selectedTemplate.durationDays);
  }, [startDate, selectedTemplate]);

  const handleSelectTemplate = (template: PerformancePlanTemplate) => {
    setSelectedTemplate(template);
    setStep('configure');
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || !staffId) {
      toast.error('Please select a team member');
      return;
    }

    setLoading(true);
    try {
      await onAssign({
        templateId: selectedTemplate.id,
        staffId,
        startDate,
        notes: notes.trim() || undefined,
        selectedGoals: selectedTemplate.goals.map(g => g.id),
        selectedReviews: selectedTemplate.reviews.map(r => r.id),
        selectedConversations: selectedTemplate.conversations.map(c => c.id),
      });
      
      const staffMember = staff.find(s => s.id === staffId);
      toast.success(`Plan assigned to ${staffMember?.firstName} ${staffMember?.lastName}`);
      onClose();
    } catch (error) {
      toast.error('Failed to assign plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="space-y-1 px-4 sm:px-6 py-3 sm:py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            {step === 'select-template' ? 'Select Plan Template' : 'Assign Performance Plan'}
          </SheetTitle>
          {selectedTemplate && step === 'configure' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={planTypeColors[selectedTemplate.type]}>
                {planTypeLabels[selectedTemplate.type]}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {selectedTemplate.durationDays} days
              </span>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-0 px-4 sm:px-6">
          {step === 'select-template' ? (
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Search and Filters */}
              <div className="space-y-2 sm:space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PlanType | 'all')}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Plan Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="annual_development">Annual Development</SelectItem>
                      <SelectItem value="performance_improvement">PIP</SelectItem>
                      <SelectItem value="leadership_development">Leadership</SelectItem>
                      <SelectItem value="skill_development">Skill Development</SelectItem>
                      <SelectItem value="succession">Succession</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {uniqueIndustries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template List */}
              <div className="space-y-2">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    No templates found
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate text-sm sm:text-base">{template.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                              <Badge className={cn("text-xs", planTypeColors[template.type])}>
                                {planTypeLabels[template.type]}
                              </Badge>
                              {template.industry && (
                                <Badge variant="outline" className="text-xs gap-1 hidden sm:inline-flex">
                                  <Building2 className="h-3 w-3" />
                                  {template.industry}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {template.durationDays}d
                              </span>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {template.goals.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClipboardCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {template.reviews.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {template.conversations.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
              {/* Template Info */}
              {selectedTemplate && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">{selectedTemplate.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {selectedTemplate.description}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setStep('select-template')}
                        className="shrink-0"
                      >
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {selectedTemplate.goals.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {selectedTemplate.reviews.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {selectedTemplate.conversations.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Employee Selection */}
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={s.avatar} />
                            <AvatarFallback className="text-xs">
                              {s.firstName[0]}{s.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {s.firstName} {s.lastName}
                          <span className="text-muted-foreground">• {s.position}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date *</Label>
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
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Plan ends: {format(endDate, 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add context or special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t mt-auto">
          {step === 'configure' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('select-template')}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          {step === 'configure' && (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !staffId || !selectedTemplate}
              className="w-full sm:w-auto"
            >
              {loading ? 'Assigning...' : 'Assign Plan'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
