import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Route, 
  Plus, 
  GripVertical, 
  X, 
  BookOpen, 
  Clock, 
  Users,
  Save,
  Eye,
  CheckCircle2,
  ArrowRight,
  Target,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LearningPath, Course, lmsIndustries, lmsCategories } from '@/types/lms';
import { mockCourses } from '@/data/mockLmsData';
import { toast } from 'sonner';

interface LearningPathBuilderProps {
  open: boolean;
  onClose: () => void;
  existingPath?: LearningPath;
  onSave: (path: LearningPath) => void;
}

interface PathCourse {
  courseId: string;
  course: Course;
  order: number;
}

export function LearningPathBuilder({ open, onClose, existingPath, onSave }: LearningPathBuilderProps) {
  const [name, setName] = useState(existingPath?.name || '');
  const [description, setDescription] = useState(existingPath?.description || '');
  const [industry, setIndustry] = useState(existingPath?.industry || '');
  const [requiredOrder, setRequiredOrder] = useState(existingPath?.requiredCompletionOrder ?? true);
  const [tags, setTags] = useState<string[]>(existingPath?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<PathCourse[]>(() => {
    if (existingPath) {
      return existingPath.courseIds.map((id, idx) => {
        const course = mockCourses.find(c => c.id === id);
        return course ? { courseId: id, course, order: idx + 1 } : null;
      }).filter(Boolean) as PathCourse[];
    }
    return [];
  });
  const [showPreview, setShowPreview] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const availableCourses = mockCourses.filter(
    course => !selectedCourses.some(sc => sc.courseId === course.id)
  );

  const totalDuration = selectedCourses.reduce((sum, sc) => sum + sc.course.duration, 0);

  const handleAddCourse = (course: Course) => {
    setSelectedCourses(prev => [
      ...prev,
      { courseId: course.id, course, order: prev.length + 1 }
    ]);
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.filter(sc => sc.courseId !== courseId)
        .map((sc, idx) => ({ ...sc, order: idx + 1 }))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newCourses = [...selectedCourses];
    const [draggedItem] = newCourses.splice(draggedIndex, 1);
    newCourses.splice(index, 0, draggedItem);
    
    setSelectedCourses(newCourses.map((sc, idx) => ({ ...sc, order: idx + 1 })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a path name');
      return;
    }
    if (selectedCourses.length === 0) {
      toast.error('Please add at least one course');
      return;
    }

    const path: LearningPath = {
      id: existingPath?.id || `path-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      courseIds: selectedCourses.map(sc => sc.courseId),
      requiredCompletionOrder: requiredOrder,
      estimatedDuration: totalDuration,
      industry: industry || undefined,
      tags,
      createdAt: existingPath?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(path);
    toast.success(existingPath ? 'Learning path updated' : 'Learning path created');
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {existingPath ? 'Edit Learning Path' : 'Create Learning Path'}
          </SheetTitle>
          <SheetDescription>
            Build structured journeys for onboarding, skill development, or compliance training
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {!showPreview ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Path Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g., New Employee Onboarding"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the purpose and outcomes of this learning path..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {lmsIndustries.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          placeholder="Add tag"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleRemoveTag(tag)} 
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <Label>Sequential Completion Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Learners must complete courses in order
                      </p>
                    </div>
                    <Switch checked={requiredOrder} onCheckedChange={setRequiredOrder} />
                  </div>
                </div>

                <Separator />

                {/* Course Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Path Courses</h4>
                      <p className="text-sm text-muted-foreground">
                        Drag to reorder • {selectedCourses.length} courses • {formatDuration(totalDuration)} total
                      </p>
                    </div>
                  </div>

                  {/* Selected Courses */}
                  <div className="space-y-2">
                    {selectedCourses.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No courses added yet</p>
                        <p className="text-sm text-muted-foreground">Select from available courses below</p>
                      </div>
                    ) : (
                      selectedCourses.map((sc, index) => (
                        <div
                          key={sc.courseId}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={e => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg bg-background transition-all cursor-move",
                            draggedIndex === index && "opacity-50 border-primary"
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                            {sc.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{sc.course.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration(sc.course.duration)}
                              <span>•</span>
                              <span>{sc.course.category}</span>
                            </div>
                          </div>
                          {index < selectedCourses.length - 1 && requiredOrder && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleRemoveCourse(sc.courseId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Available Courses */}
                  <div className="space-y-2">
                    <Label>Available Courses</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                      {availableCourses.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground text-sm">
                          All courses have been added
                        </p>
                      ) : (
                        availableCourses.map(course => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{course.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDuration(course.duration)} • {course.category}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddCourse(course)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="py-4 space-y-6">
                {/* Preview Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Route className="h-5 w-5 text-primary" />
                          {name || 'Untitled Path'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {description || 'No description provided'}
                        </p>
                      </div>
                      {industry && (
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {industry}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCourses.length} courses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(totalDuration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{requiredOrder ? 'Sequential' : 'Flexible'} order</span>
                      </div>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Course Journey Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium">Learning Journey</h4>
                  <div className="relative">
                    {selectedCourses.map((sc, index) => (
                      <div key={sc.courseId} className="relative flex gap-4">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                            "bg-primary text-primary-foreground"
                          )}>
                            {sc.order}
                          </div>
                          {index < selectedCourses.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-8 bg-border my-2" />
                          )}
                        </div>

                        {/* Course Card */}
                        <Card className="flex-1 mb-4">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">{sc.course.title}</h5>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {sc.course.description}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(sc.course.duration)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {sc.course.category}
                                  </Badge>
                                  {sc.course.complianceRequired && (
                                    <Badge className="text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">Required</Badge>
                                  )}
                                </div>
                              </div>
                              {index === 0 && (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Start Here
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}

                    {/* Completion */}
                    {selectedCourses.length > 0 && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 p-4 border-2 border-dashed border-green-200 dark:border-green-800 rounded-lg">
                          <p className="font-medium text-green-700 dark:text-green-400">Path Complete!</p>
                          <p className="text-sm text-muted-foreground">
                            Learner has completed all {selectedCourses.length} courses
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {existingPath ? 'Update Path' : 'Create Path'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
