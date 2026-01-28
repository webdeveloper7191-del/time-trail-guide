import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Phone, 
  PhoneCall, 
  Plus, 
  Settings2, 
  Edit2, 
  Trash2, 
  Award, 
  Info,
  AlertTriangle,
  Layers,
  Link2Off,
  CheckCircle2,
  Calendar,
  Clock,
  Save
} from 'lucide-react';
import { OnCallPayCalculationPreview } from './OnCallPayCalculationPreview';
import { toast } from 'sonner';
import { 
  OnCallConfiguration, 
  DEFAULT_ON_CALL_CONFIGS, 
  AwardType,
  AWARD_NAMES 
} from '@/types/allowances';
import { OnCallSettingsEditor } from '../OnCallSettingsEditor';

// On-Call Allowance type with exclusion rules
interface OnCallAllowance {
  id: string;
  name: string;
  code: string;
  description: string;
  rateType: 'per_period' | 'per_hour' | 'daily';
  rate: number;
  weekendRate?: number;
  publicHolidayMultiplier?: number;
  applicableAwards: AwardType[];
  isActive: boolean;
  // Stackability settings
  stackable: boolean;
  excludesWith: string[]; // IDs of allowances that cannot stack with this one
  priority: number; // Higher priority wins when non-stackable conflicts occur
  // Trigger conditions
  triggerType: 'standby' | 'callback' | 'recall' | 'emergency';
  callbackMinimumHours?: number;
  callbackRateMultiplier?: number;
}

// Mock data for on-call allowances
const mockOnCallAllowances: OnCallAllowance[] = [
  {
    id: 'oncall-standby-1',
    name: 'On-Call Standby',
    code: 'ONCALL_STANDBY',
    description: 'Base allowance for being available on-call outside regular hours',
    rateType: 'per_period',
    rate: 15.42,
    weekendRate: 23.13,
    publicHolidayMultiplier: 2.0,
    applicableAwards: ['children_services', 'general'],
    isActive: true,
    stackable: true,
    excludesWith: [],
    priority: 1,
    triggerType: 'standby',
  },
  {
    id: 'oncall-callback-1',
    name: 'On-Call Callback',
    code: 'ONCALL_CALLBACK',
    description: 'Minimum hours paid when called back during on-call period',
    rateType: 'per_hour',
    rate: 52.50,
    applicableAwards: ['children_services', 'general'],
    isActive: true,
    stackable: true,
    excludesWith: ['oncall-recall-1'],
    priority: 2,
    triggerType: 'callback',
    callbackMinimumHours: 2,
    callbackRateMultiplier: 1.5,
  },
  {
    id: 'oncall-recall-1',
    name: 'On-Call Emergency Recall',
    code: 'ONCALL_RECALL',
    description: 'Emergency recall with 3-hour minimum at double time',
    rateType: 'per_hour',
    rate: 70.00,
    publicHolidayMultiplier: 2.5,
    applicableAwards: ['healthcare'],
    isActive: true,
    stackable: false,
    excludesWith: ['oncall-callback-1'],
    priority: 3,
    triggerType: 'recall',
    callbackMinimumHours: 3,
    callbackRateMultiplier: 2.0,
  },
];

