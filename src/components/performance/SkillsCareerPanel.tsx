import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  GraduationCap, 
  Target, 
  TrendingUp, 
  ChevronRight,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { 
  Skill, 
  StaffSkill, 
  CareerPath, 
  StaffCareerProgress,
  SkillGap,
  skillLevelLabels,
  skillLevelValues,
} from '@/types/advancedPerformance';
import { 
  mockSkills, 
  mockStaffSkills, 
  mockCareerPaths, 
  mockCareerProgress 
} from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';

interface SkillsCareerPanelProps {
  staffId?: string;
}

const getSkillLevelColor = (level: string) => {
  const colors: Record<string, { bg: string; color: string }> = {
    none: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
    beginner: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    intermediate: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    advanced: { bg: 'rgba(139, 92, 246, 0.12)', color: 'rgb(124, 58, 237)' },
    expert: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
  };
  return colors[level] || colors.none;
};

const getGapPriorityColor = (priority: string) => {
  const colors: Record<string, { bg: string; color: string }> = {
    low: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
    medium: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    high: { bg: 'rgba(249, 115, 22, 0.12)', color: 'rgb(194, 65, 12)' },
    critical: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(220, 38, 38)' },
  };
  return colors[priority] || colors.low;
};

export function SkillsCareerPanel({ staffId = 'staff-1' }: SkillsCareerPanelProps) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffId);
  const [showCareerPathSheet, setShowCareerPathSheet] = useState(false);

  const staffSkills = mockStaffSkills[selectedStaffId] || [];
  const careerProgress = mockCareerProgress.find(p => p.staffId === selectedStaffId);
  const staff = mockStaff.find(s => s.id === selectedStaffId);

  const getSkillById = (id: string) => mockSkills.find(s => s.id === id);

  const skillsByCategory = mockSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getStaffSkillLevel = (skillId: string) => {
    const skill = staffSkills.find(s => s.skillId === skillId);
    return skill?.currentLevel || 'none';
  };

  const getSkillProgress = (skillId: string) => {
    const skill = staffSkills.find(s => s.skillId === skillId);
    if (!skill) return 0;
    const current = skillLevelValues[skill.currentLevel];
    const target = skillLevelValues[skill.targetLevel];
    return target > 0 ? (current / target) * 100 : 0;
  };

  const renderSkillMatrix = () => (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Skills Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Competency assessment and skill tracking
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Target size={16} />}>
          Assess Skills
        </Button>
      </Stack>

      <Stack spacing={3}>
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <Card key={category} sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {category}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {skills.map(skill => {
                const level = getStaffSkillLevel(skill.id);
                const levelStyle = getSkillLevelColor(level);
                const progress = getSkillProgress(skill.id);
                const staffSkill = staffSkills.find(s => s.skillId === skill.id);

                return (
                  <Box key={skill.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {skill.name}
                        </Typography>
                        {skill.isCore && (
                          <Chip 
                            label="Core" 
                            size="small" 
                            sx={{ 
                              fontSize: 10, 
                              height: 18,
                              bgcolor: 'rgba(59, 130, 246, 0.12)',
                              color: 'rgb(37, 99, 235)',
                            }} 
                          />
                        )}
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip 
                          label={skillLevelLabels[level as keyof typeof skillLevelLabels]}
                          size="small"
                          sx={{ 
                            fontSize: 11,
                            bgcolor: levelStyle.bg,
                            color: levelStyle.color,
                          }}
                        />
                        {staffSkill && staffSkill.currentLevel !== staffSkill.targetLevel && (
                          <>
                            <ArrowRight size={14} className="text-muted-foreground" />
                            <Chip 
                              label={skillLevelLabels[staffSkill.targetLevel]}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          </>
                        )}
                      </Stack>
                    </Stack>
                    {staffSkill && (
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{ 
                          height: 4, 
                          borderRadius: 1,
                          bgcolor: 'rgba(0,0,0,0.08)',
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  const renderSkillGaps = () => {
    if (!careerProgress) {
      return (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <AlertCircle size={40} className="mx-auto mb-2 text-muted-foreground" />
          <Typography variant="subtitle1" fontWeight={600}>
            No career path assigned
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign a career path to see skill gaps
          </Typography>
        </Card>
      );
    }

    return (
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
          Skill Gaps
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Skills needed to progress to the next level
        </Typography>

        <Stack spacing={2}>
          {careerProgress.skillGaps.map(gap => {
            const priorityStyle = getGapPriorityColor(gap.priority);
            const currentStyle = getSkillLevelColor(gap.currentLevel);
            const requiredStyle = getSkillLevelColor(gap.requiredLevel);

            return (
              <Card key={gap.skillId} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {gap.skillName}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip 
                        label={skillLevelLabels[gap.currentLevel]}
                        size="small"
                        sx={{ 
                          fontSize: 10,
                          height: 20,
                          bgcolor: currentStyle.bg,
                          color: currentStyle.color,
                        }}
                      />
                      <ArrowRight size={14} className="text-muted-foreground" />
                      <Chip 
                        label={skillLevelLabels[gap.requiredLevel]}
                        size="small"
                        sx={{ 
                          fontSize: 10,
                          height: 20,
                          bgcolor: requiredStyle.bg,
                          color: requiredStyle.color,
                        }}
                      />
                    </Stack>
                  </Box>
                  <Chip 
                    label={gap.priority}
                    size="small"
                    sx={{ 
                      textTransform: 'capitalize',
                      bgcolor: priorityStyle.bg,
                      color: priorityStyle.color,
                    }}
                  />
                </Stack>
              </Card>
            );
          })}
          {careerProgress.skillGaps.length === 0 && (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-600" />
              <Typography variant="body2" color="text.secondary">
                No skill gaps identified
              </Typography>
            </Card>
          )}
        </Stack>
      </Box>
    );
  };

  const renderCareerPath = () => {
    const path = mockCareerPaths.find(p => p.id === careerProgress?.currentPathId);
    if (!path) {
      return (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Briefcase size={40} className="mx-auto mb-2 text-muted-foreground" />
          <Typography variant="subtitle1" fontWeight={600}>
            No career path assigned
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign a career path to track progression
          </Typography>
          <Button variant="outlined">Assign Career Path</Button>
        </Card>
      );
    }

    const currentLevelIndex = path.levels.findIndex(l => l.id === careerProgress?.currentLevelId);

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Career Path
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {path.name}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => setShowCareerPathSheet(true)}>
            View Full Path
          </Button>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Current Level
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {path.levels[currentLevelIndex]?.title || 'Not Set'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Readiness
              </Typography>
              <Typography variant="h6" fontWeight={600} color="primary.main">
                {careerProgress?.readinessPercentage || 0}%
              </Typography>
            </Box>
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={careerProgress?.readinessPercentage || 0}
            sx={{ 
              height: 8, 
              borderRadius: 1,
              mb: 2,
            }}
          />

          {careerProgress?.estimatedTimeToNextLevel && (
            <Typography variant="body2" color="text.secondary">
              Estimated time to next level: <strong>{careerProgress.estimatedTimeToNextLevel}</strong>
            </Typography>
          )}
        </Card>

        {/* Career Path Visualization */}
        <Box sx={{ mt: 3, position: 'relative' }}>
          <Box 
            sx={{ 
              position: 'absolute', 
              left: 15, 
              top: 0, 
              bottom: 0, 
              width: 2, 
              bgcolor: 'divider',
              zIndex: 0,
            }} 
          />
          <Stack spacing={2}>
            {path.levels.map((level, index) => {
              const isCurrent = index === currentLevelIndex;
              const isCompleted = index < currentLevelIndex;
              const isFuture = index > currentLevelIndex;

              return (
                <Stack key={level.id} direction="row" spacing={2} alignItems="flex-start">
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'background.paper',
                      border: '2px solid',
                      borderColor: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'divider',
                      color: isCompleted || isCurrent ? 'white' : 'text.secondary',
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Typography variant="caption" fontWeight={600}>{index + 1}</Typography>
                    )}
                  </Box>
                  <Card 
                    sx={{ 
                      flex: 1, 
                      p: 2,
                      opacity: isFuture ? 0.6 : 1,
                      border: isCurrent ? '2px solid' : '1px solid',
                      borderColor: isCurrent ? 'primary.main' : 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {level.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {level.requiredExperienceYears}+ years experience
                    </Typography>
                  </Card>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Avatar sx={{ width: 48, height: 48 }}>
          {staff?.firstName.charAt(0) || '?'}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {staff?.position}
          </Typography>
        </Box>
      </Stack>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="matrix">Skills Matrix</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="career">Career Path</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          {renderSkillMatrix()}
        </TabsContent>

        <TabsContent value="gaps">
          {renderSkillGaps()}
        </TabsContent>

        <TabsContent value="career">
          {renderCareerPath()}
        </TabsContent>
      </Tabs>
    </Box>
  );
}
