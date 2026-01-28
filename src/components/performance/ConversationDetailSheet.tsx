import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Checkbox,
  Divider,
} from '@mui/material';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Conversation,
  ConversationNote,
  conversationTypeLabels,
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import {
  X,
  MessageSquare,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Video,
  StickyNote,
  ListChecks,
  Send,
  CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationDetailSheetProps {
  open: boolean;
  conversation: Conversation | null;
  staff: StaffMember[];
  currentUserId: string;
  onClose: () => void;
  onAddNote: (id: string, content: string, createdBy: string) => Promise<void>;
  onComplete: (id: string, actionItems: string[], nextMeetingDate?: string) => Promise<void>;
}

const typeColors: Record<string, string> = {
  one_on_one: 'info',
  check_in: 'success',
  coaching: 'secondary',
  feedback: 'warning',
  career: 'primary',
};

export function ConversationDetailSheet({
  open,
  conversation,
  staff,
  currentUserId,
  onClose,
  onAddNote,
  onComplete,
}: ConversationDetailSheetProps) {
  const [newNote, setNewNote] = useState('');
  const [actionItems, setActionItems] = useState<{ text: string; completed: boolean }[]>([
    { text: '', completed: false },
  ]);
  const [nextMeetingDate, setNextMeetingDate] = useState<Date | undefined>();
  const [showScheduleNext, setShowScheduleNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const staffMember = staff.find((s) => s.id === conversation?.staffId);
  const manager = staff.find((s) => s.id === conversation?.managerId);

  if (!conversation) return null;

  const isUpcoming = !isPast(parseISO(conversation.scheduledDate)) && !conversation.completed;
  const isPastMeeting = isPast(parseISO(conversation.scheduledDate)) || conversation.completed;

  const getDateLabel = () => {
    const date = parseISO(conversation.scheduledDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      await onAddNote(conversation.id, newNote, currentUserId);
      setNewNote('');
      toast.success('Note added');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActionItem = () => {
    setActionItems([...actionItems, { text: '', completed: false }]);
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleActionItemChange = (index: number, text: string) => {
    const updated = [...actionItems];
    updated[index].text = text;
    setActionItems(updated);
  };

  const handleToggleActionItem = (index: number) => {
    const updated = [...actionItems];
    updated[index].completed = !updated[index].completed;
    setActionItems(updated);
  };

  const handleCompleteMeeting = async () => {
    setLoading(true);
    try {
      const items = actionItems.filter((a) => a.text.trim()).map((a) => a.text);
      await onComplete(conversation.id, items, nextMeetingDate?.toISOString());
      onClose();
      toast.success('Meeting completed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.100' }}>
                  <MessageSquare className="h-5 w-5 text-primary" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {conversation.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={conversationTypeLabels[conversation.type]}
                      size="small"
                      color={typeColors[conversation.type] as any}
                    />
                    {conversation.completed && (
                      <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }} />
                    )}
                    {isUpcoming && <Chip label="Upcoming" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'rgb(29, 78, 216)' }} />}
                  </Stack>
                </Box>
              </Stack>
              <IconButton size="small" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </Stack>
          </Box>

          {/* Meeting Info */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" fontWeight={500}>{getDateLabel()}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Time</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {format(parseISO(conversation.scheduledDate), 'h:mm a')} ({conversation.duration} min)
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 28, height: 28 }}>
                  <User className="h-4 w-4" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">With</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 28, height: 28 }}>
                  <User className="h-4 w-4" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Manager</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* Content */}
          <ScrollArea className="flex-1">
            <Box sx={{ p: 2 }}>
              <Stack spacing={3}>
                {/* Meeting Notes */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    <StickyNote className="h-4 w-4 inline mr-1" />
                    Meeting Notes
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {conversation.notes.length > 0 ? (
                      conversation.notes.map((note) => (
                        <Box
                          key={note.id}
                          sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Avatar sx={{ width: 20, height: 20 }}>
                              <User className="h-3 w-3" />
                            </Avatar>
                            <Typography variant="caption" fontWeight={500}>
                              {staff.find((s) => s.id === note.createdBy)?.firstName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • {formatDistanceToNow(parseISO(note.createdAt), { addSuffix: true })}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">{note.content}</Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <StickyNote className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <Typography variant="body2" color="text.secondary">
                          No notes yet. Add notes during or after the meeting.
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Add Note */}
                  <Stack direction="row" spacing={1}>
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddNote} disabled={!newNote.trim() || loading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                {/* Action Items */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      <ListChecks className="h-4 w-4 inline mr-1" />
                      Action Items
                    </Typography>
                    <Button variant="outline" size="sm" onClick={handleAddActionItem}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Item
                    </Button>
                  </Stack>

                  <Stack spacing={1}>
                    {actionItems.map((item, index) => (
                      <Stack key={index} direction="row" spacing={1} alignItems="center">
                        <Checkbox
                          checked={item.completed}
                          onChange={() => handleToggleActionItem(index)}
                          size="small"
                        />
                        <TextField
                          placeholder="Action item..."
                          value={item.text}
                          onChange={(e) => handleActionItemChange(index, e.target.value)}
                          fullWidth
                          size="small"
                          sx={{
                            '& input': {
                              textDecoration: item.completed ? 'line-through' : 'none',
                            },
                          }}
                        />
                        <IconButton size="small" onClick={() => handleRemoveActionItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Stack>
                    ))}

                    {/* Existing action items from conversation */}
                    {conversation.actionItems.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Previous Action Items
                        </Typography>
                        {conversation.actionItems.map((item, index) => (
                          <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <Typography variant="body2">{item}</Typography>
                          </Stack>
                        ))}
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Schedule Next Meeting */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      <CalendarPlus className="h-4 w-4 inline mr-1" />
                      Schedule Follow-up
                    </Typography>
                  </Stack>

                  {conversation.nextMeetingDate ? (
                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <Typography variant="body2">
                          Next meeting: {format(parseISO(conversation.nextMeetingDate), 'MMMM d, yyyy')}
                        </Typography>
                      </Stack>
                    </Box>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {nextMeetingDate
                            ? format(nextMeetingDate, 'MMMM d, yyyy')
                            : 'Select date for next meeting'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nextMeetingDate}
                          onSelect={setNextMeetingDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </Box>
              </Stack>
            </Box>
          </ScrollArea>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {!conversation.completed && (
                <Button onClick={handleCompleteMeeting} disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {loading ? 'Saving...' : 'Complete Meeting'}
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}
