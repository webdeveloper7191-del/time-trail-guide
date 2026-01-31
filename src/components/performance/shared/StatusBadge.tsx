import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Pause,
  Play,
  Timer,
  LucideIcon,
} from 'lucide-react';

export type StatusType = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'overdue' 
  | 'cancelled'
  | 'pending'
  | 'at_risk'
  | 'on_track'
  | 'paused'
  | 'draft'
  | 'active';

interface StatusConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor?: string;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  not_started: {
    icon: Clock,
    label: 'Not Started',
    bgColor: 'rgba(156, 163, 175, 0.12)',
    textColor: 'rgb(75, 85, 99)',
  },
  in_progress: {
    icon: Play,
    label: 'In Progress',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    textColor: 'rgb(37, 99, 235)',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    textColor: 'rgb(22, 163, 74)',
  },
  overdue: {
    icon: AlertTriangle,
    label: 'Overdue',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: 'rgb(220, 38, 38)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    bgColor: 'rgba(156, 163, 175, 0.12)',
    textColor: 'rgb(107, 114, 128)',
  },
  pending: {
    icon: Timer,
    label: 'Pending',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    textColor: 'rgb(161, 98, 7)',
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'At Risk',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    textColor: 'rgb(194, 65, 12)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  on_track: {
    icon: Target,
    label: 'On Track',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    textColor: 'rgb(22, 163, 74)',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    bgColor: 'rgba(156, 163, 175, 0.15)',
    textColor: 'rgb(75, 85, 99)',
  },
  draft: {
    icon: Clock,
    label: 'Draft',
    bgColor: 'rgba(156, 163, 175, 0.12)',
    textColor: 'rgb(107, 114, 128)',
  },
  active: {
    icon: Play,
    label: 'Active',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    textColor: 'rgb(22, 163, 74)',
  },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  variant?: 'filled' | 'outlined';
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  label, 
  size = 'small',
  showIcon = true,
  variant = 'filled',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfigs[status] || statusConfigs.not_started;
  const Icon = config.icon;
  
  const isUrgent = status === 'overdue' || status === 'at_risk';
  
  return (
    <Chip
      size={size}
      label={label || config.label}
      icon={showIcon ? <Icon className={`h-3.5 w-3.5 ${pulse && isUrgent ? 'animate-pulse' : ''}`} /> : undefined}
      className={className}
      sx={{
        bgcolor: variant === 'filled' ? config.bgColor : 'transparent',
        color: config.textColor,
        border: variant === 'outlined' || config.borderColor ? 1 : 0,
        borderColor: config.borderColor || config.textColor,
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
        height: size === 'small' ? 24 : 28,
        transition: 'all 0.2s ease-in-out',
        '& .MuiChip-icon': {
          color: config.textColor,
          marginLeft: size === 'small' ? '6px' : '8px',
        },
        ...(isUrgent && {
          animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined,
          boxShadow: `0 0 0 1px ${config.borderColor}`,
        }),
        '&:hover': {
          bgcolor: variant === 'filled' 
            ? config.bgColor.replace('0.12', '0.2').replace('0.15', '0.25')
            : `${config.textColor}10`,
        },
      }}
    />
  );
}

export { statusConfigs };
export default StatusBadge;
