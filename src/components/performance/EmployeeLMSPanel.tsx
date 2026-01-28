import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  Clock, 
  Search, 
  Play,
  CheckCircle2,
  Target,
  Trophy,
  Flame,
  BarChart3,
  ChevronRight,
  BookMarked,
  Sparkles,
  Star,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Course, 
  Enrollment,
  difficultyLabels,
  difficultyColors,
  lmsCategories,
} from '@/types/lms';
import { mockCourses, mockEnrollments, mockLearnerAnalytics, mockCertificates, mockLearningPaths } from '@/data/mockLmsData';
import { MobileCoursePlayer } from '@/components/performance/MobileCoursePlayer';
import { CoursePlayer } from '@/components/performance/CoursePlayer';
import { GamificationPanel } from '@/components/performance/GamificationPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface EmployeeLMSPanelProps {
  currentUserId: string;
}

export function EmployeeLMSPanel({ currentUserId }: EmployeeLMSPanelProps) {
  const [activeTab, setActiveTab] = useState('my-learning');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCoursePlayer, setShowCoursePlayer] = useState(false);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const isMobile = useIsMobile();

  const myEnrollments = useMemo(() => 
    enrollments.filter(e => e.staffId === currentUserId),
    [currentUserId, enrollments]
  );

  const inProgressEnrollments = myEnrollments.filter(e => e.status === 'in_progress');
  const completedEnrollments = myEnrollments.filter(e => e.status === 'completed');
  const upcomingEnrollments = myEnrollments.filter(e => e.status === 'not_started');

  const filteredCourses = useMemo(() => {
    return mockCourses.filter(course => {
      const matchesSearch = searchQuery === '' || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      return matchesSearch && matchesCategory && course.status === 'published';
    });
  }, [searchQuery, categoryFilter]);

  const analytics = mockLearnerAnalytics;

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
      if (isMobile) {
        setShowMobilePlayer(true);
      } else {
        setShowCoursePlayer(true);
      }
    }
  };

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

  const handleCourseComplete = useCallback((enrollmentId: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.id !== enrollmentId) return e;
      return {
        ...e,
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }));
    setShowCoursePlayer(false);
    setShowMobilePlayer(false);
    setSelectedCourse(null);
    toast.success('🎉 Course completed! Certificate earned.');
  }, []);

  const handleAssessmentSubmit = useCallback(async (
    enrollmentId: string, 
    assessmentId: string, 
    answers: Record<string, string | string[]>
  ): Promise<{ score: number; passed: boolean }> => {
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

  const getEnrollmentForCourse = (courseId: string) => 
    myEnrollments.find(e => e.courseId === courseId);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myEnrollments.length}</p>
                <p className="text-xs text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEnrollments.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Award className="h-5 w-5 text-purple-600" />
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
                <Flame className="h-5 w-5 text-orange-600" />
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
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="my-learning" className="gap-2">
            <BookMarked className="h-4 w-4" /> My Learning
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" /> Browse
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Sparkles className="h-4 w-4" /> Rewards
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" /> Certificates
          </TabsTrigger>
        </TabsList>

        {/* My Learning Tab */}
        <TabsContent value="my-learning" className="mt-6 space-y-6">
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
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold line-clamp-1">{course.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-xs", difficultyColors[course.difficulty])}>
                                {difficultyLabels[course.difficulty]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{course.duration} min</span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>{enrollment.progress}% complete</span>
                              </div>
                              <Progress value={enrollment.progress} className="h-1.5" />
                            </div>
                            <Button 
                              size="sm" 
                              className="mt-2 w-full"
                              onClick={() => handleContinueLearning(enrollment)}
                            >
                              <Play className="h-3 w-3 mr-1" />
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

          {upcomingEnrollments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
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
                    <Card key={enrollment.id}>
                      <CardContent className="p-4">
                        {course.complianceRequired && (
                          <Badge variant="destructive" className="text-xs mb-2">Required</Badge>
                        )}
                        <h4 className="font-semibold line-clamp-2">{course.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {course.duration} min
                        </div>
                        <Button size="sm" className="w-full mt-3" onClick={() => handleContinueLearning(enrollment)}>
                          Start Course
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

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
                    <Card key={enrollment.id} className="bg-green-50/50 dark:bg-green-900/10 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Completed</span>
                        </div>
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {enrollment.completedAt && format(parseISO(enrollment.completedAt), 'MMM d, yyyy')}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {myEnrollments.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No courses yet</h3>
                <p className="text-muted-foreground mt-1">Browse the catalog to start learning</p>
                <Button className="mt-4" onClick={() => setActiveTab('catalog')}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="mt-6 space-y-6">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const enrollment = getEnrollmentForCourse(course.id);
              const isEnrolled = !!enrollment;
              
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{course.category}</Badge>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">{course.rating}</span>
                      </div>
                    </div>
                    <h4 className="font-semibold line-clamp-2">{course.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <Badge className={difficultyColors[course.difficulty]}>
                        {difficultyLabels[course.difficulty]}
                      </Badge>
                      <span>{course.duration} min</span>
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      size="sm"
                      variant={isEnrolled ? "outline" : "default"}
                      onClick={() => isEnrolled ? handleContinueLearning(enrollment) : handleEnroll(course)}
                    >
                      {isEnrolled ? 'Continue' : 'Enroll Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          <GamificationPanel currentUserId={currentUserId} />
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockCertificates.map((cert) => {
              const course = mockCourses.find(c => c.id === cert.courseId);
              return (
                <Card key={cert.id} className="border-2 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold">{course?.title || 'Certificate'}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Issued {format(parseISO(cert.issuedAt), 'MMM d, yyyy')}
                    </p>
                    <Badge className="mt-2" variant={cert.status === 'active' ? 'default' : 'secondary'}>
                      {cert.status}
                    </Badge>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View Certificate
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Desktop Course Player */}
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

      {/* Mobile Course Player */}
      <MobileCoursePlayer
        open={showMobilePlayer}
        course={selectedCourse}
        enrollment={myEnrollments.find(e => e.courseId === selectedCourse?.id) || null}
        onClose={() => {
          setShowMobilePlayer(false);
          setSelectedCourse(null);
        }}
        onProgressUpdate={handleProgressUpdate}
        onModuleComplete={handleModuleComplete}
        onCourseComplete={handleCourseComplete}
      />
    </div>
  );
}
