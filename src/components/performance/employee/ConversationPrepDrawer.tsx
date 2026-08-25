import React, { useEffect, useState } from 'react';
import { PrimaryOffCanvas, FormSection } from '@/components/ui/off-canvas';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Conversation, conversationTypeLabels } from '@/types/performance';
import {
  performanceSelfService,
  usePerformanceSelfService,
} from '@/lib/performanceSelfServiceStore';

interface ConversationPrepDrawerProps {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
}

export function ConversationPrepDrawer({ conversation, open, onClose }: ConversationPrepDrawerProps) {
  const overlay = usePerformanceSelfService();
  const [talkingPoints, setTalkingPoints] = useState('');
  const [doneItems, setDoneItems] = useState<string[]>([]);

  useEffect(() => {
    if (conversation && open) {
      const prep = overlay.conversationPrep[conversation.id];
      setTalkingPoints(prep?.talkingPoints ?? '');
      setDoneItems(prep?.completedActionItems ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, open]);

  if (!conversation) return null;

  const toggleItem = (item: string) =>
    setDoneItems(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));

  const handleSave = () => {
    performanceSelfService.saveConversationPrep(conversation.id, {
      talkingPoints: talkingPoints.trim(),
      completedActionItems: doneItems,
    });
    toast.success('Your notes are saved and shared with your manager');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title={conversation.title}
      description={`${format(parseISO(conversation.scheduledDate), 'EEEE, d MMM yyyy · h:mm a')}`}
      icon={MessageSquare}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save notes', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{conversationTypeLabels[conversation.type]}</Badge>
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            {conversation.duration} min
          </Badge>
        </div>

        <FormSection
          title="My talking points"
          tooltip="Add what you want to cover so your manager can prepare ahead of the meeting."
        >
          <Textarea
            value={talkingPoints}
            onChange={e => setTalkingPoints(e.target.value)}
            placeholder="Topics, wins, blockers or support you need."
            rows={6}
          />
        </FormSection>

        {conversation.actionItems.length > 0 && (
          <FormSection title="Action items" tooltip="Tick off the items you have completed.">
            <div className="space-y-2">
              {conversation.actionItems.map(item => (
                <label
                  key={item}
                  className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={doneItems.includes(item)}
                    onCheckedChange={() => toggleItem(item)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </FormSection>
        )}

        {conversation.notes.length > 0 && (
          <FormSection title="Shared notes">
            <div className="space-y-3">
              {conversation.notes.map(note => (
                <div key={note.id} className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm">{note.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.createdBy} · {format(parseISO(note.createdAt), 'd MMM yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </FormSection>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
