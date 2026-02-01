import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertTriangle,
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
import { SemanticProgressBar, getProgressStatus, StatusBadge } from './shared';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            Performance Plans
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Create and manage development plans for team members
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assigned' | 'templates')}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="border-b border-border/60 w-full md:flex-1 overflow-x-auto">
            <TabsList className="h-10 md:h-11 bg-transparent p-0 gap-1 whitespace-nowrap">
              <TabsTrigger 
                value="assigned" 
                className="px-3 md:px-4 py-2 md:py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-sm"
              >
                <Users className="h-4 w-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Assigned </span>Plans
                <Badge variant="secondary" className="ml-1.5 md:ml-2 text-xs">{mockAssignedPlans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="px-3 md:px-4 py-2 md:py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-sm"
              >
                <Sparkles className="h-4 w-4 mr-1.5 md:mr-2" />
                Templates
                <Badge variant="secondary" className="ml-1.5 md:ml-2 text-xs">{performancePlanTemplates.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Filters - Clean Design */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 md:mt-6">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'assigned' ? 'Search...' : 'Search templates...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border/60"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activeTab === 'templates' && (
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full sm:w-36 border-border/60">
                  <Building2 className="h-4 w-4 mr-1.5 shrink-0" />
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
              <SelectTrigger className="w-[calc(50%-4px)] sm:w-36 border-border/60">
                <Filter className="h-4 w-4 mr-1.5 shrink-0" />
                <SelectValue placeholder="Type" />
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
                <SelectTrigger className="w-[calc(50%-4px)] sm:w-32 border-border/60">
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
          </div>

          {activeTab === 'assigned' && (
            <Button onClick={onQuickAssignPlan} className="gap-2 shadow-sm w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
              <UserPlus className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Assign Plan</span>
              <span className="hidden sm:inline lg:hidden">Assign</span>
            </Button>
          )}

          {activeTab === 'templates' && (
            <Button onClick={onCreateTemplate} className="gap-2 shadow-sm w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
              <Plus className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Create Template</span>
              <span className="hidden sm:inline lg:hidden">Create</span>
            </Button>
          )}
        </div>

        {/* Assigned Plans Tab - Table Layout */}
        <TabsContent value="assigned" className="mt-4 md:mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assigned Plans
                </span>
                <span className="text-xs text-muted-foreground">
                  {filteredPlans.length} items
                </span>
              </div>
            </div>

            {filteredPlans.length === 0 ? (
              <div className="py-16 text-center">
                <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">No Plans Found</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by assigning a plan template to a team member'}
                </p>
                <Button onClick={() => setActiveTab('templates')} size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Browse Templates
                </Button>
              </div>
            ) : (
              <div>
                {filteredPlans.map((plan, index) => {
                  const staffMember = getStaffById(plan.staffId);
                  const isOverdueStatus = differenceInDays(parseISO(plan.endDate), new Date()) < 0;
                  const lmsData: LMSData = {
                    enrollments: mockEnrollments,
                    learningPaths: mockLearningPaths,
                    courses: mockCourses,
                  };
                  const breakdown = calculatePlanProgress(plan, goals, reviews, conversations, lmsData);
                  const daysRemaining = differenceInDays(parseISO(plan.endDate), new Date());
                  const progressStatus = getProgressStatus(breakdown.totalProgress, daysRemaining, isOverdueStatus);
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors",
                        "hover:bg-muted/40",
                        index < filteredPlans.length - 1 && "border-b border-border",
                        isOverdueStatus && "border-l-[3px] border-l-destructive"
                      )}
                      onClick={() => onViewPlan(plan)}
                    >
                      {/* Avatar */}
                      <Avatar className="h-9 w-9 border border-border shrink-0">
                        <AvatarImage src={staffMember?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Name & Plan */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {staffMember?.firstName} {staffMember?.lastName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate block">
                          {plan.templateName}
                        </span>
                      </div>

                      {/* Type & Status Badges */}
                      <div className="hidden md:flex items-center gap-1.5 shrink-0">
                        <Badge className={cn(planTypeColors[plan.type], "text-[10px] h-5")} variant="secondary">
                          {planTypeLabels[plan.type].replace(' Plan', '')}
                        </Badge>
                        <Badge className={cn(planStatusColors[plan.status], "text-[10px] h-5")}>
                          {planStatusLabels[plan.status]}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="hidden sm:block w-28 shrink-0">
                        <SemanticProgressBar
                          value={breakdown.totalProgress}
                          status={progressStatus}
                          showPercentage
                          size="xs"
                        />
                      </div>

                      {/* Due Date */}
                      <div className="hidden lg:flex items-center gap-1.5 w-24 shrink-0">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          "text-xs",
                          isOverdueStatus ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {/* Time Remaining */}
                      <div className="hidden xl:flex items-center gap-1.5 w-20 shrink-0">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          "text-xs",
                          isOverdueStatus ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                          {getDaysRemaining(plan.endDate)}
                        </span>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 md:mt-6">
          <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-360px)]">
            <div className="space-y-6 md:space-y-8 pr-2 md:pr-4">
              {Object.entries(templatesByIndustry).map(([industry, templates]) => (
                <div key={industry}>
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">{industry}</h3>
                    <Badge variant="outline" className="ml-1.5 md:ml-2 text-xs">{templates.length}</Badge>
                  </div>
                  
                  <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="group border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-3 md:p-5">
                          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground line-clamp-1 text-sm md:text-base">{template.name}</h4>
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1 md:mt-1.5">
                                {template.description}
                              </p>
                            </div>
                            <Badge className={`${planTypeColors[template.type]} text-xs shrink-0`} variant="secondary">
                              {planTypeLabels[template.type].replace(' Plan', '').replace(' (PIP)', '')}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground mt-3 md:mt-4 py-2 md:py-3 border-t border-border/50">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                              {template.durationDays}d
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 md:h-3.5 md:w-3.5" />
                              {template.goals.length}
                            </div>
                            <div className="flex items-center gap-1">
                              <ClipboardCheck className="h-3 w-3 md:h-3.5 md:w-3.5" />
                              {template.reviews.length}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 md:h-3.5 md:w-3.5" />
                              {template.conversations.length}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-3 md:mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-2 md:px-3 text-xs md:text-sm"
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
                              className="h-8 px-2 md:px-3 text-xs md:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (template.isSystem) {
                                  onDuplicateTemplate(template);
                                } else {
                                  onEditTemplate(template);
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              <span className="hidden sm:inline">{template.isSystem ? 'Customize' : 'Edit'}</span>
                            </Button>
                            <Button 
                              size="sm"
                              className="h-8 px-2 md:px-3 text-xs md:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignPlan(template);
                              }}
                            >
                              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
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
