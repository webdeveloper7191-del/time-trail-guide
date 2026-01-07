import * as React from "react";
import { Switch as MuiSwitch, SwitchProps as MuiSwitchProps } from "@mui/material";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<MuiSwitchProps, 'checked'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
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
      <MuiSwitch
        ref={ref}
        checked={checked}
        onChange={handleChange}
        className={cn(className)}
        sx={{
          width: 44,
          height: 24,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: '2px',
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: 'hsl(var(--primary))',
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 20,
            height: 20,
          },
          '& .MuiSwitch-track': {
            borderRadius: 12,
            backgroundColor: 'hsl(var(--input))',
            opacity: 1,
          },
        }}
        {...props}
      />
    );
  }
);
Switch.displayName = "Switch";

export { Switch };