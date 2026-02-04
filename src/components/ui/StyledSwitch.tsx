import React from 'react';
import { Switch, FormControlLabel, Typography, SxProps, Theme } from '@mui/material';

interface StyledSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

/**
 * StyledSwitch - A consistently styled switch component with proper spacing and colors.
 * Uses the design system's primary color for the switch when checked.
 */
export function StyledSwitch({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  size = 'medium',
  sx,
}: StyledSwitchProps) {
  const switchElement = (
    <Switch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      size={size}
      sx={{
        mr: label ? 1.5 : 0, // Space between switch and label only if label exists
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: 'hsl(var(--primary))',
          '& + .MuiSwitch-track': {
            backgroundColor: 'hsl(var(--primary))',
            opacity: 0.7,
          },
        },
        '& .MuiSwitch-track': {
          borderRadius: 12,
        },
      }}
    />
  );

  // If no label, just return the switch
  if (!label) {
    return switchElement;
  }

  return (
    <FormControlLabel
      control={switchElement}
      label={
        <Typography 
          variant="body1" 
          fontWeight={500} 
          color="text.primary"
          sx={{ 
            fontSize: size === 'small' ? '0.875rem' : '1rem',
          }}
        >
          {label}
        </Typography>
      }
      sx={{ ml: 0, ...sx }}
      disabled={disabled}
    />
  );
}

export default StyledSwitch;
