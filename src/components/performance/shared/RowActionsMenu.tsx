import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive' | 'warning';
  disabled?: boolean;
  separator?: boolean; // If true, adds separator before this item
}

interface RowActionsMenuProps {
  actions: RowAction[];
  size?: 'sm' | 'default';
  align?: 'start' | 'center' | 'end';
}

/**
 * Reusable 3-dot actions menu for table rows.
 * Provides consistent action menus across all Performance module tables.
 */
export function RowActionsMenu({
  actions,
  size = 'sm',
  align = 'end',
}: RowActionsMenuProps) {
  if (actions.length === 0) return null;

  const handleClick = (action: RowAction, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick(e);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'icon' : 'default'}
          className={size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => (
          <React.Fragment key={action.label}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => handleClick(action, e)}
              disabled={action.disabled}
              className={
                action.variant === 'destructive'
                  ? 'text-destructive focus:text-destructive'
                  : action.variant === 'warning'
                  ? 'text-amber-600 focus:text-amber-600'
                  : ''
              }
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RowActionsMenu;
