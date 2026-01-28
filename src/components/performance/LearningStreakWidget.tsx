import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flame, 
  Target, 
  Trophy, 
  Calendar, 
  Clock, 
  Zap,
  Shield,
  ChevronRight,
  Award,
  Star,
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { LearningStreak, DailyActivity, Achievement, achievementIcons } from '@/types/lmsEngagement';
import { mockLearningStreak, mockDailyActivities, mockAchievements } from '@/data/mockLmsEngagementData';

interface LearningStreakWidgetProps {
  currentUserId: string;
}

export function LearningStreakWidget({ currentUserId }: LearningStreakWidgetProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  const streak = mockLearningStreak;
  const activities = mockDailyActivities;
  const achievements = mockAchievements;

  const dailyProgress = Math.min(100, (streak.todayMinutes / streak.dailyGoalMinutes) * 100);
  const weeklyProgress = Math.min(100, (streak.weekMinutes / streak.weeklyGoalMinutes) * 100);
  const dailyGoalMet = streak.todayMinutes >= streak.dailyGoalMinutes;

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  // Get last 7 days for mini calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const getActivityForDate = (date: Date) => 
    activities.find(a => isSameDay(parseISO(a.date), date));

  return (
    <div className="space-y-4">
      {/* Main Streak Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-4 text-white",
          dailyGoalMet 
            ? "bg-gradient-to-br from-orange-500 to-red-500" 
            : "bg-gradient-to-br from-primary to-primary/80"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-white/20">
                <Flame className="h-8 w-8" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold">{streak.currentStreak} days</p>
              </div>
            </div>
            {dailyGoalMet && (
              <Badge className="bg-white/20 text-white border-0 text-sm">
                ✓ Goal Met!
              </Badge>
            )}
          </div>
          
          {/* Mini Week Calendar */}
          <div className="mt-4 flex items-center justify-between gap-1">
            {last7Days.map((date, idx) => {
              const activity = getActivityForDate(date);
              const isCurrentDay = isToday(date);
              return (
                <div key={idx} className="flex-1 text-center">
                  <p className="text-xs text-white/60 mb-1">
                    {format(date, 'EEE').charAt(0)}
                  </p>
                  <div className={cn(
                    "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium",
                    activity?.goalMet 
                      ? "bg-white text-orange-500"
                      : activity?.minutesLearned > 0
                        ? "bg-white/40 text-white"
                        : "bg-white/20 text-white/60",
                    isCurrentDay && "ring-2 ring-white ring-offset-2 ring-offset-orange-500"
                  )}>
                    {activity?.goalMet ? '🔥' : format(date, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <CardContent className="p-4 space-y-4">
          {/* Daily Goal Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Daily Goal</span>
              </div>
              <span className="text-muted-foreground">
                {streak.todayMinutes}/{streak.dailyGoalMinutes} min
              </span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
          </div>
          
          {/* Weekly Goal Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Weekly Goal</span>
              </div>
              <span className="text-muted-foreground">
                {streak.weekMinutes}/{streak.weeklyGoalMinutes} min
              </span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Trophy className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold">{streak.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold">{streak.streakFreezesAvailable}</p>
              <p className="text-xs text-muted-foreground">Freezes Left</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Award className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <p className="text-lg font-bold">{unlockedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
            <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    All Achievements
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-6 pr-4">
                    {/* Unlocked */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Unlocked ({unlockedAchievements.length})
                      </h4>
                      <div className="space-y-2">
                        {unlockedAchievements.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                      </div>
                    </div>
                    
                    {/* In Progress */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        In Progress ({lockedAchievements.length})
                      </h4>
                      <div className="space-y-2">
                        {lockedAchievements.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Recent Achievements Preview */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {unlockedAchievements.slice(0, 4).map((achievement) => (
              <div 
                key={achievement.id}
                className="flex-shrink-0 w-16 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center text-2xl">
                  {achievementIcons[achievement.icon] || '🏆'}
                </div>
                <p className="text-xs font-medium mt-1 line-clamp-2">{achievement.title}</p>
              </div>
            ))}
            {lockedAchievements.slice(0, 2).map((achievement) => (
              <div 
                key={achievement.id}
                className="flex-shrink-0 w-16 text-center opacity-50"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-2xl grayscale">
                  {achievementIcons[achievement.icon] || '🔒'}
                </div>
                <p className="text-xs font-medium mt-1 line-clamp-2">{achievement.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      achievement.unlocked ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-muted/50"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-xl",
        achievement.unlocked 
          ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50"
          : "bg-muted grayscale"
      )}>
        {achievementIcons[achievement.icon] || '🔒'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn("font-medium text-sm", !achievement.unlocked && "text-muted-foreground")}>
            {achievement.title}
          </h4>
          {achievement.unlocked && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Earned
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {!achievement.unlocked && (
          <div className="mt-1.5">
            <Progress value={achievement.progress} className="h-1" />
            <p className="text-xs text-muted-foreground mt-0.5">{achievement.progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}
