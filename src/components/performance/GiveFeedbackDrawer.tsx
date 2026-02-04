import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Feedback, 
  FeedbackType,
  feedbackTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { 
  MessageSquareHeart,
  ThumbsUp,
  Lightbulb,
  MessageCircle,
  Lock,
  Globe,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { RichTextEditor } from './RichTextEditor';

interface GiveFeedbackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember[];
  currentUserId: string;
  onSendFeedback: (data: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
}

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  praise: <ThumbsUp className="h-4 w-4" />,
  constructive: <Lightbulb className="h-4 w-4" />,
  coaching: <MessageCircle className="h-4 w-4" />,
  general: <MessageCircle className="h-4 w-4" />,
};

export function GiveFeedbackDrawer({ 
  open, 
  onOpenChange,
  staff, 
  currentUserId,
  onSendFeedback,
}: GiveFeedbackDrawerProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('praise');
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedRecipient || !message.trim()) return;
    
    setSending(true);
    try {
      await onSendFeedback({
        fromStaffId: currentUserId,
        toStaffId: selectedRecipient,
        type: feedbackType,
        message: message.trim(),
        isPrivate,
      });
      handleClose();
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSelectedRecipient('');
    setMessage('');
    setFeedbackType('praise');
    setIsPrivate(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const availableStaff = staff.filter(s => s.id !== currentUserId && s.status === 'active');

  return (
    <PrimaryOffCanvas
      title="Give Feedback"
      icon={MessageSquareHeart}
      size="md"
      open={open}
      onClose={handleClose}
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'secondary' },
        { 
          label: sending ? 'Sending...' : 'Send Feedback', 
          onClick: handleSend, 
          variant: 'primary', 
          disabled: !selectedRecipient || !message.trim() || sending,
          loading: sending,
        },
      ]}
    >
      {/* Recipient & Type Section */}
      <FormSection title="Feedback Details" tooltip="Select the recipient and type of feedback">
        <FormField label="Recipient" required tooltip="Select the team member to give feedback to">
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {availableStaff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.avatar} />
                      <AvatarFallback className="text-xs">
                        {s.firstName[0]}{s.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {s.firstName} {s.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Feedback Type" required tooltip="Choose the nature of your feedback">
          <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as FeedbackType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(feedbackTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    {typeIcons[value as FeedbackType]}
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      {/* Message Section */}
      <FormSection title="Your Message" tooltip="Write your feedback message">
        <FormField label="Message" required>
          <RichTextEditor
            value={message}
            onChange={setMessage}
            placeholder="Write your feedback here..."
            minHeight="150px"
            showPreviewToggle={false}
          />
        </FormField>
      </FormSection>

      {/* Visibility Section */}
      <FormSection title="Visibility Settings" tooltip="Control who can see this feedback">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <Switch
            id="private"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer flex-1">
            {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            <div>
              <p className="font-medium">{isPrivate ? 'Private' : 'Public'}</p>
              <p className="text-xs text-muted-foreground">
                {isPrivate ? 'Only visible to recipient & managers' : 'Visible to all team members'}
              </p>
            </div>
          </Label>
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
}

export default GiveFeedbackDrawer;
