import { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import {
  User,
  Calendar,
  GripVertical,
  AlertTriangle,
  ClipboardList,
  Wrench,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import { Task, TaskStatus } from '@/types/tasks';
import { format } from 'date-fns';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'open', label: 'Open', color: '#3b82f6' },
  { status: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { status: 'blocked', label: 'Blocked', color: '#ef4444' },
  { status: 'completed', label: 'Completed', color: '#22c55e' },
];

const typeIcons = {
  work_order: <ClipboardList size={12} />,
  corrective_action: <AlertTriangle size={12} />,
  maintenance_request: <Wrench size={12} />,
};

const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
}: TaskKanbanBoardProps) {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      open: [],
      in_progress: [],
      blocked: [],
      completed: [],
      cancelled: [],
    };
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        height: '100%',
        overflow: 'auto',
        p: 2,
      }}
    >
      {columns.map(col => (
        <Box
          key={col.status}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.status)}
          sx={{
            flex: '0 0 300px',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.50',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Column Header */}
          <Box
            sx={{
              p: 1.5,
              borderBottom: 3,
              borderColor: col.color,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: col.color,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  {col.label}
                </Typography>
              </Stack>
              <Chip
                label={tasksByStatus[col.status].length}
                size="small"
                sx={{ height: 20, minWidth: 24 }}
              />
            </Stack>
          </Box>

          {/* Cards */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 1,
            }}
          >
            <Stack spacing={1}>
              {tasksByStatus[col.status].map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                
                return (
                  <Paper
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => onTaskClick(task)}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'grab',
                      transition: 'all 0.15s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      },
                      '&:active': {
                        cursor: 'grabbing',
                      },
                    }}
                  >
                    {/* Priority & Type */}
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                      <Chip
                        icon={typeIcons[task.type]}
                        label={task.type === 'work_order' ? 'WO' : task.type === 'corrective_action' ? 'CA' : 'MR'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                      />
                      <Chip
                        label={task.priority.charAt(0).toUpperCase()}
                        size="small"
                        color={priorityColors[task.priority] as any}
                        sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                      />
                      {isOverdue && (
                        <Chip
                          label="!"
                          size="small"
                          color="error"
                          sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.5 } }}
                        />
                      )}
                    </Stack>

                    {/* Title */}
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {task.title}
                    </Typography>

                    {/* Meta */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        {task.dueDate && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Calendar size={12} className="text-muted-foreground" />
                            <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>
                              {format(new Date(task.dueDate), 'MMM d')}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        {task.attachments.length > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.25}>
                            <Paperclip size={12} className="text-muted-foreground" />
                            <Typography variant="caption" color="text.secondary">
                              {task.attachments.length}
                            </Typography>
                          </Stack>
                        )}
                        {task.comments.length > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.25}>
                            <MessageSquare size={12} className="text-muted-foreground" />
                            <Typography variant="caption" color="text.secondary">
                              {task.comments.length}
                            </Typography>
                          </Stack>
                        )}
                        {task.assigneeName ? (
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                            {task.assigneeName.charAt(0)}
                          </Avatar>
                        ) : (
                          <Avatar sx={{ width: 20, height: 20, bgcolor: 'grey.200' }}>
                            <User size={12} />
                          </Avatar>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}

              {tasksByStatus[col.status].length === 0 && (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: 2,
                    borderStyle: 'dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Drop tasks here
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
