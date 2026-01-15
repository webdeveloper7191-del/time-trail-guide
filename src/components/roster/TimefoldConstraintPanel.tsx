import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Switch,
  Slider,
  TextField,
  Divider,
  Paper,
  Alert,
  LinearProgress,
  Collapse,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface TimefoldConstraintPanelProps {
  open: boolean;
  onClose: () => void;
  config: TimefoldSolverConfig;
  onConfigChange: (config: TimefoldSolverConfig) => void;
  onSolve?: () => void;
  isSolving?: boolean;
  lastSolution?: TimefoldSolution | null;
}

const categoryIcons: Record<ConstraintCategory, typeof Clock> = {
  availability: Clock,
  qualification: Target,
  capacity: Users,
  fairness: Heart,
  cost: DollarSign,
  preference: Settings,
  compliance: Shield,
  continuity: Repeat,
};

const categoryLabels: Record<ConstraintCategory, string> = {
  availability: 'Availability',
  qualification: 'Qualifications',
  capacity: 'Capacity',
  fairness: 'Fairness',
  cost: 'Cost',
  preference: 'Preferences',
  compliance: 'Compliance',
  continuity: 'Continuity',
};

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

export function TimefoldConstraintPanel({
  open,
  onClose,
  config,
  onConfigChange,
  onSolve,
  isSolving = false,
  lastSolution,
}: TimefoldConstraintPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ConstraintCategory>>(
    new Set(['availability', 'qualification', 'capacity'])
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

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timefold-presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const validationErrors = useMemo(() => validateConstraintConfig(config), [config]);

  const constraintsByCategory = useMemo(() => {
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
    
    return grouped;
  }, [config.constraints]);

  const toggleCategory = (category: ConstraintCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
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
    onConfigChange(defaultSolverConfig);
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
    
    return (
      <Paper
        key={constraint.id}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1,
          opacity: constraint.enabled ? 1 : 0.6,
          borderColor: constraint.enabled ? 'divider' : 'action.disabled',
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
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight="medium">
                {constraint.name}
              </Typography>
              <Chip
                size="small"
                label={constraint.level}
                color={levelColors[constraint.level]}
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
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
                    <CheckCircle2 size={14} className="mr-1 text-blue-500" />
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

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Timefold Solver Configuration"
      description="Configure constraints for AI shift optimization"
      icon={Zap}
      size="3xl"
    >
      <Stack spacing={3}>
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
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">Quick Presets</Typography>
            <Button variant="outline" size="sm" onClick={() => setShowSavePresetDialog(true)}>
              <BookmarkPlus size={14} className="mr-1" />
              Save Current
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
        </Paper>

        {/* Category Weights */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2">Category Weights</Typography>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </Stack>
          
          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
            {(Object.keys(config.categoryWeights) as ConstraintCategory[]).map(category => {
              const Icon = categoryIcons[category];
              return (
                <Box key={category}>
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                    <Icon size={12} className="text-muted-foreground" />
                    <Typography variant="caption" color="text.secondary">
                      {categoryLabels[category]}
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
        </Paper>

        {/* Solver Settings */}
        <Collapse in={showAdvanced}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Solver Settings
            </Typography>
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
          </Paper>
        </Collapse>

        {/* Constraints by Category */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Constraints
          </Typography>
          
          {(Object.keys(constraintsByCategory) as ConstraintCategory[]).map(category => {
            const constraints = constraintsByCategory[category];
            if (constraints.length === 0) return null;
            
            const Icon = categoryIcons[category];
            const isExpanded = expandedCategories.has(category);
            const enabledCount = constraints.filter(c => c.enabled).length;
            
            return (
              <Box key={category} sx={{ mb: 1 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => toggleCategory(category)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon size={18} className="text-muted-foreground" />
                    <Typography variant="subtitle2" flex={1}>
                      {categoryLabels[category]}
                    </Typography>
                    <Badge variant="secondary" className="text-xs">
                      {enabledCount}/{constraints.length} enabled
                    </Badge>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Stack>
                </Paper>
                
                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 2, pt: 1 }}>
                    {constraints.map(renderConstraintCard)}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>

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
            Hard constraints must always be satisfied, while soft constraints are optimized based on their weights.
            Connect to a Timefold backend service for production use.
          </Typography>
        </Alert>
      </Stack>
      
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
