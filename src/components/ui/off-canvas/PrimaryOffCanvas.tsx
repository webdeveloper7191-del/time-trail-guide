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
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface OffCanvasAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
}

interface PrimaryOffCanvasProps {
  title: string;
  description?: string;
  width?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  open: boolean;
  onClose: () => void;
  actions?: OffCanvasAction[];
  showFooter?: boolean;
  isBackground?: boolean;
  children: React.ReactNode;
  className?: string;
}

const PrimaryOffCanvas: React.FC<PrimaryOffCanvasProps> = ({
  title,
  description,
  width = '500px',
  side = 'right',
  open,
  onClose,
  actions = [],
  showFooter = true,
  isBackground = false,
  children,
  className,
}) => {
  const getButtonVariant = (variant: OffCanvasAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained';
      case 'outlined':
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
      default:
        return 'inherit';
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={side}
        className={cn(
          'p-0 flex flex-col',
          isBackground && 'bg-muted/30',
          className
        )}
        style={{ 
          width: side === 'left' || side === 'right' ? width : undefined,
          maxWidth: side === 'left' || side === 'right' ? '95vw' : undefined,
        }}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
              {description && (
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full side-popup-body">
            <div className="px-6 py-4">
              {children}
            </div>
          </ScrollArea>
        </div>

        {/* Footer with actions */}
        {showFooter && actions.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t border-border flex-shrink-0">
            <div className="flex justify-end gap-3 w-full">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={getButtonVariant(action.variant)}
                  color={getButtonColor(action.variant)}
                  onClick={action.onClick}
                  type={action.type || 'button'}
                  disabled={action.disabled || action.loading}
                  size="medium"
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
