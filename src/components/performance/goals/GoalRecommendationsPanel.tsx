import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Button as MuiButton,
  Avatar,
  TextField,
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Badge } from '@/components/ui/badge';
import { Goal, GoalPriority, goalPriorityLabels, goalCategories } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { 
  Lightbulb, 
  Target, 
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Briefcase,
  ChevronRight,
  Filter,
  RefreshCw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface GoalRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: GoalPriority;
  source: 'role' | 'department' | 'cycle' | 'skill_gap' | 'trending';
  sourceLabel: string;
  relevanceScore: number; // 0-100
  suggestedDuration: string; // e.g., "3 months"
  suggestedMilestones: string[];
  adopted?: boolean;
}

interface GoalRecommendationsPanelProps {
  staff: StaffMember[];
  currentStaffId: string;
  existingGoals: Goal[];
  onAdoptGoal: (recommendation: GoalRecommendation) => void;
}

const sourceConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  role: { icon: <Briefcase className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700' },
  department: { icon: <Users className="h-4 w-4" />, color: 'bg-purple-50 text-purple-700' },
  cycle: { icon: <RefreshCw className="h-4 w-4" />, color: 'bg-green-50 text-green-700' },
  skill_gap: { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-amber-50 text-amber-700' },
  trending: { icon: <Sparkles className="h-4 w-4" />, color: 'bg-pink-50 text-pink-700' },
};

// Rule-based recommendation engine
function generateRecommendations(
  staff: StaffMember | undefined,
  existingGoals: Goal[]
): GoalRecommendation[] {
  if (!staff) return [];
  
  const recommendations: GoalRecommendation[] = [];
  const existingTitles = new Set(existingGoals.map(g => g.title.toLowerCase()));

  // Role-based recommendations
  const roleRecommendations = getRoleBasedGoals(staff.position);
  roleRecommendations.forEach(rec => {
    if (!existingTitles.has(rec.title.toLowerCase())) {
      recommendations.push(rec);
    }
  });

  // Department-based recommendations
  const deptRecommendations = getDepartmentBasedGoals(staff.department);
  deptRecommendations.forEach(rec => {
    if (!existingTitles.has(rec.title.toLowerCase())) {
      recommendations.push(rec);
    }
  });

  // Previous cycle recommendations (mock based on position seniority)
  const cycleRecommendations = getCycleBasedGoals(staff.position);
  cycleRecommendations.forEach(rec => {
    if (!existingTitles.has(rec.title.toLowerCase())) {
      recommendations.push(rec);
    }
  });

  // Trending/general recommendations
  const trendingRecommendations = getTrendingGoals();
  trendingRecommendations.forEach(rec => {
    if (!existingTitles.has(rec.title.toLowerCase())) {
      recommendations.push(rec);
    }
  });

  // Sort by relevance score
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function getRoleBasedGoals(position: string): GoalRecommendation[] {
  const posLower = position.toLowerCase();
  const goals: GoalRecommendation[] = [];

  if (posLower.includes('manager') || posLower.includes('lead') || posLower.includes('director')) {
    goals.push(
      {
        id: 'role-1',
        title: 'Develop Leadership Communication Skills',
        description: 'Improve ability to communicate vision, provide constructive feedback, and inspire team members through effective leadership communication.',
        category: 'Leadership',
        priority: 'high',
        source: 'role',
        sourceLabel: `Recommended for ${position}`,
        relevanceScore: 95,
        suggestedDuration: '6 months',
        suggestedMilestones: [
          'Complete leadership communication workshop',
          'Conduct 360° feedback review',
          'Implement weekly team standups',
          'Achieve 80%+ team engagement score',
        ],
      },
      {
        id: 'role-2',
        title: 'Build High-Performing Team Culture',
        description: 'Create an environment that fosters collaboration, innovation, and continuous improvement within the team.',
        category: 'Team Contribution',
        priority: 'high',
        source: 'role',
        sourceLabel: `Recommended for ${position}`,
        relevanceScore: 90,
        suggestedDuration: '12 months',
        suggestedMilestones: [
          'Define team values and behaviors',
          'Implement peer recognition program',
          'Reduce team turnover by 20%',
          'Achieve team OKR completion rate of 85%+',
        ],
      }
    );
  }

  if (posLower.includes('senior') || posLower.includes('specialist')) {
    goals.push(
      {
        id: 'role-3',
        title: 'Mentor Junior Team Members',
        description: 'Share expertise and guide less experienced colleagues to accelerate their professional development.',
        category: 'Team Contribution',
        priority: 'medium',
        source: 'role',
        sourceLabel: `Recommended for ${position}`,
        relevanceScore: 88,
        suggestedDuration: '6 months',
        suggestedMilestones: [
          'Identify 2 mentees',
          'Establish regular mentoring sessions',
          'Create learning resources for common topics',
          'Mentees achieve their quarterly goals',
        ],
      }
    );
  }

  if (posLower.includes('developer') || posLower.includes('engineer')) {
    goals.push(
      {
        id: 'role-4',
        title: 'Master a New Technology Stack',
        description: 'Expand technical expertise by learning and applying a new programming language, framework, or tool.',
        category: 'Skill Development',
        priority: 'medium',
        source: 'role',
        sourceLabel: `Recommended for ${position}`,
        relevanceScore: 85,
        suggestedDuration: '4 months',
        suggestedMilestones: [
          'Complete online certification course',
          'Build a proof-of-concept project',
          'Present learnings to the team',
          'Apply skills in a production project',
        ],
      }
    );
  }

  if (posLower.includes('analyst') || posLower.includes('coordinator')) {
    goals.push(
      {
        id: 'role-5',
        title: 'Improve Data Analysis Capabilities',
        description: 'Enhance ability to gather, analyze, and present data-driven insights to support business decisions.',
        category: 'Skill Development',
        priority: 'medium',
        source: 'role',
        sourceLabel: `Recommended for ${position}`,
        relevanceScore: 82,
        suggestedDuration: '3 months',
        suggestedMilestones: [
          'Learn advanced Excel or data visualization tool',
          'Create automated reporting dashboard',
          'Present insights to stakeholders',
          'Reduce manual reporting time by 50%',
        ],
      }
    );
  }

  // Default for any role
  goals.push(
    {
      id: 'role-default',
      title: 'Enhance Professional Network',
      description: 'Build relationships with colleagues across the organization to improve collaboration and career opportunities.',
      category: 'Personal Growth',
      priority: 'low',
      source: 'role',
      sourceLabel: 'General career development',
      relevanceScore: 70,
      suggestedDuration: '6 months',
      suggestedMilestones: [
        'Attend 3 cross-functional meetings',
        'Set up 5 coffee chats with new colleagues',
        'Join an internal community or interest group',
        'Collaborate on a cross-team project',
      ],
    }
  );

  return goals;
}

function getDepartmentBasedGoals(department?: string): GoalRecommendation[] {
  if (!department) return [];
  
  const deptLower = department.toLowerCase();
  const goals: GoalRecommendation[] = [];

  if (deptLower.includes('sales') || deptLower.includes('business')) {
    goals.push({
      id: 'dept-1',
      title: 'Increase Client Retention Rate',
      description: 'Implement strategies to improve customer satisfaction and reduce churn through proactive relationship management.',
      category: 'Customer Service',
      priority: 'high',
      source: 'department',
      sourceLabel: `${department} department goal`,
      relevanceScore: 92,
      suggestedDuration: '6 months',
      suggestedMilestones: [
        'Conduct satisfaction survey',
        'Identify at-risk accounts',
        'Implement follow-up cadence',
        'Achieve 90%+ retention rate',
      ],
    });
  }

  if (deptLower.includes('operations') || deptLower.includes('logistics')) {
    goals.push({
      id: 'dept-2',
      title: 'Optimize Operational Efficiency',
      description: 'Identify and eliminate waste in processes to improve productivity and reduce costs.',
      category: 'Process Improvement',
      priority: 'high',
      source: 'department',
      sourceLabel: `${department} department goal`,
      relevanceScore: 90,
      suggestedDuration: '4 months',
      suggestedMilestones: [
        'Map current processes',
        'Identify 3 improvement opportunities',
        'Implement automation',
        'Reduce processing time by 25%',
      ],
    });
  }

  if (deptLower.includes('hr') || deptLower.includes('people')) {
    goals.push({
      id: 'dept-3',
      title: 'Improve Employee Onboarding Experience',
      description: 'Create a welcoming and effective onboarding program that accelerates new hire productivity and engagement.',
      category: 'Process Improvement',
      priority: 'medium',
      source: 'department',
      sourceLabel: `${department} department goal`,
      relevanceScore: 88,
      suggestedDuration: '3 months',
      suggestedMilestones: [
        'Survey recent hires',
        'Redesign onboarding checklist',
        'Create buddy program',
        'Achieve 4.5+ onboarding NPS',
      ],
    });
  }

  if (deptLower.includes('tech') || deptLower.includes('it') || deptLower.includes('engineering')) {
    goals.push({
      id: 'dept-4',
      title: 'Reduce Technical Debt',
      description: 'Address legacy code and infrastructure issues to improve system reliability and developer productivity.',
      category: 'Project Delivery',
      priority: 'medium',
      source: 'department',
      sourceLabel: `${department} department goal`,
      relevanceScore: 85,
      suggestedDuration: '6 months',
      suggestedMilestones: [
        'Audit codebase for tech debt',
        'Prioritize refactoring backlog',
        'Reduce critical bugs by 30%',
        'Improve code coverage to 80%',
      ],
    });
  }

  return goals;
}

function getCycleBasedGoals(position: string): GoalRecommendation[] {
  const posLower = position.toLowerCase();
  const goals: GoalRecommendation[] = [];

  // Simulate "last cycle" recommendations
  if (posLower.includes('manager') || posLower.includes('lead')) {
    goals.push({
      id: 'cycle-1',
      title: 'Complete Performance Management Training',
      description: 'Based on previous feedback, develop skills in conducting effective performance reviews and providing developmental feedback.',
      category: 'Skill Development',
      priority: 'medium',
      source: 'cycle',
      sourceLabel: 'From last review cycle',
      relevanceScore: 87,
      suggestedDuration: '2 months',
      suggestedMilestones: [
        'Attend HR workshop on performance management',
        'Practice feedback delivery with role-play',
        'Conduct mid-cycle check-ins',
        'Receive positive feedback from direct reports',
      ],
    });
  }

  goals.push({
    id: 'cycle-2',
    title: 'Improve Work-Life Balance',
    description: 'Previous cycle indicated high workload. Focus on sustainable work practices and time management.',
    category: 'Personal Growth',
    priority: 'medium',
    source: 'cycle',
    sourceLabel: 'From last review cycle',
    relevanceScore: 75,
    suggestedDuration: '3 months',
    suggestedMilestones: [
      'Implement time-blocking technique',
      'Reduce overtime by 30%',
      'Take all allocated PTO',
      'Maintain consistent end-of-day routine',
    ],
  });

  return goals;
}

function getTrendingGoals(): GoalRecommendation[] {
  return [
    {
      id: 'trend-1',
      title: 'Develop AI/ML Literacy',
      description: 'Build foundational understanding of artificial intelligence and machine learning to stay relevant in the evolving workplace.',
      category: 'Skill Development',
      priority: 'medium',
      source: 'trending',
      sourceLabel: 'Trending across organization',
      relevanceScore: 80,
      suggestedDuration: '4 months',
      suggestedMilestones: [
        'Complete AI fundamentals course',
        'Identify AI use cases in your role',
        'Experiment with AI tools',
        'Present AI opportunity to team',
      ],
    },
    {
      id: 'trend-2',
      title: 'Strengthen Remote Collaboration Skills',
      description: 'Master tools and practices for effective remote and hybrid teamwork.',
      category: 'Performance',
      priority: 'low',
      source: 'trending',
      sourceLabel: 'Trending across organization',
      relevanceScore: 72,
      suggestedDuration: '2 months',
      suggestedMilestones: [
        'Master video conferencing best practices',
        'Improve async communication',
        'Set up effective home workspace',
        'Lead a virtual team event',
      ],
    },
  ];
}

export function GoalRecommendationsPanel({ 
  staff, 
  currentStaffId, 
  existingGoals,
  onAdoptGoal,
}: GoalRecommendationsPanelProps) {
  const currentStaff = staff.find(s => s.id === currentStaffId);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  const recommendations = useMemo(() => {
    return generateRecommendations(currentStaff, existingGoals);
  }, [currentStaff, existingGoals]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      if (sourceFilter !== 'all' && rec.source !== sourceFilter) return false;
      if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false;
      return true;
    });
  }, [recommendations, sourceFilter, categoryFilter]);

  const handleAdoptGoal = (rec: GoalRecommendation) => {
    setAdoptedIds(prev => new Set([...prev, rec.id]));
    onAdoptGoal(rec);
    toast.success(`Goal "${rec.title}" added to your goals!`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.light', display: 'flex' }}>
              <Lightbulb className="h-5 w-5" style={{ color: 'var(--warning)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Goal Recommendations
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            AI-suggested goals based on your role, department, and previous performance cycles
          </Typography>
        </Box>
      </Stack>

      {/* Current Context */}
      {currentStaff && (
        <Card sx={{ bgcolor: 'grey.50' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={currentStaff.avatar} sx={{ width: 48, height: 48 }}>
                {currentStaff.firstName[0]}{currentStaff.lastName[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentStaff.firstName} {currentStaff.lastName}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    size="small" 
                    icon={<Briefcase className="h-3 w-3" />}
                    label={currentStaff.position} 
                    variant="outlined"
                  />
                  {currentStaff.department && (
                    <Chip 
                      size="small" 
                      icon={<Users className="h-3 w-3" />}
                      label={currentStaff.department} 
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Recommendations
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {recommendations.length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Source</InputLabel>
          <MuiSelect
            value={sourceFilter}
            label="Source"
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <MenuItem value="all">All Sources</MenuItem>
            <MenuItem value="role">Role-based</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="cycle">Previous Cycle</MenuItem>
            <MenuItem value="trending">Trending</MenuItem>
          </MuiSelect>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <MuiSelect
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {goalCategories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
      </Stack>

      {/* Recommendations List */}
      <Stack spacing={2}>
        {filteredRecommendations.map((rec) => {
          const isAdopted = adoptedIds.has(rec.id);
          const config = sourceConfig[rec.source];
          
          return (
            <Card 
              key={rec.id}
              sx={{ 
                opacity: isAdopted ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': { boxShadow: isAdopted ? 1 : 3 },
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
                  {/* Main Content */}
                  <Box flex={1}>
                    <Stack direction="row" alignItems="flex-start" spacing={2} mb={1.5}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1.5, 
                        bgcolor: 'primary.light', 
                        display: 'flex',
                        flexShrink: 0,
                      }}>
                        <Target className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                      </Box>
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.5}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {rec.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={goalPriorityLabels[rec.priority]}
                            sx={{
                              bgcolor: rec.priority === 'high' ? 'error.light' : 
                                       rec.priority === 'medium' ? 'warning.light' : 'grey.100',
                              color: rec.priority === 'high' ? 'error.dark' : 
                                     rec.priority === 'medium' ? 'warning.dark' : 'grey.700',
                            }}
                          />
                          {isAdopted && (
                            <Chip
                              size="small"
                              icon={<Check className="h-3 w-3" />}
                              label="Adopted"
                              sx={{ bgcolor: 'success.light', color: 'success.dark' }}
                            />
                          )}
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <Box className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${config.color}`}>
                            {config.icon}
                            {rec.sourceLabel}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {rec.category} • {rec.suggestedDuration}
                          </Typography>
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary" mb={1.5}>
                          {rec.description}
                        </Typography>
                        
                        <Box>
                          <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                            Suggested Milestones:
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.5}>
                            {rec.suggestedMilestones.slice(0, 3).map((ms, i) => (
                              <Chip key={i} size="small" label={ms} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            ))}
                            {rec.suggestedMilestones.length > 3 && (
                              <Chip size="small" label={`+${rec.suggestedMilestones.length - 3} more`} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                  
                  {/* Relevance & Actions */}
                  <Stack 
                    alignItems={{ xs: 'stretch', md: 'flex-end' }} 
                    spacing={1.5}
                    sx={{ minWidth: { md: 160 } }}
                  >
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Relevance
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={700}
                        color={rec.relevanceScore >= 85 ? 'success.main' : rec.relevanceScore >= 70 ? 'warning.main' : 'text.secondary'}
                      >
                        {rec.relevanceScore}%
                      </Typography>
                    </Box>
                    
                    <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} width="100%">
                      <MuiButton
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Show details in a toast or expand the card
                          toast.info(
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600} mb={1}>{rec.title}</Typography>
                              <Typography variant="body2" color="text.secondary" mb={1.5}>{rec.description}</Typography>
                              <Typography variant="caption" fontWeight={600}>Suggested Duration:</Typography>
                              <Typography variant="body2" mb={1}>{rec.suggestedDuration}</Typography>
                              <Typography variant="caption" fontWeight={600}>All Milestones:</Typography>
                              <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                                {rec.suggestedMilestones.map((ms, i) => (
                                  <Typography key={i} component="li" variant="body2">{ms}</Typography>
                                ))}
                              </Box>
                            </Box>,
                            { duration: 10000 }
                          );
                        }}
                        sx={{ flex: { xs: 1, md: 'none' } }}
                      >
                        View Details
                      </MuiButton>
                      <MuiButton
                        variant={isAdopted ? 'outlined' : 'contained'}
                        size="small"
                        startIcon={isAdopted ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        onClick={() => handleAdoptGoal(rec)}
                        disabled={isAdopted}
                        sx={{ flex: { xs: 1, md: 'none' } }}
                      >
                        {isAdopted ? 'Added' : 'Add Goal'}
                      </MuiButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          );
        })}
        
        {filteredRecommendations.length === 0 && (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <Typography fontWeight={500}>No recommendations match your filters</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting the source or category filter
              </Typography>
            </Box>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

export default GoalRecommendationsPanel;
