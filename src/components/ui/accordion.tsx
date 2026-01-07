import * as React from "react";
import { Accordion as MuiAccordion, AccordionSummary, AccordionDetails, Collapse } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  type: 'single' | 'multiple';
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  type: 'single',
});

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  toggle: () => void;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  value: '',
  isOpen: false,
  toggle: () => {},
});

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', value, defaultValue, onValueChange, collapsible = false, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'multiple' ? [] : '')
    );
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleValueChange = (newValue: string | string[]) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <AccordionContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, type, collapsible }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, type, collapsible } = React.useContext(AccordionContext);
    
    const isOpen = type === 'multiple' 
      ? Array.isArray(selectedValue) && selectedValue.includes(value)
      : selectedValue === value;
    
    const toggle = () => {
      if (disabled) return;
      
      if (type === 'multiple') {
        const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
        const newValues = isOpen
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        onValueChange?.(newValues);
      } else {
        if (isOpen && collapsible) {
          onValueChange?.('');
        } else {
          onValueChange?.(value);
        }
      }
    };

    return (
      <AccordionItemContext.Provider value={{ value, isOpen, toggle }}>
        <div 
          ref={ref} 
          data-state={isOpen ? 'open' : 'closed'}
          className={cn("border-b", className)} 
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, toggle } = React.useContext(AccordionItemContext);

    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          data-state={isOpen ? 'open' : 'closed'}
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
            className
          )}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
      </div>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = React.useContext(AccordionItemContext);

    return (
      <Collapse in={isOpen}>
        <div
          ref={ref}
          data-state={isOpen ? 'open' : 'closed'}
          className="overflow-hidden text-sm"
          {...props}
        >
          <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </div>
      </Collapse>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };