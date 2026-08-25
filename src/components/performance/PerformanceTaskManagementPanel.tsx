import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Collapse,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  User,
  Calendar,
  Trash2,
  Eye,
  ArrowRight,
  Flag,
  LayoutList,
  LayoutGrid,
  Paperclip,
  MessageSquare as CommentIcon,
  Settings2,
  GitBranch,
  Bell,
  X,
  UserPlus,
  ExternalLink,
  GraduationCap,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PerformanceTask,
  PerformanceTaskType,
  PerformanceTaskStatus,
  PerformanceTaskPriority,
  PerformanceTaskFormData,
  PerformanceTaskAttachment,
  PerformanceTaskActivityLog,
  PerformanceTaskPipeline,
  performanceTaskTypeConfig,
  performanceTaskStatusConfig,
  performanceTaskPriorityConfig,
  CustomTaskType,
  getTaskTypeConfig,
} from '@/types/performanceTasks';
import { mockPerformanceTasks, mockPerformancePipelines } from '@/data/mockPerformanceTaskData';
import { mockStaff } from '@/data/mockStaffData';
import { PerformanceTaskEditDrawer } from './PerformanceTaskEditDrawer';
import { PerformanceTaskDetailSheet } from './PerformanceTaskDetailSheet';
import { PerformanceTaskKanbanBoard } from './PerformanceTaskKanbanBoard';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';

const taskTypeIcons: Record<PerformanceTaskType, React.ReactElement> = {
  goal_action: <Target className="h-4 w-4" />,
  review_followup: <ClipboardCheck className="h-4 w-4" />,
  development_task: <BookOpen className="h-4 w-4" />,
  coaching_task: <MessageSquare className="h-4 w-4" />,
  pip_action: <AlertCircle className="h-4 w-4" />,
  training_task: <GraduationCap className="h-4 w-4" />,
};

