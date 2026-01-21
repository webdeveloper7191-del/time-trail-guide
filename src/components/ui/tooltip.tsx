import * as React from "react";
import { createPortal } from "react-dom";
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
  triggerRect: DOMRect | null;
  setTriggerRect: (rect: DOMRect | null) => void;
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
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
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
    const internalRef = React.useRef<HTMLElement>(null);
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      context?.setTriggerRect(rect);
      context?.setOpen(true);
      onMouseEnter?.(e);
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      context?.setOpen(false);
      onMouseLeave?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: ref || internalRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        ...props
      });
    }
    
    return (
      <span
        ref={(ref || internalRef) as any}
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
  ({ className, side = 'top', sideOffset = 4, align = 'center', children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const contentRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      if (context?.triggerRect && contentRef.current) {
        const rect = context.triggerRect;
        const contentRect = contentRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;
        
        switch (side) {
          case 'top':
            top = rect.top - contentRect.height - sideOffset;
            left = rect.left + rect.width / 2 - contentRect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + sideOffset;
            left = rect.left + rect.width / 2 - contentRect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - contentRect.height / 2;
            left = rect.left - contentRect.width - sideOffset;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - contentRect.height / 2;
            left = rect.right + sideOffset;
            break;
        }
        
        // Adjust for alignment
        if (side === 'top' || side === 'bottom') {
          if (align === 'start') left = rect.left;
          if (align === 'end') left = rect.right - contentRect.width;
        } else {
          if (align === 'start') top = rect.top;
          if (align === 'end') top = rect.bottom - contentRect.height;
        }
        
        // Keep within viewport bounds
        const padding = 8;
        left = Math.max(padding, Math.min(left, window.innerWidth - contentRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - contentRect.height - padding));
        
        setPosition({ top, left });
      }
    }, [context?.triggerRect, side, sideOffset, align, context?.open]);
    
    if (!context?.open) {
      return null;
    }

    const content = (
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
        {...props}
      >
        {children}
      </div>
    );

    return createPortal(content, document.body);
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };