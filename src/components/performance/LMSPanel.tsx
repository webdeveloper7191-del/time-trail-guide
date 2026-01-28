import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  Clock, 
  Search, 
  Filter,
  Play,
  CheckCircle2,
  Star,
  Users,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  BookMarked,
  Trophy,
  Flame,
  BarChart3,
  Plus,
  FileText,
  Video,
  HelpCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  Building2,
  AlertCircle,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Course, 
  LearningPath, 
  Enrollment, 
  LearnerAnalytics,
  difficultyLabels,
  difficultyColors,
  enrollmentStatusLabels,
  enrollmentStatusColors,
  lmsCategories,
  contentTypeLabels,
} from '@/types/lms';
import { Goal } from '@/types/performance';
import { mockCourses, mockLearningPaths, mockEnrollments, mockCertificates, mockLearnerAnalytics } from '@/data/mockLmsData';
import { StaffMember } from '@/types/staff';
import { CoursePlayer } from './CoursePlayer';
import { LMSAdminPanel } from './LMSAdminPanel';
import { toast } from 'sonner';

interface LMSPanelProps {
  currentUserId: string;
  staff: StaffMember[];
  goals: Goal[];
  isAdmin?: boolean;
  onLinkGoalToCourse?: (goalId: string, courseId: string) => void;
  onCreateLearningGoal?: () => void;
  onUpdateGoalProgress?: (goalId: string, progress: number) => void;
}

