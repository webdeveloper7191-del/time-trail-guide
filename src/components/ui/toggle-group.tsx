import * as React from "react";
import { ToggleButtonGroup } from "@mui/material";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

interface ToggleGroupContextValue extends VariantProps<typeof toggleVariants> {
  value?: string | string[];
  onValueChange?: (value: string) => void;
  type?: 'single' | 'multiple';
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
});

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleVariants> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, variant, size, type = 'single', value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'multiple' ? [] : '')
    );
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleValueChange = (itemValue: string) => {
      let newValue: string | string[];
      
      if (type === 'multiple') {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        if (currentArray.includes(itemValue)) {
          newValue = currentArray.filter(v => v !== itemValue);
        } else {
          newValue = [...currentArray, itemValue];
        }
      } else {
        newValue = currentValue === itemValue ? '' : itemValue;
      }
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <ToggleGroupContext.Provider value={{ variant, size, value: currentValue, onValueChange: handleValueChange, type }}>
        <div ref={ref} role="group" className={cn("flex items-center justify-center gap-1", className)} {...props}>
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleVariants> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, children, variant, size, value, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    
    const isPressed = context.type === 'multiple'
      ? Array.isArray(context.value) && context.value.includes(value)
      : context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isPressed}
        data-state={isPressed ? 'on' : 'off'}
        onClick={() => context.onValueChange?.(value)}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };