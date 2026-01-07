import * as React from "react";
import { Tooltip as MuiTooltip } from "@mui/material";
import { cn } from "@/lib/utils";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipProvider = ({ children }: TooltipProviderProps) => <>{children}</>;

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

const Tooltip = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange, delayDuration }: TooltipProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [content, setContent] = React.useState<React.ReactNode>(null);
  const triggerRef = React.useRef<HTMLElement>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, content, setContent }}>
      {children}
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ children, asChild, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      context?.setOpen(true);
      onMouseEnter?.(e);
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      context?.setOpen(false);
      onMouseLeave?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        ...props
      });
    }
    
    return (
      <span
        ref={ref as any}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    
    if (!context?.open) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };