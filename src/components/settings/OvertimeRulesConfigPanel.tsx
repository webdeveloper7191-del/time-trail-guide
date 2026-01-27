import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  Plus, Clock, Percent, Edit2, Trash2, CheckCircle2, AlertCircle, 
  Zap, TrendingUp, Copy, Scale, Timer, DollarSign, Info,
  Calendar, Moon, Sun, Star
} from 'lucide-react';

// Overtime rule type definition
export interface OvertimeRuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'penalty' | 'special';
  isActive: boolean;
  isDefault: boolean;
  
  // Thresholds
  dailyThreshold?: number;
  weeklyThreshold?: number;
  
  // Multipliers (as decimals, e.g., 1.5 for time-and-a-half)
  overtimeMultiplier: number;
  doubleTimeMultiplier?: number;
  doubleTimeThreshold?: number;
  
  // Day/time specific
  applicableDays?: ('weekday' | 'saturday' | 'sunday' | 'public_holiday')[];
  timeRange?: { start: string; end: string };
  
  // Penalty loadings (percentage, e.g., 25 for 25%)
  penaltyLoading?: number;
  
  // Award linkage
  awardIds?: string[];
  
  createdAt: string;
  updatedAt: string;
}

const defaultRules: OvertimeRuleConfig[] = [
  {
    id: 'default-daily',
    name: 'Standard Daily Overtime',
    description: 'Overtime triggered after daily hour threshold',
    category: 'daily',
    isActive: true,
    isDefault: true,
    dailyThreshold: 8,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    doubleTimeThreshold: 10,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'default-weekly',
    name: 'Standard Weekly Overtime',
    description: 'Overtime triggered after weekly hour threshold (38h NES)',
    category: 'weekly',
    isActive: true,
    isDefault: true,
    weeklyThreshold: 38,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'saturday-penalty',
    name: 'Saturday Penalty Rate',
    description: 'Penalty loading for Saturday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['saturday'],
    overtimeMultiplier: 1.5,
    penaltyLoading: 50,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'sunday-penalty',
    name: 'Sunday Penalty Rate',
    description: 'Penalty loading for Sunday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['sunday'],
    overtimeMultiplier: 2.0,
    penaltyLoading: 100,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'public-holiday',
    name: 'Public Holiday Rate',
    description: 'Penalty loading for public holiday work',
    category: 'penalty',
    isActive: true,
    isDefault: true,
    applicableDays: ['public_holiday'],
    overtimeMultiplier: 2.5,
    penaltyLoading: 150,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'night-shift',
    name: 'Night Shift Loading',
    description: 'Additional loading for night shift work (10pm-6am)',
    category: 'special',
    isActive: true,
    isDefault: true,
    timeRange: { start: '22:00', end: '06:00' },
    overtimeMultiplier: 1.0,
    penaltyLoading: 15,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'evening-shift',
    name: 'Evening Shift Loading',
    description: 'Additional loading for evening work (6pm-10pm)',
    category: 'special',
    isActive: true,
    isDefault: true,
    timeRange: { start: '18:00', end: '22:00' },
    overtimeMultiplier: 1.0,
    penaltyLoading: 10,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

interface OvertimeRulesConfigPanelProps {
  onSave?: (rules: OvertimeRuleConfig[]) => void;
}

export function OvertimeRulesConfigPanel({ onSave }: OvertimeRulesConfigPanelProps) {
  const [rules, setRules] = useState<OvertimeRuleConfig[]>(defaultRules);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<OvertimeRuleConfig | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'daily' as OvertimeRuleConfig['category'],
    dailyThreshold: 8,
    weeklyThreshold: 38,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    doubleTimeThreshold: 10,
    penaltyLoading: 0,
    applicableDays: [] as string[],
    timeRangeStart: '',
    timeRangeEnd: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'daily',
      dailyThreshold: 8,
      weeklyThreshold: 38,
      overtimeMultiplier: 1.5,
      doubleTimeMultiplier: 2.0,
      doubleTimeThreshold: 10,
      penaltyLoading: 0,
      applicableDays: [],
      timeRangeStart: '',
      timeRangeEnd: '',
    });
    setEditingRule(null);
  };

  const handleOpenPanel = (rule?: OvertimeRuleConfig) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description,
        category: rule.category,
        dailyThreshold: rule.dailyThreshold || 8,
        weeklyThreshold: rule.weeklyThreshold || 38,
        overtimeMultiplier: rule.overtimeMultiplier,
        doubleTimeMultiplier: rule.doubleTimeMultiplier || 2.0,
        doubleTimeThreshold: rule.doubleTimeThreshold || 10,
        penaltyLoading: rule.penaltyLoading || 0,
        applicableDays: rule.applicableDays || [],
        timeRangeStart: rule.timeRange?.start || '',
        timeRangeEnd: rule.timeRange?.end || '',
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

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a rule name');
      return;
    }

    const now = new Date().toISOString();
    const ruleData: OvertimeRuleConfig = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      isActive: editingRule?.isActive ?? true,
      isDefault: false,
      dailyThreshold: formData.category === 'daily' ? formData.dailyThreshold : undefined,
      weeklyThreshold: formData.category === 'weekly' ? formData.weeklyThreshold : undefined,
      overtimeMultiplier: formData.overtimeMultiplier,
      doubleTimeMultiplier: formData.doubleTimeMultiplier,
      doubleTimeThreshold: formData.doubleTimeThreshold,
      penaltyLoading: formData.category === 'penalty' || formData.category === 'special' ? formData.penaltyLoading : undefined,
      applicableDays: formData.applicableDays.length > 0 ? formData.applicableDays as OvertimeRuleConfig['applicableDays'] : undefined,
      timeRange: formData.timeRangeStart && formData.timeRangeEnd 
        ? { start: formData.timeRangeStart, end: formData.timeRangeEnd } 
        : undefined,
      createdAt: editingRule?.createdAt || now,
      updatedAt: now,
    };

    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? ruleData : r));
      toast.success('Overtime rule updated');
    } else {
      setRules(prev => [...prev, ruleData]);
      toast.success('Overtime rule created');
    }

    handleClosePanel();
    onSave?.(rules);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r
    ));
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule?.isDefault) {
      toast.error('Cannot delete default rules. You can disable them instead.');
      return;
    }
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const duplicateRule = (rule: OvertimeRuleConfig) => {
    const newRule: OvertimeRuleConfig = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRules(prev => [...prev, newRule]);
    toast.success('Rule duplicated');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily': return <Clock className="h-4 w-4" />;
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'penalty': return <Star className="h-4 w-4" />;
      case 'special': return <Moon className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'weekly': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'penalty': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'special': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const groupedRules = {
    daily: rules.filter(r => r.category === 'daily'),
    weekly: rules.filter(r => r.category === 'weekly'),
    penalty: rules.filter(r => r.category === 'penalty'),
    special: rules.filter(r => r.category === 'special'),
  };

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    custom: rules.filter(r => !r.isDefault).length,
    disabled: rules.filter(r => !r.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Overtime Rules Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure global overtime thresholds, multipliers, and penalty rates
          </p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenPanel()}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.custom}</p>
                <p className="text-sm text-muted-foreground">Custom</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.disabled}</p>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules by Category */}
      <Accordion type="multiple" defaultValue={['daily', 'weekly', 'penalty', 'special']} className="space-y-4">
        {/* Daily Overtime Rules */}
        <AccordionItem value="daily" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Daily Overtime Rules</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {groupedRules.daily.length} rules · Triggered when daily hours exceed threshold
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {groupedRules.daily.map(rule => (
                <RuleCard 
                  key={rule.id} 
                  rule={rule} 
                  onEdit={() => handleOpenPanel(rule)}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => deleteRule(rule.id)}
                  onDuplicate={() => duplicateRule(rule)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Weekly Overtime Rules */}
        <AccordionItem value="weekly" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Weekly Overtime Rules</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {groupedRules.weekly.length} rules · Triggered when weekly hours exceed threshold
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {groupedRules.weekly.map(rule => (
                <RuleCard 
                  key={rule.id} 
                  rule={rule} 
                  onEdit={() => handleOpenPanel(rule)}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => deleteRule(rule.id)}
                  onDuplicate={() => duplicateRule(rule)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Penalty Rate Rules */}
        <AccordionItem value="penalty" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Penalty Rate Rules</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {groupedRules.penalty.length} rules · Weekend and public holiday loadings
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {groupedRules.penalty.map(rule => (
                <RuleCard 
                  key={rule.id} 
                  rule={rule} 
                  onEdit={() => handleOpenPanel(rule)}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => deleteRule(rule.id)}
                  onDuplicate={() => duplicateRule(rule)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Special Rules */}
        <AccordionItem value="special" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Moon className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Special Loadings</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {groupedRules.special.length} rules · Evening, night shift, and time-based loadings
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {groupedRules.special.map(rule => (
                <RuleCard 
                  key={rule.id} 
                  rule={rule} 
                  onEdit={() => handleOpenPanel(rule)}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => deleteRule(rule.id)}
                  onDuplicate={() => duplicateRule(rule)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Create/Edit Panel */}
      <Sheet open={isPanelOpen} onOpenChange={handleClosePanel}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {getCategoryIcon(formData.category)}
              {editingRule ? 'Edit Overtime Rule' : 'Create Overtime Rule'}
            </SheetTitle>
            <SheetDescription>
              {editingRule 
                ? 'Update the overtime rule configuration' 
                : 'Configure a new overtime rule with thresholds and multipliers'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6 py-6 pr-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    placeholder="e.g., Extended Hours Overtime"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of when this rule applies"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rule Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as OvertimeRuleConfig['category'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Daily Overtime
                        </div>
                      </SelectItem>
                      <SelectItem value="weekly">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Weekly Overtime
                        </div>
                      </SelectItem>
                      <SelectItem value="penalty">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Penalty Rate
                        </div>
                      </SelectItem>
                      <SelectItem value="special">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Special Loading
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Daily Threshold */}
              {formData.category === 'daily' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Label className="text-base font-medium">Daily Hour Threshold</Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overtime starts after:</span>
                      <span className="font-medium">{formData.dailyThreshold} hours</span>
                    </div>
                    <Slider
                      value={[formData.dailyThreshold]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, dailyThreshold: v }))}
                      min={4}
                      max={12}
                      step={0.5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>4 hours</span>
                      <span>12 hours</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Double time after:</span>
                      <span className="font-medium">{formData.doubleTimeThreshold} hours</span>
                    </div>
                    <Slider
                      value={[formData.doubleTimeThreshold]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, doubleTimeThreshold: v }))}
                      min={formData.dailyThreshold}
                      max={16}
                      step={0.5}
                    />
                  </div>
                </div>
              )}

              {/* Weekly Threshold */}
              {formData.category === 'weekly' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <Label className="text-base font-medium">Weekly Hour Threshold</Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overtime starts after:</span>
                      <span className="font-medium">{formData.weeklyThreshold} hours/week</span>
                    </div>
                    <Slider
                      value={[formData.weeklyThreshold]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, weeklyThreshold: v }))}
                      min={20}
                      max={60}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20 hours</span>
                      <span>60 hours</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                      <p className="text-sm text-purple-700">
                        Australian NES standard is 38 hours per week for full-time employees.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Penalty/Special Day Selection */}
              {(formData.category === 'penalty' || formData.category === 'special') && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Applicable Days</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['weekday', 'saturday', 'sunday', 'public_holiday'].map(day => (
                      <div 
                        key={day}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.applicableDays.includes(day)
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-muted/50 border-border hover:border-primary/20'
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            applicableDays: prev.applicableDays.includes(day)
                              ? prev.applicableDays.filter(d => d !== day)
                              : [...prev.applicableDays, day]
                          }));
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={formData.applicableDays.includes(day)}
                            onCheckedChange={() => {}}
                          />
                          <span className="text-sm font-medium capitalize">
                            {day.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Range for Special Rules */}
              {formData.category === 'special' && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Time Range (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Start Time</Label>
                      <Input
                        type="time"
                        value={formData.timeRangeStart}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeRangeStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">End Time</Label>
                      <Input
                        type="time"
                        value={formData.timeRangeEnd}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeRangeEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Multipliers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Rate Multipliers</Label>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overtime Rate:</span>
                    <span className="font-medium">{formData.overtimeMultiplier}x ({(formData.overtimeMultiplier * 100).toFixed(0)}%)</span>
                  </div>
                  <Slider
                    value={[formData.overtimeMultiplier * 100]}
                    onValueChange={([v]) => setFormData(prev => ({ ...prev, overtimeMultiplier: v / 100 }))}
                    min={100}
                    max={300}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1x (100%)</span>
                    <span>3x (300%)</span>
                  </div>
                </div>

                {(formData.category === 'daily' || formData.category === 'weekly') && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Double Time Rate:</span>
                      <span className="font-medium">{formData.doubleTimeMultiplier}x ({(formData.doubleTimeMultiplier * 100).toFixed(0)}%)</span>
                    </div>
                    <Slider
                      value={[formData.doubleTimeMultiplier * 100]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, doubleTimeMultiplier: v / 100 }))}
                      min={150}
                      max={350}
                      step={5}
                    />
                  </div>
                )}

                {(formData.category === 'penalty' || formData.category === 'special') && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Penalty Loading:</span>
                      <span className="font-medium">+{formData.penaltyLoading}%</span>
                    </div>
                    <Slider
                      value={[formData.penaltyLoading]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, penaltyLoading: v }))}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium mb-2">Rate Preview</p>
                <div className="space-y-1 text-sm">
                  {formData.category === 'daily' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First {formData.dailyThreshold}h:</span>
                        <span>Normal rate (1x)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">After {formData.dailyThreshold}h:</span>
                        <span className="text-amber-600">{formData.overtimeMultiplier}x rate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">After {formData.doubleTimeThreshold}h:</span>
                        <span className="text-red-600">{formData.doubleTimeMultiplier}x rate</span>
                      </div>
                    </>
                  )}
                  {formData.category === 'weekly' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First {formData.weeklyThreshold}h/week:</span>
                        <span>Normal rate (1x)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">After {formData.weeklyThreshold}h:</span>
                        <span className="text-amber-600">{formData.overtimeMultiplier}x rate</span>
                      </div>
                    </>
                  )}
                  {(formData.category === 'penalty' || formData.category === 'special') && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate adjustment:</span>
                      <span className="text-primary">+{formData.penaltyLoading}% loading</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClosePanel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Rule Card Component
interface RuleCardProps {
  rule: OvertimeRuleConfig;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function RuleCard({ rule, onEdit, onToggle, onDelete, onDuplicate }: RuleCardProps) {
  return (
    <div className={`p-4 rounded-lg border transition-all ${
      rule.isActive 
        ? 'bg-background border-border hover:border-primary/30' 
        : 'bg-muted/30 border-border/50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Switch 
            checked={rule.isActive} 
            onCheckedChange={onToggle}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-medium ${!rule.isActive && 'text-muted-foreground'}`}>
                {rule.name}
              </p>
              {rule.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
            
            {/* Rule Details */}
            <div className="flex flex-wrap gap-2 mt-2">
              {rule.dailyThreshold && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {rule.dailyThreshold}h daily
                </Badge>
              )}
              {rule.weeklyThreshold && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Calendar className="h-3 w-3" />
                  {rule.weeklyThreshold}h weekly
                </Badge>
              )}
              <Badge variant="outline" className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" />
                {rule.overtimeMultiplier}x
              </Badge>
              {rule.doubleTimeMultiplier && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Zap className="h-3 w-3" />
                  {rule.doubleTimeMultiplier}x DT
                </Badge>
              )}
              {rule.penaltyLoading && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Percent className="h-3 w-3" />
                  +{rule.penaltyLoading}%
                </Badge>
              )}
              {rule.timeRange && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Moon className="h-3 w-3" />
                  {rule.timeRange.start}-{rule.timeRange.end}
                </Badge>
              )}
              {rule.applicableDays?.map(day => (
                <Badge key={day} variant="outline" className="text-xs capitalize">
                  {day.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={rule.isDefault}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
