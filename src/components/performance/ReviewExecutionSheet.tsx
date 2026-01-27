import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Rating,
  Divider,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PerformanceReview,
  ReviewRating,
  ReviewCriteria,
  defaultReviewCriteria,
  reviewStatusLabels,
  reviewCycleLabels,
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';
import {
  X,
  ClipboardCheck,
  User,
  Calendar,
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewExecutionSheetProps {
  open: boolean;
  review: PerformanceReview | null;
  staff: StaffMember[];
  currentUserId: string;
  onClose: () => void;
  onSubmitSelfReview: (id: string, ratings: ReviewRating[], summary: string) => Promise<void>;
  onCompleteManagerReview: (
    id: string,
    ratings: ReviewRating[],
    summary: string,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan: string
  ) => Promise<void>;
}

const ratingLabels = ['Poor', 'Below Expectations', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'];

export function ReviewExecutionSheet({
  open,
  review,
  staff,
  currentUserId,
  onClose,
  onSubmitSelfReview,
  onCompleteManagerReview,
}: ReviewExecutionSheetProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [ratings, setRatings] = useState<Record<string, { rating: number; comments: string }>>({});
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState<string[]>(['', '', '']);
  const [areasForImprovement, setAreasForImprovement] = useState<string[]>(['', '', '']);
  const [developmentPlan, setDevelopmentPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const staffMember = useMemo(
    () => staff.find((s) => s.id === review?.staffId),
    [staff, review?.staffId]
  );

  const reviewer = useMemo(
    () => staff.find((s) => s.id === review?.reviewerId),
    [staff, review?.reviewerId]
  );

  if (!review) return null;

  const isSelfReview = review.staffId === currentUserId && review.status === 'pending_self';
  const isManagerReview = review.reviewerId === currentUserId && review.status === 'pending_manager';
  const isViewOnly = !isSelfReview && !isManagerReview;

  const criteria = defaultReviewCriteria;
  const steps = isSelfReview
    ? ['Rate Yourself', 'Summary', 'Submit']
    : isManagerReview
    ? ['Rate Performance', 'Strengths & Areas', 'Development Plan', 'Submit']
    : ['View Ratings', 'Summary'];

  const handleRatingChange = (criteriaId: string, value: number | null) => {
    setRatings((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], rating: value || 0 },
    }));
  };

  const handleCommentsChange = (criteriaId: string, comments: string) => {
    setRatings((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], comments },
    }));
  };

  const calculateOverallScore = () => {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = criteria.reduce((sum, c) => {
      const rating = ratings[c.id]?.rating || 0;
      return sum + rating * c.weight;
    }, 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '0';
  };

  const handleSubmitSelfReview = async () => {
    setLoading(true);
    try {
      const reviewRatings: ReviewRating[] = criteria.map((c) => ({
        criteriaId: c.id,
        selfRating: ratings[c.id]?.rating || 0,
        selfComments: ratings[c.id]?.comments || '',
      }));
      await onSubmitSelfReview(review.id, reviewRatings, summary);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManagerReview = async () => {
    setLoading(true);
    try {
      const reviewRatings: ReviewRating[] = criteria.map((c) => ({
        criteriaId: c.id,
        managerRating: ratings[c.id]?.rating || 0,
        managerComments: ratings[c.id]?.comments || '',
      }));
      await onCompleteManagerReview(
        review.id,
        reviewRatings,
        summary,
        strengths.filter((s) => s.trim()),
        areasForImprovement.filter((a) => a.trim()),
        developmentPlan
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderRatingsForm = () => (
    <Stack spacing={3}>
      {criteria.map((criterion) => (
        <Box key={criterion.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {criterion.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {criterion.description}
              </Typography>
              <Chip label={`${criterion.weight}% weight`} size="small" sx={{ mt: 1 }} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Rating
                value={ratings[criterion.id]?.rating || 0}
                onChange={(_, value) => handleRatingChange(criterion.id, value)}
                size="large"
                disabled={isViewOnly}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                {ratings[criterion.id]?.rating
                  ? ratingLabels[ratings[criterion.id].rating - 1]
                  : 'Not rated'}
              </Typography>
            </Box>
          </Stack>
          <TextField
            placeholder="Add comments for this criteria..."
            value={ratings[criterion.id]?.comments || ''}
            onChange={(e) => handleCommentsChange(criterion.id, e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
            sx={{ mt: 2 }}
            disabled={isViewOnly}
          />
        </Box>
      ))}

      <Alert severity="info">
        <AlertTitle>Overall Score: {calculateOverallScore()} / 5</AlertTitle>
        Based on weighted average of all criteria ratings
      </Alert>
    </Stack>
  );

  const renderSummaryForm = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          {isSelfReview ? 'Self-Assessment Summary' : 'Manager Assessment Summary'}
        </Typography>
        <Textarea
          placeholder={
            isSelfReview
              ? 'Summarize your performance during this review period...'
              : 'Summarize the employee\'s performance during this review period...'
          }
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="min-h-[150px]"
          disabled={isViewOnly}
        />
      </Box>
    </Stack>
  );

  const renderStrengthsForm = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Key Strengths
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          List the employee's top strengths demonstrated during this period
        </Typography>
        <Stack spacing={1.5}>
          {strengths.map((strength, index) => (
            <TextField
              key={index}
              placeholder={`Strength ${index + 1}`}
              value={strength}
              onChange={(e) => {
                const newStrengths = [...strengths];
                newStrengths[index] = e.target.value;
                setStrengths(newStrengths);
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />,
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Areas for Improvement
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Identify areas where the employee can grow and develop
        </Typography>
        <Stack spacing={1.5}>
          {areasForImprovement.map((area, index) => (
            <TextField
              key={index}
              placeholder={`Area ${index + 1}`}
              value={area}
              onChange={(e) => {
                const newAreas = [...areasForImprovement];
                newAreas[index] = e.target.value;
                setAreasForImprovement(newAreas);
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />,
              }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );

  const renderDevelopmentPlanForm = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Development Plan
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Outline specific actions, training, or goals for the next review period
        </Typography>
        <Textarea
          placeholder="Describe the development plan including specific goals, training opportunities, mentorship, and expected outcomes..."
          value={developmentPlan}
          onChange={(e) => setDevelopmentPlan(e.target.value)}
          className="min-h-[200px]"
        />
      </Box>

      {renderSummaryForm()}
    </Stack>
  );

  const renderSubmitStep = () => (
    <Stack spacing={3}>
      <Alert severity="success">
        <AlertTitle>Ready to Submit</AlertTitle>
        Please review your entries before submitting. This action cannot be undone.
      </Alert>

      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Summary
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Overall Score</Typography>
            <Typography variant="body2" fontWeight={600}>{calculateOverallScore()} / 5</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Criteria Rated</Typography>
            <Typography variant="body2" fontWeight={600}>
              {Object.keys(ratings).filter((k) => ratings[k]?.rating > 0).length} / {criteria.length}
            </Typography>
          </Stack>
          {isManagerReview && (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Strengths Listed</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {strengths.filter((s) => s.trim()).length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Areas for Improvement</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {areasForImprovement.filter((a) => a.trim()).length}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );

  const renderStepContent = () => {
    if (isSelfReview) {
      switch (activeStep) {
        case 0:
          return renderRatingsForm();
        case 1:
          return renderSummaryForm();
        case 2:
          return renderSubmitStep();
        default:
          return null;
      }
    } else if (isManagerReview) {
      switch (activeStep) {
        case 0:
          return renderRatingsForm();
        case 1:
          return renderStrengthsForm();
        case 2:
          return renderDevelopmentPlanForm();
        case 3:
          return renderSubmitStep();
        default:
          return null;
      }
    } else {
      return renderRatingsForm();
    }
  };

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[700px] sm:max-w-[700px] p-0">
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.100' }}>
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {isSelfReview
                      ? 'Self-Assessment'
                      : isManagerReview
                      ? 'Manager Review'
                      : 'Performance Review'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ width: 20, height: 20 }}>
                      <User className="h-3 w-3" />
                    </Avatar>
                    <Typography variant="body2">
                      {staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown'}
                    </Typography>
                    <Chip
                      label={reviewCycleLabels[review.reviewCycle]}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              </Stack>
              <IconButton size="small" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </Stack>
          </Box>

          {/* Stepper */}
          {!isViewOnly && (
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Period Info */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={3}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  Period: {format(parseISO(review.periodStart), 'MMM d, yyyy')} -{' '}
                  {format(parseISO(review.periodEnd), 'MMM d, yyyy')}
                </Typography>
              </Stack>
              <Chip label={reviewStatusLabels[review.status]} size="small" />
            </Stack>
          </Box>

          {/* Content */}
          <ScrollArea className="flex-1">
            <Box sx={{ p: 3 }}>{renderStepContent()}</Box>
          </ScrollArea>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between">
              <Button
                variant="outline"
                onClick={() => setActiveStep((prev) => prev - 1)}
                disabled={activeStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Stack direction="row" spacing={2}>
                <Button variant="outline" onClick={onClose}>
                  {isViewOnly ? 'Close' : 'Save Draft'}
                </Button>
                {!isViewOnly && (
                  isLastStep ? (
                    <Button
                      onClick={isSelfReview ? handleSubmitSelfReview : handleSubmitManagerReview}
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {loading ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  ) : (
                    <Button onClick={() => setActiveStep((prev) => prev + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )
                )}
              </Stack>
            </Stack>
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}
