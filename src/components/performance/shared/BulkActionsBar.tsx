import React from 'react';
import { Box, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { Button } from '@/components/mui/Button';
import { X, Trash2, Edit, CheckCircle, AlertTriangle, ArrowUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  actions: BulkAction[];
  entityName?: string;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  entityName = 'items',
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 6,
            border: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            minWidth: 400,
            maxWidth: '90vw',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Selection info */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {selectedCount}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {selectedCount} {entityName} selected
                </Typography>
                {selectedCount < totalCount && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={onSelectAll}
                  >
                    Select all {totalCount}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Divider */}
            <Box sx={{ width: 1, height: 32, bgcolor: 'divider' }} />

            {/* Actions */}
            <Stack direction="row" alignItems="center" spacing={1} flex={1}>
              {actions.map((action) => (
                <Tooltip key={action.id} title={action.label}>
                  <Button
                    variant={action.variant === 'destructive' ? 'outline' : 'ghost'}
                    size="small"
                    onClick={action.onClick}
                    sx={{
                      color: action.variant === 'destructive' ? 'error.main' : undefined,
                      '&:hover': {
                        bgcolor: action.variant === 'destructive' ? 'error.light' : undefined,
                      },
                    }}
                  >
                    {action.icon}
                    <Typography component="span" sx={{ ml: 0.75, display: { xs: 'none', sm: 'inline' } }}>
                      {action.label}
                    </Typography>
                  </Button>
                </Tooltip>
              ))}
            </Stack>

            {/* Close button */}
            <Tooltip title="Clear selection">
              <IconButton size="small" onClick={onClearSelection}>
                <X size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}

// Pre-defined action builders for common operations
export const createGoalBulkActions = (
  onUpdateStatus: (status: string) => void,
  onUpdatePriority: (priority: string) => void,
  onDelete: () => void
): BulkAction[] => [
  {
    id: 'complete',
    label: 'Mark Complete',
    icon: <CheckCircle size={16} />,
    onClick: () => onUpdateStatus('completed'),
  },
  {
    id: 'priority',
    label: 'Set High Priority',
    icon: <ArrowUp size={16} />,
    onClick: () => onUpdatePriority('high'),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 size={16} />,
    onClick: onDelete,
    variant: 'destructive',
  },
];

export const createReviewBulkActions = (
  onSendReminders: () => void,
  onReassign: () => void,
  onCancel: () => void
): BulkAction[] => [
  {
    id: 'remind',
    label: 'Send Reminders',
    icon: <AlertTriangle size={16} />,
    onClick: onSendReminders,
  },
  {
    id: 'reassign',
    label: 'Reassign',
    icon: <Users size={16} />,
    onClick: onReassign,
  },
  {
    id: 'cancel',
    label: 'Cancel',
    icon: <X size={16} />,
    onClick: onCancel,
    variant: 'destructive',
  },
];

export default BulkActionsBar;
