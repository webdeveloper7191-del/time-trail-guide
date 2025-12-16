import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  Check,
  Trash2,
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'approval' | 'rejection' | 'submission' | 'escalation' | 'reminder' | 'delegation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  employeeName?: string;
  timesheetId?: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircle2 className="h-4 w-4 text-status-approved" />;
      case 'rejection':
        return <XCircle className="h-4 w-4 text-status-rejected" />;
      case 'escalation':
        return <AlertTriangle className="h-4 w-4 text-status-pending" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'delegation':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBgColor = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-muted/30';
    switch (type) {
      case 'approval':
        return 'bg-status-approved/5';
      case 'rejection':
        return 'bg-status-rejected/5';
      case 'escalation':
        return 'bg-status-pending/5';
      default:
        return 'bg-primary/5';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-status-rejected"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                    getBgColor(notification.type, notification.read),
                    !notification.read && "border-l-2 border-l-primary"
                  )}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.read && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-muted-foreground"
              onClick={onClearAll}
            >
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Mock notifications generator
export function generateMockNotifications(): Notification[] {
  return [
    {
      id: '1',
      type: 'submission',
      title: 'New Timesheet Submitted',
      message: 'Sarah Chen submitted timesheet for Dec 9-15, 2024',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      employeeName: 'Sarah Chen',
    },
    {
      id: '2',
      type: 'escalation',
      title: 'Approval Escalated',
      message: 'John Smith timesheet escalated due to 8h overtime',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      employeeName: 'John Smith',
    },
    {
      id: '3',
      type: 'approval',
      title: 'Timesheet Approved',
      message: 'Michael Johnson timesheet approved by HR Director',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
      employeeName: 'Michael Johnson',
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Pending Approvals',
      message: 'You have 3 timesheets pending approval',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'delegation',
      title: 'Delegation Active',
      message: 'Your approval authority delegated to Jane Doe until Dec 20',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      read: true,
    },
  ];
}
