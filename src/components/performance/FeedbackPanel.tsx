import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Feedback, 
  FeedbackType,
  feedbackTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { 
  MessageSquareHeart, 
  Send,
  ThumbsUp,
  Lightbulb,
  MessageCircle,
  Heart,
  Lock,
  Globe,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FeedbackPanelProps {
  feedback: Feedback[];
  staff: StaffMember[];
  currentUserId: string;
  onSendFeedback: (data: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  view: 'received' | 'given' | 'all';
  onViewChange: (view: 'received' | 'given' | 'all') => void;
}

const typeColors: Record<FeedbackType, string> = {
  praise: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  constructive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  coaching: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  general: 'bg-muted text-muted-foreground',
};

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  praise: <ThumbsUp className="h-3.5 w-3.5" />,
  constructive: <Lightbulb className="h-3.5 w-3.5" />,
  coaching: <MessageCircle className="h-3.5 w-3.5" />,
  general: <MessageCircle className="h-3.5 w-3.5" />,
};

export function FeedbackPanel({ 
  feedback, 
  staff, 
  currentUserId,
  onSendFeedback,
  view,
  onViewChange
}: FeedbackPanelProps) {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('praise');
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const filteredFeedback = feedback.filter(f => {
    if (view === 'received') return f.toStaffId === currentUserId;
    if (view === 'given') return f.fromStaffId === currentUserId;
    return true;
  });

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
      setShowCompose(false);
      setSelectedRecipient('');
      setMessage('');
      setFeedbackType('praise');
      setIsPrivate(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-primary" />
            Feedback & Recognition
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Give and receive feedback from your team
          </p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Give Feedback
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {(['received', 'given', 'all'] as const).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>

      {/* Compose Feedback */}
      {showCompose && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Send Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.id !== currentUserId && s.status === 'active').map((s) => (
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
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your feedback here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private" className="flex items-center gap-1.5 cursor-pointer">
                  {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  {isPrivate ? 'Private (only recipient & managers)' : 'Public'}
                </Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSend} 
                  disabled={!selectedRecipient || !message.trim() || sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {view === 'received' ? 'No feedback received yet' : 
               view === 'given' ? "You haven't given any feedback yet" : 
               'No feedback yet'}
            </p>
            {view !== 'given' && (
              <Button variant="outline" className="mt-4" onClick={() => setShowCompose(true)}>
                Give your first feedback
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => {
            const fromStaff = getStaffMember(item.fromStaffId);
            const toStaff = getStaffMember(item.toStaffId);
            const isReceived = item.toStaffId === currentUserId;

            return (
              <Card key={item.id} className="hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={isReceived ? fromStaff?.avatar : toStaff?.avatar} />
                      <AvatarFallback>
                        {isReceived 
                          ? `${fromStaff?.firstName?.[0]}${fromStaff?.lastName?.[0]}`
                          : `${toStaff?.firstName?.[0]}${toStaff?.lastName?.[0]}`
                        }
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">
                          {isReceived 
                            ? `${fromStaff?.firstName} ${fromStaff?.lastName}` 
                            : `To: ${toStaff?.firstName} ${toStaff?.lastName}`
                          }
                        </span>
                        <Badge className={typeColors[item.type]}>
                          {typeIcons[item.type]}
                          <span className="ml-1">{feedbackTypeLabels[item.type]}</span>
                        </Badge>
                        {item.isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm mt-2">{item.message}</p>

                      <p className="text-xs text-muted-foreground mt-3">
                        {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeedbackPanel;
