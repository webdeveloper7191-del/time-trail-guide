import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import IconButton, { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import { CircularProgress } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'contained' | 'outlined' | 'text';
  loading?: boolean;
  asChild?: boolean;
}

const variantMap: Record<string, { muiVariant: MuiButtonProps['variant']; color?: MuiButtonProps['color']; sx?: object }> = {
  default: { muiVariant: 'contained', color: 'primary' },
  destructive: { muiVariant: 'contained', color: 'error' },
  outline: { muiVariant: 'outlined', color: 'primary' },
  secondary: { muiVariant: 'contained', color: 'secondary' },
  ghost: { muiVariant: 'text', color: 'inherit', sx: { '&:hover': { backgroundColor: 'action.hover' } } },
  link: { muiVariant: 'text', color: 'primary', sx: { textDecoration: 'underline', '&:hover': { textDecoration: 'underline' } } },
  contained: { muiVariant: 'contained', color: 'primary' },
  outlined: { muiVariant: 'outlined', color: 'primary' },
  text: { muiVariant: 'text', color: 'primary' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', loading, disabled, children, sx, ...props }, ref) => {
    const mappedVariant = variantMap[variant] || variantMap.default;

    return (
      <MuiButton
        ref={ref}
        variant={mappedVariant.muiVariant}
        color={mappedVariant.color}
        disabled={disabled || loading}
        sx={{ ...mappedVariant.sx, ...sx }}
        {...props}
      >
        {loading && <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />}
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

// Icon Button wrapper
export interface IconButtonWrapperProps extends MuiIconButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
}

export const IconButtonWrapper = React.forwardRef<HTMLButtonElement, IconButtonWrapperProps>(
  ({ variant = 'ghost', sx, ...props }, ref) => {
    const variantStyles = {
      default: {},
      ghost: { '&:hover': { backgroundColor: 'action.hover' } },
      outline: { border: 1, borderColor: 'divider' },
    };

    return (
      <IconButton
        ref={ref}
        sx={{ ...variantStyles[variant], ...sx }}
        {...props}
      />
    );
  }
);

IconButtonWrapper.displayName = 'IconButtonWrapper';

export { IconButton };
