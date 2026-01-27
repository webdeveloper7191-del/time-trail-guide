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

interface PlanManagementPanelProps {
  staff: StaffMember[];
  onAssignPlan: (template: PerformancePlanTemplate) => void;
  onViewPlan: (plan: AssignedPlan) => void;
  onViewTemplate: (template: PerformancePlanTemplate) => void;
}

export function PlanManagementPanel({
  staff,
  onAssignPlan,
  onViewPlan,
  onViewTemplate,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Performance Plans
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage development plans for team members
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assigned' | 'templates')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Plans ({mockAssignedPlans.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Plan Templates ({performancePlanTemplates.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'assigned' ? 'Search by employee or plan...' : 'Search templates...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {activeTab === 'templates' && (
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[160px]">
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
                <SelectTrigger className="w-[180px]">
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
                  <SelectTrigger className="w-[140px]">
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
          </CardContent>
        </Card>

        {/* Assigned Plans Tab */}
        <TabsContent value="assigned" className="mt-4">
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Plans Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by assigning a plan template to a team member'}
                </p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPlans.map((plan) => {
                const staffMember = getStaffById(plan.staffId);
                const assignedBy = getStaffById(plan.assignedBy);
                
                return (
                  <Card 
                    key={plan.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onViewPlan(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={staffMember?.avatar} />
                          <AvatarFallback>
                            {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium">
                                {staffMember?.firstName} {staffMember?.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {plan.templateName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={planTypeColors[plan.type]}>
                                {planTypeLabels[plan.type]}
                              </Badge>
                              <Badge className={planStatusColors[plan.status]}>
                                {planStatusLabels[plan.status]}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(plan.startDate), 'MMM d, yyyy')} - {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getDaysRemaining(plan.endDate)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {plan.goalIds.length} goals
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{plan.progress}%</span>
                              </div>
                              <Progress value={plan.progress} className="h-2" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
        <TabsContent value="templates" className="mt-4">
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="space-y-6 pr-4">
              {Object.entries(templatesByIndustry).map(([industry, templates]) => (
                <div key={industry}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground">{industry}</h3>
                    <Badge variant="secondary" className="ml-auto">{templates.length}</Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-1">{template.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {template.description}
                              </p>
                            </div>
                            <Badge className={planTypeColors[template.type]} variant="secondary">
                              {planTypeLabels[template.type].replace(' Plan', '').replace(' (PIP)', '')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {template.durationDays} days
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {template.goals.length} goals
                            </div>
                            <div className="flex items-center gap-1">
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              {template.reviews.length} reviews
                            </div>
                            <div className="flex items-center gap-1">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignPlan(template);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
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
