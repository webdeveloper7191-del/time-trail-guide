import * as React from "react";
import { Drawer, IconButton } from "@mui/material";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, onOpenChange: () => {} });

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  modal?: boolean;
}

const Sheet = ({ open = false, onOpenChange = () => {}, children, modal = true }: SheetProps) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(SheetContext);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(true);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { ref, onClick: handleClick, ...props });
    }
    return <button ref={ref} onClick={handleClick} {...props}>{children}</button>;
  }
);
SheetTrigger.displayName = "SheetTrigger";

const SheetClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(SheetContext);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(false);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { ref, onClick: handleClick, ...props });
    }
    return <button ref={ref} onClick={handleClick} {...props}>{children}</button>;
  }
);
SheetClose.displayName = "SheetClose";

const SheetPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SheetOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => null
);
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, style, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(SheetContext);
    
    const anchor = side === 'left' ? 'left' : side === 'top' ? 'top' : side === 'bottom' ? 'bottom' : 'right';
    
    // Parse width from className - use conservative widths that won't overflow
    const getWidthFromClassName = (className: string | undefined) => {
      if (!className) return { xs: '100%', sm: '450px' };
      
      if (className.includes('max-w-3xl')) return { xs: '100%', sm: '550px', md: '650px' };
      if (className.includes('max-w-2xl')) return { xs: '100%', sm: '500px', md: '580px' };
      if (className.includes('max-w-xl')) return { xs: '100%', sm: '450px', md: '520px' };
      if (className.includes('max-w-lg')) return { xs: '100%', sm: '420px', md: '480px' };
      if (className.includes('max-w-md')) return { xs: '100%', sm: '380px', md: '420px' };
      
      return { xs: '100%', sm: '450px' };
    };
    
    const widthConfig = side === 'left' || side === 'right' 
      ? getWidthFromClassName(className) 
      : '100%';
    
    return (
      <Drawer
        anchor={anchor}
        open={open}
        onClose={() => onOpenChange(false)}
        PaperProps={{
          sx: {
            width: widthConfig,
            maxWidth: '100vw',
            height: side === 'top' || side === 'bottom' ? 'auto' : '100%',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderLeft: side === 'right' ? '1px solid hsl(var(--border))' : undefined,
            borderRight: side === 'left' ? '1px solid hsl(var(--border))' : undefined,
            borderTop: side === 'bottom' ? '1px solid hsl(var(--border))' : undefined,
            borderBottom: side === 'top' ? '1px solid hsl(var(--border))' : undefined,
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          }
        }}
      >
        <div
          ref={ref}
          className={cn("relative h-full flex flex-col overflow-hidden", className)}
          style={style}
          {...props}
        >
          {children}
          <IconButton
            onClick={() => onOpenChange(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'hsl(var(--muted-foreground))',
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
            }}
            size="small"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </Drawer>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-left pb-4 border-b border-border mb-4 shrink-0", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-row justify-end gap-3 pt-4 border-t border-border mt-auto shrink-0", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-xl font-semibold text-foreground tracking-tight", className)} {...props} />
  )
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};