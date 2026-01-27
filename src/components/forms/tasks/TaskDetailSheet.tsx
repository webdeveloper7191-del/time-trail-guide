import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Divider,
  TextField,
  Button as MuiButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  X,
  User,
  Calendar,
  MapPin,
  Link2,
  Pencil,
  Clock,
  MessageSquare,
  History,
  Paperclip,
  File,
  Download,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Task, TaskStatus, TaskActivityLog } from '@/types/tasks';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskDetailSheetProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddComment: (taskId: string, comment: string) => void;
  onEdit: () => void;
  onLinkedFormClick?: (submissionId: string) => void;
}

const taskTypeConfig = {
  work_order: { label: 'Work Order', color: 'primary' },
  corrective_action: { label: 'Corrective Action', color: 'error' },
  maintenance_request: { label: 'Maintenance', color: 'warning' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'default' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'error' },
};

const activityTypeIcons = {
  status_change: <Clock size={14} />,
  assignment_change: <User size={14} />,
  priority_change: <Clock size={14} />,
  comment_added: <MessageSquare size={14} />,
  attachment_added: <Paperclip size={14} />,
  edit: <Pencil size={14} />,
  created: <Clock size={14} />,
};

export function TaskDetailSheet({
  open,
  task,
  onClose,
  onStatusChange,
  onAddComment,
  onEdit,
  onLinkedFormClick,
}: TaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [newComment, setNewComment] = useState('');

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment);
    setNewComment('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[560px] sm:max-w-[560px] p-0">
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  {task.title}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={taskTypeConfig[task.type].label}
                    size="small"
                    color={taskTypeConfig[task.type].color as any}
                    variant="outlined"
                  />
                  <Chip
                    label={priorityConfig[task.priority].label}
                    size="small"
                    color={priorityConfig[task.priority].color as any}
                  />
                  {isOverdue && (
                    <Chip label="Overdue" size="small" color="error" />
                  )}
                  {task.linkedSubmissionId && (
                    <Chip
                      icon={<Link2 size={12} />}
                      label="From Form"
                      size="small"
                      variant="outlined"
                      onClick={() => onLinkedFormClick?.(task.linkedSubmissionId!)}
                      onDelete={() => onLinkedFormClick?.(task.linkedSubmissionId!)}
                      deleteIcon={<ExternalLink size={12} />}
                      sx={{ cursor: onLinkedFormClick ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}
                    />
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={onEdit}>
                  <Pencil size={16} />
                </IconButton>
                <IconButton size="small" onClick={() => onClose()}>
                  <X size={16} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>

          {/* Status Selector */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Label className="text-sm">Status:</Label>
              <Select
                value={task.status}
                onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}
              >
                <SelectTrigger className="w-[180px] h-8">
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
            </Stack>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="Details" sx={{ minWidth: 80 }} />
            <Tab label={`Comments (${task.comments.length})`} sx={{ minWidth: 80 }} />
            <Tab label={`Attachments (${task.attachments.length})`} sx={{ minWidth: 80 }} />
            <Tab label="Activity" sx={{ minWidth: 80 }} />
          </Tabs>

          {/* Tab Content */}
          <ScrollArea className="flex-1">
            <Box sx={{ p: 2 }}>
              {/* Details Tab */}
              {activeTab === 0 && (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {task.description || 'No description provided.'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Stack spacing={1.5}>
                    {task.assigneeName && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <User size={14} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Assigned to</Typography>
                          <Typography variant="body2" fontWeight={500}>{task.assigneeName}</Typography>
                        </Box>
                      </Stack>
                    )}
                    {!task.assigneeName && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.200' }}>
                          <User size={14} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                      </Stack>
                    )}

                    {task.dueDate && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={16} className="text-muted-foreground" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Due Date</Typography>
                          <Typography variant="body2" fontWeight={500} color={isOverdue ? 'error.main' : 'text.primary'}>
                            {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                            {isOverdue && ' (Overdue)'}
                          </Typography>
                        </Box>
                      </Stack>
                    )}

                    {task.location && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={16} className="text-muted-foreground" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Location</Typography>
                          <Typography variant="body2" fontWeight={500}>{task.location}</Typography>
                        </Box>
                      </Stack>
                    )}

                    {task.linkedSubmissionId && (
                      <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={1.5}
                        sx={{ 
                          cursor: onLinkedFormClick ? 'pointer' : 'default',
                          p: 1,
                          mx: -1,
                          borderRadius: 1,
                          '&:hover': onLinkedFormClick ? { bgcolor: 'action.hover' } : undefined,
                        }}
                        onClick={() => onLinkedFormClick?.(task.linkedSubmissionId!)}
                      >
                        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Link2 size={16} className="text-muted-foreground" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">Source</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            View linked form submission
                          </Typography>
                        </Box>
                        {onLinkedFormClick && <ExternalLink size={14} className="text-muted-foreground" />}
                      </Stack>
                    )}
                  </Stack>

                  <Divider />

                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Created</Typography>
                      <Typography variant="body2">
                        {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Created by</Typography>
                      <Typography variant="body2">{task.createdBy}</Typography>
                    </Box>
                  </Stack>
                </Stack>
              )}

              {/* Comments Tab */}
              {activeTab === 1 && (
                <Stack spacing={2}>
                  {task.comments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <MessageSquare size={32} className="mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">
                        No comments yet. Start the conversation.
                      </Typography>
                    </Box>
                  ) : (
                    task.comments.map(comment => (
                      <Box key={comment.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <User size={12} />
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {comment.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </Typography>
                        </Stack>
                        <Typography variant="body2">{comment.text}</Typography>
                      </Box>
                    ))
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <TextField
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      fullWidth
                      size="small"
                      multiline
                      maxRows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                    />
                    <MuiButton
                      variant="contained"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      <Send size={16} />
                    </MuiButton>
                  </Stack>
                </Stack>
              )}

              {/* Attachments Tab */}
              {activeTab === 2 && (
                <Stack spacing={1.5}>
                  {task.attachments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Paperclip size={32} className="mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">
                        No attachments. Edit the task to add files.
                      </Typography>
                    </Box>
                  ) : (
                    task.attachments.map(att => (
                      <Box
                        key={att.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                      >
                        {att.type.startsWith('image/') ? (
                          <Box
                            component="img"
                            src={att.url}
                            alt={att.name}
                            sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', mr: 1.5 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              bgcolor: 'primary.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                            }}
                          >
                            <File size={24} />
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {att.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(att.size)} • Uploaded {formatDistanceToNow(new Date(att.uploadedAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                        <IconButton size="small" component="a" href={att.url} download={att.name}>
                          <Download size={16} />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Stack>
              )}

              {/* Activity Tab */}
              {activeTab === 3 && (
                <Stack spacing={0}>
                  {task.activityLog.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <History size={32} className="mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">
                        No activity recorded yet.
                      </Typography>
                    </Box>
                  ) : (
                    task.activityLog
                      .slice()
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log, index) => (
                        <Box
                          key={log.id}
                          sx={{
                            display: 'flex',
                            py: 1.5,
                            borderBottom: index < task.activityLog.length - 1 ? 1 : 0,
                            borderColor: 'divider',
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            {activityTypeIcons[log.type]}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">
                              <strong>{log.userName}</strong> {log.description.toLowerCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                  )}
                </Stack>
              )}
            </Box>
          </ScrollArea>
        </Box>
      </SheetContent>
    </Sheet>
  );
}
