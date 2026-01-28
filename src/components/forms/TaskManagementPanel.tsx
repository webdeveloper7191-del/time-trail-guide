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
} from '@mui/material';
import {
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wrench,
  ClipboardList,
  Link2,
  User,
  Calendar,
  MapPin,
  Trash2,
  Eye,
  ArrowRight,
  Flag,
  LayoutList,
  LayoutGrid,
  Paperclip,
  MessageSquare,
  Settings2,
  GitBranch,
  Bell,
  X,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TaskType, TaskStatus, TaskPriority, TaskFormData, TaskAttachment, TaskActivityLog, TaskPipeline } from '@/types/tasks';
import { mockTasks, mockPipelines } from '@/data/mockTaskData';
import { mockStaff } from '@/data/mockStaffData';
import { TaskEditDrawer } from './tasks/TaskEditDrawer';
import { TaskDetailSheet } from './tasks/TaskDetailSheet';
import { TaskKanbanBoard } from './tasks/TaskKanbanBoard';
import { PipelineManagerDrawer } from './tasks/PipelineManagerDrawer';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { detectDueDateNotifications, getDueDateStatusLabel, TaskDueDateNotification } from '@/lib/taskDueDateNotificationService';

const taskTypeConfig: Record<TaskType, { label: string; icon: React.ReactNode; color: string }> = {
  work_order: { label: 'Work Order', icon: <ClipboardList className="h-4 w-4" />, color: 'primary' },
  corrective_action: { label: 'Corrective Action', icon: <AlertTriangle className="h-4 w-4" />, color: 'error' },
  maintenance_request: { label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'warning' },
};

const staffOptions = mockStaff.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  position: s.position,
  avatar: s.avatar,
}));

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'info' },
  in_progress: { label: 'In Progress', color: 'primary' },
  blocked: { label: 'Blocked', color: 'error' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'default' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'error' },
};

interface TaskManagementPanelProps {
  onNavigateToSubmission?: (submissionId: string) => void;
  initialTaskId?: string | null;
  onTaskViewed?: () => void;
}

