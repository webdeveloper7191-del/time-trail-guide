import React from 'react';
import MuiTabs, { TabsProps as MuiTabsProps } from '@mui/material/Tabs';
import MuiTab, { TabProps as MuiTabProps } from '@mui/material/Tab';
import Box from '@mui/material/Box';

export interface TabsProps extends Omit<MuiTabsProps, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.SyntheticEvent, value: string) => void;
}

export function Tabs({ 
  value, 
  defaultValue, 
  onValueChange,
  onChange,
  children, 
  ...props 
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    onChange?.(event, newValue);
  };

  return (
    <MuiTabs
      value={currentValue}
      onChange={handleChange}
      {...props}
    >
      {children}
    </MuiTabs>
  );
}

export interface TabProps extends MuiTabProps {
  value: string;
}

export function Tab({ value, ...props }: TabProps) {
  return <MuiTab value={value} {...props} />;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  currentValue: string;
  keepMounted?: boolean;
}

export function TabPanel({ children, value, currentValue, keepMounted = false }: TabPanelProps) {
  const isActive = value === currentValue;
  
  if (!keepMounted && !isActive) {
    return null;
  }

  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
    >
      {(isActive || keepMounted) && children}
    </Box>
  );
}

// Aliases for compatibility
export const TabsList = Tabs;
export const TabsTrigger = Tab;
export const TabsContent = TabPanel;
