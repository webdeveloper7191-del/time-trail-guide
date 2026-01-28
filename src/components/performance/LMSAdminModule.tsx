import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  PenTool,
  FileText,
  Package,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Enrollment,
  difficultyLabels,
  difficultyColors,
} from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses, mockEnrollments } from '@/data/mockLmsData';
import { LMSAdminPanel } from './LMSAdminPanel';
import { CourseAuthoringTool } from './CourseAuthoringTool';
import { LearningPathsPanel } from './LearningPathsPanel';
import { CourseAuthoringState } from '@/types/lmsAdvanced';
import { toast } from 'sonner';
import { isPast, parseISO } from 'date-fns';

interface LMSAdminModuleProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function LMSAdminModule({ staff, currentUserId }: LMSAdminModuleProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAuthoringTool, setShowAuthoringTool] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);

  // Analytics
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
  const inProgressEnrollments = enrollments.filter(e => e.status === 'in_progress').length;
  const overdueEnrollments = enrollments.filter(e => 
    e.dueDate && isPast(parseISO(e.dueDate)) && e.status !== 'completed'
  ).length;
  const completionRate = totalEnrollments > 0 
    ? Math.round((completedEnrollments / totalEnrollments) * 100) 
    : 0;

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
    toast.success(`Course assigned to ${staffIds.length} staff member(s)`);
  };

  const handleSaveCourse = (course: CourseAuthoringState) => {
    console.log('Saving course:', course);
    toast.success('Course saved as draft');
  };

  const handlePublishCourse = (course: CourseAuthoringState) => {
    console.log('Publishing course:', course);
    toast.success('Course published successfully!');
    setShowAuthoringTool(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockCourses.length}</p>
                <p className="text-xs text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-xs text-muted-foreground">Enrollments</p>
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
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressEnrollments}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueEnrollments}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="paths" className="gap-2">
            <Route className="h-4 w-4" /> Learning Paths
          </TabsTrigger>
          <TabsTrigger value="authoring" className="gap-2">
            <PenTool className="h-4 w-4" /> Create Course
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <Settings className="h-4 w-4" /> Manage
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <LMSAdminPanel 
            staff={staff}
            onAssignCourse={handleAssignCourse}
          />
        </TabsContent>

        {/* Learning Paths Tab */}
        <TabsContent value="paths" className="mt-6">
          <LearningPathsPanel />
        </TabsContent>

        {/* Authoring Tab */}
        <TabsContent value="authoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Course Authoring
              </CardTitle>
              <CardDescription>
                Create custom courses with drag-and-drop modules, quizzes, and SCORM support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card 
                  className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" 
                  onClick={() => setShowAuthoringTool(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Plus className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="font-medium">Blank Course</p>
                    <p className="text-sm text-muted-foreground">Start from scratch</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowAuthoringTool(true)}>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Package className="h-10 w-10 text-orange-500 mb-3" />
                    <p className="font-medium">Import SCORM</p>
                    <p className="text-sm text-muted-foreground">Upload SCORM 1.2/2004</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowAuthoringTool(true)}>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-10 w-10 text-blue-500 mb-3" />
                    <p className="font-medium">Use Template</p>
                    <p className="text-sm text-muted-foreground">Pre-built structure</p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="font-medium mb-4">Recent Drafts</h4>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No draft courses yet</p>
                  <p className="text-sm">Courses you create will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Catalog</CardTitle>
              <CardDescription>Manage your published courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.map((course) => {
                  const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
                  const completed = courseEnrollments.filter(e => e.status === 'completed').length;
                  const rate = courseEnrollments.length > 0 
                    ? Math.round((completed / courseEnrollments.length) * 100) 
                    : 0;
                  
                  return (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{course.category}</Badge>
                            <Badge className={cn("text-xs", difficultyColors[course.difficulty])}>
                              {difficultyLabels[course.difficulty]}
                            </Badge>
                            {course.complianceRequired && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-medium">{courseEnrollments.length}</p>
                          <p className="text-xs text-muted-foreground">Enrolled</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={rate} className="w-16 h-2" />
                            <span className="text-sm">{rate}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Completion</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Authoring Tool */}
      <CourseAuthoringTool
        open={showAuthoringTool}
        onClose={() => setShowAuthoringTool(false)}
        onSave={handleSaveCourse}
        onPublish={handlePublishCourse}
      />
    </div>
  );
}
