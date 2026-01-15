import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  TextField,
  Chip,
  Alert,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Avatar,
} from '@mui/material';
import {
  Building2,
  Star,
  Ban,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Check,
  X,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Agency } from '@/types/agency';
import {
  AgencyPreferenceStatus,
  CentreAgencyPreference,
  getCentreAgencyPreferences,
  setAgencyPreference,
  removeAgencyPreference,
} from '@/lib/centreAgencyPreferences';
import { format, parseISO } from 'date-fns';

// Mock agencies data (same as in SendToAgencyModal)
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

interface CentreAgencyPreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  centreId: string;
  centreName: string;
}

export function CentreAgencyPreferencesPanel({
  open,
  onClose,
  centreId,
  centreName,
}: CentreAgencyPreferencesPanelProps) {
  const [preferences, setPreferences] = useState<Record<string, CentreAgencyPreference>>({});
  const [editingAgency, setEditingAgency] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AgencyPreferenceStatus>('neutral');
  const [editReason, setEditReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'preferred' | 'blacklisted'>('all');
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);

  // Load preferences when panel opens
  useEffect(() => {
    if (open) {
      const prefs = getCentreAgencyPreferences(centreId);
      setPreferences(prefs);
    }
  }, [open, centreId]);

  const filteredAgencies = useMemo(() => {
    return mockAgencies.filter(agency => {
      const pref = preferences[agency.id];
      if (filter === 'all') return true;
      if (filter === 'preferred') return pref?.status === 'preferred';
      if (filter === 'blacklisted') return pref?.status === 'blacklisted';
      return true;
    });
  }, [preferences, filter]);

  const stats = useMemo(() => {
    const prefs = Object.values(preferences);
    return {
      preferred: prefs.filter(p => p.status === 'preferred').length,
      blacklisted: prefs.filter(p => p.status === 'blacklisted').length,
      neutral: mockAgencies.length - prefs.length,
    };
  }, [preferences]);

  const handleStartEdit = (agencyId: string) => {
    const existing = preferences[agencyId];
    setEditingAgency(agencyId);
    setEditStatus(existing?.status || 'neutral');
    setEditReason(existing?.reason || '');
  };

  const handleSavePreference = () => {
    if (!editingAgency) return;

    if (editStatus === 'neutral') {
      // Remove preference if set to neutral
      removeAgencyPreference(centreId, editingAgency);
      const newPrefs = { ...preferences };
      delete newPrefs[editingAgency];
      setPreferences(newPrefs);
      toast.success('Agency preference removed');
    } else {
      const newPref = setAgencyPreference(
        centreId,
        editingAgency,
        editStatus,
        editReason,
        'current_user'
      );
      setPreferences(prev => ({ ...prev, [editingAgency]: newPref }));
      toast.success(`Agency marked as ${editStatus}`);
    }

    setEditingAgency(null);
    setEditStatus('neutral');
    setEditReason('');
  };

  const handleRemovePreference = (agencyId: string) => {
    removeAgencyPreference(centreId, agencyId);
    const newPrefs = { ...preferences };
    delete newPrefs[agencyId];
    setPreferences(newPrefs);
    toast.success('Agency preference removed');
  };

  const getStatusIcon = (status?: AgencyPreferenceStatus) => {
    switch (status) {
      case 'preferred':
        return <Star size={16} className="text-amber-500" fill="currentColor" />;
      case 'blacklisted':
        return <Ban size={16} className="text-red-500" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getStatusChip = (status?: AgencyPreferenceStatus) => {
    switch (status) {
      case 'preferred':
        return <Chip size="small" label="Preferred" color="warning" icon={<Star size={12} />} />;
      case 'blacklisted':
        return <Chip size="small" label="Blacklisted" color="error" icon={<Ban size={12} />} />;
      default:
        return <Chip size="small" label="Neutral" variant="outlined" />;
    }
  };

  const renderAgencyCard = (agency: Agency) => {
    const pref = preferences[agency.id];
    const isEditing = editingAgency === agency.id;
    const isExpanded = expandedAgency === agency.id;

    return (
      <Paper
        key={agency.id}
        elevation={1}
        sx={{
          p: 2,
          mb: 1.5,
          border: '1px solid',
          borderColor: pref?.status === 'preferred' 
            ? 'warning.main' 
            : pref?.status === 'blacklisted' 
              ? 'error.main' 
              : 'divider',
          borderRadius: 2,
          bgcolor: pref?.status === 'blacklisted' ? 'error.50' : 'background.paper',
          opacity: pref?.status === 'blacklisted' ? 0.85 : 1,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar
            sx={{
              bgcolor: pref?.status === 'preferred' 
                ? 'warning.light' 
                : pref?.status === 'blacklisted' 
                  ? 'error.light' 
                  : 'grey.200',
              width: 40,
              height: 40,
            }}
          >
            <Building2 size={20} />
          </Avatar>

          <Box flex={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {agency.name}
                </Typography>
                {getStatusIcon(pref?.status)}
              </Stack>
              {getStatusChip(pref?.status)}
            </Stack>

            <Stack direction="row" spacing={3} mb={1}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp size={12} /> Fill rate: {agency.fillRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Shield size={12} /> Reliability: {agency.reliabilityScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={12} /> Avg: {agency.avgTimeToFill} mins
              </Typography>
            </Stack>

            {pref?.reason && !isEditing && (
              <Alert 
                severity={pref.status === 'preferred' ? 'success' : 'error'} 
                sx={{ py: 0.5, fontSize: '0.75rem', mb: 1 }}
                icon={<Info size={14} />}
              >
                {pref.reason}
              </Alert>
            )}

            {pref && !isEditing && (
              <Typography variant="caption" color="text.secondary">
                Updated: {format(parseISO(pref.updatedAt), 'MMM d, yyyy')} by {pref.updatedBy}
              </Typography>
            )}

            {/* Edit Form */}
            <Collapse in={isEditing}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Stack spacing={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editStatus}
                      label="Status"
                      onChange={(e) => setEditStatus(e.target.value as AgencyPreferenceStatus)}
                    >
                      <MenuItem value="neutral">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Circle size={14} className="text-gray-400" />
                          <span>Neutral (No preference)</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="preferred">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Star size={14} className="text-amber-500" />
                          <span>Preferred</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="blacklisted">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Ban size={14} className="text-red-500" />
                          <span>Blacklisted</span>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Reason (optional)"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder={
                      editStatus === 'preferred'
                        ? 'e.g., Consistently high-quality candidates...'
                        : editStatus === 'blacklisted'
                          ? 'e.g., Multiple no-shows, poor compliance...'
                          : 'Add a note about this agency...'
                    }
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<X size={14} />}
                      onClick={() => setEditingAgency(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Check size={14} />}
                      onClick={handleSavePreference}
                    >
                      Save
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Collapse>

            {/* Actions */}
            {!isEditing && (
              <Stack direction="row" spacing={1} mt={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Edit2 size={14} />}
                  onClick={() => handleStartEdit(agency.id)}
                >
                  {pref ? 'Edit Preference' : 'Set Preference'}
                </Button>
                {pref && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemovePreference(agency.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    );
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Close',
      onClick: onClose,
      variant: 'outlined' as const,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Agency Preferences"
      description={`Manage preferred and blacklisted agencies for ${centreName}`}
      actions={actions}
      size="lg"
    >
      <Stack spacing={3}>
        {/* Stats */}
        <Stack direction="row" spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              flex: 1,
              bgcolor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.200',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Star size={20} className="text-amber-500" fill="currentColor" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.preferred}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Preferred
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              flex: 1,
              bgcolor: 'error.50',
              border: '1px solid',
              borderColor: 'error.200',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Ban size={20} className="text-red-500" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.blacklisted}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Blacklisted
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              flex: 1,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Circle size={20} className="text-gray-400" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {stats.neutral}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Neutral
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* Info Alert */}
        <Alert severity="info" icon={<Info size={18} />}>
          <Typography variant="body2">
            <strong>Preferred agencies</strong> will be auto-selected and prioritized when broadcasting shifts.{' '}
            <strong>Blacklisted agencies</strong> will be hidden from broadcast selection.
          </Typography>
        </Alert>

        {/* Filter */}
        <Stack direction="row" spacing={1}>
          <Chip
            label="All"
            variant={filter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter('all')}
          />
          <Chip
            label={`Preferred (${stats.preferred})`}
            variant={filter === 'preferred' ? 'filled' : 'outlined'}
            color="warning"
            icon={<Star size={14} />}
            onClick={() => setFilter('preferred')}
          />
          <Chip
            label={`Blacklisted (${stats.blacklisted})`}
            variant={filter === 'blacklisted' ? 'filled' : 'outlined'}
            color="error"
            icon={<Ban size={14} />}
            onClick={() => setFilter('blacklisted')}
          />
        </Stack>

        <Divider />

        {/* Agency List */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredAgencies.length} {filteredAgencies.length === 1 ? 'agency' : 'agencies'}
          </Typography>

          {filteredAgencies.length === 0 ? (
            <Alert severity="info">
              No agencies match the selected filter.
            </Alert>
          ) : (
            filteredAgencies.map(renderAgencyCard)
          )}
        </Box>
      </Stack>
    </PrimaryOffCanvas>
  );
}
