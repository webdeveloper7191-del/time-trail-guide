import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
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
  Pencil,
  Trash2,
  Archive,
  Copy,
  Send,
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
import { RowActionsMenu, RowAction } from './shared/RowActionsMenu';
import { toast } from 'sonner';

interface ConversationsListProps {
  conversations: Conversation[];
  staff: StaffMember[];
  currentUserId: string;
  onScheduleConversation: () => void;
  onViewConversation: (conversation: Conversation) => void;
}

const typeColors: Record<ConversationType, { bg: string; text: string; border: string }> = {
  one_on_one: { bg: 'hsl(var(--chart-1) / 0.15)', text: 'hsl(var(--chart-1))', border: 'hsl(var(--chart-1) / 0.3)' },
  check_in: { bg: 'hsl(var(--chart-2) / 0.15)', text: 'hsl(var(--chart-2))', border: 'hsl(var(--chart-2) / 0.3)' },
  coaching: { bg: 'hsl(var(--chart-5) / 0.15)', text: 'hsl(var(--chart-5))', border: 'hsl(var(--chart-5) / 0.3)' },
  feedback: { bg: 'hsl(var(--chart-4) / 0.15)', text: 'hsl(var(--chart-4))', border: 'hsl(var(--chart-4) / 0.3)' },
  career: { bg: 'hsl(var(--chart-3) / 0.15)', text: 'hsl(var(--chart-3))', border: 'hsl(var(--chart-3) / 0.3)' },
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
    const isMissed = !conv.completed && isPast(meetingDate);

    return (
      <TableRow 
        key={conv.id}
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        onMouseEnter={() => setHoveredRow(conv.id)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => onViewConversation(conv)}
        style={{
          borderLeft: isTodayMeeting && isUpcoming 
            ? '3px solid hsl(var(--chart-1))' 
            : isMissed 
              ? '3px solid hsl(var(--destructive))' 
              : undefined,
          backgroundColor: isTodayMeeting && isUpcoming ? 'hsl(var(--chart-1) / 0.05)' : undefined,
        }}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <Avatar 
              src={otherPerson?.avatar} 
              sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: 'hsl(var(--muted))' }}
            >
              {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
            </Avatar>
            <div>
              <p className="text-sm font-medium">{conv.title}</p>
              <p className="text-xs text-muted-foreground">
                with {otherPerson?.firstName} {otherPerson?.lastName}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <Chip
            icon={typeIcons[conv.type] as React.ReactElement}
            label={conversationTypeLabels[conv.type]}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 500,
              bgcolor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              '& .MuiChip-icon': { color: colors.text, fontSize: 14 },
            }}
          />
        </TableCell>
        <TableCell className="py-3">
          <div>
            <p className={`text-sm ${isTodayMeeting ? 'font-semibold text-primary' : ''}`}>
              {getDateLabel(conv.scheduledDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(meetingDate, 'h:mm a')} • {conv.duration} min
            </p>
          </div>
        </TableCell>
        <TableCell className="py-3">
          {conv.completed ? (
            <StatusBadge status="completed" size="small" />
          ) : isMissed ? (
            <StatusBadge status="overdue" size="small" label="Missed" />
          ) : (
            <StatusBadge status="pending" size="small" label="Scheduled" />
          )}
        </TableCell>
        <TableCell className="py-3">
          <div className="flex gap-1.5">
            {conv.notes.length > 0 && (
              <Chip
                icon={<StickyNote size={12} />}
                label={conv.notes.length}
                size="small"
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  bgcolor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid hsl(var(--border))',
                  '& .MuiChip-icon': { color: 'hsl(var(--muted-foreground))' },
                }}
              />
            )}
            {conv.actionItems.length > 0 && (
              <Chip
                icon={<ListChecks size={12} />}
                label={conv.actionItems.length}
                size="small"
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  bgcolor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid hsl(var(--border))',
                  '& .MuiChip-icon': { color: 'hsl(var(--muted-foreground))' },
                }}
              />
            )}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div onClick={(e) => e.stopPropagation()}>
            <RowActionsMenu
              actions={getConversationActions(conv)}
              size="sm"
              align="end"
            />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const getConversationActions = (conv: Conversation): RowAction[] => {
    const actions: RowAction[] = [
      {
        label: 'View Details',
        icon: <Eye className="h-4 w-4" />,
        onClick: (e) => {
          e.stopPropagation();
          onViewConversation(conv);
        },
      },
      {
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: (e) => {
          e.stopPropagation();
          toast.info('Edit conversation functionality coming soon');
        },
      },
    ];

    if (!conv.completed) {
      actions.push({
        label: 'Send Reminder',
        icon: <Send className="h-4 w-4" />,
        onClick: (e) => {
          e.stopPropagation();
          toast.success('Reminder sent');
        },
      });
      actions.push({
        label: 'Mark Complete',
        icon: <CheckCircle2 className="h-4 w-4" />,
        onClick: (e) => {
          e.stopPropagation();
          toast.success('Conversation marked as complete');
        },
      });
    }

    actions.push({
      label: 'Reschedule',
      icon: <Calendar className="h-4 w-4" />,
      onClick: (e) => {
        e.stopPropagation();
        toast.info('Reschedule functionality coming soon');
      },
      separator: true,
    });

    actions.push({
      label: 'Cancel Meeting',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (e) => {
        e.stopPropagation();
        toast.success('Meeting cancelled');
      },
      variant: 'destructive',
    });

    return actions;
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
          <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Meeting</TableHead>
                  <TableHead className="w-32 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</TableHead>
                  <TableHead className="w-36 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Schedule</TableHead>
                  <TableHead className="w-28 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="w-24 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Items</TableHead>
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
          
          <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Meeting</TableHead>
                  <TableHead className="w-32 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</TableHead>
                  <TableHead className="w-36 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Date</TableHead>
                  <TableHead className="w-28 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="w-24 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Items</TableHead>
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
