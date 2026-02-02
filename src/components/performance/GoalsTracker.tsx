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
  Checkbox,
  Badge,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { 
  SemanticProgressBar, 
  getProgressStatus, 
  StatusBadge,
  EnhancedCard,
} from './shared';
import { 
  Goal, 
  GoalStatus,
  GoalPriority,
  goalStatusLabels, 
  goalPriorityLabels,
} from '@/types/performance';
import { format, parseISO, differenceInDays } from 'date-fns';
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
  Users,
  Filter,
} from 'lucide-react';
import { createGoalBulkActions } from './shared/BulkActionsBar';
import { InlineBulkActions } from './shared/InlineBulkActions';
import { toast } from 'sonner';

interface GoalsTrackerProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onAssignGoal?: () => void;
  onViewGoal: (goal: Goal) => void;
  onEditGoal?: (goal: Goal) => void;
  onUpdateProgress: (goalId: string, progress: number) => void;
  onBulkUpdateStatus?: (goalIds: string[], status: GoalStatus) => void;
  onBulkUpdatePriority?: (goalIds: string[], priority: GoalPriority) => void;
  onBulkDelete?: (goalIds: string[]) => void;
  compact?: boolean;
  showFilters?: boolean;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'grey.50', text: 'grey.700' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(161, 98, 7)' },
  high: { bg: 'rgba(249, 115, 22, 0.12)', text: 'rgb(194, 65, 12)' },
  critical: { bg: 'rgba(239, 68, 68, 0.12)', text: 'rgb(185, 28, 28)' },
};

// Map goal status to StatusBadge type
const getStatusBadgeType = (status: GoalStatus): 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled' => {
  switch (status) {
    case 'not_started': return 'not_started';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'overdue': return 'overdue';
    case 'cancelled': return 'cancelled';
    default: return 'not_started';
  }
};

