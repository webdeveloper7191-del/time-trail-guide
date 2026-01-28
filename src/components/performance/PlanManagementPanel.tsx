import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Target,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  ChevronRight,
  Building2,
  Clock,
  Users,
  Sparkles,
  Edit,
  Copy,
  MoreVertical,
  BookOpen,
  GraduationCap,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  PerformancePlanTemplate, 
  AssignedPlan, 
  planTypeLabels, 
  planStatusLabels,
  planStatusColors,
  planTypeColors,
  planIndustries,
  PlanType,
  PlanStatus,
} from '@/types/performancePlan';
import { performancePlanTemplates, mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import { StaffMember } from '@/types/staff';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { calculatePlanProgress, LMSData } from '@/lib/planProgressCalculator';
import { mockCourses, mockLearningPaths, mockEnrollments } from '@/data/mockLmsData';

interface PlanManagementPanelProps {
  staff: StaffMember[];
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  onAssignPlan: (template: PerformancePlanTemplate) => void;
  onBulkAssignPlan: (template: PerformancePlanTemplate) => void;
  onViewPlan: (plan: AssignedPlan) => void;
  onViewTemplate: (template: PerformancePlanTemplate) => void;
  onCreateTemplate: () => void;
  onEditTemplate: (template: PerformancePlanTemplate) => void;
  onDuplicateTemplate: (template: PerformancePlanTemplate) => void;
  onQuickAssignPlan: () => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export function PlanManagementPanel({
  staff,
  goals,
  reviews,
  conversations,
  onAssignPlan,
  onBulkAssignPlan,
  onViewPlan,
  onViewTemplate,
  onCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onQuickAssignPlan,
  onDeleteTemplate,
}: PlanManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'assigned' | 'templates'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter assigned plans
  const filteredPlans = useMemo(() => {
    return mockAssignedPlans.filter((plan) => {
      const staffMember = staff.find(s => s.id === plan.staffId);
      const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : '';
      const matchesSearch = 
        plan.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || plan.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter, staff]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return performancePlanTemplates.filter((template) => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || template.industry === industryFilter;
      const matchesType = typeFilter === 'all' || template.type === typeFilter;
      return matchesSearch && matchesIndustry && matchesType;
    });
  }, [searchTerm, industryFilter, typeFilter]);

  // Group templates by industry
  const templatesByIndustry = useMemo(() => {
    const grouped: Record<string, PerformancePlanTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      const industry = template.industry || 'General';
      if (!grouped[industry]) {
        grouped[industry] = [];
      }
      grouped[industry].push(template);
    });
    return grouped;
  }, [filteredTemplates]);

  const getStaffById = (id: string) => staff.find(s => s.id === id);

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `${days} days left`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Performance Plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage development plans for team members
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assigned' | 'templates')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="border-b border-border/60 flex-1">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="assigned" 
                className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                Assigned Plans
                <Badge variant="secondary" className="ml-2 text-xs">{mockAssignedPlans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Plan Templates
                <Badge variant="secondary" className="ml-2 text-xs">{performancePlanTemplates.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Filters - Clean Design */}
        <div className="flex items-center gap-3 flex-wrap mt-6">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'assigned' ? 'Search by employee or plan...' : 'Search templates...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border/60"
            />
          </div>
          
          {activeTab === 'templates' && (
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-40 border-border/60">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {planIndustries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 border-border/60">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Plan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(planTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeTab === 'assigned' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 border-border/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(planStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeTab === 'assigned' && (
            <Button onClick={onQuickAssignPlan} className="gap-2 shadow-sm ml-auto">
              <UserPlus className="h-4 w-4" />
              Assign Plan
            </Button>
          )}

          {activeTab === 'templates' && (
            <Button onClick={onCreateTemplate} className="gap-2 shadow-sm ml-auto">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          )}
        </div>

        {/* Assigned Plans Tab */}
        <TabsContent value="assigned" className="mt-6">
          {filteredPlans.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Plans Found</h3>
                <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters to find what you\'re looking for'
                    : 'Start by assigning a plan template to a team member'}
                </p>
                <Button onClick={() => setActiveTab('templates')} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPlans.map((plan) => {
                const staffMember = getStaffById(plan.staffId);
                
                return (
                  <Card 
                    key={plan.id} 
                    className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => onViewPlan(plan)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          <AvatarImage src={staffMember?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {staffMember?.firstName} {staffMember?.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {plan.templateName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={planTypeColors[plan.type]} variant="secondary">
                                {planTypeLabels[plan.type].replace(' Plan', '')}
                              </Badge>
                              <Badge className={planStatusColors[plan.status]}>
                                {planStatusLabels[plan.status]}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(plan.startDate), 'MMM d')} - {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {getDaysRemaining(plan.endDate)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="h-4 w-4" />
                              {plan.goalIds.length} goals
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex-1">
                              {(() => {
                                const lmsData: LMSData = {
                                  enrollments: mockEnrollments,
                                  learningPaths: mockLearningPaths,
                                  courses: mockCourses,
                                };
                                const breakdown = calculatePlanProgress(plan, goals, reviews, conversations, lmsData);
                                const hasLearning = breakdown.totalCourses > 0;
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                      <span className="text-muted-foreground">
                                        Progress
                                        <span className="text-xs ml-2">
                                          ({breakdown.completedGoals}/{breakdown.totalGoals} goals
                                          {hasLearning && `, ${breakdown.completedCourses}/${breakdown.totalCourses} courses`})
                                        </span>
                                      </span>
                                      <span className="font-semibold">{breakdown.totalProgress}%</span>
                                    </div>
                                    <Progress value={breakdown.totalProgress} className="h-2" />
                                    {hasLearning && (
                                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                        <span>{plan.learningPathIds?.length || 0} learning paths linked</span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <ScrollArea className="h-[calc(100vh-360px)]">
            <div className="space-y-8 pr-4">
              {Object.entries(templatesByIndustry).map(([industry, templates]) => (
                <div key={industry}>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{industry}</h3>
                    <Badge variant="outline" className="ml-2 text-xs">{templates.length}</Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="group border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground line-clamp-1">{template.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
                                {template.description}
                              </p>
                            </div>
                            <Badge className={planTypeColors[template.type]} variant="secondary">
                              {planTypeLabels[template.type].replace(' Plan', '').replace(' (PIP)', '')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 py-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {template.durationDays} days
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5" />
                              {template.goals.length} goals
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              {template.reviews.length} reviews
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {template.conversations.length} 1:1s
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewTemplate(template);
                              }}
                            >
                              Preview
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (template.isSystem) {
                                  // For system templates, duplicate first then edit
                                  onDuplicateTemplate(template);
                                } else {
                                  onEditTemplate(template);
                                }
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {template.isSystem ? 'Customize' : 'Edit'}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignPlan(template);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="ml-auto">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onBulkAssignPlan(template);
                                }}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Bulk Assign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateTemplate(template);
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                {!template.isSystem && onDeleteTemplate && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTemplate(template.id);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Template
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
