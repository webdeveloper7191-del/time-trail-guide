import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TaskType, TaskStatus, TaskPriority, TaskFormData, TaskAttachment, TaskActivityLog } from '@/types/tasks';
import { mockTasks } from '@/data/mockTaskData';
import { TaskEditDrawer } from './tasks/TaskEditDrawer';
import { TaskDetailSheet } from './tasks/TaskDetailSheet';
import { TaskKanbanBoard } from './tasks/TaskKanbanBoard';
import { format } from 'date-fns';
import { toast } from 'sonner';

const taskTypeConfig: Record<TaskType, { label: string; icon: React.ReactNode; color: string }> = {
  work_order: { label: 'Work Order', icon: <ClipboardList className="h-4 w-4" />, color: 'primary' },
  corrective_action: { label: 'Corrective Action', icon: <AlertTriangle className="h-4 w-4" />, color: 'error' },
  maintenance_request: { label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'warning' },
};

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

export function TaskManagementPanel() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Drawer/Sheet state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  
  // Context menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, typeFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }), [tasks]);

  const addActivityLog = (taskId: string, log: Omit<TaskActivityLog, 'id' | 'timestamp'>): TaskActivityLog => {
    const newLog: TaskActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    return newLog;
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

    // Update selected task if viewing
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    toast.success(`Task status updated to ${statusConfig[newStatus].label}`);
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

    // Update selected task if viewing
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
          <Stack direction="row" spacing={1}>
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
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </Stack>
        </Stack>

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
            color="error"
            variant={statusFilter === 'blocked' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('blocked')}
          />
          <Chip
            icon={<CheckCircle className="h-3 w-3" />}
            label={`Completed (${stats.completed})`}
            size="small"
            color="success"
            variant={statusFilter === 'completed' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('completed')}
          />
          {stats.overdue > 0 && (
            <Chip
              icon={<Flag className="h-3 w-3" />}
              label={`Overdue (${stats.overdue})`}
              size="small"
              color="error"
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

      {/* Content */}
      {viewMode === 'list' ? (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Stack spacing={2}>
            {filteredTasks.map((task) => {
              const typeInfo = taskTypeConfig[task.type];
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
              
              return (
                <Card 
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="py-3">
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
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
                            <Chip label="Overdue" size="small" color="error" />
                          )}
                          {task.linkedSubmissionId && (
                            <Chip
                              icon={<Link2 className="h-3 w-3" />}
                              label="From Form"
                              size="small"
                              variant="outlined"
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
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
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
      />

      {/* Task Edit/Create Drawer */}
      <TaskEditDrawer
        open={showEditDrawer}
        task={selectedTask}
        mode={editMode}
        onClose={() => setShowEditDrawer(false)}
        onSave={handleSaveTask}
      />
    </Box>
  );
}
