import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, Clock, MapPin, Users, CheckCircle2, XCircle, 
  ChevronRight, Zap, AlertTriangle, DollarSign, Timer,
  Building2, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BroadcastShift {
  id: string;
  clientName: string;
  locationName: string;
  locationAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  positionsNeeded: number;
  roleName: string;
  payRate: number;
  chargeRate: number;
  urgency: 'standard' | 'urgent' | 'critical';
  slaDeadline: string;
  instructions?: string;
  dresscode?: string;
  receivedAt: string;
  status: 'new' | 'viewed' | 'accepted' | 'declined' | 'expired';
  responseDeadline: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const generateMockBroadcasts = (): BroadcastShift[] => [
  {
    id: 'bc-1',
    clientName: 'Sunrise Aged Care',
    locationName: 'Bondi Junction',
    locationAddress: '45 Spring St, Bondi Junction NSW 2022',
    date: '2026-03-12',
    startTime: '06:00',
    endTime: '14:00',
    positionsNeeded: 3,
    roleName: 'Registered Nurse',
    payRate: 45,
    chargeRate: 68,
    urgency: 'critical',
    slaDeadline: '2026-03-11T22:00:00Z',
    instructions: 'Must have medication administration certification.',
    receivedAt: '2026-03-11T18:30:00Z',
    status: 'new',
    responseDeadline: '2026-03-11T21:00:00Z',
  },
  {
    id: 'bc-2',
    clientName: 'Little Stars Childcare',
    locationName: 'Chatswood',
    locationAddress: '12 Albert Ave, Chatswood NSW 2067',
    date: '2026-03-13',
    startTime: '07:30',
    endTime: '16:00',
    positionsNeeded: 2,
    roleName: 'Early Childhood Teacher',
    payRate: 42,
    chargeRate: 62,
    urgency: 'urgent',
    slaDeadline: '2026-03-12T08:00:00Z',
    instructions: 'Diploma qualification required.',
    receivedAt: '2026-03-11T16:00:00Z',
    status: 'new',
    responseDeadline: '2026-03-12T06:00:00Z',
  },
  {
    id: 'bc-3',
    clientName: 'Grand Hyatt Sydney',
    locationName: 'CBD',
    locationAddress: '7 Hickson Rd, The Rocks NSW 2000',
    date: '2026-03-14',
    startTime: '17:00',
    endTime: '23:00',
    positionsNeeded: 4,
    roleName: 'Wait Staff',
    payRate: 30,
    chargeRate: 48,
    urgency: 'standard',
    slaDeadline: '2026-03-13T17:00:00Z',
    instructions: 'Black formal attire required. Event service experience preferred.',
    dresscode: 'Black formal',
    receivedAt: '2026-03-11T10:00:00Z',
    status: 'viewed',
    responseDeadline: '2026-03-13T12:00:00Z',
  },
  {
    id: 'bc-4',
    clientName: 'Evergreen Living',
    locationName: 'Parramatta',
    locationAddress: '88 George St, Parramatta NSW 2150',
    date: '2026-03-12',
    startTime: '14:00',
    endTime: '22:00',
    positionsNeeded: 1,
    roleName: 'Personal Care Assistant',
    payRate: 32,
    chargeRate: 50,
    urgency: 'urgent',
    slaDeadline: '2026-03-12T12:00:00Z',
    receivedAt: '2026-03-11T14:00:00Z',
    status: 'accepted',
    responseDeadline: '2026-03-12T10:00:00Z',
  },
  {
    id: 'bc-5',
    clientName: 'Kids Kingdom',
    locationName: 'Dee Why',
    locationAddress: '22 Fisher Rd, Dee Why NSW 2099',
    date: '2026-03-11',
    startTime: '08:00',
    endTime: '15:00',
    positionsNeeded: 1,
    roleName: 'Certificate III Educator',
    payRate: 28,
    chargeRate: 44,
    urgency: 'standard',
    slaDeadline: '2026-03-11T06:00:00Z',
    receivedAt: '2026-03-10T09:00:00Z',
    status: 'declined',
    responseDeadline: '2026-03-10T20:00:00Z',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
interface ShiftBroadcastInboxProps {
  onMatchCandidates?: (broadcastId: string) => void;
}

export function ShiftBroadcastInbox({ onMatchCandidates }: ShiftBroadcastInboxProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastShift[]>(generateMockBroadcasts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'viewed' | 'accepted' | 'declined'>('all');

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return broadcasts;
    return broadcasts.filter(b => b.status === filterStatus);
  }, [broadcasts, filterStatus]);

  const newCount = broadcasts.filter(b => b.status === 'new').length;

  const handleAccept = (id: string) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' as const } : b));
    toast.success('Shift accepted! You can now match candidates.');
  };

  const handleDecline = (id: string) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, status: 'declined' as const } : b));
    toast.info('Shift declined.');
  };

  const handleView = (id: string) => {
    setBroadcasts(prev => prev.map(b => b.id === id && b.status === 'new' ? { ...b, status: 'viewed' as const } : b));
    setExpandedId(expandedId === id ? null : id);
  };

  const getTimeRemaining = (deadline: string) => {
    const mins = differenceInMinutes(parseISO(deadline), new Date());
    if (mins <= 0) return { text: 'Expired', urgent: true };
    if (mins < 60) return { text: `${mins}m left`, urgent: true };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { text: `${hrs}h ${mins % 60}m left`, urgent: hrs < 4 };
    return { text: `${Math.floor(hrs / 24)}d ${hrs % 24}h left`, urgent: false };
  };

  const urgencyConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-destructive', text: 'text-red-700' },
    urgent: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
    standard: { bg: 'bg-muted/30', border: 'border-border', dot: 'bg-emerald-500', text: 'text-muted-foreground' },
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Shift Broadcast Inbox</CardTitle>
            {newCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground h-5 text-[10px] px-1.5">
                {newCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {(['all', 'new', 'viewed', 'accepted', 'declined'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                  filterStatus === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No broadcasts match this filter
            </div>
          )}
          {filtered.map(broadcast => {
            const config = urgencyConfig[broadcast.urgency];
            const timeRemaining = getTimeRemaining(broadcast.responseDeadline);
            const isExpanded = expandedId === broadcast.id;
            const isActionable = broadcast.status === 'new' || broadcast.status === 'viewed';

            return (
              <div
                key={broadcast.id}
                className={cn(
                  'rounded-lg border transition-all',
                  config.border,
                  broadcast.status === 'new' ? config.bg : 'bg-background',
                  isExpanded && 'ring-1 ring-primary/20'
                )}
              >
                {/* Row Header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => handleView(broadcast.id)}
                >
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', config.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-xs font-semibold', broadcast.status === 'new' && 'text-foreground')}>
                        {broadcast.clientName}
                      </p>
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {broadcast.urgency}
                      </Badge>
                      {broadcast.status === 'new' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{broadcast.roleName}</span>
                      <span>·</span>
                      <span>{format(parseISO(broadcast.date), 'MMM d')}</span>
                      <span>·</span>
                      <span>{broadcast.startTime}-{broadcast.endTime}</span>
                      <span>·</span>
                      <span>{broadcast.positionsNeeded} pos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isActionable && (
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        timeRemaining.urgent ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                      )}>
                        <Timer className="h-2.5 w-2.5 inline mr-0.5" />
                        {timeRemaining.text}
                      </span>
                    )}
                    {broadcast.status === 'accepted' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] h-5">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Accepted
                      </Badge>
                    )}
                    {broadcast.status === 'declined' && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <XCircle className="h-3 w-3 mr-0.5" /> Declined
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-border/50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Location</p>
                        <p className="text-xs font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {broadcast.locationName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{broadcast.locationAddress}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Pay Rate</p>
                        <p className="text-xs font-medium text-emerald-600">${broadcast.payRate}/hr</p>
                        <p className="text-[10px] text-muted-foreground">Charge: ${broadcast.chargeRate}/hr</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Margin</p>
                        <p className="text-xs font-medium">${broadcast.chargeRate - broadcast.payRate}/hr</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(((broadcast.chargeRate - broadcast.payRate) / broadcast.chargeRate) * 100).toFixed(0)}% margin
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Received</p>
                        <p className="text-xs font-medium">{format(parseISO(broadcast.receivedAt), 'h:mm a')}</p>
                        <p className="text-[10px] text-muted-foreground">{format(parseISO(broadcast.receivedAt), 'MMM d')}</p>
                      </div>
                    </div>

                    {broadcast.instructions && (
                      <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Instructions:</span> {broadcast.instructions}
                      </div>
                    )}
                    {broadcast.dresscode && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Dress Code:</span> {broadcast.dresscode}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isActionable && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleAccept(broadcast.id); }}
                          className="h-7 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Accept Shift
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleDecline(broadcast.id); }}
                          className="h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                    {broadcast.status === 'accepted' && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMatchCandidates?.(broadcast.id);
                          }}
                          className="h-7 text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Match Candidates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ShiftBroadcastInbox;
