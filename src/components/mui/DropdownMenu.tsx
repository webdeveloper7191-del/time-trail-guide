import React from 'react';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Box, Typography, Radio } from '@mui/material';
import { ChevronRight, Check } from 'lucide-react';

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

// Submenu components
interface SubMenuContextType {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
}

const SubMenuContext = React.createContext<SubMenuContextType | undefined>(undefined);

export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <SubMenuContext.Provider value={{ anchorEl, open, handleOpen, handleClose }}>
      {children}
    </SubMenuContext.Provider>
  );
}

export interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropdownMenuSubTrigger({ children, disabled }: DropdownMenuSubTriggerProps) {
  const context = React.useContext(SubMenuContext);
  if (!context) throw new Error('DropdownMenuSubTrigger must be used within DropdownMenuSub');

  return (
    <MenuItem
      onClick={context.handleOpen}
      disabled={disabled}
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {children}
      </Box>
      <ChevronRight size={16} style={{ opacity: 0.5, marginLeft: 8 }} />
    </MenuItem>
  );
}

export interface DropdownMenuSubContentProps {
  children: React.ReactNode;
}

export function DropdownMenuSubContent({ children }: DropdownMenuSubContentProps) {
  const subContext = React.useContext(SubMenuContext);
  const parentContext = React.useContext(DropdownMenuContext);
  
  if (!subContext) throw new Error('DropdownMenuSubContent must be used within DropdownMenuSub');

  const handleClose = () => {
    subContext.handleClose();
  };

  return (
    <Menu
      anchorEl={subContext.anchorEl}
      open={subContext.open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            ml: 0.5,
            minWidth: 160,
          },
        },
      }}
    >
      {children}
    </Menu>
  );
}

// Radio group components for submenus
interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined);

export interface DropdownMenuRadioGroupProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}

export function DropdownMenuRadioGroup({ children, value, onValueChange }: DropdownMenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      {children}
    </RadioGroupContext.Provider>
  );
}

export interface DropdownMenuRadioItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export function DropdownMenuRadioItem({ children, value, disabled }: DropdownMenuRadioItemProps) {
  const radioContext = React.useContext(RadioGroupContext);
  const subContext = React.useContext(SubMenuContext);
  const parentContext = React.useContext(DropdownMenuContext);
  
  if (!radioContext) throw new Error('DropdownMenuRadioItem must be used within DropdownMenuRadioGroup');

  const isSelected = radioContext.value === value;

  const handleClick = () => {
    radioContext.onValueChange(value);
    // Close both the submenu and parent menu
    subContext?.handleClose();
    parentContext?.handleClose();
  };

  return (
    <MenuItem
      onClick={handleClick}
      disabled={disabled}
      selected={isSelected}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        pl: 1,
      }}
    >
      <Box sx={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSelected && <Check size={14} />}
      </Box>
      {children}
    </MenuItem>
  );
}

export { Menu, MenuItem, Divider, ListItemIcon, ListItemText };
