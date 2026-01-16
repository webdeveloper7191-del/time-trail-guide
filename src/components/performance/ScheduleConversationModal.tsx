import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Conversation, ConversationType, conversationTypeLabels } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const conversationSchema = z.object({
  staffId: z.string().min(1, 'Team member is required'),
  type: z.enum(['one_on_one', 'check_in', 'coaching', 'feedback', 'career']),
  title: z.string().min(3, 'Title is required').max(100),
  scheduledDate: z.date({ required_error: 'Date is required' }),
  duration: z.number().min(15).max(120),
});

interface ScheduleConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  staff: StaffMember[];
  managerId: string;
}

const durations = [15, 30, 45, 60, 90, 120];
const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export function ScheduleConversationModal({ open, onOpenChange, onSubmit, staff, managerId }: ScheduleConversationModalProps) {
  const [staffId, setStaffId] = useState('');
  const [type, setType] = useState<ConversationType>('one_on_one');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const scheduledDate = date ? setMinutes(setHours(date, parseInt(time.split(':')[0])), parseInt(time.split(':')[1])) : undefined;
    
    const validation = conversationSchema.safeParse({ staffId, type, title, scheduledDate, duration });
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
    setErrors({});
  };

  const activeStaff = staff.filter(s => s.status === 'active' && s.id !== managerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Team Member *</Label>
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
            {errors.staffId && <p className="text-xs text-destructive">{errors.staffId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g., Weekly Check-in"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground', errors.scheduledDate && 'border-destructive')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'MMM d') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={d => d < new Date()} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleConversationModal;
