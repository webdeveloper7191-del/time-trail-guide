import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Badge,
  Popover,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import {
  getAllPerformanceNotifications,
  getNotificationCount,
  PerformanceNotification,
} from '@/lib/performanceNotificationService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Bell,
  Target,
  ClipboardCheck,
  MessageSquare,
  X,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';

interface PerformanceNotificationBellProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  currentUserId: string;
  onViewGoal: (goalId: string) => void;
  onViewReview: (reviewId: string) => void;
  onViewConversation: (conversationId: string) => void;
}

const notificationIcons: Record<string, React.ReactNode> = {
  goal: <Target className="h-4 w-4" />,
  review: <ClipboardCheck className="h-4 w-4" />,
  conversation: <MessageSquare className="h-4 w-4" />,
};

const severityColors: Record<string, 'error' | 'warning' | 'info'> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export function PerformanceNotificationBell({
  goals,
  reviews,
  conversations,
  currentUserId,
  onViewGoal,
  onViewReview,
  onViewConversation,
}: PerformanceNotificationBellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const all = getAllPerformanceNotifications(goals, reviews, conversations, currentUserId);
    return all.filter((n) => !dismissedIds.has(n.id));
  }, [goals, reviews, conversations, currentUserId, dismissedIds]);

  const counts = useMemo(() => getNotificationCount(notifications), [notifications]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDismiss = (notificationId: string) => {
    setDismissedIds((prev) => new Set([...prev, notificationId]));
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(notifications.map((n) => n.id)));
  };

  const handleNotificationClick = (notification: PerformanceNotification) => {
    switch (notification.entityType) {
      case 'goal':
        onViewGoal(notification.entityId);
        break;
      case 'review':
        onViewReview(notification.entityId);
        break;
      case 'conversation':
        onViewConversation(notification.entityId);
        break;
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Badge
          badgeContent={counts.total}
          color={counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : 'primary'}
        >
          <Bell className="h-5 w-5" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 380, maxHeight: 480 },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleDismissAll}>
                Clear All
              </Button>
            )}
          </Stack>
          {counts.total > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {counts.error > 0 && (
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  {counts.error} urgent
                </Typography>
              )}
              {counts.warning > 0 && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                  {counts.warning} pending
                </Typography>
              )}
              {counts.info > 0 && (
                <Typography variant="caption" sx={{ color: 'info.main' }}>
                  {counts.info} upcoming
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        <ScrollArea className="max-h-[350px]">
          {notifications.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <Typography variant="body2" color="text.secondary">
                You're all caught up!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No pending notifications
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor:
                          notification.severity === 'error'
                            ? 'error.100'
                            : notification.severity === 'warning'
                            ? 'warning.100'
                            : 'info.100',
                        height: 'fit-content',
                      }}
                    >
                      {notificationIcons[notification.entityType]}
                    </Box>
                    <Box
                      sx={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.message}
                      </Typography>
                      {notification.dueDate && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(parseISO(notification.dueDate), { addSuffix: true })}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Popover>
    </>
  );
}
