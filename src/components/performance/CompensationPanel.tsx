import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './shared/StatusBadge';
import {
  DollarSign,
  TrendingUp,
  Target,
  Check,
  X,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  SalaryBand,
  EmployeeCompensation,
  MeritRecommendation,
  BonusCalculation,
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
import { toast } from 'sonner';

interface CompensationPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function CompensationPanel({ staff, currentUserId }: CompensationPanelProps) {
  const [activeView, setActiveView] = useState<'overview' | 'merit' | 'bonus'>('overview');

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

  const getCompaRatioVariant = (ratio: number) => {
    if (ratio < 0.9) return 'warning';
    if (ratio > 1.1) return 'destructive';
    return 'success';
  };

  const getCompaRatioLabel = (ratio: number) => {
    if (ratio < 0.9) return 'Below Range';
    if (ratio > 1.1) return 'Above Range';
    return 'At Market';
  };

  const getMeritStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBonusStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': 
      case 'approved': return 'success';
      case 'pending_approval': return 'warning';
      default: return 'secondary';
    }
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
          <Box sx={{ p: 2, bgcolor: 'warning.50' }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Pending Reviews</Typography>
            <Typography variant="h4" fontWeight={700}>{stats.pending}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'success.50' }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Approved</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">{stats.approved}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'primary.50' }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Total Budget Impact</Typography>
            <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalBudget)}</Typography>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'info.50' }}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Avg Increase</Typography>
            <Typography variant="h4" fontWeight={700}>{stats.avgIncrease.toFixed(1)}%</Typography>
          </Box>
        </Card>
      </Box>

      {activeView === 'overview' && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={2}>Employee Compensation Overview</Typography>
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Employee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Band / Level</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-right">Current Salary</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Position in Band</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Compa-Ratio</TableHead>
                  <TableHead className="w-16 h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEmployeeCompensation.map((comp) => {
                  const staffMember = getStaffMember(comp.staffId);
                  const band = getSalaryBand(comp.salaryBandId);
                  if (!staffMember || !band) return null;

                  const positionInBand = ((comp.currentSalary - band.minSalary) / (band.maxSalary - band.minSalary)) * 100;
                  const isBelowRange = comp.compaRatio < 0.9;
                  const isAboveRange = comp.compaRatio > 1.1;

                  return (
                    <TableRow 
                      key={comp.id} 
                      className="group hover:bg-muted/50 transition-colors"
                      style={{
                        borderLeft: isBelowRange 
                          ? '3px solid hsl(var(--warning))' 
                          : isAboveRange 
                            ? '3px solid hsl(var(--destructive))' 
                            : undefined,
                      }}
                    >
                      <TableCell className="py-3">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={staffMember.avatar} sx={{ width: 36, height: 36 }}>
                            {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {staffMember.firstName} {staffMember.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.position}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell className="py-3">
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{band.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {salaryBandLevelLabels[band.level]}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(comp.currentSalary)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Range: {formatCurrency(band.minSalary)} - {formatCurrency(band.maxSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell className="py-3 w-40">
                        <Box>
                          <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.200', borderRadius: 1, mb: 0.5 }}>
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
                              top: -2, 
                              width: 12, 
                              height: 12, 
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              transform: 'translateX(-50%)',
                              border: 2,
                              borderColor: 'background.paper',
                            }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                            Mid: {formatCurrency(band.midSalary)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge 
                          status={getCompaRatioVariant(comp.compaRatio) as any}
                          label={`${(comp.compaRatio * 100).toFixed(0)}%`}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <IconButton size="small" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={14} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {activeView === 'merit' && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Merit Increase Recommendations</Typography>
            <Chip label={`Budget: ${mockMeritMatrix.budget}%`} size="small" color="primary" variant="outlined" />
          </Stack>
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Employee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Performance</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-right">Current</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-right">Recommended</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-center">Increase</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Status</TableHead>
                  <TableHead className="w-24 h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMeritRecommendations.map((rec) => {
                  const staffMember = getStaffMember(rec.staffId);
                  if (!staffMember) return null;
                  const isPending = rec.status === 'pending';
                  const isApproved = rec.status === 'approved';
                  const isHighPerformer = rec.performanceRating >= 4;

                  return (
                    <TableRow 
                      key={rec.id} 
                      className="group hover:bg-muted/50 transition-colors"
                      style={{
                        borderLeft: isApproved 
                          ? '3px solid hsl(var(--chart-2))' 
                          : isPending && isHighPerformer 
                            ? '3px solid hsl(var(--primary))' 
                            : undefined,
                      }}
                    >
                      <TableCell className="py-3">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={staffMember.avatar} sx={{ width: 36, height: 36 }}>
                            {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {staffMember.firstName} {staffMember.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.position}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell className="py-3">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip 
                            label={`${rec.performanceRating}/5`} 
                            size="small" 
                            color={rec.performanceRating >= 4 ? 'success' : rec.performanceRating >= 3 ? 'warning' : 'default'}
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Compa: {(rec.currentCompaRatio * 100).toFixed(0)}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Typography variant="body2">{formatCurrency(rec.currentSalary)}</Typography>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'hsl(var(--chart-2))' }}>
                          {formatCurrency(rec.managerAdjustedSalary || rec.recommendedNewSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                          <TrendingUp size={14} style={{ color: 'hsl(var(--chart-2))' }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(var(--chart-2))' }}>
                            +{rec.managerAdjustedPercent || rec.recommendedIncreasePercent}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge 
                          status={getMeritStatusVariant(rec.status) as any}
                          label={rec.status}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        {isPending ? (
                          <Stack direction="row" spacing={0.5}>
                            <IconButton 
                              size="small" 
                              sx={{ color: 'success.main' }}
                              onClick={() => toast.success('Merit increase approved')}
                            >
                              <Check size={16} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              sx={{ color: 'error.main' }}
                              onClick={() => toast.error('Merit increase rejected')}
                            >
                              <X size={16} />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton size="small" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          
          {/* Justification notes */}
          {mockMeritRecommendations.filter(r => r.justification).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Notes</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {mockMeritRecommendations.filter(r => r.justification).map(rec => {
                  const staffMember = getStaffMember(rec.staffId);
                  return (
                    <Typography key={rec.id} variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      <strong>{staffMember?.firstName}:</strong> "{rec.justification}"
                    </Typography>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {activeView === 'bonus' && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={2}>Bonus Calculations</Typography>
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Employee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Bonus Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-center">Target %</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-center">Multipliers</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-right">Final Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Status</TableHead>
                  <TableHead className="w-16 h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBonusCalculations.map((bonus) => {
                  const staffMember = getStaffMember(bonus.staffId);
                  if (!staffMember) return null;

                  const comp = getCompensation(bonus.staffId);
                  const baseSalary = comp?.currentSalary || 0;
                  const targetAmount = baseSalary * (bonus.targetPercent / 100);
                  const isPaid = bonus.status === 'paid';
                  const isApproved = bonus.status === 'approved';

                  return (
                    <TableRow 
                      key={bonus.id} 
                      className="group hover:bg-muted/50 transition-colors"
                      style={{
                        borderLeft: isPaid || isApproved 
                          ? '3px solid hsl(var(--chart-2))' 
                          : undefined,
                      }}
                    >
                      <TableCell className="py-3">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={staffMember.avatar} sx={{ width: 36, height: 36 }}>
                            {staffMember.firstName?.[0]}{staffMember.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {staffMember.firstName} {staffMember.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.position}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell className="py-3">
                        <Chip 
                          label={bonusTypeLabels[bonus.bonusType]} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{bonus.targetPercent}%</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(targetAmount)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Typography variant="caption">
                          <span className="font-medium">{bonus.performanceMultiplier}</span> × 
                          <span className="font-medium"> {bonus.companyMultiplier}</span> × 
                          <span className="font-medium"> {bonus.individualMultiplier}</span>
                        </Typography>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(var(--chart-2))' }}>
                          {formatCurrency(bonus.finalAmount || bonus.calculatedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge 
                          status={getBonusStatusVariant(bonus.status) as any}
                          label={bonus.status.replace('_', ' ')}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <IconButton size="small" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={14} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default CompensationPanel;
