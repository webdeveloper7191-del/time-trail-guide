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
  TextField,
  InputAdornment,
  IconButton,
  Drawer,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  AlertTitle,
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
  ClipboardList,
  Search,
  Download,
  MoreVertical,
  Eye,
  Trash2,
  RotateCcw,
  MapPin,
  Image,
  Paperclip,
  ExternalLink,
  Filter,
  Calendar,
  X,
  FileSpreadsheet,
  History,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormSubmission, FormTemplate, FormField, FIELD_TYPES } from '@/types/forms';
import { mockFormSubmissions, mockFormTemplates } from '@/data/mockFormData';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

interface AuditLogEntry {
  id: string;
  action: 'created' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'reopened';
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

const workflowSteps = [
  { label: 'Draft', description: 'Form is being filled out' },
  { label: 'Submitted', description: 'Awaiting review' },
  { label: 'Under Review', description: 'Manager reviewing submission' },
  { label: 'Completed', description: 'Approved or rejected' },
];

// Mock field responses for detail view
const mockResponses: Record<string, Record<string, unknown>> = {
  'submission-1': {
    'field-1': 'John Smith',
    'field-2': 'Main Campus',
    'field-3': new Date().toISOString().split('T')[0],
    'field-4': 7.5,
    'field-5': true,
    'field-6': 'All safety protocols were followed during the shift.',
    'field-7': ['Fire extinguisher checked', 'Emergency exits clear', 'First aid kit stocked'],
  },
  'submission-2': {
    'field-1': 'Sarah Williams',
    'field-2': 'North Wing',
    'field-3': new Date().toISOString().split('T')[0],
    'field-4': 9,
    'field-5': false,
    'field-6': 'Temperature was above threshold, maintenance notified.',
    'field-7': ['Fire extinguisher checked', 'Emergency exits clear'],
  },
};

// Mock audit log
const mockAuditLog: Record<string, AuditLogEntry[]> = {
  'submission-1': [
    { id: 'log-1', action: 'created', userId: 'user-1', userName: 'John Smith', timestamp: '2024-01-22T08:00:00Z' },
    { id: 'log-2', action: 'submitted', userId: 'user-1', userName: 'John Smith', timestamp: '2024-01-22T08:30:00Z' },
    { id: 'log-3', action: 'reviewed', userId: 'user-2', userName: 'Jane Doe', timestamp: '2024-01-22T10:15:00Z', details: 'Initial review completed' },
    { id: 'log-4', action: 'approved', userId: 'user-2', userName: 'Jane Doe', timestamp: '2024-01-22T10:20:00Z', details: 'All checks passed' },
  ],
  'submission-2': [
    { id: 'log-5', action: 'created', userId: 'user-3', userName: 'Sarah Williams', timestamp: '2024-01-22T07:30:00Z' },
    { id: 'log-6', action: 'submitted', userId: 'user-3', userName: 'Sarah Williams', timestamp: '2024-01-22T07:45:00Z' },
  ],
};

// Mock form fields for display
const mockFormFields: FormField[] = [
  { id: 'field-1', type: 'staff_selector', label: 'Staff Member', required: true, order: 0 },
  { id: 'field-2', type: 'dropdown', label: 'Location', required: true, order: 1, options: [{ id: '1', label: 'Main Campus', value: 'main' }, { id: '2', label: 'North Wing', value: 'north' }] },
  { id: 'field-3', type: 'date', label: 'Date', required: true, order: 2 },
  { id: 'field-4', type: 'number', label: 'Temperature (°C)', required: true, order: 3 },
  { id: 'field-5', type: 'checkbox', label: 'All safety checks completed', required: false, order: 4 },
  { id: 'field-6', type: 'long_text', label: 'Notes', required: false, order: 5 },
  { id: 'field-7', type: 'multi_select', label: 'Completed Items', required: false, order: 6, options: [
    { id: 'c1', label: 'Fire extinguisher checked', value: 'fire' },
    { id: 'c2', label: 'Emergency exits clear', value: 'exits' },
    { id: 'c3', label: 'First aid kit stocked', value: 'firstaid' },
  ]},
];

export function SubmissionWorkflow({ templateId }: SubmissionWorkflowProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockFormSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<'responses' | 'audit' | 'tasks'>('responses');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
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
    {
      id: 'task-2',
      title: 'Safety Check Incomplete',
      description: 'First aid kit not verified during inspection',
      status: 'in_progress',
      priority: 'medium',
      assignee: 'Mike Johnson',
      dueDate: '2024-01-24',
      submissionId: 'submission-2',
      fieldId: 'field-7',
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
      if (statusFilter === 'pending') {
        filtered = filtered.filter(s => s.status === 'pending_review' || s.status === 'submitted');
      } else {
        filtered = filtered.filter(s => s.status === statusFilter);
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.submittedBy.toLowerCase().includes(query) ||
        getTemplateName(s.templateId).toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );
    }
    if (dateFilter.start) {
      filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(dateFilter.start));
    }
    if (dateFilter.end) {
      filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(dateFilter.end));
    }
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [submissions, templateId, statusFilter, searchQuery, dateFilter]);

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

  const handleViewDetails = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setDetailDrawerOpen(true);
  };

  const handleOpenReview = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setReviewComment('');
    setReviewDrawerOpen(true);
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
      setReviewDrawerOpen(false);
      setDetailDrawerOpen(false);
      setSelectedSubmission(null);
      setReviewComment('');
      toast.success('Submission approved');
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
      setReviewDrawerOpen(false);
      setDetailDrawerOpen(false);
      setSelectedSubmission(null);
      setReviewComment('');
      toast.success('Submission rejected');
    }
  };

  const handleReopen = (submission: FormSubmission) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submission.id
          ? { ...s, status: 'pending_review' as const, reviewedBy: undefined, reviewedAt: undefined, reviewComments: undefined }
          : s
      )
    );
    toast.success('Submission reopened for review');
  };

  const handleDelete = (submissionId: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    setDetailDrawerOpen(false);
    setSelectedSubmission(null);
    toast.success('Submission deleted');
  };

  const handleBulkApprove = () => {
    setSubmissions(prev =>
      prev.map(s =>
        selectedSubmissions.has(s.id) && (s.status === 'submitted' || s.status === 'pending_review')
          ? { ...s, status: 'approved' as const, reviewedBy: 'current-user', reviewedAt: new Date().toISOString() }
          : s
      )
    );
    setSelectedSubmissions(new Set());
    setBulkMenuAnchor(null);
    toast.success(`${selectedSubmissions.size} submissions approved`);
  };

  const handleBulkReject = () => {
    setSubmissions(prev =>
      prev.map(s =>
        selectedSubmissions.has(s.id) && (s.status === 'submitted' || s.status === 'pending_review')
          ? { ...s, status: 'rejected' as const, reviewedBy: 'current-user', reviewedAt: new Date().toISOString() }
          : s
      )
    );
    setSelectedSubmissions(new Set());
    setBulkMenuAnchor(null);
    toast.success(`${selectedSubmissions.size} submissions rejected`);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const dataToExport = selectedSubmissions.size > 0 
      ? filteredSubmissions.filter(s => selectedSubmissions.has(s.id))
      : filteredSubmissions;
    
    // Mock export functionality
    toast.success(`Exporting ${dataToExport.length} submissions as ${format.toUpperCase()}`);
    setAnchorEl(null);
  };

  const toggleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubmissions(newSelected);
  };

  const renderResponseValue = (field: FormField, value: unknown) => {
    if (value === undefined || value === null) return <Typography variant="body2" color="text.secondary">—</Typography>;

    switch (field.type) {
      case 'checkbox':
        return value ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
      case 'photo_upload':
      case 'video_upload':
      case 'file_upload':
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Paperclip className="h-4 w-4" />
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>View Attachment</Typography>
          </Stack>
        );
      case 'signature':
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Image className="h-4 w-4" />
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>View Signature</Typography>
          </Stack>
        );
      case 'location':
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <MapPin className="h-4 w-4" />
            <Typography variant="body2">{String(value)}</Typography>
          </Stack>
        );
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {value.map((v, i) => (
                <Chip key={i} label={v} size="small" />
              ))}
            </Stack>
          );
        }
        return <Typography variant="body2">{String(value)}</Typography>;
      case 'date':
        return <Typography variant="body2">{format(new Date(String(value)), 'MMM d, yyyy')}</Typography>;
      case 'datetime':
        return <Typography variant="body2">{format(new Date(String(value)), 'MMM d, yyyy h:mm a')}</Typography>;
      default:
        return <Typography variant="body2">{String(value)}</Typography>;
    }
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

  const submissionTasks = selectedSubmission ? autoTasks.filter(t => t.submissionId === selectedSubmission.id) : [];
  const submissionAuditLog = selectedSubmission ? mockAuditLog[selectedSubmission.id] || [] : [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h6" fontWeight={600}>Submission Workflow</Typography>
            <Typography variant="body2" color="text.secondary">
              Review, approve, and manage form submissions
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Button variant="outline" size="sm" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Download className="h-4 w-4 mr-1" />
              Export
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => handleExport('csv')}>
                <ListItemIcon><FileText className="h-4 w-4" /></ListItemIcon>
                <ListItemText>Export as CSV</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('xlsx')}>
                <ListItemIcon><FileSpreadsheet className="h-4 w-4" /></ListItemIcon>
                <ListItemText>Export as Excel</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Box>

      {/* Search & Filters */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="h-4 w-4" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 280 }}
          />
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          {(dateFilter.start || dateFilter.end || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFilter({ start: '', end: '' }); setSearchQuery(''); }}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </Stack>
      </Box>

      {/* Status Filters */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
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
              variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('pending')}
            />
            <Chip
              icon={<CheckCircle className="h-3 w-3" />}
              label={`Approved (${stats.approved})`}
              size="small"
              color="success"
              variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('approved')}
            />
            <Chip
              icon={<XCircle className="h-3 w-3" />}
              label={`Rejected (${stats.rejected})`}
              size="small"
              color="error"
              variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('rejected')}
            />
            {stats.failed > 0 && (
              <Chip
                icon={<AlertTriangle className="h-3 w-3" />}
                label={`Failed Audits (${stats.failed})`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          {selectedSubmissions.size > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {selectedSubmissions.size} selected
              </Typography>
              <Button size="sm" variant="outline" onClick={(e) => setBulkMenuAnchor(e.currentTarget)}>
                Bulk Actions
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              <Menu anchorEl={bulkMenuAnchor} open={Boolean(bulkMenuAnchor)} onClose={() => setBulkMenuAnchor(null)}>
                <MenuItem onClick={handleBulkApprove}>
                  <ListItemIcon><CheckCircle className="h-4 w-4 text-green-500" /></ListItemIcon>
                  <ListItemText>Approve Selected</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleBulkReject}>
                  <ListItemIcon><XCircle className="h-4 w-4 text-red-500" /></ListItemIcon>
                  <ListItemText>Reject Selected</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Submissions Table */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                    indeterminate={selectedSubmissions.size > 0 && selectedSubmissions.size < filteredSubmissions.length}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Reviewed By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow 
                  key={submission.id} 
                  hover 
                  selected={selectedSubmissions.has(submission.id)}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewDetails(submission)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedSubmissions.has(submission.id)}
                      onChange={() => toggleSelect(submission.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {getTemplateName(submission.templateId)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{submission.templateVersion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <User className="h-3 w-3" />
                      </Avatar>
                      <Typography variant="body2">{submission.submittedBy}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {submission.submittedAt 
                        ? format(new Date(submission.submittedAt), 'MMM d, yyyy')
                        : format(new Date(submission.createdAt), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(submission.updatedAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {getStatusBadge(submission.status)}
                      {getPassFailBadge(submission.passFail)}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {submission.score !== undefined ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={500}>{submission.score}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={submission.score}
                          sx={{ width: 40, height: 4, borderRadius: 2 }}
                          color={submission.score >= 80 ? 'success' : submission.score >= 50 ? 'warning' : 'error'}
                        />
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.reviewedBy ? (
                      <Typography variant="body2">{submission.reviewedBy}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(submission)}>
                          <Eye className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                      {(submission.status === 'submitted' || submission.status === 'pending_review') && (
                        <Tooltip title="Review">
                          <IconButton size="small" color="primary" onClick={() => handleOpenReview(submission)}>
                            <ClipboardList className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(submission.status === 'approved' || submission.status === 'rejected') && (
                        <Tooltip title="Reopen">
                          <IconButton size="small" onClick={() => handleReopen(submission)}>
                            <RotateCcw className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">
                        No submissions found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
      >
        {selectedSubmission && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="h6" fontWeight={600}>
                    {getTemplateName(selectedSubmission.templateId)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    {getStatusBadge(selectedSubmission.status)}
                    {getPassFailBadge(selectedSubmission.passFail)}
                    <Typography variant="caption" color="text.secondary">
                      v{selectedSubmission.templateVersion}
                    </Typography>
                  </Stack>
                </div>
                <IconButton onClick={() => setDetailDrawerOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </Stack>
            </Box>

            {/* Workflow Stepper */}
            <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Stepper activeStep={getStatusStep(selectedSubmission.status)} alternativeLabel>
                {workflowSteps.map((step) => (
                  <Step key={step.label}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Submission Meta */}
            <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}>
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
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">
                    {selectedSubmission.submittedAt
                      ? format(new Date(selectedSubmission.submittedAt), 'MMM d, yyyy h:mm a')
                      : format(new Date(selectedSubmission.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                {selectedSubmission.score !== undefined && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Score</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={600}>{selectedSubmission.score}%</Typography>
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
            </Box>

            {/* Tabs */}
            <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={0}>
                {(['responses', 'audit', 'tasks'] as const).map((tab) => (
                  <Box
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      borderBottom: 2,
                      borderColor: activeTab === tab ? 'primary.main' : 'transparent',
                      color: activeTab === tab ? 'primary.main' : 'text.secondary',
                      fontWeight: activeTab === tab ? 600 : 400,
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {tab === 'tasks' ? `Tasks (${submissionTasks.length})` : tab}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {activeTab === 'responses' && (
                <Stack spacing={2}>
                  {mockFormFields.map((field) => {
                    const value = mockResponses[selectedSubmission.id]?.[field.id];
                    return (
                      <Box key={field.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Typography>
                        {renderResponseValue(field, value)}
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {activeTab === 'audit' && (
                <Stack spacing={2}>
                  {submissionAuditLog.length > 0 ? (
                    submissionAuditLog.map((entry) => (
                      <Box key={entry.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: entry.action === 'approved' ? 'success.50' : entry.action === 'rejected' ? 'error.50' : 'grey.100' 
                          }}>
                            {entry.action === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {entry.action === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                            {entry.action === 'submitted' && <Send className="h-4 w-4 text-blue-600" />}
                            {entry.action === 'created' && <FileText className="h-4 w-4 text-gray-600" />}
                            {entry.action === 'reviewed' && <Eye className="h-4 w-4 text-purple-600" />}
                            {entry.action === 'reopened' && <RotateCcw className="h-4 w-4 text-orange-600" />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                              {entry.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              by {entry.userName} • {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                            </Typography>
                            {entry.details && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>{entry.details}</Typography>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">No audit history available</Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {activeTab === 'tasks' && (
                <Stack spacing={2}>
                  {submissionTasks.length > 0 ? (
                    submissionTasks.map((task) => (
                      <Alert 
                        key={task.id} 
                        severity={task.priority === 'critical' || task.priority === 'high' ? 'error' : 'warning'}
                        sx={{ '& .MuiAlert-message': { width: '100%' } }}
                      >
                        <AlertTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {task.title}
                          <Chip label={task.status} size="small" variant="outlined" />
                        </AlertTitle>
                        <Typography variant="body2" sx={{ mb: 1 }}>{task.description}</Typography>
                        <Stack direction="row" spacing={2}>
                          {task.assignee && (
                            <Chip
                              size="small"
                              avatar={<Avatar sx={{ width: 18, height: 18 }}><User className="h-2 w-2" /></Avatar>}
                              label={task.assignee}
                            />
                          )}
                          {task.dueDate && (
                            <Chip
                              size="small"
                              icon={<Calendar className="h-3 w-3" />}
                              label={`Due ${format(new Date(task.dueDate), 'MMM d')}`}
                            />
                          )}
                          <Chip size="small" label={task.priority} color={task.priority === 'high' || task.priority === 'critical' ? 'error' : 'default'} />
                        </Stack>
                      </Alert>
                    ))
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <Typography variant="body2" color="text.secondary">No tasks for this submission</Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            {/* Drawer Footer */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button variant="outline" onClick={() => handleDelete(selectedSubmission.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Stack direction="row" spacing={2}>
                  {(selectedSubmission.status === 'approved' || selectedSubmission.status === 'rejected') && (
                    <Button variant="outline" onClick={() => handleReopen(selectedSubmission)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reopen
                    </Button>
                  )}
                  {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'pending_review') && (
                    <>
                      <Button variant="outline" onClick={handleReject}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button onClick={handleApprove}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Review Drawer */}
      <Drawer
        anchor="right"
        open={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        {selectedSubmission && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>Review Submission</Typography>
                <IconButton onClick={() => setReviewDrawerOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {getTemplateName(selectedSubmission.templateId)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted by {selectedSubmission.submittedBy}
                    </Typography>
                    {selectedSubmission.score !== undefined && (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2">Score: {selectedSubmission.score}%</Typography>
                        {getPassFailBadge(selectedSubmission.passFail)}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1 }}>
                    Review Comments (Optional)
                  </Typography>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Enter any comments or feedback..."
                    className="min-h-[120px]"
                  />
                </div>
              </Stack>
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outline" onClick={() => setReviewDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleReject} className="border-destructive text-destructive hover:bg-destructive/10">
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