export function GoalsTracker({ 
  goals, 
  onCreateGoal, 
  onAssignGoal,
  onViewGoal, 
  onEditGoal,
  onUpdateProgress,
  onBulkUpdateStatus,
  onBulkUpdatePriority,
  onBulkDelete,
  compact = false,
  showFilters = true,
}: GoalsTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<GoalPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());

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

  // Bulk selection handlers
  const handleToggleSelect = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGoalIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedGoalIds(new Set(activeGoals.map(g => g.id)));
  };

  const handleClearSelection = () => {
    setSelectedGoalIds(new Set());
  };

  const handleBulkComplete = () => {
    if (onBulkUpdateStatus) {
      onBulkUpdateStatus(Array.from(selectedGoalIds), 'completed');
      toast.success(`${selectedGoalIds.size} goals marked as completed`);
    } else {
      toast.success(`${selectedGoalIds.size} goals would be marked as completed`);
    }
    handleClearSelection();
  };

  const handleBulkHighPriority = () => {
    if (onBulkUpdatePriority) {
      onBulkUpdatePriority(Array.from(selectedGoalIds), 'high');
      toast.success(`${selectedGoalIds.size} goals set to high priority`);
    } else {
      toast.success(`${selectedGoalIds.size} goals would be set to high priority`);
    }
    handleClearSelection();
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedGoalIds));
      toast.success(`${selectedGoalIds.size} goals deleted`);
    } else {
      toast.success(`${selectedGoalIds.size} goals would be deleted`);
    }
    handleClearSelection();
  };

  const bulkActions = createGoalBulkActions(
    handleBulkComplete,
    handleBulkHighPriority,
    handleBulkDelete
  );

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
                  <SemanticProgressBar 
                    value={goal.progress} 
                    status={getProgressStatus(goal.progress, undefined, goal.status === 'overdue')}
                    size="xs"
                    showPercentage={false}
                  />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 5 } }}>
      {/* Premium Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography 
            sx={{ 
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'grey.900',
            }}
          >
            Goals & Objectives
          </Typography>
          <Typography 
            sx={{ 
              mt: 0.5,
              fontSize: '0.875rem',
              color: 'grey.500',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Track progress on personal and professional development
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onAssignGoal && (
            <Box
              component="button"
              onClick={onAssignGoal}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                bgcolor: 'white',
                color: 'grey.700',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: 'grey.300',
                  bgcolor: 'grey.50',
                },
              }}
            >
              <Users size={16} />
              Assign
            </Box>
          )}
          <Box
            component="button"
            onClick={onCreateGoal}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2.5,
              py: 1,
              border: 'none',
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Plus size={16} />
            New Goal
          </Box>
        </Stack>
      </Stack>

      {/* Premium Stats Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, 
          gap: 2,
        }}
      >
        {[
          { label: 'Total', value: stats.total, icon: Target, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { label: 'In Progress', value: stats.active, icon: Clock, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              position: 'relative',
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'grey.200',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'grey.500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 0.5,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: { xs: '1.75rem', md: '2rem' },
                    fontWeight: 700,
                    color: 'grey.900',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <stat.icon size={18} />
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      {showFilters && (
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={{ xs: 1.5, md: 2 }} 
          flexWrap="wrap" 
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ flex: 1 }}
          >
            <TextField
              placeholder="Search goals..."
              size="small"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: { sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 120 } }}>
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

              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 120 } }}>
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

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
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
                  Clear
                </MuiButton>
              )}
            </Stack>
          </Stack>

          {/* Inline Bulk Actions */}
          <InlineBulkActions
            selectedCount={selectedGoalIds.size}
            totalCount={activeGoals.length}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
            actions={bulkActions}
            entityName="goals"
          />
        </Stack>
      )}

      {/* Active Goals - Table Layout */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 2, 
        border: 1, 
        borderColor: 'divider',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: 'grey.50', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'grey.600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Goals
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'grey.500' }}>
              {activeGoals.length} items
            </Typography>
          </Stack>
          {activeGoals.length > 0 && (
            <MuiButton
              size="small"
              variant="text"
              onClick={selectedGoalIds.size === activeGoals.length ? handleClearSelection : handleSelectAll}
              sx={{ fontSize: '0.75rem', color: 'primary.main' }}
            >
              {selectedGoalIds.size === activeGoals.length ? 'Deselect All' : 'Select All'}
            </MuiButton>
          )}
        </Box>
        
        {activeGoals.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: 'grey.100', 
              width: 'fit-content', 
              mx: 'auto', 
              mb: 2 
            }}>
              <Target size={28} style={{ color: 'var(--muted-foreground)' }} />
            </Box>
            <Typography sx={{ fontWeight: 500, color: 'grey.700' }}>
              {hasActiveFilters ? 'No goals match your filters' : 'No active goals'}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'grey.500', mt: 0.5, maxWidth: 320, mx: 'auto' }}>
              {hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : 'Create your first goal to start tracking'
              }
            </Typography>
            {!hasActiveFilters && (
              <MuiButton variant="contained" startIcon={<Plus size={16} />} onClick={onCreateGoal} sx={{ mt: 2.5 }}>
                Create Goal
              </MuiButton>
            )}
          </Box>
        ) : (
          <Box>
            {activeGoals.map((goal, index) => {
              const isSelected = selectedGoalIds.has(goal.id);
              const daysRemaining = differenceInDays(parseISO(goal.targetDate), new Date());
              const progressStatus = getProgressStatus(goal.progress, daysRemaining, goal.status === 'overdue');
              const isOverdue = goal.status === 'overdue';
              
              return (
                <Box
                  key={goal.id}
                  onClick={() => onViewGoal(goal)}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    borderBottom: index < activeGoals.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    bgcolor: isSelected ? 'primary.50' : 'transparent',
                    borderLeft: isOverdue ? 3 : 0,
                    borderLeftColor: 'error.main',
                    transition: 'all 0.15s ease',
                    '&:hover': { 
                      bgcolor: isSelected ? 'primary.100' : 'grey.50',
                      '& .row-actions': { opacity: 1 },
                    },
                  }}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onClick={(e) => handleToggleSelect(goal.id, e)}
                    size="small"
                    sx={{ p: 0.5 }}
                  />

                  {/* Goal Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: 'grey.900',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {goal.title}
                      </Typography>
                    </Stack>
                    <Typography sx={{ 
                      fontSize: '0.8125rem', 
                      color: 'grey.500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {goal.description}
                    </Typography>
                  </Box>

                  {/* Category & Priority */}
                  <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Chip 
                      label={goal.category} 
                      size="small" 
                      variant="outlined" 
                      sx={{ fontSize: '0.75rem', height: 24 }} 
                    />
                    <Chip 
                      label={goalPriorityLabels[goal.priority]} 
                      size="small" 
                      sx={{ 
                        bgcolor: priorityColors[goal.priority]?.bg,
                        color: priorityColors[goal.priority]?.text,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Stack>

                  {/* Progress */}
                  <Box sx={{ width: 120, display: { xs: 'none', sm: 'block' } }}>
                    <SemanticProgressBar
                      value={goal.progress}
                      status={progressStatus}
                      showPercentage
                      size="xs"
                    />
                  </Box>

                  {/* Due Date */}
                  <Box sx={{ width: 100, display: { xs: 'none', lg: 'block' } }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Calendar size={12} style={{ color: isOverdue ? 'var(--destructive)' : 'var(--muted-foreground)' }} />
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: isOverdue ? 'error.main' : 'grey.500',
                      }}>
                        {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Status */}
                  <Box sx={{ width: 100 }}>
                    <StatusBadge 
                      status={getStatusBadgeType(goal.status)}
                      label={goalStatusLabels[goal.status]}
                      pulse={goal.status === 'overdue'}
                    />
                  </Box>

                  {/* Chevron */}
                  <ChevronRight 
                    className="row-actions"
                    size={16} 
                    style={{ opacity: 0.4, transition: 'opacity 0.15s', color: 'var(--muted-foreground)' }} 
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Completed Goals - Table Layout */}
      {completedGoals.length > 0 && (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          border: 1, 
          borderColor: 'divider',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <Box sx={{ 
            px: 2, 
            py: 1.5, 
            bgcolor: 'grey.50', 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'grey.600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completed Goals
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'grey.500' }}>
                {completedGoals.length} items
              </Typography>
            </Stack>
          </Box>
          
          <Box>
            {completedGoals.map((goal, index) => (
              <Box
                key={goal.id}
                onClick={() => onViewGoal(goal)}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderBottom: index < completedGoals.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  opacity: 0.75,
                  transition: 'all 0.15s ease',
                  '&:hover': { 
                    bgcolor: 'grey.50',
                    opacity: 1,
                  },
                }}
              >
                {/* Success Icon */}
                <Box sx={{ 
                  p: 0.75, 
                  borderRadius: '50%', 
                  bgcolor: 'success.50', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                </Box>

                {/* Goal Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    color: 'grey.700',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {goal.title}
                  </Typography>
                </Box>

                {/* Category */}
                <Chip 
                  label={goal.category} 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontSize: '0.75rem', height: 24, display: { xs: 'none', sm: 'flex' } }} 
                />

                {/* Completed Date */}
                <Typography sx={{ fontSize: '0.75rem', color: 'grey.500', display: { xs: 'none', md: 'block' } }}>
                  Completed {goal.completedAt ? format(parseISO(goal.completedAt), 'MMM d, yyyy') : ''}
                </Typography>

                {/* Chevron */}
                <ChevronRight size={16} style={{ opacity: 0.4, color: 'var(--muted-foreground)' }} />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default GoalsTracker;
