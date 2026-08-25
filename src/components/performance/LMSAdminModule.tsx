import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Route,
  MessageSquare,
  ClipboardList,
  UserCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Enrollment } from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses, mockEnrollments, mockLearningPaths } from '@/data/mockLmsData';
import { LMSAdminPanel } from './LMSAdminPanel';
import { CourseAuthoringTool } from './CourseAuthoringTool';
import { LearningPathsPanel } from './LearningPathsPanel';
import { LmsSettingsPanel } from './lms/LmsSettingsPanel';
import { CourseAuthoringState } from '@/types/lmsAdvanced';
import { toast } from 'sonner';
import { isPast, parseISO } from 'date-fns';

interface LMSAdminModuleProps {
  staff: StaffMember[];
  currentUserId: string;
}

const TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart3, help: 'How learning is tracking across the business' },
  { value: 'courses', label: 'Courses', icon: BookOpen, help: 'Your course library — build, edit and assign' },
  { value: 'paths', label: 'Learning Paths', icon: Route, help: 'Group courses into a step-by-step program' },
  { value: 'people', label: 'People', icon: UserCheck, help: 'Progress for every staff member' },
  { value: 'assignments', label: 'Assignments', icon: ClipboardList, help: 'Who has been given what, and when it is due' },
  { value: 'reviews', label: 'Feedback', icon: MessageSquare, help: 'Ratings and comments staff left on courses' },
  { value: 'settings', label: 'Settings', icon: Settings, help: 'Due dates, reminders, pass marks and compliance rules' },
] as const;

// Module tab value -> LMSAdminPanel internal tab value
const PANEL_TAB: Record<string, string> = {
  overview: 'overview',
  courses: 'courses',
  people: 'staff',
  assignments: 'assignments',
  reviews: 'reviews',
};

export function LMSAdminModule({ staff, currentUserId }: LMSAdminModuleProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showAuthoringTool, setShowAuthoringTool] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const inProgress = enrollments.filter((e) => e.status === 'in_progress').length;
    const overdue = enrollments.filter(
      (e) => e.dueDate && isPast(parseISO(e.dueDate)) && e.status !== 'completed',
    ).length;
    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [enrollments]);

  const handleAssignCourse = (courseId: string, staffIds: string[], dueDate?: Date) => {
    const newEnrollments = staffIds.map((staffId) => ({
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

    setEnrollments((prev) => [...prev, ...newEnrollments]);
    toast.success(`Course assigned to ${staffIds.length} staff member(s)`);
  };

  const handleSaveCourse = (_course: CourseAuthoringState) => {
    toast.success('Course saved as a draft');
  };

  const handlePublishCourse = (_course: CourseAuthoringState) => {
    toast.success('Course published — you can now assign it to staff');
    setShowAuthoringTool(false);
    setActiveTab('courses');
  };

  const activeMeta = TABS.find((t) => t.value === activeTab);

  const kpis = [
    { label: 'Courses', value: mockCourses.length, icon: BookOpen, tone: 'primary' as const, hint: 'in your library' },
    { label: 'Learning paths', value: mockLearningPaths.length, icon: Route, tone: 'primary' as const, hint: 'programs built' },
    { label: 'Assigned', value: stats.total, icon: Users, tone: 'muted' as const, hint: 'courses given to staff' },
    { label: 'Completed', value: `${stats.completionRate}%`, icon: CheckCircle2, tone: 'success' as const, hint: `${stats.completed} finished` },
    { label: 'In progress', value: stats.inProgress, icon: Clock, tone: 'warning' as const, hint: 'started, not finished' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, tone: 'danger' as const, hint: 'past the due date' },
  ];

  const toneClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    muted: 'bg-muted text-muted-foreground',
    success: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6">
      {/* Module header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Learning &amp; Development
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Build courses, group them into learning paths, assign them to your team and keep mandatory training up to date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('paths')}>
            <Route className="mr-2 h-4 w-4" /> New learning path
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('assignments')}>
            <ClipboardList className="mr-2 h-4 w-4" /> Assign learning
          </Button>
          <Button size="sm" onClick={() => setShowAuthoringTool(true)}>
            <Plus className="mr-2 h-4 w-4" /> New course
          </Button>
        </div>
      </div>

      {/* Getting started guidance */}
      {showGettingStarted && (
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="relative p-5">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowGettingStarted(false)}
              aria-label="Hide getting started"
            >
              <X className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium tracking-tight">New here? Learning works in three steps</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {[
                { step: '1', title: 'Build a course', body: 'Add lessons, videos and a short quiz — or upload one from a provider.', action: () => setShowAuthoringTool(true), cta: 'Create a course' },
                { step: '2', title: 'Group into a path', body: 'Put courses in order, e.g. everything a new starter needs in week one.', action: () => setActiveTab('paths'), cta: 'Build a path' },
                { step: '3', title: 'Assign and track', body: 'Give it to staff with a due date. Reminders are sent automatically.', action: () => setActiveTab('assignments'), cta: 'Assign learning' },
              ].map((s) => (
                <div key={s.step} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {s.step}
                    </span>
                    <p className="text-sm font-medium">{s.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                  <Button variant="link" size="sm" className="mt-1 h-auto px-0 text-xs" onClick={s.action}>
                    {s.cta} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
                <p className="truncate text-[11px] text-muted-foreground">{kpi.hint}</p>
              </div>
              <span className={cn('rounded-full p-2.5', toneClasses[kpi.tone])}>
                <kpi.icon className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Single, flat tab bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-border/60">
          <div className="overflow-x-auto">
            <TabsList className="h-11 gap-1 bg-transparent p-0">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none px-3 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <t.icon className="mr-2 h-4 w-4" />
                  {t.label}
                  {t.value === 'assignments' && stats.overdue > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-destructive/10 text-destructive">
                      {stats.overdue}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {activeMeta && (
          <p className="mt-3 text-xs text-muted-foreground">{activeMeta.help}</p>
        )}

        {Object.keys(PANEL_TAB).map((value) => (
          <TabsContent key={value} value={value} className="mt-4">
            <LMSAdminPanel
              staff={staff}
              onAssignCourse={handleAssignCourse}
              embedded
              tab={PANEL_TAB[value]}
              onTabChange={(panelTab) => {
                const moduleTab = Object.keys(PANEL_TAB).find((k) => PANEL_TAB[k] === panelTab);
                if (moduleTab) setActiveTab(moduleTab);
              }}
            />
          </TabsContent>
        ))}

        <TabsContent value="paths" className="mt-4">
          <LearningPathsPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <LmsSettingsPanel />
        </TabsContent>
      </Tabs>

      <CourseAuthoringTool
        open={showAuthoringTool}
        onClose={() => setShowAuthoringTool(false)}
        onSave={handleSaveCourse}
        onPublish={handlePublishCourse}
      />
    </div>
  );
}
