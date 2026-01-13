import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, Edit2, Trash2, DollarSign, Search, CheckCircle2, AlertCircle, 
  Building2, Filter, RotateCcw, Download, Moon, Phone, Clock, 
  ArrowUpCircle, Car, Zap, Info, Settings2
} from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Shift-based allowance categories
type AllowanceCategoryType = 
  | 'on_call' 
  | 'sleepover' 
  | 'broken_shift' 
  | 'higher_duties' 
  | 'travel'
  | 'qualification'
  | 'meal'
  | 'clothing'
  | 'other';

// Trigger types for automatic detection
type TriggerType = 'manual' | 'shift_type' | 'qualification' | 'role' | 'time_based' | 'location';

interface AllowanceTriggerConditions {
  shiftTypes?: ('on_call' | 'sleepover' | 'broken' | 'recall' | 'emergency')[];
  qualificationTypes?: string[];
  roleTypes?: string[];
  minBreakMinutes?: number;
  overnightRequired?: boolean;
  recallRequired?: boolean;
  higherClassification?: boolean;
  travelKilometres?: boolean;
  weekendOnly?: boolean;
  publicHolidayOnly?: boolean;
}

interface CustomAllowance {
  id: string;
  name: string;
  code: string;
  description: string;
  category: AllowanceCategoryType;
  type: 'per_hour' | 'per_shift' | 'per_week' | 'per_km' | 'per_day' | 'one_off';
  baseAmount: number;
  customAmount?: number;
  isOverridden: boolean;
  applicableAwards: string[];
  conditions?: string;
  isActive: boolean;
  // New trigger fields
  triggerType: TriggerType;
  triggerConditions?: AllowanceTriggerConditions;
  minimumEngagement?: number;
  maxPerPeriod?: number;
  requiresApproval: boolean;
  stackable: boolean;
  taxable: boolean;
  superIncluded: boolean;
}

const CATEGORY_CONFIG: Record<AllowanceCategoryType, { label: string; icon: typeof Moon; color: string }> = {
  on_call: { label: 'On-Call', icon: Phone, color: 'text-blue-600 bg-blue-500/10' },
  sleepover: { label: 'Sleepover', icon: Moon, color: 'text-purple-600 bg-purple-500/10' },
  broken_shift: { label: 'Broken Shift', icon: Clock, color: 'text-orange-600 bg-orange-500/10' },
  higher_duties: { label: 'Higher Duties', icon: ArrowUpCircle, color: 'text-emerald-600 bg-emerald-500/10' },
  travel: { label: 'Travel', icon: Car, color: 'text-amber-600 bg-amber-500/10' },
  qualification: { label: 'Qualification', icon: CheckCircle2, color: 'text-cyan-600 bg-cyan-500/10' },
  meal: { label: 'Meal', icon: DollarSign, color: 'text-rose-600 bg-rose-500/10' },
  clothing: { label: 'Clothing', icon: DollarSign, color: 'text-pink-600 bg-pink-500/10' },
  other: { label: 'Other', icon: DollarSign, color: 'text-gray-600 bg-gray-500/10' },
};

const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  manual: 'Manual Entry',
  shift_type: 'Shift Type Detection',
  qualification: 'Staff Qualification',
  role: 'Staff Role',
  time_based: 'Time-Based',
  location: 'Location-Based',
};

