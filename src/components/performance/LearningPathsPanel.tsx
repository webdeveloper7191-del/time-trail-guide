import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Route, 
  Plus, 
  Search, 
  BookOpen, 
  Clock, 
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  BarChart3,
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LearningPath, Course } from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses } from '@/data/mockLmsData';
import { mockStaff } from '@/data/mockStaffData';
import { LearningPathBuilder } from './LearningPathBuilder';
import { AssignLearningPathDrawer } from './AssignLearningPathDrawer';
import { LearningPathProgressSheet, PathEnrollment } from './LearningPathProgressSheet';
import { toast } from 'sonner';

// Mock learning paths data
const mockLearningPaths: LearningPath[] = [
  {
    id: 'path-1',
    name: 'New Employee Onboarding',
    description: 'Essential training for all new team members covering company policies, safety, and core skills.',
    courseIds: ['course-1', 'course-2', 'course-3'],
    requiredCompletionOrder: true,
    estimatedDuration: 240,
    industry: 'General',
    tags: ['onboarding', 'mandatory', 'new-hire'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'path-2',
    name: 'Leadership Development Track',
    description: 'Comprehensive program for emerging leaders covering management skills, communication, and team building.',
    courseIds: ['course-4', 'course-5'],
    requiredCompletionOrder: false,
    estimatedDuration: 180,
    industry: 'Corporate',
    tags: ['leadership', 'management', 'development'],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'path-3',
    name: 'Childcare Compliance Essentials',
    description: 'Mandatory training for childcare workers covering safety regulations, first aid, and child protection.',
    courseIds: ['course-1', 'course-6'],
    requiredCompletionOrder: true,
    estimatedDuration: 150,
    industry: 'Childcare',
    tags: ['compliance', 'childcare', 'safety'],
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-02-05T16:00:00Z',
  },
];

// Mock path enrollments
const mockPathEnrollments: PathEnrollment[] = [
  {
    id: 'pe-1',
    pathId: 'path-1',
    staffId: 'staff-1',
    status: 'in_progress',
    progress: 66,
    courseProgress: [
      { courseId: 'course-1', status: 'completed', progress: 100 },
      { courseId: 'course-2', status: 'completed', progress: 100 },
      { courseId: 'course-3', status: 'not_started', progress: 0 },
    ],
    assignedBy: 'admin',
    assignedAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-03-15',
    startedAt: '2024-01-16T09:00:00Z',
  },
  {
    id: 'pe-2',
    pathId: 'path-1',
    staffId: 'staff-2',
    status: 'completed',
    progress: 100,
    courseProgress: [
      { courseId: 'course-1', status: 'completed', progress: 100 },
      { courseId: 'course-2', status: 'completed', progress: 100 },
      { courseId: 'course-3', status: 'completed', progress: 100 },
    ],
    assignedBy: 'admin',
    assignedAt: '2024-01-10T10:00:00Z',
    dueDate: '2024-02-28',
    startedAt: '2024-01-11T09:00:00Z',
    completedAt: '2024-02-20T14:30:00Z',
  },
  {
    id: 'pe-3',
    pathId: 'path-1',
    staffId: 'staff-3',
    status: 'not_started',
    progress: 0,
    courseProgress: [
      { courseId: 'course-1', status: 'not_started', progress: 0 },
      { courseId: 'course-2', status: 'not_started', progress: 0 },
      { courseId: 'course-3', status: 'not_started', progress: 0 },
    ],
    assignedBy: 'admin',
    assignedAt: '2024-02-01T10:00:00Z',
    dueDate: '2024-02-10',
  },
];

export function LearningPathsPanel() {
  const [paths, setPaths] = useState<LearningPath[]>(mockLearningPaths);
  const [enrollments, setEnrollments] = useState<PathEnrollment[]>(mockPathEnrollments);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | undefined>();
  const [assigningPath, setAssigningPath] = useState<LearningPath | null>(null);
  const [viewingProgressPath, setViewingProgressPath] = useState<LearningPath | null>(null);

  const filteredPaths = paths.filter(path =>
    path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCourseById = (id: string): Course | undefined => {
    return mockCourses.find(c => c.id === id);
  };

  const handleSavePath = (path: LearningPath) => {
    setPaths(prev => {
      const exists = prev.find(p => p.id === path.id);
      if (exists) {
        return prev.map(p => p.id === path.id ? path : p);
      }
      return [...prev, path];
    });
  };

  const handleDeletePath = (pathId: string) => {
    setPaths(prev => prev.filter(p => p.id !== pathId));
    toast.success('Learning path deleted');
  };

  const handleDuplicatePath = (path: LearningPath) => {
    const newPath: LearningPath = {
      ...path,
      id: `path-${Date.now()}`,
      name: `${path.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPaths(prev => [...prev, newPath]);
    toast.success('Learning path duplicated');
  };

  const handleEditPath = (path: LearningPath) => {
    setEditingPath(path);
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingPath(undefined);
  };

  const handleAssignPath = (pathId: string, staffIds: string[], dueDate?: Date) => {
    const path = paths.find(p => p.id === pathId);
    if (!path) return;

    const newEnrollments: PathEnrollment[] = staffIds.map(staffId => ({
      id: `pe-${Date.now()}-${staffId}`,
      pathId,
      staffId,
      status: 'not_started' as const,
      progress: 0,
      courseProgress: path.courseIds.map(courseId => ({
        courseId,
        status: 'not_started' as const,
        progress: 0,
      })),
      assignedBy: 'current-user',
      assignedAt: new Date().toISOString(),
      dueDate: dueDate?.toISOString().split('T')[0],
    }));

    setEnrollments(prev => [...prev, ...newEnrollments]);
  };

  const getPathStats = (pathId: string) => {
    const pathEnrollments = enrollments.filter(e => e.pathId === pathId);
    return {
      enrolled: pathEnrollments.length,
      completed: pathEnrollments.filter(e => e.status === 'completed').length,
      inProgress: pathEnrollments.filter(e => e.status === 'in_progress').length,
    };
  };

  const getExistingAssignments = (pathId: string) => {
    return enrollments.filter(e => e.pathId === pathId).map(e => e.staffId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Route className="h-5 w-5 text-primary" />
            </div>
            Learning Paths
          </h3>
          <p className="text-sm text-muted-foreground">
            Create structured training journeys for onboarding and development
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Path
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search paths..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 border-border/60"
        />
      </div>

      {/* Stats Overview - Clean Minimalist Design */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Paths</p>
                <p className="text-3xl font-semibold tracking-tight">{paths.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Enrollments</p>
                <p className="text-3xl font-semibold tracking-tight">{enrollments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completions</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {enrollments.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paths Grid - Refined Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPaths.length === 0 ? (
          <div className="col-span-2">
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <Route className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No learning paths found</p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  {searchQuery ? 'Try a different search term' : 'Create your first learning path to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowBuilder(true)} className="mt-5 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Path
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPaths.map(path => {
            const stats = getPathStats(path.id);
            const completionRate = stats.enrolled > 0 
              ? Math.round((stats.completed / stats.enrolled) * 100) 
              : 0;

            return (
              <Card key={path.id} className="group border-0 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Route className="h-4 w-4 text-primary" />
                        </div>
                        <span className="truncate">{path.name}</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-2">
                        {path.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPath(path)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Path
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingProgressPath(path)}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicatePath(path)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeletePath(path.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {path.courseIds.length} courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(path.estimatedDuration)}
                    </span>
                    {path.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {path.industry}
                      </span>
                    )}
                  </div>

                  {/* Course Preview */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {path.courseIds.slice(0, 3).map((courseId, idx) => {
                      const course = getCourseById(courseId);
                      return (
                        <React.Fragment key={courseId}>
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                              {idx + 1}
                            </div>
                            <span className="text-xs truncate max-w-20">
                              {course?.title || 'Unknown'}
                            </span>
                          </div>
                          {idx < Math.min(path.courseIds.length - 1, 2) && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                    {path.courseIds.length > 3 && (
                      <Badge variant="outline" className="text-xs ml-1">
                        +{path.courseIds.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stats.enrolled} enrolled</span>
                      <span>{stats.completed} completed</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {path.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {path.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {path.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{path.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setViewingProgressPath(path)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Progress
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setAssigningPath(path)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Learning Path Builder */}
      <LearningPathBuilder
        open={showBuilder}
        onClose={handleCloseBuilder}
        existingPath={editingPath}
        onSave={handleSavePath}
      />

      {/* Assign Learning Path Drawer */}
      {assigningPath && (
        <AssignLearningPathDrawer
          open={!!assigningPath}
          onClose={() => setAssigningPath(null)}
          path={assigningPath}
          staff={mockStaff}
          existingAssignments={getExistingAssignments(assigningPath.id)}
          onAssign={handleAssignPath}
        />
      )}

      {/* Learning Path Progress Sheet */}
      {viewingProgressPath && (
        <LearningPathProgressSheet
          open={!!viewingProgressPath}
          onClose={() => setViewingProgressPath(null)}
          path={viewingProgressPath}
          enrollments={enrollments.filter(e => e.pathId === viewingProgressPath.id)}
          staff={mockStaff}
        />
      )}
    </div>
  );
}
