import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Target,
  Crown,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Gift,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Play,
  BookOpen,
  GraduationCap,
  Shield,
  Infinity,
  Sunrise,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Badge as GamificationBadge, 
  GamificationProfile, 
  LearningChallenge, 
  LeaderboardEntry, 
  XPTransaction,
  badgeRarityColors,
  calculateLevel,
  LEVEL_TITLES,
} from '@/types/lmsAdvanced';
import { mockBadges, mockGamificationProfiles, mockChallenges, mockLeaderboard, mockXPTransactions } from '@/data/mockGamificationData';
import { format, parseISO, differenceInHours, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface GamificationPanelProps {
  currentUserId: string;
}

const badgeIcons: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Rocket: <Rocket className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  Calendar: <Calendar className="h-6 w-6" />,
  Infinity: <Infinity className="h-6 w-6" />,
  Target: <Target className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  Sunrise: <Sunrise className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
};

const rarityGradients: Record<string, string> = {
  common: 'from-slate-400 to-slate-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 via-orange-500 to-red-500',
};

export function GamificationPanel({ currentUserId }: GamificationPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const userProfile = useMemo(() => 
    mockGamificationProfiles.find(p => p.staffId === currentUserId) || mockGamificationProfiles[0],
    [currentUserId]
  );

  const levelInfo = calculateLevel(userProfile.totalXP);
  const userBadges = useMemo(() => {
    return userProfile.badges.map(ub => ({
      ...ub,
      badge: mockBadges.find(b => b.id === ub.badgeId)!,
    })).filter(ub => ub.badge);
  }, [userProfile]);

  const activeChallenges = mockChallenges.filter(c => c.status === 'active');
  const userChallenges = activeChallenges.filter(c => 
    c.participants.some(p => p.staffId === currentUserId)
  );

  const recentXP = mockXPTransactions
    .filter(t => t.staffId === currentUserId)
    .slice(0, 10);

  const handleJoinChallenge = (challengeId: string) => {
    toast.success('Joined challenge! Good luck! 🎯');
  };

  const getTimeRemaining = (endDate: string) => {
    const end = parseISO(endDate);
    const hours = differenceInHours(end, new Date());
    if (hours < 24) return `${hours}h left`;
    const days = differenceInDays(end, new Date());
    return `${days}d left`;
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'weekly': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'monthly': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'special': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getXPTypeIcon = (type: string) => {
    switch (type) {
      case 'course_complete': return <GraduationCap className="h-4 w-4" />;
      case 'module_complete': return <BookOpen className="h-4 w-4" />;
      case 'quiz_pass': return <CheckCircle2 className="h-4 w-4" />;
      case 'streak_bonus': return <Flame className="h-4 w-4" />;
      case 'challenge_complete': return <Trophy className="h-4 w-4" />;
      case 'badge_earned': return <Award className="h-4 w-4" />;
      case 'perfect_score': return <Star className="h-4 w-4" />;
      case 'speed_bonus': return <Zap className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Level Circle */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <div className="w-24 h-24 rounded-full bg-background flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{levelInfo.level}</span>
                  <span className="text-xs text-muted-foreground">Level</span>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  {LEVEL_TITLES[Math.min(Math.floor(levelInfo.level / 2), LEVEL_TITLES.length - 1)]}
                </Badge>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{userProfile.totalXP.toLocaleString()} XP</span>
                  <span className="text-sm text-muted-foreground">
                    {levelInfo.currentXP} / {levelInfo.nextLevelXP} to Level {levelInfo.level + 1}
                  </span>
                </div>
                <Progress value={levelInfo.progress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-orange-500">
                    <Flame className="h-5 w-5" />
                    <span className="text-xl font-bold">{userProfile.streakCurrent}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Day Streak</span>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-purple-500">
                    <Award className="h-5 w-5" />
                    <span className="text-xl font-bold">{userBadges.length}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Badges</span>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-green-500">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xl font-bold">+{userProfile.weeklyXP}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">This Week</span>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <Trophy className="h-5 w-5" />
                    <span className="text-xl font-bold">#{userProfile.rank}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Rank</span>
                </div>
              </div>
            </div>

            {/* Featured Badges */}
            <div className="hidden lg:flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">Featured Badges</span>
              <div className="flex gap-2">
                {userBadges.filter(ub => ub.featured).slice(0, 3).map((ub) => (
                  <div
                    key={ub.id}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br",
                      rarityGradients[ub.badge.rarity]
                    )}
                    title={ub.badge.name}
                  >
                    <div className="text-white">
                      {badgeIcons[ub.badge.icon] || <Star className="h-6 w-6" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Sparkles className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2">
            <Target className="h-4 w-4" /> Challenges
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" /> Badges
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Challenges */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userChallenges.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No active challenges. Join one below!
                  </p>
                ) : (
                  userChallenges.slice(0, 3).map((challenge) => {
                    const participant = challenge.participants.find(p => p.staffId === currentUserId);
                    return (
                      <div key={challenge.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{challenge.title}</span>
                          <Badge className={getChallengeTypeColor(challenge.type)}>
                            {getTimeRemaining(challenge.endDate)}
                          </Badge>
                        </div>
                        <Progress value={participant?.progress || 0} className="h-2" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{participant?.progress || 0}% complete</span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            +{challenge.xpReward} XP
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('challenges')}>
                  View All Challenges
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent XP */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Recent XP Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {recentXP.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          {getXPTypeIcon(tx.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(tx.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          +{tx.amount} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recent Badges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Your Badges ({userBadges.length}/{mockBadges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {userBadges.map((ub) => (
                  <div key={ub.id} className="text-center space-y-2">
                    <div
                      className={cn(
                        "w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
                        rarityGradients[ub.badge.rarity]
                      )}
                    >
                      <div className="text-white">
                        {badgeIcons[ub.badge.icon] || <Star className="h-8 w-8" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate">{ub.badge.name}</p>
                      <Badge variant="outline" className={cn("text-[10px]", badgeRarityColors[ub.badge.rarity])}>
                        {ub.badge.rarity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('badges')}>
                View All Badges
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          <div className="grid gap-4">
            {activeChallenges.map((challenge) => {
              const isJoined = challenge.participants.some(p => p.staffId === currentUserId);
              const participant = challenge.participants.find(p => p.staffId === currentUserId);
              
              return (
                <Card key={challenge.id} className={cn(
                  "overflow-hidden",
                  participant?.completed && "border-green-500"
                )}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center shrink-0",
                        challenge.type === 'daily' && "bg-green-100 text-green-600",
                        challenge.type === 'weekly' && "bg-blue-100 text-blue-600",
                        challenge.type === 'monthly' && "bg-purple-100 text-purple-600",
                        challenge.type === 'special' && "bg-amber-100 text-amber-600",
                      )}>
                        <Target className="h-8 w-8" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{challenge.title}</h4>
                          <Badge className={getChallengeTypeColor(challenge.type)}>
                            {challenge.type}
                          </Badge>
                          {participant?.completed && (
                            <Badge className="bg-green-500">Completed!</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                        
                        {isJoined && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{participant?.progress || 0}% complete</span>
                              <span className="text-muted-foreground">{getTimeRemaining(challenge.endDate)}</span>
                            </div>
                            <Progress value={participant?.progress || 0} className="h-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Sparkles className="h-4 w-4" />
                            +{challenge.xpReward} XP
                          </div>
                          {challenge.badgeReward && (
                            <span className="text-xs text-muted-foreground">+ Badge</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {challenge.participants.length} joined
                        </div>
                        {!isJoined && (
                          <Button size="sm" onClick={() => handleJoinChallenge(challenge.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockBadges.map((badge) => {
              const earned = userBadges.find(ub => ub.badgeId === badge.id);
              
              return (
                <Card key={badge.id} className={cn(
                  "overflow-hidden transition-all",
                  !earned && "opacity-60 grayscale"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br shrink-0",
                          earned ? rarityGradients[badge.rarity] : "from-slate-300 to-slate-400"
                        )}
                      >
                        <div className="text-white">
                          {badgeIcons[badge.icon] || <Star className="h-8 w-8" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{badge.name}</h4>
                          <Badge variant="outline" className={cn("text-xs", badgeRarityColors[badge.rarity])}>
                            {badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            +{badge.xpReward} XP
                          </Badge>
                          {earned && (
                            <span className="text-xs text-muted-foreground">
                              Earned {format(parseISO(earned.earnedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Weekly Leaderboard
              </CardTitle>
              <CardDescription>Top learners this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockLeaderboard.map((entry) => {
                  const isCurrentUser = entry.staffId === currentUserId;
                  const medalColor = entry.rank === 1 ? 'text-amber-500' : 
                                     entry.rank === 2 ? 'text-slate-400' : 
                                     entry.rank === 3 ? 'text-amber-700' : 'text-muted-foreground';
                  
                  return (
                    <div
                      key={entry.staffId}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg transition-colors",
                        isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("w-8 text-center font-bold", medalColor)}>
                        {entry.rank <= 3 ? (
                          <Medal className="h-6 w-6 mx-auto" />
                        ) : (
                          `#${entry.rank}`
                        )}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.staffAvatar} />
                        <AvatarFallback>
                          {entry.staffName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.staffName}</span>
                          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.staffDepartment}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <span className="font-semibold">{entry.xp.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                        <div className="text-center">
                          <span className="font-semibold">Lv.{entry.level}</span>
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <div className="text-center">
                          <span className="font-semibold">{entry.badgeCount}</span>
                          <p className="text-xs text-muted-foreground">Badges</p>
                        </div>
                        {entry.change !== undefined && entry.change !== 0 && (
                          <div className={cn(
                            "flex items-center gap-1",
                            entry.change > 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {entry.change > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="text-xs">{Math.abs(entry.change)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
