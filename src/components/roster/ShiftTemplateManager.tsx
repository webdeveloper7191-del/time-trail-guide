import { useState } from 'react';
import {
  Button,
  TextField,
  Chip,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import { ShiftTemplate, ShiftSpecialType, QualificationType, defaultShiftTemplates, shiftTypeLabels, shiftTypeDescriptions, qualificationLabels, roleLabels, StaffMember } from '@/types/roster';
import { Clock, Plus, Edit2, Trash2, Save, X, Check, Phone, Moon, ArrowLeftRight, AlertTriangle, ChevronDown, Zap, Car, TrendingUp, GraduationCap, Award, RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllowanceDropdownWithCreate } from './AllowanceDropdownWithCreate';
import { 
  AllowanceType, 
  AwardType,
  DEFAULT_ON_CALL_CONFIGS, 
  DEFAULT_SLEEPOVER_CONFIGS, 
  DEFAULT_BROKEN_SHIFT_CONFIGS 
} from '@/types/allowances';

interface ShiftTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  customTemplates: ShiftTemplate[];
  onSave: (templates: ShiftTemplate[]) => void;
}

const colorOptions = [
  'hsl(200, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(340, 65%, 50%)',
  'hsl(220, 70%, 55%)',
  'hsl(45, 80%, 45%)',
  'hsl(180, 55%, 45%)',
];

const shiftTypeIcons: Record<ShiftSpecialType, React.ReactNode> = {
  regular: <Clock size={14} />,
  on_call: <Phone size={14} />,
  sleepover: <Moon size={14} />,
  broken: <ArrowLeftRight size={14} />,
  recall: <AlertTriangle size={14} />,
  emergency: <Zap size={14} />,
};

const classificationLevels = [
  'Level 2.1', 'Level 2.2', 'Level 2.3',
  'Level 3.1', 'Level 3.2', 'Level 3.3',
  'Level 4.1', 'Level 4.2', 'Level 4.3',
  'Level 5.1', 'Level 5.2', 'Level 5.3',
  'Level 6.1', 'Level 6.2', 'Level 6.3',
];

const getEmptyTemplate = (): Partial<ShiftTemplate> => ({
  name: '',
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 30,
  color: colorOptions[0],
  shiftType: 'regular',
  requiredQualifications: [],
  minimumClassification: undefined,
  preferredRole: undefined,
  onCallSettings: undefined,
  sleepoverSettings: undefined,
  brokenShiftSettings: undefined,
  higherDutiesClassification: undefined,
  isRemoteLocation: false,
  defaultTravelKilometres: undefined,
  selectedAllowances: [],
});

