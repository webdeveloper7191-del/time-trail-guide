import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Slider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import {
  DollarSign,
  TrendingUp,
  Target,
  Award,
  Users,
  ChevronRight,
  Check,
  X,
  Edit,
  Calculator,
  BarChart3,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  SalaryBand,
  EmployeeCompensation,
  MeritRecommendation,
  BonusCalculation,
  performanceToMeritMultiplier,
  performanceToBonusMultiplier,
  salaryBandLevelLabels,
  bonusTypeLabels,
} from '@/types/compensation';
import {
  mockSalaryBands,
  mockEmployeeCompensation,
  mockMeritRecommendations,
  mockBonusCalculations,
  mockMeritMatrix,
} from '@/data/mockCompensationData';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CompensationPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function CompensationPanel({ staff, currentUserId }: CompensationPanelProps) {
  const [activeView, setActiveView] = useState<'overview' | 'merit' | 'bonus'>('overview');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);
  const getCompensation = (staffId: string) => mockEmployeeCompensation.find(c => c.staffId === staffId);
  const getSalaryBand = (bandId: string) => mockSalaryBands.find(b => b.id === bandId);

  const stats = useMemo(() => {
    const pending = mockMeritRecommendations.filter(r => r.status === 'pending').length;
    const approved = mockMeritRecommendations.filter(r => r.status === 'approved').length;
    const totalBudget = mockMeritRecommendations.reduce((sum, r) => {
      const increase = r.managerAdjustedSalary 
        ? r.managerAdjustedSalary - r.currentSalary 
        : r.recommendedNewSalary - r.currentSalary;
      return sum + increase;
    }, 0);
    const avgIncrease = mockMeritRecommendations.length > 0
      ? mockMeritRecommendations.reduce((sum, r) => sum + (r.managerAdjustedPercent || r.recommendedIncreasePercent), 0) / mockMeritRecommendations.length
      : 0;

    return { pending, approved, totalBudget, avgIncrease };
  }, []);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);

  const getCompaRatioColor = (ratio: number) => {
    if (ratio < 0.9) return 'warning.main';
    if (ratio > 1.1) return 'error.main';
    return 'success.main';
  };

  const getCompaRatioLabel = (ratio: number) => {
    if (ratio < 0.9) return 'Below Range';
    if (ratio > 1.1) return 'Above Range';
    return 'At Market';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'success.light', display: 'flex' }}>
              <DollarSign size={20} style={{ color: 'var(--success)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Compensation & Merit
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manage salary bands, merit increases, and bonus calculations
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {(['overview', 'merit', 'bonus'] as const).map((view) => (
            <Button
              key={view}
              variant={activeView === view ? 'default' : 'outline'}
              size="small"
              onClick={() => setActiveView(view)}
            >
              {view === 'overview' ? 'Overview' : view === 'merit' ? 'Merit Increases' : 'Bonuses'}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Pending Reviews</Typography>
            <Typography variant="h4" fontWeight={700}>{stats.pending}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Approved</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">{stats.approved}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Total Budget Impact</Typography>
            <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalBudget)}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Avg Increase</Typography>
            <Typography variant="h4" fontWeight={700}>{stats.avgIncrease.toFixed(1)}%</Typography>
          </Box>
        </Card>
      </Box>

      {activeView === 'overview' && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={2}>Employee Compensation Overview</Typography>
          <Stack spacing={1.5}>
            {mockEmployeeCompensation.map((comp) => {
              const staffMember = getStaffMember(comp.staffId);
              const band = getSalaryBand(comp.salaryBandId);
              if (!staffMember || !band) return null;

              const positionInBand = ((comp.currentSalary - band.minSalary) / (band.maxSalary - band.minSalary)) * 100;

              return (
                <Card key={comp.id} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={staffMember.avatar} sx={{ width: 48, height: 48 }}>
                        {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {staffMember.firstName} {staffMember.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {staffMember.position} • {salaryBandLevelLabels[band.level]}
                        </Typography>
                      </Box>
                      <Box textAlign="right" sx={{ minWidth: 120 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {formatCurrency(comp.currentSalary)}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${(comp.compaRatio * 100).toFixed(0)}% Compa-Ratio`}
                          sx={{ bgcolor: getCompaRatioColor(comp.compaRatio), color: 'white', fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">{formatCurrency(band.minSalary)}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatCurrency(band.maxSalary)}</Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: '50%', 
                          top: 0, 
                          bottom: 0, 
                          width: 2, 
                          bgcolor: 'grey.400',
                          transform: 'translateX(-50%)',
                        }} />
                        <Box sx={{ 
                          position: 'absolute', 
                          left: `${Math.min(Math.max(positionInBand, 0), 100)}%`, 
                          top: -4, 
                          width: 16, 
                          height: 16, 
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          transform: 'translateX(-50%)',
                          border: 2,
                          borderColor: 'background.paper',
                        }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" mt={0.5} display="block" textAlign="center">
                        Mid: {formatCurrency(band.midSalary)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}

      {activeView === 'merit' && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Merit Increase Recommendations</Typography>
            <Chip label={`Budget: ${mockMeritMatrix.budget}%`} size="small" color="primary" variant="outlined" />
          </Stack>
          <Stack spacing={1.5}>
            {mockMeritRecommendations.map((rec) => {
              const staffMember = getStaffMember(rec.staffId);
              if (!staffMember) return null;

              return (
                <Card key={rec.id}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={staffMember.avatar} sx={{ width: 48, height: 48 }}>
                        {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {staffMember.firstName} {staffMember.lastName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`Rating: ${rec.performanceRating}/5`} size="small" />
                          <Chip label={`Compa: ${(rec.currentCompaRatio * 100).toFixed(0)}%`} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" color="text.secondary">Current</Typography>
                        <Typography variant="subtitle2">{formatCurrency(rec.currentSalary)}</Typography>
                      </Box>
                      <Box sx={{ px: 2 }}>
                        <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" color="text.secondary">Recommended</Typography>
                        <Typography variant="subtitle2" color="success.main" fontWeight={700}>
                          {formatCurrency(rec.managerAdjustedSalary || rec.recommendedNewSalary)}
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          +{rec.managerAdjustedPercent || rec.recommendedIncreasePercent}%
                        </Typography>
                      </Box>
                      <Chip
                        label={rec.status}
                        size="small"
                        color={rec.status === 'approved' ? 'success' : rec.status === 'pending' ? 'warning' : 'default'}
                      />
                      {rec.status === 'pending' && (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="success" onClick={() => toast.success('Merit increase approved')}>
                            <Check size={16} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => toast.error('Merit increase rejected')}>
                            <X size={16} />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>
                    {rec.justification && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                        "{rec.justification}"
                      </Typography>
                    )}
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}

      {activeView === 'bonus' && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={2}>Bonus Calculations</Typography>
          <Stack spacing={1.5}>
            {mockBonusCalculations.map((bonus) => {
              const staffMember = getStaffMember(bonus.staffId);
              if (!staffMember) return null;

              const comp = getCompensation(bonus.staffId);
              const baseSalary = comp?.currentSalary || 0;
              const targetAmount = baseSalary * (bonus.targetPercent / 100);

              return (
                <Card key={bonus.id}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={staffMember.avatar} sx={{ width: 48, height: 48 }}>
                        {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {staffMember.firstName} {staffMember.lastName}
                        </Typography>
                        <Chip label={bonusTypeLabels[bonus.bonusType]} size="small" variant="outlined" />
                      </Box>
                      <Box textAlign="center" sx={{ px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Target</Typography>
                        <Typography variant="body2">{bonus.targetPercent}%</Typography>
                        <Typography variant="caption">{formatCurrency(targetAmount)}</Typography>
                      </Box>
                      <Box textAlign="center" sx={{ px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Perf × Co × Ind</Typography>
                        <Typography variant="body2">
                          {bonus.performanceMultiplier} × {bonus.companyMultiplier} × {bonus.individualMultiplier}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" color="text.secondary">Final</Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {formatCurrency(bonus.finalAmount || bonus.calculatedAmount)}
                        </Typography>
                      </Box>
                      <Chip
                        label={bonus.status.replace('_', ' ')}
                        size="small"
                        color={bonus.status === 'paid' || bonus.status === 'approved' ? 'success' : bonus.status === 'pending_approval' ? 'warning' : 'default'}
                      />
                    </Stack>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default CompensationPanel;
