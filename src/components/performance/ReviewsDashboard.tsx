import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
  Checkbox,
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
  Star,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { createReviewBulkActions } from './shared/BulkActionsBar';
import { InlineBulkActions } from './shared/InlineBulkActions';
import { toast } from 'sonner';

import { TextField, InputAdornment, FormControl, Select as MuiSelect, MenuItem } from '@mui/material';

interface ReviewsDashboardProps {
  reviews: PerformanceReview[];
  staff: StaffMember[];
  currentUserId: string;
  onCreateReview: () => void;
  onViewReview: (review: PerformanceReview) => void;
  onBulkSendReminders?: (reviewIds: string[]) => void;
  onBulkReassign?: (reviewIds: string[]) => void;
  onBulkCancel?: (reviewIds: string[]) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'rgba(107, 114, 128, 0.1)', text: 'rgb(75, 85, 99)' },
  pending_self: { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(161, 98, 7)' },
  pending_manager: { bg: 'rgba(59, 130, 246, 0.12)', text: 'rgb(29, 78, 216)' },
  completed: { bg: 'rgba(34, 197, 94, 0.12)', text: 'rgb(21, 128, 61)' },
  cancelled: { bg: 'rgba(107, 114, 128, 0.1)', text: 'rgb(107, 114, 128)' },
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
  onViewReview,
  onBulkSendReminders,
  onBulkReassign,
  onBulkCancel,
}: ReviewsDashboardProps) {
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('all');

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter(r => {
    const staffMember = getStaffMember(r.staffId);
    const matchesSearch = !searchQuery || 
      `${staffMember?.firstName} ${staffMember?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCycle = cycleFilter === 'all' || r.reviewCycle === cycleFilter;
    return matchesSearch && matchesStatus && matchesCycle;
  });

  const pendingSelfReviews = filteredReviews.filter(r => 
    r.status === 'pending_self' && r.staffId === currentUserId
  );
  const pendingManagerReviews = filteredReviews.filter(r => 
    r.status === 'pending_manager' && r.reviewerId === currentUserId
  );
  const upcomingReviews = filteredReviews.filter(r => 
    r.status === 'draft' || r.status === 'pending_self'
  );
  const completedReviews = filteredReviews.filter(r => r.status === 'completed');
  const selectableReviews = filteredReviews.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

  const actionRequired = [...pendingSelfReviews, ...pendingManagerReviews];
  
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || cycleFilter !== 'all';
  
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCycleFilter('all');
  };

  // Bulk selection handlers
  const handleToggleSelect = (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReviewIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedReviewIds(new Set(selectableReviews.map(r => r.id)));
  };

  const handleClearSelection = () => {
    setSelectedReviewIds(new Set());
  };

  const handleBulkSendReminders = () => {
    if (onBulkSendReminders) {
      onBulkSendReminders(Array.from(selectedReviewIds));
    }
    toast.success(`Reminders sent for ${selectedReviewIds.size} reviews`);
    handleClearSelection();
  };

  const handleBulkReassign = () => {
    if (onBulkReassign) {
      onBulkReassign(Array.from(selectedReviewIds));
    }
    toast.info('Reassignment would open a drawer to select new reviewers');
    handleClearSelection();
  };

  const handleBulkCancel = () => {
    if (onBulkCancel) {
      onBulkCancel(Array.from(selectedReviewIds));
    }
    toast.success(`${selectedReviewIds.size} reviews cancelled`);
    handleClearSelection();
  };

  const bulkActions = createReviewBulkActions(
    handleBulkSendReminders,
    handleBulkReassign,
    handleBulkCancel
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={{ xs: 2, sm: 0 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <ClipboardCheck size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Performance Reviews
            </Typography>
          </Stack>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Manage appraisals and track performance cycles
          </Typography>
        </Box>
        <MuiButton 
          variant="contained" 
          size="small"
          startIcon={<Plus size={16} />} 
          onClick={onCreateReview}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
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
              <Chip label={actionRequired.length} size="small" sx={{ bgcolor: 'rgba(251, 191, 36, 0.15)', color: 'rgb(161, 98, 7)' }} />
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
        <Card>
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 2 }}>
              <Box sx={{ 
                p: { xs: 0.75, md: 1.5 }, 
                borderRadius: '50%', 
                bgcolor: 'warning.light', 
                display: 'flex' 
              }}>
                <Clock size={20} style={{ color: 'var(--warning)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                  {upcomingReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                  Pending
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        
        <Card>
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 2 }}>
              <Box sx={{ 
                p: { xs: 0.75, md: 1.5 }, 
                borderRadius: '50%', 
                bgcolor: 'success.light', 
                display: 'flex' 
              }}>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                  {completedReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                  Completed
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        
        <Card sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 2 }}>
              <Box sx={{ 
                p: { xs: 0.75, md: 1.5 }, 
                borderRadius: '50%', 
                bgcolor: 'primary.light', 
                display: 'flex' 
              }}>
                <Star size={20} style={{ color: 'var(--primary)' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                  {completedReviews.length > 0 
                    ? (completedReviews.reduce((sum, r) => sum + (r.overallManagerRating || 0), 0) / completedReviews.length).toFixed(1)
                    : '-'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                  Avg Rating
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Filters & Search Row */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={{ xs: 1.5, md: 2 }} 
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ flex: 1 }}
        >
          <TextField
            placeholder="Search reviews..."
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />
          
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <MuiSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.entries(reviewStatusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <MuiSelect
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
              >
                <MenuItem value="all">All Cycles</MenuItem>
                {Object.entries(reviewCycleLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            {hasActiveFilters && (
              <MuiButton 
                variant="text"
                size="small" 
                startIcon={<X size={16} />}
                onClick={clearFilters}
                sx={{ color: 'text.secondary' }}
              >
                Clear
              </MuiButton>
            )}
          </Stack>
        </Stack>

        {/* Inline Bulk Actions */}
        <InlineBulkActions
          selectedCount={selectedReviewIds.size}
          totalCount={selectableReviews.length}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAll}
          actions={bulkActions}
          entityName="reviews"
        />
      </Stack>

      {/* All Reviews List */}
      <Box>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={1}
          mb={2}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              All Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
              {filteredReviews.length} reviews
            </Typography>
          </Stack>
          {selectableReviews.length > 0 && (
            <MuiButton
              size="small"
              variant="text"
              onClick={selectedReviewIds.size === selectableReviews.length ? handleClearSelection : handleSelectAll}
              sx={{ fontSize: '0.75rem', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {selectedReviewIds.size === selectableReviews.length ? 'Deselect All' : 'Select All'}
            </MuiButton>
          )}
        </Stack>
        
        {filteredReviews.length === 0 ? (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ClipboardCheck size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <Typography color="text.secondary">
                {hasActiveFilters ? 'No reviews match your filters' : 'No reviews yet'}
              </Typography>
              {!hasActiveFilters && (
                <MuiButton variant="outlined" sx={{ mt: 2 }} onClick={onCreateReview}>
                  Start first review cycle
                </MuiButton>
              )}
            </Box>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {filteredReviews.map((review) => {
              const staffMember = getStaffMember(review.staffId);
              const reviewer = getStaffMember(review.reviewerId);
              const isSelected = selectedReviewIds.has(review.id);
              const isSelectable = review.status !== 'completed' && review.status !== 'cancelled';
              
              return (
                <Card 
                  key={review.id}
                  sx={{ 
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => onViewReview(review)}
                >
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }}>
                      {isSelectable && (
                        <Checkbox
                          checked={isSelected}
                          onClick={(e) => handleToggleSelect(review.id, e)}
                          size="small"
                          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                        />
                      )}
                      <Avatar src={staffMember?.avatar} sx={{ width: { xs: 36, md: 48 }, height: { xs: 36, md: 48 } }}>
                        {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                      </Avatar>
                      
                      <Box flex={1} minWidth={0}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 0.5, sm: 1 }} mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }} noWrap>
                            {staffMember?.firstName} {staffMember?.lastName}
                          </Typography>
                          <Chip
                            size="small"
                            icon={statusIcons[review.status] as any}
                            label={reviewStatusLabels[review.status]}
                            sx={{ 
                              bgcolor: statusColors[review.status]?.bg,
                              color: statusColors[review.status]?.text,
                              fontSize: { xs: '0.6rem', md: '0.75rem' },
                              height: { xs: 20, md: 24 },
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }} noWrap>
                          {reviewCycleLabels[review.reviewCycle]} • 
                          {format(parseISO(review.periodStart), 'MMM d')} - {format(parseISO(review.periodEnd), 'MMM d, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                          Reviewer: {reviewer?.firstName} {reviewer?.lastName}
                        </Typography>
                      </Box>

                      {review.status === 'completed' && review.overallManagerRating && (
                        <Box textAlign="center" sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Stack direction="row" alignItems="center" spacing={0.5} color="warning.main">
                            <Star size={18} fill="currentColor" />
                            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>{review.overallManagerRating}</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Rating</Typography>
                        </Box>
                      )}

                      <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />
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