const mockAllowances: CustomAllowance[] = [
  {
    id: '1',
    name: 'On-Call Allowance',
    code: 'ON_CALL',
    description: 'For being available on-call outside regular hours',
    category: 'on_call',
    type: 'per_day',
    baseAmount: 15.42,
    customAmount: 18.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020'],
    conditions: 'When rostered for on-call duty',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { shiftTypes: ['on_call'] },
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: false,
  },
  {
    id: '2',
    name: 'On-Call Recall',
    code: 'ON_CALL_RECALL',
    description: 'Minimum 2 hours pay when recalled during on-call period',
    category: 'on_call',
    type: 'per_hour',
    baseAmount: 52.50,
    isOverridden: false,
    applicableAwards: ['children-services-2020'],
    conditions: 'When called in during on-call period',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { shiftTypes: ['recall'], recallRequired: true },
    minimumEngagement: 2,
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: true,
  },
  {
    id: '3',
    name: 'Sleepover Allowance',
    code: 'SLEEPOVER',
    description: 'For overnight sleepover shifts at the facility',
    category: 'sleepover',
    type: 'per_shift',
    baseAmount: 69.85,
    customAmount: 75.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020'],
    conditions: 'When required to sleep overnight at facility',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { shiftTypes: ['sleepover'], overnightRequired: true },
    maxPerPeriod: 1,
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: false,
  },
  {
    id: '4',
    name: 'Sleepover Disturbance',
    code: 'SLEEPOVER_DISTURBED',
    description: 'Additional pay when sleepover is disturbed - minimum 1 hour at overtime rates',
    category: 'sleepover',
    type: 'per_hour',
    baseAmount: 45.50,
    isOverridden: false,
    applicableAwards: ['children-services-2020'],
    conditions: 'When sleepover is disturbed',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { shiftTypes: ['sleepover'] },
    minimumEngagement: 1,
    requiresApproval: true,
    stackable: true,
    taxable: true,
    superIncluded: true,
  },
  {
    id: '5',
    name: 'Broken Shift Allowance',
    code: 'BROKEN_SHIFT',
    description: 'Paid when an employee works two separate shifts in a single day',
    category: 'broken_shift',
    type: 'per_shift',
    baseAmount: 18.46,
    customAmount: 20.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020'],
    conditions: 'When shift has unpaid break > 60 minutes',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { shiftTypes: ['broken'], minBreakMinutes: 60 },
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: true,
  },
  {
    id: '6',
    name: 'Higher Duties Allowance',
    code: 'HIGHER_DUTIES',
    description: 'When performing duties of a higher classification',
    category: 'higher_duties',
    type: 'per_hour',
    baseAmount: 2.50,
    customAmount: 3.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020', 'social-2020'],
    conditions: 'When acting in higher position',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { higherClassification: true },
    requiresApproval: true,
    stackable: false,
    taxable: true,
    superIncluded: true,
  },
  {
    id: '7',
    name: 'Vehicle Allowance',
    code: 'VEHICLE',
    description: 'For using personal vehicle for work duties',
    category: 'travel',
    type: 'per_km',
    baseAmount: 0.96,
    customAmount: 1.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020', 'social-2020'],
    conditions: 'Use of personal vehicle for work duties',
    isActive: true,
    triggerType: 'shift_type',
    triggerConditions: { travelKilometres: true },
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: false,
  },
  {
    id: '8',
    name: 'First Aid Allowance',
    code: 'FIRST_AID',
    description: 'For certified first-aiders',
    category: 'qualification',
    type: 'per_week',
    baseAmount: 18.93,
    customAmount: 22.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020'],
    conditions: 'Holder of current first aid certificate',
    isActive: true,
    triggerType: 'qualification',
    triggerConditions: { qualificationTypes: ['first_aid'] },
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: true,
  },
  {
    id: '9',
    name: 'Educational Leader Allowance',
    code: 'NQA_LEADERSHIP',
    description: 'For Educational Leaders under the National Quality Framework',
    category: 'qualification',
    type: 'per_hour',
    baseAmount: 2.34,
    isOverridden: false,
    applicableAwards: ['children-services-2020'],
    conditions: 'Appointed educational program leader',
    isActive: true,
    triggerType: 'role',
    triggerConditions: { roleTypes: ['lead_educator'] },
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: true,
  },
];

