import React from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { 
  Conversation, 
  ConversationType,
  conversationTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
  Video,
  Users,
  StickyNote,
  ListChecks
} from 'lucide-react';

interface ConversationsListProps {
  conversations: Conversation[];
  staff: StaffMember[];
  currentUserId: string;
  onScheduleConversation: () => void;
  onViewConversation: (conversation: Conversation) => void;
}

const typeColors: Record<ConversationType, { bg: string; text: string }> = {
  one_on_one: { bg: 'info.light', text: 'info.dark' },
  check_in: { bg: 'success.light', text: 'success.dark' },
  coaching: { bg: 'secondary.light', text: 'secondary.dark' },
  feedback: { bg: 'warning.light', text: 'warning.dark' },
  career: { bg: 'primary.light', text: 'primary.dark' },
};

const typeIcons: Record<ConversationType, React.ReactNode> = {
  one_on_one: <Users size={14} />,
  check_in: <CheckCircle2 size={14} />,
  coaching: <Video size={14} />,
  feedback: <MessageSquare size={14} />,
  career: <Calendar size={14} />,
};

export function ConversationsList({ 
  conversations, 
  staff, 
  currentUserId,
  onScheduleConversation, 
  onViewConversation 
}: ConversationsListProps) {
  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const now = new Date();
  const upcoming = conversations
    .filter(c => !c.completed && !isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  
  const past = conversations
    .filter(c => c.completed || isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

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
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Continuous Conversations
            </Typography>
          </Stack>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Schedule and track 1:1s, check-ins, and coaching sessions
          </Typography>
        </Box>
        <MuiButton 
          variant="contained" 
          startIcon={<Plus size={16} />} 
          onClick={onScheduleConversation}
          fullWidth
          sx={{ width: { sm: 'auto' } }}
        >
          Schedule Meeting
        </MuiButton>
      </Stack>

      {/* Upcoming Meetings */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="overline" color="text.secondary" fontWeight={600}>
            Upcoming
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {upcoming.length} meetings
          </Typography>
        </Stack>
        
        {upcoming.length === 0 ? (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Calendar size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <Typography color="text.secondary">No upcoming meetings</Typography>
              <MuiButton variant="outlined" sx={{ mt: 2 }} onClick={onScheduleConversation}>
                Schedule a meeting
              </MuiButton>
            </Box>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {upcoming.map((conv) => {
              const staffMember = getStaffMember(conv.staffId);
              const isManager = conv.managerId === currentUserId;
              const otherPerson = isManager ? staffMember : getStaffMember(conv.managerId);
              const meetingDate = parseISO(conv.scheduledDate);

              return (
                <Card 
                  key={conv.id}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 },
                    ...(isToday(meetingDate) && { 
                      borderColor: 'primary.main', 
                      bgcolor: 'primary.50' 
                    })
                  }}
                  onClick={() => onViewConversation(conv)}
                >
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography variant="overline" color="text.secondary">
                          {getDateLabel(conv.scheduledDate)}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {format(meetingDate, 'h:mm a')}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem />

                      <Avatar src={otherPerson?.avatar} sx={{ width: 40, height: 40 }}>
                        {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
                      </Avatar>

                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {conv.title}
                          </Typography>
                          <Chip
                            size="small"
                            icon={typeIcons[conv.type] as any}
                            label={conversationTypeLabels[conv.type]}
                            sx={{ 
                              bgcolor: typeColors[conv.type]?.bg,
                              color: typeColors[conv.type]?.text,
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          with {otherPerson?.firstName} {otherPerson?.lastName} • {conv.duration} min
                        </Typography>
                      </Box>

                      <ChevronRight size={20} style={{ color: 'var(--muted-foreground)' }} />
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Past Meetings */}
      {past.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
            Past Meetings ({past.length})
          </Typography>
          
          <Stack spacing={1.5}>
            {past.slice(0, 5).map((conv) => {
              const staffMember = getStaffMember(conv.staffId);
              const isManager = conv.managerId === currentUserId;
              const otherPerson = isManager ? staffMember : getStaffMember(conv.managerId);

              return (
                <Card 
                  key={conv.id}
                  sx={{ 
                    cursor: 'pointer',
                    opacity: 0.85,
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => onViewConversation(conv)}
                >
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={otherPerson?.avatar} sx={{ width: 40, height: 40 }}>
                        {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
                      </Avatar>

                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {conv.title}
                          </Typography>
                          {conv.completed && (
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={<CheckCircle2 size={12} />}
                              label="Completed"
                              sx={{ 
                                bgcolor: 'rgba(34, 197, 94, 0.1)', 
                                color: 'rgb(21, 128, 61)', 
                                borderColor: 'rgba(34, 197, 94, 0.3)' 
                              }}
                            />
                          )}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(conv.scheduledDate), 'MMM d, yyyy')}
                          </Typography>
                          {conv.notes.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <StickyNote size={14} style={{ color: 'var(--muted-foreground)' }} />
                              <Typography variant="caption" color="text.secondary">
                                {conv.notes.length} notes
                              </Typography>
                            </Stack>
                          )}
                          {conv.actionItems.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <ListChecks size={14} style={{ color: 'var(--muted-foreground)' }} />
                              <Typography variant="caption" color="text.secondary">
                                {conv.actionItems.length} action items
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>

                      <ChevronRight size={20} style={{ color: 'var(--muted-foreground)' }} />
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default ConversationsList;
