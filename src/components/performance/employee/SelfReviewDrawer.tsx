import React, { useEffect, useState } from 'react';
import { PrimaryOffCanvas, FormSection } from '@/components/ui/off-canvas';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PerformanceReview,
  ReviewRating,
  reviewCycleLabels,
} from '@/types/performance';
import { performanceSelfService } from '@/lib/performanceSelfServiceStore';
import { usePerformanceConfig } from '@/hooks/usePerformanceConfig';

interface SelfReviewDrawerProps {
  review: PerformanceReview | null;
  open: boolean;
  onClose: () => void;
}

export function SelfReviewDrawer({ review, open, onClose }: SelfReviewDrawerProps) {
  const performanceConfig = usePerformanceConfig();
  const scale = performanceConfig.ratingScales.find(item => item.isDefault && item.isActive && item.appliesTo !== 'goals') ?? performanceConfig.ratingScales.find(item => item.isActive);
  const criteria = review?.customCriteria?.length ? review.customCriteria : performanceConfig.competencies.filter(item => item.isActive);
  const points = scale?.points ?? [1, 2, 3, 4, 5].map(value => ({ value, label: `Rating ${value}`, description: '' }));
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState('');
  const [aspirations, setAspirations] = useState('');

  useEffect(() => {
    if (review && open) {
      const r: Record<string, number> = {};
      const c: Record<string, string> = {};
      review.ratings.forEach(existing => {
        if (existing.selfRating) r[existing.criteriaId] = existing.selfRating;
        if (existing.selfComments) c[existing.criteriaId] = existing.selfComments;
      });
      setRatings(r);
      setComments(c);
      setSummary(review.selfSummary ?? '');
      setAspirations(review.careerAspirations ?? '');
    }
  }, [review, open]);

  if (!review) return null;

  const unrated = criteria.filter(c => !ratings[c.id]);
  const canSubmit = unrated.length === 0 && summary.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(
        unrated.length > 0
          ? `Rate all criteria — ${unrated.length} remaining`
          : 'Add an overall summary before submitting',
      );
      return;
    }
    const payload: ReviewRating[] = criteria.map(criteria => {
      const existing = review.ratings.find(r => r.criteriaId === criteria.id);
      return {
        ...existing,
        criteriaId: criteria.id,
        selfRating: ratings[criteria.id],
        selfComments: comments[criteria.id]?.trim() || undefined,
      };
    });
    performanceSelfService.submitSelfReview(review.id, {
      ratings: payload,
      summary: summary.trim(),
      careerAspirations: aspirations.trim() || undefined,
    });
    toast.success('Self-review submitted — sent to your manager');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title="Complete your self-review"
      description={`${reviewCycleLabels[review.reviewCycle]} · ${format(parseISO(review.periodStart), 'MMM yyyy')} – ${format(parseISO(review.periodEnd), 'MMM yyyy')}`}
      icon={ClipboardCheck}
      size="2xl"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Submit to manager', onClick: handleSubmit, variant: 'primary', disabled: !canSubmit },
      ]}
    >
      <div className="space-y-6">
        <FormSection
          title="Rate yourself"
          tooltip={`${points[0]?.label} to ${points[points.length - 1]?.label}. Every criterion must be rated before you can submit.`}
        >
          <div className="space-y-5">
            {criteria.map(criteria => (
              <div key={criteria.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{criteria.name}</p>
                    <p className="text-xs text-muted-foreground">{criteria.description}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {criteria.weight}%
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {points.map(point => (
                    <Button
                      key={point.value}
                      type="button"
                      size="sm"
                      variant={ratings[criteria.id] === point.value ? 'default' : 'outline'}
                      className={cn('h-8 w-9 p-0', ratings[criteria.id] === point.value && 'font-semibold')}
                      onClick={() => setRatings(prev => ({ ...prev, [criteria.id]: point.value }))}
                    >
                      {point.value}
                    </Button>
                  ))}
                  {ratings[criteria.id] && (
                    <span className="text-xs text-muted-foreground">
                      {points.find(point => point.value === ratings[criteria.id])?.label}
                    </span>
                  )}
                </div>

                <Textarea
                  value={comments[criteria.id] ?? ''}
                  onChange={e => setComments(prev => ({ ...prev, [criteria.id]: e.target.value }))}
                  placeholder="Add an example that supports your rating (optional)"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="Overall summary" tooltip="Required. Your reflection on the review period.">
          <Textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="What went well, what was challenging, and what you are most proud of."
            rows={5}
          />
        </FormSection>

        <FormSection title="Career aspirations" tooltip="Optional. Where you would like to grow next.">
          <Textarea
            value={aspirations}
            onChange={e => setAspirations(e.target.value)}
            placeholder="Roles, skills or responsibilities you want to work towards."
            rows={4}
          />
        </FormSection>

        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <Star className="h-4 w-4 shrink-0" />
          Once submitted, your review moves to your manager and your ratings become read-only.
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
