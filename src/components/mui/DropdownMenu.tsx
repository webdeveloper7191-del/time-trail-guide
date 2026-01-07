import React from 'react';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Box, Typography } from '@mui/material';

interface DropdownMenuContextType {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <DropdownMenuContext.Provider value={{ anchorEl, open, handleOpen, handleClose }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      context.handleOpen(e);
      children.props.onClick?.(e);
    },
    'aria-haspopup': 'true',
    'aria-expanded': context.open,
  });
}

export interface DropdownMenuContentProps extends Omit<MenuProps, 'open' | 'anchorEl' | 'onClose'> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
}

export function DropdownMenuContent({ 
  children, 
  align = 'start',
  sideOffset = 4,
  ...props 
}: DropdownMenuContentProps) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

  const transformOrigin = {
    start: 'left top',
    end: 'right top',
    center: 'center top',
  };

  return (
    <Menu
      anchorEl={context.anchorEl}
      open={context.open}
      onClose={context.handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: align === 'end' ? 'right' : align === 'center' ? 'center' : 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: align === 'end' ? 'right' : align === 'center' ? 'center' : 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            mt: `${sideOffset}px`,
            minWidth: 160,
          },
        },
      }}
      {...props}
    >
      {children}
    </Menu>
  );
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  disabled, 
  icon,
  destructive,
}: DropdownMenuItemProps) {
  const context = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    onClick?.();
    context?.handleClose();
  };

  return (
    <MenuItem 
      onClick={handleClick} 
      disabled={disabled}
      sx={destructive ? { color: 'error.main' } : undefined}
    >
      {icon && <ListItemIcon sx={destructive ? { color: 'error.main' } : undefined}>{icon}</ListItemIcon>}
      <ListItemText>{children}</ListItemText>
    </MenuItem>
  );
}

export function DropdownMenuSeparator() {
  return <Divider sx={{ my: 0.5 }} />;
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode;
}

export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {children}
      </Typography>
    </Box>
  );
}

export { Menu, MenuItem, Divider, ListItemIcon, ListItemText };
