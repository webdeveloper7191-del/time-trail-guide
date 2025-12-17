import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Plus, Settings2, Clock, Calendar, DollarSign, Percent, 
  Trash2, Edit2, Copy, CheckCircle2, AlertCircle, 
  Zap, Layers, ArrowRight, Code2, GitBranch, Brackets
} from 'lucide-react';

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

interface RuleAction {
  id: string;
  type: string;
  value: string;
}

interface CustomRule {
  id: string;
  name: string;
  description: string;
  type: 'overtime' | 'penalty' | 'allowance' | 'leave_loading' | 'condition';
  conditionGroups: ConditionGroup[];
  groupLogic: 'AND' | 'OR';
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const mockRules: CustomRule[] = [
  {
    id: '1',
    name: 'Senior Staff Overtime Premium',
    description: 'Additional 10% on overtime for staff with 5+ years experience',
    type: 'overtime',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'years_of_service', operator: 'greater_than', value: '5' },
          { id: 'c2', field: 'shift_type', operator: 'equals', value: 'overtime' },
        ]
      }
    ],
    groupLogic: 'AND',
    actions: [
      { id: 'a1', type: 'apply_multiplier', value: '1.10' },
    ],
    priority: 1,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Night Shift Loading',
    description: 'Additional 15% loading for shifts between 10pm-6am OR on weekends',
    type: 'penalty',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'shift_start_time', operator: 'between', value: '22:00-06:00' },
        ]
      },
      {
        id: 'g2',
        logic: 'OR',
        conditions: [
          { id: 'c2', field: 'day_of_week', operator: 'equals', value: 'Saturday' },
          { id: 'c3', field: 'day_of_week', operator: 'equals', value: 'Sunday' },
        ]
      }
    ],
    groupLogic: 'OR',
    actions: [
      { id: 'a1', type: 'apply_percentage', value: '15' },
    ],
    priority: 2,
    isActive: true,
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'ECT Qualification Allowance',
    description: 'Weekly allowance for Early Childhood Teachers with full-time hours',
    type: 'allowance',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'qualification', operator: 'equals', value: 'ECT' },
          { id: 'c2', field: 'hours_worked', operator: 'greater_than', value: '35' },
        ]
      }
    ],
    groupLogic: 'AND',
    actions: [
      { id: 'a1', type: 'add_allowance', value: '45.00' },
    ],
    priority: 3,
    isActive: true,
    createdAt: '2024-02-15',
  },
];

const conditionFields = [
  { value: 'years_of_service', label: 'Years of Service' },
  { value: 'classification_level', label: 'Classification Level' },
  { value: 'employment_type', label: 'Employment Type' },
  { value: 'shift_type', label: 'Shift Type' },
  { value: 'shift_start_time', label: 'Shift Start Time' },
  { value: 'shift_end_time', label: 'Shift End Time' },
  { value: 'day_of_week', label: 'Day of Week' },
  { value: 'public_holiday', label: 'Public Holiday' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'location', label: 'Location' },
  { value: 'hours_worked', label: 'Hours Worked' },
  { value: 'overtime_hours', label: 'Overtime Hours' },
  { value: 'shift_duration', label: 'Shift Duration' },
];

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: 'Greater or Equal' },
  { value: 'less_or_equal', label: 'Less or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'is_true', label: 'Is True' },
  { value: 'is_false', label: 'Is False' },
];

const actionTypes = [
  { value: 'apply_multiplier', label: 'Apply Multiplier' },
  { value: 'apply_percentage', label: 'Apply Percentage' },
  { value: 'add_allowance', label: 'Add Allowance' },
  { value: 'set_rate', label: 'Set Fixed Rate' },
  { value: 'add_bonus', label: 'Add Bonus' },
  { value: 'reduce_rate', label: 'Reduce Rate' },
  { value: 'cap_at', label: 'Cap At Maximum' },
];

