import * as React from "react";
import { Popover as MuiPopover, PopoverProps as MuiPopoverProps, Box } from "@mui/material";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
});

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

const Popover = ({ children, open: controlledOpen, onOpenChange, modal = true }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { setOpen, setAnchorEl } = React.useContext(PopoverContext);
    
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(e.currentTarget);
      setOpen(true);
      if (onClick) onClick(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: handleClick,
        ...props
      });
    }
    
    return (
      <span ref={ref as any} onClick={handleClick} {...props}>
        {children}
      </span>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const { open, setOpen, anchorEl } = React.useContext(PopoverContext);
    
    const anchorOrigin = {
      vertical: 'bottom' as const,
      horizontal: align === 'start' ? 'left' as const : align === 'end' ? 'right' as const : 'center' as const,
    };
    
    const transformOrigin = {
      vertical: 'top' as const,
      horizontal: align === 'start' ? 'left' as const : align === 'end' ? 'right' as const : 'center' as const,
    };

    return (
      <MuiPopover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              marginTop: `${sideOffset}px`,
            }
          }
        }}
      >
        <div ref={ref} className={cn("p-4", className)} {...props}>
          {children}
        </div>
      </MuiPopover>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };