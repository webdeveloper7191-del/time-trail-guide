import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  RefreshCw,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { GoalPriority, goalPriorityLabels } from '@/types/performance';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';

interface GoalRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: GoalPriority;
  source: 'role' | 'department' | 'cycle' | 'skill_gap' | 'trending';
  sourceLabel: string;
  relevanceScore: number;
  suggestedDuration: string;
  suggestedMilestones: string[];
  adopted?: boolean;
}

interface GoalSuggestionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: GoalRecommendation | null;
  onAdopt: (recommendation: GoalRecommendation) => void;
  isAdopted: boolean;
}

const sourceConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  role: { 
    icon: <Briefcase className="h-4 w-4" />, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50' 
  },
  department: { 
    icon: <Users className="h-4 w-4" />, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50' 
  },
  cycle: { 
    icon: <RefreshCw className="h-4 w-4" />, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50' 
  },
  skill_gap: { 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50' 
  },
  trending: { 
    icon: <Sparkles className="h-4 w-4" />, 
    color: 'text-pink-700', 
    bgColor: 'bg-pink-50' 
  },
};

const priorityConfig: Record<GoalPriority, { color: string; bgColor: string }> = {
  low: { color: 'text-slate-600', bgColor: 'bg-slate-100' },
  medium: { color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: { color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function GoalSuggestionDetailDrawer({
  open,
  onOpenChange,
  recommendation,
  onAdopt,
  isAdopted,
}: GoalSuggestionDetailDrawerProps) {
  if (!recommendation) return null;

  const sourceInfo = sourceConfig[recommendation.source];
  const priorityInfo = priorityConfig[recommendation.priority];

  const handleAdopt = () => {
    onAdopt(recommendation);
    onOpenChange(false);
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={() => onOpenChange(false)}
      title="Goal Suggestion"
      icon={Target}
      size="md"
      actions={[
        { label: 'Close', onClick: () => onOpenChange(false), variant: 'secondary' },
        { 
          label: isAdopted ? 'Already Adopted' : 'Adopt This Goal', 
          onClick: handleAdopt, 
          variant: 'primary',
          disabled: isAdopted,
        },
      ]}
    >
      <div className="space-y-6">
        {/* Header Info */}
        <FormSection title="Goal Overview">
          <div className="space-y-3">
            {/* Source & Priority Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="secondary" 
                className={`${sourceInfo.bgColor} ${sourceInfo.color} gap-1`}
              >
                {sourceInfo.icon}
                {recommendation.sourceLabel}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`${priorityInfo.bgColor} ${priorityInfo.color}`}
              >
                {goalPriorityLabels[recommendation.priority]} Priority
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground leading-snug">
              {recommendation.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.description}
            </p>
          </div>
        </FormSection>

        {/* Metrics */}
        <FormSection title="Metrics">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Relevance</span>
              </div>
              <p className="text-xl font-bold text-primary">
                {recommendation.relevanceScore}%
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-sm font-semibold">
                {recommendation.suggestedDuration}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Category</span>
              </div>
              <p className="text-sm font-semibold truncate">
                {recommendation.category}
              </p>
            </div>
          </div>
        </FormSection>

        {/* Suggested Milestones */}
        <FormSection title="Suggested Milestones" tooltip="Recommended milestones for this goal">
          <div className="space-y-2">
            {recommendation.suggestedMilestones.map((milestone, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground flex-1">{milestone}</p>
              </div>
            ))}
          </div>
        </FormSection>

        {/* Why This Goal */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100 mb-1">
                Why This Goal?
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                This goal was suggested based on your {recommendation.source === 'role' ? 'current role and responsibilities' : 
                  recommendation.source === 'department' ? 'department objectives and team goals' :
                  recommendation.source === 'cycle' ? 'previous performance review feedback' :
                  recommendation.source === 'skill_gap' ? 'identified skill gaps and growth areas' :
                  'trending organizational priorities'
                }. It has a {recommendation.relevanceScore}% relevance score, indicating strong alignment with your professional development path.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

export default GoalSuggestionDetailDrawer;
