import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Chip,
  Paper,
} from '@mui/material';
import { Button } from '@/components/ui/button';
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
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { GiveFeedbackDrawer } from './GiveFeedbackDrawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeedbackPanelProps {
  feedback: Feedback[];
  staff: StaffMember[];
  currentUserId: string;
  onSendFeedback: (data: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  view: 'received' | 'given' | 'all';
  onViewChange: (view: 'received' | 'given' | 'all') => void;
}

const typeColors: Record<FeedbackType, { bg: string; text: string; border: string }> = {
  praise: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  constructive: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  coaching: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
  general: { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const filteredFeedback = feedback.filter(f => {
    if (view === 'received') return f.toStaffId === currentUserId;
    if (view === 'given') return f.fromStaffId === currentUserId;
    return true;
  });

  const renderFeedbackRow = (item: Feedback) => {
    const fromStaff = getStaffMember(item.fromStaffId);
    const toStaff = getStaffMember(item.toStaffId);
    const isReceived = item.toStaffId === currentUserId;
    const displayStaff = isReceived ? fromStaff : toStaff;
    const isHovered = hoveredRow === item.id;
    const colors = typeColors[item.type];

    return (
      <TableRow 
        key={item.id}
        className="group hover:bg-muted/50 transition-colors"
        onMouseEnter={() => setHoveredRow(item.id)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              src={displayStaff?.avatar} 
              sx={{ width: 36, height: 36, fontSize: '0.85rem' }}
            >
              {displayStaff?.firstName?.[0]}{displayStaff?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {isReceived ? 'From: ' : 'To: '}
                {displayStaff?.firstName} {displayStaff?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ 
            maxWidth: 300, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.message}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            icon={typeIcons[item.type] as React.ReactElement}
            label={feedbackTypeLabels[item.type]}
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
          {item.isPrivate && (
            <Chip
              icon={<Lock size={12} />}
              label="Private"
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          )}
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
            <Tooltip title="More">
              <IconButton size="small">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

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
        <Button onClick={() => setShowFeedbackDrawer(true)} className="gap-2">
          <Plus size={16} />
          Give Feedback
        </Button>
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

      {/* Feedback Table */}
      {filteredFeedback.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
          <Heart size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px', opacity: 0.5 }} />
          <Typography variant="body1" fontWeight={500}>
            {view === 'received' ? 'No feedback received yet' : 
             view === 'given' ? "You haven't given any feedback yet" : 
             'No feedback yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Start sharing recognition and constructive feedback with your team
          </Typography>
          {view !== 'given' && (
            <Button variant="outline" className="mt-4" onClick={() => setShowFeedbackDrawer(true)}>
              Give your first feedback
            </Button>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-48">{view === 'received' ? 'From' : view === 'given' ? 'To' : 'Person'}</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-24">Privacy</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map(renderFeedbackRow)}
            </TableBody>
          </Table>
        </Paper>
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
