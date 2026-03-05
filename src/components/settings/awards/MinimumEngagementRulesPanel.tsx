import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Info, 
  AlertTriangle,
  Calendar,
  Sun,
  Moon,
  Star,
  Timer,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

// ============= Types =============
export interface MinimumEngagementRule {
  id: string;
  name: string;
  description: string;
  triggerType: 'callback' | 'recall' | 'emergency';
  isActive: boolean;
  // Day-specific minimum hours
  weekdayMinHours: number;
  weekdayRateMultiplier: number;
  saturdayMinHours: number;
  saturdayRateMultiplier: number;
  sundayMinHours: number;
  sundayRateMultiplier: number;
  publicHolidayMinHours: number;
  publicHolidayRateMultiplier: number;
  // Additional rules
  travelTimeAllowanceMinutes: number;
  multipleCallbacksRule: 'separate' | 'aggregate' | 'highest';
  restPeriodAfterCallbackHours: number;
  maxCallbacksPerPeriod: number;
  applicableAward: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

// Mock data
const mockEngagementRules: MinimumEngagementRule[] = [
  {
    id: 'me-1',
    name: 'Standard Callback Engagement',
    description: 'Default minimum engagement for standard on-call callbacks under Children\'s Services Award',
    triggerType: 'callback',
    isActive: true,
    weekdayMinHours: 2,
    weekdayRateMultiplier: 1.5,
    saturdayMinHours: 3,
    saturdayRateMultiplier: 1.5,
    sundayMinHours: 3,
    sundayRateMultiplier: 2.0,
    publicHolidayMinHours: 4,
    publicHolidayRateMultiplier: 2.5,
    travelTimeAllowanceMinutes: 30,
    multipleCallbacksRule: 'separate',
    restPeriodAfterCallbackHours: 8,
    maxCallbacksPerPeriod: 4,
    applicableAward: 'Children\'s Services Award',
    effectiveFrom: '2024-07-01',
  },
  {
    id: 'me-2',
    name: 'Emergency Recall Engagement',
    description: 'Enhanced minimum engagement for emergency recall situations with higher minimums',
    triggerType: 'recall',
    isActive: true,
    weekdayMinHours: 3,
    weekdayRateMultiplier: 2.0,
    saturdayMinHours: 4,
    saturdayRateMultiplier: 2.0,
    sundayMinHours: 4,
    sundayRateMultiplier: 2.5,
    publicHolidayMinHours: 4,
    publicHolidayRateMultiplier: 2.5,
    travelTimeAllowanceMinutes: 45,
    multipleCallbacksRule: 'highest',
    restPeriodAfterCallbackHours: 10,
    maxCallbacksPerPeriod: 3,
    applicableAward: 'General Award',
    effectiveFrom: '2024-07-01',
  },
  {
    id: 'me-3',
    name: 'Healthcare Critical Response',
    description: 'Healthcare-specific engagement rules for critical patient care callbacks',
    triggerType: 'emergency',
    isActive: false,
    weekdayMinHours: 4,
    weekdayRateMultiplier: 2.0,
    saturdayMinHours: 4,
    saturdayRateMultiplier: 2.5,
    sundayMinHours: 4,
    sundayRateMultiplier: 2.5,
    publicHolidayMinHours: 4,
    publicHolidayRateMultiplier: 3.0,
    travelTimeAllowanceMinutes: 60,
    multipleCallbacksRule: 'aggregate',
    restPeriodAfterCallbackHours: 12,
    maxCallbacksPerPeriod: 2,
    applicableAward: 'Healthcare Award',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2025-06-30',
  },
];

const emptyForm: Omit<MinimumEngagementRule, 'id'> = {
  name: '',
  description: '',
  triggerType: 'callback',
  isActive: true,
  weekdayMinHours: 2,
  weekdayRateMultiplier: 1.5,
  saturdayMinHours: 3,
  saturdayRateMultiplier: 1.5,
  sundayMinHours: 3,
  sundayRateMultiplier: 2.0,
  publicHolidayMinHours: 4,
  publicHolidayRateMultiplier: 2.5,
  travelTimeAllowanceMinutes: 30,
  multipleCallbacksRule: 'separate',
  restPeriodAfterCallbackHours: 8,
  maxCallbacksPerPeriod: 4,
  applicableAward: '',
  effectiveFrom: new Date().toISOString().split('T')[0],
};

const triggerLabels: Record<MinimumEngagementRule['triggerType'], string> = {
  callback: 'Callback',
  recall: 'Recall',
  emergency: 'Emergency',
};

const triggerColors: Record<MinimumEngagementRule['triggerType'], string> = {
  callback: 'bg-amber-500/10 text-amber-700',
  recall: 'bg-orange-500/10 text-orange-700',
  emergency: 'bg-red-500/10 text-red-700',
};

const multipleCallbackLabels: Record<MinimumEngagementRule['multipleCallbacksRule'], { label: string; desc: string }> = {
  separate: { label: 'Separate', desc: 'Each callback triggers its own minimum engagement independently' },
  aggregate: { label: 'Aggregate', desc: 'All callback hours are combined, then minimum engagement applied once' },
  highest: { label: 'Highest Only', desc: 'Only the highest-paying callback\'s minimum engagement applies' },
};

export function MinimumEngagementRulesPanel() {
  const [rules, setRules] = useState<MinimumEngagementRule[]>(mockEngagementRules);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MinimumEngagementRule | null>(null);
  const [formData, setFormData] = useState<Omit<MinimumEngagementRule, 'id'>>(emptyForm);

  const handleOpenSheet = (rule?: MinimumEngagementRule) => {
    if (rule) {
      setEditingRule(rule);
      const { id, ...rest } = rule;
      setFormData(rest);
    } else {
      setEditingRule(null);
      setFormData({ ...emptyForm });
    }
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a rule name');
      return;
    }

    const saved: MinimumEngagementRule = {
      ...formData,
      id: editingRule?.id || `me-${Date.now()}`,
    };

    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? saved : r));
      toast.success('Minimum engagement rule updated');
    } else {
      setRules(prev => [...prev, saved]);
      toast.success('Minimum engagement rule created');
    }

    setIsSheetOpen(false);
    setEditingRule(null);
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const updateForm = <K extends keyof Omit<MinimumEngagementRule, 'id'>>(key: K, value: Omit<MinimumEngagementRule, 'id'>[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Minimum Engagement Rules</CardTitle>
                <CardDescription>
                  Configure minimum paid hours per callback with day-specific rules for weekday, weekend & public holiday
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenSheet()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">How Minimum Engagement Works</p>
              <p className="mt-1">
                When an on-call employee is called back to work, they are guaranteed a <strong>minimum number of paid hours</strong>, 
                even if the actual work takes less time. For example, a 3-hour minimum means a 45-minute callback is paid as 3 hours. 
                Different minimums apply based on the day type (weekday, Saturday, Sunday, or public holiday).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
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
                <p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sun className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.isActive).length > 0
                    ? `${Math.min(...rules.filter(r => r.isActive).map(r => r.weekdayMinHours))}–${Math.max(...rules.filter(r => r.isActive).map(r => r.weekdayMinHours))}h`
                    : '—'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Weekday Range</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.isActive).length > 0
                    ? `${Math.max(...rules.filter(r => r.isActive).map(r => r.publicHolidayRateMultiplier))}x`
                    : '—'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Max Holiday Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className={`card-material transition-all ${!rule.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${triggerColors[rule.triggerType]}`}>
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <Badge className={triggerColors[rule.triggerType]}>
                        {triggerLabels[rule.triggerType]}
                      </Badge>
                      {!rule.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <CardDescription className="text-xs mt-0.5">{rule.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="sm" onClick={() => handleOpenSheet(rule)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day-type grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weekday</p>
                  </div>
                  <p className="text-xl font-bold text-foreground">{rule.weekdayMinHours}h</p>
                  <p className="text-xs text-muted-foreground">at {rule.weekdayRateMultiplier}x rate</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Saturday</p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">{rule.saturdayMinHours}h</p>
                  <p className="text-xs text-blue-600/70">at {rule.saturdayRateMultiplier}x rate</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Moon className="h-3.5 w-3.5 text-indigo-600" />
                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Sunday</p>
                  </div>
                  <p className="text-xl font-bold text-indigo-700">{rule.sundayMinHours}h</p>
                  <p className="text-xs text-indigo-600/70">at {rule.sundayRateMultiplier}x rate</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Public Holiday</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-700">{rule.publicHolidayMinHours}h</p>
                  <p className="text-xs text-emerald-600/70">at {rule.publicHolidayRateMultiplier}x rate</p>
                </div>
              </div>

              {/* Additional info */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1 cursor-help">
                        <Clock className="h-3 w-3" />
                        {rule.travelTimeAllowanceMinutes}min travel
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Travel time allowance added to each callback</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1 cursor-help">
                        <Shield className="h-3 w-3" />
                        {rule.restPeriodAfterCallbackHours}h rest required
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Minimum rest period after callback before next shift</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="outline" className="gap-1">
                  Max {rule.maxCallbacksPerPeriod} callbacks/period
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  Multiple: {multipleCallbackLabels[rule.multipleCallbacksRule].label}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {rule.applicableAward}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="card-material">
          <CardContent className="p-8 text-center">
            <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Minimum Engagement Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create rules to define minimum paid hours when on-call staff are called back.
            </p>
            <Button onClick={() => handleOpenSheet()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-600" />
              {editingRule ? 'Edit Engagement Rule' : 'Add Engagement Rule'}
            </SheetTitle>
            <SheetDescription>
              Define minimum paid hours for each day type when staff are called back during on-call periods.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Details</h4>
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  placeholder="e.g., Standard Callback Engagement"
                  value={formData.name}
                  onChange={e => updateForm('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe when this engagement rule applies..."
                  value={formData.description}
                  onChange={e => updateForm('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select value={formData.triggerType} onValueChange={(v: MinimumEngagementRule['triggerType']) => updateForm('triggerType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="callback">Callback – Called back to work</SelectItem>
                      <SelectItem value="recall">Recall – Emergency recall</SelectItem>
                      <SelectItem value="emergency">Emergency – Critical response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Applicable Award</Label>
                  <Input
                    placeholder="e.g., Children's Services Award"
                    value={formData.applicableAward}
                    onChange={e => updateForm('applicableAward', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Effective From</Label>
                  <Input type="date" value={formData.effectiveFrom} onChange={e => updateForm('effectiveFrom', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Effective To (optional)</Label>
                  <Input type="date" value={formData.effectiveTo || ''} onChange={e => updateForm('effectiveTo', e.target.value || undefined)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Minimum Hours by Day Type */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Minimum Hours by Day Type</h4>
              <p className="text-xs text-muted-foreground">
                Set the minimum number of paid hours guaranteed per callback for each day type, along with the applicable rate multiplier.
              </p>
              
              <div className="grid gap-3">
                {/* Weekday */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Weekday (Mon – Fri)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Minimum Hours</Label>
                      <Input
                        type="number" step="0.5" min="0"
                        value={formData.weekdayMinHours}
                        onChange={e => updateForm('weekdayMinHours', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate Multiplier</Label>
                      <Input
                        type="number" step="0.1" min="1"
                        value={formData.weekdayRateMultiplier}
                        onChange={e => updateForm('weekdayRateMultiplier', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>

                {/* Saturday */}
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-700">Saturday</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Minimum Hours</Label>
                      <Input
                        type="number" step="0.5" min="0"
                        value={formData.saturdayMinHours}
                        onChange={e => updateForm('saturdayMinHours', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate Multiplier</Label>
                      <Input
                        type="number" step="0.1" min="1"
                        value={formData.saturdayRateMultiplier}
                        onChange={e => updateForm('saturdayRateMultiplier', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>

                {/* Sunday */}
                <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-sm text-indigo-700">Sunday</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Minimum Hours</Label>
                      <Input
                        type="number" step="0.5" min="0"
                        value={formData.sundayMinHours}
                        onChange={e => updateForm('sundayMinHours', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate Multiplier</Label>
                      <Input
                        type="number" step="0.1" min="1"
                        value={formData.sundayRateMultiplier}
                        onChange={e => updateForm('sundayRateMultiplier', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>

                {/* Public Holiday */}
                <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-sm text-emerald-700">Public Holiday</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Minimum Hours</Label>
                      <Input
                        type="number" step="0.5" min="0"
                        value={formData.publicHolidayMinHours}
                        onChange={e => updateForm('publicHolidayMinHours', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate Multiplier</Label>
                      <Input
                        type="number" step="0.1" min="1"
                        value={formData.publicHolidayRateMultiplier}
                        onChange={e => updateForm('publicHolidayRateMultiplier', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Rules */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional Rules</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Travel Time Allowance (min)
                  </Label>
                  <Input
                    type="number" min="0"
                    value={formData.travelTimeAllowanceMinutes}
                    onChange={e => updateForm('travelTimeAllowanceMinutes', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Added to each callback's paid time</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Rest Period After Callback (hrs)
                  </Label>
                  <Input
                    type="number" min="0" step="0.5"
                    value={formData.restPeriodAfterCallbackHours}
                    onChange={e => updateForm('restPeriodAfterCallbackHours', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum rest before next shift</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Multiple Callbacks Handling</Label>
                  <Select
                    value={formData.multipleCallbacksRule}
                    onValueChange={(v: MinimumEngagementRule['multipleCallbacksRule']) => updateForm('multipleCallbacksRule', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(multipleCallbackLabels).map(([key, { label, desc }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {multipleCallbackLabels[formData.multipleCallbacksRule].desc}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Max Callbacks Per Period</Label>
                  <Input
                    type="number" min="1"
                    value={formData.maxCallbacksPerPeriod}
                    onChange={e => updateForm('maxCallbacksPerPeriod', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum callbacks in one on-call period</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pay Preview Example
                </h4>
                <p className="text-xs text-amber-700 mb-3">
                  If an employee is called back on a <strong>Sunday</strong> and works <strong>45 minutes</strong>:
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-white rounded border">
                    <span className="text-muted-foreground">Actual worked:</span>
                    <span className="font-medium ml-1">0.75h</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="text-muted-foreground">Paid hours:</span>
                    <span className="font-bold ml-1 text-amber-700">{formData.sundayMinHours}h</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="text-muted-foreground">Rate multiplier:</span>
                    <span className="font-medium ml-1">{formData.sundayRateMultiplier}x</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="text-muted-foreground">+ Travel:</span>
                    <span className="font-medium ml-1">{formData.travelTimeAllowanceMinutes}min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <SheetFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
