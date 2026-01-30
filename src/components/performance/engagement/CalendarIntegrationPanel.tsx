import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Link2, 
  Check, 
  X,
  RefreshCw,
  ExternalLink,
  Video,
  Clock,
  Bell,
  Settings,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

type CalendarProvider = 'google' | 'outlook' | 'apple';
type SyncStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

interface ConnectedCalendar {
  id: string;
  provider: CalendarProvider;
  email: string;
  status: SyncStatus;
  lastSynced?: string;
  eventsSynced: number;
  autoSync: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  attendee: string;
  calendarProvider?: CalendarProvider;
  synced: boolean;
  meetingLink?: string;
}

const providerConfig: Record<CalendarProvider, { label: string; color: string; icon: React.ReactNode }> = {
  google: { 
    label: 'Google Calendar', 
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <Calendar className="h-5 w-5 text-red-500" />
  },
  outlook: { 
    label: 'Outlook Calendar', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Calendar className="h-5 w-5 text-blue-500" />
  },
  apple: { 
    label: 'Apple Calendar', 
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: <Calendar className="h-5 w-5 text-slate-500" />
  },
};

// Mock data
const mockConnectedCalendars: ConnectedCalendar[] = [
  {
    id: 'cal-1',
    provider: 'google',
    email: 'manager@company.com',
    status: 'connected',
    lastSynced: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    eventsSynced: 12,
    autoSync: true,
  },
];

const mockUpcomingEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Weekly Check-in with Sarah',
    date: '2025-02-03',
    time: '10:00 AM',
    duration: 30,
    attendee: 'Sarah Chen',
    calendarProvider: 'google',
    synced: true,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'evt-2',
    title: 'Career Discussion - John',
    date: '2025-02-04',
    time: '2:00 PM',
    duration: 45,
    attendee: 'John Smith',
    synced: false,
  },
  {
    id: 'evt-3',
    title: 'Coaching Session - Emily',
    date: '2025-02-05',
    time: '11:00 AM',
    duration: 60,
    attendee: 'Emily Davis',
    calendarProvider: 'google',
    synced: true,
    meetingLink: 'https://zoom.us/j/123456789',
  },
];

