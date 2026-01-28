import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Avatar,
  Checkbox,
  Slider,
} from '@mui/material';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal, GoalMilestone, GoalStatus, GoalPriority, goalStatusLabels, goalPriorityLabels, goalCategories } from '@/types/performance';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  X,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  Pencil,
  Save,
  Plus,
  Trash2,
  History,
  MessageSquare,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface GoalDetailSheetProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onUpdate: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onUpdateProgress: (goalId: string, progress: number) => Promise<Goal | null>;
  onDelete: (goalId: string) => Promise<void>;
}

interface ProgressNote {
  id: string;
  content: string;
  progress: number;
  createdBy: string;
  createdAt: string;
}

const priorityColors: Record<GoalPriority, string> = {
  low: 'default',
  medium: 'warning',
  high: 'warning',
  critical: 'error',
};

const statusColors: Record<GoalStatus, string> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  overdue: 'error',
  cancelled: 'default',
};

export function GoalDetailSheet({
  open,
  goal,
  onClose,
  onUpdate,
  onUpdateProgress,
  onDelete,
}: GoalDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedPriority, setEditedPriority] = useState<GoalPriority>('medium');
  const [progressValue, setProgressValue] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Mock progress notes
  const [progressNotes] = useState<ProgressNote[]>([
    {
      id: '1',
      content: 'Started initial research phase',
      progress: 10,
      createdBy: 'Sarah Williams',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      content: 'Completed first milestone ahead of schedule',
      progress: 35,
      createdBy: 'Sarah Williams',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  if (!goal) return null;

  const isOverdue = goal.targetDate && isPast(parseISO(goal.targetDate)) && goal.status !== 'completed';

  const handleStartEdit = () => {
    setEditedTitle(goal.title);
    setEditedDescription(goal.description);
    setEditedCategory(goal.category);
    setEditedPriority(goal.priority);
    setProgressValue(goal.progress);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    await onUpdate(goal.id, {
      title: editedTitle,
      description: editedDescription,
      category: editedCategory,
      priority: editedPriority,
    });
    setIsEditing(false);
    toast.success('Goal updated successfully');
  };

  const handleProgressUpdate = async () => {
    if (progressValue !== goal.progress) {
      await onUpdateProgress(goal.id, progressValue);
      setProgressNote('');
      toast.success('Progress updated');
    }
  };

  const handleMilestoneToggle = async (milestone: GoalMilestone) => {
    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestone.id
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
        : m
    );
    await onUpdate(goal.id, { milestones: updatedMilestones });
    toast.success(milestone.completed ? 'Milestone reopened' : 'Milestone completed!');
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    const newMilestone: GoalMilestone = {
      id: `milestone-${Date.now()}`,
      title: newMilestoneTitle,
      targetDate: goal.targetDate,
      completed: false,
    };
    await onUpdate(goal.id, { milestones: [...goal.milestones, newMilestone] });
    setNewMilestoneTitle('');
    toast.success('Milestone added');
  };

  const handleDelete = async () => {
    await onDelete(goal.id);
    onClose();
    toast.success('Goal deleted');
  };

  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const totalMilestones = goal.milestones.length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.100' }}>
                  <Target className="h-5 w-5 text-primary" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {isEditing ? 'Edit Goal' : 'Goal Details'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={goalStatusLabels[goal.status]}
                      size="small"
                      color={statusColors[goal.status] as any}
                    />
                    <Chip
                      label={goalPriorityLabels[goal.priority]}
                      size="small"
                      color={priorityColors[goal.priority] as any}
                      variant="outlined"
                    />
                    {isOverdue && <Chip label="Overdue" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)' }} />}
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                {!isEditing && (
                  <IconButton size="small" onClick={handleStartEdit}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                )}
                <IconButton size="small" onClick={onClose}>
                  <X className="h-4 w-4" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>

          {/* Content */}
          <ScrollArea className="flex-1">
            <Box sx={{ p: 2 }}>
              <Stack spacing={3}>
                {/* Title & Description */}
                {isEditing ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                    />
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Category</Typography>
                        <Select value={editedCategory} onValueChange={setEditedCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {goalCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Priority</Typography>
                        <Select value={editedPriority} onValueChange={(v) => setEditedPriority(v as GoalPriority)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(goalPriorityLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Box>
                    </Stack>
                  </Stack>
                ) : (
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{goal.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {goal.description}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Chip label={goal.category} size="small" variant="outlined" />
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <Typography variant="caption" color="text.secondary">
                          Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Divider />

                {/* Progress Section */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Progress
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2">Current Progress</Typography>
                        <Typography variant="body2" fontWeight={600}>{goal.progress}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={goal.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={goal.progress >= 100 ? 'success' : 'primary'}
                      />
                    </Box>
                    
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Update Progress
                      </Typography>
                      <Slider
                        value={progressValue || goal.progress}
                        onChange={(_, v) => setProgressValue(v as number)}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                        sx={{ mb: 2 }}
                      />
                      <Textarea
                        placeholder="Add a note about this progress update..."
                        value={progressNote}
                        onChange={(e) => setProgressNote(e.target.value)}
                        className="mb-2"
                      />
                      <Button size="sm" onClick={handleProgressUpdate}>
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Save Progress
                      </Button>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {/* Milestones */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Milestones ({completedMilestones}/{totalMilestones})
                    </Typography>
                  </Stack>
                  
                  <Stack spacing={1}>
                    {goal.milestones.map((milestone) => (
                      <Box
                        key={milestone.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: milestone.completed ? 'success.50' : 'background.paper',
                        }}
                      >
                        <Checkbox
                          checked={milestone.completed}
                          onChange={() => handleMilestoneToggle(milestone)}
                          size="small"
                        />
                        <Box sx={{ flex: 1, ml: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: milestone.completed ? 'line-through' : 'none' }}
                          >
                            {milestone.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {milestone.completed
                              ? `Completed ${formatDistanceToNow(parseISO(milestone.completedAt!), { addSuffix: true })}`
                              : `Due ${format(parseISO(milestone.targetDate), 'MMM d')}`}
                          </Typography>
                        </Box>
                        {milestone.completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </Box>
                    ))}

                    {/* Add Milestone */}
                    <Stack direction="row" spacing={1}>
                      <TextField
                        placeholder="Add new milestone..."
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        size="small"
                        fullWidth
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                      />
                      <Button size="sm" onClick={handleAddMilestone} disabled={!newMilestoneTitle.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                {/* Activity / Progress Notes */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    <History className="h-4 w-4 inline mr-1" />
                    Activity
                  </Typography>
                  <Stack spacing={1.5}>
                    {progressNotes.map((note) => (
                      <Box
                        key={note.id}
                        sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Avatar sx={{ width: 20, height: 20 }}>
                            <User className="h-3 w-3" />
                          </Avatar>
                          <Typography variant="caption" fontWeight={500}>
                            {note.createdBy}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {formatDistanceToNow(parseISO(note.createdAt), { addSuffix: true })}
                          </Typography>
                          <Chip label={`${note.progress}%`} size="small" sx={{ ml: 'auto' }} />
                        </Stack>
                        <Typography variant="body2">{note.content}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </ScrollArea>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between">
              <Button variant="outline" onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Goal
              </Button>
              {isEditing ? (
                <Stack direction="row" spacing={2}>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                </Stack>
              ) : (
                <Button onClick={onClose}>Close</Button>
              )}
            </Stack>
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}
