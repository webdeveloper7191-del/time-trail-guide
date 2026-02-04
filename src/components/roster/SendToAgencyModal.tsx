import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Box,
  Typography,
  FormControlLabel,
  Divider,
  Alert,
  Checkbox,
  FormGroup,
  Radio,
  RadioGroup,
  Slider,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Paper,
  Collapse,
  Avatar,
} from '@mui/material';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { 
  Building2, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  MapPin,
  Shield,
  Zap,
  Timer,
  Send,
  Plus,
  Settings,
  Eye,
  History,
  Award,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  Target,
  Layers,
  Filter,
  ArrowRight,
  Info,
  UserCheck,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { OpenShift, Shift, StaffMember } from '@/types/roster';
import { Agency, ShiftUrgency, FillMode } from '@/types/agency';
import { format, parseISO, addHours, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  PreviousWorkerRecord, 
  generateMockPreviousWorkers 
} from '@/lib/agencyNotificationService';
import {
  getCentreAgencyPreferences,
  isAgencyBlacklisted,
  isAgencyPreferred,
  getPreferredAgencies,
  sortAgenciesByPreference,
  CentreAgencyPreference,
} from '@/lib/centreAgencyPreferences';

// ============ TYPES ============

export type BroadcastType = 'open_shift' | 'absent_cover' | 'emergency' | 'recurring';
export type AcceptanceMode = 'first_response' | 'best_match' | 'manual_review' | 'tiered_cascade';
export type NotificationChannel = 'email' | 'sms' | 'app_push' | 'api_webhook';

export interface AgencySelectionRule {
  agencyId: string;
  priority: number; // 1 = highest
  autoAccept: boolean;
  maxCandidates: number;
  rateLimit?: number; // max hourly rate willing to pay
  delayMinutes: number; // delay before notifying this agency (for tiered)
  channels: NotificationChannel[];
}

export interface BroadcastConfig {
  type: BroadcastType;
  urgency: ShiftUrgency;
  fillMode: FillMode;
  acceptanceMode: AcceptanceMode;
  
  // Timing
  responseDeadlineHours: number;
  autoEscalateAfterMinutes: number;
  
  // Rate controls
  maxPayRate: number;
  maxChargeRate: number;
  allowRateNegotiation: boolean;
  
  // Requirements
  requireComplianceScore: number; // 0-100
  requireReliabilityScore: number; // 0-100
  preferPreviousWorkers: boolean;
  
  // Notifications
  notifyChannels: NotificationChannel[];
  customMessage: string;
  
  // Agency rules
  agencyRules: AgencySelectionRule[];
}

interface SendToAgencyModalProps {
  open: boolean;
  onClose: () => void;
  shift?: OpenShift | Shift;
  absentStaff?: StaffMember;
  centreId: string;
  centreName: string;
  onSend: (config: BroadcastConfig) => void;
}

// Mock agencies data
const mockAgencies: Agency[] = [
  {
    id: 'agency-1',
    name: 'Elite Childcare Staffing',
    tradingName: 'Elite Staffing',
    abn: '12345678901',
    status: 'active',
    primaryContactName: 'Sarah Johnson',
    primaryContactEmail: 'sarah@elitestaffing.com.au',
    primaryContactPhone: '0412 345 678',
    address: { street: '123 Collins St', suburb: 'Melbourne', state: 'VIC', postcode: '3000' },
    serviceCategories: [],
    coverageZones: [],
    rateCards: [],
    complianceDocuments: [],
    complianceScore: 98,
    applicableAwards: ['MA000120'],
    fillRate: 94,
    avgTimeToFill: 45,
    reliabilityScore: 96,
    onboardedAt: '2023-01-15',
    lastActiveAt: '2024-01-15',
    createdAt: '2023-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'agency-2',
    name: 'Quick Staff Solutions',
    tradingName: 'Quick Staff',
    abn: '98765432109',
    status: 'active',
    primaryContactName: 'Michael Chen',
    primaryContactEmail: 'michael@quickstaff.com.au',
    primaryContactPhone: '0423 456 789',
    address: { street: '456 Bourke St', suburb: 'Melbourne', state: 'VIC', postcode: '3000' },
    serviceCategories: [],
    coverageZones: [],
    rateCards: [],
    complianceDocuments: [],
    complianceScore: 92,
    applicableAwards: ['MA000120'],
    fillRate: 87,
    avgTimeToFill: 30,
    reliabilityScore: 89,
    onboardedAt: '2023-03-20',
    lastActiveAt: '2024-01-14',
    createdAt: '2023-03-20',
    updatedAt: '2024-01-14',
  },
  {
    id: 'agency-3',
    name: 'Care Connect Agency',
    tradingName: 'Care Connect',
    abn: '11223344556',
    status: 'active',
    primaryContactName: 'Emma Williams',
    primaryContactEmail: 'emma@careconnect.com.au',
    primaryContactPhone: '0434 567 890',
    address: { street: '789 Lonsdale St', suburb: 'Melbourne', state: 'VIC', postcode: '3000' },
    serviceCategories: [],
    coverageZones: [],
    rateCards: [],
    complianceDocuments: [],
    complianceScore: 95,
    applicableAwards: ['MA000120'],
    fillRate: 91,
    avgTimeToFill: 60,
    reliabilityScore: 94,
    onboardedAt: '2023-06-10',
    lastActiveAt: '2024-01-15',
    createdAt: '2023-06-10',
    updatedAt: '2024-01-15',
  },
  {
    id: 'agency-4',
    name: 'Premium Educators',
    tradingName: 'Premium Ed',
    abn: '55667788990',
    status: 'active',
    primaryContactName: 'David Brown',
    primaryContactEmail: 'david@premiumeducators.com.au',
    primaryContactPhone: '0445 678 901',
    address: { street: '321 Flinders St', suburb: 'Melbourne', state: 'VIC', postcode: '3000' },
    serviceCategories: [],
    coverageZones: [],
    rateCards: [],
    complianceDocuments: [],
    complianceScore: 88,
    applicableAwards: ['MA000120'],
    fillRate: 82,
    avgTimeToFill: 90,
    reliabilityScore: 85,
    onboardedAt: '2023-09-01',
    lastActiveAt: '2024-01-13',
    createdAt: '2023-09-01',
    updatedAt: '2024-01-13',
  },
];

export function SendToAgencyModal({
  open,
  onClose,
  shift,
  absentStaff,
  centreId,
  centreName,
  onSend,
}: SendToAgencyModalProps) {
  // ============ STATE ============
  const [step, setStep] = useState<'config' | 'agencies' | 'review'>('config');
  const [broadcastType, setBroadcastType] = useState<BroadcastType>(absentStaff ? 'absent_cover' : 'open_shift');
  const [urgency, setUrgency] = useState<ShiftUrgency>('standard');
  const [fillMode, setFillMode] = useState<FillMode>('managed');
  const [acceptanceMode, setAcceptanceMode] = useState<AcceptanceMode>('best_match');
  
  // Timing
  const [responseDeadlineHours, setResponseDeadlineHours] = useState(4);
  const [autoEscalateMinutes, setAutoEscalateMinutes] = useState(60);
  
  // Rates
  const [maxPayRate, setMaxPayRate] = useState(45);
  const [maxChargeRate, setMaxChargeRate] = useState(65);
  const [allowNegotiation, setAllowNegotiation] = useState(false);
  
  // Requirements
  const [minComplianceScore, setMinComplianceScore] = useState(85);
  const [minReliabilityScore, setMinReliabilityScore] = useState(80);
  const [preferPreviousWorkers, setPreferPreviousWorkers] = useState(true);
  
  // Notifications
  const [notifyChannels, setNotifyChannels] = useState<NotificationChannel[]>(['email', 'app_push']);
  const [customMessage, setCustomMessage] = useState('');
  
  // Agency selection
  const [selectedAgencies, setSelectedAgencies] = useState<Map<string, AgencySelectionRule>>(new Map());
  const [showAdvancedRules, setShowAdvancedRules] = useState<string | null>(null);
  
  // Previous workers
  const [previousWorkers, setPreviousWorkers] = useState<PreviousWorkerRecord[]>([]);
  const [selectedPreviousWorkers, setSelectedPreviousWorkers] = useState<Set<string>>(new Set());
  const [showPreviousWorkers, setShowPreviousWorkers] = useState(false);
  // Agency preferences
  const [centrePreferences, setCentrePreferences] = useState<Record<string, CentreAgencyPreference>>({});
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['timing', 'acceptance']));
  
  // Load previous workers and agency preferences when modal opens
  useEffect(() => {
    if (open && centreId) {
      const workers = generateMockPreviousWorkers(centreId);
      setPreviousWorkers(workers);
      
      // Load agency preferences
      const prefs = getCentreAgencyPreferences(centreId);
      setCentrePreferences(prefs);
      
      // Auto-select preferred agencies
      const preferredIds = getPreferredAgencies(centreId);
      if (preferredIds.length > 0) {
        const newMap = new Map<string, AgencySelectionRule>();
        preferredIds.forEach((agencyId, index) => {
          newMap.set(agencyId, {
            agencyId,
            priority: index + 1,
            autoAccept: false,
            maxCandidates: 3,
            delayMinutes: 0,
            channels: ['email', 'app_push'],
          });
        });
        setSelectedAgencies(newMap);
      }
    }
  }, [open, centreId]);

  // ============ COMPUTED ============
  
  // Sort agencies: preferred first, blacklisted last (but still hidden if blacklisted)
  const sortedAgencies = useMemo(() => {
    return sortAgenciesByPreference(mockAgencies, centreId);
  }, [centreId]);
  
  // Filter out blacklisted agencies from display (with option to show)
  const [showBlacklisted, setShowBlacklisted] = useState(false);
  
  const visibleAgencies = useMemo(() => {
    if (showBlacklisted) {
      return sortedAgencies;
    }
    return sortedAgencies.filter(agency => !isAgencyBlacklisted(centreId, agency.id));
  }, [sortedAgencies, showBlacklisted, centreId]);
  
  const blacklistedCount = useMemo(() => {
    return mockAgencies.filter(agency => isAgencyBlacklisted(centreId, agency.id)).length;
  }, [centreId]);

  const shiftDetails = useMemo(() => {
    if (!shift) return null;
    const isOpenShift = 'applicants' in shift;
    return {
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      roomId: shift.roomId,
      isOpenShift,
    };
  }, [shift]);

  const selectedAgencyList = useMemo(() => {
    return Array.from(selectedAgencies.entries())
      .map(([id, rule]) => ({
        agency: mockAgencies.find(a => a.id === id)!,
        rule,
      }))
      .filter(item => item.agency)
      .sort((a, b) => a.rule.priority - b.rule.priority);
  }, [selectedAgencies]);

  const estimatedFillTime = useMemo(() => {
    if (selectedAgencyList.length === 0) return null;
    const avgTime = selectedAgencyList.reduce((sum, item) => sum + item.agency.avgTimeToFill, 0) / selectedAgencyList.length;
    return Math.round(avgTime);
  }, [selectedAgencyList]);

  const estimatedFillRate = useMemo(() => {
    if (selectedAgencyList.length === 0) return null;
    const avgRate = selectedAgencyList.reduce((sum, item) => sum + item.agency.fillRate, 0) / selectedAgencyList.length;
    return Math.round(avgRate);
  }, [selectedAgencyList]);

  // ============ HANDLERS ============
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleAgency = (agencyId: string) => {
    setSelectedAgencies(prev => {
      const next = new Map(prev);
      if (next.has(agencyId)) {
        next.delete(agencyId);
      } else {
        next.set(agencyId, {
          agencyId,
          priority: next.size + 1,
          autoAccept: false,
          maxCandidates: 3,
          delayMinutes: acceptanceMode === 'tiered_cascade' ? next.size * 30 : 0,
          channels: ['email', 'app_push'],
        });
      }
      return next;
    });
  };

  const updateAgencyRule = (agencyId: string, updates: Partial<AgencySelectionRule>) => {
    setSelectedAgencies(prev => {
      const next = new Map(prev);
      const existing = next.get(agencyId);
      if (existing) {
        next.set(agencyId, { ...existing, ...updates });
      }
      return next;
    });
  };

  const moveAgencyPriority = (agencyId: string, direction: 'up' | 'down') => {
    const list = selectedAgencyList;
    const index = list.findIndex(item => item.agency.id === agencyId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    
    setSelectedAgencies(prev => {
      const next = new Map(prev);
      const current = next.get(agencyId)!;
      const swap = list[newIndex];
      
      next.set(agencyId, { ...current, priority: newIndex + 1 });
      next.set(swap.agency.id, { ...swap.rule, priority: index + 1 });
      
      return next;
    });
  };

  const selectAllAgencies = () => {
    if (selectedAgencies.size === mockAgencies.length) {
      setSelectedAgencies(new Map());
    } else {
      const newMap = new Map<string, AgencySelectionRule>();
      mockAgencies.forEach((agency, index) => {
        newMap.set(agency.id, {
          agencyId: agency.id,
          priority: index + 1,
          autoAccept: false,
          maxCandidates: 3,
          delayMinutes: acceptanceMode === 'tiered_cascade' ? index * 30 : 0,
          channels: ['email', 'app_push'],
        });
      });
      setSelectedAgencies(newMap);
    }
  };

  const handleSend = () => {
    const config: BroadcastConfig = {
      type: broadcastType,
      urgency,
      fillMode,
      acceptanceMode,
      responseDeadlineHours,
      autoEscalateAfterMinutes: autoEscalateMinutes,
      maxPayRate,
      maxChargeRate,
      allowRateNegotiation: allowNegotiation,
      requireComplianceScore: minComplianceScore,
      requireReliabilityScore: minReliabilityScore,
      preferPreviousWorkers,
      notifyChannels,
      customMessage,
      agencyRules: Array.from(selectedAgencies.values()),
    };
    
    onSend(config);
    toast.success(`Shift broadcast sent to ${selectedAgencies.size} agencies`);
    handleClose();
  };

  const handleClose = () => {
    setStep('config');
    setSelectedAgencies(new Map());
    onClose();
  };

  // ============ RENDER HELPERS ============
  const renderScoreBadge = (score: number, label: string) => {
    const color = score >= 90 ? 'success' : score >= 80 ? 'warning' : 'error';
    return (
      <Chip
        size="small"
        label={`${score}%`}
        color={color}
        icon={<TrendingUp size={12} />}
        sx={{ fontSize: '0.7rem' }}
      />
    );
  };

  const renderAgencyCard = (agency: Agency, isSelected: boolean, rule?: AgencySelectionRule) => {
    const isPreferred = isAgencyPreferred(centreId, agency.id);
    const isBlacklisted = isAgencyBlacklisted(centreId, agency.id);
    const preference = centrePreferences[agency.id];
    
    return (
      <Paper
        key={agency.id}
        elevation={isSelected ? 3 : 1}
        sx={{
          p: 2,
          mb: 1.5,
          border: isSelected ? '2px solid' : isPreferred ? '2px solid' : isBlacklisted ? '1px dashed' : '1px solid',
          borderColor: isSelected ? 'primary.main' : isPreferred ? 'warning.main' : isBlacklisted ? 'error.main' : 'divider',
          borderRadius: 2,
          cursor: isBlacklisted ? 'not-allowed' : 'pointer',
          opacity: isBlacklisted ? 0.6 : 1,
          bgcolor: isBlacklisted ? 'error.50' : isPreferred && !isSelected ? 'warning.50' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: isBlacklisted ? 'error.main' : 'primary.light',
            transform: isBlacklisted ? 'none' : 'translateY(-1px)',
          },
        }}
        onClick={() => !isBlacklisted && toggleAgency(agency.id)}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Checkbox
            checked={isSelected}
            disabled={isBlacklisted}
            onChange={() => !isBlacklisted && toggleAgency(agency.id)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <Box flex={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Building2 size={18} className={isPreferred ? 'text-amber-500' : isBlacklisted ? 'text-red-500' : 'text-primary'} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {agency.name}
                </Typography>
                {isPreferred && (
                  <Chip
                    size="small"
                    label="Preferred"
                    color="warning"
                    icon={<Star size={12} />}
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                )}
                {isBlacklisted && (
                  <Chip
                    size="small"
                    label="Blacklisted"
                    color="error"
                    icon={<XCircle size={12} />}
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                )}
                {rule && !isPreferred && !isBlacklisted && (
                  <Chip
                    size="small"
                    label={`Priority ${rule.priority}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                )}
              </Stack>
              
              <Stack direction="row" spacing={0.5}>
                {renderScoreBadge(agency.fillRate, 'Fill Rate')}
                {renderScoreBadge(agency.reliabilityScore, 'Reliability')}
              </Stack>
            </Stack>
            
            {preference?.reason && (
              <Alert 
                severity={isPreferred ? 'success' : 'error'} 
                sx={{ py: 0.25, px: 1, fontSize: '0.7rem', mb: 1 }}
                icon={<Info size={12} />}
              >
                <Typography variant="caption">{preference.reason}</Typography>
              </Alert>
            )}
          
            <Stack direction="row" spacing={3} mb={1}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Timer size={12} /> Avg fill: {agency.avgTimeToFill} mins
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Shield size={12} /> Compliance: {agency.complianceScore}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Users size={12} /> {agency.primaryContactName}
            </Typography>
          </Stack>
          
          {/* Advanced rules expansion */}
          {isSelected && (
            <Collapse in={showAdvancedRules === agency.id}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }} onClick={(e) => e.stopPropagation()}>
                <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1.5 }}>
                  Agency-Specific Rules
                </Typography>
                
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Max Candidates</InputLabel>
                      <Select
                        value={rule?.maxCandidates || 3}
                        label="Max Candidates"
                        onChange={(e) => updateAgencyRule(agency.id, { maxCandidates: e.target.value as number })}
                      >
                        {[1, 2, 3, 5, 10].map(n => (
                          <MenuItem key={n} value={n}>{n}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      size="small"
                      label="Rate Limit ($)"
                      type="number"
                      value={rule?.rateLimit || ''}
                      onChange={(e) => updateAgencyRule(agency.id, { rateLimit: Number(e.target.value) || undefined })}
                      sx={{ width: 120 }}
                    />
                    
                    {acceptanceMode === 'tiered_cascade' && (
                      <TextField
                        size="small"
                        label="Delay (mins)"
                        type="number"
                        value={rule?.delayMinutes || 0}
                        onChange={(e) => updateAgencyRule(agency.id, { delayMinutes: Number(e.target.value) })}
                        sx={{ width: 120 }}
                      />
                    )}
                  </Stack>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StyledSwitch
                      checked={rule?.autoAccept || false}
                      onChange={(checked) => updateAgencyRule(agency.id, { autoAccept: checked })}
                      size="small"
                    />
                    <Typography variant="caption">Auto-accept candidates from this agency</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Notification Channels
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {(['email', 'sms', 'app_push', 'api_webhook'] as NotificationChannel[]).map(channel => (
                        <Chip
                          key={channel}
                          size="small"
                          label={channel === 'app_push' ? 'Push' : channel === 'api_webhook' ? 'API' : channel.toUpperCase()}
                          variant={rule?.channels.includes(channel) ? 'filled' : 'outlined'}
                          onClick={() => {
                            const channels = rule?.channels || [];
                            const newChannels = channels.includes(channel)
                              ? channels.filter(c => c !== channel)
                              : [...channels, channel];
                            updateAgencyRule(agency.id, { channels: newChannels });
                          }}
                          icon={channel === 'email' ? <Mail size={12} /> : channel === 'sms' ? <Phone size={12} /> : <MessageSquare size={12} />}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Collapse>
          )}
          
          {isSelected && (
            <Stack direction="row" spacing={1} mt={1}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdvancedRules(showAdvancedRules === agency.id ? null : agency.id);
                }}
                endIcon={showAdvancedRules === agency.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                sx={{ fontSize: '0.7rem' }}
              >
                {showAdvancedRules === agency.id ? 'Hide' : 'Show'} Advanced Rules
              </Button>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  moveAgencyPriority(agency.id, 'up');
                }}
                disabled={rule?.priority === 1}
              >
                <ChevronUp size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  moveAgencyPriority(agency.id, 'down');
                }}
                disabled={rule?.priority === selectedAgencies.size}
              >
                <ChevronDown size={16} />
              </IconButton>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
  };

  const renderConfigStep = () => (
    <Stack spacing={3}>
      {/* Shift Summary */}
      {shiftDetails && (
        <Alert severity="info" icon={<Clock size={18} />}>
          <Typography variant="subtitle2">
            {absentStaff ? `Covering for: ${absentStaff.name}` : 'Open Shift'}
          </Typography>
          <Typography variant="body2">
            {format(parseISO(shiftDetails.date), 'EEEE, d MMMM yyyy')} • {shiftDetails.startTime} - {shiftDetails.endTime}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {centreName}
          </Typography>
        </Alert>
      )}

      {/* Broadcast Type */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers size={16} /> Broadcast Type
        </Typography>
        <RadioGroup
          row
          value={broadcastType}
          onChange={(e) => setBroadcastType(e.target.value as BroadcastType)}
        >
          <FormControlLabel value="open_shift" control={<Radio size="small" />} label="Open Shift" />
          <FormControlLabel value="absent_cover" control={<Radio size="small" />} label="Absent Cover" />
          <FormControlLabel value="emergency" control={<Radio size="small" />} label="Emergency" />
          <FormControlLabel value="recurring" control={<Radio size="small" />} label="Recurring" />
        </RadioGroup>
      </Box>

      {/* Urgency */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle size={16} /> Urgency Level
        </Typography>
        <Stack direction="row" spacing={1}>
          {(['standard', 'urgent', 'critical'] as ShiftUrgency[]).map(level => (
            <Chip
              key={level}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              variant={urgency === level ? 'filled' : 'outlined'}
              color={level === 'critical' ? 'error' : level === 'urgent' ? 'warning' : 'default'}
              onClick={() => setUrgency(level)}
              sx={{ flex: 1, justifyContent: 'center' }}
            />
          ))}
        </Stack>
      </Box>

      {/* Collapsible Sections */}
      {/* Timing & Response */}
      <Box>
        <Button
          fullWidth
          variant="text"
          onClick={() => toggleSection('timing')}
          endIcon={expandedSections.has('timing') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Timer size={16} />
            <Typography variant="subtitle2">Timing & Response</Typography>
          </Stack>
        </Button>
        <Collapse in={expandedSections.has('timing')}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Response Deadline: {responseDeadlineHours} hours
                </Typography>
                <Slider
                  value={responseDeadlineHours}
                  onChange={(_, v) => setResponseDeadlineHours(v as number)}
                  min={1}
                  max={24}
                  marks={[
                    { value: 1, label: '1h' },
                    { value: 6, label: '6h' },
                    { value: 12, label: '12h' },
                    { value: 24, label: '24h' },
                  ]}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Auto-escalate after: {autoEscalateMinutes} minutes
                </Typography>
                <Slider
                  value={autoEscalateMinutes}
                  onChange={(_, v) => setAutoEscalateMinutes(v as number)}
                  min={15}
                  max={180}
                  step={15}
                  marks={[
                    { value: 15, label: '15m' },
                    { value: 60, label: '1h' },
                    { value: 120, label: '2h' },
                  ]}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* Acceptance Mode */}
      <Box>
        <Button
          fullWidth
          variant="text"
          onClick={() => toggleSection('acceptance')}
          endIcon={expandedSections.has('acceptance') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Target size={16} />
            <Typography variant="subtitle2">Acceptance Mode</Typography>
          </Stack>
        </Button>
        <Collapse in={expandedSections.has('acceptance')}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
            <RadioGroup value={acceptanceMode} onChange={(e) => setAcceptanceMode(e.target.value as AcceptanceMode)}>
              <FormControlLabel
                value="first_response"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>First Response Wins</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically accept the first qualified candidate
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="best_match"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Best Match</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Collect responses and auto-select highest scoring candidate
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="manual_review"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Manual Review</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Review all candidates before making a selection
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="tiered_cascade"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Tiered Cascade</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notify agencies in priority order with delays between tiers
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>
        </Collapse>
      </Box>

      {/* Rate Controls */}
      <Box>
        <Button
          fullWidth
          variant="text"
          onClick={() => toggleSection('rates')}
          endIcon={expandedSections.has('rates') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <DollarSign size={16} />
            <Typography variant="subtitle2">Rate Controls</Typography>
          </Stack>
        </Button>
        <Collapse in={expandedSections.has('rates')}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Max Pay Rate ($/hr)"
                  type="number"
                  size="small"
                  value={maxPayRate}
                  onChange={(e) => setMaxPayRate(Number(e.target.value))}
                  fullWidth
                />
                <TextField
                  label="Max Charge Rate ($/hr)"
                  type="number"
                  size="small"
                  value={maxChargeRate}
                  onChange={(e) => setMaxChargeRate(Number(e.target.value))}
                  fullWidth
                />
              </Stack>
              <StyledSwitch
                checked={allowNegotiation}
                onChange={setAllowNegotiation}
                label="Allow rate negotiation"
                size="small"
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* Quality Requirements */}
      <Box>
        <Button
          fullWidth
          variant="text"
          onClick={() => toggleSection('quality')}
          endIcon={expandedSections.has('quality') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Award size={16} />
            <Typography variant="subtitle2">Quality Requirements</Typography>
          </Stack>
        </Button>
        <Collapse in={expandedSections.has('quality')}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Minimum Compliance Score: {minComplianceScore}%
                </Typography>
                <Slider
                  value={minComplianceScore}
                  onChange={(_, v) => setMinComplianceScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Minimum Reliability Score: {minReliabilityScore}%
                </Typography>
                <Slider
                  value={minReliabilityScore}
                  onChange={(_, v) => setMinReliabilityScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
              <StyledSwitch
                checked={preferPreviousWorkers}
                onChange={setPreferPreviousWorkers}
                label="Prefer workers who've worked at this centre before"
                size="small"
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* Custom Message */}
      <Box>
        <Button
          fullWidth
          variant="text"
          onClick={() => toggleSection('message')}
          endIcon={expandedSections.has('message') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <MessageSquare size={16} />
            <Typography variant="subtitle2">Custom Message (Optional)</Typography>
          </Stack>
        </Button>
        <Collapse in={expandedSections.has('message')}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Add any special instructions or notes for agencies..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              size="small"
            />
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );

  const togglePreviousWorker = (workerId: string) => {
    setSelectedPreviousWorkers(prev => {
      const next = new Set(prev);
      if (next.has(workerId)) {
        next.delete(workerId);
      } else {
        next.add(workerId);
      }
      return next;
    });
  };

  const renderPreviousWorkerCard = (worker: PreviousWorkerRecord) => {
    const isSelected = selectedPreviousWorkers.has(worker.workerId);
    return (
      <Paper
        key={worker.workerId}
        elevation={0}
        sx={{
          p: 2,
          border: '2px solid',
          borderColor: isSelected ? 'success.main' : 'divider',
          borderRadius: 2,
          bgcolor: isSelected ? 'success.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: isSelected ? 'success.dark' : 'primary.light',
          },
        }}
        onClick={() => togglePreviousWorker(worker.workerId)}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Checkbox
            checked={isSelected}
            onChange={() => togglePreviousWorker(worker.workerId)}
            onClick={(e) => e.stopPropagation()}
            color="success"
          />
          
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {worker.workerName.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Box flex={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {worker.workerName}
                </Typography>
                {worker.preferredByLocation && (
                  <Chip
                    size="small"
                    icon={<Star size={10} />}
                    label="Preferred"
                    color="warning"
                    sx={{ fontSize: '0.6rem', height: 18 }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Chip
                  size="small"
                  label={`${worker.reliabilityScore}%`}
                  color={worker.reliabilityScore >= 95 ? 'success' : worker.reliabilityScore >= 85 ? 'warning' : 'default'}
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
                <Chip
                  size="small"
                  icon={<Star size={10} />}
                  label={worker.averageRating.toFixed(1)}
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              </Stack>
            </Stack>
            
            <Stack direction="row" spacing={2} mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Building2 size={10} /> {worker.agencyName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <History size={10} /> {worker.shiftsWorked} shifts
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={10} /> Last: {format(parseISO(worker.lastShiftDate), 'd MMM')}
              </Typography>
            </Stack>
            
            {worker.notes && (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                "{worker.notes}"
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    );
  };

  const renderAgenciesStep = () => (
    <Stack spacing={3}>
      {/* Previous Workers Section */}
      {preferPreviousWorkers && previousWorkers.length > 0 && (
        <Box>
          <Button
            fullWidth
            variant="text"
            onClick={() => setShowPreviousWorkers(!showPreviousWorkers)}
            endIcon={showPreviousWorkers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            sx={{ justifyContent: 'space-between', textTransform: 'none', color: 'text.primary', mb: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <UserCheck size={18} className="text-success" />
              <Typography variant="subtitle2" fontWeight={600}>
                Request Specific Workers
              </Typography>
              <Chip
                size="small"
                label={`${previousWorkers.length} have worked here before`}
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
            </Stack>
          </Button>
          
          <Collapse in={showPreviousWorkers}>
            <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 2, mb: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Select workers who have previously worked at {centreName}. Their agencies will be prioritized and asked to assign these specific workers.
                </Typography>
              </Alert>
              
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="caption" color="text.secondary">
                  {selectedPreviousWorkers.size} worker(s) selected
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    if (selectedPreviousWorkers.size === previousWorkers.length) {
                      setSelectedPreviousWorkers(new Set());
                    } else {
                      setSelectedPreviousWorkers(new Set(previousWorkers.map(w => w.workerId)));
                    }
                  }}
                >
                  {selectedPreviousWorkers.size === previousWorkers.length ? 'Deselect All' : 'Select All Preferred'}
                </Button>
              </Stack>
              
              <Stack spacing={1.5} sx={{ maxHeight: 300, overflow: 'auto' }}>
                {previousWorkers
                  .sort((a, b) => (b.preferredByLocation ? 1 : 0) - (a.preferredByLocation ? 1 : 0) || b.reliabilityScore - a.reliabilityScore)
                  .map(worker => renderPreviousWorkerCard(worker))}
              </Stack>
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* Quick Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">
          Select Agencies ({selectedAgencies.size} selected)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={selectAllAgencies}
          >
            {selectedAgencies.size === mockAgencies.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Filter size={14} />}
          >
            Filter
          </Button>
        </Stack>
      </Stack>

      {/* Agency List */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {mockAgencies.map(agency => {
          const isSelected = selectedAgencies.has(agency.id);
          const rule = selectedAgencies.get(agency.id);
          // Check if any selected workers belong to this agency
          const requestedWorkers = previousWorkers.filter(
            w => w.agencyId === agency.id && selectedPreviousWorkers.has(w.workerId)
          );
          return (
            <Box key={agency.id}>
              {renderAgencyCard(agency, isSelected, rule)}
              {requestedWorkers.length > 0 && isSelected && (
                <Alert severity="info" sx={{ mx: 2, mb: 1.5, mt: -1 }}>
                  <Typography variant="caption">
                    Requesting: {requestedWorkers.map(w => w.workerName).join(', ')}
                  </Typography>
                </Alert>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Summary Stats */}
      {selectedAgencies.size > 0 && (
        <Alert severity="success" icon={<Zap size={18} />}>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Est. Fill Time</Typography>
              <Typography variant="body2" fontWeight={600}>{estimatedFillTime} mins</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Est. Fill Rate</Typography>
              <Typography variant="body2" fontWeight={600}>{estimatedFillRate}%</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Agencies</Typography>
              <Typography variant="body2" fontWeight={600}>{selectedAgencies.size}</Typography>
            </Box>
          </Stack>
        </Alert>
      )}
    </Stack>
  );

  const renderReviewStep = () => (
    <Stack spacing={3}>
      <Alert severity="info" icon={<Eye size={18} />}>
        Review your broadcast configuration before sending
      </Alert>

      {/* Shift Details */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Clock size={16} /> Shift Details
        </Typography>
        {shiftDetails && (
          <Stack spacing={0.5}>
            <Typography variant="body2">
              {format(parseISO(shiftDetails.date), 'EEEE, d MMMM yyyy')}
            </Typography>
            <Typography variant="body2">
              {shiftDetails.startTime} - {shiftDetails.endTime}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {centreName}
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* Broadcast Settings */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings size={16} /> Broadcast Settings
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip size="small" label={`Type: ${broadcastType.replace('_', ' ')}`} />
          <Chip size="small" label={`Urgency: ${urgency}`} color={urgency === 'critical' ? 'error' : urgency === 'urgent' ? 'warning' : 'default'} />
          <Chip size="small" label={`Mode: ${acceptanceMode.replace('_', ' ')}`} />
          <Chip size="small" label={`Deadline: ${responseDeadlineHours}h`} />
          <Chip size="small" label={`Max Rate: $${maxPayRate}/hr`} />
        </Stack>
      </Paper>

      {/* Selected Agencies */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={16} /> Selected Agencies ({selectedAgencyList.length})
        </Typography>
        <Stack spacing={1}>
          {selectedAgencyList.map(({ agency, rule }) => (
            <Stack key={agency.id} direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip size="small" label={rule.priority} variant="outlined" />
                <Typography variant="body2">{agency.name}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                {rule.autoAccept && <Chip size="small" label="Auto-accept" color="success" variant="outlined" />}
                {rule.delayMinutes > 0 && <Chip size="small" label={`+${rule.delayMinutes}m delay`} variant="outlined" />}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* Notification Preview */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send size={16} /> Notification Preview
        </Typography>
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            <strong>New Shift Request</strong>{'\n'}
            {centreName} needs a staff member{'\n'}
            {shiftDetails && `${format(parseISO(shiftDetails.date), 'EEE d MMM')} • ${shiftDetails.startTime} - ${shiftDetails.endTime}`}{'\n'}
            Urgency: {urgency.toUpperCase()}{'\n'}
            Rate: Up to ${maxPayRate}/hr{'\n'}
            {customMessage && `\nNotes: ${customMessage}`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} mt={1}>
          <Typography variant="caption" color="text.secondary">
            Via:
          </Typography>
          {notifyChannels.map(channel => (
            <Chip key={channel} size="small" label={channel.toUpperCase()} variant="outlined" sx={{ fontSize: '0.65rem' }} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );

  // ============ ACTIONS ============
  const getStepActions = (): OffCanvasAction[] => {
    switch (step) {
      case 'config':
        return [
          { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
          { label: 'Select Agencies', onClick: () => setStep('agencies'), variant: 'primary' },
        ];
      case 'agencies':
        return [
          { label: 'Back', onClick: () => setStep('config'), variant: 'outlined' },
          { label: 'Review & Send', onClick: () => setStep('review'), variant: 'primary', disabled: selectedAgencies.size === 0 },
        ];
      case 'review':
        return [
          { label: 'Back', onClick: () => setStep('agencies'), variant: 'outlined' },
          { label: `Send to ${selectedAgencies.size} Agencies`, onClick: handleSend, variant: 'primary' },
        ];
    }
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={handleClose}
      title="Send to Agency"
      description={`Step ${step === 'config' ? 1 : step === 'agencies' ? 2 : 3} of 3: ${
        step === 'config' ? 'Configure Broadcast' : step === 'agencies' ? 'Select Agencies' : 'Review & Send'
      }`}
      icon={Send}
      actions={getStepActions()}
      size="lg"
    >
      {/* Progress Indicator */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} mb={1}>
          {['Configure', 'Agencies', 'Review'].map((label, index) => {
            const stepNames = ['config', 'agencies', 'review'];
            const currentIndex = stepNames.indexOf(step);
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
            
            return (
              <Box key={label} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: isComplete ? 'success.main' : isActive ? 'primary.main' : 'grey.200',
                    transition: 'all 0.3s',
                  }}
                />
                <Typography
                  variant="caption"
                  color={isActive ? 'primary' : 'text.secondary'}
                  fontWeight={isActive ? 600 : 400}
                  sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {step === 'config' && renderConfigStep()}
      {step === 'agencies' && renderAgenciesStep()}
      {step === 'review' && renderReviewStep()}
    </PrimaryOffCanvas>
  );
}

export default SendToAgencyModal;
