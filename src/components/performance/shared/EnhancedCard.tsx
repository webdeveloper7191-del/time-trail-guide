import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { cn } from '@/lib/utils';

interface EnhancedCardProps extends Omit<BoxProps, 'component'> {
  children: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  elevated?: boolean;
  urgent?: boolean;
  variant?: 'default' | 'outlined' | 'ghost';
  className?: string;
}

export function EnhancedCard({
  children,
  interactive = false,
  selected = false,
  elevated = false,
  urgent = false,
  variant = 'default',
  className,
  onClick,
  sx,
  ...props
}: EnhancedCardProps) {
  return (
    <Box
      onClick={onClick}
      className={cn(
        'rounded-lg transition-all duration-200',
        interactive && 'cursor-pointer',
        className
      )}
      sx={{
        bgcolor: variant === 'ghost' ? 'transparent' : 'background.paper',
        border: variant === 'ghost' ? 0 : selected ? 2 : 1,
        borderColor: selected 
          ? 'primary.main' 
          : urgent 
            ? 'error.light' 
            : 'divider',
        boxShadow: elevated 
          ? 3 
          : variant === 'default' 
            ? 1 
            : 0,
        position: 'relative',
        overflow: 'hidden',
        
        // Hover effects
        ...(interactive && {
          '&:hover': {
            boxShadow: 4,
            borderColor: selected ? 'primary.main' : 'primary.light',
            transform: 'translateY(-1px)',
            
            // Show chevron or other hover indicators
            '& .hover-indicator': {
              opacity: 1,
            },
            '& .hover-reveal': {
              opacity: 1,
              visibility: 'visible',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }),
        
        // Urgent pulse effect
        ...(urgent && {
          animation: 'subtle-pulse 3s ease-in-out infinite',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'error.main',
            borderRadius: '4px 4px 0 0',
          },
        }),
        
        // Selected ring effect
        ...(selected && {
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}25`,
        }),
        
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

// CSS keyframes - add to index.css if not present
// @keyframes subtle-pulse {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.95; }
// }

export default EnhancedCard;
