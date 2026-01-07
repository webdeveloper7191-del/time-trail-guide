import * as React from "react";
import { Popper, Paper, Fade, ClickAwayListener } from "@mui/material";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationMenuContextValue {
  activeItem: string | null;
  setActiveItem: (item: string | null) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const NavigationMenuContext = React.createContext<NavigationMenuContextValue | undefined>(undefined);

const useNavigationMenuContext = () => {
  const context = React.useContext(NavigationMenuContext);
  if (!context) {
    throw new Error("NavigationMenu components must be used within a NavigationMenu");
  }
  return context;
};

const NavigationMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [activeItem, setActiveItem] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <NavigationMenuContext.Provider value={{ activeItem, setActiveItem, anchorEl, setAnchorEl }}>
      <nav
        ref={ref}
        className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
        {...props}
      >
        {children}
        <NavigationMenuViewport />
      </nav>
    </NavigationMenuContext.Provider>
  );
});
NavigationMenu.displayName = "NavigationMenu";

const NavigationMenuList = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = "NavigationMenuList";

interface NavigationMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  value?: string;
}

const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  ({ className, value, ...props }, ref) => (
    <li ref={ref} className={cn("relative", className)} data-value={value} {...props} />
  )
);
NavigationMenuItem.displayName = "NavigationMenuItem";

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
);

const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { activeItem, setActiveItem, setAnchorEl } = useNavigationMenuContext();
  const itemId = React.useId();
  const isActive = activeItem === itemId;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget.parentElement);
    setActiveItem(isActive ? null : itemId);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      onClick={handleClick}
      data-state={isActive ? "open" : "closed"}
      {...props}
    >
      {children}{" "}
      <ChevronDown
        className={cn(
          "relative top-[1px] ml-1 h-3 w-3 transition duration-200",
          isActive && "rotate-180"
        )}
        aria-hidden="true"
      />
    </button>
  );
});
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { activeItem, setActiveItem, anchorEl } = useNavigationMenuContext();
  const isOpen = activeItem !== null && anchorEl !== null;

  return (
    <div
      ref={ref}
      className={cn(
        "left-0 top-0 w-full md:absolute md:w-auto",
        !isOpen && "hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
NavigationMenuContent.displayName = "NavigationMenuContent";

interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  ({ className, active, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        navigationMenuTriggerStyle(),
        active && "bg-accent/50",
        className
      )}
      {...props}
    />
  )
);
NavigationMenuLink.displayName = "NavigationMenuLink";

const NavigationMenuViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { activeItem, anchorEl, setActiveItem } = useNavigationMenuContext();
  const isOpen = activeItem !== null;

  if (!isOpen) return null;

  return (
    <Popper
      open={isOpen}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      sx={{ zIndex: 50 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <ClickAwayListener onClickAway={() => setActiveItem(null)}>
            <Paper
              ref={ref}
              className={cn(
                "origin-top-center relative mt-1.5 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg",
                className,
              )}
              sx={{ 
                backgroundColor: 'hsl(var(--popover))', 
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))'
              }}
              {...props}
            />
          </ClickAwayListener>
        </Fade>
      )}
    </Popper>
  );
});
NavigationMenuViewport.displayName = "NavigationMenuViewport";

const NavigationMenuIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { activeItem } = useNavigationMenuContext();
  const isVisible = activeItem !== null;

  return (
    <div
      ref={ref}
      className={cn(
        "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden transition-all",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </div>
  );
});
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
