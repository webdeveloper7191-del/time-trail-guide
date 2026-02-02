import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Chip,
  Avatar,
} from '@mui/material';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  PerformanceReview,
  ReviewStatus,
  ReviewCycle,
  reviewStatusLabels,
  reviewCycleLabels,
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';
import {
  ClipboardCheck,
  Calendar as CalendarIcon,
  User,
} from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';

interface EditReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  review: PerformanceReview | null;
  staff: StaffMember[];
  onSave: (reviewId: string, updates: Partial<PerformanceReview>) => void;
}

export function EditReviewDrawer({
  open,
  onClose,
  review,
  staff,
  onSave,
}: EditReviewDrawerProps) {
  const [reviewCycle, setReviewCycle] = useState<ReviewCycle>('annual');
  const [status, setStatus] = useState<ReviewStatus>('draft');
  const [periodStart, setPeriodStart] = useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>();
  const [reviewerId, setReviewerId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (review) {
      setReviewCycle(review.reviewCycle);
      setStatus(review.status);
      setPeriodStart(parseISO(review.periodStart));
      setPeriodEnd(parseISO(review.periodEnd));
      setReviewerId(review.reviewerId);
    }
  }, [review]);

  if (!review) return null;

  const staffMember = staff.find(s => s.id === review.staffId);
  const managers = staff.filter(s => s.status === 'active' && s.id !== review.staffId);

  const handleSave = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select review period dates');
      return;
    }

    setLoading(true);
    try {
      onSave(review.id, {
        reviewCycle,
        status,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        reviewerId,
      });
      toast.success('Review updated successfully');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrimaryOffCanvas
      title="Edit Review"
      description="Modify review details and assignment"
      icon={ClipboardCheck}
      size="md"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { 
          label: loading ? 'Saving...' : 'Save Changes', 
          onClick: handleSave, 
          variant: 'primary', 
          disabled: loading,
          loading,
        },
      ]}
    >
      <Stack spacing={4}>
        {/* Employee Info (Read-only) */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={staffMember?.avatar} sx={{ width: 48, height: 48 }}>
              {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {staffMember?.firstName} {staffMember?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {staffMember?.position}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Review Cycle */}
        <div className="space-y-2">
          <Label>Review Cycle</Label>
          <Select value={reviewCycle} onValueChange={(v) => setReviewCycle(v as ReviewCycle)}>
            <SelectTrigger>
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(reviewCycleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(reviewStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reviewer */}
        <div className="space-y-2">
          <Label>Reviewer</Label>
          <Select value={reviewerId} onValueChange={setReviewerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select reviewer" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                      {s.firstName[0]}{s.lastName[0]}
                    </Avatar>
                    {s.firstName} {s.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Review Period */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Period Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStart ? format(periodStart, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodStart}
                  onSelect={setPeriodStart}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Period End</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEnd ? format(periodEnd, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodEnd}
                  onSelect={setPeriodEnd}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Stack>
    </PrimaryOffCanvas>
  );
}

export default EditReviewDrawer;
