import React from 'react';
import MuiTooltip from '@mui/material/Tooltip';

export interface TooltipProps {
  children: React.ReactElement;
  content?: React.ReactNode;
  title?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ 
  children, 
  content, 
  title,
  side = 'top',
  sideOffset = 4,
  open,
  onOpenChange,
}: TooltipProps) {
  const placementMap = {
    top: 'top' as const,
    bottom: 'bottom' as const,
    left: 'left' as const,
    right: 'right' as const,
  };

  const tooltipTitle = content || title || '';

  return (
    <MuiTooltip
      title={tooltipTitle as string}
      placement={placementMap[side]}
      arrow
      open={open}
      onOpen={() => onOpenChange?.(true)}
      onClose={() => onOpenChange?.(false)}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, sideOffset],
              },
            },
          ],
        },
      }}
    >
      {children}
    </MuiTooltip>
  );
}

// Wrapper components for compatibility
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipTrigger = React.forwardRef<HTMLElement, { children: React.ReactNode; asChild?: boolean }>(
  ({ children }, ref) => <>{children}</>
);
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
