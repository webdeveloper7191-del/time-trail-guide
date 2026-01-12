import * as React from "react";
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Popper,
  Paper,
  ClickAwayListener,
  Fade,
} from "@mui/material";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  displayValue?: React.ReactNode;
  setDisplayValue: (value: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
  setDisplayValue: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const Select = ({ value, onValueChange, defaultValue, children, disabled }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [displayValue, setDisplayValue] = React.useState<React.ReactNode>(null);

  const currentValue = value !== undefined ? value : internalValue;

  const findDisplayForValue = React.useCallback((node: React.ReactNode, target: string): React.ReactNode | null => {
    let found: React.ReactNode | null = null;

    React.Children.forEach(node, (child) => {
      if (found) return;
      if (!React.isValidElement(child)) return;

      // Match any element that looks like a SelectItem (has a string `value` prop)
      const childValue = (child.props as any)?.value;
      if (typeof childValue === 'string' && childValue === target) {
        found = (child.props as any)?.children ?? null;
        return;
      }

      const nested = (child.props as any)?.children;
      if (nested) {
        const nestedFound = findDisplayForValue(nested, target);
        if (nestedFound) found = nestedFound;
      }
    });

    return found;
  }, []);

  const computedDisplay = React.useMemo(() => {
    if (!currentValue) return null;
    return findDisplayForValue(children, currentValue);
  }, [children, currentValue, findDisplayForValue]);

  // Keep the display label in sync even when the menu is closed
  React.useEffect(() => {
    setDisplayValue(computedDisplay);
  }, [computedDisplay]);

  const handleChange = (newValue: string, display?: React.ReactNode) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    // Prefer provided display, but fall back to scanning children.
    setDisplayValue(display ?? findDisplayForValue(children, newValue));
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{
      value: currentValue,
      onValueChange: handleChange,
      open,
      setOpen,
      anchorEl,
      setAnchorEl,
      displayValue,
      setDisplayValue,
    }}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value, displayValue } = React.useContext(SelectContext);

  if (displayValue) {
    return <>{displayValue}</>;
  }

  if (value) {
    return <span>{value}</span>;
  }

  return <span className="text-muted-foreground">{placeholder}</span>;
};

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { open, setOpen, setAnchorEl } = React.useContext(SelectContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(e.currentTarget);
      setOpen(!open);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className,
        )}
        onClick={handleClick}
        aria-expanded={open}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
}

const SelectContent = ({ children, className, position = "popper" }: SelectContentProps) => {
  const { open, setOpen, anchorEl } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      style={{ zIndex: 9999, width: anchorEl?.offsetWidth }}
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
              mt: 0.5,
              overflow: 'hidden',
            }}
          >
            <ClickAwayListener onClickAway={() => setOpen(false)}>
              <div className={cn("max-h-96 overflow-auto p-1", className)}>
                {children}
              </div>
            </ClickAwayListener>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
  )
);
SelectLabel.displayName = "SelectLabel";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  /** Optional plain-text label used for the closed trigger display */
  textValue?: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, textValue, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setDisplayValue } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    const display = textValue ?? children;

    // Update display value when this item is selected (on mount or when selection changes)
    React.useEffect(() => {
      if (isSelected) {
        setDisplayValue(display);
      }
    }, [isSelected, display, setDisplayValue]);

    const handleClick = () => {
      if (!disabled) {
        setDisplayValue(display);
        onValueChange?.(value);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

interface SelectSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
);
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
