import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Conversation, 
  ConversationType,
  conversationTypeLabels 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
  Video,
  Users,
  StickyNote,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationsListProps {
  conversations: Conversation[];
  staff: StaffMember[];
  currentUserId: string;
  onScheduleConversation: () => void;
  onViewConversation: (conversation: Conversation) => void;
}

const typeColors: Record<ConversationType, string> = {
  one_on_one: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  check_in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  coaching: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  feedback: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  career: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const typeIcons: Record<ConversationType, React.ReactNode> = {
  one_on_one: <Users className="h-3.5 w-3.5" />,
  check_in: <CheckCircle2 className="h-3.5 w-3.5" />,
  coaching: <Video className="h-3.5 w-3.5" />,
  feedback: <MessageSquare className="h-3.5 w-3.5" />,
  career: <Calendar className="h-3.5 w-3.5" />,
};

export function ConversationsList({ 
  conversations, 
  staff, 
  currentUserId,
  onScheduleConversation, 
  onViewConversation 
}: ConversationsListProps) {
  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Separate upcoming and past conversations
  const now = new Date();
  const upcoming = conversations
    .filter(c => !c.completed && !isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  
  const past = conversations
    .filter(c => c.completed || isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            Continuous Conversations
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule and track 1:1s, check-ins, and coaching sessions
          </p>
        </div>
        <Button onClick={onScheduleConversation} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Upcoming
          </h3>
          <span className="text-sm text-muted-foreground">{upcoming.length} meetings</span>
        </div>
        
        {upcoming.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming meetings</p>
              <Button variant="outline" className="mt-4" onClick={onScheduleConversation}>
                Schedule a meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((conv) => {
              const staffMember = getStaffMember(conv.staffId);
              const isManager = conv.managerId === currentUserId;
              const otherPerson = isManager ? staffMember : getStaffMember(conv.managerId);
              const meetingDate = parseISO(conv.scheduledDate);

              return (
                <Card 
                  key={conv.id}
                  className={cn(
                    "hover:shadow-md transition-all cursor-pointer",
                    isToday(meetingDate) && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => onViewConversation(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          {getDateLabel(conv.scheduledDate)}
                        </p>
                        <p className="text-lg font-bold">
                          {format(meetingDate, 'h:mm a')}
                        </p>
                      </div>

                      <div className="h-12 w-px bg-border" />

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherPerson?.avatar} />
                        <AvatarFallback>
                          {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{conv.title}</p>
                          <Badge className={typeColors[conv.type]}>
                            {typeIcons[conv.type]}
                            <span className="ml-1">{conversationTypeLabels[conv.type]}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          with {otherPerson?.firstName} {otherPerson?.lastName} • {conv.duration} min
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past Meetings ({past.length})
          </h3>
          
          <div className="space-y-3">
            {past.slice(0, 5).map((conv) => {
              const staffMember = getStaffMember(conv.staffId);
              const isManager = conv.managerId === currentUserId;
              const otherPerson = isManager ? staffMember : getStaffMember(conv.managerId);

              return (
                <Card 
                  key={conv.id}
                  className="hover:shadow-sm transition-all cursor-pointer opacity-80"
                  onClick={() => onViewConversation(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherPerson?.avatar} />
                        <AvatarFallback>
                          {otherPerson?.firstName?.[0]}{otherPerson?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{conv.title}</p>
                          {conv.completed && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{format(parseISO(conv.scheduledDate), 'MMM d, yyyy')}</span>
                          {conv.notes.length > 0 && (
                            <span className="flex items-center gap-1">
                              <StickyNote className="h-3.5 w-3.5" />
                              {conv.notes.length} notes
                            </span>
                          )}
                          {conv.actionItems.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ListChecks className="h-3.5 w-3.5" />
                              {conv.actionItems.length} action items
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationsList;
