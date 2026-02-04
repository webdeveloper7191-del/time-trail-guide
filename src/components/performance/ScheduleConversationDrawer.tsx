import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation, ConversationType, conversationTypeLabels } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Clock, Video, Link2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

const conversationSchema = z.object({
  staffId: z.string().min(1, 'Team member is required'),
  type: z.enum(['one_on_one', 'check_in', 'coaching', 'feedback', 'career']),
  title: z.string().min(3, 'Title is required').max(100),
  scheduledDate: z.date({ required_error: 'Date is required' }),
  duration: z.number().min(15).max(120),
  meetingLink: z.string().url().optional().or(z.literal('')),
});

type MeetingPlatform = 'zoom' | 'teams' | 'meet' | 'other';

interface ScheduleConversationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'> & { meetingLink?: string; meetingPlatform?: MeetingPlatform }) => Promise<void>;
  staff: StaffMember[];
  managerId: string;
}

const durations = [15, 30, 45, 60, 90, 120];
const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const meetingPlatforms: { id: MeetingPlatform; label: string; color: string; placeholder: string }[] = [
  { id: 'zoom', label: 'Zoom', color: 'bg-blue-100 text-blue-700', placeholder: 'https://zoom.us/j/...' },
  { id: 'teams', label: 'Teams', color: 'bg-purple-100 text-purple-700', placeholder: 'https://teams.microsoft.com/...' },
  { id: 'meet', label: 'Google Meet', color: 'bg-green-100 text-green-700', placeholder: 'https://meet.google.com/...' },
  { id: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700', placeholder: 'https://...' },
];

export function ScheduleConversationDrawer({ open, onOpenChange, onSubmit, staff, managerId }: ScheduleConversationDrawerProps) {
  const [staffId, setStaffId] = useState('');
  const [type, setType] = useState<ConversationType>('one_on_one');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform | ''>('');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const scheduledDate = date ? setMinutes(setHours(date, parseInt(time.split(':')[0])), parseInt(time.split(':')[1])) : undefined;
    
    const validation = conversationSchema.safeParse({ 
      staffId, type, title, scheduledDate, duration, 
      meetingLink: meetingLink || undefined 
    });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        staffId,
        managerId,
        type,
        title,
        scheduledDate: scheduledDate!.toISOString(),
        duration,
        completed: false,
        notes: [],
        actionItems: [],
        ...(meetingLink && { meetingLink, meetingPlatform: meetingPlatform as MeetingPlatform }),
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStaffId('');
    setType('one_on_one');
    setTitle('');
    setDate(undefined);
    setTime('10:00');
    setDuration(30);
    setMeetingPlatform('');
    setMeetingLink('');
    setErrors({});
  };

  const activeStaff = staff.filter(s => s.status === 'active' && s.id !== managerId);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={() => onOpenChange(false)}
      title="Schedule Conversation"
      icon={MessageSquare}
      size="md"
      actions={[
        {
          label: 'Cancel',
          onClick: () => onOpenChange(false),
          variant: 'secondary',
        },
        {
          label: loading ? 'Scheduling...' : 'Schedule',
          onClick: handleSubmit,
          variant: 'primary',
          disabled: loading,
        },
      ]}
    >
      {/* Conversation Setup Section */}
      <FormSection title="Conversation Setup" tooltip="Configure the meeting details">
        <FormField label="Team Member" required error={errors.staffId}>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className={errors.staffId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {activeStaff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.avatar} />
                      <AvatarFallback className="text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                    </Avatar>
                    {s.firstName} {s.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormRow>
          <FormField label="Type" required>
            <Select value={type} onValueChange={v => setType(v as ConversationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conversationTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Duration" tooltip="Meeting duration in minutes">
            <Select value={duration.toString()} onValueChange={v => setDuration(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map(d => (
                  <SelectItem key={d} value={d.toString()}>{d} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>

        <FormField label="Title" required error={errors.title}>
          <Input
            placeholder="e.g., Weekly Check-in"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
        </FormField>
      </FormSection>

      {/* Schedule Section */}
      <FormSection title="Schedule" tooltip="Set the date and time for this meeting">
        <FormRow>
          <FormField label="Date" required error={errors.scheduledDate}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground', errors.scheduledDate && 'border-destructive')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'MMM d, yyyy') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={d => d < new Date()} />
              </PopoverContent>
            </Popover>
          </FormField>

          <FormField label="Time" required>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Video Meeting Section */}
      <FormSection title="Video Meeting" tooltip="Add a video conferencing link (optional)">
        <FormField label="Platform" tooltip="Select the meeting platform">
          <div className="flex flex-wrap gap-2">
            {meetingPlatforms.map(platform => (
              <Badge
                key={platform.id}
                variant={meetingPlatform === platform.id ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors',
                  meetingPlatform === platform.id && platform.color
                )}
                onClick={() => setMeetingPlatform(meetingPlatform === platform.id ? '' : platform.id)}
              >
                {platform.label}
              </Badge>
            ))}
          </div>
        </FormField>

        {meetingPlatform && (
          <FormField label="Meeting Link" error={errors.meetingLink}>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={meetingPlatforms.find(p => p.id === meetingPlatform)?.placeholder || 'Enter meeting link'}
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                className={cn('pl-9', errors.meetingLink && 'border-destructive')}
              />
            </div>
          </FormField>
        )}
      </FormSection>
    </PrimaryOffCanvas>
  );
}

export default ScheduleConversationDrawer;