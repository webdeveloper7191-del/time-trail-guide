import * as React from "react";
import { Dialog as MuiDialog, IconButton, Fade, Backdrop } from "@mui/material";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({ open: false, onOpenChange: () => {} });

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  modal?: boolean;
}

const Dialog = ({ open = false, onOpenChange = () => {}, children, modal = true }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    
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
DialogTrigger.displayName = "DialogTrigger";

const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    
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
DialogClose.displayName = "DialogClose";

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => null
);
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);
    
    return (
      <MuiDialog
        open={open}
        onClose={() => onOpenChange(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderRadius: '0.5rem',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }
          }
        }}
      >
        <div ref={ref} className={cn("relative p-6", className)} {...props}>
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
      </MuiDialog>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};