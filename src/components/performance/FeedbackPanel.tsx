import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { 
  Feedback, 
  FeedbackType,
  feedbackTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  MessageSquareHeart, 
  ThumbsUp,
  Lightbulb,
  MessageCircle,
  Heart,
  Lock,
  Plus
} from 'lucide-react';
import { GiveFeedbackDrawer } from './GiveFeedbackDrawer';

interface FeedbackPanelProps {
  feedback: Feedback[];
  staff: StaffMember[];
  currentUserId: string;
  onSendFeedback: (data: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  view: 'received' | 'given' | 'all';
  onViewChange: (view: 'received' | 'given' | 'all') => void;
}

const typeColors: Record<FeedbackType, { bg: string; text: string }> = {
  praise: { bg: 'success.light', text: 'success.dark' },
  constructive: { bg: 'warning.light', text: 'warning.dark' },
  coaching: { bg: 'info.light', text: 'info.dark' },
  general: { bg: 'grey.100', text: 'grey.600' },
};

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  praise: <ThumbsUp size={14} />,
  constructive: <Lightbulb size={14} />,
  coaching: <MessageCircle size={14} />,
  general: <MessageCircle size={14} />,
};

export function FeedbackPanel({ 
  feedback, 
  staff, 
  currentUserId,
  onSendFeedback,
  view,
  onViewChange
}: FeedbackPanelProps) {
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const filteredFeedback = feedback.filter(f => {
    if (view === 'received') return f.toStaffId === currentUserId;
    if (view === 'given') return f.fromStaffId === currentUserId;
    return true;
  });

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
              <MessageSquareHeart size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Feedback & Recognition
            </Typography>
          </Stack>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Give and receive feedback from your team
          </Typography>
        </Box>
        <MuiButton 
          variant="contained" 
          startIcon={<Plus size={16} />} 
          onClick={() => setShowFeedbackDrawer(true)}
          fullWidth
          sx={{ width: { sm: 'auto' } }}
        >
          Give Feedback
        </MuiButton>
      </Stack>

      {/* View Toggle */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, newView) => newView && onViewChange(newView)}
        size="small"
        sx={{ 
          bgcolor: 'grey.100', 
          p: 0.5, 
          borderRadius: 2,
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 1.5,
            px: 2,
            py: 0.75,
            textTransform: 'capitalize',
            '&.Mui-selected': {
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' },
            },
          },
        }}
      >
        <ToggleButton value="received">Received</ToggleButton>
        <ToggleButton value="given">Given</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Heart size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
            <Typography color="text.secondary">
              {view === 'received' ? 'No feedback received yet' : 
               view === 'given' ? "You haven't given any feedback yet" : 
               'No feedback yet'}
            </Typography>
            {view !== 'given' && (
              <MuiButton variant="outlined" sx={{ mt: 2 }} onClick={() => setShowFeedbackDrawer(true)}>
                Give your first feedback
              </MuiButton>
            )}
          </Box>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredFeedback.map((item) => {
            const fromStaff = getStaffMember(item.fromStaffId);
            const toStaff = getStaffMember(item.toStaffId);
            const isReceived = item.toStaffId === currentUserId;

            return (
              <Card key={item.id} sx={{ '&:hover': { boxShadow: 2 } }}>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Avatar src={isReceived ? fromStaff?.avatar : toStaff?.avatar} sx={{ width: 40, height: 40 }}>
                      {isReceived 
                        ? `${fromStaff?.firstName?.[0]}${fromStaff?.lastName?.[0]}`
                        : `${toStaff?.firstName?.[0]}${toStaff?.lastName?.[0]}`
                      }
                    </Avatar>

                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {isReceived 
                            ? `${fromStaff?.firstName} ${fromStaff?.lastName}` 
                            : `To: ${toStaff?.firstName} ${toStaff?.lastName}`
                          }
                        </Typography>
                        <Chip
                          size="small"
                          icon={typeIcons[item.type] as any}
                          label={feedbackTypeLabels[item.type]}
                          sx={{ 
                            bgcolor: typeColors[item.type]?.bg,
                            color: typeColors[item.type]?.text,
                          }}
                        />
                        {item.isPrivate && (
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<Lock size={12} />}
                            label="Private"
                          />
                        )}
                      </Stack>

                      <Typography variant="body2" mt={1}>{item.message}</Typography>

                      <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
                        {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Give Feedback Drawer */}
      <GiveFeedbackDrawer
        open={showFeedbackDrawer}
        onOpenChange={setShowFeedbackDrawer}
        staff={staff}
        currentUserId={currentUserId}
        onSendFeedback={onSendFeedback}
      />
    </Box>
  );
}

export default FeedbackPanel;
