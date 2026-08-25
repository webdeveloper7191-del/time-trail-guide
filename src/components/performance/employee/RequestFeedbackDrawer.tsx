import React, { useMemo, useState } from 'react';
import { PrimaryOffCanvas, FormSection, FormField } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { mockStaff } from '@/data/mockStaffData';
import { performanceSelfService } from '@/lib/performanceSelfServiceStore';

interface RequestFeedbackDrawerProps {
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}

export function RequestFeedbackDrawer({ currentUserId, open, onClose }: RequestFeedbackDrawerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  const colleagues = useMemo(
    () =>
      mockStaff
        .filter(s => s.id !== currentUserId)
        .map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          role: s.position ?? '',
        }))
        .filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [currentUserId, search],
  );

  const nameOf = (id: string) => {
    const s = mockStaff.find(m => m.id === id);
    return s ? `${s.firstName} ${s.lastName}`.trim() : 'Colleague';
  };

  const reset = () => {
    setSearch('');
    setSelected([]);
    setTopic('');
    setMessage('');
  };

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));

  const handleSend = () => {
    if (selected.length === 0) {
      toast.error('Choose at least one colleague');
      return;
    }
    if (!topic.trim()) {
      toast.error('Add a topic so people know what to comment on');
      return;
    }
    selected.forEach(id => {
      performanceSelfService.requestFeedback({
        fromStaffId: currentUserId,
        toStaffId: id,
        toStaffName: nameOf(id),
        topic: topic.trim(),
        message: message.trim(),
      });
    });
    toast.success(`Feedback requested from ${selected.length} colleague${selected.length > 1 ? 's' : ''}`);
    reset();
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title="Request feedback"
      description="Ask colleagues for input on your work"
      icon={MessageSquarePlus}
      size="lg"
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      actions={[
        { label: 'Cancel', onClick: () => { reset(); onClose(); }, variant: 'outlined' },
        { label: 'Send request', onClick: handleSend, variant: 'primary' },
      ]}
    >
      <div className="space-y-6">
        <FormSection title="Who should give feedback?">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search colleagues"
              className="pl-9"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(id => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {nameOf(id)}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-56 rounded-md border border-border">
            <div className="p-1">
              {colleagues.map(person => (
                <label
                  key={person.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox checked={selected.includes(person.id)} onCheckedChange={() => toggle(person.id)} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{person.name}</span>
                    <span className="block text-xs text-muted-foreground">{person.role}</span>
                  </span>
                </label>
              ))}
              {colleagues.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</p>
              )}
            </div>
          </ScrollArea>
        </FormSection>

        <FormSection title="What do you want feedback on?">
          <FormField label="Topic" required>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. My communication during the room handover"
            />
          </FormField>
          <FormField label="Message">
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add context or specific questions you'd like answered."
              rows={4}
            />
          </FormField>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
