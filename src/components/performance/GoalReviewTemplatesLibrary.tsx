import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Target,
  ClipboardCheck,
  Plus,
  Star,
  Clock,
  Tag,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { ReusableGoalTemplate, ReusableReviewTemplate, goalTemplateCategories } from '@/types/reusableTemplates';
import { reusableGoalTemplates, reusableReviewTemplates } from '@/data/mockReusableTemplates';
import { PlanGoalTemplate, PlanReviewTemplate, planIndustries } from '@/types/performancePlan';

interface GoalReviewTemplatesLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelectGoal?: (template: ReusableGoalTemplate) => void;
  onSelectReview?: (template: ReusableReviewTemplate) => void;
  mode?: 'browse' | 'select-goal' | 'select-review';
}

export function GoalReviewTemplatesLibrary({
  open,
  onClose,
  onSelectGoal,
  onSelectReview,
  mode = 'browse',
}: GoalReviewTemplatesLibraryProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>(
    mode === 'select-review' ? 'reviews' : 'goals'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const filteredGoals = useMemo(() => {
    return reusableGoalTemplates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesIndustry = industryFilter === 'all' || template.industry === industryFilter;
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      return matchesSearch && matchesIndustry && matchesCategory;
    });
  }, [searchTerm, industryFilter, categoryFilter]);

  const filteredReviews = useMemo(() => {
    return reusableReviewTemplates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesIndustry = industryFilter === 'all' || template.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [searchTerm, industryFilter]);

  const handleSelectGoal = (template: ReusableGoalTemplate) => {
    if (mode === 'select-goal' && onSelectGoal) {
      onSelectGoal(template);
      onClose();
    } else {
      setSelectedGoals((prev) => {
        const next = new Set(prev);
        if (next.has(template.id)) {
          next.delete(template.id);
        } else {
          next.add(template.id);
        }
        return next;
      });
    }
  };

  const handleSelectReview = (template: ReusableReviewTemplate) => {
    if (mode === 'select-review' && onSelectReview) {
      onSelectReview(template);
      onClose();
    } else {
      setSelectedReviews((prev) => {
        const next = new Set(prev);
        if (next.has(template.id)) {
          next.delete(template.id);
        } else {
          next.add(template.id);
        }
        return next;
      });
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {mode === 'select-goal' ? (
              <>
                <Target className="h-5 w-5" />
                Select Goal Template
              </>
            ) : mode === 'select-review' ? (
              <>
                <ClipboardCheck className="h-5 w-5" />
                Select Review Template
              </>
            ) : (
              <>
                <Target className="h-5 w-5" />
                Reusable Templates Library
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="flex items-center gap-2 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[140px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {planIndustries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTab === 'goals' && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {goalTemplateCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {mode === 'browse' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'goals' | 'reviews')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="goals">
                <Target className="h-4 w-4 mr-2" />
                Goal Templates ({reusableGoalTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Review Templates ({reusableReviewTemplates.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="goals" className="m-0 space-y-3">
                {filteredGoals.map((template) => (
                  <GoalTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedGoals.has(template.id)}
                    onSelect={() => handleSelectGoal(template)}
                    priorityColors={priorityColors}
                  />
                ))}
                {filteredGoals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No goal templates found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="m-0 space-y-3">
                {filteredReviews.map((template) => (
                  <ReviewTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedReviews.has(template.id)}
                    onSelect={() => handleSelectReview(template)}
                  />
                ))}
                {filteredReviews.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No review templates found</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        {mode === 'select-goal' && (
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-3 pb-4">
              {filteredGoals.map((template) => (
                <GoalTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={false}
                  onSelect={() => handleSelectGoal(template)}
                  priorityColors={priorityColors}
                  showSelectButton
                />
              ))}
              {filteredGoals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No goal templates found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {mode === 'select-review' && (
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-3 pb-4">
              {filteredReviews.map((template) => (
                <ReviewTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={false}
                  onSelect={() => handleSelectReview(template)}
                  showSelectButton
                />
              ))}
              {filteredReviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No review templates found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Goal Template Card Component
interface GoalTemplateCardProps {
  template: ReusableGoalTemplate;
  isSelected: boolean;
  onSelect: () => void;
  priorityColors: Record<string, string>;
  showSelectButton?: boolean;
}

function GoalTemplateCard({
  template,
  isSelected,
  onSelect,
  priorityColors,
  showSelectButton,
}: GoalTemplateCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium truncate">{template.name}</span>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {template.description}
            </p>
            <div className="flex items-center flex-wrap gap-2">
              <Badge variant="outline" className={priorityColors[template.priority]}>
                {template.priority}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {template.defaultDaysToComplete} days
              </Badge>
              <Badge variant="secondary">{template.category}</Badge>
              {template.industry && template.industry !== 'General' && (
                <Badge variant="outline">
                  <Building2 className="h-3 w-3 mr-1" />
                  {template.industry}
                </Badge>
              )}
            </div>
            {template.milestones.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {template.milestones.length} milestone{template.milestones.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          {showSelectButton && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <Plus className="h-4 w-4 mr-1" />
              Use
            </Button>
          )}
          {!showSelectButton && (
            <div className="text-right text-xs text-muted-foreground">
              <Star className="h-3 w-3 inline mr-1" />
              {template.usageCount} uses
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Review Template Card Component
interface ReviewTemplateCardProps {
  template: ReusableReviewTemplate;
  isSelected: boolean;
  onSelect: () => void;
  showSelectButton?: boolean;
}

function ReviewTemplateCard({
  template,
  isSelected,
  onSelect,
  showSelectButton,
}: ReviewTemplateCardProps) {
  const cycleLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium truncate">{template.name}</span>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {template.description}
            </p>
            <div className="flex items-center flex-wrap gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {cycleLabels[template.reviewCycle]}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Day {template.defaultDaysFromStart}
              </Badge>
              {template.industry && template.industry !== 'General' && (
                <Badge variant="outline">
                  <Building2 className="h-3 w-3 mr-1" />
                  {template.industry}
                </Badge>
              )}
            </div>
            {template.criteria.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {template.criteria.length} evaluation criteria
              </div>
            )}
          </div>
          {showSelectButton && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              <Plus className="h-4 w-4 mr-1" />
              Use
            </Button>
          )}
          {!showSelectButton && (
            <div className="text-right text-xs text-muted-foreground">
              <Star className="h-3 w-3 inline mr-1" />
              {template.usageCount} uses
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions to convert reusable templates to plan templates
export function convertGoalTemplateToPlanGoal(
  template: ReusableGoalTemplate,
  planStartOffset: number = 0
): PlanGoalTemplate {
  return {
    id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: template.name,
    description: template.description,
    category: template.category,
    priority: template.priority,
    targetDaysFromStart: planStartOffset + template.defaultDaysToComplete,
    milestones: template.milestones.map((ms) => ({
      title: ms.title,
      daysFromStart: planStartOffset + template.defaultDaysToComplete + ms.relativeDays,
    })),
  };
}

export function convertReviewTemplateToPlanReview(
  template: ReusableReviewTemplate,
  planStartOffset: number = 0
): PlanReviewTemplate {
  return {
    id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: template.name,
    reviewCycle: template.reviewCycle,
    daysFromStart: planStartOffset + template.defaultDaysFromStart,
    customCriteria: template.criteria,
  };
}
