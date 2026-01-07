import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MuiSelect, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import ListSubheader from '@mui/material/ListSubheader';
import { Typography } from '@mui/material';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options?: SelectOption[];
  helperText?: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  onValueChange?: (value: string) => void;
  onChange?: (event: SelectChangeEvent<string>) => void;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ 
    label, 
    options = [], 
    helperText, 
    error, 
    fullWidth = true, 
    size = 'small',
    onValueChange,
    onChange,
    value = '',
    placeholder,
    disabled,
    children,
    className,
    id,
    name,
  }, ref) => {
    const handleChange = (event: SelectChangeEvent<string>) => {
      if (onValueChange) {
        onValueChange(event.target.value);
      }
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <FormControl fullWidth={fullWidth} error={error} size={size} ref={ref} className={className}>
        {label && <InputLabel id={`${id || name}-label`}>{label}</InputLabel>}
        <MuiSelect
          labelId={label ? `${id || name}-label` : undefined}
          id={id}
          name={name}
          label={label}
          value={value}
          onChange={handleChange}
          displayEmpty={!!placeholder}
          disabled={disabled}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              <Typography color="text.secondary">{placeholder}</Typography>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </MenuItem>
          ))}
          {children}
        </MuiSelect>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }
);

Select.displayName = 'Select';

// Simple wrapper components for compatibility
export const SelectGroup = ListSubheader;
export const SelectItem = MenuItem;

export { FormControl, InputLabel, MenuItem, FormHelperText, ListSubheader };
export type { SelectChangeEvent };