export function OnCallAllowancePanel() {
  const [allowances, setAllowances] = useState<OnCallAllowance[]>(mockOnCallAllowances);
  const [onCallConfigs, setOnCallConfigs] = useState<Record<AwardType, OnCallConfiguration>>(DEFAULT_ON_CALL_CONFIGS);
  const [editingOnCallAward, setEditingOnCallAward] = useState<AwardType | null>(null);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<OnCallAllowance | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    rateType: 'per_period' as OnCallAllowance['rateType'],
    rate: '',
    weekendRate: '',
    publicHolidayMultiplier: '',
    applicableAwards: [] as AwardType[],
    stackable: true,
    excludesWith: [] as string[],
    priority: 1,
    triggerType: 'standby' as OnCallAllowance['triggerType'],
    callbackMinimumHours: '',
    callbackRateMultiplier: '',
  });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handleSaveOnCallConfig = (awardType: AwardType, config: OnCallConfiguration) => {
    setOnCallConfigs(prev => ({ ...prev, [awardType]: config }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      rateType: 'per_period',
      rate: '',
      weekendRate: '',
      publicHolidayMultiplier: '',
      applicableAwards: [],
      stackable: true,
      excludesWith: [],
      priority: 1,
      triggerType: 'standby',
      callbackMinimumHours: '',
      callbackRateMultiplier: '',
    });
    setEditingAllowance(null);
    setActiveTab('details');
  };

  const handleOpenSheet = (allowance?: OnCallAllowance) => {
    if (allowance) {
      setEditingAllowance(allowance);
      setFormData({
        name: allowance.name,
        code: allowance.code,
        description: allowance.description,
        rateType: allowance.rateType,
        rate: allowance.rate.toString(),
        weekendRate: allowance.weekendRate?.toString() || '',
        publicHolidayMultiplier: allowance.publicHolidayMultiplier?.toString() || '',
        applicableAwards: allowance.applicableAwards,
        stackable: allowance.stackable,
        excludesWith: allowance.excludesWith,
        priority: allowance.priority,
        triggerType: allowance.triggerType,
        callbackMinimumHours: allowance.callbackMinimumHours?.toString() || '',
        callbackRateMultiplier: allowance.callbackRateMultiplier?.toString() || '',
      });
    } else {
      resetForm();
    }
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name || !formData.rate) {
      toast.error('Please fill in required fields');
      return;
    }

    const newAllowance: OnCallAllowance = {
      id: editingAllowance?.id || `oncall-${Date.now()}`,
      name: formData.name,
      code: formData.code || formData.name.toUpperCase().replace(/\s+/g, '_'),
      description: formData.description,
      rateType: formData.rateType,
      rate: parseFloat(formData.rate),
      weekendRate: formData.weekendRate ? parseFloat(formData.weekendRate) : undefined,
      publicHolidayMultiplier: formData.publicHolidayMultiplier ? parseFloat(formData.publicHolidayMultiplier) : undefined,
      applicableAwards: formData.applicableAwards,
      isActive: editingAllowance?.isActive ?? true,
      stackable: formData.stackable,
      excludesWith: formData.excludesWith,
      priority: formData.priority,
      triggerType: formData.triggerType,
      callbackMinimumHours: formData.callbackMinimumHours ? parseFloat(formData.callbackMinimumHours) : undefined,
      callbackRateMultiplier: formData.callbackRateMultiplier ? parseFloat(formData.callbackRateMultiplier) : undefined,
    };

    if (editingAllowance) {
      setAllowances(prev => prev.map(a => a.id === editingAllowance.id ? newAllowance : a));
      toast.success('On-call allowance updated');
    } else {
      setAllowances(prev => [...prev, newAllowance]);
      toast.success('On-call allowance created');
    }

    handleCloseSheet();
  };

  const handleDelete = (id: string) => {
    setAllowances(prev => prev.filter(a => a.id !== id));
    // Also remove from exclusions
    setAllowances(prev => prev.map(a => ({
      ...a,
      excludesWith: a.excludesWith.filter(exId => exId !== id)
    })));
    toast.success('On-call allowance deleted');
  };

  const toggleAllowance = (id: string) => {
    setAllowances(prev => prev.map(a =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const toggleExclusion = (allowanceId: string) => {
    setFormData(prev => ({
      ...prev,
      excludesWith: prev.excludesWith.includes(allowanceId)
        ? prev.excludesWith.filter(id => id !== allowanceId)
        : [...prev.excludesWith, allowanceId]
    }));
  };

  const getTriggerLabel = (type: OnCallAllowance['triggerType']) => {
    switch (type) {
      case 'standby': return 'Standby';
      case 'callback': return 'Callback';
      case 'recall': return 'Recall';
      case 'emergency': return 'Emergency';
    }
  };

  const getTriggerColor = (type: OnCallAllowance['triggerType']) => {
    switch (type) {
      case 'standby': return 'bg-blue-500/10 text-blue-700';
      case 'callback': return 'bg-amber-500/10 text-amber-700';
      case 'recall': return 'bg-orange-500/10 text-orange-700';
      case 'emergency': return 'bg-red-500/10 text-red-700';
    }
  };

  // Get available allowances for exclusion (excluding current)
  const availableForExclusion = allowances.filter(a => a.id !== editingAllowance?.id);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="card-material-elevated border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">On-Call Allowance Configuration</CardTitle>
                <CardDescription>
                  Manage standby, callback, and recall allowances for on-call shifts
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenSheet()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add On-Call Allowance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            On-call employees receive a standby allowance for being available, plus additional callback payment if actually called in to work. 
            Configure stacking rules to control how multiple allowances combine.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowances.length}</p>
                <p className="text-sm text-muted-foreground">Total Allowances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowances.filter(a => a.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowances.filter(a => a.stackable).length}</p>
                <p className="text-sm text-muted-foreground">Stackable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Link2Off className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowances.filter(a => a.excludesWith.length > 0).length}</p>
                <p className="text-sm text-muted-foreground">With Exclusions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Calculation Preview */}
      <OnCallPayCalculationPreview allowances={allowances} />

      {/* Allowances List */}
      <div className="grid gap-4">
        {allowances.map(allowance => (
          <Card key={allowance.id} className={`card-material transition-all ${!allowance.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTriggerColor(allowance.triggerType)}`}>
                    {allowance.triggerType === 'standby' ? <Phone className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{allowance.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{allowance.code}</Badge>
                      <Badge className={getTriggerColor(allowance.triggerType)}>
                        {getTriggerLabel(allowance.triggerType)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      {allowance.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          {allowance.stackable ? (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Layers className="h-3 w-3" />
                              Stackable
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs bg-orange-500/10 text-orange-700">
                              <Link2Off className="h-3 w-3" />
                              Non-Stackable
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {allowance.stackable 
                          ? allowance.excludesWith.length > 0
                            ? `Can stack with other allowances EXCEPT: ${allowance.excludesWith.map(id => allowances.find(a => a.id === id)?.name || id).join(', ')}`
                            : 'Can stack with all other allowances'
                          : 'Cannot stack with other allowances. Uses priority when conflicts occur.'
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {allowance.excludesWith.length > 0 && (
                    <Badge variant="outline" className="gap-1 text-xs text-purple-600">
                      {allowance.excludesWith.length} exclusion{allowance.excludesWith.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Switch 
                    checked={allowance.isActive}
                    onCheckedChange={() => toggleAllowance(allowance.id)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleOpenSheet(allowance)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(allowance.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Base Rate</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(allowance.rate)}</p>
                  <p className="text-xs text-muted-foreground">/{allowance.rateType.replace('per_', '')}</p>
                </div>
                {allowance.weekendRate && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Weekend</p>
                    <p className="text-lg font-bold">{formatCurrency(allowance.weekendRate)}</p>
                    <p className="text-xs text-muted-foreground">per period</p>
                  </div>
                )}
                {allowance.publicHolidayMultiplier && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Holiday</p>
                    <p className="text-lg font-bold text-emerald-600">{allowance.publicHolidayMultiplier}x</p>
                    <p className="text-xs text-muted-foreground">multiplier</p>
                  </div>
                )}
                {allowance.callbackMinimumHours && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Min Hours</p>
                    <p className="text-lg font-bold text-amber-600">{allowance.callbackMinimumHours}h</p>
                    <p className="text-xs text-muted-foreground">minimum paid</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
                  <p className="text-lg font-bold">{allowance.priority}</p>
                  <p className="text-xs text-muted-foreground">conflict order</p>
                </div>
              </div>
              {allowance.applicableAwards.length > 0 && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Applies to:</span>
                  {allowance.applicableAwards.map(award => (
                    <Badge key={award} variant="outline" className="text-xs">
                      {AWARD_NAMES[award]}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {allowances.length === 0 && (
        <Card className="card-material">
          <CardContent className="p-8 text-center">
            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No On-Call Allowances</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first on-call allowance to manage standby and callback rates.
            </p>
            <Button onClick={() => handleOpenSheet()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add On-Call Allowance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Award Configurations Section */}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Award-Level On-Call Defaults
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure default on-call rates for each award. These serve as base rates when no specific allowance is defined.
        </p>
        <div className="grid gap-4">
          {(Object.keys(AWARD_NAMES) as AwardType[]).map(awardType => {
            const config = onCallConfigs[awardType];
            return (
              <Card key={awardType} className="card-material">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{AWARD_NAMES[awardType]}</CardTitle>
                        <CardDescription className="text-xs">
                          Default on-call configuration
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingOnCallAward(awardType)}
                      className="gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Edit Defaults
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Standby Rate</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(config.standbyRate)}</p>
                      <p className="text-xs text-muted-foreground">per {config.standbyRateType.replace('_', ' ')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Callback Minimum</p>
                      <p className="text-lg font-bold text-amber-600">{config.callbackMinimumHours}h</p>
                      <p className="text-xs text-muted-foreground">at {config.callbackRateMultiplier}x rate</p>
                    </div>
                    {config.weekendStandbyRate && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Weekend Standby</p>
                        <p className="text-lg font-bold">{formatCurrency(config.weekendStandbyRate)}</p>
                        <p className="text-xs text-muted-foreground">per period</p>
                      </div>
                    )}
                    {config.publicHolidayStandbyMultiplier && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Holiday</p>
                        <p className="text-lg font-bold text-emerald-600">{config.publicHolidayStandbyMultiplier}x</p>
                        <p className="text-xs text-muted-foreground">standby multiplier</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* On-Call Settings Editor Dialog */}
      {editingOnCallAward && (
        <OnCallSettingsEditor
          awardType={editingOnCallAward}
          currentConfig={onCallConfigs[editingOnCallAward]}
          onSave={(config) => handleSaveOnCallConfig(editingOnCallAward, config)}
          open={!!editingOnCallAward}
          onClose={() => setEditingOnCallAward(null)}
        />
      )}

      {/* Add/Edit On-Call Allowance Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              {editingAllowance ? 'Edit On-Call Allowance' : 'Add On-Call Allowance'}
            </SheetTitle>
            <SheetDescription>
              Configure on-call allowance details, rates, and stacking rules.
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="stacking">Stacking Rules</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input 
                  placeholder="e.g., On-Call Standby"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input 
                  placeholder="e.g., ONCALL_STANDBY"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Auto-generated if left empty</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe when this allowance applies..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select 
                  value={formData.triggerType}
                  onValueChange={(value: OnCallAllowance['triggerType']) => setFormData(prev => ({ ...prev, triggerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standby">Standby - Being available on-call</SelectItem>
                    <SelectItem value="callback">Callback - Called back to work</SelectItem>
                    <SelectItem value="recall">Recall - Emergency recall</SelectItem>
                    <SelectItem value="emergency">Emergency - Critical response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applicable Awards</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(AWARD_NAMES) as AwardType[]).map(award => (
                    <div key={award} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`award-${award}`}
                        checked={formData.applicableAwards.includes(award)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            applicableAwards: checked
                              ? [...prev.applicableAwards, award]
                              : prev.applicableAwards.filter(a => a !== award)
                          }));
                        }}
                      />
                      <Label htmlFor={`award-${award}`} className="text-sm">
                        {AWARD_NAMES[award]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Rates Tab */}
            <TabsContent value="rates" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Rate ($) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate Type</Label>
                  <Select 
                    value={formData.rateType}
                    onValueChange={(value: OnCallAllowance['rateType']) => setFormData(prev => ({ ...prev, rateType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_period">Per On-Call Period</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="daily">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Weekend Rate ($)
                  </Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Same as base"
                    value={formData.weekendRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekendRate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Public Holiday Multiplier
                  </Label>
                  <Input 
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.0"
                    value={formData.publicHolidayMultiplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, publicHolidayMultiplier: e.target.value }))}
                  />
                </div>
              </div>

              {(formData.triggerType === 'callback' || formData.triggerType === 'recall') && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Minimum Hours
                      </Label>
                      <Input 
                        type="number"
                        step="0.5"
                        placeholder="e.g., 2"
                        value={formData.callbackMinimumHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, callbackMinimumHours: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Min hours paid when called back</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Rate Multiplier</Label>
                      <Input 
                        type="number"
                        step="0.1"
                        placeholder="e.g., 1.5"
                        value={formData.callbackRateMultiplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, callbackRateMultiplier: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">e.g., 1.5 = time-and-a-half</p>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Stacking Rules Tab */}
            <TabsContent value="stacking" className="space-y-4 mt-4">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">How Stacking Works</p>
                      <p className="text-blue-700 mt-1">
                        <strong>Stackable ON:</strong> This allowance can combine with other allowances on the same shift, 
                        unless specifically excluded below.
                      </p>
                      <p className="text-blue-700 mt-1">
                        <strong>Stackable OFF:</strong> When multiple non-stackable allowances apply, 
                        only the one with the highest priority is paid.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Stackable</Label>
                  <p className="text-sm text-muted-foreground">Allow this allowance to combine with others</p>
                </div>
                <Switch 
                  checked={formData.stackable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, stackable: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority (for conflicts)</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Higher priority wins when non-stackable allowances conflict (1 = lowest priority)
                </p>
              </div>

              {formData.stackable && availableForExclusion.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2Off className="h-4 w-4 text-purple-600" />
                      <Label className="text-base">Mutual Exclusions</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select allowances that CANNOT be applied together with this one, even though both are stackable.
                    </p>
                    
                    <ScrollArea className="h-48 border rounded-lg p-3">
                      <div className="space-y-2">
                        {availableForExclusion.map(allowance => (
                          <div 
                            key={allowance.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              formData.excludesWith.includes(allowance.id) 
                                ? 'border-purple-300 bg-purple-50' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id={`exclude-${allowance.id}`}
                                checked={formData.excludesWith.includes(allowance.id)}
                                onCheckedChange={() => toggleExclusion(allowance.id)}
                              />
                              <div>
                                <Label htmlFor={`exclude-${allowance.id}`} className="font-medium cursor-pointer">
                                  {allowance.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">{allowance.code}</p>
                              </div>
                            </div>
                            <Badge className={getTriggerColor(allowance.triggerType)}>
                              {getTriggerLabel(allowance.triggerType)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {formData.excludesWith.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">Exclusion active</p>
                          <p>This allowance will NOT stack with {formData.excludesWith.length} selected allowance(s).</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!formData.stackable && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Non-stackable mode</p>
                    <p>When this allowance applies alongside other non-stackable allowances, only the highest priority one will be paid.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={handleCloseSheet} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {editingAllowance ? 'Update Allowance' : 'Create Allowance'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