export function CalendarIntegrationPanel() {
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>(mockConnectedCalendars);
  const [events] = useState<CalendarEvent[]>(mockUpcomingEvents);
  const [syncing, setSyncing] = useState(false);
  const [autoReminders, setAutoReminders] = useState(true);
  const [autoAddLinks, setAutoAddLinks] = useState(true);

  const handleConnectCalendar = (provider: CalendarProvider) => {
    // Mock connection flow
    toast.success(`Opening ${providerConfig[provider].label} authorization...`);
    
    setTimeout(() => {
      const newCalendar: ConnectedCalendar = {
        id: `cal-${Date.now()}`,
        provider,
        email: provider === 'outlook' ? 'manager@company.onmicrosoft.com' : 'manager@gmail.com',
        status: 'connected',
        lastSynced: new Date().toISOString(),
        eventsSynced: 0,
        autoSync: true,
      };
      setCalendars([...calendars, newCalendar]);
      toast.success(`${providerConfig[provider].label} connected successfully!`);
    }, 1500);
  };

  const handleDisconnect = (calendarId: string) => {
    setCalendars(calendars.filter(c => c.id !== calendarId));
    toast.success('Calendar disconnected');
  };

  const handleSync = () => {
    setSyncing(true);
    toast.info('Syncing calendar events...');
    
    setTimeout(() => {
      setSyncing(false);
      setCalendars(calendars.map(c => ({
        ...c,
        lastSynced: new Date().toISOString(),
        eventsSynced: c.eventsSynced + Math.floor(Math.random() * 3),
      })));
      toast.success('Calendar sync complete!');
    }, 2000);
  };

  const handleSendInvite = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      toast.success(`Calendar invite sent to ${event.attendee}`);
    }
  };

  const connectedProviders = calendars.map(c => c.provider);
  const availableProviders: CalendarProvider[] = ['google', 'outlook', 'apple'].filter(
    p => !connectedProviders.includes(p as CalendarProvider)
  ) as CalendarProvider[];

  const formatLastSynced = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Calendar className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Calendar Integration
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Sync your 1:1s with Google Calendar, Outlook, or Apple Calendar
          </Typography>
        </Box>
        <MuiButton
          variant="outlined"
          startIcon={syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          onClick={handleSync}
          disabled={syncing || calendars.length === 0}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </MuiButton>
      </Stack>

      {/* Connected Calendars */}
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
          Connected Calendars
        </Typography>
        
        <Stack spacing={2}>
          {calendars.map((calendar) => (
            <Card key={calendar.id}>
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: calendar.provider === 'google' ? 'error.50' : calendar.provider === 'outlook' ? 'info.50' : 'grey.100',
                      display: 'flex',
                    }}>
                      {providerConfig[calendar.provider].icon}
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {providerConfig[calendar.provider].label}
                        </Typography>
                        <Chip
                          size="small"
                          icon={<Check className="h-3 w-3" />}
                          label="Connected"
                          sx={{ bgcolor: 'success.light', color: 'success.dark' }}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {calendar.email}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Last synced: {formatLastSynced(calendar.lastSynced)}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {calendar.eventsSynced} events synced
                      </Typography>
                    </Box>
                    <MuiButton
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => handleDisconnect(calendar.id)}
                    >
                      Disconnect
                    </MuiButton>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          ))}

          {calendars.length === 0 && (
            <Alert severity="info" icon={<Link2 className="h-5 w-5" />}>
              No calendars connected. Connect a calendar to sync your 1:1 meetings.
            </Alert>
          )}
        </Stack>
      </Box>

      {/* Add Calendar */}
      {availableProviders.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
            Add Calendar
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {availableProviders.map((provider) => (
              <Card 
                key={provider}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
                }}
                onClick={() => handleConnectCalendar(provider)}
              >
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {providerConfig[provider].icon}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {providerConfig[provider].label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click to connect
                    </Typography>
                  </Box>
                  <Plus className="h-4 w-4 text-muted-foreground ml-2" />
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Sync Settings */}
      <Card>
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <Settings className="h-5 w-5 text-muted-foreground" />
            <Typography variant="subtitle1" fontWeight={600}>
              Sync Settings
            </Typography>
          </Stack>
          
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch 
                  checked={autoReminders} 
                  onChange={(e) => setAutoReminders(e.target.checked)} 
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>Auto-send reminders</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Send email reminders 24h and 1h before meetings
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={autoAddLinks} 
                  onChange={(e) => setAutoAddLinks(e.target.checked)} 
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>Auto-add meeting links</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically generate Google Meet/Teams links for new meetings
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Box>
      </Card>

      {/* Upcoming Events */}
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
          Upcoming 1:1 Meetings
        </Typography>
        
        <Stack spacing={1.5}>
          {events.map((event) => (
            <Card key={event.id}>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {new Date(event.date).getDate()}
                      </Typography>
                    </Box>
                    
                    <Divider orientation="vertical" flexItem />
                    
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {event.title}
                        </Typography>
                        {event.synced ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Synced
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Not synced
                          </Badge>
                        )}
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          {event.time} • {event.duration} min
                        </Typography>
                        {event.meetingLink && (
                          <MuiButton
                            size="small"
                            variant="text"
                            startIcon={<Video className="h-3 w-3" />}
                            href={event.meetingLink}
                            target="_blank"
                            sx={{ fontSize: '0.75rem', p: 0.5 }}
                          >
                            Join
                          </MuiButton>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={1}>
                    {!event.synced && (
                      <MuiButton
                        size="small"
                        variant="outlined"
                        startIcon={<Bell className="h-3.5 w-3.5" />}
                        onClick={() => handleSendInvite(event.id)}
                      >
                        Send Invite
                      </MuiButton>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default CalendarIntegrationPanel;
