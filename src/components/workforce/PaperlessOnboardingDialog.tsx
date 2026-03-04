import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, X, CheckCircle2, Mail } from 'lucide-react';
import { departments, locations } from '@/data/mockStaffData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Invite {
  email: string;
  role: string;
  department: string;
  location: string;
}

interface PaperlessOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = ['Support Worker', 'Team Leader', 'Room Leader', 'Centre Manager', 'Educator', 'Cook', 'Administrator'];

export function PaperlessOnboardingDialog({ open, onOpenChange }: PaperlessOnboardingDialogProps) {
  const [invites, setInvites] = useState<Invite[]>([{ email: '', role: '', department: '', location: '' }]);
  const [personalMessage, setPersonalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const updateInvite = (index: number, field: keyof Invite, value: string) => {
    setInvites(prev => prev.map((inv, i) => i === index ? { ...inv, [field]: value } : inv));
  };

  const addInvite = () => {
    setInvites(prev => [...prev, { email: '', role: '', department: '', location: '' }]);
  };

  const removeInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(prev => prev.filter((_, i) => i !== index));
    }
  };

  const isValid = invites.every(inv => inv.email.includes('@') && inv.role && inv.department && inv.location);

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    toast.success(`${invites.length} onboarding invite${invites.length > 1 ? 's' : ''} sent successfully`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setInvites([{ email: '', role: '', department: '', location: '' }]);
      setPersonalMessage('');
      setSent(false);
    }, 300);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Invites Sent!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {invites.length} onboarding invite{invites.length > 1 ? 's have' : ' has'} been sent. 
                New employees will receive an email with a link to complete their profile, tax forms, and documents.
              </p>
            </div>
            <div className="w-full space-y-2 mt-2">
              {invites.map((inv, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-medium truncate">{inv.email}</span>
                  <Badge variant="secondary" className="ml-auto shrink-0 text-xs">{inv.role}</Badge>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="mt-4 w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Paperless Onboarding</DialogTitle>
          <DialogDescription>
            Send digital onboarding invites. New employees complete their details, tax forms, and documents online.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Invite Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Invite Details</Label>
              <Badge variant="outline" className="text-xs">{invites.length} invite{invites.length > 1 ? 's' : ''}</Badge>
            </div>

            {invites.map((invite, index) => (
              <div key={index} className="relative p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                {invites.length > 1 && (
                  <button
                    onClick={() => removeInvite(index)}
                    className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="employee@example.com"
                      value={invite.email}
                      onChange={(e) => updateInvite(index, 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Role / Position</Label>
                    <Select value={invite.role} onValueChange={(v) => updateInvite(index, 'role', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Department</Label>
                    <Select value={invite.department} onValueChange={(v) => updateInvite(index, 'department', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Location</Label>
                    <Select value={invite.location} onValueChange={(v) => updateInvite(index, 'location', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addInvite} className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Invite
            </Button>
          </div>

          {/* Personal Message */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Personal Message (optional)</Label>
            <Textarea
              placeholder="Add a welcome message to include in the onboarding email..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* What They'll Complete */}
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">THE NEW EMPLOYEE WILL COMPLETE:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Personal details', 'Emergency contacts', 'Bank & super details', 'Tax file declaration', 'Upload ID & documents', 'Accept policies'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!isValid || sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : `Send ${invites.length > 1 ? `${invites.length} Invites` : 'Invite'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
