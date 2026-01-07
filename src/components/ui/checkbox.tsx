import * as React from "react";
import { Checkbox as MuiCheckbox, CheckboxProps as MuiCheckboxProps } from "@mui/material";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<MuiCheckboxProps, 'checked'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
      if (onChange) {
        onChange(event, event.target.checked);
      }
    };

    return (
      <MuiCheckbox
        ref={ref}
        checked={checked}
        onChange={handleChange}
        className={cn("h-4 w-4 shrink-0", className)}
        sx={{
          padding: 0,
          '&.Mui-checked': {
            color: 'hsl(var(--primary))',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 18,
          },
        }}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };