import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Plus,
  Search,
  Filter,
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
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

// Task types
export type TaskType = 'work_order' | 'corrective_action' | 'maintenance_request';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  location?: string;
  assetId?: string;
  assetName?: string;
  linkedSubmissionId?: string;
  linkedFieldId?: string;
  attachments?: { name: string; url: string }[];
  comments?: { id: string; userId: string; userName: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
}

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Refrigerator Temperature Out of Range',
    description: 'Temperature recorded at 9°C, exceeds maximum threshold of 8°C. Immediate action required to prevent food safety issues.',
    type: 'corrective_action',
    status: 'open',
    priority: 'critical',
    assigneeName: 'John Smith',
    dueDate: '2024-01-24',
    location: 'Kitchen - Building A',
    linkedSubmissionId: 'submission-2',
    linkedFieldId: 'field-6',
    createdAt: '2024-01-22T07:45:00Z',
    updatedAt: '2024-01-22T07:45:00Z',
    createdBy: 'System',
  },
  {
    id: 'task-2',
    title: 'HVAC Filter Replacement',
    description: 'Scheduled maintenance for quarterly HVAC filter replacement.',
    type: 'maintenance_request',
    status: 'in_progress',
    priority: 'medium',
    assigneeName: 'Mike Johnson',
    dueDate: '2024-01-25',
    location: 'Office - Floor 2',
    assetName: 'HVAC Unit #3',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-22T14:30:00Z',
    createdBy: 'Admin',
  },
  {
    id: 'task-3',
    title: 'Fire Exit Sign Repair',
    description: 'Exit sign light is not functioning in the east corridor. Safety compliance requirement.',
    type: 'work_order',
    status: 'open',
    priority: 'high',
    assigneeName: 'Sarah Williams',
    dueDate: '2024-01-23',
    location: 'East Corridor - Building B',
    linkedSubmissionId: 'submission-1',
    createdAt: '2024-01-21T09:00:00Z',
    updatedAt: '2024-01-21T09:00:00Z',
    createdBy: 'System',
  },
  {
    id: 'task-4',
    title: 'Deep Cleaning - Kitchen Area',
    description: 'Monthly deep cleaning scheduled for kitchen and food preparation areas.',
    type: 'work_order',
    status: 'completed',
    priority: 'medium',
    assigneeName: 'Lisa Brown',
    dueDate: '2024-01-20',
    location: 'Kitchen - Building A',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
    completedAt: '2024-01-20T16:00:00Z',
    createdBy: 'Admin',
  },
  {
    id: 'task-5',
    title: 'Safety Equipment Inspection Failed',
    description: 'Fire extinguisher inspection revealed expired tags. Immediate replacement required.',
    type: 'corrective_action',
    status: 'blocked',
    priority: 'critical',
    assigneeName: 'John Smith',
    dueDate: '2024-01-22',
    location: 'Warehouse - Zone C',
    linkedSubmissionId: 'submission-3',
    comments: [
      { id: 'c1', userId: 'user-1', userName: 'John Smith', text: 'Waiting for replacement units to arrive from supplier.', createdAt: '2024-01-22T10:00:00Z' },
    ],
    createdAt: '2024-01-21T14:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
    createdBy: 'System',
  },
];

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'work_order' as TaskType,
    priority: 'medium' as TaskPriority,
    assigneeName: '',
    dueDate: '',
    location: '',
  });

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

  const handleCreateTask = () => {
    const task: Task = {
      id: `task-${Date.now()}`,
      ...newTask,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User',
    };
    setTasks(prev => [task, ...prev]);
    setShowCreateModal(false);
    setNewTask({
      title: '',
      description: '',
      type: 'work_order',
      priority: 'medium',
      assigneeName: '',
      dueDate: '',
      location: '',
    });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            completedAt: newStatus === 'completed' ? new Date().toISOString() : t.completedAt,
          } 
        : t
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAddComment = () => {
    if (!selectedTask || !newComment.trim()) return;
    const comment = {
      id: `comment-${Date.now()}`,
      userId: 'current-user',
      userName: 'Current User',
      text: newComment,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => prev.map(t =>
      t.id === selectedTask.id
        ? { ...t, comments: [...(t.comments || []), comment] }
        : t
    ));
    setSelectedTask(prev => prev ? { ...prev, comments: [...(prev.comments || []), comment] } : null);
    setNewComment('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setMenuAnchor(null);
    if (selectedTask?.id === taskId) {
      setShowDetailSheet(false);
      setSelectedTask(null);
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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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

      {/* Task List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {filteredTasks.map((task) => {
            const typeInfo = taskTypeConfig[task.type];
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <Card 
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTask(task);
                  setShowDetailSheet(true);
                }}
              >
                <CardContent className="py-3">
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
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

                      <Stack direction="row" spacing={2} alignItems="center">
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
                            <Typography variant="caption">{task.location}</Typography>
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
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Task
              </Button>
            </Box>
          )}
        </Stack>
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
            setSelectedTask(task);
            setShowDetailSheet(true);
          }
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
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTask.title}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                <Stack spacing={3}>
                  {/* Status & Priority */}
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={taskTypeConfig[selectedTask.type].icon as React.ReactElement}
                      label={taskTypeConfig[selectedTask.type].label}
                      size="small"
                      color={taskTypeConfig[selectedTask.type].color as any}
                    />
                    <Chip
                      label={priorityConfig[selectedTask.priority].label}
                      size="small"
                      color={priorityConfig[selectedTask.priority].color as any}
                    />
                  </Stack>

                  {/* Status Selector */}
                  <div>
                    <Label className="mb-2 block">Status</Label>
                    <Select 
                      value={selectedTask.status} 
                      onValueChange={(v) => handleStatusChange(selectedTask.id, v as TaskStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="mb-2 block">Description</Label>
                    <Typography variant="body2">{selectedTask.description}</Typography>
                  </div>

                  {/* Details */}
                  <div>
                    <Label className="mb-2 block">Details</Label>
                    <Stack spacing={1}>
                      {selectedTask.assigneeName && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <User className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body2">Assigned to: {selectedTask.assigneeName}</Typography>
                        </Stack>
                      )}
                      {selectedTask.dueDate && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body2">
                            Due: {format(new Date(selectedTask.dueDate), 'MMMM d, yyyy')}
                          </Typography>
                        </Stack>
                      )}
                      {selectedTask.location && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body2">{selectedTask.location}</Typography>
                        </Stack>
                      )}
                      {selectedTask.linkedSubmissionId && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body2">
                            Linked to form submission
                          </Typography>
                          <Button variant="link" size="sm" className="h-auto p-0">
                            View Form
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </div>

                  {/* Comments */}
                  <div>
                    <Label className="mb-2 block">Comments ({selectedTask.comments?.length || 0})</Label>
                    <Stack spacing={2}>
                      {selectedTask.comments?.map((comment) => (
                        <Box key={comment.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <User className="h-3 w-3" />
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {comment.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">{comment.text}</Typography>
                        </Box>
                      ))}
                      <Stack direction="row" spacing={1}>
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                          Add
                        </Button>
                      </Stack>
                    </Stack>
                  </div>
                </Stack>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <div>
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task..."
                className="mt-1"
              />
            </div>
            <Stack direction="row" spacing={2}>
              <div className="flex-1">
                <Label>Type</Label>
                <Select 
                  value={newTask.type} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, type: v as TaskType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work_order">Work Order</SelectItem>
                    <SelectItem value="corrective_action">Corrective Action</SelectItem>
                    <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, priority: v as TaskPriority }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Stack>
            <Stack direction="row" spacing={2}>
              <div className="flex-1">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Input
                  id="task-assignee"
                  value={newTask.assigneeName}
                  onChange={(e) => setNewTask(prev => ({ ...prev, assigneeName: e.target.value }))}
                  placeholder="Assign to..."
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </Stack>
            <div>
              <Label htmlFor="task-location">Location</Label>
              <Input
                id="task-location"
                value={newTask.location}
                onChange={(e) => setNewTask(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where is this task?"
                className="mt-1"
              />
            </div>
          </Stack>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
