import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Badge,
  Popover,
  Divider,
  Chip,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { AssignedPlan } from '@/types/performancePlan';
import {
  getAllPerformanceNotifications,
  PerformanceNotification,
} from '@/lib/performanceNotificationService';
import {
  getAllPlanNotifications,
  PlanNotification,
} from '@/lib/planNotificationService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Bell,
  Target,
  ClipboardCheck,
  MessageSquare,
  X,
  Calendar,
  FileText,
  Flag,
} from 'lucide-react';

interface PerformanceNotificationBellProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  plans?: AssignedPlan[];
  currentUserId: string;
  onViewGoal: (goalId: string) => void;
  onViewReview: (reviewId: string) => void;
  onViewConversation: (conversationId: string) => void;
  onViewPlan?: (planId: string) => void;
}

const notificationIcons: Record<string, React.ReactNode> = {
  goal: <Target className="h-4 w-4" />,
  review: <ClipboardCheck className="h-4 w-4" />,
  conversation: <MessageSquare className="h-4 w-4" />,
  milestone: <Flag className="h-4 w-4" />,
  plan: <FileText className="h-4 w-4" />,
};

export function PerformanceNotificationBell({
  goals,
  reviews,
  conversations,
  plans = [],
  currentUserId,
  onViewGoal,
  onViewReview,
  onViewConversation,
  onViewPlan,
}: PerformanceNotificationBellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'plans'>('all');

  // Performance notifications (goals, reviews, conversations)
  const performanceNotifications = useMemo(() => {
    const all = getAllPerformanceNotifications(goals, reviews, conversations, currentUserId);
    return all.filter((n) => !dismissedIds.has(n.id));
  }, [goals, reviews, conversations, currentUserId, dismissedIds]);

  // Plan notifications (milestones, plan reviews, plan conversations)
  const planNotifications = useMemo(() => {
    const all = getAllPlanNotifications(plans, goals, reviews, conversations, currentUserId);
    return all.filter((n) => !dismissedIds.has(n.id));
  }, [plans, goals, reviews, conversations, currentUserId, dismissedIds]);

  const allNotifications = useMemo(() => {
    return activeTab === 'plans' ? planNotifications : performanceNotifications;
  }, [activeTab, performanceNotifications, planNotifications]);

  const totalCount = performanceNotifications.length + planNotifications.length;
  const errorCount = 
    performanceNotifications.filter(n => n.severity === 'error').length + 
    planNotifications.filter(n => n.severity === 'error').length;

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
    const allIds = [...performanceNotifications, ...planNotifications].map(n => n.id);
    setDismissedIds(new Set(allIds));
  };

  const handleNotificationClick = (notification: PerformanceNotification | PlanNotification) => {
    if ('entityType' in notification && notification.entityType) {
      switch (notification.entityType) {
        case 'goal':
        case 'milestone':
          if (notification.entityId) onViewGoal(notification.entityId);
          break;
        case 'review':
          if (notification.entityId) onViewReview(notification.entityId);
          break;
        case 'conversation':
          if (notification.entityId) onViewConversation(notification.entityId);
          break;
      }
    }
    // Handle plan-level notifications
    if ('planId' in notification && onViewPlan) {
      onViewPlan(notification.planId);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Badge
          badgeContent={totalCount}
          color={errorCount > 0 ? 'error' : totalCount > 0 ? 'warning' : 'primary'}
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
            {totalCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleDismissAll}>
                Clear All
              </Button>
            )}
          </Stack>
          {/* Tabs for All vs Plans */}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip
              label={`All (${performanceNotifications.length})`}
              size="small"
              color={activeTab === 'all' ? 'primary' : 'default'}
              onClick={() => setActiveTab('all')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label={`Plans (${planNotifications.length})`}
              size="small"
              color={activeTab === 'plans' ? 'primary' : 'default'}
              onClick={() => setActiveTab('plans')}
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Box>

        <ScrollArea className="max-h-[350px]">
          {allNotifications.length === 0 ? (
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
              {allNotifications.map((notification) => {
                const isPlanNotification = 'planId' in notification;
                const entityType = isPlanNotification 
                  ? (notification as PlanNotification).entityType || 'plan'
                  : (notification as PerformanceNotification).entityType;
                
                return (
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
                        {notificationIcons[entityType || 'plan']}
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
                        {isPlanNotification && (
                          <Typography variant="caption" display="block" sx={{ color: 'primary.main', mt: 0.5 }}>
                            Plan: {(notification as PlanNotification).planName}
                          </Typography>
                        )}
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
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Popover>
    </>
  );
}
