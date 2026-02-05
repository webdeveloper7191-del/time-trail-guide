import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Switch,
  Slider,
  Paper,
  LinearProgress,
  Collapse,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { cn } from '@/lib/utils';
import {
  Settings,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  DollarSign,
  Users,
  Shield,
  Clock,
  Target,
  Heart,
  Repeat,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  GripVertical,
  Download,
  Upload,
  Bookmark,
  BookmarkPlus,
  TrendingUp,
  Timer,
  Activity,
  Sparkles,
  Baby,
  GraduationCap,
  Building2,
  HeartPulse,
  Scale,
  Calendar,
  BadgeCheck,
  ShieldCheck,
  Factory,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';
import {
  TimefoldConstraint,
  TimefoldSolverConfig,
  ConstraintCategory,
  ConstraintLevel,
  ConstraintParameter,
  defaultSolverConfig,
  defaultConstraints,
  solverPresets,
  validateConstraintConfig,
  ConstraintPreset,
  TimefoldSolution,
} from '@/lib/timefoldSolver';
import {
  IndustryType,
  getIndustryConfig,
  getIndustrySolverConfig,
  listAvailableIndustries,
  industryConfigs,
} from '@/lib/timefold/industryConstraints';
import {
  allChildcareConstraints,
  childcarePresets,
  nqfRatioConstraints,
  qualificationConstraints as childcareQualificationConstraints,
  availabilityConstraints as childcareAvailabilityConstraints,
  complianceConstraints as childcareComplianceConstraints,
  qualityConstraints as childcareQualityConstraints,
  demandConstraints,
  budgetConstraints as childcareBudgetConstraints,
  awardConstraints,
  fairnessConstraints as childcareFairnessConstraints,
} from '@/lib/timefold/childcareConstraints';
import {
  allAgedCareConstraints,
  agedCarePresets,
  agedCareConstraintGroups,
  rnCoverageConstraints,
  qualificationConstraints as agedCareQualificationConstraints,
  skillsMixConstraints,
  availabilityConstraints as agedCareAvailabilityConstraints,
  complianceConstraints as agedCareComplianceConstraints,
  qualityConstraints as agedCareQualityConstraints,
  careMinuteTrackingConstraints,
  budgetConstraints as agedCareBudgetConstraints,
  fairnessConstraints as agedCareFairnessConstraints,
} from '@/lib/timefold/agedCareConstraints';

interface TimefoldConstraintPanelProps {
  open: boolean;
  onClose: () => void;
  config: TimefoldSolverConfig;
  onConfigChange: (config: TimefoldSolverConfig) => void;
  onSolve?: () => void;
  isSolving?: boolean;
  lastSolution?: TimefoldSolution | null;
}

// Extended category icons including regulatory
const categoryIcons: Record<string, typeof Clock> = {
  availability: Clock,
  qualification: GraduationCap,
  capacity: Users,
  fairness: Scale,
  cost: DollarSign,
  preference: Heart,
  compliance: Shield,
  continuity: Repeat,
  regulatory: ShieldCheck,
  ratio: Baby,
  demand: Calendar,
  budget: DollarSign,
  award: BadgeCheck,
};

// Extended category labels
const categoryLabels: Record<string, string> = {
  availability: 'Availability',
  qualification: 'Qualifications & Certifications',
  capacity: 'Capacity & Ratios',
  fairness: 'Fairness & Distribution',
  cost: 'Cost Optimization',
  preference: 'Staff Preferences',
  compliance: 'Compliance & Fatigue',
  continuity: 'Continuity & Quality',
  regulatory: 'NQF Regulatory',
  ratio: 'Staff-to-Child Ratios',
  demand: 'Demand & Bookings',
  budget: 'Budget Management',
  award: 'Award & Pay Rules',
};

// Childcare-specific category groupings for display
const childcareConstraintGroups = [
  {
    id: 'nqf_regulatory',
    name: 'NQF Regulatory Requirements',
    description: 'National Quality Framework mandatory requirements - must be satisfied',
    icon: ShieldCheck,
    isHardGroup: true,
    color: 'error' as const,
    constraints: [...nqfRatioConstraints, ...childcareQualificationConstraints.slice(0, 6)],
  },
  {
    id: 'availability_compliance',
    name: 'Availability & Compliance',
    description: 'Staff availability, leave, and Fair Work compliance',
    icon: Clock,
    isHardGroup: true,
    color: 'error' as const,
    constraints: [...childcareAvailabilityConstraints, ...childcareComplianceConstraints],
  },
  {
    id: 'quality_continuity',
    name: 'Quality & Continuity',
    description: 'Child attachment, skill matching, and care quality',
    icon: Heart,
    isHardGroup: false,
    color: 'warning' as const,
    constraints: childcareQualityConstraints,
  },
  {
    id: 'demand_capacity',
    name: 'Demand & Capacity',
    description: 'Booking patterns, attendance, and peak hours',
    icon: Calendar,
    isHardGroup: false,
    color: 'info' as const,
    constraints: demandConstraints,
  },
  {
    id: 'cost_budget',
    name: 'Cost & Budget',
    description: 'Labour costs, overtime, and budget management',
    icon: DollarSign,
    isHardGroup: false,
    color: 'info' as const,
    constraints: childcareBudgetConstraints,
  },
  {
    id: 'award_pay',
    name: 'Award & Pay Rules',
    description: "Children's Services Award 2020 compliance",
    icon: BadgeCheck,
    isHardGroup: false,
    color: 'warning' as const,
    constraints: awardConstraints,
  },
  {
    id: 'fairness_preferences',
    name: 'Fairness & Preferences',
    description: 'Fair distribution and staff preferences',
    icon: Scale,
    isHardGroup: false,
    color: 'info' as const,
    constraints: childcareFairnessConstraints,
  },
];

const levelColors: Record<ConstraintLevel, 'error' | 'warning' | 'info'> = {
  HARD: 'error',
  MEDIUM: 'warning',
  SOFT: 'info',
};

const levelLabels: Record<ConstraintLevel, string> = {
  HARD: 'Must satisfy',
  MEDIUM: 'Strongly prefer',
  SOFT: 'Nice to have',
};

// Industry icons
const industryIcons: Record<IndustryType, typeof Building2> = {
  childcare: Baby,
  aged_care: HeartPulse,
  disability_services: Heart,
  hospitality: Building2,
  retail: Building2,
  healthcare: HeartPulse,
  education: GraduationCap,
  general: Factory,
};

export function TimefoldConstraintPanel({
  open,
  onClose,
  config,
  onConfigChange,
  onSolve,
  isSolving = false,
  lastSolution,
}: TimefoldConstraintPanelProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('childcare');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['nqf_regulatory', 'availability_compliance'])
  );
  const [editingConstraint, setEditingConstraint] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [savedPresets, setSavedPresets] = useState<ConstraintPreset[]>(() => {
    const stored = localStorage.getItem('timefold-presets');
    return stored ? JSON.parse(stored) : [];
  });

  // Get available industries
  const availableIndustries = useMemo(() => listAvailableIndustries(), []);
  const currentIndustryConfig = useMemo(() => getIndustryConfig(selectedIndustry), [selectedIndustry]);

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timefold-presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Switch industry and load constraints
  const handleIndustryChange = (industry: IndustryType) => {
    setSelectedIndustry(industry);
    const industryConfig = getIndustrySolverConfig(industry);
    
    if (industryConfig.constraints.length > 0) {
      onConfigChange({
        ...config,
        constraints: industryConfig.constraints,
        categoryWeights: industryConfig.categoryWeights as any,
      });
      toast.success(`Loaded ${getIndustryConfig(industry).name} constraints`);
    } else {
      toast.info(`${getIndustryConfig(industry).name} constraints coming soon - using default`);
    }
  };

  const validationErrors = useMemo(() => validateConstraintConfig(config), [config]);

  // Calculate NQF compliance summary
  const nqfComplianceSummary = useMemo(() => {
    if (selectedIndustry !== 'childcare') return null;
    
    const hardConstraints = config.constraints.filter(c => c.level === 'HARD');
    const enabledHard = hardConstraints.filter(c => c.enabled);
    const disabledHard = hardConstraints.filter(c => !c.enabled);
    
    return {
      totalHard: hardConstraints.length,
      enabledHard: enabledHard.length,
      disabledHard: disabledHard.length,
      isCompliant: disabledHard.length === 0,
      disabledNames: disabledHard.map(c => c.name),
    };
  }, [config.constraints, selectedIndustry]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const updateConstraint = (constraintId: string, updates: Partial<TimefoldConstraint>) => {
    onConfigChange({
      ...config,
      constraints: config.constraints.map(c =>
        c.id === constraintId ? { ...c, ...updates } : c
      ),
    });
  };

  const updateConstraintParameter = (constraintId: string, paramKey: string, value: any) => {
    onConfigChange({
      ...config,
      constraints: config.constraints.map(c =>
        c.id === constraintId
          ? {
              ...c,
              parameters: {
                ...c.parameters,
                [paramKey]: { ...c.parameters[paramKey], value },
              },
            }
          : c
      ),
    });
  };

  const applyPreset = (presetKey: string) => {
    // Check if it's a childcare preset
    if (selectedIndustry === 'childcare' && childcarePresets[presetKey as keyof typeof childcarePresets]) {
      const preset = childcarePresets[presetKey as keyof typeof childcarePresets];
      onConfigChange({
        ...config,
        categoryWeights: preset.categoryWeights as any,
        optimizationGoal: presetKey as any,
      });
      toast.success(`Applied "${preset.name}" preset`);
      return;
    }
    
    // Fall back to default presets
    const preset = solverPresets[presetKey];
    if (preset) {
      onConfigChange({
        ...config,
        ...preset,
        categoryWeights: { ...config.categoryWeights, ...preset.categoryWeights },
      });
      toast.success(`Applied "${presetKey.replace('_', ' ')}" preset`);
    }
  };

  const resetToDefaults = () => {
    if (selectedIndustry === 'childcare') {
      const industryConfig = getIndustrySolverConfig('childcare');
      onConfigChange({
        ...defaultSolverConfig,
        constraints: industryConfig.constraints,
        categoryWeights: industryConfig.categoryWeights as any,
      });
    } else {
      onConfigChange(defaultSolverConfig);
    }
    toast.success('Reset to default configuration');
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    const newPreset: ConstraintPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
      config: { ...config },
      isBuiltIn: false,
    };
    
    setSavedPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowSavePresetDialog(false);
    toast.success(`Preset "${newPreset.name}" saved`);
  };

  const loadSavedPreset = (preset: ConstraintPreset) => {
    onConfigChange(preset.config);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deleteSavedPreset = (presetId: string) => {
    setSavedPresets(prev => prev.filter(p => p.id !== presetId));
    toast.success('Preset deleted');
  };

  const renderParameterInput = (constraint: TimefoldConstraint, param: ConstraintParameter) => {
    switch (param.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={param.value}
                onChange={(e) => updateConstraintParameter(constraint.id, param.key, e.target.checked)}
                disabled={!constraint.enabled}
              />
            }
            label={<Typography variant="caption">{param.label}</Typography>}
          />
        );
      
      case 'number':
        return (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {param.label} {param.unit && `(${param.unit})`}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                value={param.value}
                min={param.min || 0}
                max={param.max || 100}
                onChange={(_, value) => updateConstraintParameter(constraint.id, param.key, value)}
                disabled={!constraint.enabled}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                {param.value}
              </Typography>
            </Stack>
          </Box>
        );
      
      case 'time':
        return (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {param.label}
            </Typography>
            <Input
              type="time"
              value={param.value}
              onChange={(e) => updateConstraintParameter(constraint.id, param.key, e.target.value)}
              disabled={!constraint.enabled}
              className="h-8 text-sm"
            />
          </Box>
        );
      
      case 'select':
        return (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {param.label}
            </Typography>
            <Select
              value={param.value}
              onValueChange={(value) => updateConstraintParameter(constraint.id, param.key, value)}
              disabled={!constraint.enabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const renderConstraintCard = (constraint: TimefoldConstraint) => {
    const isExpanded = editingConstraint === constraint.id;
    const isNQFConstraint = constraint.id.startsWith('nqf-') || 
                           constraint.id.includes('qualified') || 
                           constraint.id.includes('wwc') ||
                           constraint.id.includes('first-aid') ||
                           constraint.id.includes('responsible-person');
    
    return (
      <Paper
        key={constraint.id}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1,
          opacity: constraint.enabled ? 1 : 0.6,
          borderColor: constraint.enabled ? 'divider' : 'action.disabled',
          borderLeft: isNQFConstraint ? '3px solid' : undefined,
          borderLeftColor: isNQFConstraint ? 'error.main' : undefined,
          transition: 'all 0.2s',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            size="small"
            checked={constraint.enabled}
            onChange={(e) => updateConstraint(constraint.id, { enabled: e.target.checked })}
          />
          
          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="body2" fontWeight="medium">
                {constraint.name}
              </Typography>
              <Chip
                size="small"
                label={constraint.level}
                color={levelColors[constraint.level]}
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
              {isNQFConstraint && (
                <Chip
                  size="small"
                  label="NQF"
                  color="error"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                  icon={<ShieldCheck size={10} />}
                />
              )}
              {constraint.isBuiltIn && (
                <Chip
                  size="small"
                  label="Built-in"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {constraint.description}
            </Typography>
          </Box>

          {constraint.level !== 'HARD' && (
            <Box sx={{ width: 80 }}>
              <Typography variant="caption" color="text.secondary">
                Weight: {constraint.weight}
              </Typography>
              <Slider
                size="small"
                value={constraint.weight}
                min={0}
                max={100}
                onChange={(_, value) => updateConstraint(constraint.id, { weight: value as number })}
                disabled={!constraint.enabled}
              />
            </Box>
          )}

          <IconButton
            size="small"
            onClick={() => setEditingConstraint(isExpanded ? null : constraint.id)}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </Stack>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              {/* Level selector */}
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Constraint Level
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={constraint.level}
                  exclusive
                  onChange={(_, value) => value && updateConstraint(constraint.id, { level: value })}
                  disabled={!constraint.enabled}
                >
                  <ToggleButton value="HARD" sx={{ px: 2 }}>
                    <AlertTriangle size={14} className="mr-1 text-destructive" />
                    Hard
                  </ToggleButton>
                  <ToggleButton value="MEDIUM" sx={{ px: 2 }}>
                    <Info size={14} className="mr-1 text-warning" />
                    Medium
                  </ToggleButton>
                  <ToggleButton value="SOFT" sx={{ px: 2 }}>
                    <CheckCircle2 size={14} className="mr-1 text-primary" />
                    Soft
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  {levelLabels[constraint.level]}
                </Typography>
              </Box>

              {/* Parameters */}
              {Object.keys(constraint.parameters).length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight="medium" color="text.secondary" gutterBottom>
                    Parameters
                  </Typography>
                  <Stack spacing={1.5}>
                    {Object.values(constraint.parameters).map(param => (
                      <Box key={param.key}>
                        {renderParameterInput(constraint, param)}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    );
  };

  // Get constraints for display (use childcare groups for childcare, otherwise category-based)
  const displayGroups = useMemo(() => {
    if (selectedIndustry === 'childcare') {
      return childcareConstraintGroups.map(group => ({
        ...group,
        constraints: group.constraints.map(c => 
          config.constraints.find(cc => cc.id === c.id) || c
        ),
      }));
    }
    
    // For other industries, group by category
    const grouped: Record<ConstraintCategory, TimefoldConstraint[]> = {
      availability: [],
      qualification: [],
      capacity: [],
      fairness: [],
      cost: [],
      preference: [],
      compliance: [],
      continuity: [],
    };
    
    config.constraints.forEach(c => {
      grouped[c.category].push(c);
    });
    
    return Object.entries(grouped)
      .filter(([_, constraints]) => constraints.length > 0)
      .map(([category, constraints]) => ({
        id: category,
        name: categoryLabels[category],
        description: '',
        icon: categoryIcons[category],
        isHardGroup: constraints.every(c => c.level === 'HARD'),
        color: constraints.every(c => c.level === 'HARD') ? 'error' as const : 'info' as const,
        constraints,
      }));
  }, [selectedIndustry, config.constraints]);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Timefold Solver Configuration"
      description="Configure constraints for AI shift optimization"
      icon={Zap}
      size="3xl"
    >
      <div className="space-y-4">
        {/* Industry Selector */}
        <FormSection title="Industry">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Select industry to load appropriate constraints
            </p>
            <Select value={selectedIndustry} onValueChange={(value) => handleIndustryChange(value as IndustryType)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableIndustries.map(industry => {
                  const Icon = industryIcons[industry.id];
                  return (
                    <SelectItem key={industry.id} value={industry.id}>
                      <div className="flex items-center gap-2">
                        <Icon size={14} />
                        <span>{industry.name}</span>
                        {!industry.isImplemented && (
                          <span className="text-xs text-muted-foreground">(Coming soon)</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Industry Notes */}
          {currentIndustryConfig.regulatoryNotes.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Regulatory Requirements:
              </p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {currentIndustryConfig.regulatoryNotes.slice(0, 4).map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </FormSection>

        {/* NQF Compliance Summary (Childcare only) */}
        {selectedIndustry === 'childcare' && nqfComplianceSummary && (
          <div 
            className={cn(
              "p-4 rounded-lg text-white",
              nqfComplianceSummary.isCompliant ? "bg-success" : "bg-destructive"
            )}
          >
            <div className="flex items-center gap-4">
              {nqfComplianceSummary.isCompliant ? (
                <CheckCircle2 size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">NQF Compliance Status</p>
                <p className="text-xs opacity-90">
                  {nqfComplianceSummary.isCompliant 
                    ? `All ${nqfComplianceSummary.totalHard} regulatory constraints enabled`
                    : `${nqfComplianceSummary.disabledHard} of ${nqfComplianceSummary.totalHard} regulatory constraints disabled`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {nqfComplianceSummary.enabledHard}/{nqfComplianceSummary.totalHard}
                </p>
                <p className="text-xs">Hard Constraints</p>
              </div>
            </div>
            
            {!nqfComplianceSummary.isCompliant && nqfComplianceSummary.disabledNames.length > 0 && (
              <div className="mt-3 p-2 bg-white/10 rounded">
                <p className="text-xs font-medium">⚠️ Disabled constraints that may breach NQF:</p>
                <p className="text-xs">{nqfComplianceSummary.disabledNames.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert severity="warning">
            <Typography variant="subtitle2">Configuration Issues</Typography>
            <ul className="list-disc list-inside text-sm mt-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Work Saved Metrics - Show after solving */}
        {lastSolution && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.main', color: 'success.contrastText' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Sparkles size={20} />
              <Typography variant="subtitle2">AI Optimization Results</Typography>
            </Stack>
            
            <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
              <Box textAlign="center" sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Timer size={20} className="mx-auto mb-1" />
                <Typography variant="h5" fontWeight="bold">
                  {lastSolution.workSavedMetrics.timeSavedMinutes}
                </Typography>
                <Typography variant="caption" display="block">Minutes Saved</Typography>
              </Box>
              
              <Box textAlign="center" sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <TrendingUp size={20} className="mx-auto mb-1" />
                <Typography variant="h5" fontWeight="bold">
                  {lastSolution.workSavedMetrics.efficiencyPercentage}%
                </Typography>
                <Typography variant="caption" display="block">Efficiency Gain</Typography>
              </Box>
              
              <Box textAlign="center" sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Activity size={20} className="mx-auto mb-1" />
                <Typography variant="h5" fontWeight="bold">
                  {lastSolution.workSavedMetrics.shiftsPerMinute}
                </Typography>
                <Typography variant="caption" display="block">Shifts/Minute</Typography>
              </Box>
              
              <Box textAlign="center" sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <CheckCircle2 size={20} className="mx-auto mb-1" />
                <Typography variant="h5" fontWeight="bold">
                  {lastSolution.workSavedMetrics.optimalAssignmentsFound}
                </Typography>
                <Typography variant="caption" display="block">Assigned</Typography>
              </Box>
            </Box>
            
            <Stack direction="row" justifyContent="space-between" mt={2} sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
              <span>Manual time: ~{lastSolution.workSavedMetrics.estimatedManualTimeMinutes} min</span>
              <span>Solver time: {lastSolution.workSavedMetrics.actualSolverTimeSeconds.toFixed(1)}s</span>
              <span>Moves: {lastSolution.movesEvaluated.toLocaleString()}</span>
              <span>Constraints: {lastSolution.workSavedMetrics.constraintsEvaluated}</span>
            </Stack>
          </Paper>
        )}

        {/* Quick Presets */}
        <FormSection title="Quick Presets">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={() => setShowSavePresetDialog(true)}>
              <BookmarkPlus size={14} className="mr-1" />
              Save Current
            </Button>
          </div>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedIndustry === 'childcare' ? (
              <>
                <Chip
                  label="Compliance First"
                  variant={config.optimizationGoal === 'compliance_first' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('compliance_first')}
                  icon={<Shield size={14} />}
                  color="error"
                />
                <Chip
                  label="Balanced"
                  variant={config.optimizationGoal === 'balanced' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('balanced')}
                  icon={<Target size={14} />}
                />
                <Chip
                  label="Cost Focused"
                  variant={config.optimizationGoal === 'cost_focused' as any ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('cost_focused')}
                  icon={<DollarSign size={14} />}
                />
                <Chip
                  label="Staff Satisfaction"
                  variant={config.optimizationGoal === 'staff_satisfaction' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('staff_satisfaction')}
                  icon={<Heart size={14} />}
                />
                <Chip
                  label="Quality Care"
                  variant={config.optimizationGoal === 'quality_care' as any ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('quality_care')}
                  icon={<Baby size={14} />}
                />
              </>
            ) : (
              <>
                <Chip
                  label="Balanced"
                  variant={config.optimizationGoal === 'balanced' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('balanced')}
                  icon={<Target size={14} />}
                />
                <Chip
                  label="Cost Minimization"
                  variant={config.optimizationGoal === 'cost_minimization' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('cost_minimization')}
                  icon={<DollarSign size={14} />}
                />
                <Chip
                  label="Staff Satisfaction"
                  variant={config.optimizationGoal === 'staff_satisfaction' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('staff_satisfaction')}
                  icon={<Heart size={14} />}
                />
                <Chip
                  label="Compliance First"
                  variant={config.optimizationGoal === 'compliance_first' ? 'filled' : 'outlined'}
                  onClick={() => applyPreset('compliance_first')}
                  icon={<Shield size={14} />}
                />
              </>
            )}
          </Stack>
          
          {/* Saved Custom Presets */}
          {savedPresets.length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Saved Presets
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {savedPresets.map(preset => (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    variant="outlined"
                    onClick={() => loadSavedPreset(preset)}
                    onDelete={() => deleteSavedPreset(preset.id)}
                    icon={<Bookmark size={14} />}
                    title={preset.description || `Created ${new Date(preset.createdAt).toLocaleDateString()}`}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </FormSection>

        {/* Category Weights */}
        <FormSection title="Category Weights">
          <div className="flex justify-end mb-3">
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          
          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
            {(Object.keys(config.categoryWeights) as ConstraintCategory[]).map(category => {
              const Icon = categoryIcons[category] || Settings;
              return (
                <Box key={category}>
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                    <Icon size={12} className="text-muted-foreground" />
                    <Typography variant="caption" color="text.secondary">
                      {categoryLabels[category] || category}
                    </Typography>
                  </Stack>
                  <Slider
                    size="small"
                    value={config.categoryWeights[category]}
                    min={0}
                    max={100}
                    onChange={(_, value) =>
                      onConfigChange({
                        ...config,
                        categoryWeights: {
                          ...config.categoryWeights,
                          [category]: value as number,
                        },
                      })
                    }
                    valueLabelDisplay="auto"
                  />
                </Box>
              );
            })}
          </Box>
        </FormSection>

        {/* Solver Settings */}
        <Collapse in={showAdvanced}>
          <FormSection title="Solver Settings" className="mb-4">
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Label className="text-xs">Termination Time (seconds)</Label>
                <Input
                  type="number"
                  value={config.terminationTimeSeconds}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      terminationTimeSeconds: parseInt(e.target.value) || 30,
                    })
                  }
                  min={5}
                  max={300}
                  className="h-8"
                />
              </Box>
              <Box>
                <Label className="text-xs">Parallel Threads</Label>
                <Input
                  type="number"
                  value={config.moveThreadCount}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      moveThreadCount: parseInt(e.target.value) || 4,
                    })
                  }
                  min={1}
                  max={16}
                  className="h-8"
                />
              </Box>
            </Box>
          </FormSection>
        </Collapse>

        {/* Constraints by Group */}
        <FormSection title={`Constraints (${config.constraints.filter(c => c.enabled).length}/${config.constraints.length} enabled)`}>
          <div className="flex justify-end mb-2">
            {selectedIndustry === 'childcare' && (
              <Badge variant="outline" className="text-xs">
                <ShieldCheck size={12} className="mr-1" />
                NQF Compliant
              </Badge>
            )}
          </div>
          
          {displayGroups.map(group => {
            const Icon = group.icon;
            const isExpanded = expandedGroups.has(group.id);
            const enabledCount = group.constraints.filter(c => c.enabled).length;
            const hardCount = group.constraints.filter(c => c.level === 'HARD').length;
            
            return (
              <Box key={group.id} sx={{ mb: 1 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderLeft: group.isHardGroup ? '3px solid' : undefined,
                    borderLeftColor: group.isHardGroup ? 'error.main' : undefined,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => toggleGroup(group.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon size={18} className="text-muted-foreground" />
                    <Box flex={1}>
                      <Typography variant="subtitle2">
                        {group.name}
                      </Typography>
                      {group.description && (
                        <Typography variant="caption" color="text.secondary">
                          {group.description}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {hardCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {hardCount} HARD
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {enabledCount}/{group.constraints.length}
                      </Badge>
                    </Stack>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Stack>
                </Paper>
                
                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 2, pt: 1 }}>
                    {group.constraints.map(c => renderConstraintCard(c))}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </FormSection>

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw size={16} className="mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose}>
            <Save size={16} className="mr-2" />
            Save Configuration
          </Button>
          {onSolve && (
            <Button onClick={onSolve} disabled={isSolving || validationErrors.length > 0}>
              {isSolving ? (
                <>
                  <Pause size={16} className="mr-2" />
                  Solving...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Run Solver
                </>
              )}
            </Button>
          )}
        </Stack>

        {/* Info */}
        <Alert severity="info" icon={<Info size={20} />}>
          <Typography variant="body2">
            <strong>Timefold Integration:</strong> This panel configures constraints for the Timefold Solver.
            {selectedIndustry === 'childcare' && (
              <> NQF regulatory constraints are marked with a red border and must be enabled for compliance.</>
            )}
            {' '}Hard constraints must always be satisfied, while soft constraints are optimized based on their weights.
          </Typography>
        </Alert>
      </div>
      
      {/* Save Preset Dialog */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Constraint Preset</DialogTitle>
            <DialogDescription>
              Save your current constraint configuration as a reusable preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Holiday Season Config"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Input
                id="preset-description"
                placeholder="e.g., Optimized for high staff availability..."
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveAsPreset}>
              <Save size={16} className="mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrimaryOffCanvas>
  );
}
