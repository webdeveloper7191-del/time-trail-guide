import * as React from "react";
import { Popper, Paper, Fade, ClickAwayListener } from "@mui/material";
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
    const { open, setOpen, setAnchorEl } = React.useContext(PopoverContext);
    
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(e.currentTarget);
      setOpen(!open);
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
      <button type="button" ref={ref as any} onClick={handleClick} {...props}>
        {children}
      </button>
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
  ({ className, align = "center", sideOffset = 4, side = "bottom", children, ...props }, ref) => {
    const { open, setOpen, anchorEl } = React.useContext(PopoverContext);
    
    const placement = side === 'bottom' 
      ? (align === 'start' ? 'bottom-start' : align === 'end' ? 'bottom-end' : 'bottom')
      : side === 'top'
      ? (align === 'start' ? 'top-start' : align === 'end' ? 'top-end' : 'top')
      : side === 'left'
      ? (align === 'start' ? 'left-start' : align === 'end' ? 'left-end' : 'left')
      : (align === 'start' ? 'right-start' : align === 'end' ? 'right-end' : 'right');

    if (!open) return null;

    return (
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={placement as any}
        transition
        style={{ zIndex: 9999 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, sideOffset],
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <div ref={ref} className={cn("p-4 outline-none", className)} {...props}>
                  {children}
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
