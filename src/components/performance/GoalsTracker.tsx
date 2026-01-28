import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Button as MuiButton,
  Select as MuiSelect,
  FormControl,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Progress } from '@/components/ui/progress';
import { 
  Goal, 
  GoalStatus,
  GoalPriority,
  goalStatusLabels, 
  goalPriorityLabels,
} from '@/types/performance';
import { format, parseISO } from 'date-fns';
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalsTrackerProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onViewGoal: (goal: Goal) => void;
  onUpdateProgress: (goalId: string, progress: number) => void;
  compact?: boolean;
  showFilters?: boolean;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'grey.50', text: 'grey.700' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(161, 98, 7)' },
  high: { bg: 'rgba(249, 115, 22, 0.12)', text: 'rgb(194, 65, 12)' },
  critical: { bg: 'rgba(239, 68, 68, 0.12)', text: 'rgb(185, 28, 28)' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  not_started: { bg: 'grey.100', text: 'grey.600' },
  in_progress: { bg: 'info.light', text: 'info.dark' },
  completed: { bg: 'success.light', text: 'success.dark' },
  overdue: { bg: 'error.light', text: 'error.dark' },
  cancelled: { bg: 'grey.200', text: 'grey.500' },
};

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Clock className="h-3.5 w-3.5" />,
  in_progress: <Target className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5" />,
  cancelled: <Clock className="h-3.5 w-3.5" />,
};

export function GoalsTracker({ 
  goals, 
  onCreateGoal, 
  onViewGoal, 
  onUpdateProgress,
  compact = false,
  showFilters = true,
}: GoalsTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<GoalPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = [...goals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(g => g.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === categoryFilter);
    }

    return filtered.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
  }, [goals, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const activeGoals = filteredAndSortedGoals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');
  const completedGoals = filteredAndSortedGoals.filter(g => g.status === 'completed');

  const availableCategories = useMemo(() => {
    const cats = new Set(goals.map(g => g.category));
    return Array.from(cats).sort();
  }, [goals]);

  const stats = useMemo(() => ({
    total: goals.length,
    active: goals.filter(g => g.status === 'in_progress').length,
    completed: goals.filter(g => g.status === 'completed').length,
    overdue: goals.filter(g => g.status === 'overdue').length,
  }), [goals]);

  if (compact) {
    return (
      <Card>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Target className="h-5 w-5 text-primary" />
              <Typography variant="subtitle1" fontWeight={600}>Goals</Typography>
            </Stack>
            <MuiButton size="small" startIcon={<Plus size={16} />} onClick={onCreateGoal}>
              Add
            </MuiButton>
          </Stack>
          <Stack spacing={1.5}>
            {activeGoals.slice(0, 3).map((goal) => (
              <Box
                key={goal.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => onViewGoal(goal)}
              >
                <Typography variant="body2" fontWeight={500} noWrap>{goal.title}</Typography>
                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                  <Progress value={goal.progress} className="h-1.5 flex-1" />
                  <Typography variant="caption" color="text.secondary">{goal.progress}%</Typography>
                </Stack>
              </Box>
            ))}
            {activeGoals.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No active goals
              </Typography>
            )}
          </Stack>
        </Box>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Target className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>Goals & Objectives</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Track progress on personal and professional development goals
          </Typography>
        </Box>
        <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={onCreateGoal}>
          New Goal
        </MuiButton>
      </Stack>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Total Goals', value: stats.total, icon: Target, color: 'primary' },
          { label: 'In Progress', value: stats.active, icon: Clock, color: 'info' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'success' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'error' },
        ].map((stat) => (
          <Card key={stat.label} sx={{ p: 0 }}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} mt={0.5}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: '50%', 
                  bgcolor: `${stat.color}.light`,
                  display: 'flex',
                }}>
                  <stat.icon size={20} style={{ color: `var(--${stat.color === 'primary' ? 'primary' : stat.color})` }} />
                </Box>
              </Stack>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      {showFilters && (
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search goals..."
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ minWidth: 220, maxWidth: 360, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <MuiSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'all')}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {Object.entries(goalStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <MuiSelect
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as GoalPriority | 'all')}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              {Object.entries(goalPriorityLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <MuiSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as string)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {availableCategories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          {hasActiveFilters && (
            <MuiButton 
              variant="text"
              size="small" 
              startIcon={<X size={16} />}
              onClick={clearFilters}
              sx={{ color: 'text.secondary' }}
            >
              Clear filters
            </MuiButton>
          )}
        </Stack>
      )}

      {/* Active Goals */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="overline" color="text.secondary" fontWeight={600}>
            Active Goals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeGoals.length} items
          </Typography>
        </Stack>
        
        {activeGoals.length === 0 ? (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: '50%', 
                bgcolor: 'action.hover', 
                width: 'fit-content', 
                mx: 'auto', 
                mb: 2 
              }}>
                <Target size={32} style={{ color: 'var(--muted-foreground)' }} />
              </Box>
              <Typography fontWeight={500}>
                {hasActiveFilters ? 'No goals match your filters' : 'No active goals'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5} maxWidth={360} mx="auto">
                {hasActiveFilters 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first goal to start tracking'
                }
              </Typography>
              {!hasActiveFilters && (
                <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={onCreateGoal} sx={{ mt: 2 }}>
                  Create Goal
                </MuiButton>
              )}
            </Box>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {activeGoals.map((goal) => (
              <Card 
                key={goal.id} 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    boxShadow: 3,
                    '& .chevron-icon': { opacity: 1 }
                  }
                }}
                onClick={() => onViewGoal(goal)}
              >
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} mb={1}>
                        <Chip label={goal.category} size="small" variant="outlined" />
                        <Chip 
                          label={goalPriorityLabels[goal.priority]} 
                          size="small" 
                          sx={{ 
                            bgcolor: priorityColors[goal.priority]?.bg,
                            color: priorityColors[goal.priority]?.text,
                          }}
                        />
                      </Stack>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {goal.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {goal.description}
                      </Typography>
                    </Box>
                    <ChevronRight 
                      className="chevron-icon" 
                      size={20} 
                      style={{ opacity: 0, transition: 'opacity 0.2s', marginLeft: 8, flexShrink: 0 }} 
                    />
                  </Stack>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2" color="text.secondary">Progress</Typography>
                      <Typography variant="body2" fontWeight={600}>{goal.progress}%</Typography>
                    </Stack>
                    <Progress value={goal.progress} className="h-2" />
                  </Box>

                  <Stack 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center" 
                    mt={2} 
                    pt={2} 
                    sx={{ borderTop: 1, borderColor: 'divider' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <Typography variant="caption" color="text.secondary">
                        Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                    <Chip 
                      size="small"
                      variant="outlined"
                      icon={statusIcons[goal.status] as any}
                      label={goalStatusLabels[goal.status]}
                    />
                  </Stack>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="overline" color="text.secondary" fontWeight={600}>
              Completed Goals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedGoals.length} items
            </Typography>
          </Stack>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {completedGoals.map((goal) => (
              <Card 
                key={goal.id} 
                sx={{ 
                  cursor: 'pointer',
                  opacity: 0.85,
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => onViewGoal(goal)}
              >
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'success.light', display: 'flex' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={500} noWrap>{goal.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completed {goal.completedAt ? format(parseISO(goal.completedAt), 'MMM d, yyyy') : ''}
                      </Typography>
                    </Box>
                    <Chip label={goal.category} size="small" variant="outlined" />
                  </Stack>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default GoalsTracker;
