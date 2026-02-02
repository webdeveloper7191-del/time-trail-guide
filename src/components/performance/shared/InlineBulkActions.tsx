import React from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, Divider } from '@mui/material';
import { Button } from '@/components/mui/Button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface InlineBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  actions: BulkAction[];
  entityName?: string;
}

export function InlineBulkActions({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  entityName = 'items',
}: InlineBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20, width: 0 }}
        animate={{ opacity: 1, x: 0, width: 'auto' }}
        exit={{ opacity: 0, x: 20, width: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'primary.50',
            borderRadius: 1.5,
            px: 1.5,
            py: 0.75,
            border: '1px solid',
            borderColor: 'primary.200',
          }}
        >
          {/* Selection count badge */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                minWidth: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {selectedCount}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                color: 'primary.700',
                fontSize: '0.8125rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              selected
            </Typography>
            {selectedCount < totalCount && (
              <Typography
                variant="caption"
                sx={{ 
                  color: 'primary.600',
                  cursor: 'pointer', 
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  '&:hover': { color: 'primary.800' },
                  display: { xs: 'none', md: 'block' },
                }}
                onClick={onSelectAll}
              >
                Select all {totalCount}
              </Typography>
            )}
          </Stack>

          {/* Divider */}
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'primary.200' }} />

          {/* Actions */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {actions.map((action) => (
              <Tooltip key={action.id} title={action.label}>
                <Button
                  variant={action.variant === 'destructive' ? 'outline' : 'ghost'}
                  size="small"
                  onClick={action.onClick}
                  sx={{
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    color: action.variant === 'destructive' ? 'error.main' : 'primary.700',
                    '&:hover': {
                      bgcolor: action.variant === 'destructive' ? 'error.50' : 'primary.100',
                    },
                  }}
                >
                  {action.icon}
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 0.5, 
                      display: { xs: 'none', lg: 'inline' },
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {action.label}
                  </Typography>
                </Button>
              </Tooltip>
            ))}
          </Stack>

          {/* Close button */}
          <Tooltip title="Clear selection">
            <IconButton 
              size="small" 
              onClick={onClearSelection}
              sx={{ 
                p: 0.25,
                color: 'primary.600',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <X size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}

export default InlineBulkActions;
