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
    <div className={cn("rounded-lg overflow-hidden border border-border/50", className)}>
      {/* Section Header */}
      <div className="bg-primary/5 border-l-[3px] border-l-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {/* Section Content */}
      <div className="p-4 space-y-4 bg-background">
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
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-primary">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-primary/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
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
