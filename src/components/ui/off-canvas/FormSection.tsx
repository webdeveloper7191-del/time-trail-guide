import React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FormSectionProps {
  title: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormSection - A styled section container for forms in off-canvas drawers.
 * Features a colored left border and light background header matching the design system.
 */
export function FormSection({ title, tooltip, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Header - Clean style matching reference */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-primary/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {/* Section Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField - A styled form field wrapper with label, tooltip, and error display.
 * Labels are styled in primary color to match the design reference.
 */
export function FormField({ label, required, tooltip, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-[hsl(var(--destructive))] ml-0.5">*</span>}
        </label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {/* Input wrapper with white background */}
      <div className="[&_input]:bg-background [&_input]:border-border [&_textarea]:bg-background [&_textarea]:border-border [&_button[role=combobox]]:bg-background [&_button[role=combobox]]:border-border">
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface FormRowProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * FormRow - A responsive grid row for form fields.
 * Stacks on mobile, shows multiple columns on larger screens.
 */
export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const gridClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridClass, className)}>
      {children}
    </div>
  );
}

interface FormActionsRowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormActionsRow - A row for inline action buttons within a section.
 */
export function FormActionsRow({ children, className }: FormActionsRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

export default FormSection;
