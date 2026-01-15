import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Rating,
  TextField,
  Button,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
  Paper,
  Collapse,
} from '@mui/material';
import {
  Star,
  Building2,
  User,
  Clock,
  MessageSquare,
  Shield,
  UserCheck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/mui/Dialog';
import { submitRating, PlacementRating } from '@/lib/agencyRatingService';
import { setAgencyPreference } from '@/lib/centreAgencyPreferences';
import { toast } from 'sonner';

interface PostPlacementRatingModalProps {
  open: boolean;
  onClose: () => void;
  placement: {
    id: string;
    agencyId: string;
    agencyName: string;
    workerId: string;
    workerName: string;
    centreId: string;
    centreName: string;
    shiftDate: string;
    shiftTime?: string;
    role?: string;
  };
  onRatingSubmitted?: (rating: PlacementRating) => void;
}

const ratingLabels: { [key: number]: string } = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const categoryLabels = {
  responseTime: { label: 'Response Time', icon: Clock, description: 'How quickly did the agency respond?' },
  candidateQuality: { label: 'Candidate Quality', icon: UserCheck, description: 'How well did the worker perform?' },
  communication: { label: 'Communication', icon: MessageSquare, description: 'How was the agency communication?' },
  professionalism: { label: 'Professionalism', icon: User, description: 'Professional conduct and behavior' },
  compliance: { label: 'Compliance', icon: Shield, description: 'Documentation and compliance standards' },
};

export function PostPlacementRatingModal({
  open,
  onClose,
  placement,
  onRatingSubmitted,
}: PostPlacementRatingModalProps) {
  const [agencyRating, setAgencyRating] = useState<number | null>(null);
  const [workerRating, setWorkerRating] = useState<number | null>(null);
  const [agencyFeedback, setAgencyFeedback] = useState('');
  const [workerFeedback, setWorkerFeedback] = useState('');
  
  const [categories, setCategories] = useState({
    responseTime: 0,
    candidateQuality: 0,
    communication: 0,
    professionalism: 0,
    compliance: 0,
  });
  
  const [wouldHireAgain, setWouldHireAgain] = useState(true);
  const [wouldRequestWorker, setWouldRequestWorker] = useState(true);
  const [hadIssues, setHadIssues] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [showDetailedCategories, setShowDetailedCategories] = useState(false);
  const [updatePreference, setUpdatePreference] = useState(false);
  const [newPreferenceStatus, setNewPreferenceStatus] = useState<'preferred' | 'blacklisted' | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryChange = (category: keyof typeof categories, value: number | null) => {
    setCategories(prev => ({
      ...prev,
      [category]: value || 0,
    }));
  };

  const handleSubmit = async () => {
    if (!agencyRating || !workerRating) {
      toast.error('Please provide both agency and worker ratings');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate category averages if not filled
      const finalCategories = { ...categories };
      Object.keys(finalCategories).forEach(key => {
        const k = key as keyof typeof categories;
        if (finalCategories[k] === 0) {
          finalCategories[k] = agencyRating;
        }
      });

      const rating = submitRating({
        placementId: placement.id,
        agencyId: placement.agencyId,
        agencyName: placement.agencyName,
        workerId: placement.workerId,
        workerName: placement.workerName,
        centreId: placement.centreId,
        centreName: placement.centreName,
        shiftDate: placement.shiftDate,
        agencyRating,
        workerRating,
        agencyFeedback: agencyFeedback.trim() || undefined,
        workerFeedback: workerFeedback.trim() || undefined,
        categories: finalCategories,
        wouldHireAgain,
        wouldRequestWorker,
        hadIssues,
        issueDescription: hadIssues ? issueDescription.trim() : undefined,
        ratedBy: 'current-user@example.com',
      });

      // Update agency preference if requested
      if (updatePreference && newPreferenceStatus) {
        setAgencyPreference(
          placement.centreId,
          placement.agencyId,
          newPreferenceStatus,
          newPreferenceStatus === 'preferred' 
            ? `Marked preferred based on ${agencyRating}-star rating`
            : `Marked blacklisted due to issues: ${issueDescription}`,
          'current-user@example.com'
        );
        toast.success(`Agency marked as ${newPreferenceStatus}`);
      }

      toast.success('Rating submitted successfully');
      onRatingSubmitted?.(rating);
      handleClose();
    } catch (error) {
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setAgencyRating(null);
    setWorkerRating(null);
    setAgencyFeedback('');
    setWorkerFeedback('');
    setCategories({
      responseTime: 0,
      candidateQuality: 0,
      communication: 0,
      professionalism: 0,
      compliance: 0,
    });
    setWouldHireAgain(true);
    setWouldRequestWorker(true);
    setHadIssues(false);
    setIssueDescription('');
    setShowDetailedCategories(false);
    setUpdatePreference(false);
    setNewPreferenceStatus(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Star className="h-5 w-5 text-warning" />
          <Typography variant="h6">Rate Placement</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Placement Info */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                <Building2 size={24} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {placement.agencyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Worker: {placement.workerName}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary">
                  {placement.shiftDate}
                </Typography>
                {placement.shiftTime && (
                  <Typography variant="caption" color="text.secondary">
                    {placement.shiftTime}
                  </Typography>
                )}
                {placement.role && (
                  <Chip size="small" label={placement.role} sx={{ mt: 0.5 }} />
                )}
              </Box>
            </Stack>
          </Paper>

          <Divider />

          {/* Agency Rating */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Rate the Agency
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Rating
                value={agencyRating}
                onChange={(_, value) => setAgencyRating(value)}
                size="large"
                sx={{ fontSize: '2rem' }}
              />
              {agencyRating && (
                <Chip
                  label={ratingLabels[agencyRating]}
                  color={agencyRating >= 4 ? 'success' : agencyRating >= 3 ? 'warning' : 'error'}
                  size="small"
                />
              )}
            </Stack>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Share your experience with this agency (optional)"
              value={agencyFeedback}
              onChange={(e) => setAgencyFeedback(e.target.value)}
              sx={{ mt: 2 }}
              size="small"
            />
          </Box>

          <Divider />

          {/* Worker Rating */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Rate the Worker: {placement.workerName}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Rating
                value={workerRating}
                onChange={(_, value) => setWorkerRating(value)}
                size="large"
                sx={{ fontSize: '2rem' }}
              />
              {workerRating && (
                <Chip
                  label={ratingLabels[workerRating]}
                  color={workerRating >= 4 ? 'success' : workerRating >= 3 ? 'warning' : 'error'}
                  size="small"
                />
              )}
            </Stack>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="How did this worker perform? (optional)"
              value={workerFeedback}
              onChange={(e) => setWorkerFeedback(e.target.value)}
              sx={{ mt: 2 }}
              size="small"
            />
          </Box>

          {/* Detailed Categories (Collapsible) */}
          <Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowDetailedCategories(!showDetailedCategories)}
              endIcon={showDetailedCategories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            >
              {showDetailedCategories ? 'Hide' : 'Show'} Detailed Ratings
            </Button>
            
            <Collapse in={showDetailedCategories}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Stack spacing={2}>
                  {Object.entries(categoryLabels).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <Stack key={key} direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 160, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon size={16} className="text-muted-foreground" />
                          <Typography variant="body2">{config.label}</Typography>
                        </Box>
                        <Rating
                          value={categories[key as keyof typeof categories]}
                          onChange={(_, value) => handleCategoryChange(key as keyof typeof categories, value)}
                          size="small"
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Collapse>
          </Box>

          <Divider />

          {/* Quick Actions */}
          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={wouldHireAgain}
                  onChange={(e) => setWouldHireAgain(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ThumbsUp size={14} />
                  <span>Would hire agency again</span>
                </Stack>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={wouldRequestWorker}
                  onChange={(e) => setWouldRequestWorker(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <UserCheck size={14} />
                  <span>Would request this worker</span>
                </Stack>
              }
            />
          </Stack>

          {/* Issues Section */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hadIssues}
                  onChange={(e) => setHadIssues(e.target.checked)}
                  color="error"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AlertTriangle size={14} className="text-destructive" />
                  <span>Report an issue</span>
                </Stack>
              }
            />
            
            <Collapse in={hadIssues}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the issue (late arrival, no-show, unprofessional behavior, etc.)"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                error={hadIssues && !issueDescription.trim()}
                helperText={hadIssues && !issueDescription.trim() ? 'Please describe the issue' : ''}
                sx={{ mt: 1 }}
                size="small"
              />
            </Collapse>
          </Box>

          {/* Preference Update */}
          {(agencyRating && agencyRating >= 4) && (
            <Alert severity="info" icon={<ThumbsUp size={20} />}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updatePreference && newPreferenceStatus === 'preferred'}
                    onChange={(e) => {
                      setUpdatePreference(e.target.checked);
                      setNewPreferenceStatus(e.target.checked ? 'preferred' : null);
                    }}
                    size="small"
                  />
                }
                label="Mark this agency as Preferred for future shifts at this centre"
              />
            </Alert>
          )}

          {hadIssues && (
            <Alert severity="warning" icon={<AlertTriangle size={20} />}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updatePreference && newPreferenceStatus === 'blacklisted'}
                    onChange={(e) => {
                      setUpdatePreference(e.target.checked);
                      setNewPreferenceStatus(e.target.checked ? 'blacklisted' : null);
                    }}
                    size="small"
                  />
                }
                label="Blacklist this agency for future shifts at this centre"
              />
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!agencyRating || !workerRating || isSubmitting || (hadIssues && !issueDescription.trim())}
          startIcon={<Star size={16} />}
        >
          Submit Rating
        </Button>
      </DialogActions>
    </Dialog>
  );
}
