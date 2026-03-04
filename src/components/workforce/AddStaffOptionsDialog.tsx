import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Upload, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddStaffOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: 'onboarding' | 'csv' | 'manual') => void;
}

const options = [
  {
    id: 'onboarding' as const,
    icon: FileText,
    title: 'Paperless Onboarding',
    description: 'Send a digital onboarding invite. The new employee completes their details, tax forms, and documents online before their first day.',
    badge: 'Recommended',
  },
  {
    id: 'csv' as const,
    icon: Upload,
    title: 'CSV Import',
    description: 'Bulk import staff from a CSV or Excel file. Map columns to fields with smart auto-detection and validation.',
    badge: null,
  },
  {
    id: 'manual' as const,
    icon: UserPlus,
    title: 'Add Manually',
    description: 'Create a staff profile directly. Onboarding is skipped and login credentials are issued immediately.',
    badge: null,
  },
];

export function AddStaffOptionsDialog({ open, onOpenChange, onSelectOption }: AddStaffOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Add Staff</DialogTitle>
          <DialogDescription>Choose how you'd like to add new team members</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelectOption(opt.id);
                onOpenChange(false);
              }}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl border border-border/60 text-left",
                "hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
              )}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <opt.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{opt.title}</span>
                  {opt.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
