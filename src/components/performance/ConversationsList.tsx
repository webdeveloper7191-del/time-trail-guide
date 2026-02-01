import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { Button } from '@/components/ui/button';
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
  Video,
  Users,
  StickyNote,
  ListChecks,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './shared/StatusBadge';

interface ConversationsListProps {
  conversations: Conversation[];
  staff: StaffMember[];
  currentUserId: string;
  onScheduleConversation: () => void;
  onViewConversation: (conversation: Conversation) => void;
}

const typeColors: Record<ConversationType, { bg: string; text: string; border: string }> = {
  one_on_one: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
  check_in: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  coaching: { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  feedback: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  career: { bg: '#fce7f3', text: '#db2777', border: '#f9a8d4' },
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

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

  const renderConversationRow = (conv: Conversation, isUpcoming: boolean) => {
    const isManager = conv.managerId === currentUserId;
    const staffMember = getStaffMember(conv.staffId);
    const otherPerson = isManager ? staffMember : getStaffMember(conv.managerId);
    const meetingDate = parseISO(conv.scheduledDate);
    const isHovered = hoveredRow === conv.id;
    const colors = typeColors[conv.type];
    const isTodayMeeting = isToday(meetingDate);

    return (
      <TableRow 
        key={conv.id}
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        onMouseEnter={() => setHoveredRow(conv.id)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => onViewConversation(conv)}
        style={{
          borderLeft: isTodayMeeting && isUpcoming ? '3px solid #2563eb' : undefined,
          backgroundColor: isTodayMeeting && isUpcoming ? 'rgba(37, 99, 235, 0.05)' : undefined,
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              src={otherPerson?.avatar} 
              sx={{ width: 36, height: 36, fontSize: '0.85rem' }}
            >
              {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {conv.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                with {otherPerson?.firstName} {otherPerson?.lastName}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            icon={typeIcons[conv.type] as React.ReactElement}
            label={conversationTypeLabels[conv.type]}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              bgcolor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              '& .MuiChip-icon': { color: colors.text },
            }}
          />
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight={isTodayMeeting ? 600 : 400} color={isTodayMeeting ? 'primary.main' : 'text.primary'}>
              {getDateLabel(conv.scheduledDate)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {format(meetingDate, 'h:mm a')} • {conv.duration} min
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          {conv.completed ? (
            <StatusBadge status="completed" size="small" />
          ) : isPast(meetingDate) ? (
            <StatusBadge status="overdue" size="small" label="Missed" />
          ) : (
            <StatusBadge status="pending" size="small" label="Scheduled" />
          )}
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {conv.notes.length > 0 && (
              <Chip
                icon={<StickyNote size={12} />}
                label={conv.notes.length}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {conv.actionItems.length > 0 && (
              <Chip
                icon={<ListChecks size={12} />}
                label={conv.actionItems.length}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 0.5, 
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.15s'
            }}
          >
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onViewConversation(conv); }}>
              <Eye className="h-3 w-3" /> View
            </Button>
            <Tooltip title="More">
              <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  const renderEmptyState = () => (
    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
      <Calendar size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px', opacity: 0.5 }} />
      <Typography variant="body1" fontWeight={500}>No upcoming meetings</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        Schedule 1:1s, check-ins, and coaching sessions
      </Typography>
      <Button className="mt-4" onClick={onScheduleConversation}>
        <Plus className="h-4 w-4 mr-2" /> Schedule Meeting
      </Button>
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
        <Button onClick={onScheduleConversation} className="gap-2">
          <Plus size={16} />
          Schedule Meeting
        </Button>
      </Stack>

      {/* Upcoming Meetings Table */}
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
          renderEmptyState()
        ) : (
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Meeting</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-36">Schedule</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Items</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map(conv => renderConversationRow(conv, true))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      {/* Past Meetings Table */}
      {past.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
            Past Meetings ({past.length})
          </Typography>
          
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Meeting</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-36">Date</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Items</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.slice(0, 5).map(conv => renderConversationRow(conv, false))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default ConversationsList;
