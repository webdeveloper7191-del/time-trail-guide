import * as React from "react";
import { Menu, MenuItem, Divider, ListItemIcon, ListItemText, MenuList, Paper, Popper, ClickAwayListener } from "@mui/material";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuContextValue {
  open: boolean;
  position: { x: number; y: number } | null;
  setOpen: (open: boolean) => void;
  setPosition: (position: { x: number; y: number } | null) => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | undefined>(undefined);

const useContextMenuContext = () => {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error("ContextMenu components must be used within a ContextMenu");
  }
  return context;
};

interface ContextMenuProps {
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);

  return (
    <ContextMenuContext.Provider value={{ open, position, setOpen, setPosition }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

const ContextMenuTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, onContextMenu, ...props }, ref) => {
  const { setOpen, setPosition } = useContextMenuContext();

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setOpen(true);
    onContextMenu?.(e);
  };

  return (
    <div ref={ref} onContextMenu={handleContextMenu} {...props}>
      {children}
    </div>
  );
});
ContextMenuTrigger.displayName = "ContextMenuTrigger";

const ContextMenuGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const ContextMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const ContextMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const ContextMenuRadioGroup: React.FC<{ children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }> = ({ children }) => <>{children}</>;

interface ContextMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const ContextMenuSubTrigger = React.forwardRef<HTMLDivElement, ContextMenuSubTriggerProps>(
  ({ className, inset, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  )
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

const ContextMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      className,
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = "ContextMenuSubContent";

const ContextMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, position, setOpen } = useContextMenuContext();

  if (!open || !position) return null;

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Paper
        ref={ref}
        className={cn(
          "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className,
        )}
        style={{ left: position.x, top: position.y }}
        elevation={8}
        sx={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
        {...props}
      >
        {children}
      </Paper>
    </ClickAwayListener>
  );
});
ContextMenuContent.displayName = "ContextMenuContent";

interface ContextMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  disabled?: boolean;
}

const ContextMenuItem = React.forwardRef<HTMLDivElement, ContextMenuItemProps>(
  ({ className, inset, disabled, onClick, ...props }, ref) => {
    const { setOpen } = useContextMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        onClick?.(e);
        setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          inset && "pl-8",
          className,
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
ContextMenuItem.displayName = "ContextMenuItem";

interface ContextMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const ContextMenuCheckboxItem = React.forwardRef<HTMLDivElement, ContextMenuCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, onClick, ...props }, ref) => {
    const { setOpen } = useContextMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onCheckedChange?.(!checked);
      onClick?.(e);
      setOpen(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className,
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
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

interface ContextMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const ContextMenuRadioItem = React.forwardRef<HTMLDivElement, ContextMenuRadioItemProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Circle className="h-2 w-2 fill-current" />
      </span>
      {children}
    </div>
  )
);
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const ContextMenuLabel = React.forwardRef<HTMLDivElement, ContextMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
      {...props}
    />
  )
);
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
