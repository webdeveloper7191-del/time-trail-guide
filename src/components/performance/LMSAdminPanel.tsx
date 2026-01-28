import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Plus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Building2,
  Award,
  Target,
  ChevronRight,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Course, 
  Enrollment, 
  difficultyLabels,
  difficultyColors,
  enrollmentStatusLabels,
  enrollmentStatusColors,
  lmsCategories,
  lmsIndustries,
} from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses, mockEnrollments, mockLearnerAnalytics } from '@/data/mockLmsData';
import { toast } from 'sonner';
import { CourseAuthoringTool } from './CourseAuthoringTool';
import { CourseReviewsPanel } from './CourseReviewsPanel';
import { CourseAuthoringState } from '@/types/lmsAdvanced';

interface LMSAdminPanelProps {
  staff: StaffMember[];
  onAssignCourse: (courseId: string, staffIds: string[], dueDate?: Date) => void;
}

export function LMSAdminPanel({ staff, onAssignCourse }: LMSAdminPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState<Date | undefined>();
  const [showCourseAuthoring, setShowCourseAuthoring] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseAuthoringState | undefined>();
  const [courses, setCourses] = useState(mockCourses);

  // Analytics
  const totalEnrollments = mockEnrollments.length;
  const completedEnrollments = mockEnrollments.filter(e => e.status === 'completed').length;
  const inProgressEnrollments = mockEnrollments.filter(e => e.status === 'in_progress').length;
  const overdueEnrollments = mockEnrollments.filter(e => 
    e.dueDate && isPast(parseISO(e.dueDate)) && e.status !== 'completed'
  ).length;

  const completionRate = totalEnrollments > 0 
    ? Math.round((completedEnrollments / totalEnrollments) * 100) 
    : 0;

  // Staff learning stats
  const staffLearningStats = useMemo(() => {
    return staff.map(s => {
      const enrollments = mockEnrollments.filter(e => e.staffId === s.id);
      const completed = enrollments.filter(e => e.status === 'completed').length;
      const inProgress = enrollments.filter(e => e.status === 'in_progress').length;
      const overdue = enrollments.filter(e => 
        e.dueDate && isPast(parseISO(e.dueDate)) && e.status !== 'completed'
      ).length;
      
      return {
        staff: s,
        totalEnrollments: enrollments.length,
        completed,
        inProgress,
        overdue,
        avgProgress: enrollments.length > 0 
          ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
          : 0,
      };
    });
  }, [staff]);

  // Course stats
  const courseStats = useMemo(() => {
    return courses.map(course => {
      const enrollments = mockEnrollments.filter(e => e.courseId === course.id);
      const completed = enrollments.filter(e => e.status === 'completed').length;
      
      return {
        course,
        totalEnrollments: enrollments.length,
        completionRate: enrollments.length > 0 
          ? Math.round((completed / enrollments.length) * 100)
          : 0,
        avgProgress: enrollments.length > 0
          ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
          : 0,
      };
    });
  }, [courses]);

  const handleOpenCreateCourse = () => {
    setEditingCourse(undefined);
    setShowCourseAuthoring(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    // Convert Course to CourseAuthoringState format
    const authoringState: CourseAuthoringState = {
      courseId: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      industry: course.industry,
      complianceRequired: course.complianceRequired,
      validityPeriod: course.validityPeriod,
      certificateOnCompletion: true,
      passingScore: 80,
      tags: course.tags || [],
      modules: course.modules.map((m, idx) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        order: m.order,
        duration: m.duration,
        content: m.content.map((c, cIdx) => ({
          id: c.id,
          title: c.title,
          type: c.type as any,
          order: cIdx + 1,
          mandatory: c.mandatory,
          duration: c.duration,
          url: c.url,
        })),
        isLocked: m.isLocked,
        isExpanded: true,
      })),
      status: course.status === 'published' ? 'published' : 'draft',
      isDirty: false,
    };
    setEditingCourse(authoringState);
    setShowCourseAuthoring(true);
  };

  const handleSaveCourse = (courseData: CourseAuthoringState) => {
    // Convert CourseAuthoringState back to Course format
    const newCourse: Course = {
      id: courseData.courseId,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty: courseData.difficulty as Course['difficulty'],
      duration: courseData.modules.reduce((sum, m) => 
        sum + m.content.reduce((cSum, c) => cSum + (c.duration || 0), 0), 0
      ),
      status: 'draft',
      modules: courseData.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        duration: m.duration,
        content: m.content.map((c, idx) => ({
          id: c.id,
          title: c.title,
          type: c.type as Course['modules'][0]['content'][0]['type'],
          order: c.order || idx + 1,
          duration: c.duration,
          mandatory: c.mandatory,
          url: c.url,
        })),
        isLocked: m.isLocked,
      })),
      instructor: 'Admin',
      prerequisites: [],
      skills: [],
      industry: courseData.industry,
      tags: courseData.tags,
      complianceRequired: courseData.complianceRequired,
      certificateOnCompletion: courseData.certificateOnCompletion,
      validityPeriod: courseData.validityPeriod,
      passingScore: courseData.passingScore,
      rating: 0,
      enrollmentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCourses(prev => {
      const existingIdx = prev.findIndex(c => c.id === newCourse.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newCourse;
        return updated;
      }
      return [...prev, newCourse];
    });
  };

  const handlePublishCourse = (courseData: CourseAuthoringState) => {
    handleSaveCourse({ ...courseData, status: 'published' });
    setShowCourseAuthoring(false);
  };

  const handleOpenAssign = (course: Course) => {
    setSelectedCourse(course);
    setSelectedStaffIds([]);
    setAssignDueDate(undefined);
    setShowAssignSheet(true);
  };

  const handleAssign = () => {
    if (!selectedCourse || selectedStaffIds.length === 0) {
      toast.error('Please select staff members to assign');
      return;
    }
    
    onAssignCourse(selectedCourse.id, selectedStaffIds, assignDueDate);
    toast.success(`Course assigned to ${selectedStaffIds.length} staff member(s)`);
    setShowAssignSheet(false);
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const selectAllStaff = () => {
    if (selectedStaffIds.length === staff.filter(s => s.status === 'active').length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.filter(s => s.status === 'active').map(s => s.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            LMS Administration
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage courses, assignments, and track team learning progress
          </p>
        </div>
        <Button onClick={handleOpenCreateCourse}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="staff">Staff Progress</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseStats
                    .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
                    .slice(0, 5)
                    .map((stat) => (
                      <div key={stat.course.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{stat.course.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={stat.completionRate} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{stat.completionRate}%</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {stat.totalEnrollments} enrolled
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Needing Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Staff Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffLearningStats
                    .filter(s => s.overdue > 0 || (s.inProgress > 0 && s.avgProgress < 30))
                    .slice(0, 5)
                    .map((stat) => (
                      <div key={stat.staff.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stat.staff.avatar} />
                          <AvatarFallback>
                            {stat.staff.firstName[0]}{stat.staff.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {stat.staff.firstName} {stat.staff.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{stat.staff.position}</p>
                        </div>
                        {stat.overdue > 0 && (
                          <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">{stat.overdue} overdue</Badge>
                        )}
                      </div>
                    ))}
                  {staffLearningStats.filter(s => s.overdue > 0).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      All staff are on track! 🎉
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Training Status</CardTitle>
              <CardDescription>Mandatory courses completion across the team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {mockCourses
                  .filter(c => c.complianceRequired)
                  .map((course) => {
                    const stat = courseStats.find(s => s.course.id === course.id);
                    return (
                      <div key={course.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium line-clamp-2">{course.title}</h4>
                          <Badge className="shrink-0 text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
                            Required
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Completion</span>
                            <span>{stat?.completionRate || 0}%</span>
                          </div>
                          <Progress value={stat?.completionRate || 0} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {stat?.totalEnrollments || 0} staff enrolled
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-center">Enrollments</TableHead>
                  <TableHead className="text-center">Completion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStats
                  .filter(s => 
                    s.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.course.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((stat) => (
                    <TableRow key={stat.course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{stat.course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {stat.course.duration} min
                              {stat.course.complianceRequired && ' • Compliance'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.course.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={difficultyColors[stat.course.difficulty]}>
                          {difficultyLabels[stat.course.difficulty]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{stat.totalEnrollments}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={stat.completionRate} className="w-16 h-2" />
                          <span className="text-sm">{stat.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenAssign(stat.course)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditCourse(stat.course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Staff Progress Tab */}
        <TabsContent value="staff" className="mt-6">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="text-center">Avg Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffLearningStats.map((stat) => (
                  <TableRow key={stat.staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stat.staff.avatar} />
                          <AvatarFallback>
                            {stat.staff.firstName[0]}{stat.staff.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {stat.staff.firstName} {stat.staff.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {stat.staff.position}
                    </TableCell>
                    <TableCell className="text-center">{stat.totalEnrollments}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20">
                        {stat.completed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20">
                        {stat.inProgress}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.overdue > 0 ? (
                        <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">{stat.overdue}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={stat.avgProgress} className="w-16 h-2" />
                        <span className="text-sm">{stat.avgProgress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-6">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEnrollments.map((enrollment) => {
                  const staffMember = staff.find(s => s.id === enrollment.staffId);
                  const course = mockCourses.find(c => c.id === enrollment.courseId);
                  const assignedBy = enrollment.assignedBy 
                    ? staff.find(s => s.id === enrollment.assignedBy)
                    : null;
                  const isOverdue = enrollment.dueDate && 
                    isPast(parseISO(enrollment.dueDate)) && 
                    enrollment.status !== 'completed';
                  
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={staffMember?.avatar} />
                            <AvatarFallback className="text-xs">
                              {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{staffMember?.firstName} {staffMember?.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{course?.title}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          enrollmentStatusColors[enrollment.status],
                          isOverdue && "bg-red-100 text-red-700"
                        )}>
                          {isOverdue ? 'Overdue' : enrollmentStatusLabels[enrollment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={enrollment.progress} className="w-16 h-2" />
                          <span className="text-sm">{enrollment.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {enrollment.dueDate ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {format(parseISO(enrollment.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {assignedBy 
                          ? `${assignedBy.firstName} ${assignedBy.lastName}`
                          : 'Self-enrolled'
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-6">
          <CourseReviewsPanel currentUserId="admin" />
        </TabsContent>
      </Tabs>

      {/* Assign Course Sheet */}
      <Sheet open={showAssignSheet} onOpenChange={setShowAssignSheet}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Assign Course</SheetTitle>
          </SheetHeader>
          
          {selectedCourse && (
            <div className="mt-6 space-y-6">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium">{selectedCourse.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCourse.duration} min • {selectedCourse.modules.length} modules
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Staff Members</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllStaff}>
                    {selectedStaffIds.length === staff.filter(s => s.status === 'active').length 
                      ? 'Deselect All' 
                      : 'Select All'
                    }
                  </Button>
                </div>
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {staff
                      .filter(s => s.status === 'active')
                      .map((s) => {
                        const isEnrolled = mockEnrollments.some(
                          e => e.staffId === s.id && e.courseId === selectedCourse.id
                        );
                        
                        return (
                          <div 
                            key={s.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg",
                              isEnrolled ? "opacity-50" : "hover:bg-muted cursor-pointer"
                            )}
                            onClick={() => !isEnrolled && toggleStaffSelection(s.id)}
                          >
                            <Checkbox 
                              checked={selectedStaffIds.includes(s.id)}
                              disabled={isEnrolled}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={s.avatar} />
                              <AvatarFallback>
                                {s.firstName[0]}{s.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{s.position}</p>
                            </div>
                            {isEnrolled && (
                              <Badge variant="secondary" className="text-xs">Enrolled</Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
                <p className="text-sm text-muted-foreground">
                  {selectedStaffIds.length} staff selected
                </p>
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {assignDueDate ? format(assignDueDate, 'PPP') : 'Select due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={assignDueDate}
                      onSelect={setAssignDueDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAssign}
                disabled={selectedStaffIds.length === 0}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to {selectedStaffIds.length} Staff
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Course Authoring Tool */}
      <CourseAuthoringTool
        open={showCourseAuthoring}
        onClose={() => {
          setShowCourseAuthoring(false);
          setEditingCourse(undefined);
        }}
        onSave={handleSaveCourse}
        onPublish={handlePublishCourse}
        initialCourse={editingCourse}
      />
    </div>
  );
}
