import * as React from "react";
import { Slider as MuiSlider, SliderProps as MuiSliderProps } from "@mui/material";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<MuiSliderProps, 'value' | 'onChange'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const handleChange = (_event: Event, newValue: number | number[]) => {
      if (onValueChange) {
        onValueChange(Array.isArray(newValue) ? newValue : [newValue]);
      }
    };

    return (
      <MuiSlider
        ref={ref}
        value={value ? value[0] : undefined}
        onChange={handleChange}
        className={cn("w-full", className)}
        sx={{
          height: 8,
          '& .MuiSlider-track': {
            border: 'none',
            backgroundColor: 'hsl(var(--primary))',
          },
          '& .MuiSlider-rail': {
            backgroundColor: 'hsl(var(--secondary))',
            opacity: 1,
          },
          '& .MuiSlider-thumb': {
            height: 20,
            width: 20,
            backgroundColor: 'hsl(var(--background))',
            border: '2px solid hsl(var(--primary))',
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: 'inherit',
            },
          },
        }}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };