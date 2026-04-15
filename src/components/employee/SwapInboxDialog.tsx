import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight, Check, X, Clock, MapPin, MessageSquare, Inbox } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface SwapRequest {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'declined';
  fromStaff: { id: string; name: string; role: string };
  toStaff: { id: string; name: string; role: string };
  fromShift: { date: Date; startTime: string; endTime: string; location: string; role: string };
  toShift: { date: Date; startTime: string; endTime: string; location: string; role: string };
  reason?: string;
  createdAt: Date;
  respondedAt?: Date;
}

interface SwapInboxDialogProps {
  open: boolean;
  onClose: () => void;
  requests: SwapRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function SwapInboxDialog({ open, onClose, requests, onAccept, onDecline }: SwapInboxDialogProps) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const incoming = requests.filter(r => r.direction === 'incoming');
  const outgoing = requests.filter(r => r.direction === 'outgoing');
  const pendingIncoming = incoming.filter(r => r.status === 'pending').length;

  const handleAccept = (id: string) => {
    setRespondingId(id);
    setTimeout(() => {
      onAccept(id);
      setRespondingId(null);
      toast.success('Swap accepted — your schedule has been updated.');
    }, 500);
  };

  const handleDecline = (id: string) => {
    setRespondingId(id);
    setTimeout(() => {
      onDecline(id);
      setRespondingId(null);
      toast.info('Swap request declined.');
    }, 500);
  };

  const statusBadge = (status: SwapRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Declined</Badge>;
    }
  };

  const renderRequest = (req: SwapRequest) => {
    const isIncoming = req.direction === 'incoming';
    const isPending = req.status === 'pending';
    const isResponding = respondingId === req.id;

    return (
      <div
        key={req.id}
        className={cn(
          'p-4 rounded-lg border transition-all',
          isPending && isIncoming
            ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
            : 'border-border/50 bg-muted/20'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold',
              isPending ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {(isIncoming ? req.fromStaff.name : req.toStaff.name).split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isIncoming ? req.fromStaff.name : req.toStaff.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isIncoming ? 'wants to swap with you' : 'swap request sent'} • {formatDistanceToNow(req.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          {statusBadge(req.status)}
        </div>

        {/* Shift comparison */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3">
          <div className="p-2.5 rounded-md bg-background border border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              {isIncoming ? 'Their Shift' : 'Your Shift'}
            </p>
            <p className="text-xs font-semibold">{format(req.fromShift.date, 'EEE, MMM d')}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" /> {req.fromShift.startTime} – {req.fromShift.endTime}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5" /> {req.fromShift.location}
            </p>
          </div>
          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="p-2.5 rounded-md bg-background border border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              {isIncoming ? 'Your Shift' : 'Their Shift'}
            </p>
            <p className="text-xs font-semibold">{format(req.toShift.date, 'EEE, MMM d')}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" /> {req.toShift.startTime} – {req.toShift.endTime}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5" /> {req.toShift.location}
            </p>
          </div>
        </div>

        {/* Reason */}
        {req.reason && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 mb-3">
            <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground italic">"{req.reason}"</p>
          </div>
        )}

        {/* Actions (incoming pending only) */}
        {isIncoming && isPending && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5 h-8 text-xs"
              disabled={isResponding}
              onClick={() => handleAccept(req.id)}
            >
              {isResponding ? (
                <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Accept Swap
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 h-8 text-xs"
              disabled={isResponding}
              onClick={() => handleDecline(req.id)}
            >
              <X className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Swap Requests
            {pendingIncoming > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">{pendingIncoming} new</Badge>
            )}
          </DialogTitle>
          <DialogDescription>View and respond to shift swap requests from colleagues.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'incoming' | 'outgoing')}>
          <TabsList className="w-full">
            <TabsTrigger value="incoming" className="flex-1 gap-1.5">
              Incoming
              {pendingIncoming > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 text-[9px] px-1">{pendingIncoming}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex-1">Outgoing</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-3">
            <ScrollArea className="h-[400px] pr-1">
              {incoming.length === 0 ? (
                <EmptyState message="No incoming swap requests" />
              ) : (
                <div className="space-y-3">{incoming.map(renderRequest)}</div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="outgoing" className="mt-3">
            <ScrollArea className="h-[400px] pr-1">
              {outgoing.length === 0 ? (
                <EmptyState message="No outgoing swap requests" />
              ) : (
                <div className="space-y-3">{outgoing.map(renderRequest)}</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <ArrowLeftRight className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Swap requests will appear here.</p>
    </div>
  );
}

// Generate mock incoming/outgoing swap requests
export function generateMockSwapRequests(employeeName: string): SwapRequest[] {
  return [
    {
      id: 'sr-1',
      direction: 'incoming',
      status: 'pending',
      fromStaff: { id: 'col-1', name: 'James Wilson', role: 'Line Cook' },
      toStaff: { id: 'me', name: employeeName, role: 'Line Cook' },
      fromShift: { date: new Date(Date.now() + 86400000 * 2), startTime: '14:00', endTime: '22:00', location: 'Main Kitchen', role: 'Line Cook' },
      toShift: { date: new Date(Date.now() + 86400000 * 2), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook' },
      reason: 'I have a dentist appointment in the morning, could we swap?',
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: 'sr-2',
      direction: 'incoming',
      status: 'pending',
      fromStaff: { id: 'col-4', name: 'Emily Park', role: 'Server' },
      toStaff: { id: 'me', name: employeeName, role: 'Line Cook' },
      fromShift: { date: new Date(Date.now() + 86400000 * 4), startTime: '10:00', endTime: '18:00', location: 'Poolside Bar', role: 'Server' },
      toShift: { date: new Date(Date.now() + 86400000 * 4), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook' },
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      id: 'sr-3',
      direction: 'outgoing',
      status: 'pending',
      fromStaff: { id: 'me', name: employeeName, role: 'Line Cook' },
      toStaff: { id: 'col-3', name: 'Alex Thompson', role: 'Line Cook' },
      fromShift: { date: new Date(Date.now() + 86400000), startTime: '06:00', endTime: '14:00', location: 'Main Kitchen', role: 'Line Cook' },
      toShift: { date: new Date(Date.now() + 86400000 * 3), startTime: '07:00', endTime: '15:00', location: 'Main Kitchen', role: 'Line Cook' },
      reason: 'Need to attend a family event',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: 'sr-4',
      direction: 'incoming',
      status: 'accepted',
      fromStaff: { id: 'col-2', name: 'Maria Garcia', role: 'Sous Chef' },
      toStaff: { id: 'me', name: employeeName, role: 'Line Cook' },
      fromShift: { date: new Date(Date.now() - 86400000 * 2), startTime: '06:00', endTime: '14:00', location: 'Events Hall', role: 'Sous Chef' },
      toShift: { date: new Date(Date.now() - 86400000 * 2), startTime: '14:00', endTime: '22:00', location: 'Main Kitchen', role: 'Line Cook' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 46),
    },
  ];
}
