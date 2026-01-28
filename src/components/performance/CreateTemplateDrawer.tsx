import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Target,
  ClipboardCheck,
  MessageSquare,
  Trash2,
  GripVertical,
  Save,
  Building2,
  Clock,
  Tag,
  Library,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { 
  PerformancePlanTemplate, 
  PlanType,
  PlanGoalTemplate,
  PlanReviewTemplate,
  PlanConversationTemplate,
  planTypeLabels,
  planIndustries,
} from '@/types/performancePlan';
import { goalCategories } from '@/types/performance';
import { toast } from 'sonner';
import { ReusableGoalTemplate, ReusableReviewTemplate } from '@/types/reusableTemplates';
import { GoalReviewTemplatesLibrary, convertGoalTemplateToPlanGoal, convertReviewTemplateToPlanReview } from './GoalReviewTemplatesLibrary';
import { mockCourses, mockLearningPaths } from '@/data/mockLmsData';

interface CreateTemplateDrawerProps {
  open: boolean;
  existingTemplate?: PerformancePlanTemplate | null;
  onClose: () => void;
  onSave: (template: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function CreateTemplateDrawer({
  open,
  existingTemplate,
  onClose,
  onSave,
}: CreateTemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [showGoalLibrary, setShowGoalLibrary] = useState(false);
  const [showReviewLibrary, setShowReviewLibrary] = useState(false);

  // Template details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PlanType>('custom');
  const [industry, setIndustry] = useState('');
  const [durationDays, setDurationDays] = useState(90);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Template items
  const [goals, setGoals] = useState<PlanGoalTemplate[]>([]);
  const [reviews, setReviews] = useState<PlanReviewTemplate[]>([]);
  const [conversations, setConversations] = useState<PlanConversationTemplate[]>([]);

  // Learning content
  const [learningPathIds, setLearningPathIds] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);

  // Reset form when template changes
  React.useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDescription(existingTemplate.description);
      setType(existingTemplate.type);
      setIndustry(existingTemplate.industry || '');
      setDurationDays(existingTemplate.durationDays);
      setTags(existingTemplate.tags);
      setGoals(existingTemplate.goals);
      setReviews(existingTemplate.reviews);
      setConversations(existingTemplate.conversations);
      setLearningPathIds(existingTemplate.learningPathIds || []);
      setCourseIds(existingTemplate.courseIds || []);
    } else {
      resetForm();
    }
  }, [existingTemplate, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('custom');
    setIndustry('');
    setDurationDays(90);
    setTags([]);
    setGoals([]);
    setReviews([]);
    setConversations([]);
    setLearningPathIds([]);
    setCourseIds([]);
    setActiveTab('details');
  };

  const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const filteredLearningPaths = useMemo(() => {
    if (!industry) return mockLearningPaths;
    return mockLearningPaths.filter(p => (p.industry || 'General') === industry || (p.industry || 'General') === 'General');
  }, [industry]);

  const filteredCourses = useMemo(() => {
    if (!industry) return mockCourses;
    return mockCourses.filter(c => (c.industry || 'General') === industry || (c.industry || 'General') === 'General');
  }, [industry]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Goal management
  const addGoal = () => {
    const newGoal: PlanGoalTemplate = {
      id: `g-${Date.now()}`,
      title: '',
      description: '',
      category: 'Performance',
      priority: 'medium',
      targetDaysFromStart: 30,
      milestones: [],
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (index: number, updates: Partial<PlanGoalTemplate>) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], ...updates };
    setGoals(updated);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const addMilestone = (goalIndex: number) => {
    const updated = [...goals];
    updated[goalIndex].milestones.push({
      title: '',
      daysFromStart: updated[goalIndex].targetDaysFromStart - 7,
    });
    setGoals(updated);
  };

  const updateMilestone = (goalIndex: number, msIndex: number, updates: { title?: string; daysFromStart?: number }) => {
    const updated = [...goals];
    updated[goalIndex].milestones[msIndex] = { ...updated[goalIndex].milestones[msIndex], ...updates };
    setGoals(updated);
  };

  const removeMilestone = (goalIndex: number, msIndex: number) => {
    const updated = [...goals];
    updated[goalIndex].milestones = updated[goalIndex].milestones.filter((_, i) => i !== msIndex);
    setGoals(updated);
  };

  // Review management
  const addReview = () => {
    const newReview: PlanReviewTemplate = {
      id: `r-${Date.now()}`,
      title: '',
      reviewCycle: 'quarterly',
      daysFromStart: 90,
    };
    setReviews([...reviews, newReview]);
  };

  const updateReview = (index: number, updates: Partial<PlanReviewTemplate>) => {
    const updated = [...reviews];
    updated[index] = { ...updated[index], ...updates };
    setReviews(updated);
  };

  const removeReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  // Import from library
  const handleImportGoalFromLibrary = (template: ReusableGoalTemplate) => {
    const planGoal = convertGoalTemplateToPlanGoal(template);
    setGoals([...goals, planGoal]);
    toast.success(`Added "${template.name}" goal`);
  };

  const handleImportReviewFromLibrary = (template: ReusableReviewTemplate) => {
    const planReview = convertReviewTemplateToPlanReview(template);
    setReviews([...reviews, planReview]);
    toast.success(`Added "${template.name}" review`);
  };

  // Conversation management
  const addConversation = () => {
    const newConv: PlanConversationTemplate = {
      id: `c-${Date.now()}`,
      title: '',
      type: 'one_on_one',
      daysFromStart: 7,
      duration: 30,
    };
    setConversations([...conversations, newConv]);
  };

  const updateConversation = (index: number, updates: Partial<PlanConversationTemplate>) => {
    const updated = [...conversations];
    updated[index] = { ...updated[index], ...updates };
    setConversations(updated);
  };

  const removeConversation = (index: number) => {
    setConversations(conversations.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (goals.length === 0 && reviews.length === 0 && conversations.length === 0) {
      toast.error('Please add at least one goal, review, or conversation');
      return;
    }

    // Validate goals have titles
    const invalidGoals = goals.filter(g => !g.title.trim());
    if (invalidGoals.length > 0) {
      toast.error('All goals must have titles');
      setActiveTab('goals');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        type,
        industry: industry || undefined,
        durationDays,
        goals,
        reviews,
        conversations,
        learningPathIds,
        courseIds,
        tags,
        isSystem: false,
      });
      toast.success(existingTemplate ? 'Template updated!' : 'Template created!');
      onClose();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>
            {existingTemplate ? 'Edit Template' : 'Create Custom Template'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 mt-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="learning">
              Learning
            </TabsTrigger>
            <TabsTrigger value="goals">
              Goals ({goals.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="conversations">
              1:1s ({conversations.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="e.g., 90-Day Onboarding Plan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the purpose and scope of this plan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as PlanType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(planTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Industry (Optional)</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <Building2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {planIndustries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration (Days) *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={730}
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 90)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    ≈ {Math.round(durationDays / 30)} months
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        <span className="ml-1">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="mt-4 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Learning Content
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Link learning paths and courses to this template (these can be pre-attached when assigning a plan).
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {learningPathIds.length} paths • {courseIds.length} courses
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Learning Paths</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{learningPathIds.length} selected</span>
                    </div>

                    <div className="space-y-2">
                      {filteredLearningPaths.map((path) => (
                        <button
                          key={path.id}
                          type="button"
                          onClick={() => setLearningPathIds(prev => toggleId(prev, path.id))}
                          className="w-full text-left flex items-start gap-3 rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                        >
                          <Checkbox
                            checked={learningPathIds.includes(path.id)}
                            onCheckedChange={() => setLearningPathIds(prev => toggleId(prev, path.id))}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{path.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {path.description}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {path.courseIds.length} courses • {path.industry}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredLearningPaths.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No learning paths available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Courses</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{courseIds.length} selected</span>
                    </div>

                    <div className="space-y-2">
                      {filteredCourses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => setCourseIds(prev => toggleId(prev, course.id))}
                          className="w-full text-left flex items-start gap-3 rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                        >
                          <Checkbox
                            checked={courseIds.includes(course.id)}
                            onCheckedChange={() => setCourseIds(prev => toggleId(prev, course.id))}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{course.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {course.description}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {course.duration} min • {course.industry}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredCourses.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No courses available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button onClick={addGoal} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blank Goal
                </Button>
                <Button onClick={() => setShowGoalLibrary(true)} variant="secondary" className="flex-1">
                  <Library className="h-4 w-4 mr-2" />
                  Import from Library
                </Button>
              </div>

              {goals.map((goal, gIndex) => (
                <Card key={goal.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Goal title..."
                          value={goal.title}
                          onChange={(e) => updateGoal(gIndex, { title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description..."
                          value={goal.description}
                          onChange={(e) => updateGoal(gIndex, { description: e.target.value })}
                          rows={2}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={goal.category} onValueChange={(v) => updateGoal(gIndex, { category: v })}>
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {goalCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={goal.priority} onValueChange={(v) => updateGoal(gIndex, { priority: v as 'low' | 'medium' | 'high' | 'critical' })}>
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Day</span>
                            <Input
                              type="number"
                              min={1}
                              value={goal.targetDaysFromStart}
                              onChange={(e) => updateGoal(gIndex, { targetDaysFromStart: parseInt(e.target.value) || 30 })}
                              className="w-16 text-xs"
                            />
                          </div>
                        </div>

                        {/* Milestones */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Milestones</span>
                            <Button size="sm" variant="ghost" onClick={() => addMilestone(gIndex)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {goal.milestones.map((ms, msIndex) => (
                            <div key={msIndex} className="flex items-center gap-2">
                              <Input
                                placeholder="Milestone title..."
                                value={ms.title}
                                onChange={(e) => updateMilestone(gIndex, msIndex, { title: e.target.value })}
                                className="flex-1 text-xs"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Day</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={ms.daysFromStart}
                                  onChange={(e) => updateMilestone(gIndex, msIndex, { daysFromStart: parseInt(e.target.value) || 7 })}
                                  className="w-14 text-xs"
                                />
                              </div>
                              <Button size="icon" variant="ghost" onClick={() => removeMilestone(gIndex, msIndex)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeGoal(gIndex)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {goals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No goals added yet</p>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button onClick={addReview} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blank Review
                </Button>
                <Button onClick={() => setShowReviewLibrary(true)} variant="secondary" className="flex-1">
                  <Library className="h-4 w-4 mr-2" />
                  Import from Library
                </Button>
              </div>

              {reviews.map((review, rIndex) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Review title..."
                          value={review.title}
                          onChange={(e) => updateReview(rIndex, { title: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={review.reviewCycle} 
                            onValueChange={(v) => updateReview(rIndex, { reviewCycle: v as 'monthly' | 'quarterly' | 'semi_annual' | 'annual' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">Day</span>
                            <Input
                              type="number"
                              min={1}
                              value={review.daysFromStart}
                              onChange={(e) => updateReview(rIndex, { daysFromStart: parseInt(e.target.value) || 30 })}
                              className="w-20"
                            />
                          </div>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeReview(rIndex)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {reviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reviews added yet</p>
                </div>
              )}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-4 space-y-4">
              <Button onClick={addConversation} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add 1:1 Conversation
              </Button>

              {conversations.map((conv, cIndex) => (
                <Card key={conv.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Meeting title..."
                          value={conv.title}
                          onChange={(e) => updateConversation(cIndex, { title: e.target.value })}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Select 
                            value={conv.type} 
                            onValueChange={(v) => updateConversation(cIndex, { type: v as 'one_on_one' | 'check_in' | 'coaching' | 'feedback' | 'career' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one_on_one">1:1 Meeting</SelectItem>
                              <SelectItem value="check_in">Check-in</SelectItem>
                              <SelectItem value="coaching">Coaching</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="career">Career</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Day</span>
                            <Input
                              type="number"
                              min={0}
                              value={conv.daysFromStart}
                              onChange={(e) => updateConversation(cIndex, { daysFromStart: parseInt(e.target.value) || 0 })}
                              className="w-16"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min={15}
                              step={15}
                              value={conv.duration}
                              onChange={(e) => updateConversation(cIndex, { duration: parseInt(e.target.value) || 30 })}
                              className="w-16"
                            />
                            <span className="text-xs text-muted-foreground">min</span>
                          </div>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeConversation(cIndex)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations added yet</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-auto">
          <div className="text-sm text-muted-foreground">
            {goals.length} goals • {reviews.length} reviews • {conversations.length} 1:1s
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : existingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Goal Library Sheet */}
      <GoalReviewTemplatesLibrary
        open={showGoalLibrary}
        onClose={() => setShowGoalLibrary(false)}
        onSelectGoal={handleImportGoalFromLibrary}
        mode="select-goal"
      />

      {/* Review Library Sheet */}
      <GoalReviewTemplatesLibrary
        open={showReviewLibrary}
        onClose={() => setShowReviewLibrary(false)}
        onSelectReview={handleImportReviewFromLibrary}
        mode="select-review"
      />
    </Sheet>
  );
}