export function LMSPanel({ 
  currentUserId, 
  staff, 
  goals,
  isAdmin = true, // Show admin by default for demo
  onLinkGoalToCourse,
  onCreateLearningGoal,
  onUpdateGoalProgress,
}: LMSPanelProps) {
  const [activeTab, setActiveTab] = useState('my-learning');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showCoursePlayer, setShowCoursePlayer] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);

  // Get user's enrollments
  const myEnrollments = useMemo(() => 
    enrollments.filter(e => e.staffId === currentUserId),
    [currentUserId, enrollments]
  );

  const inProgressEnrollments = myEnrollments.filter(e => e.status === 'in_progress');
  const completedEnrollments = myEnrollments.filter(e => e.status === 'completed');
  const upcomingEnrollments = myEnrollments.filter(e => e.status === 'not_started');

  // Filter courses for catalog
  const filteredCourses = useMemo(() => {
    return mockCourses.filter(course => {
      const matchesSearch = searchQuery === '' || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty && course.status === 'published';
    });
  }, [searchQuery, categoryFilter, difficultyFilter]);

  // Learning goals linked to courses
  const learningGoals = goals.filter(g => 
    g.category === 'Skill Development' || g.category === 'Personal Growth'
  );

  const analytics = mockLearnerAnalytics;

  const getEnrollmentForCourse = (courseId: string) => 
    myEnrollments.find(e => e.courseId === courseId);

  const handleEnroll = (course: Course) => {
    const newEnrollment: Enrollment = {
      id: `enroll-${Date.now()}`,
      staffId: currentUserId,
      courseId: course.id,
      status: 'not_started',
      progress: 0,
      moduleProgress: [],
      assessmentAttempts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEnrollments(prev => [...prev, newEnrollment]);
    toast.success(`Enrolled in ${course.title}`);
  };

  const handleContinueLearning = (enrollment: Enrollment) => {
    const course = mockCourses.find(c => c.id === enrollment.courseId);
    if (course) {
      setSelectedCourse(course);
      setShowCoursePlayer(true);
    }
  };

  // Course player handlers
  const handleProgressUpdate = useCallback((enrollmentId: string, moduleId: string, contentId: string, completed: boolean) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id !== enrollmentId) return e;
      
      const moduleProgress = [...e.moduleProgress];
      let mp = moduleProgress.find(p => p.moduleId === moduleId);
      
      if (!mp) {
        mp = { moduleId, status: 'in_progress', progress: 0, completedContentIds: [], startedAt: new Date().toISOString() };
        moduleProgress.push(mp);
      }
      
      if (completed && !mp.completedContentIds.includes(contentId)) {
        mp.completedContentIds.push(contentId);
      }
      
      // Recalculate progress
      const course = mockCourses.find(c => c.id === e.courseId);
      if (course) {
        const totalContent = course.modules.reduce((sum, m) => sum + m.content.length, 0);
        const completedContent = moduleProgress.reduce((sum, p) => sum + p.completedContentIds.length, 0);
        const newProgress = Math.round((completedContent / totalContent) * 100);
        
        return {
          ...e,
          moduleProgress,
          progress: newProgress,
          status: newProgress > 0 ? 'in_progress' : e.status,
          updatedAt: new Date().toISOString(),
        };
      }
      
      return { ...e, moduleProgress };
    }));
  }, []);

  const handleModuleComplete = useCallback((enrollmentId: string, moduleId: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id !== enrollmentId) return e;
      
      const moduleProgress = e.moduleProgress.map(mp => 
        mp.moduleId === moduleId 
          ? { ...mp, status: 'completed' as const, completedAt: new Date().toISOString() }
          : mp
      );
      
      return { ...e, moduleProgress, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const handleAssessmentSubmit = useCallback(async (
    enrollmentId: string, 
    assessmentId: string, 
    answers: Record<string, string | string[]>
  ): Promise<{ score: number; passed: boolean }> => {
    // Find the assessment and calculate score
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    const course = mockCourses.find(c => c.id === enrollment?.courseId);
    let assessment: any = null;
    
    for (const module of course?.modules || []) {
      if (module.assessment?.id === assessmentId) {
        assessment = module.assessment;
        break;
      }
    }
    
    if (!assessment) return { score: 0, passed: false };
    
    // Calculate score
    let correctAnswers = 0;
    for (const q of assessment.questions) {
      const userAnswer = answers[q.id];
      if (JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer)) {
        correctAnswers++;
      }
    }
    
    const score = Math.round((correctAnswers / assessment.questions.length) * 100);
    const passed = score >= assessment.passingScore;
    
    return { score, passed };
  }, [enrollments]);

  const handleCourseComplete = useCallback((enrollmentId: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id !== enrollmentId) return e;
      
      const updated: Enrollment = {
        ...e,
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update linked goals
      const course = mockCourses.find(c => c.id === e.courseId);
      if (course && onUpdateGoalProgress) {
        // Find goals linked to this course's skills
        const linkedGoals = goals.filter(g => 
          g.category === 'Skill Development' && 
          course.skills.some(skill => g.title.toLowerCase().includes(skill.toLowerCase()))
        );
        
        linkedGoals.forEach(goal => {
          // Increase goal progress when course completes
          const newProgress = Math.min(100, goal.progress + 25);
          onUpdateGoalProgress(goal.id, newProgress);
        });
      }
      
      return updated;
    }));
    
    setShowCoursePlayer(false);
    setSelectedCourse(null);
  }, [goals, onUpdateGoalProgress]);

  const handleAssignCourse = (courseId: string, staffIds: string[], dueDate?: Date) => {
    const newEnrollments = staffIds.map(staffId => ({
      id: `enroll-${Date.now()}-${staffId}`,
      staffId,
      courseId,
      status: 'not_started' as const,
      progress: 0,
      moduleProgress: [],
      assessmentAttempts: [],
      assignedBy: currentUserId,
      dueDate: dueDate?.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    setEnrollments(prev => [...prev, ...newEnrollments]);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalCoursesEnrolled}</p>
                <p className="text-xs text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalCoursesCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalLearningHours}h</p>
                <p className="text-xs text-muted-foreground">Learning Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.certificatesEarned}</p>
                <p className="text-xs text-muted-foreground">Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("grid w-full max-w-4xl", isAdmin ? "grid-cols-6" : "grid-cols-5")}>
          <TabsTrigger value="my-learning" className="gap-2">
            <BookMarked className="h-4 w-4" /> My Learning
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="paths" className="gap-2">
            <Target className="h-4 w-4" /> Learning Paths
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" /> Certificates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <Settings className="h-4 w-4" /> Admin
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Learning Tab */}
        <TabsContent value="my-learning" className="mt-6 space-y-6">
          {/* Continue Learning */}
          {inProgressEnrollments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Continue Learning
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {inProgressEnrollments.map((enrollment) => {
                  const course = mockCourses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  return (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold line-clamp-2">{course.title}</h4>
                              {enrollment.dueDate && isPast(parseISO(enrollment.dueDate)) && (
                                <Badge variant="destructive" className="shrink-0">Overdue</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className={cn("text-xs", difficultyColors[course.difficulty])}>
                                {difficultyLabels[course.difficulty]}
                              </Badge>
                              <span>{course.duration} min</span>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>{enrollment.progress}% complete</span>
                                <span className="text-muted-foreground">
                                  {enrollment.lastAccessedAt && `Last: ${format(parseISO(enrollment.lastAccessedAt), 'MMM d')}`}
                                </span>
                              </div>
                              <Progress value={enrollment.progress} className="h-2" />
                            </div>
                            <Button 
                              size="sm" 
                              className="mt-3 w-full"
                              onClick={() => handleContinueLearning(enrollment)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assigned Training */}
          {upcomingEnrollments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Assigned Training
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {upcomingEnrollments.map((enrollment) => {
                  const course = mockCourses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  const daysUntilDue = enrollment.dueDate 
                    ? differenceInDays(parseISO(enrollment.dueDate), new Date())
                    : null;
                  return (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {course.complianceRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">
                              Due in {daysUntilDue} days
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold line-clamp-2">{course.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {course.duration} min
                        </div>
                        <Button size="sm" className="w-full mt-3">
                          Start Course
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learning Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Learning Goals
              </h3>
              <Button variant="outline" size="sm" onClick={onCreateLearningGoal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            {learningGoals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No learning goals yet</p>
                  <Button variant="outline" className="mt-4" onClick={onCreateLearningGoal}>
                    Create a learning goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {learningGoals.slice(0, 4).map((goal) => (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{goal.title}</h4>
                        <Badge variant="outline">{goal.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {goal.description}
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{goal.progress}%</span>
                          <span className="text-muted-foreground">
                            Due {format(parseISO(goal.targetDate), 'MMM d')}
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Courses */}
          {completedEnrollments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                Recently Completed
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {completedEnrollments.slice(0, 3).map((enrollment) => {
                  const course = mockCourses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  return (
                    <Card key={enrollment.id} className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-400 font-medium">Completed</span>
                        </div>
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Completed {enrollment.completedAt && format(parseISO(enrollment.completedAt), 'MMM d, yyyy')}
                        </p>
                        {course.certificateOnCompletion && (
                          <Button variant="outline" size="sm" className="mt-3 w-full">
                            <Award className="h-4 w-4 mr-2" />
                            View Certificate
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Course Catalog Tab */}
        <TabsContent value="catalog" className="mt-6 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {lmsCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const enrollment = getEnrollmentForCourse(course.id);
              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center relative">
                    <GraduationCap className="h-12 w-12 text-primary/50 group-hover:scale-110 transition-transform" />
                    {course.complianceRequired && (
                      <Badge className="absolute top-2 right-2" variant="destructive">
                        Compliance
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-xs", difficultyColors[course.difficulty])}>
                        {difficultyLabels[course.difficulty]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    </div>
                    <h4 className="font-semibold line-clamp-2 min-h-[2.5rem]">{course.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[2.5rem]">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrollmentCount}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {course.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {course.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.skills.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {enrollment ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Badge className={enrollmentStatusColors[enrollment.status]}>
                            {enrollmentStatusLabels[enrollment.status]}
                          </Badge>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                        <Button size="sm" className="w-full mt-2">
                          {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleEnroll(course)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>

        {/* Learning Paths Tab */}
        <TabsContent value="paths" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Learning Paths</h3>
              <p className="text-sm text-muted-foreground">Structured course sequences for comprehensive skill development</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {mockLearningPaths.map((path) => {
              const courses = path.courseIds.map(id => mockCourses.find(c => c.id === id)).filter(Boolean) as Course[];
              const totalDuration = courses.reduce((sum, c) => sum + c.duration, 0);
              
              return (
                <Card key={path.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-primary/60 flex items-center px-6">
                    <div className="text-primary-foreground">
                      <h4 className="font-bold text-lg">{path.name}</h4>
                      <p className="text-sm opacity-90">{courses.length} courses • {Math.round(totalDuration / 60)}h total</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {courses.slice(0, 3).map((course, idx) => (
                        <div key={course.id} className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                          </div>
                          <span className="flex-1 truncate">{course.title}</span>
                          <span className="text-muted-foreground shrink-0">{course.duration} min</span>
                        </div>
                      ))}
                      {courses.length > 3 && (
                        <p className="text-sm text-muted-foreground pl-9">
                          +{courses.length - 3} more courses
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {path.industry && (
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {path.industry}
                        </Badge>
                      )}
                      {path.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Start Path
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">My Certificates</h3>
              <p className="text-sm text-muted-foreground">View and download your earned certificates</p>
            </div>
          </div>

          {mockCertificates.filter(c => c.staffId === currentUserId).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No certificates yet</h3>
                <p className="text-muted-foreground">Complete courses to earn certificates</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('catalog')}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockCertificates
                .filter(c => c.staffId === currentUserId)
                .map((cert) => {
                  const course = mockCourses.find(c => c.id === cert.courseId);
                  const isExpired = cert.expiresAt && isPast(parseISO(cert.expiresAt));
                  
                  return (
                    <Card 
                      key={cert.id} 
                      className={cn(
                        "overflow-hidden",
                        isExpired && "border-amber-500/50"
                      )}
                    >
                      <div className="h-24 bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center relative">
                        <Award className="h-12 w-12 text-white/80" />
                        {isExpired && (
                          <Badge className="absolute top-2 right-2 bg-red-500">Expired</Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{course?.title || 'Certificate'}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Certificate #{cert.certificateNumber}
                        </p>
                        
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issued:</span>
                            <span>{format(parseISO(cert.issuedAt), 'MMM d, yyyy')}</span>
                          </div>
                          {cert.expiresAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expires:</span>
                              <span className={isExpired ? 'text-red-500' : ''}>
                                {format(parseISO(cert.expiresAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>

                        {isExpired && course?.validityPeriod && (
                          <Button size="sm" className="w-full mt-2" variant="destructive">
                            Renew Certificate
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.weeklyProgress.map((week) => (
                    <div key={week.week} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{week.week}</span>
                        <span className="font-medium">{week.hours}h</span>
                      </div>
                      <Progress value={(week.hours / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills Acquired */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Skills Acquired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.skillsAcquired.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Learning Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{analytics.totalCoursesEnrolled}</p>
                    <p className="text-sm text-muted-foreground">Total Enrolled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{analytics.totalCoursesCompleted}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">{analytics.averageScore}%</p>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{analytics.longestStreak}</p>
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <LMSAdminPanel 
              staff={staff}
              onAssignCourse={handleAssignCourse}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Course Player */}
      <CoursePlayer
        open={showCoursePlayer}
        course={selectedCourse}
        enrollment={myEnrollments.find(e => e.courseId === selectedCourse?.id) || null}
        onClose={() => {
          setShowCoursePlayer(false);
          setSelectedCourse(null);
        }}
        onProgressUpdate={handleProgressUpdate}
        onModuleComplete={handleModuleComplete}
        onAssessmentSubmit={handleAssessmentSubmit}
        onCourseComplete={handleCourseComplete}
      />
    </div>
  );
}
