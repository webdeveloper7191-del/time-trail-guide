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
import { 
  Sparkles, 
  Plus, 
  Heart, 
  ThumbsUp, 
  Send, 
  Trophy,
  Gift,
  Coins,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PraisePost, PraiseCategory, praiseCategoryLabels, praiseCategoryEmojis } from '@/types/recognition';
import { mockStaff } from '@/data/mockStaffData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { praiseWallBadges, mockPraisePosts as initialPosts } from '@/data/mockRecognitionData';
import { toast } from 'sonner';

interface EmployeeRecognitionPanelProps {
  currentUserId: string;
}

// Reward points for current employee
const mockEmployeePoints = {
  totalPoints: 450,
  earnedThisMonth: 120,
  spentThisMonth: 50,
  praiseGiven: 8,
  praiseReceived: 12,
};

const topEarners = [
  { id: 'staff-1', name: 'Emily Chen', points: 680, avatar: 'EC' },
  { id: 'staff-2', name: 'Michael Johnson', points: 520, avatar: 'MJ' },
  { id: 'staff-3', name: 'Sarah Williams', points: 450, avatar: 'SW' },
  { id: 'staff-4', name: 'David Brown', points: 380, avatar: 'DB' },
  { id: 'staff-5', name: 'Jessica Lee', points: 320, avatar: 'JL' },
];

const rewardsCatalog = [
  { id: 'reward-1', name: '$25 Gift Card', points: 250, category: 'Gift Cards', icon: '🎁' },
  { id: 'reward-2', name: '$50 Gift Card', points: 500, category: 'Gift Cards', icon: '🎁' },
  { id: 'reward-3', name: 'Extra Day Off', points: 1000, category: 'Time Off', icon: '🏖️' },
  { id: 'reward-4', name: 'Team Lunch', points: 300, category: 'Experiences', icon: '🍽️' },
  { id: 'reward-5', name: 'Company Swag', points: 150, category: 'Merchandise', icon: '👕' },
];

export function EmployeeRecognitionPanel({ currentUserId }: EmployeeRecognitionPanelProps) {
  const [posts, setPosts] = useState<PraisePost[]>(initialPosts);
  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<PraiseCategory>('teamwork');
  const [message, setMessage] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [pointsToAward, setPointsToAward] = useState('25');

  const staff = mockStaff;
  const getStaff = (id: string) => staff.find(s => s.id === id);

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

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]);
  };

  const handleRedeem = (reward: typeof rewardsCatalog[0]) => {
    if (mockEmployeePoints.totalPoints >= reward.points) {
      toast.success(`Redeemed ${reward.name} for ${reward.points} points!`);
    } else {
      toast.error(`Not enough points. You need ${reward.points - mockEmployeePoints.totalPoints} more points.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Celebrate achievements and earn rewards
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCompose(true)}>
          Give Praise
        </Button>
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
              <Typography variant="caption" color="text.secondary">My Points</Typography>
              <Typography variant="h5" fontWeight={700}>{mockEmployeePoints.totalPoints}</Typography>
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
                +{mockEmployeePoints.earnedThisMonth}
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
              <Typography variant="h5" fontWeight={700}>{mockEmployeePoints.praiseGiven}</Typography>
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
            Redeem Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          {/* Compose Post Card */}
          {showCompose && (
            <Card sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Celebrate a Colleague
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
                      Points to award
                    </Typography>
                    <Select value={pointsToAward} onValueChange={setPointsToAward}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 points</SelectItem>
                        <SelectItem value="25">25 points</SelectItem>
                        <SelectItem value="50">50 points</SelectItem>
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
            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Trophy className="h-5 w-5 text-amber-500" />
              This Month's Top Earners
            </Typography>
            <Stack spacing={2} sx={{ mt: 3 }}>
              {topEarners.map((earner, index) => (
                <Stack 
                  key={earner.id} 
                  direction="row" 
                  alignItems="center" 
                  spacing={2}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: index === 0 ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                    border: index < 3 ? '1px solid' : 'none',
                    borderColor: index === 0 ? 'rgba(251, 191, 36, 0.3)' : index === 1 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(180, 83, 9, 0.2)',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight={700}
                    sx={{ 
                      width: 32,
                      color: index === 0 ? 'rgb(251, 191, 36)' : index === 1 ? 'rgb(156, 163, 175)' : index === 2 ? 'rgb(180, 83, 9)' : 'text.secondary',
                    }}
                  >
                    #{index + 1}
                  </Typography>
                  <Avatar sx={{ width: 40, height: 40 }}>{earner.avatar}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{earner.name}</Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Coins className="h-4 w-4 text-amber-600" />
                    <Typography variant="body2" fontWeight={700}>{earner.points}</Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardsCatalog.map(reward => (
              <Card key={reward.id} sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ fontSize: 32 }}>{reward.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{reward.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{reward.category}</Typography>
                  </Box>
                  <Stack alignItems="flex-end" spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Coins className="h-4 w-4 text-amber-600" />
                      <Typography variant="body2" fontWeight={700}>{reward.points}</Typography>
                    </Stack>
                    <Button 
                      size="small" 
                      variant={mockEmployeePoints.totalPoints >= reward.points ? 'contained' : 'outlined'}
                      disabled={mockEmployeePoints.totalPoints < reward.points}
                      onClick={() => handleRedeem(reward)}
                    >
                      Redeem
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
