import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Target, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Clock, 
  GraduationCap,
  Briefcase,
  Award,
  Star,
  AlertCircle,
  BookOpen,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CareerPath, CareerLevel, StaffCareerProgress, SkillLevel, skillLevelLabels, skillLevelValues } from '@/types/advancedPerformance';
import { mockCareerPaths, mockCareerProgress, mockSkills, mockStaffSkills } from '@/data/mockAdvancedPerformanceData';
import { toast } from 'sonner';

interface EmployeeCareerPathingPanelProps {
  currentUserId: string;
}

const levelColors = [
  { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', accent: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', accent: 'bg-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', accent: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', accent: 'bg-rose-500' },
];

export function EmployeeCareerPathingPanel({ currentUserId }: EmployeeCareerPathingPanelProps) {
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const [selectedTargetLevel, setSelectedTargetLevel] = useState<string>('');
  const [showLevelDetail, setShowLevelDetail] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CareerLevel | null>(null);

  // Get current career progress for user
  const careerProgress = useMemo(() => {
    // Use staff-1 for demo since currentUserId might not have data
    return mockCareerProgress.find(p => p.staffId === 'staff-1') || mockCareerProgress[0];
  }, [currentUserId]);

  const currentPath = useMemo(() => {
    return mockCareerPaths.find(p => p.id === careerProgress?.currentPathId) || mockCareerPaths[0];
  }, [careerProgress]);

  const currentLevel = useMemo(() => {
    if (!currentPath || !careerProgress) return null;
    return currentPath.levels.find(l => l.id === careerProgress.currentLevelId);
  }, [currentPath, careerProgress]);

  const targetLevel = useMemo(() => {
    if (!currentPath || !careerProgress?.targetLevelId) return null;
    return currentPath.levels.find(l => l.id === careerProgress.targetLevelId);
  }, [currentPath, careerProgress]);

  const staffSkills = mockStaffSkills['staff-1'] || [];

  // Calculate skill gaps for each level
  const calculateSkillGaps = (level: CareerLevel) => {
    const gaps: { skillName: string; current: SkillLevel; required: SkillLevel; met: boolean }[] = [];
    
    level.requiredSkills.forEach(req => {
      const skill = mockSkills.find(s => s.id === req.skillId);
      const staffSkill = staffSkills.find(s => s.skillId === req.skillId);
      const currentLevel = staffSkill?.currentLevel || 'none';
      const met = skillLevelValues[currentLevel] >= skillLevelValues[req.minLevel];
      
      gaps.push({
        skillName: skill?.name || 'Unknown Skill',
        current: currentLevel,
        required: req.minLevel,
        met,
      });
    });
    
    return gaps;
  };

  const getLevelStatus = (level: CareerLevel) => {
    if (!currentLevel) return 'locked';
    if (level.level < currentLevel.level) return 'completed';
    if (level.level === currentLevel.level) return 'current';
    if (level.level === currentLevel.level + 1) return 'next';
    return 'locked';
  };

  const getOverallProgress = (level: CareerLevel) => {
    const gaps = calculateSkillGaps(level);
    if (gaps.length === 0) return 100;
    const met = gaps.filter(g => g.met).length;
    return Math.round((met / gaps.length) * 100);
  };

  const handleSetTarget = () => {
    if (!selectedTargetLevel) {
      toast.error('Please select a target level');
      return;
    }
    toast.success('Career target updated successfully!');
    setShowTargetSheet(false);
  };

  const handleViewLevel = (level: CareerLevel) => {
    setSelectedLevel(level);
    setShowLevelDetail(true);
  };

  const availableTargets = currentPath?.levels.filter(l => l.level > (currentLevel?.level || 0)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            My Career Path
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your progression and set development goals
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            setSelectedTargetLevel(careerProgress?.targetLevelId || '');
            setShowTargetSheet(true);
          }}
        >
          <Target className="h-4 w-4 mr-2" />
          Set Target
        </Button>
      </div>

      {/* Current Status Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Position */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Current Position
              </p>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{currentLevel?.title || 'Not Set'}</p>
                  <p className="text-sm text-muted-foreground">{currentPath?.name}</p>
                </div>
              </div>
            </div>

            {/* Target Level */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Target Level
              </p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  targetLevel ? "bg-amber-500/20" : "bg-muted"
                )}>
                  <Target className={cn(
                    "h-5 w-5",
                    targetLevel ? "text-amber-600" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  {targetLevel ? (
                    <>
                      <p className="font-semibold">{targetLevel.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {careerProgress?.estimatedTimeToNextLevel || 'Timeline TBD'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-muted-foreground">No target set</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-sm" 
                        onClick={() => setShowTargetSheet(true)}
                      >
                        Set your goal →
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Readiness */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Next Level Readiness
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {careerProgress?.readinessPercentage || 0}%
                  </span>
                  <Badge className={cn(
                    "text-xs",
                    (careerProgress?.readinessPercentage || 0) >= 80 
                      ? "bg-green-100 text-green-700" 
                      : (careerProgress?.readinessPercentage || 0) >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  )}>
                    {(careerProgress?.readinessPercentage || 0) >= 80 
                      ? 'On Track' 
                      : (careerProgress?.readinessPercentage || 0) >= 50 
                        ? 'In Progress' 
                        : 'Getting Started'}
                  </Badge>
                </div>
                <Progress 
                  value={careerProgress?.readinessPercentage || 0} 
                  className="h-2" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps */}
      {careerProgress?.skillGaps && careerProgress.skillGaps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Skills to Develop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {careerProgress.skillGaps.map((gap) => (
                <div 
                  key={gap.skillId}
                  className="p-3 rounded-lg bg-background border border-amber-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{gap.skillName}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        gap.priority === 'critical' && "border-red-400 text-red-700",
                        gap.priority === 'high' && "border-orange-400 text-orange-700",
                        gap.priority === 'medium' && "border-amber-400 text-amber-700",
                        gap.priority === 'low' && "border-blue-400 text-blue-700"
                      )}
                    >
                      {gap.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{skillLevelLabels[gap.currentLevel]}</span>
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="font-medium text-foreground">
                      {skillLevelLabels[gap.requiredLevel]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Ladder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Career Ladder: {currentPath?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-border" />

            <div className="space-y-1">
              {[...(currentPath?.levels || [])].reverse().map((level, idx) => {
                const actualIdx = (currentPath?.levels.length || 0) - 1 - idx;
                const status = getLevelStatus(level);
                const colorSet = levelColors[actualIdx % levelColors.length];
                const progress = getOverallProgress(level);
                const isTarget = targetLevel?.id === level.id;

                return (
                  <div 
                    key={level.id}
                    onClick={() => handleViewLevel(level)}
                    className={cn(
                      "relative flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all",
                      status === 'current' && "bg-primary/5 border-2 border-primary",
                      status === 'completed' && "opacity-75 hover:opacity-100",
                      status === 'next' && "bg-amber-50/50 border border-dashed border-amber-300",
                      status === 'locked' && "opacity-50",
                      isTarget && status !== 'current' && "ring-2 ring-amber-400 ring-offset-2",
                      "hover:bg-accent/50"
                    )}
                  >
                    {/* Level indicator */}
                    <div
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 z-10",
                        status === 'completed' && "bg-green-500 border-green-500 text-white",
                        status === 'current' && `${colorSet.accent} border-primary text-white`,
                        status === 'next' && `${colorSet.bg} ${colorSet.border} ${colorSet.text}`,
                        status === 'locked' && "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : status === 'locked' ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <span className="font-bold text-lg">{level.level}</span>
                      )}
                    </div>

                    {/* Level details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          "font-semibold",
                          status === 'current' && "text-primary"
                        )}>
                          {level.title}
                        </h4>
                        {status === 'current' && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Current
                          </Badge>
                        )}
                        {isTarget && status !== 'current' && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Target
                          </Badge>
                        )}
                        {status === 'next' && !isTarget && (
                          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                            Next
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {level.requiredExperienceYears}+ years
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {level.requiredSkills.length} skills required
                        </span>
                      </div>

                      {/* Progress for current/next */}
                      {(status === 'current' || status === 'next') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Skill Requirements</span>
                            <span className={cn(
                              "font-medium",
                              progress >= 80 ? "text-green-600" : "text-amber-600"
                            )}>
                              {progress}% complete
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set Target Sheet */}
      <Sheet open={showTargetSheet} onOpenChange={setShowTargetSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Set Career Target
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Level</label>
              <p className="text-xs text-muted-foreground mb-2">
                Select the level you want to work towards
              </p>
              <Select 
                value={selectedTargetLevel} 
                onValueChange={setSelectedTargetLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target level" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex items-center gap-2">
                        <span>Level {level.level}: {level.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTargetLevel && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                {(() => {
                  const level = currentPath?.levels.find(l => l.id === selectedTargetLevel);
                  if (!level) return null;
                  const gaps = calculateSkillGaps(level);
                  const metCount = gaps.filter(g => g.met).length;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{level.title}</span>
                        <Badge variant="outline">Level {level.level}</Badge>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Experience Required</span>
                          <span>{level.requiredExperienceYears}+ years</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Skills Progress</span>
                          <span className="font-medium">
                            {metCount}/{gaps.length} complete
                          </span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Required Skills:
                        </p>
                        <div className="space-y-1">
                          {gaps.map((gap, i) => (
                            <div 
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              {gap.met ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                              <span className={gap.met ? "text-muted-foreground" : ""}>
                                {gap.skillName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {skillLevelLabels[gap.required]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowTargetSheet(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetTarget} disabled={!selectedTargetLevel}>
              <Zap className="h-4 w-4 mr-2" />
              Set Target
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Level Detail Sheet */}
      <Sheet open={showLevelDetail} onOpenChange={setShowLevelDetail}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {selectedLevel?.title}
            </SheetTitle>
          </SheetHeader>

          {selectedLevel && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6 pr-4">
                {/* Overview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Level</p>
                        <p className="font-semibold">{selectedLevel.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-semibold">{selectedLevel.requiredExperienceYears}+ years</p>
                      </div>
                      {selectedLevel.typicalSalaryRange && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Salary Range</p>
                            <p className="font-semibold">
                              ${selectedLevel.typicalSalaryRange.min.toLocaleString()} - ${selectedLevel.typicalSalaryRange.max.toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Required Skills
                  </h4>
                  {calculateSkillGaps(selectedLevel).map((gap, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-lg border",
                        gap.met 
                          ? "bg-green-50/50 border-green-200" 
                          : "bg-amber-50/50 border-amber-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{gap.skillName}</span>
                        {gap.met ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Met
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Gap
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">{skillLevelLabels[gap.current]}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Required: </span>
                          <span className="font-medium">{skillLevelLabels[gap.required]}</span>
                        </div>
                      </div>
                      {!gap.met && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 mt-2 text-sm"
                          onClick={() => toast.info('Opening learning resources...')}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          View Learning Resources
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-4">
                  {getLevelStatus(selectedLevel) !== 'completed' && 
                   getLevelStatus(selectedLevel) !== 'current' && (
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedTargetLevel(selectedLevel.id);
                        setShowLevelDetail(false);
                        setShowTargetSheet(true);
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Set as Target
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
