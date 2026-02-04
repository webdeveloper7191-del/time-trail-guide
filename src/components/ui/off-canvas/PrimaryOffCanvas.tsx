import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@mui/material';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LucideIcon } from 'lucide-react';

export interface OffCanvasAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'destructive';
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

// Size presets based on content needs - prevents horizontal scrolling
export type OffCanvasSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

const sizeMap: Record<OffCanvasSize, string> = {
  sm: '400px',   // Alerts, notifications
  md: '500px',   // Simple forms, conflicts
  lg: '600px',   // Detailed forms
  xl: '720px',   // Complex panels (default)
  '2xl': '800px', // Wide content
  '3xl': '900px', // Data tables
  '4xl': '1024px', // Full panels with charts
  full: '100%',
};

interface PrimaryOffCanvasProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Predefined size preset or custom width string */
  size?: OffCanvasSize | string;
  /** @deprecated Use `size` instead */
  width?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  open: boolean;
  onClose: () => void;
  actions?: OffCanvasAction[];
  showFooter?: boolean;
  isBackground?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Header actions (buttons/icons) to show in header right side */
  headerActions?: React.ReactNode;
}

const PrimaryOffCanvas: React.FC<PrimaryOffCanvasProps> = ({
  title,
  description,
  icon: Icon,
  size,
  width: deprecatedWidth,
  side = 'right',
  open,
  onClose,
  actions = [],
  showFooter = true,
  isBackground = false,
  children,
  className,
  contentClassName,
  headerActions,
}) => {
  const getButtonVariant = (variant: OffCanvasAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained';
      case 'outlined':
      case 'destructive':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'outlined';
    }
  };

  const getButtonColor = (variant: OffCanvasAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'destructive':
        return 'error';
      default:
        return 'inherit';
    }
  };

  // Resolve width from size preset, deprecated width prop, or default
  const resolvedSize = size || (deprecatedWidth ? undefined : 'xl');
  const computedWidth = resolvedSize 
    ? (sizeMap[resolvedSize as OffCanvasSize] || resolvedSize)
    : deprecatedWidth || sizeMap.xl;
  const isHorizontal = side === 'left' || side === 'right';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={side}
        className={cn(
          '!p-0 flex flex-col h-full overflow-hidden',
          isBackground && 'bg-muted/30',
          className
        )}
        style={{ 
          width: isHorizontal ? `min(${computedWidth}, 100vw)` : undefined,
          maxWidth: isHorizontal ? '100vw' : undefined,
        }}
      >
        {/* Header - Clean minimal style matching reference */}
        <SheetHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0 !mb-0 !pb-3 sm:!pb-4 bg-background">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {Icon && (
                <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              )}
              <div>
                <SheetTitle className="text-base sm:text-lg font-semibold">{title}</SheetTitle>
                {description && (
                  <SheetDescription className="mt-0.5 text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {description}
                  </SheetDescription>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Content - Light background to match reference design */}
        <div className="flex-1 min-h-0 overflow-hidden w-full bg-muted/30">
          <ScrollArea className="h-full w-full">
            <div className={cn("px-4 sm:px-6 py-4 sm:py-5 w-full", contentClassName)}>
              <div className="w-full space-y-4">
                {children}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer with actions - Matching reference button styling */}
        {showFooter && actions.length > 0 && (
          <SheetFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex-shrink-0 !mt-0 !pt-3 sm:!pt-4 bg-background">
            <div className="flex flex-col-reverse sm:flex-row justify-start gap-2 sm:gap-3 w-full">
              {actions.slice().reverse().map((action, index) => (
                <Button
                  key={index}
                  variant={getButtonVariant(action.variant)}
                  color={getButtonColor(action.variant)}
                  onClick={action.onClick}
                  type={action.type || 'button'}
                  disabled={action.disabled || action.loading}
                  size="medium"
                  startIcon={action.icon}
                  sx={{ 
                    minWidth: 'auto',
                    px: 3,
                    ...(action.variant === 'primary' && {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      '&:hover': {
                        backgroundColor: 'hsl(var(--primary) / 0.9)',
                      },
                    }),
                    ...(action.variant === 'secondary' && {
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))',
                      '&:hover': {
                        backgroundColor: 'hsl(var(--secondary) / 0.8)',
                      },
                    }),
                    '@media (min-width: 640px)': { 
                      width: 'auto' 
                    } 
                  }}
                >
                  {action.loading ? 'Loading...' : action.label}
                </Button>
              ))}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PrimaryOffCanvas;
export { PrimaryOffCanvas };
