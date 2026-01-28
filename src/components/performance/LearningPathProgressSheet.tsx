import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Route, 
  BookOpen, 
  Clock, 
  Users,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Briefcase,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, differenceInDays } from 'date-fns';
import { LearningPath, Course } from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses } from '@/data/mockLmsData';

export interface PathEnrollment {
  id: string;
  pathId: string;
  staffId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  courseProgress: { courseId: string; status: 'not_started' | 'in_progress' | 'completed'; progress: number }[];
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
}

interface LearningPathProgressSheetProps {
  open: boolean;
  onClose: () => void;
  path: LearningPath;
  enrollments: PathEnrollment[];
  staff: StaffMember[];
}

export function LearningPathProgressSheet({ 
  open, 
  onClose, 
  path, 
  enrollments,
  staff 
}: LearningPathProgressSheetProps) {
  const getFullName = (s: StaffMember) => `${s.firstName} ${s.lastName}`;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCourseById = (id: string): Course | undefined => {
    return mockCourses.find(c => c.id === id);
  };

  const getStaffById = (id: string): StaffMember | undefined => {
    return staff.find(s => s.id === id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (enrollment: PathEnrollment) => {
    const isCompleted = enrollment.status === 'completed';
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
    }
    if (enrollment.dueDate && isPast(new Date(enrollment.dueDate))) {
      return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">Overdue</Badge>;
    }
    if (enrollment.status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCount = enrollments.filter(e => e.status === 'in_progress').length;
  const overdueCount = enrollments.filter(e => 
    e.dueDate && isPast(new Date(e.dueDate)) && e.status !== 'completed'
  ).length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {path.name}
          </SheetTitle>
          <SheetDescription>
            Track learner progress through this learning path
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Path Overview */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{path.courseIds.length} courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(path.estimatedDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{path.requiredCompletionOrder ? 'Sequential' : 'Flexible'}</span>
                  </div>
                  {path.industry && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{path.industry}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </CardContent>
              </Card>
            </div>

            {/* Course Journey */}
            <div>
              <h4 className="font-medium mb-3">Course Journey</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {path.courseIds.map((courseId, idx) => {
                  const course = getCourseById(courseId);
                  return (
                    <React.Fragment key={courseId}>
                      <div className="flex items-center gap-2 min-w-max p-2 border rounded-lg bg-background">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{course?.title || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {course && formatDuration(course.duration)}
                        </span>
                      </div>
                      {idx < path.courseIds.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Learner Progress */}
            <div>
              <h4 className="font-medium mb-3">Learner Progress ({enrollments.length})</h4>
              <div className="space-y-3">
                {enrollments.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No learners enrolled yet</p>
                  </div>
                ) : (
                  enrollments.map(enrollment => {
                    const member = getStaffById(enrollment.staffId);
                    const fullName = member ? getFullName(member) : 'Unknown';
                    return (
                      <Card key={enrollment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {member ? `${member.firstName[0]}${member.lastName[0]}` : '?'}
                              </div>
                              <div>
                                <p className="font-medium">{fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {member?.position} {member?.department && `• ${member.department}`}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(enrollment)}
                          </div>

                          {/* Overall Progress */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Overall Progress</span>
                              <span className="font-medium">{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>

                          {/* Course Progress */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {enrollment.courseProgress.map((cp, idx) => {
                              const course = getCourseById(cp.courseId);
                              return (
                                <div
                                  key={cp.courseId}
                                  className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                                    cp.status === 'completed' && "bg-green-100 dark:bg-green-900/30",
                                    cp.status === 'in_progress' && "bg-blue-100 dark:bg-blue-900/30",
                                    cp.status === 'not_started' && "bg-muted"
                                  )}
                                >
                                  {getStatusIcon(cp.status)}
                                  <span className="truncate max-w-24">{course?.title || `Course ${idx + 1}`}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Due Date */}
                          {enrollment.dueDate && (
                            <div className={cn(
                              "flex items-center gap-2 mt-3 text-xs",
                              isPast(new Date(enrollment.dueDate)) && enrollment.status !== 'completed'
                                ? "text-red-600"
                                : "text-muted-foreground"
                            )}>
                              <Calendar className="h-3 w-3" />
                              <span>Due: {format(new Date(enrollment.dueDate), 'PPP')}</span>
                              <span>•</span>
                              <span>{getDaysRemaining(enrollment.dueDate)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