// Light color styles for task type chips
const getTaskTypeChipStyle = (type: PerformanceTaskType) => {
  const styles: Record<string, { bgcolor: string; color: string; borderColor: string }> = {
    goal_action: { bgcolor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(21, 128, 61)', borderColor: 'rgba(34, 197, 94, 0.3)' },
    review_followup: { bgcolor: 'rgba(107, 114, 128, 0.1)', color: 'rgb(75, 85, 99)', borderColor: 'rgba(107, 114, 128, 0.3)' },
    development_task: { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'rgb(29, 78, 216)', borderColor: 'rgba(59, 130, 246, 0.3)' },
    coaching_task: { bgcolor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(21, 128, 61)', borderColor: 'rgba(34, 197, 94, 0.3)' },
    pip_action: { bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(185, 28, 28)', borderColor: 'rgba(239, 68, 68, 0.3)' },
    training_task: { bgcolor: 'rgba(251, 191, 36, 0.1)', color: 'rgb(161, 98, 7)', borderColor: 'rgba(251, 191, 36, 0.3)' },
  };
  return styles[type] || { bgcolor: 'rgba(107, 114, 128, 0.1)', color: 'rgb(75, 85, 99)', borderColor: 'rgba(107, 114, 128, 0.3)' };
};

// Light color styles for task status chips
const getTaskStatusChipStyle = (status: PerformanceTaskStatus) => {
  const styles: Record<PerformanceTaskStatus, { bgcolor: string; color: string }> = {
    open: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' },
    in_progress: { bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'rgb(29, 78, 216)' },
    blocked: { bgcolor: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)' },
    completed: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' },
    cancelled: { bgcolor: 'rgba(107, 114, 128, 0.1)', color: 'rgb(107, 114, 128)' },
  };
  return styles[status];
};

// Light color styles for task priority chips
const getTaskPriorityChipStyle = (priority: PerformanceTaskPriority) => {
  const styles: Record<PerformanceTaskPriority, { bgcolor: string; color: string; borderColor: string }> = {
    low: { bgcolor: 'rgba(107, 114, 128, 0.08)', color: 'rgb(107, 114, 128)', borderColor: 'rgba(107, 114, 128, 0.3)' },
    medium: { bgcolor: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)', borderColor: 'rgba(251, 191, 36, 0.4)' },
    high: { bgcolor: 'rgba(249, 115, 22, 0.1)', color: 'rgb(194, 65, 12)', borderColor: 'rgba(249, 115, 22, 0.4)' },
    critical: { bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(185, 28, 28)', borderColor: 'rgba(239, 68, 68, 0.4)' },
  };
  return styles[priority];
};

const staffOptions = mockStaff.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  position: s.position,
  avatar: s.avatar,
}));

interface PerformanceTaskManagementPanelProps {
  currentUserId: string;
  goals?: Goal[];
  reviews?: PerformanceReview[];
  conversations?: Conversation[];
  onNavigateToGoal?: (goalId: string) => void;
  onNavigateToReview?: (reviewId: string) => void;
  onNavigateToConversation?: (conversationId: string) => void;
}

export function PerformanceTaskManagementPanel({
  currentUserId,
  goals = [],
  reviews = [],
  conversations = [],
  onNavigateToGoal,
  onNavigateToReview,
  onNavigateToConversation,
}: PerformanceTaskManagementPanelProps) {
  const [tasks, setTasks] = useState<PerformanceTask[]>(mockPerformanceTasks);
  const [pipelines, setPipelines] = useState<PerformanceTaskPipeline[]>(mockPerformancePipelines);
  const [customTaskTypes, setCustomTaskTypes] = useState<CustomTaskType[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(mockPerformancePipelines[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PerformanceTaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PerformanceTaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PerformanceTaskPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  
  // Drawer/Sheet state
  const [selectedTask, setSelectedTask] = useState<PerformanceTask | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  
  // Context menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkAssignAnchor, setBulkAssignAnchor] = useState<null | HTMLElement>(null);

  const selectedPipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0],
    [pipelines, selectedPipelineId]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesPipeline = viewMode === 'list' || task.pipelineId === selectedPipelineId || !task.pipelineId;
      const matchesMyTasks = !showMyTasksOnly || 
        task.assigneeId === currentUserId || 
        task.createdForId === currentUserId;
      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesPipeline && matchesMyTasks;
    });
  }, [tasks, searchQuery, statusFilter, typeFilter, priorityFilter, viewMode, selectedPipelineId, showMyTasksOnly, currentUserId]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    myTasks: tasks.filter(t => t.assigneeId === currentUserId || t.createdForId === currentUserId).length,
  }), [tasks, currentUserId]);

  const addActivityLog = (taskId: string, log: Omit<PerformanceTaskActivityLog, 'id' | 'timestamp'>): PerformanceTaskActivityLog => {
    return {
      ...log,
      id: `plog-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  };

  // Bulk selection handlers
  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAllTasks = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleBulkStatusChange = (newStatus: PerformanceTaskStatus) => {
    const count = selectedTaskIds.size;
    selectedTaskIds.forEach(taskId => {
      handleStatusChange(taskId, newStatus);
    });
    setSelectedTaskIds(new Set());
    toast.success(`Updated status to ${performanceTaskStatusConfig[newStatus].label} for ${count} task(s)`);
  };

  const handleBulkAssign = (assigneeId: string, assigneeName: string) => {
    const count = selectedTaskIds.size;
    selectedTaskIds.forEach(taskId => {
      handleAssigneeChange(taskId, assigneeId, assigneeName);
    });
    setSelectedTaskIds(new Set());
    setBulkAssignAnchor(null);
    toast.success(`Assigned ${count} task(s) to ${assigneeName}`);
  };

  const handleBulkDelete = () => {
    const count = selectedTaskIds.size;
    setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
    setSelectedTaskIds(new Set());
    toast.success(`Deleted ${count} task(s)`);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setEditMode('create');
    setShowEditDrawer(true);
  };

  const handleEditTask = (task: PerformanceTask) => {
    setSelectedTask(task);
    setEditMode('edit');
    setShowDetailSheet(false);
    setShowEditDrawer(true);
  };

  const handleSaveTask = (formData: PerformanceTaskFormData, attachments: PerformanceTaskAttachment[]) => {
    if (editMode === 'create') {
      const newTask: PerformanceTask = {
        id: `perf-task-${Date.now()}`,
        ...formData,
        status: 'open',
        pipelineId: selectedPipelineId,
        stageId: selectedPipeline.stages[0]?.id,
        attachments,
        comments: [],
        activityLog: [
          addActivityLog('', {
            type: 'created',
            description: 'Task created',
            userId: currentUserId,
            userName: 'Current User',
          }),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User',
        module: 'performance',
      };
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully');
    } else if (selectedTask) {
      const changes: string[] = [];
      if (formData.title !== selectedTask.title) changes.push('title');
      if (formData.description !== selectedTask.description) changes.push('description');
      if (formData.priority !== selectedTask.priority) changes.push('priority');
      if (formData.assigneeId !== selectedTask.assigneeId) changes.push('assignee');
      if (formData.dueDate !== selectedTask.dueDate) changes.push('due date');

      const editLog = addActivityLog(selectedTask.id, {
        type: 'edit',
        description: `Edited ${changes.join(', ')}`,
        userId: currentUserId,
        userName: 'Current User',
      });

      setTasks(prev => prev.map(t =>
        t.id === selectedTask.id
          ? {
              ...t,
              ...formData,
              attachments,
              activityLog: [...t.activityLog, editLog],
              updatedAt: new Date().toISOString(),
            }
          : t
      ));
      toast.success('Task updated successfully');
    }
    setShowEditDrawer(false);
  };

  const handleStatusChange = (taskId: string, newStatus: PerformanceTaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const oldStatus = t.status;
      const statusLog = addActivityLog(taskId, {
        type: 'status_change',
        description: `Status changed from ${performanceTaskStatusConfig[oldStatus].label} to ${performanceTaskStatusConfig[newStatus].label}`,
        userId: currentUserId,
        userName: 'Current User',
        metadata: { oldValue: oldStatus, newValue: newStatus, fieldName: 'status' },
      });

      return {
        ...t,
        status: newStatus,
        activityLog: [...t.activityLog, statusLog],
        updatedAt: new Date().toISOString(),
        completedAt: newStatus === 'completed' ? new Date().toISOString() : t.completedAt,
      };
    }));

    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    toast.success(`Task status updated to ${performanceTaskStatusConfig[newStatus].label}`);
  };

  const handleStageChange = (taskId: string, newStageId: string) => {
    const stage = selectedPipeline.stages.find(s => s.id === newStageId);
    if (!stage) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const oldStage = selectedPipeline.stages.find(s => s.id === t.stageId);
      const stageLog = addActivityLog(taskId, {
        type: 'pipeline_change',
        description: `Moved from "${oldStage?.name || 'Unknown'}" to "${stage.name}"`,
        userId: currentUserId,
        userName: 'Current User',
        metadata: { oldValue: oldStage?.name, newValue: stage.name, fieldName: 'stage' },
      });

      return {
        ...t,
        stageId: newStageId,
        pipelineId: selectedPipelineId,
        activityLog: [...t.activityLog, stageLog],
        updatedAt: new Date().toISOString(),
      };
    }));

    toast.success(`Task moved to ${stage.name}`);
  };

  const handleAssigneeChange = (taskId: string, assigneeId: string, assigneeName: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const assignLog = addActivityLog(taskId, {
        type: 'assignment_change',
        description: assigneeName 
          ? `Assigned to ${assigneeName}` 
          : 'Removed assignment',
        userId: currentUserId,
        userName: 'Current User',
        metadata: { oldValue: t.assigneeName, newValue: assigneeName, fieldName: 'assignee' },
      });

      return {
        ...t,
        assigneeId,
        assigneeName,
        activityLog: [...t.activityLog, assignLog],
        updatedAt: new Date().toISOString(),
      };
    }));

    toast.success(assigneeName ? `Task assigned to ${assigneeName}` : 'Task unassigned');
  };

  const handleAddComment = (taskId: string, text: string) => {
    const comment = {
      id: `pcomment-${Date.now()}`,
      userId: currentUserId,
      userName: 'Current User',
      text,
      createdAt: new Date().toISOString(),
    };

    const commentLog = addActivityLog(taskId, {
      type: 'comment_added',
      description: 'Added a comment',
      userId: currentUserId,
      userName: 'Current User',
    });

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, comments: [...t.comments, comment], activityLog: [...t.activityLog, commentLog] }
        : t
    ));

    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { 
        ...prev, 
        comments: [...prev.comments, comment],
        activityLog: [...prev.activityLog, commentLog],
      } : null);
    }

    toast.success('Comment added');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setMenuAnchor(null);
    if (selectedTask?.id === taskId) {
      setShowDetailSheet(false);
      setSelectedTask(null);
    }
    toast.success('Task deleted');
  };

  const handleTaskClick = (task: PerformanceTask) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

  const handleLinkedItemClick = (task: PerformanceTask) => {
    if (task.linkedGoalId && onNavigateToGoal) {
      onNavigateToGoal(task.linkedGoalId);
    } else if (task.linkedReviewId && onNavigateToReview) {
      onNavigateToReview(task.linkedReviewId);
    } else if (task.linkedConversationId && onNavigateToConversation) {
      onNavigateToConversation(task.linkedConversationId);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <div>
            <Typography variant="h6" fontWeight={600}>Performance Tasks</Typography>
            <Typography variant="body2" color="text.secondary">
              Track development tasks, coaching, reviews, and PIP actions
            </Typography>
          </div>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={showMyTasksOnly}
                  onChange={(e) => setShowMyTasksOnly(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Users className="h-4 w-4" />
                  <Typography variant="body2">My Tasks ({stats.myTasks})</Typography>
                </Stack>
              }
            />
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="list">
                <LayoutList className="h-4 w-4" />
              </ToggleButton>
              <ToggleButton value="kanban">
                <LayoutGrid className="h-4 w-4" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button onClick={handleCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </Stack>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`Total: ${stats.total}`} size="small" sx={{ bgcolor: 'rgba(107, 114, 128, 0.1)', color: 'rgb(55, 65, 81)' }} />
          <Chip label={`Open: ${stats.open}`} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }} />
          <Chip label={`In Progress: ${stats.inProgress}`} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'rgb(29, 78, 216)' }} />
          <Chip label={`Blocked: ${stats.blocked}`} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)' }} />
          <Chip label={`Completed: ${stats.completed}`} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'rgb(21, 128, 61)' }} />
          {stats.overdue > 0 && (
            <Chip label={`Overdue: ${stats.overdue}`} size="small" variant="outlined" sx={{ borderColor: 'rgb(239, 68, 68)', color: 'rgb(185, 28, 28)' }} />
          )}
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search tasks..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PerformanceTaskStatus | 'all')}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(performanceTaskStatusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PerformanceTaskType | 'all')}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(performanceTaskTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PerformanceTaskPriority | 'all')}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(performanceTaskPriorityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewMode === 'kanban' && (
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Stack>

        {/* Bulk Actions */}
        {selectedTaskIds.size > 0 && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              {selectedTaskIds.size} selected
            </Typography>
            <Select onValueChange={(v) => handleBulkStatusChange(v as PerformanceTaskStatus)}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(performanceTaskStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={(e) => setBulkAssignAnchor(e.currentTarget as HTMLElement)}>
              <UserPlus className="h-3 w-3 mr-1" /> Assign
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-destructive">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds(new Set())}>
              <X className="h-3 w-3" />
            </Button>
          </Stack>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'list' ? (
          <Box sx={{ p: 2 }}>
            {/* List Header */}
            <Stack direction="row" alignItems="center" sx={{ mb: 1, px: 1 }}>
              <Box sx={{ width: 32 }}>
                <Checkbox
                  checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
                  onCheckedChange={handleSelectAllTasks}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                TASK ({filteredTasks.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 100 }}>
                TYPE
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 100 }}>
                STATUS
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>
                PRIORITY
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 120 }}>
                FOR
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 120 }}>
                ASSIGNEE
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 100 }}>
                DUE DATE
              </Typography>
              <Box sx={{ width: 40 }} />
            </Stack>

            {/* Task Rows */}
            <Stack spacing={1}>
              {filteredTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                
                return (
                  <Card
                    key={task.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedTaskIds.has(task.id) ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent className="py-2 px-3">
                      <Stack direction="row" alignItems="center">
                        <Box sx={{ width: 32 }} onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedTaskIds.has(task.id)}
                            onCheckedChange={(checked) => handleSelectTask(task.id, !!checked)}
                          />
                        </Box>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {task.title}
                            </Typography>
                            {task.linkedGoalId && (
                              <Chip
                                icon={<Target size={10} />}
                                label="Goal"
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                                onClick={(e) => { e.stopPropagation(); handleLinkedItemClick(task); }}
                              />
                            )}
                            {task.linkedReviewId && (
                              <Chip
                                icon={<ClipboardCheck size={10} />}
                                label="Review"
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                                onClick={(e) => { e.stopPropagation(); handleLinkedItemClick(task); }}
                              />
                            )}
                          </Stack>
                        </Box>
                        
                        <Box sx={{ width: 100 }}>
                          <Chip
                            icon={taskTypeIcons[task.type]}
                            label={performanceTaskTypeConfig[task.type].label}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: 22, 
                              '& .MuiChip-label': { fontSize: '0.7rem' },
                              ...getTaskTypeChipStyle(task.type),
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ width: 100 }}>
                          <Chip
                            label={performanceTaskStatusConfig[task.status].label}
                            size="small"
                            sx={{ 
                              height: 22,
                              ...getTaskStatusChipStyle(task.status),
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ width: 80 }}>
                          <Chip
                            icon={<Flag size={10} />}
                            label={performanceTaskPriorityConfig[task.priority].label}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: 22,
                              ...getTaskPriorityChipStyle(task.priority),
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ width: 120 }}>
                          {task.createdForName ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                                {task.createdForName.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" noWrap>{task.createdForName}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ width: 120 }}>
                          {task.assigneeName ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                                {task.assigneeName.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" noWrap>{task.assigneeName}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ width: 100 }}>
                          {task.dueDate ? (
                            <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ width: 40 }} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setMenuAnchor(e.currentTarget);
                              setMenuTaskId(task.id);
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </IconButton>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTasks.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No tasks found</Typography>
                </Box>
              )}
            </Stack>
          </Box>
        ) : (
          <PerformanceTaskKanbanBoard
            tasks={filteredTasks}
            pipeline={selectedPipeline}
            onTaskClick={handleTaskClick}
            onStageChange={handleStageChange}
            onAssigneeChange={handleAssigneeChange}
          />
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          const task = tasks.find(t => t.id === menuTaskId);
          if (task) {
            handleTaskClick(task);
          }
          setMenuAnchor(null);
        }}>
          <ListItemIcon><Eye size={16} /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const task = tasks.find(t => t.id === menuTaskId);
          if (task) {
            handleEditTask(task);
          }
          setMenuAnchor(null);
        }}>
          <ListItemIcon><Settings2 size={16} /></ListItemIcon>
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuTaskId && handleDeleteTask(menuTaskId)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 size={16} color="inherit" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Assign Menu */}
      <Menu
        anchorEl={bulkAssignAnchor}
        open={Boolean(bulkAssignAnchor)}
        onClose={() => setBulkAssignAnchor(null)}
        PaperProps={{ sx: { maxHeight: 300, width: 250 } }}
      >
        {staffOptions.map(staff => (
          <MenuItem key={staff.id} onClick={() => handleBulkAssign(staff.id, staff.name)}>
            <ListItemIcon>
              <Avatar src={staff.avatar} sx={{ width: 24, height: 24 }}>
                {staff.name.charAt(0)}
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary={staff.name} 
              secondary={staff.position}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Task Detail Sheet */}
      <PerformanceTaskDetailSheet
        open={showDetailSheet}
        task={selectedTask}
        goals={goals}
        reviews={reviews}
        conversations={conversations}
        onClose={() => {
          setShowDetailSheet(false);
          setSelectedTask(null);
        }}
        onEdit={handleEditTask}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
        onNavigateToGoal={onNavigateToGoal}
        onNavigateToReview={onNavigateToReview}
        onNavigateToConversation={onNavigateToConversation}
      />

      {/* Task Edit Drawer */}
      <PerformanceTaskEditDrawer
        open={showEditDrawer}
        task={selectedTask}
        mode={editMode}
        goals={goals}
        reviews={reviews}
        pipelines={pipelines}
        customTaskTypes={customTaskTypes}
        onClose={() => setShowEditDrawer(false)}
        onSave={handleSaveTask}
        onCreateTaskType={(newType) => {
          setCustomTaskTypes(prev => [...prev, newType]);
          toast.success(`Created task type: ${newType.label}`);
        }}
      />
    </Box>
  );
}
