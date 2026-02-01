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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  Pencil,
  History,
  Save,
  X,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { 
  Skill, 
  StaffSkill, 
  CareerPath, 
  StaffCareerProgress,
  SkillGap,
  SkillLevel,
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
import { format } from 'date-fns';

// Manager rating type
interface ManagerRating {
  id: string;
  competency: string;
  rating: number;
  comment: string;
  lastUpdated: string;
}

// Historical rating entry
interface RatingHistoryEntry {
  date: string;
  ratings: Record<string, number>;
  overallRating: number;
}

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
  
  // Manager Insights state
  const [showEditRatingSheet, setShowEditRatingSheet] = useState(false);
  const [editingRatingIndex, setEditingRatingIndex] = useState<number | null>(null);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  
  // Creation drawers state
  const [showAddSkillSheet, setShowAddSkillSheet] = useState(false);
  const [showAddInsightSheet, setShowAddInsightSheet] = useState(false);
  const [showAddSkillGapSheet, setShowAddSkillGapSheet] = useState(false);
  const [showAddCareerPathSheet, setShowAddCareerPathSheet] = useState(false);
  
  // Skills list state (mutable)
  const [skillsList, setSkillsList] = useState<Skill[]>(mockSkills);
  
  // Skill gaps state (mutable)
  const [skillGapsList, setSkillGapsList] = useState<SkillGap[]>(
    mockCareerProgress.find(p => p.staffId === staffId)?.skillGaps || []
  );
  
  // Career paths state (mutable)
  const [careerPathsList, setCareerPathsList] = useState<CareerPath[]>(mockCareerPaths);
  
  // New skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillIsCore, setNewSkillIsCore] = useState(false);
  
  // New insight category form state
  const [newInsightName, setNewInsightName] = useState('');
  const [newInsightRating, setNewInsightRating] = useState(3);
  const [newInsightComment, setNewInsightComment] = useState('');
  
  // New skill gap form state
  const [newGapSkillId, setNewGapSkillId] = useState('');
  const [newGapCurrentLevel, setNewGapCurrentLevel] = useState<SkillLevel>('beginner');
  const [newGapRequiredLevel, setNewGapRequiredLevel] = useState<SkillLevel>('advanced');
  const [newGapPriority, setNewGapPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  // New career path form state
  const [newPathName, setNewPathName] = useState('');
  const [newPathDescription, setNewPathDescription] = useState('');
  const [newPathLevels, setNewPathLevels] = useState<Array<{ title: string; experienceYears: number }>>([
    { title: '', experienceYears: 0 }
  ]);
  
  // Initialize manager ratings with state
  const [managerRatings, setManagerRatings] = useState<ManagerRating[]>([
    { id: 'tech', competency: 'Technical Skills', rating: 4.2, comment: 'Strong foundation, continues to improve', lastUpdated: '2025-01-15' },
    { id: 'comm', competency: 'Communication', rating: 4.5, comment: 'Excellent verbal and written communication', lastUpdated: '2025-01-15' },
    { id: 'problem', competency: 'Problem Solving', rating: 3.8, comment: 'Good analytical thinking, can improve creativity', lastUpdated: '2025-01-15' },
    { id: 'team', competency: 'Teamwork', rating: 4.7, comment: 'Outstanding collaborator and team player', lastUpdated: '2025-01-15' },
    { id: 'lead', competency: 'Leadership Potential', rating: 3.5, comment: 'Emerging leadership qualities, needs mentoring', lastUpdated: '2025-01-15' },
    { id: 'adapt', competency: 'Adaptability', rating: 4.0, comment: 'Handles change well, flexible approach', lastUpdated: '2025-01-15' },
  ]);

  // Historical ratings data
  const [ratingHistory] = useState<RatingHistoryEntry[]>([
    { date: '2024-04', ratings: { tech: 3.5, comm: 4.0, problem: 3.2, team: 4.2, lead: 3.0, adapt: 3.5 }, overallRating: 3.6 },
    { date: '2024-07', ratings: { tech: 3.8, comm: 4.2, problem: 3.5, team: 4.4, lead: 3.2, adapt: 3.7 }, overallRating: 3.8 },
    { date: '2024-10', ratings: { tech: 4.0, comm: 4.3, problem: 3.6, team: 4.5, lead: 3.3, adapt: 3.9 }, overallRating: 3.9 },
    { date: '2025-01', ratings: { tech: 4.2, comm: 4.5, problem: 3.8, team: 4.7, lead: 3.5, adapt: 4.0 }, overallRating: 4.1 },
  ]);

  // Edit form state
  const [editFormRating, setEditFormRating] = useState(0);
  const [editFormComment, setEditFormComment] = useState('');

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

  // Chart data for trends
  const trendChartData = useMemo(() => {
    return ratingHistory.map(entry => ({
      date: entry.date,
      'Overall': entry.overallRating,
      'Technical': entry.ratings.tech,
      'Communication': entry.ratings.comm,
      'Teamwork': entry.ratings.team,
      'Leadership': entry.ratings.lead,
    }));
  }, [ratingHistory]);

  // Handle opening edit sheet
  const handleEditRating = (index: number) => {
    setEditingRatingIndex(index);
    setEditFormRating(managerRatings[index].rating);
    setEditFormComment(managerRatings[index].comment);
    setShowEditRatingSheet(true);
  };

  // Handle saving rating
  const handleSaveRating = () => {
    if (editingRatingIndex === null) return;
    
    setManagerRatings(prev => prev.map((r, i) => 
      i === editingRatingIndex 
        ? { ...r, rating: editFormRating, comment: editFormComment, lastUpdated: format(new Date(), 'yyyy-MM-dd') }
        : r
    ));
    
    toast.success('Rating updated successfully');
    setShowEditRatingSheet(false);
    setEditingRatingIndex(null);
  };

  // Handle adding new skill
  const handleAddSkill = () => {
    if (!newSkillName.trim() || !newSkillCategory.trim()) {
      toast.error('Please fill in skill name and category');
      return;
    }
    
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCategory.trim(),
      description: newSkillDescription.trim(),
      isCore: newSkillIsCore,
    };
    
    setSkillsList(prev => [...prev, newSkill]);
    toast.success('Skill added successfully');
    setShowAddSkillSheet(false);
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillDescription('');
    setNewSkillIsCore(false);
  };

  // Handle adding new insight category
  const handleAddInsight = () => {
    if (!newInsightName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    const newInsight: ManagerRating = {
      id: `insight-${Date.now()}`,
      competency: newInsightName.trim(),
      rating: newInsightRating,
      comment: newInsightComment.trim() || 'No comments yet',
      lastUpdated: format(new Date(), 'yyyy-MM-dd'),
    };
    
    setManagerRatings(prev => [...prev, newInsight]);
    toast.success('Insight category added successfully');
    setShowAddInsightSheet(false);
    setNewInsightName('');
    setNewInsightRating(3);
    setNewInsightComment('');
  };

  // Handle adding new skill gap
  const handleAddSkillGap = () => {
    if (!newGapSkillId) {
      toast.error('Please select a skill');
      return;
    }
    
    const skill = skillsList.find(s => s.id === newGapSkillId);
    const gapSize = skillLevelValues[newGapRequiredLevel] - skillLevelValues[newGapCurrentLevel];
    
    const newGap: SkillGap = {
      skillId: newGapSkillId,
      skillName: skill?.name || 'Unknown Skill',
      currentLevel: newGapCurrentLevel,
      requiredLevel: newGapRequiredLevel,
      gapSize: Math.max(0, gapSize),
      priority: newGapPriority,
    };
    
    setSkillGapsList(prev => [...prev, newGap]);
    toast.success('Skill gap added successfully');
    setShowAddSkillGapSheet(false);
    setNewGapSkillId('');
    setNewGapCurrentLevel('beginner');
    setNewGapRequiredLevel('advanced');
    setNewGapPriority('medium');
  };

  // Handle adding new career path
  const handleAddCareerPath = () => {
    if (!newPathName.trim()) {
      toast.error('Please enter a path name');
      return;
    }
    
    const validLevels = newPathLevels.filter(l => l.title.trim());
    if (validLevels.length === 0) {
      toast.error('Please add at least one career level');
      return;
    }
    
    const newPath: CareerPath = {
      id: `path-${Date.now()}`,
      name: newPathName.trim(),
      description: newPathDescription.trim(),
      levels: validLevels.map((l, i) => ({
        id: `level-${Date.now()}-${i}`,
        title: l.title.trim(),
        level: i + 1,
        requiredSkills: [],
        requiredExperienceYears: l.experienceYears,
      })),
    };
    
    setCareerPathsList(prev => [...prev, newPath]);
    toast.success('Career path added successfully');
    setShowAddCareerPathSheet(false);
    setNewPathName('');
    setNewPathDescription('');
    setNewPathLevels([{ title: '', experienceYears: 0 }]);
  };

  const addCareerLevel = () => {
    setNewPathLevels(prev => [...prev, { title: '', experienceYears: prev.length }]);
  };

  const removeCareerLevel = (index: number) => {
    setNewPathLevels(prev => prev.filter((_, i) => i !== index));
  };

  const updateCareerLevel = (index: number, field: 'title' | 'experienceYears', value: string | number) => {
    setNewPathLevels(prev => prev.map((l, i) => 
      i === index ? { ...l, [field]: value } : l
    ));
  };

  const getSkillById = (id: string) => skillsList.find(s => s.id === id);

  const skillsByCategory = skillsList.reduce((acc, skill) => {
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
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<Plus size={16} />}
            onClick={() => setShowAddSkillSheet(true)}
          >
            Add Skill
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Target size={16} />}
            onClick={() => handleAssessSkill()}
          >
            Assess Skill
          </Button>
        </Stack>
      </Stack>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Skill</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-32">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-28">Current Level</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-28">Target</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-36">Progress</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skillsList.map(skill => {
              const level = getStaffSkillLevel(skill.id);
              const levelStyle = getSkillLevelColor(level);
              const progress = getSkillProgress(skill.id);
              const staffSkill = staffSkills.find(s => s.skillId === skill.id);
              const isExpert = level === 'expert';

              return (
                <TableRow 
                  key={skill.id}
                  className="group hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleAssessSkill(skill)}
                  style={{
                    borderLeft: isExpert ? '3px solid hsl(var(--chart-2))' : undefined,
                  }}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {skill.isCore && (
                        <Badge className="text-[10px] py-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-50">
                          Core
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {skill.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Chip 
                      label={skillLevelLabels[level as keyof typeof skillLevelLabels]}
                      size="small"
                      sx={{ 
                        fontSize: 11,
                        bgcolor: levelStyle.bg,
                        color: levelStyle.color,
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    {staffSkill && staffSkill.currentLevel !== staffSkill.targetLevel ? (
                      <div className="flex items-center gap-1">
                        <ArrowRight size={14} className="text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {skillLevelLabels[staffSkill.targetLevel]}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {staffSkill ? (
                      <div className="flex items-center gap-2">
                        <LinearProgress 
                          variant="determinate" 
                          value={progress}
                          sx={{ 
                            flex: 1,
                            height: 6, 
                            borderRadius: 1,
                            bgcolor: 'rgba(0,0,0,0.08)',
                          }}
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not assessed</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="p-1 hover:bg-muted rounded"
                        onClick={(e) => { e.stopPropagation(); handleAssessSkill(skill); }}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Box>
  );

  const renderSkillGaps = () => {
    const gapsToShow = skillGapsList.length > 0 ? skillGapsList : (careerProgress?.skillGaps || []);
    
    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Skill Gaps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Skills needed to progress to the next level
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Plus size={16} />}
            onClick={() => setShowAddSkillGapSheet(true)}
          >
            Add Skill Gap
          </Button>
        </Stack>

        {gapsToShow.length === 0 ? (
          <Card sx={{ p: 3, textAlign: 'center' }} className="border-dashed">
            <AlertCircle size={32} className="mx-auto mb-2 text-muted-foreground" />
            <Typography variant="body2" color="text.secondary">
              No skill gaps identified. Click "Add Skill Gap" to define areas for development.
            </Typography>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Skill</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold w-28">Current Level</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold w-32">Required Level</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold w-24">Gap Size</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold w-24">Priority</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gapsToShow.map(gap => {
                  const priorityStyle = getGapPriorityColor(gap.priority);
                  const currentStyle = getSkillLevelColor(gap.currentLevel);
                  const requiredStyle = getSkillLevelColor(gap.requiredLevel);
                  const isHighPriority = gap.priority === 'high' || gap.priority === 'critical';

                  return (
                    <TableRow 
                      key={gap.skillId}
                      className="group hover:bg-muted/50"
                      style={{
                        borderLeft: isHighPriority ? '3px solid hsl(var(--destructive))' : undefined,
                      }}
                    >
                      <TableCell className="py-3">
                        <span className="font-medium">{gap.skillName}</span>
                      </TableCell>
                      <TableCell className="py-3">
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
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
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
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={cn("font-semibold", gap.gapSize >= 2 ? "text-red-600" : "")}>
                          {gap.gapSize} {gap.gapSize === 1 ? 'level' : 'levels'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Chip 
                          label={gap.priority}
                          size="small"
                          sx={{ 
                            textTransform: 'capitalize',
                            bgcolor: priorityStyle.bg,
                            color: priorityStyle.color,
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 hover:bg-muted rounded">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Box>
    );
  };

  const renderCareerPath = () => {
    const path = careerPathsList.find(p => p.id === careerProgress?.currentPathId);
    if (!path) {
      return (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Career Paths
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define progression pathways for employees
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<Plus size={16} />}
              onClick={() => setShowAddCareerPathSheet(true)}
            >
              Create Path
            </Button>
          </Stack>
          
          {careerPathsList.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }} className="border-dashed">
              <Briefcase size={40} className="mx-auto mb-2 text-muted-foreground" />
              <Typography variant="subtitle1" fontWeight={600}>
                No career paths defined
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create career paths to track employee progression
              </Typography>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Path Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Description</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold w-24 text-center">Levels</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {careerPathsList.map(p => (
                    <TableRow key={p.id} className="group hover:bg-muted/50 cursor-pointer">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Briefcase size={16} className="text-primary" />
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-muted-foreground text-sm line-clamp-1">
                          {p.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge variant="secondary">{p.levels.length} levels</Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 hover:bg-muted rounded">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="p-1 hover:bg-muted rounded">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Box>
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
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<Plus size={16} />}
              onClick={() => setShowAddCareerPathSheet(true)}
            >
              Create Path
            </Button>
            <Button variant="outlined" onClick={() => setShowCareerPathSheet(true)}>
              View Full Path
            </Button>
          </Stack>
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
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<Plus size={16} />}
              onClick={() => setShowAddInsightSheet(true)}
            >
              Add Category
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<History size={16} />}
              onClick={() => setShowHistorySheet(true)}
            >
              View History
            </Button>
          </Stack>
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

        {/* Competency Ratings - Table format */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Competency</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Comment</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold w-32 text-center">Rating</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold w-28">Progress</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold w-24">Updated</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerRatings.map((item, index) => {
                const ratingColor = item.rating >= 4 ? pastelColors.green : 
                                   item.rating >= 3 ? pastelColors.amber : pastelColors.rose;
                const isHighRating = item.rating >= 4.5;
                const isLowRating = item.rating < 3;
                
                return (
                  <TableRow 
                    key={item.id} 
                    className="group hover:bg-muted/50"
                    style={{
                      borderLeft: isHighRating 
                        ? '3px solid hsl(var(--chart-2))' 
                        : isLowRating 
                          ? '3px solid hsl(var(--destructive))' 
                          : undefined,
                    }}
                  >
                    <TableCell className="py-3">
                      <span className="font-semibold">{item.competency}</span>
                    </TableCell>
                    <TableCell className="py-3 max-w-xs">
                      <span className="text-muted-foreground text-sm line-clamp-2">
                        {item.comment}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={cn(
                                "h-3.5 w-3.5",
                                star <= Math.round(item.rating) 
                                  ? "text-amber-400 fill-amber-400" 
                                  : "text-muted-foreground/30"
                              )} 
                            />
                          ))}
                        </div>
                        <Badge className={cn("text-xs", ratingColor.bg, ratingColor.text, ratingColor.border, "border")}>
                          {item.rating.toFixed(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1">
                        <LinearProgress 
                          variant="determinate" 
                          value={(item.rating / 5) * 100}
                          sx={{ 
                            flex: 1,
                            height: 6, 
                            borderRadius: 1,
                            bgcolor: 'rgba(0,0,0,0.08)',
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{item.lastUpdated}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditRating(index)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-1 hover:bg-muted rounded">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Rating Trend Chart */}
        <Card sx={{ p: 3, mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            <TrendingUp className="inline h-4 w-4 mr-1" />
            Rating Trends Over Time
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  domain={[0, 5]} 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Overall" 
                  stroke="hsl(262, 83%, 58%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(262, 83%, 58%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Technical" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(217, 91%, 60%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Communication" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 76%, 36%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Teamwork" 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(38, 92%, 50%)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Leadership" 
                  stroke="hsl(346, 77%, 50%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(346, 77%, 50%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>

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

      {/* Edit Rating Sheet */}
      <Sheet open={showEditRatingSheet} onOpenChange={setShowEditRatingSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-violet-600" />
              Edit Competency Rating
            </SheetTitle>
          </SheetHeader>

          {editingRatingIndex !== null && (
            <div className="mt-6 space-y-6">
              <div className={cn("p-4 rounded-lg border", pastelColors.purple.bg, pastelColors.purple.border)}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {managerRatings[editingRatingIndex].competency}
                </Typography>
              </div>

              {/* Rating Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <Typography variant="caption" color="text.secondary" className="block mb-3">
                  Click on a star to set the rating (1-5)
                </Typography>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= editFormRating 
                            ? "text-amber-400 fill-amber-400" 
                            : "text-muted-foreground/30 hover:text-amber-200"
                        )} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-2xl font-bold text-violet-600">
                    {editFormRating.toFixed(1)}
                  </span>
                </div>
                {/* Fine-tune slider */}
                <div className="mt-4">
                  <Typography variant="caption" color="text.secondary" className="block mb-2">
                    Fine-tune rating (use slider for decimal values)
                  </Typography>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={editFormRating}
                    onChange={(e) => setEditFormRating(parseFloat(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1.0</span>
                    <span>2.0</span>
                    <span>3.0</span>
                    <span>4.0</span>
                    <span>5.0</span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Manager Comments</label>
                <Typography variant="caption" color="text.secondary" className="block mb-2">
                  Provide specific observations and actionable feedback
                </Typography>
                <Textarea
                  value={editFormComment}
                  onChange={(e) => setEditFormComment(e.target.value)}
                  placeholder="Enter your observations and feedback..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <SheetFooter className="mt-8">
            <Button 
              variant="outlined" 
              onClick={() => setShowEditRatingSheet(false)}
              startIcon={<X size={16} />}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveRating}
              startIcon={<Save size={16} />}
            >
              Save Rating
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Rating History Sheet */}
      <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Rating History
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Trend Chart */}
            <Card className="p-4">
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Performance Trend
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      tick={{ fontSize: 12 }} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Overall" 
                      stroke="hsl(262, 83%, 58%)" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(262, 83%, 58%)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Technical" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(217, 91%, 60%)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Communication" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 76%, 36%)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Teamwork" 
                      stroke="hsl(38, 92%, 50%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(38, 92%, 50%)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Leadership" 
                      stroke="hsl(346, 77%, 50%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(346, 77%, 50%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* Historical Entries */}
            <div>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Historical Records
              </Typography>
              <Stack spacing={2}>
                {ratingHistory.slice().reverse().map((entry, index) => (
                  <Card key={index} className="p-4">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {entry.date}
                      </Typography>
                      <Chip 
                        label={`Overall: ${entry.overallRating.toFixed(1)}`}
                        size="small"
                        className={cn(
                          entry.overallRating >= 4 ? cn(pastelColors.green.bg, pastelColors.green.text) :
                          entry.overallRating >= 3 ? cn(pastelColors.amber.bg, pastelColors.amber.text) :
                          cn(pastelColors.rose.bg, pastelColors.rose.text)
                        )}
                      />
                    </Stack>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(entry.ratings).map(([key, value]) => {
                        const competencyName = {
                          tech: 'Technical',
                          comm: 'Communication',
                          problem: 'Problem Solving',
                          team: 'Teamwork',
                          lead: 'Leadership',
                          adapt: 'Adaptability',
                        }[key] || key;
                        
                        return (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{competencyName}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="font-medium">{value.toFixed(1)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </Stack>
            </div>
          </div>

          <SheetFooter className="mt-8">
            <Button variant="outlined" onClick={() => setShowHistorySheet(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add New Skill Sheet */}
      <Sheet open={showAddSkillSheet} onOpenChange={setShowAddSkillSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Add New Skill
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Skill Name *</label>
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g., Project Management"
              />
              <Typography variant="caption" color="text.secondary" className="mt-1">
                Enter a clear, descriptive name for the skill
              </Typography>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Input
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                placeholder="e.g., Leadership, Technical, Soft Skills"
              />
              <Typography variant="caption" color="text.secondary" className="mt-1">
                Group skills by category for easy organization
              </Typography>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                placeholder="Describe what this skill entails..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isCore"
                checked={newSkillIsCore}
                onChange={(e) => setNewSkillIsCore(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isCore" className="text-sm font-medium">
                Core Competency
              </label>
            </div>
            <Typography variant="caption" color="text.secondary">
              Core competencies are essential skills required for the role
            </Typography>
          </div>

          <SheetFooter className="mt-8">
            <Button variant="outlined" onClick={() => setShowAddSkillSheet(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAddSkill} startIcon={<Plus size={16} />}>
              Add Skill
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add New Insight Category Sheet */}
      <Sheet open={showAddInsightSheet} onOpenChange={setShowAddInsightSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-violet-600" />
              Add Insight Category
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category Name *</label>
              <Input
                value={newInsightName}
                onChange={(e) => setNewInsightName(e.target.value)}
                placeholder="e.g., Punctuality, Learning Agility"
              />
              <Typography variant="caption" color="text.secondary" className="mt-1">
                Name the competency or behavioral trait to track
              </Typography>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Initial Rating</label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewInsightRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={cn(
                        "h-7 w-7 transition-colors",
                        star <= newInsightRating 
                          ? "text-amber-400 fill-amber-400" 
                          : "text-muted-foreground/30"
                      )} 
                    />
                  </button>
                ))}
                <span className="ml-2 text-xl font-bold text-violet-600">
                  {newInsightRating}.0
                </span>
              </div>
              <Typography variant="caption" color="text.secondary" className="mt-2">
                Set the initial rating for this employee
              </Typography>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Initial Comments</label>
              <Textarea
                value={newInsightComment}
                onChange={(e) => setNewInsightComment(e.target.value)}
                placeholder="Add observations about this competency..."
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="mt-8">
            <Button variant="outlined" onClick={() => setShowAddInsightSheet(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAddInsight} startIcon={<Plus size={16} />}>
              Add Category
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Skill Gap Sheet */}
      <Sheet open={showAddSkillGapSheet} onOpenChange={setShowAddSkillGapSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Add Skill Gap
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Skill *</label>
              <select
                value={newGapSkillId}
                onChange={(e) => setNewGapSkillId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Choose a skill...</option>
                {skillsList.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
              <Typography variant="caption" color="text.secondary" className="mt-1">
                Select the skill that needs development
              </Typography>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Level</label>
              <select
                value={newGapCurrentLevel}
                onChange={(e) => setNewGapCurrentLevel(e.target.value as SkillLevel)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {Object.entries(skillLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Required Level</label>
              <select
                value={newGapRequiredLevel}
                onChange={(e) => setNewGapRequiredLevel(e.target.value as SkillLevel)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {Object.entries(skillLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={newGapPriority}
                onChange={(e) => setNewGapPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <Typography variant="caption" color="text.secondary" className="mt-1">
                Higher priority gaps should be addressed first
              </Typography>
            </div>
          </div>

          <SheetFooter className="mt-8">
            <Button variant="outlined" onClick={() => setShowAddSkillGapSheet(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAddSkillGap} startIcon={<Plus size={16} />}>
              Add Skill Gap
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Career Path Sheet */}
      <Sheet open={showAddCareerPathSheet} onOpenChange={setShowAddCareerPathSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              Create Career Path
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Path Name *</label>
              <Input
                value={newPathName}
                onChange={(e) => setNewPathName(e.target.value)}
                placeholder="e.g., Software Engineer Track"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newPathDescription}
                onChange={(e) => setNewPathDescription(e.target.value)}
                placeholder="Describe this career progression path..."
                rows={2}
              />
            </div>

            <div>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <label className="block text-sm font-medium">Career Levels</label>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={addCareerLevel}
                >
                  Add Level
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" className="block mb-3">
                Define the progression stages from entry to senior positions
              </Typography>
              
              <Stack spacing={2}>
                {newPathLevels.map((level, index) => (
                  <Card key={index} className="p-3">
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        pastelColors.blue.bg, pastelColors.blue.text
                      )}>
                        {index + 1}
                      </div>
                      <Box sx={{ flex: 1 }}>
                        <Input
                          value={level.title}
                          onChange={(e) => updateCareerLevel(index, 'title', e.target.value)}
                          placeholder={`Level ${index + 1} title (e.g., Junior Engineer)`}
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Years experience:</span>
                          <Input
                            type="number"
                            value={level.experienceYears}
                            onChange={(e) => updateCareerLevel(index, 'experienceYears', parseInt(e.target.value) || 0)}
                            className="w-20"
                            min={0}
                          />
                        </div>
                      </Box>
                      {newPathLevels.length > 1 && (
                        <button
                          onClick={() => removeCareerLevel(index)}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </div>
          </div>

          <SheetFooter className="mt-8">
            <Button variant="outlined" onClick={() => setShowAddCareerPathSheet(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAddCareerPath} startIcon={<Plus size={16} />}>
              Create Path
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Box>
  );
}
