import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Plus,
  Search,
  ChevronDown,
  Star,
  MessageSquare,
  User,
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
  mockCareerProgress,
  mock360Responses,
  mock360Competencies,
} from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { SkillAssessmentDrawer } from './SkillAssessmentDrawer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// Pastel color palette
const pastelColors = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
};

export function SkillsCareerPanel({ staffId = 'staff-1' }: SkillsCareerPanelProps) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffId);
  const [showCareerPathSheet, setShowCareerPathSheet] = useState(false);
  const [showAssessDrawer, setShowAssessDrawer] = useState(false);
  const [staffSkillsData, setStaffSkillsData] = useState(mockStaffSkills);
  const [editingSkill, setEditingSkill] = useState<StaffSkill | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffSelectorOpen, setIsStaffSelectorOpen] = useState(false);

  const staffSkills = staffSkillsData[selectedStaffId] || [];
  const careerProgress = mockCareerProgress.find(p => p.staffId === selectedStaffId);
  const staff = mockStaff.find(s => s.id === selectedStaffId);

  // Filter staff for searchable selector
  const filteredStaff = useMemo(() => {
    const query = staffSearchQuery.toLowerCase();
    return mockStaff.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
      s.position.toLowerCase().includes(query) ||
      s.department?.toLowerCase().includes(query)
    );
  }, [staffSearchQuery]);

  // Get manager insights for the selected staff
  const managerFeedback = useMemo(() => {
    return mock360Responses.filter(r => 
      r.sourceType === 'manager' && 
      r.status === 'completed'
    );
  }, []);

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

  const handleAssessSkill = (skill?: Skill) => {
    if (skill) {
      const existingStaffSkill = staffSkills.find(s => s.skillId === skill.id);
      setEditingSkill(existingStaffSkill || null);
    } else {
      setEditingSkill(null);
    }
    setShowAssessDrawer(true);
  };

  const handleSaveAssessment = (newSkill: Partial<StaffSkill>) => {
    setStaffSkillsData(prev => {
      const currentSkills = prev[selectedStaffId] || [];
      const existingIndex = currentSkills.findIndex(s => s.skillId === newSkill.skillId);
      
      let updatedSkills: StaffSkill[];
      if (existingIndex >= 0) {
        updatedSkills = currentSkills.map((s, i) => 
          i === existingIndex ? { ...s, ...newSkill } as StaffSkill : s
        );
      } else {
        updatedSkills = [...currentSkills, newSkill as StaffSkill];
      }
      
      return {
        ...prev,
        [selectedStaffId]: updatedSkills,
      };
    });
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
        <Button 
          variant="contained" 
          startIcon={<Plus size={16} />}
          onClick={() => handleAssessSkill()}
        >
          Assess Skill
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
                  <Box 
                    key={skill.id}
                    sx={{ 
                      cursor: 'pointer',
                      p: 1.5,
                      borderRadius: 1,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleAssessSkill(skill)}
                  >
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

  // Render Manager Insights section
  const renderManagerInsights = () => {
    // Mock manager insights data
    const managerRatings = [
      { competency: 'Technical Skills', rating: 4.2, comment: 'Strong foundation, continues to improve' },
      { competency: 'Communication', rating: 4.5, comment: 'Excellent verbal and written communication' },
      { competency: 'Problem Solving', rating: 3.8, comment: 'Good analytical thinking, can improve creativity' },
      { competency: 'Teamwork', rating: 4.7, comment: 'Outstanding collaborator and team player' },
      { competency: 'Leadership Potential', rating: 3.5, comment: 'Emerging leadership qualities, needs mentoring' },
      { competency: 'Adaptability', rating: 4.0, comment: 'Handles change well, flexible approach' },
    ];

    const overallRating = managerRatings.reduce((sum, r) => sum + r.rating, 0) / managerRatings.length;

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Manager Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance observations and competency ratings from management
            </Typography>
          </Box>
        </Stack>

        {/* Overall Rating Card */}
        <Card className={cn("p-4 mb-4 border", pastelColors.purple.bg, pastelColors.purple.border)}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Overall Rating</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight={700} className={pastelColors.purple.text}>
                  {overallRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">/ 5.0</Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={0.5}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn(
                    "h-6 w-6",
                    star <= Math.round(overallRating) 
                      ? "text-amber-400 fill-amber-400" 
                      : "text-muted-foreground/30"
                  )} 
                />
              ))}
            </Stack>
          </Stack>
        </Card>

        {/* Competency Ratings */}
        <Stack spacing={2}>
          {managerRatings.map((item, index) => {
            const ratingColor = item.rating >= 4 ? pastelColors.green : 
                               item.rating >= 3 ? pastelColors.amber : pastelColors.rose;
            
            return (
              <Card key={index} sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.competency}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      <MessageSquare className="inline h-3 w-3 mr-1" />
                      {item.comment}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Stack direction="row" spacing={0.25}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "h-4 w-4",
                            star <= Math.round(item.rating) 
                              ? "text-amber-400 fill-amber-400" 
                              : "text-muted-foreground/30"
                          )} 
                        />
                      ))}
                    </Stack>
                    <Chip 
                      label={item.rating.toFixed(1)}
                      size="small"
                      sx={{ 
                        fontSize: 11,
                        minWidth: 40,
                      }}
                      className={cn(ratingColor.bg, ratingColor.text)}
                    />
                  </Stack>
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(item.rating / 5) * 100}
                    sx={{ 
                      height: 6, 
                      borderRadius: 1,
                      bgcolor: 'rgba(0,0,0,0.08)',
                    }}
                  />
                </Box>
              </Card>
            );
          })}
        </Stack>

        {/* Strengths & Development Areas */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <Card className={cn("flex-1 p-4 border", pastelColors.green.bg, pastelColors.green.border)}>
            <Typography variant="subtitle2" fontWeight={600} className={pastelColors.green.text} sx={{ mb: 2 }}>
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              Key Strengths
            </Typography>
            <Stack spacing={1}>
              {['Excellent team collaboration', 'Strong communication skills', 'Reliable and dependable', 'Quality-focused work'].map((strength, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  • {strength}
                </Typography>
              ))}
            </Stack>
          </Card>
          <Card className={cn("flex-1 p-4 border", pastelColors.amber.bg, pastelColors.amber.border)}>
            <Typography variant="subtitle2" fontWeight={600} className={pastelColors.amber.text} sx={{ mb: 2 }}>
              <TrendingUp className="inline h-4 w-4 mr-1" />
              Development Areas
            </Typography>
            <Stack spacing={1}>
              {['Take more initiative in leading projects', 'Develop public speaking skills', 'Delegate tasks more effectively'].map((area, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  • {area}
                </Typography>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header with searchable employee selector */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Avatar sx={{ width: 48, height: 48 }} className={pastelColors.purple.bg}>
          <span className={pastelColors.purple.text}>
            {staff?.firstName.charAt(0) || '?'}
          </span>
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              {staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown'}
            </Typography>
            
            {/* Searchable Employee Selector */}
            <Popover open={isStaffSelectorOpen} onOpenChange={setIsStaffSelectorOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  "hover:bg-muted/50",
                  pastelColors.blue.bg, pastelColors.blue.border, pastelColors.blue.text
                )}>
                  <User className="h-3.5 w-3.5" />
                  Change Employee
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, position, or department..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2">
                    {filteredStaff.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No employees found
                      </div>
                    ) : (
                      filteredStaff.map(s => (
                        <button
                          key={s.id}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                            s.id === selectedStaffId 
                              ? cn(pastelColors.blue.bg, pastelColors.blue.border, "border")
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => {
                            setSelectedStaffId(s.id);
                            setStaffSearchQuery('');
                            setIsStaffSelectorOpen(false);
                          }}
                        >
                          <Avatar sx={{ width: 32, height: 32 }} className={pastelColors.purple.bg}>
                            <span className={cn("text-xs", pastelColors.purple.text)}>
                              {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                            </span>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.position} {s.department && `• ${s.department}`}
                            </p>
                          </div>
                          {s.id === selectedStaffId && (
                            <CheckCircle2 className={cn("h-4 w-4 flex-shrink-0", pastelColors.blue.text)} />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {staff?.position} {staff?.department && `• ${staff.department}`}
          </Typography>
        </Box>
      </Stack>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="matrix">Skills Matrix</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Manager Insights
          </TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="career">Career Path</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          {renderSkillMatrix()}
        </TabsContent>

        <TabsContent value="insights">
          {renderManagerInsights()}
        </TabsContent>

        <TabsContent value="gaps">
          {renderSkillGaps()}
        </TabsContent>

        <TabsContent value="career">
          {renderCareerPath()}
        </TabsContent>
      </Tabs>

      <SkillAssessmentDrawer
        open={showAssessDrawer}
        onClose={() => {
          setShowAssessDrawer(false);
          setEditingSkill(null);
        }}
        onSave={handleSaveAssessment}
        staffId={selectedStaffId}
        existingSkill={editingSkill}
      />
    </Box>
  );
}