export function CustomRuleBuilderPanel() {
  const [rules, setRules] = useState<CustomRule[]>(mockRules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    description: string;
    type: CustomRule['type'];
    conditionGroups: ConditionGroup[];
    groupLogic: 'AND' | 'OR';
    actions: RuleAction[];
  }>({
    name: '',
    description: '',
    type: 'overtime',
    conditionGroups: [{
      id: '1',
      logic: 'AND',
      conditions: [{ id: '1', field: '', operator: '', value: '' }]
    }],
    groupLogic: 'AND',
    actions: [{ id: '1', type: '', value: '' }],
  });

  const handleAddRule = () => {
    if (!newRule.name || !newRule.conditionGroups[0].conditions[0].field || !newRule.actions[0].type) {
      toast.error('Please fill in all required fields');
      return;
    }

    const rule: CustomRule = {
      id: Date.now().toString(),
      ...newRule,
      priority: rules.length + 1,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRules([...rules, rule]);
    toast.success('Custom rule created successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      description: '',
      type: 'overtime',
      conditionGroups: [{
        id: '1',
        logic: 'AND',
        conditions: [{ id: '1', field: '', operator: '', value: '' }]
      }],
      groupLogic: 'AND',
      actions: [{ id: '1', type: '', value: '' }],
    });
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const addConditionGroup = () => {
    setNewRule(prev => ({
      ...prev,
      conditionGroups: [...prev.conditionGroups, {
        id: Date.now().toString(),
        logic: 'AND',
        conditions: [{ id: Date.now().toString(), field: '', operator: '', value: '' }]
      }],
    }));
  };

  const addConditionToGroup = (groupIndex: number) => {
    setNewRule(prev => {
      const updated = [...prev.conditionGroups];
      updated[groupIndex].conditions.push({
        id: Date.now().toString(),
        field: '',
        operator: '',
        value: ''
      });
      return { ...prev, conditionGroups: updated };
    });
  };

  const removeConditionFromGroup = (groupIndex: number, conditionIndex: number) => {
    setNewRule(prev => {
      const updated = [...prev.conditionGroups];
      updated[groupIndex].conditions = updated[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
      return { ...prev, conditionGroups: updated };
    });
  };

  const removeConditionGroup = (groupIndex: number) => {
    setNewRule(prev => ({
      ...prev,
      conditionGroups: prev.conditionGroups.filter((_, i) => i !== groupIndex),
    }));
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    setNewRule(prev => {
      const updated = [...prev.conditionGroups];
      (updated[groupIndex].conditions[conditionIndex] as any)[field] = value;
      return { ...prev, conditionGroups: updated };
    });
  };

  const updateGroupLogic = (groupIndex: number, logic: 'AND' | 'OR') => {
    setNewRule(prev => {
      const updated = [...prev.conditionGroups];
      updated[groupIndex].logic = logic;
      return { ...prev, conditionGroups: updated };
    });
  };

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [...prev.actions, { id: Date.now().toString(), type: '', value: '' }],
    }));
  };

  const removeAction = (actionIndex: number) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== actionIndex),
    }));
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'overtime': return <Clock className="h-4 w-4" />;
      case 'penalty': return <Percent className="h-4 w-4" />;
      case 'allowance': return <DollarSign className="h-4 w-4" />;
      case 'leave_loading': return <Calendar className="h-4 w-4" />;
      default: return <Settings2 className="h-4 w-4" />;
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      overtime: 'bg-blue-500/10 text-blue-700 border-blue-200',
      penalty: 'bg-purple-500/10 text-purple-700 border-purple-200',
      allowance: 'bg-green-500/10 text-green-700 border-green-200',
      leave_loading: 'bg-amber-500/10 text-amber-700 border-amber-200',
      condition: 'bg-gray-500/10 text-gray-700 border-gray-200',
    };
    return <Badge className={colors[type] || colors.condition}>{type.replace('_', ' ')}</Badge>;
  };

  const renderConditionText = (rule: CustomRule) => {
    return rule.conditionGroups.map((group, gIndex) => (
      <span key={group.id}>
        {gIndex > 0 && <span className="mx-2 font-bold text-primary">{rule.groupLogic}</span>}
        <span className="text-muted-foreground">(</span>
        {group.conditions.map((c, cIndex) => (
          <span key={c.id}>
            {cIndex > 0 && <span className="mx-1 text-xs font-semibold text-blue-600">{group.logic}</span>}
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.field}</span>
            <span className="mx-1 text-xs text-muted-foreground">{c.operator.replace('_', ' ')}</span>
            <span className="text-xs font-medium">{c.value}</span>
          </span>
        ))}
        <span className="text-muted-foreground">)</span>
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Rule Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create advanced pay calculation rules with AND/OR condition groups
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Create Custom Rule
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., Senior Staff Overtime Premium"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select 
                      value={newRule.type} 
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, type: v as CustomRule['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overtime">Overtime</SelectItem>
                        <SelectItem value="penalty">Penalty Rate</SelectItem>
                        <SelectItem value="allowance">Allowance</SelectItem>
                        <SelectItem value="leave_loading">Leave Loading</SelectItem>
                        <SelectItem value="condition">General Condition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what this rule does..."
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Condition Groups */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Conditions (IF)</Label>
                      <Badge variant="outline" className="gap-1">
                        <GitBranch className="h-3 w-3" />
                        Grouped Logic
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={addConditionGroup}>
                      <Brackets className="h-4 w-4 mr-1" />
                      Add Group
                    </Button>
                  </div>

                  {/* Group Logic Selector */}
                  {newRule.conditionGroups.length > 1 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-sm font-medium">Groups connected by:</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={newRule.groupLogic === 'AND' ? 'default' : 'outline'}
                          onClick={() => setNewRule(prev => ({ ...prev, groupLogic: 'AND' }))}
                          className="h-7 px-3"
                        >
                          AND
                        </Button>
                        <Button
                          size="sm"
                          variant={newRule.groupLogic === 'OR' ? 'default' : 'outline'}
                          onClick={() => setNewRule(prev => ({ ...prev, groupLogic: 'OR' }))}
                          className="h-7 px-3"
                        >
                          OR
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        {newRule.groupLogic === 'AND' ? 'All groups must match' : 'Any group can match'}
                      </span>
                    </div>
                  )}

                  {newRule.conditionGroups.map((group, groupIndex) => (
                    <Card key={group.id} className="border-2 border-dashed">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono">
                              Group {groupIndex + 1}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Conditions:</span>
                              <Button
                                size="sm"
                                variant={group.logic === 'AND' ? 'default' : 'outline'}
                                onClick={() => updateGroupLogic(groupIndex, 'AND')}
                                className="h-6 px-2 text-xs"
                              >
                                AND
                              </Button>
                              <Button
                                size="sm"
                                variant={group.logic === 'OR' ? 'default' : 'outline'}
                                onClick={() => updateGroupLogic(groupIndex, 'OR')}
                                className="h-6 px-2 text-xs"
                              >
                                OR
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addConditionToGroup(groupIndex)}
                              className="h-7"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Condition
                            </Button>
                            {newRule.conditionGroups.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeConditionGroup(groupIndex)}
                                className="h-7 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-2">
                        {group.conditions.map((condition, conditionIndex) => (
                          <div key={condition.id} className="flex items-center gap-2">
                            {conditionIndex > 0 && (
                              <Badge variant="outline" className="text-xs w-10 justify-center">
                                {group.logic}
                              </Badge>
                            )}
                            <div className={`flex-1 grid grid-cols-3 gap-2 ${conditionIndex > 0 ? '' : 'ml-12'}`}>
                              <Select 
                                value={condition.field}
                                onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'field', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {conditionFields.map(f => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={condition.operator}
                                onValueChange={(v) => updateCondition(groupIndex, conditionIndex, 'operator', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {operators.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-1">
                                <Input
                                  placeholder="Value"
                                  value={condition.value}
                                  onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                                  className="h-9"
                                />
                                {group.conditions.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeConditionFromGroup(groupIndex, conditionIndex)}
                                    className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Actions (THEN)</Label>
                    <Button variant="outline" size="sm" onClick={addAction}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  {newRule.actions.map((action, index) => (
                    <div key={action.id} className="flex gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <Select 
                          value={action.type}
                          onValueChange={(v) => {
                            const updated = [...newRule.actions];
                            updated[index].type = v;
                            setNewRule(prev => ({ ...prev, actions: updated }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Action type" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map(a => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Value (e.g., 1.5 or 25.00)"
                          value={action.value}
                          onChange={(e) => {
                            const updated = [...newRule.actions];
                            updated[index].value = e.target.value;
                            setNewRule(prev => ({ ...prev, actions: updated }));
                          }}
                        />
                      </div>
                      {newRule.actions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
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
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.type === 'overtime').length}</p>
                <p className="text-sm text-muted-foreground">Overtime Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.type === 'penalty').length}</p>
                <p className="text-sm text-muted-foreground">Penalty Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={`card-material-elevated transition-all ${rule.isActive ? 'ring-2 ring-primary/20' : 'opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    rule.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {getRuleTypeIcon(rule.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{rule.name}</h4>
                      {getRuleTypeBadge(rule.type)}
                      <Badge variant="outline" className="text-xs">Priority: {rule.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-2 text-xs">
                      <span className="font-medium text-primary">IF:</span>
                      {renderConditionText(rule)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <ArrowRight className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">THEN:</span>
                      {rule.actions.map((a, i) => (
                        <span key={a.id} className="text-xs">
                          {i > 0 && ', '}
                          <Badge variant="secondary" className="text-xs">
                            {a.type.replace('_', ' ')}: {a.value}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="card-material">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Custom Rules</h3>
            <p className="text-muted-foreground">Create your first custom rule to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}