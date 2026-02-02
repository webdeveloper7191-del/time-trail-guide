import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  Plus,
  Check,
  X,
  Clock,
  DollarSign,
  GraduationCap,
  Building,
  Award,
  BookOpen,
  Calendar,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Pencil,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  DevelopmentBudget,
  BudgetRequest,
  BudgetCategory,
  budgetCategoryLabels,
  budgetStatusLabels,
} from '@/types/performanceAdvanced';
import {
  mockDevelopmentBudgets as initialBudgets,
  mockBudgetRequests as initialRequests,
} from '@/data/mockPerformanceAdvancedData';
import { toast } from 'sonner';

interface DevelopmentBudgetTrackerProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function DevelopmentBudgetTracker({ staff, currentUserId }: DevelopmentBudgetTrackerProps) {
  const [budgets, setBudgets] = useState<DevelopmentBudget[]>(initialBudgets);
  const [requests, setRequests] = useState<BudgetRequest[]>(initialRequests);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const [viewMode, setViewMode] = useState<'my_budget' | 'team_overview' | 'pending_approvals'>('my_budget');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEditBudgetDrawer, setShowEditBudgetDrawer] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DevelopmentBudget | null>(null);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const myBudget = budgets.find(b => b.staffId === currentUserId);
  const myRequests = requests.filter(r => r.staffId === currentUserId);
  const pendingApprovals = requests.filter(r => r.status === 'pending_approval');

  const filteredRequests = useMemo(() => {
    let result = requests;
    if (viewMode === 'my_budget') {
      result = result.filter(r => r.staffId === currentUserId);
    } else if (viewMode === 'pending_approvals') {
      result = result.filter(r => r.status === 'pending_approval');
    }
    if (filterCategory !== 'all') {
      result = result.filter(r => r.category === filterCategory);
    }
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    return result.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [requests, viewMode, filterCategory, filterStatus, currentUserId]);

  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const usedBudget = budgets.reduce((sum, b) => sum + b.usedBudget, 0);
    const pendingBudget = budgets.reduce((sum, b) => sum + b.pendingBudget, 0);
    const pendingRequests = requests.filter(r => r.status === 'pending_approval').length;
    return { totalBudget, usedBudget, pendingBudget, pendingRequests };
  }, [budgets, requests]);

  const handleApprove = (request: BudgetRequest, notes: string) => {
    setRequests(requests.map(r => 
      r.id === request.id 
        ? { 
            ...r, 
            status: 'approved', 
            reviewedBy: currentUserId, 
            reviewedAt: new Date().toISOString(),
            approvalNotes: notes 
          }
        : r
    ));
    
    // Update pending budget to used budget
    setBudgets(budgets.map(b => 
      b.staffId === request.staffId
        ? { ...b, pendingBudget: b.pendingBudget - request.amount, usedBudget: b.usedBudget + request.amount }
        : b
    ));
    
    toast.success('Request approved');
    setShowDetailDrawer(false);
  };

  const handleReject = (request: BudgetRequest, reason: string) => {
    setRequests(requests.map(r => 
      r.id === request.id 
        ? { 
            ...r, 
            status: 'rejected', 
            reviewedBy: currentUserId, 
            reviewedAt: new Date().toISOString(),
            rejectionReason: reason 
          }
        : r
    ));
    
    // Remove from pending budget
    setBudgets(budgets.map(b => 
      b.staffId === request.staffId
        ? { ...b, pendingBudget: b.pendingBudget - request.amount }
        : b
    ));
    
    toast.success('Request rejected');
    setShowDetailDrawer(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      case 'pending_approval': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: BudgetCategory) => {
    switch (category) {
      case 'training': return <GraduationCap size={16} />;
      case 'conference': return <Building size={16} />;
      case 'certification': return <Award size={16} />;
      case 'books': return <BookOpen size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Wallet size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Development Budget
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
          Track training and development budgets with approval workflow
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button variant="outline" size="small" onClick={() => {
          if (myBudget) {
            setEditingBudget(myBudget);
            setShowEditBudgetDrawer(true);
          }
        }}>
          <Pencil size={16} className="mr-1" /> Edit Budget
        </Button>
        <Button variant="default" size="small" onClick={() => setShowRequestDrawer(true)}>
          <Plus size={16} className="mr-1" /> New Request
        </Button>
      </Stack>
    </Stack>

      {/* My Budget Card */}
      {myBudget && viewMode === 'my_budget' && (
        <Card sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box flex={1}>
                <Typography variant="subtitle2" color="primary.main" fontWeight={600} mb={1}>
                  Your {myBudget.fiscalYear} Development Budget
                </Typography>
                <Stack direction="row" spacing={4} mb={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Budget</Typography>
                    <Typography variant="h5" fontWeight={700}>{formatCurrency(myBudget.totalBudget)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Used</Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {formatCurrency(myBudget.usedBudget)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Pending</Typography>
                    <Typography variant="h5" fontWeight={700} color="warning.main">
                      {formatCurrency(myBudget.pendingBudget)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Remaining</Typography>
                    <Typography variant="h5" fontWeight={700} color="info.main">
                      {formatCurrency(myBudget.totalBudget - myBudget.usedBudget - myBudget.pendingBudget)}
                    </Typography>
                  </Box>
                </Stack>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Budget Utilization</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(((myBudget.usedBudget + myBudget.pendingBudget) / myBudget.totalBudget) * 100)}%
                    </Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(((myBudget.usedBudget + myBudget.pendingBudget) / myBudget.totalBudget) * 100, 100)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DollarSign size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h6" fontWeight={700}>{formatCurrency(stats.totalBudget)}</Typography>
                <Typography variant="caption" color="text.secondary">Total Budget</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Check size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h6" fontWeight={700} color="success.main">{formatCurrency(stats.usedBudget)}</Typography>
                <Typography variant="caption" color="text.secondary">Used</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
              <Box>
                <Typography variant="h6" fontWeight={700} color="warning.main">{formatCurrency(stats.pendingBudget)}</Typography>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FileText size={20} style={{ color: 'var(--info)' }} />
              <Box>
                <Typography variant="h6" fontWeight={700}>{stats.pendingRequests}</Typography>
                <Typography variant="caption" color="text.secondary">Awaiting Approval</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack direction="row" spacing={1}>
          <Button variant={viewMode === 'my_budget' ? 'default' : 'outline'} size="small" onClick={() => setViewMode('my_budget')}>
            My Requests
          </Button>
          <Button variant={viewMode === 'pending_approvals' ? 'default' : 'outline'} size="small" onClick={() => setViewMode('pending_approvals')}>
            Pending Approvals
          </Button>
          <Button variant={viewMode === 'team_overview' ? 'default' : 'outline'} size="small" onClick={() => setViewMode('team_overview')}>
            All Requests
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
              <MenuItem value="all">All Categories</MenuItem>
              {Object.entries(budgetCategoryLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              {Object.entries(budgetStatusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Requests List */}
      <Stack spacing={2}>
        {filteredRequests.length === 0 ? (
          <Card>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Wallet size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
              <Typography variant="h6" color="text.secondary" mb={1}>No requests found</Typography>
              <Typography variant="body2" color="text.secondary">
                {viewMode === 'my_budget' 
                  ? 'Submit your first development budget request.'
                  : 'No requests match your current filters.'}
              </Typography>
            </Box>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const staffMember = getStaffMember(request.staffId);

            return (
              <Card 
                key={request.id} 
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                onClick={() => {
                  setSelectedRequest(request);
                  setShowDetailDrawer(true);
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1.5, display: 'flex' }}>
                      {getCategoryIcon(request.category)}
                    </Box>
                    <Box flex={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {request.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {request.description}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.5}>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {formatCurrency(request.amount, request.currency)}
                          </Typography>
                          <Chip 
                            label={budgetStatusLabels[request.status]}
                            size="small"
                            color={getStatusColor(request.status) as any}
                          />
                        </Stack>
                      </Stack>

                      <Stack direction="row" spacing={2} flexWrap="wrap" mt={1}>
                        <Chip 
                          icon={getCategoryIcon(request.category)}
                          label={budgetCategoryLabels[request.category]} 
                          size="small" 
                          variant="outlined" 
                        />
                        {request.eventDate && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Calendar size={12} />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(request.eventDate).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                        {viewMode !== 'my_budget' && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Avatar src={staffMember?.avatar} sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                              {staffMember?.firstName?.[0]}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember?.firstName} {staffMember?.lastName}
                            </Typography>
                          </Stack>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            );
          })
        )}
      </Stack>

      {/* Request Drawer */}
      <BudgetRequestDrawer
        open={showRequestDrawer}
        onClose={() => setShowRequestDrawer(false)}
        currentUserId={currentUserId}
        myBudget={myBudget}
        onSave={(request) => {
          setRequests([...requests, request]);
          if (myBudget) {
            setBudgets(budgets.map(b => 
              b.staffId === currentUserId 
                ? { ...b, pendingBudget: b.pendingBudget + request.amount }
                : b
            ));
          }
          toast.success('Budget request submitted for approval');
        }}
      />

      {/* Detail Drawer */}
      <BudgetRequestDetailDrawer
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        request={selectedRequest}
        staff={staff}
        currentUserId={currentUserId}
        onApprove={handleApprove}
        onReject={handleReject}
        canApprove={viewMode === 'pending_approvals'}
      />

      {/* Edit Budget Drawer */}
      {editingBudget && (
        <EditBudgetDrawer
          open={showEditBudgetDrawer}
          onClose={() => {
            setShowEditBudgetDrawer(false);
            setEditingBudget(null);
          }}
          budget={editingBudget}
          staff={staff}
          onSave={(updatedBudget) => {
            setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
            toast.success('Budget updated successfully');
            setShowEditBudgetDrawer(false);
            setEditingBudget(null);
          }}
        />
      )}
    </Box>
  );
}

// Sub-components
interface BudgetRequestDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  myBudget?: DevelopmentBudget;
  onSave: (request: BudgetRequest) => void;
}

function BudgetRequestDrawer({ open, onClose, currentUserId, myBudget, onSave }: BudgetRequestDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('training');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [justification, setJustification] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');

  const remainingBudget = myBudget 
    ? myBudget.totalBudget - myBudget.usedBudget - myBudget.pendingBudget 
    : 0;

  const handleSave = () => {
    if (!title.trim() || !description.trim() || !amount || !justification.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountNum > remainingBudget) {
      toast.error('Request exceeds remaining budget');
      return;
    }

    const request: BudgetRequest = {
      id: `req-${Date.now()}`,
      staffId: currentUserId,
      title: title.trim(),
      description: description.trim(),
      category,
      amount: amountNum,
      currency: 'AUD',
      vendor: vendor.trim() || undefined,
      eventDate: eventDate || undefined,
      eventLocation: eventLocation.trim() || undefined,
      justification: justification.trim(),
      expectedOutcomes: expectedOutcomes.split('\n').filter(o => o.trim()),
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
    };

    onSave(request);
    
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('training');
    setAmount('');
    setVendor('');
    setEventDate('');
    setEventLocation('');
    setJustification('');
    setExpectedOutcomes('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus size={20} className="text-primary" />
            New Budget Request
          </SheetTitle>
          <SheetDescription>
            Submit a request for training, conference, or development funding
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {myBudget && (
            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <Typography variant="caption" color="info.main" fontWeight={600}>
                REMAINING BUDGET
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                ${remainingBudget.toLocaleString()} AUD
              </Typography>
            </Box>
          )}

          <TextField
            label="Request Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            placeholder="e.g., AWS Certification Course"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
            placeholder="Brief description of the development opportunity"
          />

          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value as BudgetCategory)}>
              {Object.entries(budgetCategoryLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Amount (AUD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0 }}
          />

          <TextField
            label="Vendor/Provider"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            fullWidth
            placeholder="e.g., Coursera, AWS Training"
          />

          <TextField
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Location"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            fullWidth
            placeholder="e.g., Online, Sydney CBD"
          />

          <TextField
            label="Business Justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Explain how this development will benefit your role and the organisation..."
          />

          <TextField
            label="Expected Outcomes"
            value={expectedOutcomes}
            onChange={(e) => setExpectedOutcomes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="One outcome per line..."
            helperText="List the skills or certifications you expect to gain"
          />
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Submit Request</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface BudgetRequestDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  request: BudgetRequest | null;
  staff: StaffMember[];
  currentUserId: string;
  onApprove: (request: BudgetRequest, notes: string) => void;
  onReject: (request: BudgetRequest, reason: string) => void;
  canApprove: boolean;
}

function BudgetRequestDetailDrawer({ open, onClose, request, staff, currentUserId, onApprove, onReject, canApprove }: BudgetRequestDetailDrawerProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (!request) return null;

  const staffMember = staff.find(s => s.id === request.staffId);
  const reviewer = request.reviewedBy ? staff.find(s => s.id === request.reviewedBy) : null;

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
  };

  const handleApprove = () => {
    onApprove(request, approvalNotes);
    setApprovalNotes('');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onReject(request, rejectionReason);
    setRejectionReason('');
    setShowReject(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Budget Request Details</SheetTitle>
          <SheetDescription>
            Review development budget request
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Amount & Status */}
          <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {formatCurrency(request.amount, request.currency)}
            </Typography>
            <Chip 
              label={budgetStatusLabels[request.status]}
              size="small"
              color={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Requester */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              REQUESTED BY
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={staffMember?.avatar} sx={{ width: 40, height: 40 }}>
                {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {staffMember?.firstName} {staffMember?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">{staffMember?.position}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Details */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>{request.title}</Typography>
            <Typography variant="body2" color="text.secondary">{request.description}</Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Category</Typography>
              <Typography variant="body2" fontWeight={500}>{budgetCategoryLabels[request.category]}</Typography>
            </Box>
            {request.vendor && (
              <Box>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography variant="body2" fontWeight={500}>{request.vendor}</Typography>
              </Box>
            )}
            {request.eventDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2" fontWeight={500}>{new Date(request.eventDate).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              BUSINESS JUSTIFICATION
            </Typography>
            <Typography variant="body2">{request.justification}</Typography>
          </Box>

          {request.expectedOutcomes.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                EXPECTED OUTCOMES
              </Typography>
              <Stack spacing={0.5}>
                {request.expectedOutcomes.map((outcome, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1}>
                    <Check size={14} style={{ color: 'var(--success)' }} />
                    <Typography variant="body2">{outcome}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* Review Info */}
          {reviewer && (
            <Box sx={{ p: 2, bgcolor: request.status === 'approved' ? 'success.50' : 'error.50', borderRadius: 1 }}>
              <Typography variant="caption" color={request.status === 'approved' ? 'success.main' : 'error.main'} fontWeight={600}>
                {request.status === 'approved' ? 'APPROVED BY' : 'REJECTED BY'}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {reviewer.firstName} {reviewer.lastName} on {new Date(request.reviewedAt!).toLocaleDateString()}
              </Typography>
              {request.approvalNotes && (
                <Typography variant="body2" mt={1}>{request.approvalNotes}</Typography>
              )}
              {request.rejectionReason && (
                <Typography variant="body2" mt={1}>{request.rejectionReason}</Typography>
              )}
            </Box>
          )}

          {/* Approval Actions */}
          {canApprove && request.status === 'pending_approval' && !showReject && (
            <Box>
              <TextField
                label="Approval Notes (optional)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                multiline
                rows={2}
                fullWidth
                placeholder="Add any notes for the requester..."
              />
            </Box>
          )}

          {showReject && (
            <Box sx={{ p: 2, border: 1, borderColor: 'error.300', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error.main" mb={1}>Reject Request</Typography>
              <TextField
                label="Reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                multiline
                rows={2}
                fullWidth
                required
              />
              <Stack direction="row" spacing={1} mt={2}>
                <Button variant="outline" size="small" onClick={() => setShowReject(false)}>Cancel</Button>
                <Button variant="destructive" size="small" onClick={handleReject}>Confirm Reject</Button>
              </Stack>
            </Box>
          )}
        </Box>

        <SheetFooter>
          {canApprove && request.status === 'pending_approval' && !showReject ? (
            <>
              <Button variant="outline" onClick={() => setShowReject(true)}>
                <ThumbsDown size={14} className="mr-1" /> Reject
              </Button>
              <Button variant="default" onClick={handleApprove}>
                <ThumbsUp size={14} className="mr-1" /> Approve
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Edit Budget Drawer
interface EditBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  budget: DevelopmentBudget;
  staff: StaffMember[];
  onSave: (budget: DevelopmentBudget) => void;
}

function EditBudgetDrawer({ open, onClose, budget, staff, onSave }: EditBudgetDrawerProps) {
  const [totalBudget, setTotalBudget] = useState(budget.totalBudget.toString());
  const [fiscalYear, setFiscalYear] = useState(budget.fiscalYear.toString());

  const staffMember = staff.find(s => s.id === budget.staffId);

  const handleSave = () => {
    const totalNum = parseFloat(totalBudget);
    const yearNum = parseInt(fiscalYear);
    if (isNaN(totalNum) || totalNum <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    if (isNaN(yearNum)) {
      toast.error('Please enter a valid fiscal year');
      return;
    }

    onSave({
      ...budget,
      totalBudget: totalNum,
      fiscalYear: yearNum,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pencil size={20} className="text-primary" />
            Edit Development Budget
          </SheetTitle>
          <SheetDescription>
            Modify budget allocation for this employee
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Staff Info */}
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={staffMember?.avatar} sx={{ width: 40, height: 40 }}>
                {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {staffMember?.firstName} {staffMember?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">{staffMember?.position}</Typography>
              </Box>
            </Stack>
          </Box>

          <TextField
            label="Fiscal Year"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            fullWidth
            placeholder="2024-2025"
          />

          <TextField
            label="Total Budget (AUD)"
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            fullWidth
            inputProps={{ min: 0 }}
          />

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Current Allocation
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Used:</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  ${budget.usedBudget.toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Pending:</Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  ${budget.pendingBudget.toLocaleString()}
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Remaining:</Typography>
                <Typography variant="body2" fontWeight={600} color="info.main">
                  ${(parseFloat(totalBudget || '0') - budget.usedBudget - budget.pendingBudget).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default DevelopmentBudgetTracker;