export function AllowanceRatesEditorPanel() {
  const [allowances, setAllowances] = useState<CustomAllowance[]>(mockAllowances);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<CustomAllowance | null>(null);
  const [newAllowance, setNewAllowance] = useState({
    name: '',
    code: '',
    description: '',
    category: 'other' as AllowanceCategoryType,
    type: 'per_week' as CustomAllowance['type'],
    amount: '',
    conditions: '',
    applicableAwards: [] as string[],
    triggerType: 'manual' as TriggerType,
    triggerConditions: {} as AllowanceTriggerConditions,
    minimumEngagement: undefined as number | undefined,
    maxPerPeriod: undefined as number | undefined,
    requiresApproval: false,
    stackable: true,
    taxable: true,
    superIncluded: false,
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'per_hour': return '/hour';
      case 'per_shift': return '/shift';
      case 'per_week': return '/week';
      case 'per_day': return '/day';
      case 'per_km': return '/km';
      case 'one_off': return 'one-off';
      default: return type;
    }
  };

  const getAwardName = (awardId: string) => {
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  // Filtered allowances
  const filteredAllowances = useMemo(() => {
    return allowances.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAward = selectedAwardFilter === 'all' || 
        a.applicableAwards.length === 0 || 
        a.applicableAwards.includes(selectedAwardFilter);
      const matchesType = selectedTypeFilter === 'all' || a.type === selectedTypeFilter;
      const matchesCustom = !showCustomOnly || a.isOverridden;
      return matchesSearch && matchesAward && matchesType && matchesCustom;
    });
  }, [allowances, searchQuery, selectedAwardFilter, selectedTypeFilter, showCustomOnly]);

  const resetForm = () => {
    setNewAllowance({ 
      name: '', 
      code: '',
      description: '',
      category: 'other',
      type: 'per_week', 
      amount: '', 
      conditions: '', 
      applicableAwards: [],
      triggerType: 'manual',
      triggerConditions: {},
      minimumEngagement: undefined,
      maxPerPeriod: undefined,
      requiresApproval: false,
      stackable: true,
      taxable: true,
      superIncluded: false,
    });
    setEditingAllowance(null);
  };

  const handleOpenPanel = (allowance?: CustomAllowance) => {
    if (allowance) {
      setEditingAllowance(allowance);
      setNewAllowance({
        name: allowance.name,
        code: allowance.code,
        description: allowance.description,
        category: allowance.category,
        type: allowance.type,
        amount: (allowance.customAmount || allowance.baseAmount).toString(),
        conditions: allowance.conditions || '',
        applicableAwards: allowance.applicableAwards,
        triggerType: allowance.triggerType,
        triggerConditions: allowance.triggerConditions || {},
        minimumEngagement: allowance.minimumEngagement,
        maxPerPeriod: allowance.maxPerPeriod,
        requiresApproval: allowance.requiresApproval,
        stackable: allowance.stackable,
        taxable: allowance.taxable,
        superIncluded: allowance.superIncluded,
      });
    } else {
      resetForm();
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    resetForm();
  };

  const handleAddAllowance = () => {
    if (!newAllowance.name || !newAllowance.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    const allowance: CustomAllowance = {
      id: Date.now().toString(),
      name: newAllowance.name,
      code: newAllowance.code || newAllowance.name.toUpperCase().replace(/\s+/g, '_'),
      description: newAllowance.description,
      category: newAllowance.category,
      type: newAllowance.type,
      baseAmount: 0,
      customAmount: parseFloat(newAllowance.amount),
      isOverridden: true,
      applicableAwards: newAllowance.applicableAwards,
      conditions: newAllowance.conditions,
      isActive: true,
      triggerType: newAllowance.triggerType,
      triggerConditions: newAllowance.triggerConditions,
      minimumEngagement: newAllowance.minimumEngagement,
      maxPerPeriod: newAllowance.maxPerPeriod,
      requiresApproval: newAllowance.requiresApproval,
      stackable: newAllowance.stackable,
      taxable: newAllowance.taxable,
      superIncluded: newAllowance.superIncluded,
    };

    setAllowances([...allowances, allowance]);
    toast.success('Custom allowance added');
    handleClosePanel();
  };

  const handleSaveEdit = () => {
    if (!editingAllowance) return;
    
    setAllowances(prev => prev.map(a =>
      a.id === editingAllowance.id
        ? {
            ...a,
            name: newAllowance.name,
            code: newAllowance.code,
            description: newAllowance.description,
            category: newAllowance.category,
            type: newAllowance.type,
            customAmount: parseFloat(newAllowance.amount),
            isOverridden: true,
            conditions: newAllowance.conditions,
            applicableAwards: newAllowance.applicableAwards,
            triggerType: newAllowance.triggerType,
            triggerConditions: newAllowance.triggerConditions,
            minimumEngagement: newAllowance.minimumEngagement,
            maxPerPeriod: newAllowance.maxPerPeriod,
            requiresApproval: newAllowance.requiresApproval,
            stackable: newAllowance.stackable,
            taxable: newAllowance.taxable,
            superIncluded: newAllowance.superIncluded,
          }
        : a
    ));
    toast.success('Allowance updated');
    handleClosePanel();
  };

  const updateAllowanceRate = (id: string, newAmount: number) => {
    setAllowances(prev => prev.map(a =>
      a.id === id ? { ...a, customAmount: newAmount, isOverridden: true } : a
    ));
    toast.success('Allowance rate updated');
  };

  const toggleAllowance = (id: string) => {
    setAllowances(prev => prev.map(a =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const deleteAllowance = (id: string) => {
    setAllowances(prev => prev.filter(a => a.id !== id));
    toast.success('Allowance deleted');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredAllowances, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'allowances.json';
    a.click();
    toast.success('Allowances exported');
  };

  const removeAwardFromSelection = (awardId: string) => {
    setNewAllowance(prev => ({
      ...prev,
      applicableAwards: prev.applicableAwards.filter(id => id !== awardId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Allowance Rates Editor</h3>
          <p className="text-sm text-muted-foreground">
            Customize and create allowance rates by award
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => handleOpenPanel()}>
            <Plus className="h-4 w-4" />
            Add Allowance
          </Button>
        </div>
      </div>

      {/* Side Panel */}
      <Sheet open={isPanelOpen} onOpenChange={handleClosePanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingAllowance ? 'Edit Allowance' : 'Add Custom Allowance'}</SheetTitle>
            <SheetDescription>
              {editingAllowance ? 'Update the allowance configuration' : 'Create a new custom allowance with trigger conditions'}
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="basic" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="trigger">Trigger Rules</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Allowance Name *</Label>
                  <Input
                    placeholder="e.g., On-Call Allowance"
                    value={newAllowance.name}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    placeholder="e.g., ON_CALL"
                    value={newAllowance.code}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of when this allowance applies..."
                  value={newAllowance.description}
                  onChange={(e) => setNewAllowance(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newAllowance.category} 
                    onValueChange={(v) => setNewAllowance(prev => ({ ...prev, category: v as AllowanceCategoryType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select 
                    value={newAllowance.type} 
                    onValueChange={(v) => setNewAllowance(prev => ({ ...prev, type: v as CustomAllowance['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_shift">Per Shift</SelectItem>
                      <SelectItem value="per_day">Per Day</SelectItem>
                      <SelectItem value="per_week">Per Week</SelectItem>
                      <SelectItem value="per_km">Per Kilometer</SelectItem>
                      <SelectItem value="one_off">One-Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAllowance.amount}
                  onChange={(e) => setNewAllowance(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Applicable Awards (Optional)</Label>
                <Select 
                  onValueChange={(v) => {
                    if (!newAllowance.applicableAwards.includes(v)) {
                      setNewAllowance(prev => ({ 
                        ...prev, 
                        applicableAwards: [...prev.applicableAwards, v] 
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select awards..." />
                  </SelectTrigger>
                  <SelectContent>
                    {australianAwards.map(award => (
                      <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newAllowance.applicableAwards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newAllowance.applicableAwards.map(awardId => (
                      <Badge 
                        key={awardId} 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeAwardFromSelection(awardId)}
                      >
                        {getAwardName(awardId)} ×
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to apply to all awards
                </p>
              </div>

              <div className="space-y-2">
                <Label>Conditions (Optional)</Label>
                <Input
                  placeholder="e.g., When required to be on-call"
                  value={newAllowance.conditions}
                  onChange={(e) => setNewAllowance(prev => ({ ...prev, conditions: e.target.value }))}
                />
              </div>
            </TabsContent>

            {/* Trigger Rules Tab */}
            <TabsContent value="trigger" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Automatic Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select 
                      value={newAllowance.triggerType} 
                      onValueChange={(v) => setNewAllowance(prev => ({ ...prev, triggerType: v as TriggerType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How the system determines when to apply this allowance
                    </p>
                  </div>

                  {newAllowance.triggerType === 'shift_type' && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Shift Type Triggers</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['on_call', 'sleepover', 'broken', 'recall', 'emergency'] as const).map((shiftType) => (
                          <div key={shiftType} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`shift-${shiftType}`}
                              checked={newAllowance.triggerConditions?.shiftTypes?.includes(shiftType) || false}
                              onCheckedChange={(checked) => {
                                setNewAllowance(prev => ({
                                  ...prev,
                                  triggerConditions: {
                                    ...prev.triggerConditions,
                                    shiftTypes: checked 
                                      ? [...(prev.triggerConditions?.shiftTypes || []), shiftType]
                                      : (prev.triggerConditions?.shiftTypes || []).filter(t => t !== shiftType)
                                  }
                                }));
                              }}
                            />
                            <Label htmlFor={`shift-${shiftType}`} className="text-sm capitalize">
                              {shiftType.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-3" />

                      <Label className="text-sm font-medium">Additional Conditions</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="overnight"
                            checked={newAllowance.triggerConditions?.overnightRequired || false}
                            onCheckedChange={(checked) => {
                              setNewAllowance(prev => ({
                                ...prev,
                                triggerConditions: {
                                  ...prev.triggerConditions,
                                  overnightRequired: !!checked
                                }
                              }));
                            }}
                          />
                          <Label htmlFor="overnight" className="text-sm">Requires overnight stay</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="recall"
                            checked={newAllowance.triggerConditions?.recallRequired || false}
                            onCheckedChange={(checked) => {
                              setNewAllowance(prev => ({
                                ...prev,
                                triggerConditions: {
                                  ...prev.triggerConditions,
                                  recallRequired: !!checked
                                }
                              }));
                            }}
                          />
                          <Label htmlFor="recall" className="text-sm">Requires recall to work</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="higher"
                            checked={newAllowance.triggerConditions?.higherClassification || false}
                            onCheckedChange={(checked) => {
                              setNewAllowance(prev => ({
                                ...prev,
                                triggerConditions: {
                                  ...prev.triggerConditions,
                                  higherClassification: !!checked
                                }
                              }));
                            }}
                          />
                          <Label htmlFor="higher" className="text-sm">Higher classification duties</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="travel"
                            checked={newAllowance.triggerConditions?.travelKilometres || false}
                            onCheckedChange={(checked) => {
                              setNewAllowance(prev => ({
                                ...prev,
                                triggerConditions: {
                                  ...prev.triggerConditions,
                                  travelKilometres: !!checked
                                }
                              }));
                            }}
                          />
                          <Label htmlFor="travel" className="text-sm">Travel kilometres recorded</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Min Break (mins)</Label>
                          <Input 
                            type="number" 
                            placeholder="e.g., 60"
                            value={newAllowance.triggerConditions?.minBreakMinutes || ''}
                            onChange={(e) => setNewAllowance(prev => ({
                              ...prev,
                              triggerConditions: {
                                ...prev.triggerConditions,
                                minBreakMinutes: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">For broken shift detection</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {newAllowance.triggerType === 'qualification' && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Required Qualifications</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['first_aid', 'diploma', 'cert3', 'working_with_children'].map((qual) => (
                          <div key={qual} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`qual-${qual}`}
                              checked={newAllowance.triggerConditions?.qualificationTypes?.includes(qual) || false}
                              onCheckedChange={(checked) => {
                                setNewAllowance(prev => ({
                                  ...prev,
                                  triggerConditions: {
                                    ...prev.triggerConditions,
                                    qualificationTypes: checked 
                                      ? [...(prev.triggerConditions?.qualificationTypes || []), qual]
                                      : (prev.triggerConditions?.qualificationTypes || []).filter(q => q !== qual)
                                  }
                                }));
                              }}
                            />
                            <Label htmlFor={`qual-${qual}`} className="text-sm capitalize">
                              {qual.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newAllowance.triggerType === 'role' && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Required Roles</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['lead_educator', 'director', 'assistant_director', 'room_leader'].map((role) => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`role-${role}`}
                              checked={newAllowance.triggerConditions?.roleTypes?.includes(role) || false}
                              onCheckedChange={(checked) => {
                                setNewAllowance(prev => ({
                                  ...prev,
                                  triggerConditions: {
                                    ...prev.triggerConditions,
                                    roleTypes: checked 
                                      ? [...(prev.triggerConditions?.roleTypes || []), role]
                                      : (prev.triggerConditions?.roleTypes || []).filter(r => r !== role)
                                  }
                                }));
                              }}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm capitalize">
                              {role.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Engagement Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Engagement</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2"
                        value={newAllowance.minimumEngagement || ''}
                        onChange={(e) => setNewAllowance(prev => ({ 
                          ...prev, 
                          minimumEngagement: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Min hours/units paid (e.g., 2hr minimum for recall)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Per Period</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 1"
                        value={newAllowance.maxPerPeriod || ''}
                        onChange={(e) => setNewAllowance(prev => ({ 
                          ...prev, 
                          maxPerPeriod: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Max times claimable per day
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requires Approval</Label>
                      <p className="text-xs text-muted-foreground">Must be approved by manager before payment</p>
                    </div>
                    <Switch 
                      checked={newAllowance.requiresApproval}
                      onCheckedChange={(checked) => setNewAllowance(prev => ({ ...prev, requiresApproval: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stackable</Label>
                      <p className="text-xs text-muted-foreground">Can be combined with other allowances</p>
                    </div>
                    <Switch 
                      checked={newAllowance.stackable}
                      onCheckedChange={(checked) => setNewAllowance(prev => ({ ...prev, stackable: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Taxable</Label>
                      <p className="text-xs text-muted-foreground">Subject to income tax</p>
                    </div>
                    <Switch 
                      checked={newAllowance.taxable}
                      onCheckedChange={(checked) => setNewAllowance(prev => ({ ...prev, taxable: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Super Included</Label>
                      <p className="text-xs text-muted-foreground">Superannuation guarantee applies</p>
                    </div>
                    <Switch 
                      checked={newAllowance.superIncluded}
                      onCheckedChange={(checked) => setNewAllowance(prev => ({ ...prev, superIncluded: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <SheetFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={handleClosePanel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={editingAllowance ? handleSaveEdit : handleAddAllowance} className="flex-1">
              {editingAllowance ? 'Update Allowance' : 'Add Allowance'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
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
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowances.filter(a => a.isOverridden).length}</p>
                <p className="text-sm text-muted-foreground">Custom Rates</p>
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
      </div>

      {/* Filters */}
      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allowances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAwardFilter} onValueChange={setSelectedAwardFilter}>
              <SelectTrigger className="w-48">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Award" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Awards</SelectItem>
                {australianAwards.map(award => (
                  <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="per_hour">Per Hour</SelectItem>
                <SelectItem value="per_shift">Per Shift</SelectItem>
                <SelectItem value="per_week">Per Week</SelectItem>
                <SelectItem value="per_km">Per Km</SelectItem>
                <SelectItem value="one_off">One-Off</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showCustomOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCustomOnly(!showCustomOnly)}
            >
              Custom Only
            </Button>
            {(searchQuery || selectedAwardFilter !== 'all' || selectedTypeFilter !== 'all' || showCustomOnly) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery('');
                setSelectedAwardFilter('all');
                setSelectedTypeFilter('all');
                setShowCustomOnly(false);
              }}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAllowances.length} of {allowances.length} allowances
      </div>

      <Card className="card-material-elevated">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Allowance</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Award Rate</TableHead>
                  <TableHead className="text-right">Custom Rate</TableHead>
                  <TableHead>Applicable Awards</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllowances.map((allowance) => (
                  <TableRow key={allowance.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{allowance.name}</p>
                        {allowance.conditions && (
                          <p className="text-xs text-muted-foreground">{allowance.conditions}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {allowance.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {allowance.baseAmount > 0 ? (
                        `$${allowance.baseAmount.toFixed(2)}${getTypeLabel(allowance.type)}`
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {allowance.isOverridden ? (
                        <span className="font-mono font-semibold text-primary">
                          ${(allowance.customAmount || 0).toFixed(2)}{getTypeLabel(allowance.type)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {allowance.applicableAwards.length > 0 ? (
                          allowance.applicableAwards.slice(0, 2).map(awardId => (
                            <Badge key={awardId} variant="outline" className="text-xs">
                              {getAwardName(awardId)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">All Awards</Badge>
                        )}
                        {allowance.applicableAwards.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{allowance.applicableAwards.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={allowance.isActive} 
                        onCheckedChange={() => toggleAllowance(allowance.id)} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleOpenPanel(allowance)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteAllowance(allowance.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}