import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  User,
  Calendar,
  Target,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  Paperclip,
  UserPlus,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import {
  PerformanceTask,
  PerformanceTaskPipeline,
  PerformanceTaskType,
  performanceTaskTypeConfig,
  performanceTaskPriorityConfig,
} from '@/types/performanceTasks';
import { mockStaff } from '@/data/mockStaffData';
import { format } from 'date-fns';

interface StaffOption {
  id: string;
  name: string;
  position: string;
  avatar?: string;
}

interface PerformanceTaskKanbanBoardProps {
  tasks: PerformanceTask[];
  pipeline: PerformanceTaskPipeline;
  onTaskClick: (task: PerformanceTask) => void;
  onStageChange: (taskId: string, newStageId: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string, assigneeName: string) => void;
}

const typeIcons: Record<PerformanceTaskType, React.ReactElement> = {
  goal_action: <Target size={12} />,
  review_followup: <ClipboardCheck size={12} />,
  development_task: <BookOpen size={12} />,
  coaching_task: <MessageSquare size={12} />,
  pip_action: <AlertCircle size={12} />,
  training_task: <GraduationCap size={12} />,
};

const staffOptions: StaffOption[] = mockStaff.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  position: s.position,
  avatar: s.avatar,
}));

export function PerformanceTaskKanbanBoard({
  tasks,
  pipeline,
  onTaskClick,
  onStageChange,
  onAssigneeChange,
}: PerformanceTaskKanbanBoardProps) {
  const [assignMenuAnchor, setAssignMenuAnchor] = useState<null | HTMLElement>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  const sortedStages = useMemo(() => 
    [...pipeline.stages].sort((a, b) => a.order - b.order),
    [pipeline.stages]
  );

  const tasksByStage = useMemo(() => {
    const grouped: Record<string, PerformanceTask[]> = {};
    sortedStages.forEach(stage => {
      grouped[stage.id] = [];
    });
    tasks.forEach(task => {
      const stageId = task.stageId || sortedStages[0]?.id;
      if (grouped[stageId]) {
        grouped[stageId].push(task);
      } else if (sortedStages[0]) {
        grouped[sortedStages[0].id].push(task);
      }
    });
    return grouped;
  }, [tasks, sortedStages]);

  const handleDragStart = (e: React.DragEvent, task: PerformanceTask) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStageChange(taskId, targetStageId);
    }
  };

  const handleAssignClick = (e: React.MouseEvent<HTMLElement>, taskId: string) => {
    e.stopPropagation();
    setAssignMenuAnchor(e.currentTarget);
    setAssigningTaskId(taskId);
  };

  const handleAssignSelect = (staff: StaffOption | null) => {
    if (assigningTaskId) {
      onAssigneeChange(assigningTaskId, staff?.id || '', staff?.name || '');
    }
    setAssignMenuAnchor(null);
    setAssigningTaskId(null);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          height: '100%',
          overflow: 'auto',
          p: 2,
        }}
      >
        {sortedStages.map(stage => (
          <Box
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
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
                borderColor: stage.color,
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
                      bgcolor: stage.color,
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {stage.name}
                  </Typography>
                </Stack>
                <Chip
                  label={tasksByStage[stage.id]?.length || 0}
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
                {(tasksByStage[stage.id] || []).map(task => {
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
                          label={performanceTaskTypeConfig[task.type].label.split(' ')[0]}
                          size="small"
                          variant="outlined"
                          color={performanceTaskTypeConfig[task.type].color as any}
                          sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                        />
                        <Chip
                          label={task.priority.charAt(0).toUpperCase()}
                          size="small"
                          color={performanceTaskPriorityConfig[task.priority].color as any}
                          sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                        />
                        {isOverdue && (
                          <Chip
                            label="!"
                            size="small"
                            sx={{ 
                              height: 20, 
                              minWidth: 20, 
                              '& .MuiChip-label': { px: 0.5 },
                              bgcolor: 'rgba(239, 68, 68, 0.12)', 
                              color: 'rgb(185, 28, 28)' 
                            }}
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

                      {/* For Employee */}
                      {task.createdForName && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">For:</Typography>
                          <Typography variant="caption" fontWeight={500}>{task.createdForName}</Typography>
                        </Stack>
                      )}

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
                          
                          {/* Assignee Avatar */}
                          <Box
                            onClick={(e) => handleAssignClick(e, task.id)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                              transition: 'transform 0.15s',
                            }}
                          >
                            {task.assigneeName ? (
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.7rem',
                                  border: 2,
                                  borderColor: 'primary.main',
                                }}
                              >
                                {task.assigneeName.charAt(0)}
                              </Avatar>
                            ) : (
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  bgcolor: 'grey.200',
                                  border: 2,
                                  borderStyle: 'dashed',
                                  borderColor: 'grey.400',
                                }}
                              >
                                <UserPlus size={12} />
                              </Avatar>
                            )}
                          </Box>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}

                {(tasksByStage[stage.id]?.length || 0) === 0 && (
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

      {/* Quick Assign Menu */}
      <Menu
        anchorEl={assignMenuAnchor}
        open={Boolean(assignMenuAnchor)}
        onClose={() => setAssignMenuAnchor(null)}
        PaperProps={{ sx: { maxHeight: 300, width: 250 } }}
      >
        <MenuItem onClick={() => handleAssignSelect(null)}>
          <ListItemIcon>
            <User size={16} />
          </ListItemIcon>
          <ListItemText primary="Unassigned" />
        </MenuItem>
        <Divider />
        {staffOptions.map(staff => (
          <MenuItem key={staff.id} onClick={() => handleAssignSelect(staff)}>
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
    </>
  );
}
