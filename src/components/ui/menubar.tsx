import * as React from "react";
import { Menu, MenuItem, Divider, Paper, Popper, Fade, ClickAwayListener } from "@mui/material";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenubarContextValue {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

const MenubarContext = React.createContext<MenubarContextValue | undefined>(undefined);

interface MenuContextValue {
  menuId: string;
  open: boolean;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const MenuContext = React.createContext<MenuContextValue | undefined>(undefined);

const useMenubarContext = () => {
  const context = React.useContext(MenubarContext);
  if (!context) {
    throw new Error("Menubar components must be used within a Menubar");
  }
  return context;
};

const useMenuContext = () => {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be used within a MenubarMenu");
  }
  return context;
};

const Menubar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  return (
    <MenubarContext.Provider value={{ activeMenu, setActiveMenu }}>
      <div
        ref={ref}
        className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)}
        {...props}
      >
        {children}
      </div>
    </MenubarContext.Provider>
  );
});
Menubar.displayName = "Menubar";

interface MenubarMenuProps {
  children: React.ReactNode;
}

const MenubarMenu: React.FC<MenubarMenuProps> = ({ children }) => {
  const menuId = React.useId();
  const { activeMenu } = useMenubarContext();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = activeMenu === menuId;

  return (
    <MenuContext.Provider value={{ menuId, open, anchorEl, setAnchorEl }}>
      {children}
    </MenuContext.Provider>
  );
};

const MenubarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarRadioGroup: React.FC<{ children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }> = ({ children }) => <>{children}</>;

const MenubarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setActiveMenu } = useMenubarContext();
  const { menuId, open, setAnchorEl } = useMenuContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    setActiveMenu(open ? null : menuId);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        open && "bg-accent text-accent-foreground",
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  );
});
MenubarTrigger.displayName = "MenubarTrigger";

interface MenubarSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const MenubarSubTrigger = React.forwardRef<HTMLDivElement, MenubarSubTriggerProps>(
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
MenubarSubTrigger.displayName = "MenubarSubTrigger";

const MenubarSubContent = React.forwardRef<
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
MenubarSubContent.displayName = "MenubarSubContent";

const MenubarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { setActiveMenu } = useMenubarContext();
  const { open, anchorEl } = useMenuContext();

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      sx={{ zIndex: 50 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={150}>
          <ClickAwayListener onClickAway={() => setActiveMenu(null)}>
            <Paper
              ref={ref}
              className={cn(
                "min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                className,
              )}
              sx={{ 
                backgroundColor: 'hsl(var(--popover))', 
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))'
              }}
              {...props}
            >
              {children}
            </Paper>
          </ClickAwayListener>
        </Fade>
      )}
    </Popper>
  );
});
MenubarContent.displayName = "MenubarContent";

interface MenubarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  disabled?: boolean;
}

const MenubarItem = React.forwardRef<HTMLDivElement, MenubarItemProps>(
  ({ className, inset, disabled, onClick, ...props }, ref) => {
    const { setActiveMenu } = useMenubarContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        onClick?.(e);
        setActiveMenu(null);
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
MenubarItem.displayName = "MenubarItem";

interface MenubarCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const MenubarCheckboxItem = React.forwardRef<HTMLDivElement, MenubarCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, onClick, ...props }, ref) => {
    const { setActiveMenu } = useMenubarContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onCheckedChange?.(!checked);
      onClick?.(e);
      setActiveMenu(null);
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
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

interface MenubarRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const MenubarRadioItem = React.forwardRef<HTMLDivElement, MenubarRadioItemProps>(
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
MenubarRadioItem.displayName = "MenubarRadioItem";

interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const MenubarLabel = React.forwardRef<HTMLDivElement, MenubarLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
);
MenubarLabel.displayName = "MenubarLabel";

const MenubarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
MenubarSeparator.displayName = "MenubarSeparator";

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
MenubarShortcut.displayName = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
