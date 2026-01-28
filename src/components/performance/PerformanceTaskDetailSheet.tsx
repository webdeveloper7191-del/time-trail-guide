import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  User,
  Target,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  AlertCircle,
  GraduationCap,
  Paperclip,
  Send,
  ExternalLink,
  Edit,
  FileText,
  Image,
  Download,
} from 'lucide-react';
import {
  PerformanceTask,
  PerformanceTaskType,
  PerformanceTaskStatus,
  performanceTaskTypeConfig,
  performanceTaskStatusConfig,
  performanceTaskPriorityConfig,
} from '@/types/performanceTasks';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { format } from 'date-fns';

interface PerformanceTaskDetailSheetProps {
  open: boolean;
  task: PerformanceTask | null;
  goals?: Goal[];
  reviews?: PerformanceReview[];
  conversations?: Conversation[];
  onClose: () => void;
  onEdit: (task: PerformanceTask) => void;
  onStatusChange: (taskId: string, newStatus: PerformanceTaskStatus) => void;
  onAddComment: (taskId: string, text: string) => void;
  onNavigateToGoal?: (goalId: string) => void;
  onNavigateToReview?: (reviewId: string) => void;
  onNavigateToConversation?: (conversationId: string) => void;
}

const typeIcons: Record<PerformanceTaskType, React.ReactNode> = {
  goal_action: <Target className="h-4 w-4" />,
  review_followup: <ClipboardCheck className="h-4 w-4" />,
  development_task: <BookOpen className="h-4 w-4" />,
  coaching_task: <MessageSquare className="h-4 w-4" />,
  pip_action: <AlertCircle className="h-4 w-4" />,
  training_task: <GraduationCap className="h-4 w-4" />,
};

export function PerformanceTaskDetailSheet({
  open,
  task,
  goals = [],
  reviews = [],
  conversations = [],
  onClose,
  onEdit,
  onStatusChange,
  onAddComment,
  onNavigateToGoal,
  onNavigateToReview,
  onNavigateToConversation,
}: PerformanceTaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [newComment, setNewComment] = useState('');

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  
  const linkedGoal = goals.find(g => g.id === task.linkedGoalId);
  const linkedReview = reviews.find(r => r.id === task.linkedReviewId);
  const linkedConversation = conversations.find(c => c.id === task.linkedConversationId);

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
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <SheetTitle className="text-lg font-semibold leading-tight">
                  {task.title}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    icon={typeIcons[task.type] as React.ReactElement}
                    label={performanceTaskTypeConfig[task.type].label}
                    size="small"
                    color={performanceTaskTypeConfig[task.type].color as any}
                    variant="outlined"
                  />
                  <Chip
                    label={performanceTaskPriorityConfig[task.priority].label}
                    size="small"
                    color={performanceTaskPriorityConfig[task.priority].color as any}
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                <Edit className="h-3 w-3 mr-1" /> Edit
              </Button>
            </div>
          </SheetHeader>

          {/* Status & Actions */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="caption" color="text.secondary">Status:</Typography>
                <Select
                  value={task.status}
                  onValueChange={(v) => onStatusChange(task.id, v as PerformanceTaskStatus)}
                >
                  <SelectTrigger className="h-7 w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(performanceTaskStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Stack>
              {isOverdue && (
                <Chip label="Overdue" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)' }} />
              )}
            </Stack>
          </Box>

          {/* Content Tabs */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tab label="Details" />
              <Tab label={`Comments (${task.comments.length})`} />
              <Tab label={`Attachments (${task.attachments.length})`} />
              <Tab label="Activity" />
            </Tabs>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {activeTab === 0 && (
                <Stack spacing={2.5}>
                  {/* Description */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                    <Typography variant="body2">
                      {task.description || 'No description provided'}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Meta Info */}
                  <Stack spacing={1.5}>
                    {task.createdForName && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">For:</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {task.createdForName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{task.createdForName}</Typography>
                        </Stack>
                      </Stack>
                    )}

                    {task.assigneeName && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">Assigned to:</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {task.assigneeName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{task.assigneeName}</Typography>
                        </Stack>
                      </Stack>
                    )}

                    {task.dueDate && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">Due:</Typography>
                        <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={500}>
                          {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Linked Items */}
                  {(linkedGoal || linkedReview || linkedConversation) && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Linked Items</Typography>
                        <Stack spacing={1}>
                          {linkedGoal && (
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                              onClick={() => onNavigateToGoal?.(linkedGoal.id)}
                            >
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Target className="h-4 w-4 text-primary" />
                                  <Box>
                                    <Typography variant="body2" fontWeight={500}>{linkedGoal.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">Goal</Typography>
                                  </Box>
                                </Stack>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Stack>
                            </Box>
                          )}

                          {linkedReview && (
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                              onClick={() => onNavigateToReview?.(linkedReview.id)}
                            >
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <ClipboardCheck className="h-4 w-4 text-secondary" />
                                  <Box>
                                    <Typography variant="body2" fontWeight={500}>{linkedReview.reviewCycle} Review</Typography>
                                    <Typography variant="caption" color="text.secondary">Period: {linkedReview.periodStart}</Typography>
                                  </Box>
                                </Stack>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </>
                  )}

                  {/* Created Info */}
                  <Divider />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Created by {task.createdBy} on {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {format(new Date(task.updatedAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Stack>
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={2}>
                  {task.comments.map(comment => (
                    <Box key={comment.id} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                          {comment.userName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={500}>{comment.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{comment.text}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}

                  {task.comments.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">No comments yet</Typography>
                    </Box>
                  )}

                  {/* Add Comment */}
                  <Box sx={{ pt: 1 }}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        size="small"
                        fullWidth
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                      />
                      <Button size="sm" onClick={handleSubmitComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={1}>
                  {task.attachments.map(att => (
                    <Box
                      key={att.id}
                      sx={{
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {att.type.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{att.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(att.size)} • Uploaded by {att.uploadedBy}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <Download className="h-4 w-4" />
                      </IconButton>
                    </Box>
                  ))}

                  {task.attachments.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">No attachments</Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {activeTab === 3 && (
                <Stack spacing={1.5}>
                  {task.activityLog.slice().reverse().map(log => (
                    <Box key={log.id} sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ pt: 0.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: log.type === 'created' ? 'success.main' : 
                                     log.type === 'status_change' ? 'primary.main' : 'grey.400',
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{log.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.userName} • {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </div>
      </SheetContent>
    </Sheet>
  );
}
