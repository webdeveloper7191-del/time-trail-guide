import React from 'react';
import { Box, Stack, Typography, Tooltip } from '@mui/material';
import { cn } from '@/lib/utils';

export type ProgressStatus = 'on_track' | 'at_risk' | 'overdue' | 'completed' | 'default';

interface SemanticProgressBarProps {
  value: number;
  max?: number;
  status?: ProgressStatus;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  sublabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
  tooltipContent?: string;
}

const statusColors: Record<ProgressStatus, { bar: string; bg: string; glow?: string }> = {
  on_track: {
    bar: 'bg-green-500',
    bg: 'bg-green-100',
    glow: 'shadow-green-500/20',
  },
  at_risk: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-100',
    glow: 'shadow-amber-500/20',
  },
  overdue: {
    bar: 'bg-red-500',
    bg: 'bg-red-100',
    glow: 'shadow-red-500/20',
  },
  completed: {
    bar: 'bg-green-600',
    bg: 'bg-green-100',
    glow: 'shadow-green-600/20',
  },
  default: {
    bar: 'bg-primary',
    bg: 'bg-muted',
  },
};

const sizeClasses: Record<string, { height: string; text: string }> = {
  xs: { height: 'h-1', text: 'text-xs' },
  sm: { height: 'h-1.5', text: 'text-xs' },
  md: { height: 'h-2', text: 'text-sm' },
  lg: { height: 'h-3', text: 'text-sm' },
};

export function getProgressStatus(
  progress: number,
  daysRemaining?: number,
  isOverdue?: boolean
): ProgressStatus {
  if (progress >= 100) return 'completed';
  if (isOverdue || (daysRemaining !== undefined && daysRemaining < 0)) return 'overdue';
  
  // If we have days remaining, calculate expected progress
  if (daysRemaining !== undefined) {
    // Simplified logic: at risk if progress is significantly behind expected
    const expectedProgressPerDay = 100 / Math.max(1, Math.abs(daysRemaining) + progress);
    if (progress < expectedProgressPerDay * 0.7) return 'at_risk';
  }
  
  // Default status based on progress alone
  if (progress < 25) return 'at_risk';
  return 'on_track';
}

export function SemanticProgressBar({
  value,
  max = 100,
  status = 'default',
  showLabel = false,
  showPercentage = true,
  label,
  sublabel,
  size = 'md',
  animate = true,
  className,
  tooltipContent,
}: SemanticProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = statusColors[status];
  const sizes = sizeClasses[size];
  
  const progressBar = (
    <div 
      className={cn(
        'w-full rounded-full overflow-hidden',
        colors.bg,
        sizes.height,
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          colors.bar,
          animate && 'animate-[grow_1s_ease-out]',
          colors.glow && `shadow-sm ${colors.glow}`
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  if (!showLabel && !showPercentage) {
    return tooltipContent ? (
      <Tooltip title={tooltipContent} arrow>
        {progressBar}
      </Tooltip>
    ) : progressBar;
  }

  return (
    <Box className={className}>
      {(showLabel || showPercentage) && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          {showLabel && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: sizes.text }}>
                {label || 'Progress'}
              </Typography>
              {sublabel && (
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                  {sublabel}
                </Typography>
              )}
            </Box>
          )}
          {showPercentage && (
            <Typography 
              variant="body2" 
              fontWeight={600} 
              sx={{ 
                fontSize: sizes.text,
                color: status === 'overdue' ? 'error.main' : 
                       status === 'at_risk' ? 'warning.main' : 
                       status === 'completed' ? 'success.main' : 'text.primary',
              }}
            >
              {Math.round(percentage)}%
            </Typography>
          )}
        </Stack>
      )}
      {tooltipContent ? (
        <Tooltip title={tooltipContent} arrow>
          {progressBar}
        </Tooltip>
      ) : progressBar}
    </Box>
  );
}

export default SemanticProgressBar;
