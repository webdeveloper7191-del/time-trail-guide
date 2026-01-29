import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StaffMember } from '@/types/staff';
import { Feedback360Competency, FeedbackSourceType, feedbackSourceLabels } from '@/types/advancedPerformance';
import { mock360Competencies } from '@/data/mockAdvancedPerformanceData';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Users, Plus, X, UserCheck, Search, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';

const request360Schema = z.object({
  subjectStaffId: z.string().min(1, 'Subject employee is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  dueDate: z.date({ required_error: 'Due date is required' }),
});

interface Responder {
  staffId: string;
  sourceType: FeedbackSourceType;
}

interface Request360FeedbackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    subjectStaffId: string;
    title: string;
    description: string;
    dueDate: string;
    anonymousResponses: boolean;
    includeSelfAssessment: boolean;
    selectedCompetencies: string[];
    responders: Responder[];
  }) => Promise<void>;
  staff: StaffMember[];
  currentUserId: string;
}

const sourceTypeColors: Record<FeedbackSourceType, string> = {
  self: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  peer: 'bg-green-100 text-green-700 border-green-200',
  direct_report: 'bg-pink-100 text-pink-700 border-pink-200',
  cross_functional: 'bg-amber-100 text-amber-700 border-amber-200',
  external: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Request360FeedbackDrawer({ 
  open, 
  onOpenChange, 
  onSubmit, 
  staff, 
  currentUserId 
}: Request360FeedbackDrawerProps) {
  const [subjectStaffId, setSubjectStaffId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 14));
  const [anonymousResponses, setAnonymousResponses] = useState(true);
  const [includeSelfAssessment, setIncludeSelfAssessment] = useState(true);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    mock360Competencies.slice(0, 4).map(c => c.id)
  );
  const [responders, setResponders] = useState<Responder[]>([]);
  const [responderSearch, setResponderSearch] = useState('');
  const [responderSourceType, setResponderSourceType] = useState<FeedbackSourceType>('peer');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeStaff = useMemo(() => 
    staff.filter(s => s.status === 'active' && s.id !== currentUserId), 
    [staff, currentUserId]
  );

  const filteredStaffForResponders = useMemo(() => {
    const addedIds = responders.map(r => r.staffId);
    return activeStaff
      .filter(s => s.id !== subjectStaffId && !addedIds.includes(s.id))
      .filter(s => 
        responderSearch.trim() === '' ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(responderSearch.toLowerCase()) ||
        s.position?.toLowerCase().includes(responderSearch.toLowerCase()) ||
        s.department?.toLowerCase().includes(responderSearch.toLowerCase())
      );
  }, [activeStaff, subjectStaffId, responders, responderSearch]);

  const handleAddResponder = (staffId: string) => {
    setResponders([...responders, { staffId, sourceType: responderSourceType }]);
    setResponderSearch('');
  };

  const handleRemoveResponder = (index: number) => {
    setResponders(responders.filter((_, i) => i !== index));
  };

  const handleToggleCompetency = (competencyId: string) => {
    setSelectedCompetencies(prev => 
      prev.includes(competencyId)
        ? prev.filter(id => id !== competencyId)
        : [...prev, competencyId]
    );
  };

  const handleSubmit = async () => {
    const validation = request360Schema.safeParse({ subjectStaffId, title, dueDate });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (responders.length === 0) {
      toast.error('Please add at least one feedback responder');
      return;
    }

    if (selectedCompetencies.length === 0) {
      toast.error('Please select at least one competency to assess');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        subjectStaffId,
        title,
        description,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        anonymousResponses,
        includeSelfAssessment,
        selectedCompetencies,
        responders,
      });
      onOpenChange(false);
      resetForm();
      toast.success('360° feedback request sent successfully');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubjectStaffId('');
    setTitle('');
    setDescription('');
    setDueDate(addDays(new Date(), 14));
    setAnonymousResponses(true);
    setIncludeSelfAssessment(true);
    setSelectedCompetencies(mock360Competencies.slice(0, 4).map(c => c.id));
    setResponders([]);
    setResponderSearch('');
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const getStaffById = (id: string) => staff.find(s => s.id === id);

  return (
    <PrimaryOffCanvas
      title="Request 360° Feedback"
      description="Collect multi-source feedback for comprehensive evaluation"
      icon={MessageCircle}
      size="lg"
      open={open}
      onClose={handleClose}
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
        { label: loading ? 'Sending...' : 'Send Requests', onClick: handleSubmit, variant: 'primary', disabled: loading || responders.length === 0, loading },
      ]}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Subject Selection */}
        <div className="space-y-2">
          <Label>Employee to Receive Feedback *</Label>
          <Select value={subjectStaffId} onValueChange={setSubjectStaffId}>
            <SelectTrigger className={errors.subjectStaffId ? 'border-destructive' : ''}>
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
                    <span className="truncate">{s.firstName} {s.lastName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subjectStaffId && <p className="text-xs text-destructive">{errors.subjectStaffId}</p>}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <Label>Feedback Request Title *</Label>
          <Input
            placeholder="e.g., Q1 2025 Performance Review"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            placeholder="Add context for responders..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Due Date & Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="single" 
                  selected={dueDate} 
                  onSelect={d => d && setDueDate(d)} 
                  initialFocus 
                  disabled={d => d < new Date()} 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 sm:space-y-3 sm:pt-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="anonymous" 
                checked={anonymousResponses} 
                onCheckedChange={c => setAnonymousResponses(!!c)} 
              />
              <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                Anonymous responses
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="selfAssess" 
                checked={includeSelfAssessment} 
                onCheckedChange={c => setIncludeSelfAssessment(!!c)} 
              />
              <Label htmlFor="selfAssess" className="text-sm font-normal cursor-pointer">
                Include self-assessment
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Competencies Selection */}
        <div className="space-y-3">
          <Label>Competencies to Assess ({selectedCompetencies.length} selected)</Label>
          <div className="flex flex-wrap gap-2">
            {mock360Competencies.map(comp => (
              <Badge
                key={comp.id}
                variant={selectedCompetencies.includes(comp.id) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => handleToggleCompetency(comp.id)}
              >
                {comp.name}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Responders Section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Feedback Responders ({responders.length})
          </Label>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={responderSourceType} onValueChange={v => setResponderSourceType(v as FeedbackSourceType)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(feedbackSourceLabels) as FeedbackSourceType[])
                  .filter(t => t !== 'self')
                  .map(type => (
                    <SelectItem key={type} value={type}>{feedbackSourceLabels[type]}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={responderSearch}
                onChange={e => setResponderSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Filtered Staff to Add */}
          {responderSearch && filteredStaffForResponders.length > 0 && (
            <Card>
              <ScrollArea className="h-32">
                <div className="p-2 space-y-1">
                  {filteredStaffForResponders.slice(0, 5).map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleAddResponder(s.id)}
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
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Added Responders */}
          <div className="space-y-2">
            {responders.map((responder, index) => {
              const staffMember = getStaffById(responder.staffId);
              if (!staffMember) return null;
              
              return (
                <Card key={responder.staffId}>
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staffMember.avatar} />
                        <AvatarFallback className="text-xs">
                          {staffMember.firstName[0]}{staffMember.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {staffMember.firstName} {staffMember.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {staffMember.position}
                        </p>
                      </div>
                      <Badge className={cn('text-xs', sourceTypeColors[responder.sourceType])}>
                        {feedbackSourceLabels[responder.sourceType]}
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={() => handleRemoveResponder(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {responders.length === 0 && !responderSearch && (
            <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
              <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search and add responders above</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {responders.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total feedback requests:</span>
                <span className="font-medium">
                  {responders.length + (includeSelfAssessment ? 1 : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Competencies:</span>
                <span className="font-medium">{selectedCompetencies.length}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}

export default Request360FeedbackDrawer;
