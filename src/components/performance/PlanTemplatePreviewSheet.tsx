import React, { useState } from 'react';
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
} from 'lucide-react';
import { 
  PerformancePlanTemplate, 
  planTypeLabels, 
  planTypeColors,
} from '@/types/performancePlan';

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
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{template.goals.length}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{template.reviews.length}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{template.conversations.length}</p>
                <p className="text-xs text-muted-foreground">1:1 Meetings</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mt-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
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
