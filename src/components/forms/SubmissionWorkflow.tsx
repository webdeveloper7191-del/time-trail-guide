import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  User,
  Send,
  Save,
  RotateCcw,
  ClipboardList,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FormSubmission, FormTemplate } from '@/types/forms';
import { mockFormSubmissions, mockFormTemplates } from '@/data/mockFormData';
import { format } from 'date-fns';

interface SubmissionWorkflowProps {
  templateId?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  submissionId: string;
  fieldId: string;
  createdAt: string;
}

const workflowSteps = [
  { label: 'Draft', description: 'Form is being filled out' },
  { label: 'Submitted', description: 'Awaiting review' },
  { label: 'Under Review', description: 'Manager reviewing submission' },
  { label: 'Completed', description: 'Approved or rejected' },
];

export function SubmissionWorkflow({ templateId }: SubmissionWorkflowProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockFormSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [autoTasks, setAutoTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: 'Temperature Out of Range',
      description: 'Refrigerator temperature recorded at 9°C, exceeds maximum threshold of 8°C',
      status: 'open',
      priority: 'high',
      assignee: 'John Smith',
      dueDate: '2024-01-23',
      submissionId: 'submission-2',
      fieldId: 'field-6',
      createdAt: '2024-01-22T07:45:00Z',
    },
  ]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    if (templateId) {
      filtered = filtered.filter(s => s.templateId === templateId);
    }
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    return filtered;
  }, [submissions, templateId, statusFilter]);

  const getTemplateName = (id: string) => {
    return mockFormTemplates.find(t => t.id === id)?.name || 'Unknown Form';
  };

  const getStatusStep = (status: FormSubmission['status']) => {
    switch (status) {
      case 'draft': return 0;
      case 'submitted': return 1;
      case 'pending_review': return 2;
      case 'approved':
      case 'rejected': return 3;
      default: return 0;
    }
  };

  const getStatusBadge = (status: FormSubmission['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Save className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="outline"><Send className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'pending_review':
        return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPassFailBadge = (passFail?: 'pass' | 'fail' | 'n/a') => {
    switch (passFail) {
      case 'pass':
        return <Badge className="bg-green-500">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    if (selectedSubmission) {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                status: 'approved' as const,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
                reviewComments: reviewComment || undefined,
              }
            : s
        )
      );
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewComment('');
    }
  };

  const handleReject = () => {
    if (selectedSubmission) {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                status: 'rejected' as const,
                reviewedBy: 'current-user',
                reviewedAt: new Date().toISOString(),
                reviewComments: reviewComment || undefined,
              }
            : s
        )
      );
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewComment('');
    }
  };

  const handleSaveDraft = (submissionId: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? { ...s, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleSubmitForReview = (submissionId: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? {
              ...s,
              status: 'submitted' as const,
              submittedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const stats = useMemo(() => {
    const all = templateId ? submissions.filter(s => s.templateId === templateId) : submissions;
    return {
      total: all.length,
      draft: all.filter(s => s.status === 'draft').length,
      pending: all.filter(s => s.status === 'pending_review' || s.status === 'submitted').length,
      approved: all.filter(s => s.status === 'approved').length,
      rejected: all.filter(s => s.status === 'rejected').length,
      failed: all.filter(s => s.passFail === 'fail').length,
    };
  }, [submissions, templateId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>Submission Workflow</Typography>
        <Typography variant="body2" color="text.secondary">
          Review, approve, and manage form submissions
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip
            label={`All (${stats.total})`}
            size="small"
            variant={statusFilter === null ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter(null)}
          />
          <Chip
            icon={<Save className="h-3 w-3" />}
            label={`Drafts (${stats.draft})`}
            size="small"
            variant={statusFilter === 'draft' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('draft')}
          />
          <Chip
            icon={<Clock className="h-3 w-3" />}
            label={`Pending (${stats.pending})`}
            size="small"
            variant={statusFilter === 'pending_review' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('pending_review')}
          />
          <Chip
            icon={<CheckCircle className="h-3 w-3" />}
            label={`Approved (${stats.approved})`}
            size="small"
            variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('approved')}
          />
          <Chip
            icon={<XCircle className="h-3 w-3" />}
            label={`Rejected (${stats.rejected})`}
            size="small"
            variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('rejected')}
          />
          {stats.failed > 0 && (
            <Chip
              icon={<AlertTriangle className="h-3 w-3" />}
              label={`Failed Audits (${stats.failed})`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Submissions List */}
        <Box sx={{ width: 400, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <ScrollArea className="h-full">
            <Stack spacing={0}>
              {filteredSubmissions.map((submission) => (
                <Box
                  key={submission.id}
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: selectedSubmission?.id === submission.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {getTemplateName(submission.templateId)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        {getStatusBadge(submission.status)}
                        {getPassFailBadge(submission.passFail)}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {submission.submittedAt
                          ? `Submitted ${format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}`
                          : `Draft saved ${format(new Date(submission.updatedAt), 'MMM d, yyyy')}`}
                      </Typography>
                    </Box>
                    {submission.score !== undefined && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {submission.score}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Score
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ))}

              {filteredSubmissions.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <Typography variant="body2" color="text.secondary">
                    No submissions found
                  </Typography>
                </Box>
              )}
            </Stack>
          </ScrollArea>
        </Box>

        {/* Submission Detail */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {selectedSubmission ? (
            <Stack spacing={3}>
              {/* Workflow Stepper */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workflow Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Stepper activeStep={getStatusStep(selectedSubmission.status)} alternativeLabel>
                    {workflowSteps.map((step) => (
                      <Step key={step.label}>
                        <StepLabel>{step.label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>

              {/* Submission Info */}
              <Card>
                <CardHeader>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <div>
                      <CardTitle>{getTemplateName(selectedSubmission.templateId)}</CardTitle>
                      <CardDescription>
                        Version {selectedSubmission.templateVersion}
                      </CardDescription>
                    </div>
                    <Stack direction="row" spacing={1}>
                      {getStatusBadge(selectedSubmission.status)}
                      {getPassFailBadge(selectedSubmission.passFail)}
                    </Stack>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Submitted By</Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <User className="h-4 w-4" />
                          </Avatar>
                          <Typography variant="body2">{selectedSubmission.submittedBy}</Typography>
                        </Stack>
                      </Box>
                      {selectedSubmission.submittedAt && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Submitted At</Typography>
                          <Typography variant="body2">
                            {format(new Date(selectedSubmission.submittedAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      )}
                      {selectedSubmission.score !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Score</Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedSubmission.score}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={selectedSubmission.score}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                              color={selectedSubmission.score >= 80 ? 'success' : selectedSubmission.score >= 50 ? 'warning' : 'error'}
                            />
                          </Stack>
                        </Box>
                      )}
                    </Stack>

                    {selectedSubmission.reviewedBy && (
                      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">Review</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                          <Typography variant="body2">
                            Reviewed by {selectedSubmission.reviewedBy}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedSubmission.reviewedAt && format(new Date(selectedSubmission.reviewedAt), 'MMM d, yyyy')}
                          </Typography>
                        </Stack>
                        {selectedSubmission.reviewComments && (
                          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <Typography variant="body2">{selectedSubmission.reviewComments}</Typography>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Auto-created Tasks */}
              {autoTasks.filter(t => t.submissionId === selectedSubmission.id).length > 0 && (
                <Card>
                  <CardHeader>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <CardTitle className="text-base">Auto-Created Tasks</CardTitle>
                        <CardDescription>
                          Tasks created from failed threshold checks
                        </CardDescription>
                      </div>
                    </Stack>
                  </CardHeader>
                  <CardContent>
                    <Stack spacing={2}>
                      {autoTasks
                        .filter(t => t.submissionId === selectedSubmission.id)
                        .map((task) => (
                          <Box
                            key={task.id}
                            sx={{ p: 2, border: 1, borderColor: 'error.light', borderRadius: 1, bgcolor: 'error.lighter' }}
                          >
                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                              <div>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {task.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {task.description}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  <Chip
                                    label={task.priority}
                                    size="small"
                                    color={task.priority === 'critical' || task.priority === 'high' ? 'error' : 'default'}
                                  />
                                  <Chip label={task.status} size="small" variant="outlined" />
                                  {task.assignee && (
                                    <Chip
                                      avatar={<Avatar sx={{ width: 20, height: 20 }}><User className="h-3 w-3" /></Avatar>}
                                      label={task.assignee}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                              </div>
                              <Button variant="outline" size="sm">
                                View Task
                              </Button>
                            </Stack>
                          </Box>
                        ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'pending_review') && (
                <Card>
                  <CardContent className="py-3">
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewModal(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setShowReviewModal(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {selectedSubmission.status === 'draft' && (
                <Card>
                  <CardContent className="py-3">
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button variant="outline" onClick={() => handleSaveDraft(selectedSubmission.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Draft
                      </Button>
                      <Button onClick={() => handleSubmitForReview(selectedSubmission.id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Submit for Review
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack alignItems="center" spacing={2}>
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
                <Typography variant="h6" color="text.secondary">
                  Select a submission
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on a submission to view details and take action
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Box>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <div>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Review Comments (Optional)</Typography>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter any comments or feedback..."
                className="min-h-[100px]"
              />
            </div>
          </Stack>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="outline" onClick={handleReject} className="text-destructive border-destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
