import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeftRight, Search, Clock, MapPin, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShiftItem {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  role: string;
  status: 'confirmed' | 'pending';
  pickedUp?: boolean;
  premium?: boolean;
  rate?: string;
}

interface SwapCandidate {
  id: string;
  name: string;
  role: string;
  shift: ShiftItem;
  avatar?: string;
}

interface ShiftSwapRequestDialogProps {
  open: boolean;
  onClose: () => void;
  shift: ShiftItem | null;
  onSubmitSwap: (fromShiftId: string, toStaffId: string, reason: string) => void;
}

// Mock colleagues with shifts available for swapping
const mockColleagues: SwapCandidate[] = [
  {
    id: 'col-1', name: 'James Wilson', role: 'Line Cook',
    shift: { id: 'cs-1', date: new Date(Date.now() + 86400000), startTime: '14:00', endTime: '22:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' },
  },
  {
    id: 'col-2', name: 'Maria Garcia', role: 'Sous Chef',
    shift: { id: 'cs-2', date: new Date(Date.now() + 86400000 * 2), startTime: '06:00', endTime: '14:00', location: 'Events Hall', role: 'Sous Chef', status: 'confirmed' },
  },
  {
    id: 'col-3', name: 'Alex Thompson', role: 'Line Cook',
    shift: { id: 'cs-3', date: new Date(Date.now() + 86400000 * 3), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook', status: 'confirmed' },
  },
  {
    id: 'col-4', name: 'Emily Park', role: 'Server',
    shift: { id: 'cs-4', date: new Date(Date.now() + 86400000), startTime: '10:00', endTime: '18:00', location: 'Poolside Bar', role: 'Server', status: 'confirmed' },
  },
];

export function ShiftSwapRequestDialog({ open, onClose, shift, onSubmitSwap }: ShiftSwapRequestDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleagueId, setSelectedColleagueId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredColleagues = useMemo(() => {
    return mockColleagues.filter(c => {
      if (!searchQuery) return true;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             c.role.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const selectedColleague = mockColleagues.find(c => c.id === selectedColleagueId);

  const handleSubmit = () => {
    if (!shift || !selectedColleagueId) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmitSwap(shift.id, selectedColleagueId, reason);
      setSubmitting(false);
      setSearchQuery('');
      setSelectedColleagueId(null);
      setReason('');
      onClose();
      toast.success(
        `Swap Request Sent — Waiting for ${selectedColleague?.name} to accept your swap request.`
      );
    }, 600);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedColleagueId(null);
    setReason('');
    onClose();
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Request Shift Swap
          </DialogTitle>
          <DialogDescription>Select a colleague to swap shifts with. They'll receive a notification to accept or decline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Your shift */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Your Shift</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{format(shift.date, 'EEE, MMM d')}</p>
                <p className="text-xs text-muted-foreground">{shift.startTime} – {shift.endTime} • {shift.role}</p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {shift.location}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Colleague list */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {filteredColleagues.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">No colleagues found</p>
              ) : (
                filteredColleagues.map((colleague) => {
                  const isSelected = selectedColleagueId === colleague.id;
                  return (
                    <div
                      key={colleague.id}
                      onClick={() => setSelectedColleagueId(colleague.id)}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {colleague.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-medium', isSelected && 'text-primary')}>{colleague.name}</span>
                            {isSelected && (
                              <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{colleague.role}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium">{format(colleague.shift.date, 'EEE, MMM d')}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                            <Clock className="h-2.5 w-2.5" />
                            {colleague.shift.startTime} – {colleague.shift.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Why do you want to swap this shift?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview */}
          {selectedColleague && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Swap Preview: </span>
                You'll take {selectedColleague.name}'s {selectedColleague.shift.startTime} – {selectedColleague.shift.endTime} shift
                on {format(selectedColleague.shift.date, 'MMM d')}, and they'll take yours.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedColleagueId || submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Send Swap Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
