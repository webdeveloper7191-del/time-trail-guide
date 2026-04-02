import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slider,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import { AlertTriangle, Zap, Scale, DollarSign, Award, Heart } from 'lucide-react';
import { OpenShift } from '@/types/roster';
import { SchedulerWeights, DEFAULT_WEIGHTS } from '@/lib/autoScheduler';

interface FillOpenShiftsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (weights: SchedulerWeights) => void;
  openShifts: OpenShift[];
}

const urgencyColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const weightConfig = [
  { key: 'availability' as const, label: 'Availability', icon: Zap, description: 'Prefer staff who are available and not overworked' },
  { key: 'qualifications' as const, label: 'Qualifications', icon: Award, description: 'Prefer staff with matching skills & certifications' },
  { key: 'cost' as const, label: 'Cost', icon: DollarSign, description: 'Prefer lower-cost staff to stay within budget' },
  { key: 'fairness' as const, label: 'Fairness', icon: Scale, description: 'Distribute hours evenly across the team' },
  { key: 'preference' as const, label: 'Preference', icon: Heart, description: 'Honor staff room & time preferences' },
];

export function FillOpenShiftsDialog({ open, onClose, onConfirm, openShifts }: FillOpenShiftsDialogProps) {
  const [weights, setWeights] = useState<SchedulerWeights>({ ...DEFAULT_WEIGHTS });

  const urgencyCounts = openShifts.reduce((acc, os) => {
    acc[os.urgency] = (acc[os.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPositions = openShifts.reduce((sum, os) => sum + (os.requiredEmployeeCount || 1), 0);

  const handleWeightChange = (key: keyof SchedulerWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: 'balanced' | 'cost' | 'quality' | 'fair') => {
    const presets: Record<string, SchedulerWeights> = {
      balanced: { availability: 30, qualifications: 25, cost: 15, fairness: 20, preference: 10 },
      cost: { availability: 25, qualifications: 15, cost: 40, fairness: 10, preference: 10 },
      quality: { availability: 20, qualifications: 40, cost: 10, fairness: 15, preference: 15 },
      fair: { availability: 20, qualifications: 20, cost: 10, fairness: 40, preference: 10 },
    };
    setWeights(presets[preset]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Zap className="h-5 w-5 text-primary" />
        Fill Open Shifts
      </DialogTitle>

      <DialogContent>
        {/* Summary */}
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            {openShifts.length} open shift{openShifts.length !== 1 ? 's' : ''} · {totalPositions} position{totalPositions !== 1 ? 's' : ''} to fill
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {Object.entries(urgencyCounts).map(([urgency, count]) => (
              <Chip
                key={urgency}
                size="small"
                label={`${count} ${urgency}`}
                color={urgencyColors[urgency] || 'default'}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>

        {/* Presets */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Quick Presets
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
          {[
            { key: 'balanced', label: 'Balanced' },
            { key: 'cost', label: 'Cost Optimized' },
            { key: 'quality', label: 'Quality First' },
            { key: 'fair', label: 'Fair Distribution' },
          ].map(p => (
            <Chip
              key={p.key}
              label={p.label}
              size="small"
              clickable
              onClick={() => applyPreset(p.key as any)}
              variant="outlined"
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Weight sliders */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Optimization Weights
        </Typography>
        <Stack spacing={1.5}>
          {weightConfig.map(({ key, label, icon: Icon, description }) => (
            <Box key={key}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: -0.5 }}>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <Typography variant="body2" sx={{ flex: 1 }}>{label}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{weights[key]}</Typography>
              </Stack>
              <Slider
                value={weights[key]}
                onChange={(_, v) => handleWeightChange(key, v as number)}
                min={0}
                max={100}
                size="small"
                sx={{ ml: 3.5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5, mt: -1, display: 'block' }}>
                {description}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Warning */}
        {openShifts.some(os => os.urgency === 'critical') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start', bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 1, p: 1.5 }}>
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <Typography variant="caption">
              Critical shifts will be prioritized first regardless of weights.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={() => onConfirm(weights)} variant="contained" startIcon={<Zap className="h-4 w-4" />}>
          Fill {totalPositions} Position{totalPositions !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}