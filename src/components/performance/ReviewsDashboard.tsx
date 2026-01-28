import React from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { 
  PerformanceReview, 
  reviewStatusLabels,
  reviewCycleLabels,
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';
import { 
  ClipboardCheck, 
  Calendar, 
  Star,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ReviewsDashboardProps {
  reviews: PerformanceReview[];
  staff: StaffMember[];
  currentUserId: string;
  onCreateReview: () => void;
  onViewReview: (review: PerformanceReview) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'grey.100', text: 'grey.600' },
  pending_self: { bg: 'warning.light', text: 'warning.dark' },
  pending_manager: { bg: 'info.light', text: 'info.dark' },
  completed: { bg: 'success.light', text: 'success.dark' },
  cancelled: { bg: 'grey.200', text: 'grey.500' },
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock size={14} />,
  pending_self: <AlertCircle size={14} />,
  pending_manager: <Clock size={14} />,
  completed: <CheckCircle2 size={14} />,
  cancelled: <Clock size={14} />,
};

export function ReviewsDashboard({ 
  reviews, 
  staff, 
  currentUserId,
  onCreateReview, 
  onViewReview 
}: ReviewsDashboardProps) {
  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const pendingSelfReviews = reviews.filter(r => 
    r.status === 'pending_self' && r.staffId === currentUserId
  );
  const pendingManagerReviews = reviews.filter(r => 
    r.status === 'pending_manager' && r.reviewerId === currentUserId
  );
  const upcomingReviews = reviews.filter(r => 
    r.status === 'draft' || r.status === 'pending_self'
  );
  const completedReviews = reviews.filter(r => r.status === 'completed');

  const actionRequired = [...pendingSelfReviews, ...pendingManagerReviews];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <ClipboardCheck size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>Performance Reviews</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manage appraisals and track performance cycles
          </Typography>
        </Box>
        <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={onCreateReview}>
          Start Review
        </MuiButton>
      </Stack>

      {/* Action Required Section */}
      {actionRequired.length > 0 && (
        <Card sx={{ bgcolor: 'warning.50', borderColor: 'warning.200' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box sx={{ p: 0.75, borderRadius: '50%', bgcolor: 'warning.light', display: 'flex' }}>
                <AlertCircle size={16} style={{ color: 'var(--warning)' }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={600} color="warning.dark">
                Action Required
              </Typography>
              <Chip label={actionRequired.length} size="small" color="warning" />
            </Stack>
            <Stack spacing={1.5}>
              {actionRequired.map((review) => {
                const staffMember = getStaffMember(review.staffId);
                const isOwnReview = review.staffId === currentUserId;
                
                return (
                  <Box
                    key={review.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 1 },
                    }}
                    onClick={() => onViewReview(review)}
                  >
                    <Avatar src={staffMember?.avatar} sx={{ width: 40, height: 40 }}>
                      {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={500}>
                        {isOwnReview ? 'Your Self-Review' : `${staffMember?.firstName} ${staffMember?.lastName}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reviewCycleLabels[review.reviewCycle]} Review • {format(parseISO(review.periodEnd), 'MMM yyyy')}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={statusIcons[review.status] as any}
                      label={isOwnReview ? 'Complete Self-Review' : 'Complete Review'}
                      sx={{ 
                        bgcolor: statusColors[review.status]?.bg,
                        color: statusColors[review.status]?.text,
                      }}
                    />
                    <ChevronRight size={20} style={{ color: 'var(--muted-foreground)' }} />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Card>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'warning.light', display: 'flex' }}>
                <Clock size={24} style={{ color: 'var(--warning)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{upcomingReviews.length}</Typography>
                <Typography variant="body2" color="text.secondary">Pending Reviews</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        
        <Card>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'success.light', display: 'flex' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{completedReviews.length}</Typography>
                <Typography variant="body2" color="text.secondary">Completed This Year</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        
        <Card>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex' }}>
                <Star size={24} style={{ color: 'var(--primary)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {completedReviews.length > 0 
                    ? (completedReviews.reduce((sum, r) => sum + (r.overallManagerRating || 0), 0) / completedReviews.length).toFixed(1)
                    : '-'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* All Reviews List */}
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
          All Reviews
        </Typography>
        
        {reviews.length === 0 ? (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ClipboardCheck size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <Typography color="text.secondary">No reviews yet</Typography>
              <MuiButton variant="outlined" sx={{ mt: 2 }} onClick={onCreateReview}>
                Start first review cycle
              </MuiButton>
            </Box>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {reviews.map((review) => {
              const staffMember = getStaffMember(review.staffId);
              const reviewer = getStaffMember(review.reviewerId);
              
              return (
                <Card 
                  key={review.id}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => onViewReview(review)}
                >
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={staffMember?.avatar} sx={{ width: 48, height: 48 }}>
                        {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                      </Avatar>
                      
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {staffMember?.firstName} {staffMember?.lastName}
                          </Typography>
                          <Chip
                            size="small"
                            icon={statusIcons[review.status] as any}
                            label={reviewStatusLabels[review.status]}
                            sx={{ 
                              bgcolor: statusColors[review.status]?.bg,
                              color: statusColors[review.status]?.text,
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {reviewCycleLabels[review.reviewCycle]} Review • 
                          {format(parseISO(review.periodStart), 'MMM d')} - {format(parseISO(review.periodEnd), 'MMM d, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reviewer: {reviewer?.firstName} {reviewer?.lastName}
                        </Typography>
                      </Box>

                      {review.status === 'completed' && review.overallManagerRating && (
                        <Box textAlign="center">
                          <Stack direction="row" alignItems="center" spacing={0.5} color="warning.main">
                            <Star size={20} fill="currentColor" />
                            <Typography variant="h6" fontWeight={700}>{review.overallManagerRating}</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">Final Rating</Typography>
                        </Box>
                      )}

                      <ChevronRight size={20} style={{ color: 'var(--muted-foreground)' }} />
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default ReviewsDashboard;
