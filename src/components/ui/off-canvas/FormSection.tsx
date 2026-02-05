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
   /** Use card style with border - matches reference UI design */
   variant?: 'default' | 'card';
}

/**
 * FormSection - A styled section container for forms in off-canvas drawers.
 * Features bold section headers with optional info tooltip, matching the reference design.
 */
 export function FormSection({ title, tooltip, children, className, variant = 'default' }: FormSectionProps) {
   const isCard = variant === 'card';
 
  return (
     <div className={cn(
       "space-y-4",
       isCard && "bg-background rounded-lg border border-border p-4 border-l-4 border-l-primary",
       className
     )}>
      {/* Section Header - Bold black text with cyan info icon */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
   /** Use subtle label style without primary color */
   labelVariant?: 'primary' | 'subtle';
}

/**
 * FormField - A styled form field wrapper with label, tooltip, and error display.
 * Labels are styled in PRIMARY/cyan color matching the reference design.
 */
 export function FormField({ label, required, tooltip, error, children, className, labelVariant = 'primary' }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label row - Primary/cyan colored label with red asterisk and info icon */}
      <div className="flex items-center gap-1">
         <label className={cn(
           "text-sm font-medium",
           labelVariant === 'primary' ? "text-primary" : "text-foreground"
         )}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-primary cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {/* Input - white background with subtle border */}
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

/**
 * FormQuestionLabel - A question-style header for form sections
 * Used for questions like "Who is this unavailability for?"
 */
interface FormQuestionLabelProps {
  question: string;
  required?: boolean;
  tooltip?: string;
  className?: string;
}

export function FormQuestionLabel({ question, required, tooltip, className }: FormQuestionLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-base font-semibold text-foreground">
        {question}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
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
  );
}

export default FormSection;
