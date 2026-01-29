import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Avatar,
  Chip,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Plus, 
  Heart, 
  MessageCircle, 
  ThumbsUp, 
  Send, 
  Trophy,
  Award,
  Gift,
  Coins,
  Star,
  TrendingUp,
} from 'lucide-react';
import { PraisePost, PraiseCategory, praiseCategoryLabels, praiseCategoryEmojis } from '@/types/recognition';
import { StaffMember } from '@/types/staff';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { praiseWallBadges, mockPraisePosts as initialPosts } from '@/data/mockRecognitionData';
import { toast } from 'sonner';

interface UnifiedRecognitionPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

// Reward points system
interface RewardPoints {
  staffId: string;
  totalPoints: number;
  earnedThisMonth: number;
  spentThisMonth: number;
  history: {
    id: string;
    type: 'earned' | 'spent' | 'awarded';
    points: number;
    reason: string;
    date: string;
  }[];
}

const mockRewardPoints: RewardPoints[] = [
  {
    staffId: 'staff-1',
    totalPoints: 450,
    earnedThisMonth: 120,
    spentThisMonth: 50,
    history: [
      { id: 'r1', type: 'earned', points: 50, reason: 'Received praise from Sarah', date: '2025-01-15' },
      { id: 'r2', type: 'earned', points: 25, reason: 'Completed training module', date: '2025-01-12' },
      { id: 'r3', type: 'earned', points: 45, reason: 'Team collaboration award', date: '2025-01-10' },
      { id: 'r4', type: 'spent', points: -50, reason: 'Redeemed for gift card', date: '2025-01-08' },
    ],
  },
  {
    staffId: 'staff-2',
    totalPoints: 680,
    earnedThisMonth: 95,
    spentThisMonth: 0,
    history: [
      { id: 'r5', type: 'earned', points: 50, reason: 'Leadership recognition', date: '2025-01-14' },
      { id: 'r6', type: 'awarded', points: 45, reason: 'Mentoring new team member', date: '2025-01-11' },
    ],
  },
  {
    staffId: 'staff-3',
    totalPoints: 320,
    earnedThisMonth: 75,
    spentThisMonth: 25,
    history: [
      { id: 'r7', type: 'earned', points: 50, reason: 'Going above and beyond', date: '2025-01-13' },
      { id: 'r8', type: 'earned', points: 25, reason: 'Positive feedback from parents', date: '2025-01-09' },
    ],
  },
  {
    staffId: 'staff-4',
    totalPoints: 185,
    earnedThisMonth: 60,
    spentThisMonth: 0,
    history: [
      { id: 'r9', type: 'earned', points: 35, reason: 'Innovation award', date: '2025-01-16' },
      { id: 'r10', type: 'earned', points: 25, reason: 'Teamwork recognition', date: '2025-01-07' },
    ],
  },
];

