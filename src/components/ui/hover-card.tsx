import * as React from "react";
import { Popper, Paper, Fade, ClickAwayListener } from "@mui/material";
import { cn } from "@/lib/utils";

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const HoverCardContext = React.createContext<HoverCardContextValue | undefined>(undefined);

const useHoverCardContext = () => {
  const context = React.useContext(HoverCardContext);
  if (!context) {
    throw new Error("HoverCard components must be used within a HoverCard");
  }
  return context;
};

interface HoverCardProps {
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
}

const HoverCard: React.FC<HoverCardProps> = ({ children, openDelay = 700, closeDelay = 300 }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const openTimeoutRef = React.useRef<NodeJS.Timeout>();
  const closeTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleOpen = React.useCallback(() => {
    clearTimeout(closeTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => setOpen(true), openDelay);
  }, [openDelay]);

  const handleClose = React.useCallback(() => {
    clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  React.useEffect(() => {
    return () => {
      clearTimeout(openTimeoutRef.current);
      clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const contextValue = React.useMemo(() => ({
    open,
    setOpen: (newOpen: boolean) => {
      if (newOpen) {
        handleOpen();
      } else {
        handleClose();
      }
    },
    anchorEl,
    setAnchorEl,
  }), [open, anchorEl, handleOpen, handleClose]);

  return (
    <HoverCardContext.Provider value={contextValue}>
      {children}
    </HoverCardContext.Provider>
  );
};

const HoverCardTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, onMouseEnter, onMouseLeave, ...props }, ref) => {
  const { setOpen, setAnchorEl } = useHoverCardContext();
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => triggerRef.current!);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(triggerRef.current);
    setOpen(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpen(false);
    onMouseLeave?.(e);
  };

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
});
HoverCardTrigger.displayName = "HoverCardTrigger";

interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ className, align = "center", sideOffset = 4, children, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const { open, setOpen, anchorEl } = useHoverCardContext();

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setOpen(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setOpen(false);
      onMouseLeave?.(e);
    };

    return (
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom"
        transition
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, sideOffset],
            },
          },
        ]}
        sx={{ zIndex: 50 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              ref={ref}
              className={cn(
                "w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
                className,
              )}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              sx={{ 
                backgroundColor: 'hsl(var(--popover))', 
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))'
              }}
              {...props}
            >
              {children}
            </Paper>
          </Fade>
        )}
      </Popper>
    );
  }
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };
