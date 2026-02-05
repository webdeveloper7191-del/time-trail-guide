import { useState, useMemo } from 'react';
import {
  Checkbox as MuiCheckbox,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { 
  Bell, 
  Send, 
  Mail, 
  Smartphone,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  ArrowLeftRight,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, ShiftNotification } from '@/types/roster';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface ShiftNotificationsModalProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  staff: StaffMember[];
  centreId: string;
}

// Mock notification history
const mockNotifications: ShiftNotification[] = [
  {
    id: 'notif-1',
    type: 'shift_published',
    recipientId: 'staff-1',
    recipientName: 'Emma Wilson',
    title: 'New Shifts Published',
    message: 'Your shifts for next week have been published. Please review and confirm.',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    sentVia: ['email'],
  },
  {
    id: 'notif-2',
    type: 'shift_swapped',
    recipientId: 'staff-2',
    recipientName: 'Sarah Chen',
    title: 'Shift Swap Confirmed',
    message: 'Your shift on Monday has been swapped with Michael Brown.',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
    sentVia: ['email', 'sms'],
  },
  {
    id: 'notif-3',
    type: 'open_shift_available',
    recipientId: 'staff-3',
    recipientName: 'Michael Brown',
    title: 'Open Shift Available',
    message: 'An open shift is available on Wednesday in Koalas room.',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
    sentVia: ['email'],
  },
];

export function ShiftNotificationsModal({
  open,
  onClose,
  shifts,
  staff,
  centreId,
}: ShiftNotificationsModalProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<'publish' | 'reminder' | 'custom'>('publish');
  const [customMessage, setCustomMessage] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [sendViaSms, setSendViaSms] = useState(false);
  const [notifications] = useState<ShiftNotification[]>(mockNotifications);
  const [tabValue, setTabValue] = useState(0);

  const affectedStaff = useMemo(() => {
    const staffIds = new Set(shifts.filter(s => s.centreId === centreId).map(s => s.staffId));
    return staff.filter(s => staffIds.has(s.id));
  }, [shifts, staff, centreId]);

  const toggleRecipient = (staffId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(affectedStaff.map(s => s.id));
  };

  const clearAll = () => {
    setSelectedRecipients([]);
  };

  const handleSendNotifications = () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!sendViaEmail && !sendViaSms) {
      toast.error('Please select at least one delivery method');
      return;
    }

    const methods = [];
    if (sendViaEmail) methods.push('email');
    if (sendViaSms) methods.push('SMS');
    
    toast.success(`Notifications sent to ${selectedRecipients.length} staff via ${methods.join(' & ')}`);
    onClose();
  };

  const getNotificationIcon = (type: ShiftNotification['type']) => {
    switch (type) {
      case 'shift_published': return Calendar;
      case 'shift_swapped': return ArrowLeftRight;
      case 'open_shift_available': return Briefcase;
      case 'shift_reminder': return Clock;
      default: return Bell;
    }
  };

  const getNotificationTypeLabel = (type: ShiftNotification['type']) => {
    switch (type) {
      case 'shift_published': return 'Published';
      case 'shift_swapped': return 'Swapped';
      case 'open_shift_available': return 'Open Shift';
      case 'shift_reminder': return 'Reminder';
      case 'leave_approved': return 'Leave';
      case 'leave_rejected': return 'Leave';
      default: return 'Notification';
    }
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      variant: 'outlined',
      onClick: onClose,
    },
    {
      label: `Send to ${selectedRecipients.length} Staff`,
      variant: 'primary',
      onClick: handleSendNotifications,
      disabled: selectedRecipients.length === 0,
      icon: <Send size={16} />,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Shift Notifications"
      description="Send notifications to staff about their shifts"
      icon={Bell}
      size="md"
      actions={actions}
    >
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          {/* Notification Type */}
          <FormSection title="Notification Type">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={notificationType === 'publish' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationType('publish')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Publish Alert
                  </Button>
                  <Button
                    variant={notificationType === 'reminder' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationType('reminder')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Shift Reminder
                  </Button>
                  <Button
                    variant={notificationType === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationType('custom')}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Custom Message
                  </Button>
                </div>

              {/* Custom Message */}
              {notificationType === 'custom' && (
                <FormField label="Message" className="mt-3">
                  <Textarea
                    placeholder="Enter your custom message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                </FormField>
              )}
          </FormSection>

          {/* Recipients */}
          <FormSection title="Recipients">
            <div className="flex justify-end gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                      {affectedStaff.map(member => (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors",
                            selectedRecipients.includes(member.id)
                              ? "bg-primary/10 border-primary"
                              : "bg-background hover:bg-muted"
                          )}
                          onClick={() => toggleRecipient(member.id)}
                        >
                          <div className="flex items-center gap-3">
                            <MuiCheckbox checked={selectedRecipients.includes(member.id)} size="small" />
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                            {member.phone && <Smartphone className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      ))}
              </div>
            </ScrollArea>
          </FormSection>

          {/* Delivery Method */}
          <FormSection title="Delivery Method">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <MuiCheckbox 
                  checked={sendViaEmail} 
                  onChange={(e) => setSendViaEmail(e.target.checked)}
                  size="small"
                />
                <Label className="flex items-center gap-1 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <MuiCheckbox 
                  checked={sendViaSms} 
                  onChange={(e) => setSendViaSms(e.target.checked)}
                  size="small"
                />
                <Label className="flex items-center gap-1 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </div>
          </FormSection>
        </TabsContent>

        <TabsContent value="history">
          <FormSection title="Notification History">
            <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(notif => {
                      const Icon = getNotificationIcon(notif.type);
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            notif.read ? "bg-background" : "bg-primary/5 border-primary/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{notif.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {getNotificationTypeLabel(notif.type)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                To: {notif.recipientName}
                              </p>
                              <p className="text-sm mt-2">{notif.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(notif.timestamp, 'MMM d, h:mm a')}
                                </span>
                                <div className="flex items-center gap-2">
                                  {notif.sentVia.includes('email') && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Mail className="h-3 w-3 mr-1" />
                                      Email
                                    </Badge>
                                  )}
                                  {notif.sentVia.includes('sms') && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Smartphone className="h-3 w-3 mr-1" />
                                      SMS
                                    </Badge>
                                  )}
                                  {notif.read && (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </ScrollArea>
          </FormSection>
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
}
