import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PraisePost, PraiseCategory, praiseCategoryLabels, praiseCategoryEmojis } from '@/types/recognition';
import { StaffMember } from '@/types/staff';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Heart, MessageCircle, Send, ThumbsUp, Plus, Sparkles, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { praiseWallBadges } from '@/data/mockRecognitionData';

interface PraiseWallProps {
  posts: PraisePost[];
  staff: StaffMember[];
  currentUserId: string;
  onCreatePost: (data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

export function PraiseWall({ posts, staff, currentUserId, onCreatePost, onLike, onComment }: PraiseWallProps) {
  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<PraiseCategory>('teamwork');
  const [message, setMessage] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const getStaff = (id: string) => staff.find(s => s.id === id);

  const handleSubmit = async () => {
    if (!recipient || !message.trim()) return;
    setSending(true);
    try {
      await onCreatePost({ fromStaffId: currentUserId, toStaffId: recipient, category, message: message.trim(), badges: selectedBadges });
      setShowCompose(false);
      setRecipient('');
      setMessage('');
      setSelectedBadges([]);
    } finally {
      setSending(false);
    }
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Praise Wall
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Celebrate your colleagues' achievements</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Give Praise
        </Button>
      </div>

      {showCompose && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Celebrate Someone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger><SelectValue placeholder="Who are you praising?" /></SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.id !== currentUserId && s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarImage src={s.avatar} /><AvatarFallback className="text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback></Avatar>
                          {s.firstName} {s.lastName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Select value={category} onValueChange={v => setCategory(v as PraiseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(praiseCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{praiseCategoryEmojis[value as PraiseCategory]} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Textarea placeholder="What did they do that was awesome?" value={message} onChange={e => setMessage(e.target.value)} rows={3} />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Add badges (optional)</p>
              <div className="flex flex-wrap gap-2">
                {praiseWallBadges.map(badge => (
                  <Badge
                    key={badge.id}
                    variant={selectedBadges.includes(badge.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleBadge(badge.id)}
                  >
                    {badge.emoji} {badge.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!recipient || !message.trim() || sending}>
                <Send className="h-4 w-4 mr-2" />Post Praise
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No praise yet. Be the first to celebrate someone!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Recipient</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[40%]">Message</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="text-center">Engagement</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(post => {
                const from = getStaff(post.fromStaffId);
                const to = getStaff(post.toStaffId);
                const hasLiked = post.likes.includes(currentUserId);

                return (
                  <TableRow key={post.id} className="group hover:bg-muted/50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={to?.avatar} />
                          <AvatarFallback className="text-xs">{to?.firstName?.[0]}{to?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{to?.firstName} {to?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{to?.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="font-normal">
                        {praiseCategoryEmojis[post.category]} {praiseCategoryLabels[post.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <p className="text-sm line-clamp-2">{post.message}</p>
                        {post.badges.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {post.badges.map(b => {
                              const badge = praiseWallBadges.find(pb => pb.id === b);
                              return badge && (
                                <Badge key={b} variant="outline" className="text-xs py-0">
                                  {badge.emoji} {badge.label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={from?.avatar} />
                          <AvatarFallback className="text-xs">{from?.firstName?.[0]}{from?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">{from?.firstName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          className={cn(
                            "flex items-center gap-1 text-sm transition-colors",
                            hasLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                          )}
                          onClick={() => onLike(post.id)}
                        >
                          <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-current")} />
                          {post.likes.length}
                        </button>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments.length}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default PraiseWall;
