import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  ClipboardCheck,
  MessageSquare,
  Clock,
  Building2,
  Tag,
  Plus,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { 
  PerformancePlanTemplate, 
  planTypeLabels, 
  planTypeColors,
} from '@/types/performancePlan';
import { mockCourses, mockLearningPaths } from '@/data/mockLmsData';

interface PlanTemplatePreviewSheetProps {
  open: boolean;
  template: PerformancePlanTemplate | null;
  onClose: () => void;
  onAssign: (template: PerformancePlanTemplate) => void;
}

export function PlanTemplatePreviewSheet({
  open,
  template,
  onClose,
  onAssign,
}: PlanTemplatePreviewSheetProps) {
  const [activeTab, setActiveTab] = useState('goals');

  // Get linked learning content
  const linkedLearningPaths = useMemo(() => {
    if (!template?.learningPathIds?.length) return [];
    return template.learningPathIds
      .map(id => mockLearningPaths.find(p => p.id === id))
      .filter(Boolean);
  }, [template]);

  const linkedCourses = useMemo(() => {
    if (!template) return [];
    const courseIds = new Set<string>();
    
    // Add directly linked courses
    template.courseIds?.forEach(id => courseIds.add(id));
    
    // Add courses from learning paths
    linkedLearningPaths.forEach(path => {
      path?.courseIds.forEach(id => courseIds.add(id));
    });
    
    return Array.from(courseIds)
      .map(id => mockCourses.find(c => c.id === id))
      .filter(Boolean);
  }, [template, linkedLearningPaths]);

  const hasLearningContent = linkedLearningPaths.length > 0 || linkedCourses.length > 0;

  if (!template) return null;

  const handleAssign = () => {
    onAssign(template);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-left pr-4">{template.name}</SheetTitle>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={planTypeColors[template.type]}>
              {planTypeLabels[template.type]}
            </Badge>
            {template.industry && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {template.industry}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {template.durationDays} days
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{template.description}</p>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {template.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-muted/50">
              <CardContent className="p-2.5 text-center">
                <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-base font-bold">{template.goals.length}</p>
                <p className="text-[10px] text-muted-foreground">Goals</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-2.5 text-center">
                <ClipboardCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-base font-bold">{template.reviews.length}</p>
                <p className="text-[10px] text-muted-foreground">Reviews</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-2.5 text-center">
                <MessageSquare className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-base font-bold">{template.conversations.length}</p>
                <p className="text-[10px] text-muted-foreground">1:1s</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-2.5 text-center">
                <GraduationCap className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-base font-bold">{linkedCourses.length}</p>
                <p className="text-[10px] text-muted-foreground">Courses</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mt-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="conversations">1:1s</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {/* Goals Tab */}
            <TabsContent value="goals" className="mt-4 space-y-3">
              {template.goals.map((goal, index) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant="outline" className="capitalize text-xs">
                            {goal.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Due: Day {goal.targetDaysFromStart}
                          </span>
                          <span>Category: {goal.category}</span>
                        </div>

                        {/* Milestones */}
                        {goal.milestones.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Milestones:</p>
                            {goal.milestones.map((milestone, mIndex) => (
                              <div key={mIndex} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{milestone.title}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  Day {milestone.daysFromStart}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="mt-4 space-y-3">
              {!hasLearningContent ? (
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="py-8 text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-medium mb-1">No Learning Content</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      This template doesn't have any learning paths or courses linked yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Learning Paths Section */}
                  {linkedLearningPaths.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Learning Paths ({linkedLearningPaths.length})
                      </h4>
                      {linkedLearningPaths.map((path) => {
                        if (!path) return null;
                        return (
                          <Card key={path.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium">{path.name}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {path.description}
                                  </p>
                                </div>
                                {path.industry && (
                                  <Badge variant="outline" className="text-xs">
                                    {path.industry}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{path.courseIds.length} courses</span>
                                <span>{Math.round(path.estimatedDuration / 60)}h estimated</span>
                                {path.requiredCompletionOrder && (
                                  <Badge variant="secondary" className="text-[10px]">Sequential</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Courses Section */}
                  {linkedCourses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Courses ({linkedCourses.length})
                      </h4>
                      {linkedCourses.map((course) => {
                        if (!course) return null;
                        return (
                          <Card key={course.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium">{course.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {course.description}
                                  </p>
                                </div>
                                <Badge 
                                  variant={course.complianceRequired ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {course.complianceRequired ? 'Mandatory' : course.difficulty}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{course.duration} min</span>
                                <span>{course.category}</span>
                                {course.certificateOnCompletion && (
                                  <Badge variant="outline" className="text-[10px]">Certificate</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4 space-y-3">
              {template.reviews.map((review, index) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{review.title}</h4>
                          <Badge variant="outline" className="capitalize text-xs">
                            {review.reviewCycle.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Scheduled: Day {review.daysFromStart}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-4 space-y-3">
              {template.conversations.map((conv, index) => (
                <Card key={conv.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{conv.title}</h4>
                          <Badge variant="outline" className="capitalize text-xs">
                            {conv.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Day {conv.daysFromStart}
                          </span>
                          <span>{conv.duration} minutes</span>
                        </div>
                        
                        {conv.agendaItems && conv.agendaItems.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Agenda:</p>
                            {conv.agendaItems.map((item, aIndex) => (
                              <div key={aIndex} className="flex items-center gap-2 text-sm">
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleAssign}>
            <Plus className="h-4 w-4 mr-2" />
            Assign This Plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
