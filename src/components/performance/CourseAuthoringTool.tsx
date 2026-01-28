import React, { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Upload,
  Save,
  Eye,
  Send,
  Settings,
  Image,
  Package,
  MousePointer,
  X,
  Copy,
  Undo,
  Redo,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { lmsCategories, lmsIndustries, difficultyLabels } from '@/types/lms';
import { 
  CourseAuthoringState, 
  ModuleAuthoringState, 
  ContentAuthoringState,
  QuestionAuthoringState,
  AssessmentAuthoringState,
} from '@/types/lmsAdvanced';
import { toast } from 'sonner';

interface CourseAuthoringToolProps {
  open: boolean;
  onClose: () => void;
  onSave: (course: CourseAuthoringState) => void;
  onPublish: (course: CourseAuthoringState) => void;
  initialCourse?: CourseAuthoringState;
}

const contentTypeConfig = [
  { type: 'video', label: 'Video', icon: Video, color: 'text-red-500' },
  { type: 'document', label: 'Document', icon: FileText, color: 'text-blue-500' },
  { type: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-purple-500' },
  { type: 'interactive', label: 'Interactive', icon: MousePointer, color: 'text-green-500' },
  { type: 'scorm', label: 'SCORM Package', icon: Package, color: 'text-orange-500' },
  { type: 'external_link', label: 'External Link', icon: LinkIcon, color: 'text-cyan-500' },
];

const questionTypes = [
  { type: 'multiple_choice', label: 'Multiple Choice' },
  { type: 'true_false', label: 'True/False' },
  { type: 'multi_select', label: 'Multi-Select' },
  { type: 'short_answer', label: 'Short Answer' },
];

const createEmptyModule = (order: number): ModuleAuthoringState => ({
  id: `module-${Date.now()}-${order}`,
  title: `Module ${order}`,
  description: '',
  order,
  duration: 30,
  content: [],
  isLocked: order > 1,
  isExpanded: true,
});

const createEmptyContent = (order: number): ContentAuthoringState => ({
  id: `content-${Date.now()}-${order}`,
  title: '',
  type: 'video',
  order,
  mandatory: true,
  duration: 10,
});

const createEmptyQuestion = (order: number): QuestionAuthoringState => ({
  id: `question-${Date.now()}-${order}`,
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  points: 10,
});

export function CourseAuthoringTool({
  open,
  onClose,
  onSave,
  onPublish,
  initialCourse,
}: CourseAuthoringToolProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [course, setCourse] = useState<CourseAuthoringState>(
    initialCourse || {
      courseId: `course-${Date.now()}`,
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
      complianceRequired: false,
      certificateOnCompletion: true,
      passingScore: 80,
      tags: [],
      modules: [createEmptyModule(1)],
      status: 'draft',
      isDirty: false,
    }
  );
  const [tagInput, setTagInput] = useState('');
  const [draggedModule, setDraggedModule] = useState<number | null>(null);
  const [draggedContent, setDraggedContent] = useState<{ moduleIdx: number; contentIdx: number } | null>(null);

  const updateCourse = useCallback((updates: Partial<CourseAuthoringState>) => {
    setCourse(prev => ({ ...prev, ...updates, isDirty: true }));
  }, []);

  const addModule = () => {
    setCourse(prev => ({
      ...prev,
      modules: [...prev.modules, createEmptyModule(prev.modules.length + 1)],
      isDirty: true,
    }));
  };

  const removeModule = (moduleIdx: number) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules
        .filter((_, idx) => idx !== moduleIdx)
        .map((m, idx) => ({ ...m, order: idx + 1 })),
      isDirty: true,
    }));
  };

  const updateModule = (moduleIdx: number, updates: Partial<ModuleAuthoringState>) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map((m, idx) => 
        idx === moduleIdx ? { ...m, ...updates } : m
      ),
      isDirty: true,
    }));
  };

  const toggleModuleExpanded = (moduleIdx: number) => {
    updateModule(moduleIdx, { isExpanded: !course.modules[moduleIdx].isExpanded });
  };

  const addContent = (moduleIdx: number) => {
    const module = course.modules[moduleIdx];
    updateModule(moduleIdx, {
      content: [...module.content, createEmptyContent(module.content.length + 1)],
    });
  };

  const removeContent = (moduleIdx: number, contentIdx: number) => {
    const module = course.modules[moduleIdx];
    updateModule(moduleIdx, {
      content: module.content
        .filter((_, idx) => idx !== contentIdx)
        .map((c, idx) => ({ ...c, order: idx + 1 })),
    });
  };

  const updateContent = (moduleIdx: number, contentIdx: number, updates: Partial<ContentAuthoringState>) => {
    const module = course.modules[moduleIdx];
    updateModule(moduleIdx, {
      content: module.content.map((c, idx) =>
        idx === contentIdx ? { ...c, ...updates } : c
      ),
    });
  };

  const addAssessment = (moduleIdx: number) => {
    updateModule(moduleIdx, {
      assessment: {
        id: `assessment-${Date.now()}`,
        title: 'Module Assessment',
        type: 'quiz',
        passingScore: 80,
        maxAttempts: 3,
        shuffleQuestions: true,
        showCorrectAnswers: true,
        questions: [createEmptyQuestion(1)],
      },
    });
  };

  const removeAssessment = (moduleIdx: number) => {
    updateModule(moduleIdx, { assessment: undefined });
  };

  const updateAssessment = (moduleIdx: number, updates: Partial<AssessmentAuthoringState>) => {
    const module = course.modules[moduleIdx];
    if (!module.assessment) return;
    updateModule(moduleIdx, {
      assessment: { ...module.assessment, ...updates },
    });
  };

  const addQuestion = (moduleIdx: number) => {
    const module = course.modules[moduleIdx];
    if (!module.assessment) return;
    updateAssessment(moduleIdx, {
      questions: [...module.assessment.questions, createEmptyQuestion(module.assessment.questions.length + 1)],
    });
  };

  const removeQuestion = (moduleIdx: number, questionIdx: number) => {
    const module = course.modules[moduleIdx];
    if (!module.assessment) return;
    updateAssessment(moduleIdx, {
      questions: module.assessment.questions.filter((_, idx) => idx !== questionIdx),
    });
  };

  const updateQuestion = (moduleIdx: number, questionIdx: number, updates: Partial<QuestionAuthoringState>) => {
    const module = course.modules[moduleIdx];
    if (!module.assessment) return;
    updateAssessment(moduleIdx, {
      questions: module.assessment.questions.map((q, idx) =>
        idx === questionIdx ? { ...q, ...updates } : q
      ),
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !course.tags.includes(tagInput.trim())) {
      updateCourse({ tags: [...course.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateCourse({ tags: course.tags.filter(t => t !== tag) });
  };

  const handleSave = () => {
    onSave({ ...course, lastSavedAt: new Date().toISOString(), isDirty: false });
    setCourse(prev => ({ ...prev, isDirty: false, lastSavedAt: new Date().toISOString() }));
    toast.success('Course saved as draft');
  };

  const handlePublish = () => {
    if (!course.title || !course.category || course.modules.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    onPublish({ ...course, status: 'published' });
    toast.success('Course published successfully!');
  };

  const calculateTotalDuration = () => {
    return course.modules.reduce((sum, m) => 
      sum + m.content.reduce((cSum, c) => cSum + (c.duration || 0), 0), 0
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl p-0 flex flex-col" side="right">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                Course Builder
                {course.isDirty && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Unsaved changes
                  </Badge>
                )}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {course.modules.length} modules • {calculateTotalDuration()} min total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button size="sm" onClick={handlePublish}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="details" className="gap-2">
                <Settings className="h-4 w-4" /> Details
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" /> Content
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" /> Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* Course Details Tab */}
            <TabsContent value="details" className="p-6 space-y-6 m-0">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      value={course.title}
                      onChange={(e) => updateCourse({ title: e.target.value })}
                      placeholder="e.g., Workplace Safety Fundamentals"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={course.category} onValueChange={(v) => updateCourse({ category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {lmsCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={course.difficulty} onValueChange={(v) => updateCourse({ difficulty: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(difficultyLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={course.industry || ''} onValueChange={(v) => updateCourse({ industry: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {lmsIndustries.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={course.description}
                      onChange={(e) => updateCourse({ description: e.target.value })}
                      placeholder="Describe what learners will gain from this course..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag..."
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {course.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Compliance Required</Label>
                    <p className="text-xs text-muted-foreground">Mark as mandatory training</p>
                  </div>
                  <Switch
                    checked={course.complianceRequired}
                    onCheckedChange={(v) => updateCourse({ complianceRequired: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Certificate on Completion</Label>
                    <p className="text-xs text-muted-foreground">Issue certificate when done</p>
                  </div>
                  <Switch
                    checked={course.certificateOnCompletion}
                    onCheckedChange={(v) => updateCourse({ certificateOnCompletion: v })}
                  />
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={0}
                    max={100}
                    value={course.passingScore}
                    onChange={(e) => updateCourse({ passingScore: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {course.complianceRequired && (
                <div className="p-4 border rounded-lg space-y-2 max-w-xs">
                  <Label htmlFor="validityPeriod">Validity Period (days)</Label>
                  <Input
                    id="validityPeriod"
                    type="number"
                    min={0}
                    value={course.validityPeriod || ''}
                    onChange={(e) => updateCourse({ validityPeriod: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 365"
                  />
                  <p className="text-xs text-muted-foreground">How long before recertification is needed</p>
                </div>
              )}
            </TabsContent>

            {/* Content Builder Tab */}
            <TabsContent value="content" className="p-6 space-y-4 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Course Modules</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag to reorder modules and content
                  </p>
                </div>
                <Button onClick={addModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>

              <div className="space-y-4">
                {course.modules.map((module, moduleIdx) => (
                  <Card key={module.id} className="overflow-hidden">
                    <Collapsible open={module.isExpanded} onOpenChange={() => toggleModuleExpanded(moduleIdx)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <div className="flex items-center gap-2">
                              {module.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <CardTitle className="text-base">
                                Module {moduleIdx + 1}: {module.title || 'Untitled'}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <Badge variant="outline" className="text-xs">
                                {module.content.length} items
                              </Badge>
                              {module.assessment && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Assessment
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeModule(moduleIdx);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Module Title</Label>
                              <Input
                                value={module.title}
                                onChange={(e) => updateModule(moduleIdx, { title: e.target.value })}
                                placeholder="Enter module title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={module.duration}
                                onChange={(e) => updateModule(moduleIdx, { duration: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(moduleIdx, { description: e.target.value })}
                              placeholder="Describe what this module covers"
                              rows={2}
                            />
                          </div>

                          <Separator />

                          {/* Content Items */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Content Items</Label>
                              <Button variant="outline" size="sm" onClick={() => addContent(moduleIdx)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Content
                              </Button>
                            </div>

                            {module.content.length === 0 ? (
                              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No content yet</p>
                                <Button variant="link" onClick={() => addContent(moduleIdx)}>
                                  Add your first content item
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {module.content.map((content, contentIdx) => {
                                  const typeConfig = contentTypeConfig.find(t => t.type === content.type);
                                  const Icon = typeConfig?.icon || FileText;
                                  
                                  return (
                                    <div
                                      key={content.id}
                                      className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                      <div className={cn("p-2 rounded", typeConfig?.color)}>
                                        <Icon className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 grid gap-2 md:grid-cols-4">
                                        <Input
                                          value={content.title}
                                          onChange={(e) => updateContent(moduleIdx, contentIdx, { title: e.target.value })}
                                          placeholder="Content title"
                                          className="md:col-span-2"
                                        />
                                        <Select
                                          value={content.type}
                                          onValueChange={(v) => updateContent(moduleIdx, contentIdx, { type: v })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {contentTypeConfig.map((type) => (
                                              <SelectItem key={type.type} value={type.type}>
                                                {type.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="number"
                                          value={content.duration || ''}
                                          onChange={(e) => updateContent(moduleIdx, contentIdx, { duration: parseInt(e.target.value) || 0 })}
                                          placeholder="Duration"
                                        />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeContent(moduleIdx, contentIdx)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Assessment Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Module Assessment</Label>
                              {!module.assessment ? (
                                <Button variant="outline" size="sm" onClick={() => addAssessment(moduleIdx)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Assessment
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => removeAssessment(moduleIdx)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Assessment
                                </Button>
                              )}
                            </div>

                            {module.assessment && (
                              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div className="space-y-2">
                                    <Label>Assessment Title</Label>
                                    <Input
                                      value={module.assessment.title}
                                      onChange={(e) => updateAssessment(moduleIdx, { title: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Passing Score (%)</Label>
                                    <Input
                                      type="number"
                                      value={module.assessment.passingScore}
                                      onChange={(e) => updateAssessment(moduleIdx, { passingScore: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Max Attempts</Label>
                                    <Input
                                      type="number"
                                      value={module.assessment.maxAttempts}
                                      onChange={(e) => updateAssessment(moduleIdx, { maxAttempts: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={module.assessment.shuffleQuestions}
                                      onCheckedChange={(v) => updateAssessment(moduleIdx, { shuffleQuestions: v })}
                                    />
                                    <Label>Shuffle Questions</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={module.assessment.showCorrectAnswers}
                                      onCheckedChange={(v) => updateAssessment(moduleIdx, { showCorrectAnswers: v })}
                                    />
                                    <Label>Show Correct Answers</Label>
                                  </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label>Questions ({module.assessment.questions.length})</Label>
                                    <Button variant="outline" size="sm" onClick={() => addQuestion(moduleIdx)}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Question
                                    </Button>
                                  </div>

                                  {module.assessment.questions.map((question, qIdx) => (
                                    <Card key={question.id} className="p-4">
                                      <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                          <span className="text-sm font-medium text-muted-foreground">
                                            Q{qIdx + 1}
                                          </span>
                                          <div className="flex-1 space-y-3">
                                            <div className="grid gap-3 md:grid-cols-4">
                                              <Select
                                                value={question.type}
                                                onValueChange={(v: any) => updateQuestion(moduleIdx, qIdx, { type: v })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {questionTypes.map((type) => (
                                                    <SelectItem key={type.type} value={type.type}>
                                                      {type.label}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Input
                                                className="md:col-span-3"
                                                value={question.question}
                                                onChange={(e) => updateQuestion(moduleIdx, qIdx, { question: e.target.value })}
                                                placeholder="Enter your question..."
                                              />
                                            </div>

                                            {(question.type === 'multiple_choice' || question.type === 'multi_select') && (
                                              <div className="grid gap-2 md:grid-cols-2">
                                                {question.options.map((opt, optIdx) => (
                                                  <div key={optIdx} className="flex items-center gap-2">
                                                    <Input
                                                      value={opt}
                                                      onChange={(e) => {
                                                        const newOptions = [...question.options];
                                                        newOptions[optIdx] = e.target.value;
                                                        updateQuestion(moduleIdx, qIdx, { options: newOptions });
                                                      }}
                                                      placeholder={`Option ${optIdx + 1}`}
                                                    />
                                                    <input
                                                      type={question.type === 'multi_select' ? 'checkbox' : 'radio'}
                                                      name={`correct-${question.id}`}
                                                      checked={
                                                        question.type === 'multi_select'
                                                          ? (question.correctAnswer as string[])?.includes(opt)
                                                          : question.correctAnswer === opt
                                                      }
                                                      onChange={() => {
                                                        if (question.type === 'multi_select') {
                                                          const current = (question.correctAnswer as string[]) || [];
                                                          const newAnswer = current.includes(opt)
                                                            ? current.filter(a => a !== opt)
                                                            : [...current, opt];
                                                          updateQuestion(moduleIdx, qIdx, { correctAnswer: newAnswer });
                                                        } else {
                                                          updateQuestion(moduleIdx, qIdx, { correctAnswer: opt });
                                                        }
                                                      }}
                                                      className="h-4 w-4"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {question.type === 'true_false' && (
                                              <div className="flex gap-4">
                                                {['true', 'false'].map((val) => (
                                                  <label key={val} className="flex items-center gap-2">
                                                    <input
                                                      type="radio"
                                                      name={`tf-${question.id}`}
                                                      checked={question.correctAnswer === val}
                                                      onChange={() => updateQuestion(moduleIdx, qIdx, { correctAnswer: val })}
                                                      className="h-4 w-4"
                                                    />
                                                    {val === 'true' ? 'True' : 'False'}
                                                  </label>
                                                ))}
                                              </div>
                                            )}

                                            {question.type === 'short_answer' && (
                                              <Input
                                                value={question.correctAnswer as string}
                                                onChange={(e) => updateQuestion(moduleIdx, qIdx, { correctAnswer: e.target.value })}
                                                placeholder="Expected answer..."
                                              />
                                            )}
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeQuestion(moduleIdx, qIdx)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="p-6 m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{course.title || 'Untitled Course'}</CardTitle>
                      <p className="text-muted-foreground mt-1">{course.description || 'No description'}</p>
                    </div>
                    <div className="flex gap-2">
                      {course.complianceRequired && (
                        <Badge variant="destructive">Compliance Required</Badge>
                      )}
                      {course.certificateOnCompletion && (
                        <Badge variant="secondary">Certificate</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {course.category && <Badge variant="outline">{course.category}</Badge>}
                    {course.difficulty && <Badge>{difficultyLabels[course.difficulty as keyof typeof difficultyLabels]}</Badge>}
                    {course.industry && <Badge variant="outline">{course.industry}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{course.modules.length} modules</span>
                      <span>•</span>
                      <span>{calculateTotalDuration()} minutes</span>
                      <span>•</span>
                      <span>Passing: {course.passingScore}%</span>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Course Structure</h4>
                      {course.modules.map((module, idx) => (
                        <div key={module.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {idx + 1}. {module.title || 'Untitled Module'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {module.content.length} items • {module.duration} min
                            </span>
                          </div>
                          {module.content.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1">
                              {module.content.map((content) => {
                                const typeConfig = contentTypeConfig.find(t => t.type === content.type);
                                const Icon = typeConfig?.icon || FileText;
                                return (
                                  <div key={content.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Icon className="h-3 w-3" />
                                    <span>{content.title || 'Untitled'}</span>
                                  </div>
                                );
                              })}
                              {module.assessment && (
                                <div className="flex items-center gap-2 text-sm text-purple-600">
                                  <HelpCircle className="h-3 w-3" />
                                  <span>{module.assessment.title} ({module.assessment.questions.length} questions)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {course.tags.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                          {course.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