export function ShiftTemplateManager({
  open,
  onClose,
  customTemplates,
  onSave
}: ShiftTemplateManagerProps) {
  // Merge default templates with custom templates, allowing overrides
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() => {
    const customIds = new Set(customTemplates.map(t => t.id));
    // Include default templates that haven't been customized, plus all custom templates
    const defaults = defaultShiftTemplates.filter(t => !customIds.has(t.id) && !customTemplates.some(c => c.id.startsWith(`custom-${t.id}`)));
    return [...defaults, ...customTemplates];
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ShiftTemplate>>(getEmptyTemplate());
  const [isAdding, setIsAdding] = useState(false);
  const [customAllowances, setCustomAllowances] = useState<AllowanceType[]>([]);

  // Track which templates are defaults vs custom
  const isDefaultTemplate = (id: string) => defaultShiftTemplates.some(t => t.id === id);

  const handleCreateAllowance = (allowance: AllowanceType) => {
    setCustomAllowances(prev => [...prev, allowance]);
  };

  const handleAdd = () => {
    if (!newTemplate.name?.trim()) return;

    const template: ShiftTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name.trim(),
      startTime: newTemplate.startTime || '09:00',
      endTime: newTemplate.endTime || '17:00',
      breakMinutes: newTemplate.breakMinutes || 30,
      color: newTemplate.color || colorOptions[0],
      shiftType: newTemplate.shiftType || 'regular',
      requiredQualifications: newTemplate.requiredQualifications || [],
      minimumClassification: newTemplate.minimumClassification,
      preferredRole: newTemplate.preferredRole,
      onCallSettings: newTemplate.shiftType === 'on_call' ? newTemplate.onCallSettings : undefined,
      sleepoverSettings: newTemplate.shiftType === 'sleepover' ? newTemplate.sleepoverSettings : undefined,
      brokenShiftSettings: newTemplate.shiftType === 'broken' ? newTemplate.brokenShiftSettings : undefined,
      higherDutiesClassification: newTemplate.higherDutiesClassification,
      isRemoteLocation: newTemplate.isRemoteLocation,
      defaultTravelKilometres: newTemplate.defaultTravelKilometres,
      selectedAllowances: newTemplate.selectedAllowances || [],
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate(getEmptyTemplate());
    setIsAdding(false);
  };

  const handleUpdate = (id: string, updates: Partial<ShiftTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const handleDelete = (id: string) => {
    if (isDefaultTemplate(id)) {
      // Reset default template to original values
      const original = defaultShiftTemplates.find(t => t.id === id);
      if (original) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...original } : t));
      }
    } else {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSave = () => {
    // Save all templates (both modified defaults and custom)
    onSave(templates);
    onClose();
  };

  const hasTemplateChanged = (template: ShiftTemplate) => {
    const original = defaultShiftTemplates.find(t => t.id === template.id);
    if (!original) return false;
    return JSON.stringify(original) !== JSON.stringify(template);
  };

  const calculateDuration = (start: string, end: string, breakMins: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    // Handle overnight shifts
    if (totalMins < 0) totalMins += 24 * 60;
    totalMins -= breakMins;
    return (totalMins / 60).toFixed(1);
  };

  const getShiftTypeChip = (shiftType?: ShiftSpecialType) => {
    if (!shiftType || shiftType === 'regular') return null;
    return (
      <Chip 
        size="small" 
        icon={<Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>{shiftTypeIcons[shiftType]}</Box>}
        label={shiftTypeLabels[shiftType]} 
        color={
          shiftType === 'on_call' ? 'warning' :
          shiftType === 'sleepover' ? 'info' :
          shiftType === 'broken' ? 'secondary' :
          shiftType === 'emergency' ? 'error' : 'default'
        }
        variant="outlined"
        sx={{ fontSize: '0.7rem' }}
      />
    );
  };

  // Pre-populate settings from award defaults when shift type changes
  const handleShiftTypeChange = (newType: ShiftSpecialType, template: Partial<ShiftTemplate>, onUpdate: (updates: Partial<ShiftTemplate>) => void) => {
    const award: AwardType = 'children_services'; // Default award, could be made configurable
    
    const updates: Partial<ShiftTemplate> = { shiftType: newType };
    
    if (newType === 'on_call') {
      const config = DEFAULT_ON_CALL_CONFIGS[award];
      updates.onCallSettings = {
        defaultStartTime: '18:00',
        defaultEndTime: '06:00',
        standbyRate: config.standbyRate,
        standbyRateType: config.standbyRateType,
        callbackMinimumHours: config.callbackMinimumHours,
        callbackRateMultiplier: config.callbackRateMultiplier,
        weekendStandbyRate: config.weekendStandbyRate,
        publicHolidayStandbyMultiplier: config.publicHolidayStandbyMultiplier,
      };
    } else if (newType === 'sleepover') {
      const config = DEFAULT_SLEEPOVER_CONFIGS[award];
      updates.sleepoverSettings = {
        bedtimeStart: '22:00',
        bedtimeEnd: '06:00',
        flatRate: config.flatRate,
        disturbanceRatePerHour: config.disturbanceRatePerHour,
        disturbanceMinimumHours: config.disturbanceMinimumHours,
        disturbanceRateMultiplier: config.disturbanceRateMultiplier,
        weekendFlatRate: config.weekendFlatRate,
        publicHolidayFlatRate: config.publicHolidayFlatRate,
      };
    } else if (newType === 'broken') {
      const config = DEFAULT_BROKEN_SHIFT_CONFIGS[award];
      updates.brokenShiftSettings = {
        firstShiftEnd: '11:00',
        secondShiftStart: '15:00',
        unpaidGapMinutes: 240,
        allowanceRate: config.allowanceRate,
        minimumGapMinutes: config.minimumGapMinutes,
        maximumGapMinutes: config.maximumGapMinutes,
        gapBonusRate: config.gapBonusRate,
      };
    }
    
    onUpdate(updates);
  };

  const renderShiftTypeSettings = (template: Partial<ShiftTemplate>, onUpdate: (updates: Partial<ShiftTemplate>) => void) => {
    const shiftType = template.shiftType || 'regular';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {/* Shift Type Selector */}
        <FormControl fullWidth size="small">
          <InputLabel>Shift Type</InputLabel>
          <Select
            value={shiftType}
            onChange={(e) => handleShiftTypeChange(e.target.value as ShiftSpecialType, template, onUpdate)}
            label="Shift Type"
          >
            {(Object.keys(shiftTypeLabels) as ShiftSpecialType[]).map(type => (
              <MenuItem key={type} value={type}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {shiftTypeIcons[type]}
                  <span>{shiftTypeLabels[type]}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          {shiftTypeDescriptions[shiftType]}
        </Typography>

        {/* On-Call Settings */}
        {shiftType === 'on_call' && (
          <Accordion defaultExpanded sx={{ bgcolor: 'action.hover' }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone size={14} />
                <Typography variant="body2" fontWeight={600}>On-Call Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Period Times */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="time"
                    value={template.onCallSettings?.defaultStartTime || '18:00'}
                    onChange={(e) => onUpdate({ 
                      onCallSettings: { ...template.onCallSettings, defaultStartTime: e.target.value } 
                    })}
                    label="On-Call Start"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="time"
                    value={template.onCallSettings?.defaultEndTime || '06:00'}
                    onChange={(e) => onUpdate({ 
                      onCallSettings: { ...template.onCallSettings, defaultEndTime: e.target.value } 
                    })}
                    label="On-Call End"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                
                {/* Standby Pay Settings */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                  Standby Pay (paid regardless of callback)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.onCallSettings?.standbyRate || 15.42}
                    onChange={(e) => onUpdate({ 
                      onCallSettings: { ...template.onCallSettings, standbyRate: parseFloat(e.target.value) || 0 } 
                    })}
                    label="Standby Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <FormControl size="small">
                    <InputLabel>Rate Type</InputLabel>
                    <Select
                      value={template.onCallSettings?.standbyRateType || 'per_period'}
                      onChange={(e) => onUpdate({ 
                        onCallSettings: { ...template.onCallSettings, standbyRateType: e.target.value as 'per_period' | 'per_hour' | 'daily' } 
                      })}
                      label="Rate Type"
                    >
                      <MenuItem value="per_period">Per Period</MenuItem>
                      <MenuItem value="per_hour">Per Hour</MenuItem>
                      <MenuItem value="daily">Per Day</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField
                  type="number"
                  value={template.onCallSettings?.weekendStandbyRate || ''}
                  onChange={(e) => onUpdate({ 
                    onCallSettings: { ...template.onCallSettings, weekendStandbyRate: parseFloat(e.target.value) || undefined } 
                  })}
                  label="Weekend Standby Rate ($)"
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Higher rate for Sat/Sun on-call"
                />
                
                {/* Callback Pay Settings */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                  Callback Pay (when called in)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.onCallSettings?.callbackMinimumHours || 2}
                    onChange={(e) => onUpdate({ 
                      onCallSettings: { ...template.onCallSettings, callbackMinimumHours: parseInt(e.target.value) || 2 } 
                    })}
                    label="Minimum Hours"
                    size="small"
                    inputProps={{ min: 1, max: 8 }}
                    helperText="Min hours paid when called back"
                  />
                  <TextField
                    type="number"
                    value={template.onCallSettings?.callbackRateMultiplier || 1.5}
                    onChange={(e) => onUpdate({ 
                      onCallSettings: { ...template.onCallSettings, callbackRateMultiplier: parseFloat(e.target.value) || 1.5 } 
                    })}
                    label="Rate Multiplier"
                    size="small"
                    inputProps={{ min: 1, max: 3, step: 0.25 }}
                    helperText="e.g. 1.5 = time-and-a-half"
                  />
                </Box>
                <TextField
                  type="number"
                  value={template.onCallSettings?.publicHolidayStandbyMultiplier || ''}
                  onChange={(e) => onUpdate({ 
                    onCallSettings: { ...template.onCallSettings, publicHolidayStandbyMultiplier: parseFloat(e.target.value) || undefined } 
                  })}
                  label="Public Holiday Multiplier"
                  size="small"
                  inputProps={{ min: 1, max: 3, step: 0.25 }}
                  helperText="Multiplier for public holiday callbacks"
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Sleepover Settings */}
        {shiftType === 'sleepover' && (
          <Accordion defaultExpanded sx={{ bgcolor: 'action.hover' }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Moon size={14} />
                <Typography variant="body2" fontWeight={600}>Sleepover Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Period Times */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="time"
                    value={template.sleepoverSettings?.bedtimeStart || '22:00'}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, bedtimeStart: e.target.value } 
                    })}
                    label="Bedtime Start"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="time"
                    value={template.sleepoverSettings?.bedtimeEnd || '06:00'}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, bedtimeEnd: e.target.value } 
                    })}
                    label="Bedtime End"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                
                {/* Flat Rate Pay Settings */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                  Flat Rate (paid for sleepover)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.flatRate || 69.85}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, flatRate: parseFloat(e.target.value) || 0 } 
                    })}
                    label="Flat Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.weekendFlatRate || ''}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, weekendFlatRate: parseFloat(e.target.value) || undefined } 
                    })}
                    label="Weekend Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.publicHolidayFlatRate || ''}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, publicHolidayFlatRate: parseFloat(e.target.value) || undefined } 
                    })}
                    label="Public Hol Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
                
                {/* Disturbance Pay Settings */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                  Disturbance Pay (when sleep is interrupted)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.disturbanceRatePerHour || 45.50}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, disturbanceRatePerHour: parseFloat(e.target.value) || 0 } 
                    })}
                    label="Hourly Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.disturbanceMinimumHours || 1}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, disturbanceMinimumHours: parseInt(e.target.value) || 1 } 
                    })}
                    label="Min Hours"
                    size="small"
                    inputProps={{ min: 1, max: 4 }}
                    helperText="Min paid per disturbance"
                  />
                  <TextField
                    type="number"
                    value={template.sleepoverSettings?.disturbanceRateMultiplier || 1.5}
                    onChange={(e) => onUpdate({ 
                      sleepoverSettings: { ...template.sleepoverSettings, disturbanceRateMultiplier: parseFloat(e.target.value) || 1.5 } 
                    })}
                    label="Rate Multiplier"
                    size="small"
                    inputProps={{ min: 1, max: 3, step: 0.25 }}
                    helperText="e.g. 1.5 = overtime"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Broken/Split Shift Settings */}
        {shiftType === 'broken' && (
          <Accordion defaultExpanded sx={{ bgcolor: 'action.hover' }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowLeftRight size={14} />
                <Typography variant="body2" fontWeight={600}>Split Shift Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Shift Times */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="time"
                    value={template.brokenShiftSettings?.firstShiftEnd || '11:00'}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, firstShiftEnd: e.target.value } 
                    })}
                    label="First Shift Ends"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="time"
                    value={template.brokenShiftSettings?.secondShiftStart || '15:00'}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, secondShiftStart: e.target.value } 
                    })}
                    label="Second Shift Starts"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <TextField
                  type="number"
                  value={template.brokenShiftSettings?.unpaidGapMinutes || 240}
                  onChange={(e) => onUpdate({ 
                    brokenShiftSettings: { ...template.brokenShiftSettings, unpaidGapMinutes: parseInt(e.target.value) || 0 } 
                  })}
                  label="Unpaid Gap (minutes)"
                  size="small"
                  inputProps={{ min: 60, max: 600 }}
                />
                
                {/* Allowance Pay Settings */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                  Broken Shift Allowance
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.brokenShiftSettings?.allowanceRate || 18.46}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, allowanceRate: parseFloat(e.target.value) || 0 } 
                    })}
                    label="Allowance Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Flat rate per broken shift"
                  />
                  <TextField
                    type="number"
                    value={template.brokenShiftSettings?.gapBonusRate || ''}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, gapBonusRate: parseFloat(e.target.value) || undefined } 
                    })}
                    label="Gap Bonus Rate ($)"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Per hour over minimum gap"
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    type="number"
                    value={template.brokenShiftSettings?.minimumGapMinutes || 60}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, minimumGapMinutes: parseInt(e.target.value) || 60 } 
                    })}
                    label="Min Gap (minutes)"
                    size="small"
                    inputProps={{ min: 30, max: 240 }}
                    helperText="Min gap to qualify"
                  />
                  <TextField
                    type="number"
                    value={template.brokenShiftSettings?.maximumGapMinutes || ''}
                    onChange={(e) => onUpdate({ 
                      brokenShiftSettings: { ...template.brokenShiftSettings, maximumGapMinutes: parseInt(e.target.value) || undefined } 
                    })}
                    label="Max Gap (minutes)"
                    size="small"
                    inputProps={{ min: 60, max: 600 }}
                    helperText="Max gap before different rules"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Additional Settings */}
        <Accordion defaultExpanded sx={{ bgcolor: 'action.hover' }}>
          <AccordionSummary expandIcon={<ChevronDown size={16} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={14} />
              <Typography variant="body2" fontWeight={600}>Additional Allowances</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Prebuilt Allowances Dropdown */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Select Allowances
                </Typography>
                <AllowanceDropdownWithCreate
                  selectedAllowances={template.selectedAllowances || []}
                  onAllowancesChange={(allowances) => onUpdate({ selectedAllowances: allowances })}
                  customAllowances={customAllowances}
                  onCreateAllowance={handleCreateAllowance}
                />
              </Box>

              <TextField
                value={template.higherDutiesClassification || ''}
                onChange={(e) => onUpdate({ higherDutiesClassification: e.target.value || undefined })}
                label="Higher Duties Classification"
                placeholder="e.g. Level 4.1"
                size="small"
                helperText="If this shift involves higher duties"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={template.isRemoteLocation || false}
                    onChange={(e) => onUpdate({ isRemoteLocation: e.target.checked })}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Car size={14} />
                    <Typography variant="body2">Remote Location</Typography>
                  </Box>
                }
              />
              
              {template.isRemoteLocation && (
                <TextField
                  type="number"
                  value={template.defaultTravelKilometres || ''}
                  onChange={(e) => onUpdate({ defaultTravelKilometres: parseInt(e.target.value) || undefined })}
                  label="Default Travel (km)"
                  placeholder="e.g. 50"
                  size="small"
                  inputProps={{ min: 0, max: 500 }}
                />
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Manage Shift Templates
          </SheetTitle>
          <SheetDescription>
            Create and manage reusable shift templates with allowance configurations
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 mt-6">
          {/* All Templates - Unified Editable List */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Shift Templates ({templates.length})
              </Typography>
              {!isAdding && (
                <Button variant="text" size="small" startIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
                  Add Template
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {templates.map(template => (
                <Box
                  key={template.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 2,
                    borderColor: editingId === template.id ? 'primary.main' : 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  {editingId === template.id ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                          <TabsTrigger value="basic">Basic</TabsTrigger>
                          <TabsTrigger value="requirements">Requirements</TabsTrigger>
                          <TabsTrigger value="type">Shift Type</TabsTrigger>
                          <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                          {/* Template Name */}
                          <TextField
                            value={template.name}
                            onChange={(e) => handleUpdate(template.id, { name: e.target.value })}
                            label="Template Name"
                            size="small"
                            fullWidth
                          />
                          
                          {/* Time Row */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField
                              type="time"
                              value={template.startTime}
                              onChange={(e) => handleUpdate(template.id, { startTime: e.target.value })}
                              label="Start Time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              type="time"
                              value={template.endTime}
                              onChange={(e) => handleUpdate(template.id, { endTime: e.target.value })}
                              label="End Time"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              type="number"
                              value={template.breakMinutes}
                              onChange={(e) => handleUpdate(template.id, { breakMinutes: parseInt(e.target.value) || 0 })}
                              label="Break (min)"
                              size="small"
                              inputProps={{ min: 0, max: 120 }}
                            />
                          </Box>
                        </TabsContent>

                        <TabsContent value="requirements" className="space-y-4">
                          {/* Qualifications */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <GraduationCap size={14} />
                              Required Qualifications
                            </Typography>
                            <FormControl fullWidth size="small">
                              <InputLabel>Qualifications</InputLabel>
                              <Select
                                multiple
                                value={template.requiredQualifications || []}
                                onChange={(e) => handleUpdate(template.id, { 
                                  requiredQualifications: e.target.value as QualificationType[] 
                                })}
                                label="Qualifications"
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as QualificationType[]).map((value) => (
                                      <Chip key={value} label={qualificationLabels[value]} size="small" />
                                    ))}
                                  </Box>
                                )}
                              >
                                {(Object.keys(qualificationLabels) as QualificationType[]).map((qual) => (
                                  <MenuItem key={qual} value={qual}>
                                    {qualificationLabels[qual]}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              Staff must have all selected qualifications
                            </Typography>
                          </Box>

                          {/* Classification Level */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Award size={14} />
                              Minimum Classification
                            </Typography>
                            <FormControl fullWidth size="small">
                              <InputLabel>Classification Level</InputLabel>
                              <Select
                                value={template.minimumClassification || ''}
                                onChange={(e) => handleUpdate(template.id, { 
                                  minimumClassification: e.target.value || undefined 
                                })}
                                label="Classification Level"
                              >
                                <MenuItem value="">
                                  <em>No minimum</em>
                                </MenuItem>
                                {classificationLevels.map((level) => (
                                  <MenuItem key={level} value={level}>
                                    {level}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              Minimum award classification required for this shift
                            </Typography>
                          </Box>

                          {/* Preferred Role */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Preferred Role
                            </Typography>
                            <FormControl fullWidth size="small">
                              <InputLabel>Role</InputLabel>
                              <Select
                                value={template.preferredRole || ''}
                                onChange={(e) => handleUpdate(template.id, { 
                                  preferredRole: (e.target.value || undefined) as StaffMember['role'] | undefined
                                })}
                                label="Role"
                              >
                                <MenuItem value="">
                                  <em>Any role</em>
                                </MenuItem>
                                {(Object.keys(roleLabels) as StaffMember['role'][]).map((role) => (
                                  <MenuItem key={role} value={role}>
                                    {roleLabels[role]}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              Preferred staff role for this shift type
                            </Typography>
                          </Box>
                        </TabsContent>

                        <TabsContent value="type">
                          {renderShiftTypeSettings(template, (updates) => handleUpdate(template.id, updates))}
                        </TabsContent>

                        <TabsContent value="appearance">
                          {/* Color Picker */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Color
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {colorOptions.map(color => (
                                <Box
                                  key={color}
                                  onClick={() => handleUpdate(template.id, { color })}
                                  sx={{
                                    height: 28,
                                    width: 28,
                                    borderRadius: '50%',
                                    border: 3,
                                    borderColor: template.color === color ? 'text.primary' : 'transparent',
                                    bgcolor: color,
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </TabsContent>
                      </Tabs>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button size="small" variant="outlined" onClick={() => setEditingId(null)} startIcon={<X size={14} />}>
                          Cancel
                        </Button>
                        <Button size="small" variant="contained" onClick={() => setEditingId(null)} startIcon={<Check size={14} />}>
                          Done
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ height: 20, width: 20, borderRadius: '50%', flexShrink: 0, bgcolor: template.color }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight={600}>{template.name}</Typography>
                          {getShiftTypeChip(template.shiftType)}
                          {isDefaultTemplate(template.id) && (
                            <Chip 
                              size="small" 
                              label={hasTemplateChanged(template) ? "Modified" : "Default"} 
                              variant="outlined"
                              color={hasTemplateChanged(template) ? "warning" : "default"}
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                          {template.requiredQualifications && template.requiredQualifications.length > 0 && (
                            <Chip 
                              size="small" 
                              icon={<GraduationCap size={12} />}
                              label={`${template.requiredQualifications.length} qual${template.requiredQualifications.length > 1 ? 's' : ''}`} 
                              variant="outlined"
                              color="info"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {template.minimumClassification && (
                            <Chip 
                              size="small" 
                              icon={<Award size={12} />}
                              label={template.minimumClassification} 
                              variant="outlined"
                              color="secondary"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                          {template.preferredRole && ` • ${roleLabels[template.preferredRole]}`}
                          {template.higherDutiesClassification && ` • HD: ${template.higherDutiesClassification}`}
                          {template.isRemoteLocation && ` • Remote`}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h`} />
                      <IconButton size="small" onClick={() => setEditingId(template.id)}>
                        <Edit2 size={16} />
                      </IconButton>
                      {isDefaultTemplate(template.id) ? (
                        <Tooltip title="Reset to default">
                          <span>
                            <IconButton 
                              size="small" 
                              color="warning" 
                              onClick={() => handleDelete(template.id)}
                              disabled={!hasTemplateChanged(template)}
                            >
                              <RotateCcw size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <IconButton size="small" color="error" onClick={() => handleDelete(template.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              ))}

              {/* Add new template form */}
              {isAdding && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 2,
                    borderColor: 'primary.main',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="requirements">Requirements</TabsTrigger>
                        <TabsTrigger value="type">Shift Type</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        {/* Template Name */}
                        <TextField
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          label="Template Name"
                          placeholder="e.g. Night Shift"
                          size="small"
                          fullWidth
                          autoFocus
                        />
                        
                        {/* Time Row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <TextField
                            type="time"
                            value={newTemplate.startTime}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, startTime: e.target.value }))}
                            label="Start Time"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            type="time"
                            value={newTemplate.endTime}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, endTime: e.target.value }))}
                            label="End Time"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            type="number"
                            value={newTemplate.breakMinutes}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                            label="Break (min)"
                            size="small"
                            inputProps={{ min: 0, max: 120 }}
                          />
                        </Box>
                      </TabsContent>

                      <TabsContent value="requirements" className="space-y-4">
                        {/* Qualifications */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <GraduationCap size={14} />
                            Required Qualifications
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel>Qualifications</InputLabel>
                            <Select
                              multiple
                              value={newTemplate.requiredQualifications || []}
                              onChange={(e) => setNewTemplate(prev => ({ 
                                ...prev, 
                                requiredQualifications: e.target.value as QualificationType[] 
                              }))}
                              label="Qualifications"
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(selected as QualificationType[]).map((value) => (
                                    <Chip key={value} label={qualificationLabels[value]} size="small" />
                                  ))}
                                </Box>
                              )}
                            >
                              {(Object.keys(qualificationLabels) as QualificationType[]).map((qual) => (
                                <MenuItem key={qual} value={qual}>
                                  {qualificationLabels[qual]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Staff must have all selected qualifications
                          </Typography>
                        </Box>

                        {/* Classification Level */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Award size={14} />
                            Minimum Classification
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel>Classification Level</InputLabel>
                            <Select
                              value={newTemplate.minimumClassification || ''}
                              onChange={(e) => setNewTemplate(prev => ({ 
                                ...prev, 
                                minimumClassification: e.target.value || undefined 
                              }))}
                              label="Classification Level"
                            >
                              <MenuItem value="">
                                <em>No minimum</em>
                              </MenuItem>
                              {classificationLevels.map((level) => (
                                <MenuItem key={level} value={level}>
                                  {level}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Minimum award classification required for this shift
                          </Typography>
                        </Box>

                        {/* Preferred Role */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Preferred Role
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel>Role</InputLabel>
                            <Select
                              value={newTemplate.preferredRole || ''}
                              onChange={(e) => setNewTemplate(prev => ({ 
                                ...prev, 
                                preferredRole: (e.target.value || undefined) as StaffMember['role'] | undefined
                              }))}
                              label="Role"
                            >
                              <MenuItem value="">
                                <em>Any role</em>
                              </MenuItem>
                              {(Object.keys(roleLabels) as StaffMember['role'][]).map((role) => (
                                <MenuItem key={role} value={role}>
                                  {roleLabels[role]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Preferred staff role for this shift type
                          </Typography>
                        </Box>
                      </TabsContent>

                      <TabsContent value="type">
                        {renderShiftTypeSettings(newTemplate, (updates) => setNewTemplate(prev => ({ ...prev, ...updates })))}
                      </TabsContent>

                      <TabsContent value="appearance">
                        {/* Color Picker */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Color
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {colorOptions.map(color => (
                              <Box
                                key={color}
                                onClick={() => setNewTemplate(prev => ({ ...prev, color }))}
                                sx={{
                                  height: 28,
                                  width: 28,
                                  borderRadius: '50%',
                                  border: 3,
                                  borderColor: newTemplate.color === color ? 'text.primary' : 'transparent',
                                  bgcolor: color,
                                  cursor: 'pointer',
                                  transition: 'transform 0.15s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </TabsContent>
                    </Tabs>
                    
                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Button size="small" variant="outlined" onClick={() => setIsAdding(false)} startIcon={<X size={14} />}>
                        Cancel
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={handleAdd} 
                        disabled={!newTemplate.name?.trim()}
                        startIcon={<Check size={14} />}
                      >
                        Add Template
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {templates.length === 0 && !isAdding && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2">No custom templates yet.</Typography>
                  <Typography variant="caption">Click "Add Template" to create one.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </ScrollArea>

        <SheetFooter className="mt-6 pt-4 border-t border-border shrink-0">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
