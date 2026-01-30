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
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import {
  Users,
  UserPlus,
  Check,
  X,
  Clock,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  PeerNomination,
  ReviewCycle,
  nominationStatusLabels,
} from '@/types/performanceAdvanced';
import {
  mockPeerNominations as initialNominations,
  mockReviewCycles,
} from '@/data/mockPerformanceAdvancedData';
import { toast } from 'sonner';

interface PeerNominationsProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function PeerNominationsPanel({ staff, currentUserId }: PeerNominationsProps) {
  const [nominations, setNominations] = useState<PeerNomination[]>(initialNominations);
  const [showNominateDrawer, setShowNominateDrawer] = useState(false);
  const [showApprovalDrawer, setShowApprovalDrawer] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState<PeerNomination | null>(null);
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my_nominations' | 'pending_approval' | 'all'>('my_nominations');

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);
  const activeCycle = mockReviewCycles.find(c => c.status === 'nominations_open');

  const myNominations = nominations.filter(n => n.nominatorId === currentUserId);
  const pendingApprovals = nominations.filter(n => n.status === 'pending');

  const filteredNominations = useMemo(() => {
    let result = nominations;
    if (viewMode === 'my_nominations') {
      result = result.filter(n => n.nominatorId === currentUserId);
    } else if (viewMode === 'pending_approval') {
      result = result.filter(n => n.status === 'pending');
    }
    if (filterCycle !== 'all') {
      result = result.filter(n => n.reviewCycleId === filterCycle);
    }
    return result;
  }, [nominations, viewMode, filterCycle, currentUserId]);

  const handleApprove = (nomination: PeerNomination) => {
    setNominations(nominations.map(n => 
      n.id === nomination.id 
        ? { ...n, status: 'approved', approvedBy: currentUserId, approvedAt: new Date().toISOString() }
        : n
    ));
    toast.success('Nomination approved');
    setShowApprovalDrawer(false);
  };

  const handleReject = (nomination: PeerNomination, reason: string) => {
    setNominations(nominations.map(n => 
      n.id === nomination.id 
        ? { ...n, status: 'rejected', rejectionReason: reason }
        : n
    ));
    toast.success('Nomination rejected');
    setShowApprovalDrawer(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      default: return 'warning';
    }
  };

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'peer': return 'Direct Peer';
      case 'cross_functional': return 'Cross-Functional';
      case 'project_collaborator': return 'Project Collaborator';
      case 'mentor': return 'Mentor/Mentee';
      default: return rel;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Users size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Peer Nominations
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Nominate peers for 360° feedback reviews
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {activeCycle && (
            <Button variant="default" size="small" onClick={() => setShowNominateDrawer(true)}>
              <UserPlus size={16} className="mr-1" /> Nominate Peer
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Active Cycle Banner */}
      {activeCycle && (
        <Card sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                  {activeCycle.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Nomination deadline: {new Date(activeCycle.nominationDeadline).toLocaleDateString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={`${myNominations.filter(n => n.reviewCycleId === activeCycle.id).length}/${activeCycle.maxNominations} nominations`}
                  size="small"
                  color="primary"
                />
              </Stack>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Send size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{myNominations.length}</Typography>
                <Typography variant="caption" color="text.secondary">My Nominations</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="warning.main">{pendingApprovals.length}</Typography>
                <Typography variant="caption" color="text.secondary">Pending Approval</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Check size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {nominations.filter(n => n.status === 'approved').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Approved</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <MessageSquare size={20} style={{ color: 'var(--info)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {nominations.filter(n => n.status === 'completed').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Feedback Completed</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === 'my_nominations' ? 'default' : 'outline'}
            size="small"
            onClick={() => setViewMode('my_nominations')}
          >
            My Nominations
          </Button>
          <Button
            variant={viewMode === 'pending_approval' ? 'default' : 'outline'}
            size="small"
            onClick={() => setViewMode('pending_approval')}
          >
            Pending Approval
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="small"
            onClick={() => setViewMode('all')}
          >
            All
          </Button>
        </Stack>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Review Cycle</InputLabel>
          <Select value={filterCycle} label="Review Cycle" onChange={(e) => setFilterCycle(e.target.value)}>
            <MenuItem value="all">All Cycles</MenuItem>
            {mockReviewCycles.map(cycle => (
              <MenuItem key={cycle.id} value={cycle.id}>{cycle.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Nominations List */}
      <Stack spacing={2}>
        {filteredNominations.length === 0 ? (
          <Card>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
              <Typography variant="h6" color="text.secondary" mb={1}>No nominations found</Typography>
              <Typography variant="body2" color="text.secondary">
                {viewMode === 'my_nominations' 
                  ? 'You haven\'t nominated any peers yet. Start by clicking "Nominate Peer".'
                  : 'No nominations match your current filters.'}
              </Typography>
            </Box>
          </Card>
        ) : (
          filteredNominations.map((nomination) => {
            const nominator = getStaffMember(nomination.nominatorId);
            const nominee = getStaffMember(nomination.nomineeId);
            const cycle = mockReviewCycles.find(c => c.id === nomination.reviewCycleId);

            return (
              <Card 
                key={nomination.id} 
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                onClick={() => {
                  setSelectedNomination(nomination);
                  setShowApprovalDrawer(true);
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Avatar src={nominee?.avatar} sx={{ width: 48, height: 48 }}>
                      {nominee?.firstName?.[0]}{nominee?.lastName?.[0]}
                    </Avatar>
                    <Box flex={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {nominee?.firstName} {nominee?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {nominee?.position}
                          </Typography>
                        </Box>
                        <Chip 
                          label={nominationStatusLabels[nomination.status]}
                          size="small"
                          color={getStatusColor(nomination.status) as any}
                        />
                      </Stack>
                      
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          "{nomination.reason}"
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Chip label={getRelationshipLabel(nomination.relationship)} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            Nominated by: {nominator?.firstName} {nominator?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cycle: {cycle?.name}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            );
          })
        )}
      </Stack>

      {/* Nominate Drawer */}
      <NominatePeerDrawer
        open={showNominateDrawer}
        onClose={() => setShowNominateDrawer(false)}
        staff={staff}
        currentUserId={currentUserId}
        activeCycle={activeCycle}
        existingNominations={myNominations}
        onSave={(nomination) => {
          setNominations([...nominations, nomination]);
          toast.success('Peer nominated successfully');
        }}
      />

      {/* Approval Drawer */}
      <NominationDetailDrawer
        open={showApprovalDrawer}
        onClose={() => setShowApprovalDrawer(false)}
        nomination={selectedNomination}
        staff={staff}
        onApprove={handleApprove}
        onReject={handleReject}
        canApprove={viewMode === 'pending_approval'}
      />
    </Box>
  );
}

// Sub-components
interface NominatePeerDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  currentUserId: string;
  activeCycle?: ReviewCycle;
  existingNominations: PeerNomination[];
  onSave: (nomination: PeerNomination) => void;
}

function NominatePeerDrawer({ open, onClose, staff, currentUserId, activeCycle, existingNominations, onSave }: NominatePeerDrawerProps) {
  const [nomineeId, setNomineeId] = useState('');
  const [relationship, setRelationship] = useState<PeerNomination['relationship']>('peer');
  const [reason, setReason] = useState('');

  const availableStaff = staff.filter(s => 
    s.id !== currentUserId && 
    !existingNominations.some(n => n.nomineeId === s.id && n.reviewCycleId === activeCycle?.id)
  );

  const handleSave = () => {
    if (!nomineeId || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!activeCycle) {
      toast.error('No active review cycle');
      return;
    }

    const nomination: PeerNomination = {
      id: `nom-${Date.now()}`,
      nominatorId: currentUserId,
      nomineeId,
      reviewCycleId: activeCycle.id,
      reason: reason.trim(),
      relationship,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSave(nomination);
    setNomineeId('');
    setRelationship('peer');
    setReason('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            Nominate Peer for Feedback
          </SheetTitle>
          <SheetDescription>
            Select a colleague to provide feedback for in the current review cycle
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {activeCycle && (
            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <Typography variant="caption" color="info.main" fontWeight={600}>
                REVIEW CYCLE
              </Typography>
              <Typography variant="body2">{activeCycle.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Max nominations: {activeCycle.maxNominations}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth required>
            <InputLabel>Select Colleague</InputLabel>
            <Select value={nomineeId} label="Select Colleague" onChange={(e) => setNomineeId(e.target.value)}>
              {availableStaff.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} - {s.position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Relationship</InputLabel>
            <Select value={relationship} label="Relationship" onChange={(e) => setRelationship(e.target.value as any)}>
              <MenuItem value="peer">Direct Peer (same team)</MenuItem>
              <MenuItem value="cross_functional">Cross-Functional Partner</MenuItem>
              <MenuItem value="project_collaborator">Project Collaborator</MenuItem>
              <MenuItem value="mentor">Mentor/Mentee</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Why are you nominating this person?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            placeholder="Describe your working relationship and why their feedback would be valuable..."
            helperText="This helps reviewers understand the context of your collaboration"
          />
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Submit Nomination</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface NominationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  nomination: PeerNomination | null;
  staff: StaffMember[];
  onApprove: (nomination: PeerNomination) => void;
  onReject: (nomination: PeerNomination, reason: string) => void;
  canApprove: boolean;
}

function NominationDetailDrawer({ open, onClose, nomination, staff, onApprove, onReject, canApprove }: NominationDetailDrawerProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (!nomination) return null;

  const nominator = staff.find(s => s.id === nomination.nominatorId);
  const nominee = staff.find(s => s.id === nomination.nomineeId);
  const cycle = mockReviewCycles.find(c => c.id === nomination.reviewCycleId);

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onReject(nomination, rejectionReason);
    setRejectionReason('');
    setShowReject(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nomination Details</SheetTitle>
          <SheetDescription>
            Review peer nomination for 360° feedback
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Nominee */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              NOMINATED PEER
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={nominee?.avatar} sx={{ width: 48, height: 48 }}>
                {nominee?.firstName?.[0]}{nominee?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {nominee?.firstName} {nominee?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">{nominee?.position}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* Nominator */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              NOMINATED BY
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={nominator?.avatar} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                {nominator?.firstName?.[0]}{nominator?.lastName?.[0]}
              </Avatar>
              <Typography variant="body2">
                {nominator?.firstName} {nominator?.lastName}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Details */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              RELATIONSHIP
            </Typography>
            <Chip 
              label={nomination.relationship.replace('_', ' ')} 
              size="small" 
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              REASON FOR NOMINATION
            </Typography>
            <Typography variant="body2">{nomination.reason}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              REVIEW CYCLE
            </Typography>
            <Typography variant="body2">{cycle?.name}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
              STATUS
            </Typography>
            <Chip 
              label={nominationStatusLabels[nomination.status]}
              size="small"
              color={nomination.status === 'approved' ? 'success' : nomination.status === 'rejected' ? 'error' : 'warning'}
            />
          </Box>

          {nomination.rejectionReason && (
            <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
              <Typography variant="caption" color="error.main" fontWeight={600}>
                REJECTION REASON
              </Typography>
              <Typography variant="body2">{nomination.rejectionReason}</Typography>
            </Box>
          )}

          {/* Rejection Form */}
          {showReject && (
            <Box sx={{ p: 2, border: 1, borderColor: 'error.300', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error.main" mb={1}>Reject Nomination</Typography>
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
          {canApprove && nomination.status === 'pending' && !showReject ? (
            <>
              <Button variant="outline" onClick={() => setShowReject(true)}>
                <ThumbsDown size={14} className="mr-1" /> Reject
              </Button>
              <Button variant="default" onClick={() => onApprove(nomination)}>
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

export default PeerNominationsPanel;
