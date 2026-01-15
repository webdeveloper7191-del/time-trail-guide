import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Avatar,
  Paper,
  Divider,
  Button,
  Alert,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Building2,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  RefreshCw,
  ArrowUpCircle,
  Bell,
  User,
  Star,
  MapPin,
  DollarSign,
  Check,
  X,
  History,
  Send,
  Eye,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  BroadcastTrackingRecord,
  AgencyResponse,
  CandidateSubmission,
  EscalationEvent,
  calculateTimeRemaining,
  generateMockBroadcastRecords,
} from '@/lib/agencyEscalationService';
import { toast } from 'sonner';

interface PlacementForRating {
  id: string;
  agencyId: string;
  agencyName: string;
  workerId: string;
  workerName: string;
  centreId: string;
  centreName: string;
  shiftDate: string;
  shiftTime?: string;
  role?: string;
}

interface AgencyResponseTrackerProps {
  open: boolean;
  onClose: () => void;
  broadcastId?: string;
  onPlacementAccepted?: (placement: PlacementForRating) => void;
}

export function AgencyResponseTracker({ open, onClose, broadcastId, onPlacementAccepted }: AgencyResponseTrackerProps) {
  const [records, setRecords] = useState<BroadcastTrackingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BroadcastTrackingRecord | null>(null);
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [liveUpdates, setLiveUpdates] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load mock data
  useEffect(() => {
    if (open) {
      setRecords(generateMockBroadcastRecords());
      setLastRefresh(new Date());
      // Simulate WebSocket connection
      setTimeout(() => setIsConnected(true), 500);
    } else {
      setIsConnected(false);
    }
  }, [open]);

  // Simulate real-time WebSocket updates for new candidates
  useEffect(() => {
    if (!open || !autoRefresh || !isConnected) return;
    
    // Simulate incoming candidate submissions every 5-15 seconds
    const simulateNewCandidate = () => {
      const pendingRecords = records.filter(r => r.status === 'pending');
      if (pendingRecords.length === 0) return;
      
      const randomRecord = pendingRecords[Math.floor(Math.random() * pendingRecords.length)];
      const agencies = ['Premier Care Staff', 'Metro Health Agency', 'Quality Nursing Services', 'Elite Healthcare Staffing'];
      const firstNames = ['Emma', 'James', 'Olivia', 'William', 'Sophia', 'Benjamin', 'Ava', 'Lucas'];
      const lastNames = ['Thompson', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Brown', 'Johnson', 'Lee'];
      
      const newCandidate: CandidateSubmission = {
        id: `cand-live-${Date.now()}`,
        candidateId: `staff-${Math.random().toString(36).substr(2, 9)}`,
        candidateName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        matchScore: Math.floor(Math.random() * 20) + 80,
        skillMatch: Math.floor(Math.random() * 15) + 85,
        proximityMatch: Math.floor(Math.random() * 30) + 70,
        reliabilityScore: Math.floor(Math.random() * 15) + 85,
        payRate: 35 + Math.floor(Math.random() * 15),
        responseTimeMinutes: Math.floor(Math.random() * 10) + 1,
      };
      
      const agencyName = agencies[Math.floor(Math.random() * agencies.length)];
      
      setRecords(prev => prev.map(r => {
        if (r.id !== randomRecord.id) return r;
        
        // Find or create agency response
        const existingAgency = r.responses.find(res => res.agencyName === agencyName);
        if (existingAgency) {
          return {
            ...r,
            totalCandidatesSubmitted: r.totalCandidatesSubmitted + 1,
            responses: r.responses.map(res => 
              res.agencyName === agencyName 
                ? { 
                    ...res, 
                    candidatesSubmitted: res.candidatesSubmitted + 1,
                    candidates: [...res.candidates, newCandidate]
                  }
                : res
            ),
          };
        } else {
          const newAgencyResponse: AgencyResponse = {
            agencyId: `agency-live-${Date.now()}`,
            agencyName,
            respondedAt: new Date().toISOString(),
            status: 'submitted',
            candidatesSubmitted: 1,
            candidates: [newCandidate],
          };
          return {
            ...r,
            agenciesResponded: r.agenciesResponded + 1,
            totalCandidatesSubmitted: r.totalCandidatesSubmitted + 1,
            responses: [...r.responses, newAgencyResponse],
          };
        }
      }));
      
      // Show live update notification
      const updateMsg = `${newCandidate.candidateName} submitted by ${agencyName}`;
      setLiveUpdates(prev => [updateMsg, ...prev.slice(0, 4)]);
      toast.info(`🔴 Live: ${updateMsg}`, { duration: 3000 });
    };
    
    // Random interval between 5-15 seconds
    const scheduleNextUpdate = () => {
      const delay = 5000 + Math.random() * 10000;
      return setTimeout(() => {
        simulateNewCandidate();
        timeoutRef.current = scheduleNextUpdate();
      }, delay);
    };
    
    const timeoutRef = { current: scheduleNextUpdate() };
    
    return () => clearTimeout(timeoutRef.current);
  }, [open, autoRefresh, isConnected, records]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!open || !autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [open, autoRefresh]);

  // Select record if broadcastId provided
  useEffect(() => {
    if (broadcastId && records.length > 0) {
      const record = records.find(r => r.id === broadcastId);
      if (record) setSelectedRecord(record);
    }
  }, [broadcastId, records]);

  const toggleAgency = (agencyId: string) => {
    setExpandedAgencies(prev => {
      const next = new Set(prev);
      if (next.has(agencyId)) {
        next.delete(agencyId);
      } else {
        next.add(agencyId);
      }
      return next;
    });
  };

  const handleAcceptCandidate = (record: BroadcastTrackingRecord, submission: CandidateSubmission) => {
    const agency = record.responses.find(res => res.candidates.some(c => c.id === submission.id));
    const agencyId = agency?.agencyId || '';
    const agencyName = agency?.agencyName || '';

    // Update the record to mark as filled
    setRecords(prev => prev.map(r => 
      r.id === record.id 
        ? { 
            ...r, 
            status: 'filled' as const, 
            filledAt: new Date().toISOString(),
            filledBy: {
              agencyId,
              agencyName,
              candidateId: submission.candidateId,
              candidateName: submission.candidateName,
            }
          }
        : r
    ));
    
    toast.success(`${submission.candidateName} assigned to ${record.shiftTime} shift. Roster updated.`);

    // Trigger rating modal callback
    if (onPlacementAccepted) {
      onPlacementAccepted({
        id: `placement-${Date.now()}`,
        agencyId,
        agencyName,
        workerId: submission.candidateId,
        workerName: submission.candidateName,
        centreId: record.centreId,
        centreName: record.centreName,
        shiftDate: record.shiftDate,
        shiftTime: record.shiftTime,
        role: record.role,
      });
    }
  };

  const handleRejectCandidate = (submission: CandidateSubmission) => {
    toast.info(`${submission.candidateName} rejected`);
  };

  const handleManualEscalate = (record: BroadcastTrackingRecord) => {
    toast.success(`Escalated to tier ${record.currentTier + 1}`);
  };

  const getStatusColor = (status: BroadcastTrackingRecord['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'escalated': return 'info';
      case 'filled': return 'success';
      case 'expired': return 'error';
      case 'cancelled': return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'standard': return 'default';
      case 'urgent': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const renderCandidateCard = (
    submission: CandidateSubmission,
    record: BroadcastTrackingRecord
  ) => (
    <Paper
      key={submission.id}
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: submission.status === 'accepted' ? 'success.main' : 'divider',
        borderRadius: 1.5,
        bgcolor: submission.status === 'accepted' ? 'success.50' : 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {submission.candidateName.split(' ').map(n => n[0]).join('')}
        </Avatar>
        
        <Box flex={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight={600}>
              {submission.candidateName}
            </Typography>
            <Chip
              size="small"
              label={`${submission.matchScore}% match`}
              color={submission.matchScore >= 90 ? 'success' : submission.matchScore >= 80 ? 'warning' : 'default'}
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>
          
          <Stack direction="row" spacing={2} mt={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star size={10} /> Skills: {submission.skillMatch}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MapPin size={10} /> Proximity: {submission.proximityMatch}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp size={10} /> Reliability: {submission.reliabilityScore}%
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<DollarSign size={12} />}
                label={`$${submission.payRate}/hr`}
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
              <Typography variant="caption" color="text.secondary">
                Response: {submission.responseTimeMinutes}m
              </Typography>
            </Stack>
            
            {submission.status === 'pending' && record.status === 'pending' && (
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleAcceptCandidate(record, submission)}
                  sx={{ bgcolor: 'success.50' }}
                >
                  <Check size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRejectCandidate(submission)}
                  sx={{ bgcolor: 'error.50' }}
                >
                  <X size={16} />
                </IconButton>
              </Stack>
            )}
            
            {submission.status === 'accepted' && (
              <Chip size="small" label="Accepted" color="success" icon={<CheckCircle2 size={12} />} />
            )}
            {submission.status === 'rejected' && (
              <Chip size="small" label="Rejected" color="error" variant="outlined" />
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );

  const renderAgencyResponse = (response: AgencyResponse, record: BroadcastTrackingRecord) => {
    const isExpanded = expandedAgencies.has(response.agencyId);
    
    return (
      <Paper
        key={response.agencyId}
        elevation={1}
        sx={{ mb: 1.5, overflow: 'hidden' }}
      >
        <Box
          sx={{
            p: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
          onClick={() => toggleAgency(response.agencyId)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Building2 size={18} className="text-primary" />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {response.agencyName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Responded {formatDistanceToNow(new Date(response.respondedAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Badge badgeContent={response.candidatesSubmitted} color="primary">
                <Users size={18} />
              </Badge>
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Stack>
          </Stack>
        </Box>
        
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={1.5}>
              {response.candidates.map(candidate => renderCandidateCard(candidate, record))}
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    );
  };

  const renderEscalationHistory = (events: EscalationEvent[]) => (
    <Stack spacing={1}>
      {events.map((event, index) => {
        const IconComponent = 
          event.type === 'initial_broadcast' ? Send :
          event.type === 'tier_escalate' ? ArrowUpCircle :
          event.type === 'urgency_increase' ? AlertTriangle :
          event.type === 'filled' ? CheckCircle2 :
          event.type === 'expired' ? XCircle : History;
        
        const color = 
          event.type === 'filled' ? 'success.main' :
          event.type === 'expired' ? 'error.main' :
          event.type === 'urgency_increase' ? 'warning.main' :
          'primary.main';
        
        return (
          <Stack key={event.id} direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComponent size={14} style={{ color }} />
            </Box>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={500}>
                {event.reason}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(event.timestamp), 'MMM d, HH:mm')}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );

  const renderBroadcastCard = (record: BroadcastTrackingRecord) => {
    const timeRemaining = calculateTimeRemaining(record.responseDeadline);
    const isSelected = selectedRecord?.id === record.id;
    
    return (
      <Paper
        key={record.id}
        elevation={isSelected ? 3 : 1}
        sx={{
          p: 2,
          mb: 1.5,
          cursor: 'pointer',
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.light',
            transform: 'translateY(-1px)',
          },
        }}
        onClick={() => setSelectedRecord(record)}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                {record.shiftTime}
              </Typography>
              <Chip
                size="small"
                label={record.urgency}
                color={getUrgencyColor(record.urgency) as any}
                sx={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
              />
              <Chip
                size="small"
                label={record.status}
                color={getStatusColor(record.status) as any}
                variant="outlined"
                sx={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {record.centreName} • {record.roomName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(record.shiftDate), 'EEE, d MMM')}
            </Typography>
          </Box>
          
          <Stack alignItems="flex-end" spacing={0.5}>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                icon={<Building2 size={12} />}
                label={`${record.agenciesResponded}/${record.agenciesNotified}`}
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
              <Chip
                size="small"
                icon={<Users size={12} />}
                label={record.totalCandidatesSubmitted}
                color="primary"
                sx={{ fontSize: '0.65rem' }}
              />
            </Stack>
            <Typography
              variant="caption"
              color={timeRemaining.isOverdue ? 'error' : 'text.secondary'}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Timer size={10} />
              {timeRemaining.formatted}
            </Typography>
          </Stack>
        </Stack>
        
        {record.status === 'pending' && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={(record.agenciesResponded / record.agenciesNotified) * 100}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </Paper>
    );
  };

  const renderDetailView = () => {
    if (!selectedRecord) return null;
    
    const timeRemaining = calculateTimeRemaining(selectedRecord.responseDeadline);
    const allCandidates = selectedRecord.responses.flatMap(r => r.candidates);
    const sortedCandidates = [...allCandidates].sort((a, b) => b.matchScore - a.matchScore);
    
    return (
      <Box>
        {/* Header Stats */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {selectedRecord.shiftTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRecord.centreName} • {selectedRecord.roomName}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={selectedRecord.urgency}
                color={getUrgencyColor(selectedRecord.urgency) as any}
                sx={{ textTransform: 'capitalize' }}
              />
              <Chip
                label={selectedRecord.status}
                color={getStatusColor(selectedRecord.status) as any}
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>
          </Stack>
          
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Agencies</Typography>
              <Typography variant="h6" fontWeight={600}>
                {selectedRecord.agenciesResponded}/{selectedRecord.agenciesNotified}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Candidates</Typography>
              <Typography variant="h6" fontWeight={600}>
                {selectedRecord.totalCandidatesSubmitted}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Current Tier</Typography>
              <Typography variant="h6" fontWeight={600}>
                {selectedRecord.currentTier}/{selectedRecord.maxTiers}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Time Remaining</Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                color={timeRemaining.isOverdue ? 'error.main' : 'inherit'}
              >
                {timeRemaining.formatted}
              </Typography>
            </Box>
          </Stack>
        </Paper>
        
        {/* Filled notification */}
        {selectedRecord.status === 'filled' && selectedRecord.filledBy && (
          <Alert
            severity="success"
            icon={<CheckCircle2 size={20} />}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">Shift Filled!</Typography>
            <Typography variant="body2">
              {selectedRecord.filledBy.candidateName} from {selectedRecord.filledBy.agencyName}
            </Typography>
          </Alert>
        )}
        
        {/* Manual escalation button */}
        {selectedRecord.status === 'pending' && selectedRecord.currentTier < selectedRecord.maxTiers && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                color="warning"
                variant="contained"
                startIcon={<ArrowUpCircle size={14} />}
                onClick={() => handleManualEscalate(selectedRecord)}
              >
                Escalate Now
              </Button>
            }
          >
            <Typography variant="body2">
              Auto-escalate in {formatDistanceToNow(new Date(selectedRecord.autoEscalateAt))}
            </Typography>
          </Alert>
        )}
        
        {/* Top candidates quick view */}
        {sortedCandidates.length > 0 && selectedRecord.status === 'pending' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star size={16} /> Top Candidates
            </Typography>
            <Stack spacing={1}>
              {sortedCandidates.slice(0, 3).map(candidate => 
                renderCandidateCard(candidate, selectedRecord)
              )}
            </Stack>
          </Box>
        )}
        
        {/* Agency Responses */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Building2 size={16} /> Agency Responses ({selectedRecord.responses.length})
          </Typography>
          {selectedRecord.responses.length === 0 ? (
            <Alert severity="info">
              Waiting for agency responses...
            </Alert>
          ) : (
            selectedRecord.responses.map(response => 
              renderAgencyResponse(response, selectedRecord)
            )
          )}
        </Box>
        
        {/* Escalation History */}
        <Box>
          <Button
            fullWidth
            variant="text"
            onClick={() => setShowHistory(!showHistory)}
            endIcon={showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            sx={{ justifyContent: 'space-between', mb: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <History size={16} />
              <Typography variant="subtitle2">Escalation History</Typography>
            </Stack>
          </Button>
          <Collapse in={showHistory}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              {renderEscalationHistory(selectedRecord.escalationHistory)}
            </Paper>
          </Collapse>
        </Box>
      </Box>
    );
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Agency Response Tracker"
      description="Real-time tracking of shift broadcasts and candidate submissions"
      icon={Eye}
      size="3xl"
      headerActions={
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Live Connection Indicator */}
          <Chip
            size="small"
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConnected ? 'success.main' : 'grey.400',
                  animation: isConnected ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            }
            label={isConnected ? 'Live' : 'Connecting...'}
            color={isConnected ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            {format(lastRefresh, 'HH:mm:ss')}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setRecords(generateMockBroadcastRecords());
              setLastRefresh(new Date());
              toast.success('Refreshed');
            }}
          >
            <RefreshCw size={16} />
          </IconButton>
        </Stack>
      }
      showFooter={false}
    >
      <Stack direction="row" spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Left: Broadcast List */}
        <Box sx={{ width: 320, flexShrink: 0, overflow: 'auto' }}>
          {/* Live Updates Feed */}
          {liveUpdates.length > 0 && (
            <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
              <Typography variant="caption" fontWeight={600} color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Zap size={12} /> Live Updates
              </Typography>
              <Stack spacing={0.5}>
                {liveUpdates.slice(0, 3).map((update, idx) => (
                  <Typography key={idx} variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    • {update}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          )}
          
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Send size={16} /> Active Broadcasts ({records.length})
          </Typography>
          {records.map(record => renderBroadcastCard(record))}
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Right: Detail View */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {selectedRecord ? (
            renderDetailView()
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                Select a broadcast to view details
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </PrimaryOffCanvas>
  );
}

export default AgencyResponseTracker;
