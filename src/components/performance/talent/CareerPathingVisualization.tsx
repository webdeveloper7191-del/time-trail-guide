import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  ChevronRight, 
  Star,
  CheckCircle2,
  AlertCircle,
  Target,
  GraduationCap,
  Award,
  TrendingUp,
  Briefcase,
  Clock,
  Zap,
  Lock,
} from 'lucide-react';
import { CareerPath, StaffCareerProgress, SkillLevel, skillLevelLabels } from '@/types/advancedPerformance';
import { mockCareerPaths, mockCareerProgress } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { cn } from '@/lib/utils';

interface CareerPathingVisualizationProps {
  staffId?: string;
  onAssessSkill?: (skillId: string) => void;
}

interface CareerLevelDisplay {
  id: string;
  title: string;
  level: number;
  requiredSkills: { skillId: string; minLevel: SkillLevel }[];
  requiredExperienceYears: number;
}

const levelColors = [
  { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', accent: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', accent: 'bg-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', accent: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', accent: 'bg-rose-500' },
];

export function CareerPathingVisualization({ staffId = 'staff-1', onAssessSkill }: CareerPathingVisualizationProps) {
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CareerLevelDisplay | null>(null);
  const [showLevelSheet, setShowLevelSheet] = useState(false);

  const staff = mockStaff.find(s => s.id === staffId);
  const careerProgress = mockCareerProgress.find(p => p.staffId === staffId);
  const currentPath = careerProgress ? mockCareerPaths.find(p => p.id === careerProgress.currentPathId) : null;

  // Calculate which level the staff is at based on currentLevelId
  const currentLevel = useMemo(() => {
    if (!currentPath || !careerProgress) return 0;
    const levelIndex = currentPath.levels.findIndex(l => l.id === careerProgress.currentLevelId);
    return levelIndex >= 0 ? currentPath.levels[levelIndex].level : 1;
  }, [currentPath, careerProgress]);

  const getLevelStatus = (levelNum: number) => {
    if (levelNum < currentLevel) return 'completed';
    if (levelNum === currentLevel) return 'current';
    if (levelNum === currentLevel + 1) return 'next';
    return 'locked';
  };

  const getSkillProgress = (requiredSkills: CareerLevelDisplay['requiredSkills']) => {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    // Mock: assume 60-90% progress for demo
    return Math.floor(60 + Math.random() * 30);
  };

  const handleLevelClick = (level: CareerLevelDisplay, path: CareerPath) => {
    setSelectedPath(path);
    setSelectedLevel(level);
    setShowLevelSheet(true);
  };

  const renderCareerLadder = (path: CareerPath) => {
    const colors = levelColors;
    
    return (
      <Box sx={{ position: 'relative', py: 2 }}>
        {/* Vertical connector line */}
        <Box
          sx={{
            position: 'absolute',
            left: 24,
            top: 40,
            bottom: 40,
            width: 2,
            bgcolor: 'divider',
            zIndex: 0,
          }}
        />
        
        <Stack spacing={0}>
          {[...path.levels].reverse().map((level, idx) => {
            const actualIdx = path.levels.length - 1 - idx;
            const status = getLevelStatus(level.level);
            const colorSet = colors[actualIdx % colors.length];
            const skillProgress = getSkillProgress(level.requiredSkills);
            const isExpanded = status === 'current' || status === 'next';

            return (
              <Box key={level.id} sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                  onClick={() => handleLevelClick(level, path)}
                  className={cn(
                    'group cursor-pointer transition-all duration-200',
                    'flex items-start gap-4 p-3 rounded-lg',
                    status === 'current' && 'bg-primary/5 border-2 border-primary',
                    status === 'completed' && 'opacity-75 hover:opacity-100',
                    status === 'next' && 'bg-amber-50/50 border border-dashed border-amber-300',
                    status === 'locked' && 'opacity-50',
                    'hover:bg-accent/50'
                  )}
                >
                  {/* Level indicator */}
                  <Box
                    className={cn(
                      'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                      'border-2 transition-all',
                      status === 'completed' && 'bg-emerald-500 border-emerald-500 text-white',
                      status === 'current' && `${colorSet.accent} border-primary text-white`,
                      status === 'next' && `${colorSet.bg} ${colorSet.border} ${colorSet.text}`,
                      status === 'locked' && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : status === 'locked' ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <span className="font-bold text-lg">{level.level}</span>
                    )}
                  </Box>

                  {/* Level details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={600} className={cn(
                        status === 'current' && 'text-primary'
                      )}>
                        {level.title}
                      </Typography>
                      {status === 'current' && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Current
                        </Badge>
                      )}
                      {status === 'next' && (
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                          <Target className="h-3 w-3 mr-1" />
                          Next Goal
                        </Badge>
                      )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                      <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {level.requiredExperienceYears}+ years
                      </Typography>
                      <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {level.requiredSkills.length} skills required
                      </Typography>
                    </Stack>

                    {/* Progress bar for current/next levels */}
                    {isExpanded && (
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Skill Requirements
                          </Typography>
                          <Typography variant="caption" fontWeight={600} color={skillProgress >= 80 ? 'success.main' : 'warning.main'}>
                            {skillProgress}% complete
                          </Typography>
                        </Stack>
                        <Progress value={skillProgress} className="h-2" />
                        
                        {/* Skill chips */}
                        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
                          {level.requiredSkills.slice(0, 4).map((skill) => (
                            <Chip
                              key={skill.skillId}
                              size="small"
                              label={`Skill ${skill.skillId.slice(-2)}`}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {level.requiredSkills.length > 4 && (
                            <Chip
                              size="small"
                              label={`+${level.requiredSkills.length - 4}`}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Career Progression
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Interactive career ladder showing your progression path and skill requirements
          </Typography>
        </Box>
      </Stack>

      {/* Current Status Card */}
      {staff && careerProgress && currentPath && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
              <Avatar src={staff.avatar} sx={{ width: 64, height: 64 }}>
                {staff.firstName[0]}{staff.lastName[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600}>
                  {staff.firstName} {staff.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {staff.position} • {staff.department}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Level {currentLevel} on {currentPath.name}
                  </Badge>
                  <Typography variant="caption" color="text.secondary">
                    {careerProgress.readinessPercentage}% readiness for next level
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="caption" color="text.secondary">Overall Progress</Typography>
                <Box sx={{ width: 120, mt: 0.5 }}>
                  <Progress value={careerProgress.readinessPercentage} className="h-3" />
                </Box>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Career Paths Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
        {mockCareerPaths.map((path) => {
          const isCurrentPath = currentPath?.id === path.id;
          
          return (
            <Card 
              key={path.id}
              className={cn(
                'transition-all',
                isCurrentPath && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {path.name}
                      </Typography>
                      {isCurrentPath && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Your Path
                        </Badge>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {path.description}
                    </Typography>
                  </Box>
                  <Chip 
                    size="small" 
                    label={`${path.levels.length} levels`}
                    variant="outlined"
                  />
                </Stack>

                {renderCareerLadder(path)}
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Level Detail Sheet */}
      <Sheet open={showLevelSheet} onOpenChange={setShowLevelSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {selectedLevel?.title}
            </SheetTitle>
          </SheetHeader>
          
          {selectedLevel && selectedPath && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-4">
              <div className="space-y-6 pr-4">
                {/* Level Overview */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Overview
                  </h4>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Career Path</p>
                        <p className="font-medium">{selectedPath.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Level</p>
                        <p className="font-medium">{selectedLevel.level} of {selectedPath.levels.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience Required</p>
                        <p className="font-medium">{selectedLevel.requiredExperienceYears}+ years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Skills Required</p>
                        <p className="font-medium">{selectedLevel.requiredSkills.length} competencies</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Required Skills */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Required Skills
                  </h4>
                  <div className="space-y-2">
                    {selectedLevel.requiredSkills.length > 0 ? (
                      selectedLevel.requiredSkills.map((skill) => {
                        const hasSkill = Math.random() > 0.3; // Mock
                        return (
                          <Card key={skill.skillId} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {hasSkill ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                                <span className="font-medium">Skill {skill.skillId.slice(-2)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {skillLevelLabels[skill.minLevel]}
                              </Badge>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific skills defined</p>
                    )}
                  </div>
                </div>

                {/* Action */}
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowLevelSheet(false);
                    // Navigate to skill assessment
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Development Plan
                </Button>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </Box>
  );
}

export default CareerPathingVisualization;
