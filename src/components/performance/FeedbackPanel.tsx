import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Feedback, 
  FeedbackType,
  feedbackTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  MessageSquareHeart, 
  ThumbsUp,
  Lightbulb,
  MessageCircle,
  Heart,
  Lock,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GiveFeedbackDrawer } from './GiveFeedbackDrawer';

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
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const filteredFeedback = feedback.filter(f => {
    if (view === 'received') return f.toStaffId === currentUserId;
    if (view === 'given') return f.fromStaffId === currentUserId;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
            </div>
            Feedback & Recognition
          </h2>
          <p className="text-sm text-muted-foreground">
            Give and receive feedback from your team
          </p>
        </div>
        <Button onClick={() => setShowFeedbackDrawer(true)} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Give Feedback
        </Button>
      </div>

      {/* View Toggle - Pills Style */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(['received', 'given', 'all'] as const).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "rounded-md px-4",
              view === v ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onViewChange(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>

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
              <Button variant="outline" className="mt-4" onClick={() => setShowFeedbackDrawer(true)}>
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

      {/* Give Feedback Drawer */}
      <GiveFeedbackDrawer
        open={showFeedbackDrawer}
        onOpenChange={setShowFeedbackDrawer}
        staff={staff}
        currentUserId={currentUserId}
        onSendFeedback={onSendFeedback}
      />
    </div>
  );
}

export default FeedbackPanel;