export function TaskManagementPanel({ onNavigateToSubmission, initialTaskId, onTaskViewed }: TaskManagementPanelProps = {}) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [pipelines, setPipelines] = useState<TaskPipeline[]>(mockPipelines);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(mockPipelines[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Drawer/Sheet state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showPipelineDrawer, setShowPipelineDrawer] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  
  // Context menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkAssignAnchor, setBulkAssignAnchor] = useState<null | HTMLElement>(null);

  // Due date notifications
  const [dueDateNotifications, setDueDateNotifications] = useState<TaskDueDateNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const selectedPipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0],
    [pipelines, selectedPipelineId]
  );

  // Auto-open task when navigating from submissions
  useEffect(() => {
    if (initialTaskId) {
      const targetTask = tasks.find(t => t.id === initialTaskId);
      if (targetTask) {
        setSelectedTask(targetTask);
        setShowDetailSheet(true);
        onTaskViewed?.();
      }
    }
  }, [initialTaskId, tasks, onTaskViewed]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesPipeline = viewMode === 'list' || task.pipelineId === selectedPipelineId || !task.pipelineId;
      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesPipeline;
    });
  }, [tasks, searchQuery, statusFilter, typeFilter, priorityFilter, viewMode, selectedPipelineId]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }), [tasks]);

  // Detect due date notifications
  useEffect(() => {
    const notifications = detectDueDateNotifications(tasks);
    const activeNotifications = notifications.filter(n => !dismissedNotifications.has(n.taskId));
    setDueDateNotifications(activeNotifications);
  }, [tasks, dismissedNotifications]);

  const addActivityLog = (taskId: string, log: Omit<TaskActivityLog, 'id' | 'timestamp'>): TaskActivityLog => {
    return {
      ...log,
      id: `log-${Date.now()}`,
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

  const handleBulkStatusChange = (newStatus: TaskStatus) => {
    const count = selectedTaskIds.size;
    selectedTaskIds.forEach(taskId => {
      handleStatusChange(taskId, newStatus);
    });
    setSelectedTaskIds(new Set());
    toast.success(`Updated status to ${statusConfig[newStatus].label} for ${count} task(s)`);
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

  const handleDismissNotification = (taskId: string) => {
    setDismissedNotifications(prev => new Set([...prev, taskId]));
  };

  const handleLinkedFormClick = (submissionId: string) => {
    if (onNavigateToSubmission) {
      onNavigateToSubmission(submissionId);
    } else {
      toast.info(`Navigate to submission: ${submissionId}`);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setEditMode('create');
    setShowEditDrawer(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditMode('edit');
    setShowDetailSheet(false);
    setShowEditDrawer(true);
  };

  const handleSaveTask = (formData: TaskFormData, attachments: TaskAttachment[]) => {
    if (editMode === 'create') {
      const newTask: Task = {
        id: `task-${Date.now()}`,
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
            userId: 'current-user',
            userName: 'Current User',
          }),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User',
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
        userId: 'current-user',
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

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const oldStatus = t.status;
      const statusLog = addActivityLog(taskId, {
        type: 'status_change',
        description: `Status changed from ${statusConfig[oldStatus].label} to ${statusConfig[newStatus].label}`,
        userId: 'current-user',
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
    
    toast.success(`Task status updated to ${statusConfig[newStatus].label}`);
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
        userId: 'current-user',
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
        userId: 'current-user',
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
      id: `comment-${Date.now()}`,
      userId: 'current-user',
      userName: 'Current User',
      text,
      createdAt: new Date().toISOString(),
    };

    const commentLog = addActivityLog(taskId, {
      type: 'comment_added',
      description: 'Added a comment',
      userId: 'current-user',
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

  // Pipeline management
  const handleCreatePipeline = (pipeline: TaskPipeline) => {
    setPipelines(prev => [...prev, pipeline]);
  };

  const handleUpdatePipeline = (pipeline: TaskPipeline) => {
    setPipelines(prev => prev.map(p => p.id === pipeline.id ? pipeline : p));
  };

  const handleDeletePipeline = (pipelineId: string) => {
    setPipelines(prev => prev.filter(p => p.id !== pipelineId));
    if (selectedPipelineId === pipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <div>
            <Typography variant="h6" fontWeight={600}>Task Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Track work orders, corrective actions, and maintenance requests
            </Typography>
          </div>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Due Date Notifications Bell */}
            {dueDateNotifications.length > 0 && (
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  onClick={() => setShowNotifications(!showNotifications)}
                  sx={{ 
                    bgcolor: showNotifications ? 'action.selected' : 'transparent',
                  }}
                >
                  <Bell className="h-4 w-4" />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                  }}
                />
              </Box>
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="list">
                <LayoutList size={16} />
              </ToggleButton>
              <ToggleButton value="kanban">
                <LayoutGrid size={16} />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outline" onClick={() => setShowPipelineDrawer(true)}>
              <GitBranch className="h-4 w-4 mr-1" />
              Pipelines
            </Button>
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </Stack>
        </Stack>

        {/* Due Date Notifications Panel */}
        <Collapse in={showNotifications}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: 1, borderColor: 'warning.200' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                <Bell className="h-4 w-4 inline mr-1" /> Due Date Reminders ({dueDateNotifications.length})
              </Typography>
              <IconButton size="small" onClick={() => setShowNotifications(false)}>
                <X size={14} />
              </IconButton>
            </Stack>
            <Stack spacing={1}>
              {dueDateNotifications.slice(0, 5).map(notification => (
                <Stack
                  key={notification.taskId}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ 
                    p: 1, 
                    bgcolor: 'background.paper', 
                    borderRadius: 0.5,
                    borderLeft: 3,
                    borderColor: notification.severity === 'critical' ? 'error.main' : 
                                  notification.severity === 'warning' ? 'warning.main' : 'info.main',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap fontWeight={500}>
                      {notification.taskTitle}
                    </Typography>
                    <Typography variant="caption" color={notification.severity === 'critical' ? 'error.main' : 'text.secondary'}>
                      {getDueDateStatusLabel(notification)}
                      {notification.assigneeName && ` • ${notification.assigneeName}`}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const task = tasks.find(t => t.id === notification.taskId);
                        if (task) handleTaskClick(task);
                        setShowNotifications(false);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleDismissNotification(notification.taskId)}
                    >
                      <X size={12} />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
              {dueDateNotifications.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  And {dueDateNotifications.length - 5} more...
                </Typography>
              )}
            </Stack>
          </Box>
        </Collapse>

        {/* Pipeline Selector (Kanban mode) */}
        {viewMode === 'kanban' && (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Pipeline:</Typography>
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Stack direction="row" spacing={0.25}>
                        {p.stages.slice(0, 3).map(s => (
                          <Box
                            key={s.id}
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.color }}
                          />
                        ))}
                      </Stack>
                      <span>{p.name}</span>
                    </Stack>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Typography variant="caption" color="text.secondary">
              {selectedPipeline.stages.length} stages
            </Typography>
          </Stack>
        )}

        {/* Stats */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <Chip
            label={`All (${stats.total})`}
            size="small"
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('all')}
          />
          <Chip
            icon={<Clock className="h-3 w-3" />}
            label={`Open (${stats.open})`}
            size="small"
            variant={statusFilter === 'open' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('open')}
          />
          <Chip
            label={`In Progress (${stats.inProgress})`}
            size="small"
            variant={statusFilter === 'in_progress' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('in_progress')}
          />
          <Chip
            icon={<AlertTriangle className="h-3 w-3" />}
            label={`Blocked (${stats.blocked})`}
            size="small"
            variant={statusFilter === 'blocked' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('blocked')}
            sx={{
              bgcolor: statusFilter === 'blocked' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
              color: 'rgb(185, 28, 28)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          />
          <Chip
            icon={<CheckCircle className="h-3 w-3" />}
            label={`Completed (${stats.completed})`}
            size="small"
            variant={statusFilter === 'completed' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('completed')}
            sx={{
              bgcolor: statusFilter === 'completed' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: 'rgb(21, 128, 61)',
              borderColor: 'rgba(34, 197, 94, 0.4)',
            }}
          />
          {stats.overdue > 0 && (
            <Chip
              icon={<Flag className="h-3 w-3" />}
              label={`Overdue (${stats.overdue})`}
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: 'rgb(185, 28, 28)',
              }}
            />
          )}
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="work_order">Work Orders</SelectItem>
              <SelectItem value="corrective_action">Corrective Actions</SelectItem>
              <SelectItem value="maintenance_request">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </Stack>
      </Box>

      {/* Bulk Action Bar */}
      <Collapse in={viewMode === 'list' && selectedTaskIds.size > 0}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'primary.200' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" fontWeight={500}>
              {selectedTaskIds.size} task(s) selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('in_progress')}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('completed')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => setBulkAssignAnchor(e.currentTarget)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTaskIds(new Set())}
            >
              Clear Selection
            </Button>
          </Stack>
        </Box>
      </Collapse>

      {/* Bulk Assign Menu */}
      <Menu
        anchorEl={bulkAssignAnchor}
        open={Boolean(bulkAssignAnchor)}
        onClose={() => setBulkAssignAnchor(null)}
      >
        {staffOptions.map(staff => (
          <MenuItem
            key={staff.id}
            onClick={() => handleBulkAssign(staff.id, staff.name)}
          >
            <ListItemIcon>
              <Avatar sx={{ width: 24, height: 24 }}>
                <User size={12} />
              </Avatar>
            </ListItemIcon>
            <ListItemText primary={staff.name} secondary={staff.position} />
          </MenuItem>
        ))}
      </Menu>

      {/* Content */}
      {viewMode === 'list' ? (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Select All Header */}
          {filteredTasks.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, pl: 0.5 }}>
              <Checkbox
                checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
                onCheckedChange={(checked) => handleSelectAllTasks(!!checked)}
              />
              <Typography variant="caption" color="text.secondary">
                Select all ({filteredTasks.length})
              </Typography>
            </Stack>
          )}
          <Stack spacing={2}>
            {filteredTasks.map((task) => {
              const typeInfo = taskTypeConfig[task.type];
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
              const isSelected = selectedTaskIds.has(task.id);
              
              return (
                <Card 
                  key={task.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="py-3">
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                      {/* Checkbox */}
                      <Box onClick={(e) => e.stopPropagation()} sx={{ pt: 0.5 }}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectTask(task.id, !!checked)}
                        />
                      </Box>

                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Chip
                            icon={typeInfo.icon as React.ReactElement}
                            label={typeInfo.label}
                            size="small"
                            color={typeInfo.color as any}
                            variant="outlined"
                          />
                          <Chip
                            label={priorityConfig[task.priority].label}
                            size="small"
                            color={priorityConfig[task.priority].color as any}
                          />
                          <Chip
                            label={statusConfig[task.status].label}
                            size="small"
                            variant="outlined"
                          />
                          {isOverdue && (
                            <Chip label="Overdue" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)' }} />
                          )}
                          {task.linkedSubmissionId && (
                            <Chip
                              icon={<Link2 className="h-3 w-3" />}
                              label="From Form"
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLinkedFormClick(task.linkedSubmissionId!);
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                handleLinkedFormClick(task.linkedSubmissionId!);
                              }}
                              deleteIcon={<ExternalLink className="h-3 w-3" />}
                              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            />
                          )}
                        </Stack>
                        
                        <Typography variant="subtitle1" fontWeight={600}>
                          {task.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" className="line-clamp-2">
                          {task.description}
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          {task.assigneeName && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Avatar sx={{ width: 20, height: 20 }}>
                                <User className="h-3 w-3" />
                              </Avatar>
                              <Typography variant="caption">{task.assigneeName}</Typography>
                            </Stack>
                          )}
                          {task.dueDate && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                                Due {format(new Date(task.dueDate), 'MMM d')}
                              </Typography>
                            </Stack>
                          )}
                          {task.location && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <Typography variant="caption" color="text.secondary">
                                {task.location}
                              </Typography>
                            </Stack>
                          )}
                          {task.attachments.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <Typography variant="caption" color="text.secondary">
                                {task.attachments.length}
                              </Typography>
                            </Stack>
                          )}
                          {task.comments.length > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <Typography variant="caption" color="text.secondary">
                                {task.comments.length}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Stack>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAnchor(e.currentTarget);
                          setMenuTaskId(task.id);
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            {filteredTasks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h6" color="text.secondary">
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your filters or create a new task
                </Typography>
                <Button onClick={handleCreateTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Task
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      ) : (
        <TaskKanbanBoard
          tasks={filteredTasks}
          pipeline={selectedPipeline}
          onTaskClick={handleTaskClick}
          onStageChange={handleStageChange}
          onAssigneeChange={handleAssigneeChange}
        />
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          const task = tasks.find(t => t.id === menuTaskId);
          if (task) handleTaskClick(task);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><Eye className="h-4 w-4" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuTaskId) handleStatusChange(menuTaskId, 'in_progress');
          setMenuAnchor(null);
        }}>
          <ListItemIcon><ArrowRight className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Start Work</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuTaskId) handleStatusChange(menuTaskId, 'completed');
          setMenuAnchor(null);
        }}>
          <ListItemIcon><CheckCircle className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Mark Complete</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuTaskId && handleDeleteTask(menuTaskId)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 className="h-4 w-4 text-destructive" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        open={showDetailSheet}
        task={selectedTask}
        onClose={() => setShowDetailSheet(false)}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
        onEdit={() => selectedTask && handleEditTask(selectedTask)}
        onLinkedFormClick={handleLinkedFormClick}
      />

      {/* Task Edit/Create Drawer */}
      <TaskEditDrawer
        open={showEditDrawer}
        task={selectedTask}
        mode={editMode}
        onClose={() => setShowEditDrawer(false)}
        onSave={handleSaveTask}
      />

      {/* Pipeline Manager Drawer */}
      <PipelineManagerDrawer
        open={showPipelineDrawer}
        pipelines={pipelines}
        onClose={() => setShowPipelineDrawer(false)}
        onSave={(p) => setPipelines(p)}
        onCreatePipeline={handleCreatePipeline}
        onUpdatePipeline={handleUpdatePipeline}
        onDeletePipeline={handleDeletePipeline}
      />
    </Box>
  );
}
