import * as React from "react";
import { Menu, Popper, Paper, Fade, ClickAwayListener } from "@mui/material";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
});

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setAnchorEl(null);
    }
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { setOpen, setAnchorEl } = React.useContext(DropdownMenuContext);
    
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
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
      <button type="button" ref={ref as any} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Submenu context
interface SubMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const SubMenuContext = React.createContext<SubMenuContextValue | null>(null);

const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  
  return (
    <SubMenuContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      <div className="relative">
        {children}
      </div>
    </SubMenuContext.Provider>
  );
};

// Radio group context
interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

const DropdownMenuRadioGroup = ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      {children}
    </RadioGroupContext.Provider>
  );
};

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 4, align = 'start', children, ...props }, ref) => {
    const { open, setOpen, anchorEl } = React.useContext(DropdownMenuContext);
    
    if (!open) return null;

    const placement = align === 'end' ? 'bottom-end' : align === 'center' ? 'bottom' : 'bottom-start';

    return (
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={placement}
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
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={8}
              sx={{
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.375rem',
                minWidth: '8rem',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <div ref={ref} className={cn("p-1", className)} {...props}>
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
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, onClick, children, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        onClick?.(e);
        setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          inset && "pl-8",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

interface DropdownMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        onCheckedChange?.(!checked);
        onClick?.(e);
        setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitemcheckbox"
        aria-checked={checked}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

interface DropdownMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>(
  ({ className, children, value, disabled, onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);
    const subContext = React.useContext(SubMenuContext);
    const radioContext = React.useContext(RadioGroupContext);
    const isSelected = radioContext.value === value;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        radioContext.onValueChange?.(value);
        onClick?.(e);
        // Close submenu and parent menu
        subContext?.setOpen(false);
        setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitemradio"
        aria-checked={isSelected}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          isSelected && "bg-accent/50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected ? <Check className="h-4 w-4" /> : <Circle className="h-2 w-2 opacity-0" />}
        </span>
        {children}
      </div>
    );
  }
);
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, children, onClick, ...props }, ref) => {
    const subContext = React.useContext(SubMenuContext);
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      subContext?.setAnchorEl(e.currentTarget);
      subContext?.setOpen(!subContext.open);
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent",
          inset && "pl-8",
          subContext?.open && "bg-accent",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
    );
  }
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const subContext = React.useContext(SubMenuContext);
    const { setOpen: setParentOpen } = React.useContext(DropdownMenuContext);
    
    if (!subContext?.open || !subContext.anchorEl) return null;

    return (
      <Popper
        open={subContext.open}
        anchorEl={subContext.anchorEl}
        placement="right-start"
        style={{ zIndex: 10000 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ]}
      >
        <Fade in={subContext.open} timeout={150}>
          <Paper
            elevation={8}
            sx={{
              backgroundColor: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.375rem',
              minWidth: '8rem',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <ClickAwayListener onClickAway={() => subContext.setOpen(false)}>
              <div
                ref={ref}
                className={cn("p-1", className)}
                {...props}
              >
                {children}
              </div>
            </ClickAwayListener>
          </Paper>
        </Fade>
      </Popper>
    );
  }
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
