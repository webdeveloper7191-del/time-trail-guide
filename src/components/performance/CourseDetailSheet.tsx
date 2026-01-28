import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  Clock,
  BarChart3,
  Users,
  Star,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  BookOpen,
  Award,
  FileText,
  Video,
  HelpCircle,
  Target,
  Sparkles,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Course,
  Enrollment,
  difficultyLabels,
  difficultyColors,
  contentTypeLabels,
} from '@/types/lms';

interface CourseDetailSheetProps {
  open: boolean;
  course: Course | null;
  enrollment: Enrollment | null;
  onClose: () => void;
  onEnroll: (course: Course) => void;
  onStartCourse: (enrollment: Enrollment) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  interactive: <Target className="h-4 w-4" />,
  external_link: <BookOpen className="h-4 w-4" />,
};

export function CourseDetailSheet({
  open,
  course,
  enrollment,
  onClose,
  onEnroll,
  onStartCourse,
}: CourseDetailSheetProps) {
  if (!course) return null;

  const isEnrolled = !!enrollment;
  const totalContent = course.modules.reduce((sum, m) => sum + m.content.length, 0);
  const completedContent = enrollment?.moduleProgress.reduce(
    (sum, mp) => sum + mp.completedContentIds.length, 0
  ) || 0;
  const progressPercent = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

  const daysUntilDue = enrollment?.dueDate
    ? differenceInDays(parseISO(enrollment.dueDate), new Date())
    : null;

  const estimatedTimeRemaining = isEnrolled
    ? Math.round(course.duration * ((100 - progressPercent) / 100))
    : course.duration;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col" side="right">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline">{course.category}</Badge>
                <Badge className={cn("text-xs", difficultyColors[course.difficulty])}>
                  {difficultyLabels[course.difficulty]}
                </Badge>
                {course.complianceRequired && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight">{course.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">by {course.instructor}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-2 rounded-lg bg-background/60 backdrop-blur">
              <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{course.duration}m</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60 backdrop-blur">
              <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{course.modules.length}</p>
              <p className="text-xs text-muted-foreground">Modules</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60 backdrop-blur">
              <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{course.enrollmentCount}</p>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60 backdrop-blur">
              <Star className="h-4 w-4 mx-auto text-amber-500 fill-amber-500 mb-1" />
              <p className="text-sm font-semibold">{course.rating}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Progress Section (if enrolled) */}
            {isEnrolled && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium">Your Progress</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2 mb-3" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{completedContent} of {totalContent} lessons completed</span>
                    <span>~{estimatedTimeRemaining}m remaining</span>
                  </div>
                  {daysUntilDue !== null && (
                    <div className={cn(
                      "flex items-center gap-2 mt-3 p-2 rounded-lg text-sm",
                      daysUntilDue <= 3 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      daysUntilDue <= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-muted"
                    )}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysUntilDue <= 0 ? 'Overdue!' :
                         daysUntilDue === 1 ? 'Due tomorrow' :
                         `Due in ${daysUntilDue} days`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* About Section */}
            <div>
              <h3 className="font-semibold mb-2">About this course</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Skills You'll Learn */}
            {course.skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Skills you'll learn
                </h3>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Course Content Outline */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Course Content
              </h3>
              <div className="space-y-2">
                {course.modules.map((module, idx) => {
                  const moduleEnrollment = enrollment?.moduleProgress.find(p => p.moduleId === module.id);
                  const isModuleComplete = moduleEnrollment?.status === 'completed';
                  const isModuleLocked = module.isLocked || (module.unlockAfterModuleId && 
                    !enrollment?.moduleProgress.find(p => p.moduleId === module.unlockAfterModuleId && p.status === 'completed'));
                  
                  const completedInModule = moduleEnrollment?.completedContentIds.length || 0;
                  const totalInModule = module.content.length;

                  return (
                    <div key={module.id} className={cn(
                      "border rounded-lg overflow-hidden transition-colors",
                      isModuleComplete ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : "border-border"
                    )}>
                      <div className="p-3 flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
                          isModuleComplete ? "bg-green-100 text-green-700 dark:bg-green-900/30" :
                          isModuleLocked ? "bg-muted text-muted-foreground" :
                          "bg-primary/10 text-primary"
                        )}>
                          {isModuleComplete ? <CheckCircle2 className="h-4 w-4" /> :
                           isModuleLocked ? <Lock className="h-4 w-4" /> :
                           idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-sm",
                            isModuleLocked && "text-muted-foreground"
                          )}>{module.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{module.content.length} lessons</span>
                            <span>{module.duration} min</span>
                            {isEnrolled && !isModuleComplete && !isModuleLocked && (
                              <span className="text-primary">{completedInModule}/{totalInModule}</span>
                            )}
                          </div>
                        </div>
                        {module.assessment && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            <HelpCircle className="h-3 w-3 mr-1" />
                            Quiz
                          </Badge>
                        )}
                      </div>

                      {/* Expandable content preview */}
                      <div className="px-3 pb-3 space-y-1">
                        {module.content.slice(0, 3).map((content) => {
                          const isComplete = enrollment?.moduleProgress
                            .find(p => p.moduleId === module.id)
                            ?.completedContentIds.includes(content.id);
                          
                          return (
                            <div key={content.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-11">
                              {isComplete ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              ) : (
                                <Circle className="h-3 w-3 shrink-0" />
                              )}
                              <span className="truncate">{content.title}</span>
                              <span className="text-muted-foreground/60 shrink-0">{content.duration}m</span>
                            </div>
                          );
                        })}
                        {module.content.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-11">
                            +{module.content.length - 3} more lessons
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certificate Info */}
            {course.certificateOnCompletion && (
              <>
                <Separator />
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Certificate of Completion</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Earn a certificate upon completing this course
                        {course.validityPeriod && ` (valid for ${course.validityPeriod} days)`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/30">
          {isEnrolled ? (
            <Button 
              className="w-full h-12 text-base" 
              onClick={() => onStartCourse(enrollment)}
            >
              <Play className="h-5 w-5 mr-2" />
              {enrollment.status === 'not_started' ? 'Start Course' :
               enrollment.status === 'completed' ? 'Review Course' :
               'Continue Learning'}
            </Button>
          ) : (
            <Button 
              className="w-full h-12 text-base" 
              onClick={() => onEnroll(course)}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Enroll Now
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