export function UnifiedRecognitionPanel({ staff, currentUserId }: UnifiedRecognitionPanelProps) {
  const [posts, setPosts] = useState<PraisePost[]>(initialPosts);
  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<PraiseCategory>('teamwork');
  const [message, setMessage] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [pointsToAward, setPointsToAward] = useState('25');
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [awardRecipient, setAwardRecipient] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [awardAmount, setAwardAmount] = useState('50');

  const getStaff = (id: string) => staff.find(s => s.id === id);
  const currentUserPoints = mockRewardPoints.find(p => p.staffId === currentUserId);

  const handleSubmit = async () => {
    if (!recipient || !message.trim()) return;
    setSending(true);
    try {
      const newPost: PraisePost = {
        id: `praise-${Date.now()}`,
        fromStaffId: currentUserId,
        toStaffId: recipient,
        category,
        message: message.trim(),
        badges: selectedBadges,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts(prev => [newPost, ...prev]);
      toast.success(`Praise sent to ${getStaff(recipient)?.firstName}! 🎉 They earned ${pointsToAward} points.`);
      setShowCompose(false);
      setRecipient('');
      setMessage('');
      setSelectedBadges([]);
      setPointsToAward('25');
    } finally {
      setSending(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likes.includes(currentUserId);
        return {
          ...p,
          likes: hasLiked 
            ? p.likes.filter(id => id !== currentUserId)
            : [...p.likes, currentUserId],
        };
      }
      return p;
    }));
  };

  const handleAwardPoints = () => {
    if (!awardRecipient || !awardReason.trim() || !awardAmount) return;
    
    toast.success(`Awarded ${awardAmount} points to ${getStaff(awardRecipient)?.firstName}!`);
    setShowAwardPoints(false);
    setAwardRecipient('');
    setAwardReason('');
    setAwardAmount('50');
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]);
  };

  const topEarners = [...mockRewardPoints]
    .sort((a, b) => b.earnedThisMonth - a.earnedThisMonth)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles className="h-5 w-5 text-primary" />
            Recognition & Rewards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Celebrate achievements and reward your team
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Gift size={16} />} onClick={() => setShowAwardPoints(true)}>
            Award Points
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCompose(true)}>
            Give Praise
          </Button>
        </Stack>
      </Stack>

      {/* Points Overview Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(251, 191, 36, 0.12)',
            }}>
              <Coins className="h-5 w-5 text-amber-600" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Your Points</Typography>
              <Typography variant="h5" fontWeight={700}>{currentUserPoints?.totalPoints || 0}</Typography>
            </Box>
          </Stack>
        </Card>
        <Card sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(34, 197, 94, 0.12)',
            }}>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Earned This Month</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                +{currentUserPoints?.earnedThisMonth || 0}
              </Typography>
            </Box>
          </Stack>
        </Card>
        <Card sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(168, 85, 247, 0.12)',
            }}>
              <Award className="h-5 w-5 text-purple-600" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Praise Given</Typography>
              <Typography variant="h5" fontWeight={700}>
                {posts.filter(p => p.fromStaffId === currentUserId).length}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Stack>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList>
          <TabsTrigger value="feed">
            <Heart className="h-4 w-4 mr-2" />
            Praise Wall
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="h-4 w-4 mr-2" />
            Rewards Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          {/* Compose Post Card */}
          {showCompose && (
            <Card sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Celebrate Someone
              </Typography>
              <Stack spacing={3}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger><SelectValue placeholder="Who are you praising?" /></SelectTrigger>
                      <SelectContent>
                        {staff.filter(s => s.id !== currentUserId && s.status === 'active').map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                                {s.firstName[0]}{s.lastName[0]}
                              </Avatar>
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
                          <SelectItem key={value} value={value}>
                            {praiseCategoryEmojis[value as PraiseCategory]} {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea 
                  placeholder="What did they do that was awesome?" 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  rows={3} 
                />

                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                    Add badges (optional)
                  </Typography>
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
                </Box>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                      <Coins className="h-3 w-3 inline mr-1" />
                      Reward points to include
                    </Typography>
                    <Select value={pointsToAward} onValueChange={setPointsToAward}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 points</SelectItem>
                        <SelectItem value="25">25 points</SelectItem>
                        <SelectItem value="50">50 points</SelectItem>
                        <SelectItem value="100">100 points</SelectItem>
                      </SelectContent>
                    </Select>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="outlined" onClick={() => setShowCompose(false)}>Cancel</Button>
                    <Button 
                      variant="contained" 
                      onClick={handleSubmit} 
                      disabled={!recipient || !message.trim() || sending}
                      startIcon={<Send size={16} />}
                    >
                      Post Praise
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          )}

          {/* Praise Posts */}
          <Stack spacing={3}>
            {posts.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <Typography color="text.secondary">No praise yet. Be the first to celebrate someone!</Typography>
              </Card>
            ) : (
              posts.map(post => {
                const from = getStaff(post.fromStaffId);
                const to = getStaff(post.toStaffId);
                const hasLiked = post.likes.includes(currentUserId);

                return (
                  <Card key={post.id} sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2}>
                      <Avatar sx={{ width: 44, height: 44 }}>
                        {to?.firstName?.[0]}{to?.lastName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {to?.firstName} {to?.lastName}
                          </Typography>
                          <Chip 
                            label={`${praiseCategoryEmojis[post.category]} ${praiseCategoryLabels[post.category]}`}
                            size="small"
                            sx={{ height: 22, fontSize: 11 }}
                          />
                          <Chip
                            icon={<Coins className="h-3 w-3" />}
                            label="+25 pts"
                            size="small"
                            sx={{ 
                              height: 22, 
                              fontSize: 11,
                              bgcolor: 'rgba(251, 191, 36, 0.12)',
                              color: 'rgb(161, 98, 7)',
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ mb: 2 }}>{post.message}</Typography>
                        {post.badges.length > 0 && (
                          <div className="flex gap-1 mb-2">
                            {post.badges.map(b => {
                              const badge = praiseWallBadges.find(pb => pb.id === b);
                              return badge && (
                                <Badge key={b} variant="outline" className="text-xs">
                                  {badge.emoji} {badge.label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Typography variant="caption" color="text.secondary">
                            From {from?.firstName} {from?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                          <Button 
                            variant="text" 
                            size="small" 
                            className={cn(hasLiked && 'text-rose-500')}
                            onClick={() => handleLike(post.id)}
                            startIcon={<ThumbsUp className={cn('h-4 w-4', hasLiked && 'fill-current')} />}
                          >
                            {post.likes.length}
                          </Button>
                          <Button variant="text" size="small" startIcon={<MessageCircle className="h-4 w-4" />}>
                            {post.comments.length}
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                );
              })
            )}
          </Stack>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Top Earners This Month
            </Typography>
            <Stack spacing={2}>
              {topEarners.map((earner, index) => {
                const person = getStaff(earner.staffId);
                return (
                  <Stack key={earner.staffId} direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: index === 0 ? 'rgba(251, 191, 36, 0.2)' : index === 1 ? 'rgba(156, 163, 175, 0.2)' : index === 2 ? 'rgba(180, 83, 9, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                      color: index === 0 ? 'rgb(161, 98, 7)' : index === 1 ? 'rgb(107, 114, 128)' : index === 2 ? 'rgb(146, 64, 14)' : 'rgb(100, 116, 139)',
                      fontWeight: 700,
                      fontSize: 14,
                    }}>
                      {index + 1}
                    </Box>
                    <Avatar sx={{ width: 36, height: 36 }}>
                      {person?.firstName?.[0]}{person?.lastName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {person?.firstName} {person?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person?.position}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="warning.main">
                        {earner.earnedThisMonth} pts
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        this month
                      </Typography>
                    </Box>
                    {index < 3 && (
                      <Star className={cn(
                        'h-5 w-5',
                        index === 0 && 'text-amber-500 fill-amber-500',
                        index === 1 && 'text-gray-400 fill-gray-400',
                        index === 2 && 'text-amber-700 fill-amber-700',
                      )} />
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Redeem your points for these rewards. Contact HR to claim your reward.
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 1, name: 'Coffee Voucher', points: 50, emoji: '☕', description: 'Free coffee at the local café' },
              { id: 2, name: 'Extra Break', points: 100, emoji: '⏰', description: 'Extra 15-min break' },
              { id: 3, name: 'Lunch on Us', points: 200, emoji: '🍽️', description: 'Free lunch at any restaurant' },
              { id: 4, name: 'Half Day Off', points: 500, emoji: '🏖️', description: 'Leave 4 hours early' },
              { id: 5, name: 'Gift Card', points: 300, emoji: '🎁', description: '$25 gift card of your choice' },
              { id: 6, name: 'Team Shoutout', points: 25, emoji: '📣', description: 'Featured in team newsletter' },
            ].map(reward => (
              <Card key={reward.id} sx={{ p: 3 }}>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Typography variant="h4">{reward.emoji}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{reward.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{reward.description}</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                      <Chip 
                        icon={<Coins className="h-3 w-3" />}
                        label={`${reward.points} pts`}
                        size="small"
                        sx={{ bgcolor: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={(currentUserPoints?.totalPoints || 0) < reward.points}
                      >
                        Redeem
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Award Points Modal */}
      {showAwardPoints && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowAwardPoints(false)}
        >
          <Card 
            sx={{ p: 4, maxWidth: 400, width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              <Gift className="h-5 w-5 inline mr-2" />
              Award Points
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Recognize exceptional work with bonus points
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" fontWeight={500} gutterBottom sx={{ display: 'block' }}>
                  Recipient
                </Typography>
                <Select value={awardRecipient} onValueChange={setAwardRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.id !== currentUserId && s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={500} gutterBottom sx={{ display: 'block' }}>
                  Points to Award
                </Typography>
                <Select value={awardAmount} onValueChange={setAwardAmount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 points</SelectItem>
                    <SelectItem value="50">50 points</SelectItem>
                    <SelectItem value="100">100 points</SelectItem>
                    <SelectItem value="200">200 points</SelectItem>
                    <SelectItem value="500">500 points</SelectItem>
                  </SelectContent>
                </Select>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={500} gutterBottom sx={{ display: 'block' }}>
                  Reason
                </Typography>
                <Textarea
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  placeholder="Why are you awarding these points?"
                  rows={2}
                />
              </Box>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" fullWidth onClick={() => setShowAwardPoints(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleAwardPoints}
                  disabled={!awardRecipient || !awardReason.trim()}
                >
                  Award Points
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Box>
      )}
    </div>
  );
}
