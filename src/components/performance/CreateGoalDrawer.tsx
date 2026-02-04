import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithCreate } from '@/components/ui/select-with-create';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Goal, GoalPriority, goalPriorityLabels, goalCategories } from '@/types/performance';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Target, FileText, GraduationCap, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { mockFormTemplates } from '@/data/mockFormData';
import { mockCourses, mockLearningPaths } from '@/data/mockLmsData';
import { toast } from 'sonner';

const goalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetDate: z.date({ required_error: 'Target date is required' }),
});

interface LinkedItem {
  id: string;
  type: 'form' | 'learning_path' | 'course';
  name: string;
}

interface CreateGoalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { linkedItems?: LinkedItem[] }) => Promise<void>;
  staffId: string;
  createdBy: string;
}

export function CreateGoalDrawer({ open, onOpenChange, onSubmit, staffId, createdBy }: CreateGoalDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [targetDate, setTargetDate] = useState<Date>();
  const [milestones, setMilestones] = useState<{ title: string; targetDate: Date | undefined }[]>([]);
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [linkType, setLinkType] = useState<'form' | 'learning_path' | 'course'>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Combine default and custom categories
  const allCategories = useMemo(() => [...goalCategories, ...customCategories], [customCategories]);
  const categoryOptions = useMemo(() => 
    allCategories.map(cat => ({ value: cat, label: cat })), [allCategories]);

  // Filter published forms/courses/paths
  const availableForms = useMemo(() => 
    mockFormTemplates.filter(f => f.status === 'published'), []);
  const availableCourses = useMemo(() => 
    mockCourses.filter(c => c.status === 'published'), []);
  const availablePaths = useMemo(() => mockLearningPaths, []);

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', targetDate: undefined }]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleAddLinkedItem = (id: string, name: string) => {
    if (!linkedItems.find(item => item.id === id && item.type === linkType)) {
      setLinkedItems([...linkedItems, { id, type: linkType, name }]);
    }
    setShowLinkSelector(false);
  };

  const handleRemoveLinkedItem = (index: number) => {
    setLinkedItems(linkedItems.filter((_, i) => i !== index));
  };

  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'form': return <FileText className="h-3 w-3" />;
      case 'learning_path': return <GraduationCap className="h-3 w-3" />;
      case 'course': return <BookOpen className="h-3 w-3" />;
      default: return null;
    }
  };

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case 'form': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'learning_path': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'course': return 'bg-green-100 text-green-700 border-green-200';
      default: return '';
    }
  };

  const handleSubmit = async () => {
    const validation = goalSchema.safeParse({ title, description, category, priority, targetDate });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        staffId,
        title,
        description,
        category,
        priority,
        status: 'not_started',
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: format(targetDate!, 'yyyy-MM-dd'),
        milestones: milestones
          .filter(m => m.title && m.targetDate)
          .map((m, i) => ({
            id: `ms-new-${i}`,
            title: m.title,
            targetDate: format(m.targetDate!, 'yyyy-MM-dd'),
            completed: false,
          })),
        createdBy,
        linkedItems: linkedItems.length > 0 ? linkedItems : undefined,
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPriority('medium');
    setTargetDate(undefined);
    setMilestones([]);
    setLinkedItems([]);
    setShowLinkSelector(false);
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <PrimaryOffCanvas
      title="Create New Goal"
      icon={Target}
      size="lg"
      open={open}
      onClose={handleClose}
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'secondary' },
        { label: loading ? 'Creating...' : 'Create Goal', onClick: handleSubmit, variant: 'primary', disabled: loading, loading },
      ]}
    >
      {/* Goal Information Section */}
      <FormSection title="Goal Information" tooltip="Define the core details of this goal">
        <FormField label="Goal Title" required error={errors.title}>
          <Input
            placeholder="e.g., Complete Leadership Certification"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
        </FormField>

        <FormField label="Description" required error={errors.description}>
          <Textarea
            placeholder="Describe what you want to achieve..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className={errors.description ? 'border-destructive' : ''}
          />
        </FormField>

        <FormRow>
          <FormField label="Category" required error={errors.category}>
            <SelectWithCreate
              value={category}
              onValueChange={setCategory}
              options={categoryOptions}
              onCreateNew={(newCategory) => {
                setCustomCategories(prev => [...prev, newCategory]);
                toast.success(`Category "${newCategory}" created`);
              }}
              placeholder="Select category"
              createLabel="Create new category"
              error={!!errors.category}
            />
          </FormField>

          <FormField label="Priority" required>
            <Select value={priority} onValueChange={v => setPriority(v as GoalPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(goalPriorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>

        <FormField label="Target Date" required error={errors.targetDate}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-full justify-start text-left font-normal', !targetDate && 'text-muted-foreground', errors.targetDate && 'border-destructive')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {targetDate ? format(targetDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus disabled={(date) => date < new Date()} />
            </PopoverContent>
          </Popover>
        </FormField>
      </FormSection>

      {/* Milestones Section */}
      <FormSection title="Milestones" tooltip="Break down the goal into trackable milestones">
        <div className="space-y-3">
          {milestones.map((ms, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start">
              <Input
                placeholder="Milestone title"
                value={ms.title}
                onChange={e => {
                  const updated = [...milestones];
                  updated[i].title = e.target.value;
                  setMilestones(updated);
                }}
                className="flex-1 w-full"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none sm:w-auto justify-start sm:justify-center">
                      <CalendarIcon className="h-4 w-4 sm:mr-0" />
                      <span className="ml-2 sm:hidden">
                        {ms.targetDate ? format(ms.targetDate, 'MMM d') : 'Pick date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={ms.targetDate}
                      onSelect={date => {
                        const updated = [...milestones];
                        updated[i].targetDate = date;
                        setMilestones(updated);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMilestone(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone} className="text-primary">
            <Plus className="h-4 w-4 mr-1" /> Add Milestone
          </Button>
        </div>
      </FormSection>

      {/* Linked Resources Section */}
      <FormSection title="Linked Resources" tooltip="Attach forms, courses, or learning paths to this goal">
        <div className="space-y-3">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLinkSelector(!showLinkSelector)}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-1" /> Link Resource
          </Button>

          {showLinkSelector && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex gap-2">
                  {(['form', 'learning_path', 'course'] as const).map(type => (
                    <Badge
                      key={type}
                      variant={linkType === type ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setLinkType(type)}
                    >
                      {getLinkTypeIcon(type)}
                      <span className="ml-1">
                        {type === 'form' ? 'Forms' : type === 'learning_path' ? 'Learning Paths' : 'Courses'}
                      </span>
                    </Badge>
                  ))}
                </div>

                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {linkType === 'form' && availableForms.map(form => (
                      <div
                        key={form.id}
                        onClick={() => handleAddLinkedItem(form.id, form.name)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="flex-1 truncate">{form.name}</span>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                    {linkType === 'learning_path' && availablePaths.map(path => (
                      <div
                        key={path.id}
                        onClick={() => handleAddLinkedItem(path.id, path.name)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        <span className="flex-1 truncate">{path.name}</span>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                    {linkType === 'course' && availableCourses.map(course => (
                      <div
                        key={course.id}
                        onClick={() => handleAddLinkedItem(course.id, course.title)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <span className="flex-1 truncate">{course.title}</span>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Display Linked Items */}
          {linkedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkedItems.map((item, i) => (
                <Badge 
                  key={`${item.type}-${item.id}`} 
                  variant="outline"
                  className={cn('flex items-center gap-1 pr-1', getLinkTypeColor(item.type))}
                >
                  {getLinkTypeIcon(item.type)}
                  <span className="max-w-[150px] truncate">{item.name}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveLinkedItem(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
}

export default CreateGoalDrawer;
