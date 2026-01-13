import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { australianAwards } from '@/data/australianAwards';
import { 
  Plus, Settings2, Clock, Calendar, DollarSign, Percent, 
  Trash2, Edit2, Copy, CheckCircle2, AlertCircle, 
  Zap, Layers, ArrowRight, Code2, GitBranch, Brackets,
  Search, Filter, Download, Upload, Play, TestTube,
  GripVertical, ChevronDown, ChevronRight, Eye, EyeOff,
  BookOpen, Lightbulb, FileText, RefreshCw, AlertTriangle,
  Sparkles, Target, Shield, X, MoreVertical, History, Save,
  RotateCcw, ArrowUpDown, MoveUp, MoveDown, Clock3, User
} from 'lucide-react';

// Version history types
interface RuleVersion {
  id: string;
  version: number;
  timestamp: string;
  changedBy: string;
  changeType: 'created' | 'updated' | 'restored';
  changeSummary: string;
  snapshot: Omit<CustomRule, 'versions'>;
}

interface RuleWithVersions extends CustomRule {
  versions?: RuleVersion[];
  currentVersion?: number;
}

// Types
interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  valueType?: 'text' | 'number' | 'date' | 'time' | 'boolean' | 'select';
}

interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
  isCollapsed?: boolean;
}

interface RuleAction {
  id: string;
  type: string;
  value: string;
  unit?: string;
}

interface CustomRule {
  id: string;
  name: string;
  description: string;
  type: 'overtime' | 'penalty' | 'allowance' | 'leave_loading' | 'condition';
  awardId?: string;
  classificationId?: string;
  conditionGroups: ConditionGroup[];
  groupLogic: 'AND' | 'OR';
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  isCustom: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testResult?: 'pass' | 'fail' | 'pending';
  usageCount?: number;
  tags?: string[];
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  type: CustomRule['type'];
  conditionGroups: ConditionGroup[];
  groupLogic: 'AND' | 'OR';
  actions: RuleAction[];
  category: string;
}

// Mock Data with version history
const mockRules: RuleWithVersions[] = [
  {
    id: '1',
    name: 'Senior Staff Overtime Premium',
    description: 'Additional 10% on overtime for staff with 5+ years experience',
    type: 'overtime',
    awardId: 'childrens-services',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'years_of_service', operator: 'greater_than', value: '5', valueType: 'number' },
          { id: 'c2', field: 'shift_type', operator: 'equals', value: 'overtime', valueType: 'select' },
        ]
      }
    ],
    groupLogic: 'AND',
    actions: [
      { id: 'a1', type: 'apply_multiplier', value: '1.10', unit: 'x' },
    ],
    priority: 1,
    isActive: true,
    isCustom: true,
    createdAt: '2024-01-15',
    usageCount: 234,
    tags: ['senior', 'overtime'],
    testResult: 'pass',
    currentVersion: 3,
    versions: [
      {
        id: 'v1-3',
        version: 3,
        timestamp: '2024-03-15T10:30:00Z',
        changedBy: 'Admin User',
        changeType: 'updated',
        changeSummary: 'Changed multiplier from 1.05 to 1.10',
        snapshot: {
          id: '1',
          name: 'Senior Staff Overtime Premium',
          description: 'Additional 10% on overtime for staff with 5+ years experience',
          type: 'overtime',
          awardId: 'childrens-services',
          conditionGroups: [{ id: 'g1', logic: 'AND', conditions: [{ id: 'c1', field: 'years_of_service', operator: 'greater_than', value: '5', valueType: 'number' }, { id: 'c2', field: 'shift_type', operator: 'equals', value: 'overtime', valueType: 'select' }] }],
          groupLogic: 'AND',
          actions: [{ id: 'a1', type: 'apply_multiplier', value: '1.10', unit: 'x' }],
          priority: 1,
          isActive: true,
          isCustom: true,
          createdAt: '2024-01-15',
        }
      },
      {
        id: 'v1-2',
        version: 2,
        timestamp: '2024-02-10T14:20:00Z',
        changedBy: 'Admin User',
        changeType: 'updated',
        changeSummary: 'Added shift type condition',
        snapshot: {
          id: '1',
          name: 'Senior Staff Overtime Premium',
          description: 'Additional 5% on overtime for staff with 5+ years experience',
          type: 'overtime',
          awardId: 'childrens-services',
          conditionGroups: [{ id: 'g1', logic: 'AND', conditions: [{ id: 'c1', field: 'years_of_service', operator: 'greater_than', value: '5', valueType: 'number' }, { id: 'c2', field: 'shift_type', operator: 'equals', value: 'overtime', valueType: 'select' }] }],
          groupLogic: 'AND',
          actions: [{ id: 'a1', type: 'apply_multiplier', value: '1.05', unit: 'x' }],
          priority: 1,
          isActive: true,
          isCustom: true,
          createdAt: '2024-01-15',
        }
      },
      {
        id: 'v1-1',
        version: 1,
        timestamp: '2024-01-15T09:00:00Z',
        changedBy: 'Admin User',
        changeType: 'created',
        changeSummary: 'Initial rule creation',
        snapshot: {
          id: '1',
          name: 'Senior Staff Overtime Premium',
          description: 'Additional 5% on overtime for senior staff',
          type: 'overtime',
          awardId: 'childrens-services',
          conditionGroups: [{ id: 'g1', logic: 'AND', conditions: [{ id: 'c1', field: 'years_of_service', operator: 'greater_than', value: '5', valueType: 'number' }] }],
          groupLogic: 'AND',
          actions: [{ id: 'a1', type: 'apply_multiplier', value: '1.05', unit: 'x' }],
          priority: 1,
          isActive: true,
          isCustom: true,
          createdAt: '2024-01-15',
        }
      },
    ],
  },
  {
    id: '2',
    name: 'Night Shift Loading',
    description: 'Additional 15% loading for shifts between 10pm-6am OR on weekends',
    type: 'penalty',
    awardId: 'hospitality-general',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'shift_start_time', operator: 'between', value: '22:00-06:00', valueType: 'time' },
        ]
      },
      {
        id: 'g2',
        logic: 'OR',
        conditions: [
          { id: 'c2', field: 'day_of_week', operator: 'equals', value: 'Saturday', valueType: 'select' },
          { id: 'c3', field: 'day_of_week', operator: 'equals', value: 'Sunday', valueType: 'select' },
        ]
      }
    ],
    groupLogic: 'OR',
    actions: [
      { id: 'a1', type: 'apply_percentage', value: '15', unit: '%' },
    ],
    priority: 2,
    isActive: true,
    isCustom: true,
    createdAt: '2024-02-01',
    usageCount: 567,
    tags: ['night', 'penalty'],
    testResult: 'pass',
  },
  {
    id: '3',
    name: 'ECT Qualification Allowance',
    description: 'Weekly allowance for Early Childhood Teachers with full-time hours',
    type: 'allowance',
    awardId: 'childrens-services',
    classificationId: 'level-4',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'AND',
        conditions: [
          { id: 'c1', field: 'qualification', operator: 'equals', value: 'ECT', valueType: 'select' },
          { id: 'c2', field: 'hours_worked', operator: 'greater_than', value: '35', valueType: 'number' },
        ]
      }
    ],
    groupLogic: 'AND',
    actions: [
      { id: 'a1', type: 'add_allowance', value: '45.00', unit: '$' },
    ],
    priority: 3,
    isActive: true,
    isCustom: true,
    createdAt: '2024-02-15',
    usageCount: 123,
    tags: ['qualification', 'allowance'],
    testResult: 'pending',
  },
  {
    id: '4',
    name: 'Weekend Penalty Rate',
    description: 'Standard award penalty rate for weekend work',
    type: 'penalty',
    awardId: 'retail-industry',
    conditionGroups: [
      {
        id: 'g1',
        logic: 'OR',
        conditions: [
          { id: 'c1', field: 'day_of_week', operator: 'equals', value: 'Saturday', valueType: 'select' },
          { id: 'c2', field: 'day_of_week', operator: 'equals', value: 'Sunday', valueType: 'select' },
        ]
      }
    ],
    groupLogic: 'AND',
    actions: [
      { id: 'a1', type: 'apply_multiplier', value: '1.5', unit: 'x' },
    ],
    priority: 4,
    isActive: true,
    isCustom: false,
    createdAt: '2024-01-01',
    usageCount: 890,
    testResult: 'pass',
  },
];

const ruleTemplates: RuleTemplate[] = [
  {
    id: 't1',
    name: 'Overtime After 8 Hours',
    description: 'Apply overtime rate after 8 hours worked in a day',
    type: 'overtime',
    category: 'Time-Based',
    conditionGroups: [{
      id: 'g1', logic: 'AND',
      conditions: [{ id: 'c1', field: 'daily_hours', operator: 'greater_than', value: '8', valueType: 'number' }]
    }],
    groupLogic: 'AND',
    actions: [{ id: 'a1', type: 'apply_multiplier', value: '1.5', unit: 'x' }]
  },
  {
    id: 't2',
    name: 'Public Holiday Rate',
    description: 'Double time for public holiday work',
    type: 'penalty',
    category: 'Holiday',
    conditionGroups: [{
      id: 'g1', logic: 'AND',
      conditions: [{ id: 'c1', field: 'public_holiday', operator: 'is_true', value: '', valueType: 'boolean' }]
    }],
    groupLogic: 'AND',
    actions: [{ id: 'a1', type: 'apply_multiplier', value: '2.0', unit: 'x' }]
  },
  {
    id: 't3',
    name: 'Qualification Bonus',
    description: 'Additional pay for holding specific qualification',
    type: 'allowance',
    category: 'Qualification',
    conditionGroups: [{
      id: 'g1', logic: 'AND',
      conditions: [{ id: 'c1', field: 'qualification', operator: 'equals', value: '', valueType: 'select' }]
    }],
    groupLogic: 'AND',
    actions: [{ id: 'a1', type: 'add_allowance', value: '', unit: '$' }]
  },
];

const conditionFields = [
  { value: 'years_of_service', label: 'Years of Service', type: 'number', icon: History },
  { value: 'classification_level', label: 'Classification Level', type: 'select', icon: Layers },
  { value: 'employment_type', label: 'Employment Type', type: 'select', icon: FileText },
  { value: 'shift_type', label: 'Shift Type', type: 'select', icon: Clock },
  { value: 'shift_start_time', label: 'Shift Start Time', type: 'time', icon: Clock },
  { value: 'shift_end_time', label: 'Shift End Time', type: 'time', icon: Clock },
  { value: 'day_of_week', label: 'Day of Week', type: 'select', icon: Calendar },
  { value: 'public_holiday', label: 'Public Holiday', type: 'boolean', icon: Calendar },
  { value: 'qualification', label: 'Qualification', type: 'select', icon: BookOpen },
  { value: 'location', label: 'Location', type: 'select', icon: Target },
  { value: 'hours_worked', label: 'Hours Worked', type: 'number', icon: Clock },
  { value: 'daily_hours', label: 'Daily Hours', type: 'number', icon: Clock },
  { value: 'weekly_hours', label: 'Weekly Hours', type: 'number', icon: Clock },
  { value: 'overtime_hours', label: 'Overtime Hours', type: 'number', icon: Clock },
  { value: 'shift_duration', label: 'Shift Duration', type: 'number', icon: Clock },
  { value: 'age', label: 'Employee Age', type: 'number', icon: FileText },
  { value: 'is_casual', label: 'Is Casual', type: 'boolean', icon: FileText },
];

const operators = [
  { value: 'equals', label: 'Equals', symbol: '=' },
  { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
  { value: 'greater_than', label: 'Greater Than', symbol: '>' },
  { value: 'less_than', label: 'Less Than', symbol: '<' },
  { value: 'greater_or_equal', label: 'Greater or Equal', symbol: '≥' },
  { value: 'less_or_equal', label: 'Less or Equal', symbol: '≤' },
  { value: 'between', label: 'Between', symbol: '↔' },
  { value: 'contains', label: 'Contains', symbol: '⊃' },
  { value: 'starts_with', label: 'Starts With', symbol: '^' },
  { value: 'is_true', label: 'Is True', symbol: '✓' },
  { value: 'is_false', label: 'Is False', symbol: '✗' },
];

const actionTypes = [
  { value: 'apply_multiplier', label: 'Apply Multiplier', icon: Zap, unit: 'x', description: 'Multiply base rate' },
  { value: 'apply_percentage', label: 'Apply Percentage', icon: Percent, unit: '%', description: 'Add percentage to rate' },
  { value: 'add_allowance', label: 'Add Allowance', icon: DollarSign, unit: '$', description: 'Add fixed amount' },
  { value: 'set_rate', label: 'Set Fixed Rate', icon: Target, unit: '$', description: 'Override with fixed rate' },
  { value: 'add_bonus', label: 'Add Bonus', icon: Sparkles, unit: '$', description: 'One-time bonus amount' },
  { value: 'reduce_rate', label: 'Reduce Rate', icon: AlertTriangle, unit: '%', description: 'Reduce by percentage' },
  { value: 'cap_at', label: 'Cap At Maximum', icon: Shield, unit: '$', description: 'Maximum cap on earnings' },
];

const ruleTypeConfig = {
  overtime: { color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Clock, label: 'Overtime' },
  penalty: { color: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: Percent, label: 'Penalty' },
  allowance: { color: 'bg-green-500/10 text-green-700 border-green-200', icon: DollarSign, label: 'Allowance' },
  leave_loading: { color: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: Calendar, label: 'Leave Loading' },
  condition: { color: 'bg-gray-500/10 text-gray-700 border-gray-200', icon: Settings2, label: 'Condition' },
};

export function CustomRuleBuilderPanel() {
  // State
  const [rules, setRules] = useState<RuleWithVersions[]>(mockRules);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleWithVersions | null>(null);
  const [panelTab, setPanelTab] = useState<'builder' | 'templates' | 'test' | 'history'>('builder');
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [selectedRuleForHistory, setSelectedRuleForHistory] = useState<RuleWithVersions | null>(null);
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState<number | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAward, setFilterAward] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState<{
    name: string;
    description: string;
    type: CustomRule['type'];
    awardId: string;
    classificationId: string;
    conditionGroups: ConditionGroup[];
    groupLogic: 'AND' | 'OR';
    actions: RuleAction[];
    priority: number;
    effectiveFrom: string;
    effectiveTo: string;
    tags: string[];
  }>({
    name: '',
    description: '',
    type: 'overtime',
    awardId: '',
    classificationId: '',
    conditionGroups: [{
      id: '1',
      logic: 'AND',
      conditions: [{ id: '1', field: '', operator: '', value: '' }]
    }],
    groupLogic: 'AND',
    actions: [{ id: '1', type: '', value: '' }],
    priority: rules.length + 1,
    effectiveFrom: '',
    effectiveTo: '',
    tags: [],
  });
  
  const [testScenario, setTestScenario] = useState({
    hoursWorked: 8,
    dayOfWeek: 'Monday',
    isPublicHoliday: false,
    shiftType: 'regular',
    baseRate: 25,
  });

  // Computed values
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !rule.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterAward !== 'all' && rule.awardId !== filterAward) return false;
      if (filterType !== 'all' && rule.type !== filterType) return false;
      if (filterStatus === 'active' && !rule.isActive) return false;
      if (filterStatus === 'inactive' && rule.isActive) return false;
      if (showCustomOnly && !rule.isCustom) return false;
      return true;
    });
  }, [rules, searchQuery, filterAward, filterType, filterStatus, showCustomOnly]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    custom: rules.filter(r => r.isCustom).length,
    byType: {
      overtime: rules.filter(r => r.type === 'overtime').length,
      penalty: rules.filter(r => r.type === 'penalty').length,
      allowance: rules.filter(r => r.type === 'allowance').length,
      leave_loading: rules.filter(r => r.type === 'leave_loading').length,
    }
  }), [rules]);

  const selectedAwardClassifications = useMemo(() => {
    if (!ruleForm.awardId) return [];
    const award = australianAwards.find(a => a.id === ruleForm.awardId);
    return award?.classifications || [];
  }, [ruleForm.awardId]);

  // Handlers
  const openNewRulePanel = () => {
    setEditingRule(null);
    resetForm();
    setPanelTab('builder');
    setIsPanelOpen(true);
  };

  const openEditRulePanel = (rule: RuleWithVersions) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      awardId: rule.awardId || '',
      classificationId: rule.classificationId || '',
      conditionGroups: JSON.parse(JSON.stringify(rule.conditionGroups)),
      groupLogic: rule.groupLogic,
      actions: JSON.parse(JSON.stringify(rule.actions)),
      priority: rule.priority,
      effectiveFrom: rule.effectiveFrom || '',
      effectiveTo: rule.effectiveTo || '',
      tags: rule.tags || [],
    });
    setPanelTab('builder');
    setIsPanelOpen(true);
  };

  const resetForm = () => {
    setRuleForm({
      name: '',
      description: '',
      type: 'overtime',
      awardId: '',
      classificationId: '',
      conditionGroups: [{
        id: '1',
        logic: 'AND',
        conditions: [{ id: '1', field: '', operator: '', value: '' }]
      }],
      groupLogic: 'AND',
      actions: [{ id: '1', type: '', value: '' }],
      priority: rules.length + 1,
      effectiveFrom: '',
      effectiveTo: '',
      tags: [],
    });
  };

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.conditionGroups[0]?.conditions[0]?.field || !ruleForm.actions[0]?.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingRule) {
      // Create version history entry
      const newVersion: RuleVersion = {
        id: `v${editingRule.id}-${(editingRule.currentVersion || 0) + 1}`,
        version: (editingRule.currentVersion || 0) + 1,
        timestamp,
        changedBy: 'Current User',
        changeType: 'updated',
        changeSummary: `Updated rule configuration`,
        snapshot: {
          ...editingRule,
          versions: undefined,
          currentVersion: undefined,
        } as Omit<CustomRule, 'versions'>,
      };

      setRules(prev => prev.map(r => 
        r.id === editingRule.id 
          ? { 
              ...r, 
              ...ruleForm, 
              updatedAt: timestamp.split('T')[0], 
              isCustom: true,
              currentVersion: (r.currentVersion || 0) + 1,
              versions: [newVersion, ...(r.versions || [])],
            }
          : r
      ));
      toast.success('Rule updated successfully. Version saved to history.');
    } else {
      const newRuleId = Date.now().toString();
      const initialVersion: RuleVersion = {
        id: `v${newRuleId}-1`,
        version: 1,
        timestamp,
        changedBy: 'Current User',
        changeType: 'created',
        changeSummary: 'Initial rule creation',
        snapshot: {
          id: newRuleId,
          ...ruleForm,
          isActive: true,
          isCustom: true,
          createdAt: timestamp.split('T')[0],
        },
      };

      const newRule: RuleWithVersions = {
        id: newRuleId,
        ...ruleForm,
        isActive: true,
        isCustom: true,
        createdAt: timestamp.split('T')[0],
        usageCount: 0,
        testResult: 'pending',
        currentVersion: 1,
        versions: [initialVersion],
      };
      setRules([...rules, newRule]);
      toast.success('Rule created successfully');
    }
    
    setIsPanelOpen(false);
    resetForm();
  };

  const handleApplyTemplate = (template: RuleTemplate) => {
    setRuleForm(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      type: template.type,
      conditionGroups: JSON.parse(JSON.stringify(template.conditionGroups)),
      groupLogic: template.groupLogic,
      actions: JSON.parse(JSON.stringify(template.actions)),
    }));
    setPanelTab('builder');
    toast.success('Template applied! Customize the values.');
  };

  const handleTestRule = () => {
    // Simulate rule testing
    setTimeout(() => {
      const result = Math.random() > 0.3 ? 'pass' : 'fail';
      toast.success(`Test ${result === 'pass' ? 'passed' : 'failed'}!`);
    }, 500);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRule = (rule: CustomRule) => {
    if (!rule.isCustom) {
      toast.error('Cannot delete award-mandated rules');
      return;
    }
    setRules(prev => prev.filter(r => r.id !== rule.id));
    toast.success('Rule deleted');
  };

  const duplicateRule = (rule: RuleWithVersions) => {
    const newRuleId = Date.now().toString();
    const timestamp = new Date().toISOString();
    const newRule: RuleWithVersions = {
      ...rule,
      id: newRuleId,
      name: `${rule.name} (Copy)`,
      isCustom: true,
      createdAt: timestamp.split('T')[0],
      usageCount: 0,
      currentVersion: 1,
      versions: [{
        id: `v${newRuleId}-1`,
        version: 1,
        timestamp,
        changedBy: 'Current User',
        changeType: 'created',
        changeSummary: `Duplicated from "${rule.name}"`,
        snapshot: { ...rule, versions: undefined, currentVersion: undefined } as Omit<CustomRule, 'versions'>,
      }],
    };
    setRules([...rules, newRule]);
    toast.success('Rule duplicated');
  };

  // Version history handlers
  const openHistoryPanel = (rule: RuleWithVersions) => {
    setSelectedRuleForHistory(rule);
    setHistoryPanelOpen(true);
  };

  const restoreVersion = (rule: RuleWithVersions, version: RuleVersion) => {
    const timestamp = new Date().toISOString();
    const restoredVersion: RuleVersion = {
      id: `v${rule.id}-${(rule.currentVersion || 0) + 1}`,
      version: (rule.currentVersion || 0) + 1,
      timestamp,
      changedBy: 'Current User',
      changeType: 'restored',
      changeSummary: `Restored to version ${version.version}`,
      snapshot: { ...version.snapshot },
    };

    setRules(prev => prev.map(r => 
      r.id === rule.id 
        ? { 
            ...version.snapshot,
            id: rule.id,
            currentVersion: (r.currentVersion || 0) + 1,
            versions: [restoredVersion, ...(r.versions || [])],
          }
        : r
    ));
    setHistoryPanelOpen(false);
    toast.success(`Restored to version ${version.version}`);
  };

  // Drag and drop handlers for rule priority
  const handleRuleDragStart = (ruleId: string) => {
    setDraggedRuleId(ruleId);
  };

  const handleRuleDragOver = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault();
    if (draggedRuleId && draggedRuleId !== targetRuleId) {
      const draggedIndex = rules.findIndex(r => r.id === draggedRuleId);
      const targetIndex = rules.findIndex(r => r.id === targetRuleId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newRules = [...rules];
        const [draggedRule] = newRules.splice(draggedIndex, 1);
        newRules.splice(targetIndex, 0, draggedRule);
        
        // Update priorities
        newRules.forEach((rule, index) => {
          rule.priority = index + 1;
        });
        
        setRules(newRules);
      }
    }
  };

  const handleRuleDragEnd = () => {
    if (draggedRuleId) {
      toast.success('Rule priority updated');
    }
    setDraggedRuleId(null);
  };

  const moveRulePriority = (ruleId: string, direction: 'up' | 'down') => {
    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rules.length - 1) return;

    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    
    newRules.forEach((rule, idx) => {
      rule.priority = idx + 1;
    });
    
    setRules(newRules);
    toast.success('Rule priority updated');
  };

  // Drag and drop handlers for condition groups
  const handleGroupDragStart = (groupIndex: number) => {
    setDraggedGroupIndex(groupIndex);
  };

  const handleGroupDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverGroupIndex(targetIndex);
  };

  const handleGroupDrop = (targetIndex: number) => {
    if (draggedGroupIndex !== null && draggedGroupIndex !== targetIndex) {
      setRuleForm(prev => {
        const newGroups = [...prev.conditionGroups];
        const [draggedGroup] = newGroups.splice(draggedGroupIndex, 1);
        newGroups.splice(targetIndex, 0, draggedGroup);
        return { ...prev, conditionGroups: newGroups };
      });
    }
    setDraggedGroupIndex(null);
    setDragOverGroupIndex(null);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupIndex(null);
    setDragOverGroupIndex(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredRules, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-rules.json';
    a.click();
    toast.success('Rules exported');
  };

  // Condition group handlers
  const addConditionGroup = () => {
    setRuleForm(prev => ({
      ...prev,
      conditionGroups: [...prev.conditionGroups, {
        id: Date.now().toString(),
        logic: 'AND',
        conditions: [{ id: Date.now().toString(), field: '', operator: '', value: '' }]
      }],
    }));
  };

  const addConditionToGroup = (groupIndex: number) => {
    setRuleForm(prev => {
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
    setRuleForm(prev => {
      const updated = [...prev.conditionGroups];
      updated[groupIndex].conditions = updated[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
      return { ...prev, conditionGroups: updated };
    });
  };

  const removeConditionGroup = (groupIndex: number) => {
    setRuleForm(prev => ({
      ...prev,
      conditionGroups: prev.conditionGroups.filter((_, i) => i !== groupIndex),
    }));
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    setRuleForm(prev => {
      const updated = [...prev.conditionGroups];
      (updated[groupIndex].conditions[conditionIndex] as any)[field] = value;
      return { ...prev, conditionGroups: updated };
    });
  };

  const updateGroupLogic = (groupIndex: number, logic: 'AND' | 'OR') => {
    setRuleForm(prev => {
      const updated = [...prev.conditionGroups];
      updated[groupIndex].logic = logic;
      return { ...prev, conditionGroups: updated };
    });
  };

  const addAction = () => {
    setRuleForm(prev => ({
      ...prev,
      actions: [...prev.actions, { id: Date.now().toString(), type: '', value: '' }],
    }));
  };

  const removeAction = (actionIndex: number) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== actionIndex),
    }));
  };

  const updateAction = (index: number, field: string, value: string) => {
    setRuleForm(prev => {
      const updated = [...prev.actions];
      (updated[index] as any)[field] = value;
      return { ...prev, actions: updated };
    });
  };

  // Render helpers
  const getAwardName = (awardId?: string) => {
    if (!awardId) return 'All Awards';
    const award = australianAwards.find(a => a.id === awardId);
    return award?.shortName || award?.name || awardId;
  };

  const renderConditionPreview = (rule: CustomRule) => {
    return rule.conditionGroups.map((group, gIndex) => (
      <span key={group.id} className="inline-flex items-center gap-1 flex-wrap">
        {gIndex > 0 && <Badge variant="outline" className="mx-1 text-xs font-bold">{rule.groupLogic}</Badge>}
        <span className="text-muted-foreground">(</span>
        {group.conditions.map((c, cIndex) => (
          <span key={c.id} className="inline-flex items-center gap-0.5">
            {cIndex > 0 && <span className="mx-1 text-xs font-semibold text-primary">{group.logic}</span>}
            <Badge variant="secondary" className="text-xs font-mono">{c.field}</Badge>
            <span className="text-xs text-muted-foreground mx-0.5">
              {operators.find(o => o.value === c.operator)?.symbol || c.operator}
            </span>
            <span className="text-xs font-medium">{c.value}</span>
          </span>
        ))}
        <span className="text-muted-foreground">)</span>
      </span>
    ));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Custom Rule Builder
            </h3>
            <p className="text-sm text-muted-foreground">
              Create advanced pay calculation rules with visual condition builder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button onClick={openNewRulePanel} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="card-material">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Rules</p>
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
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
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
                  <p className="text-2xl font-bold">{stats.byType.overtime}</p>
                  <p className="text-xs text-muted-foreground">Overtime</p>
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
                  <p className="text-2xl font-bold">{stats.byType.penalty}</p>
                  <p className="text-xs text-muted-foreground">Penalty</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-material">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.custom}</p>
                  <p className="text-xs text-muted-foreground">Custom</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filterAward} onValueChange={setFilterAward}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Award" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Awards</SelectItem>
                  {australianAwards.map(award => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.shortName || award.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rule Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="allowance">Allowance</SelectItem>
                  <SelectItem value="leave_loading">Leave Loading</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="custom-only"
                  checked={showCustomOnly}
                  onCheckedChange={setShowCustomOnly}
                />
                <Label htmlFor="custom-only" className="text-sm cursor-pointer">Custom Only</Label>
              </div>

              {(searchQuery || filterAward !== 'all' || filterType !== 'all' || filterStatus !== 'all' || showCustomOnly) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAward('all');
                    setFilterType('all');
                    setFilterStatus('all');
                    setShowCustomOnly(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredRules.length} of {rules.length} rules
            </div>
          </CardContent>
        </Card>

        {/* Rules List */}
        <div className="space-y-3">
          {filteredRules.map((rule) => {
            const typeConfig = ruleTypeConfig[rule.type];
            const TypeIcon = typeConfig.icon;
            const isDragging = draggedRuleId === rule.id;
            
            return (
              <Card 
                key={rule.id} 
                className={`card-material-elevated transition-all hover:shadow-lg ${
                  rule.isActive ? 'ring-1 ring-primary/20' : 'opacity-60'
                } ${isDragging ? 'opacity-50 scale-[0.98]' : ''}`}
                draggable
                onDragStart={() => handleRuleDragStart(rule.id)}
                onDragOver={(e) => handleRuleDragOver(e, rule.id)}
                onDragEnd={handleRuleDragEnd}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Drag Handle & Icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                        <div className="flex flex-col">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                                onClick={() => moveRulePriority(rule.id, 'up')}
                                disabled={rule.priority === 1}
                              >
                                <MoveUp className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move Up</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                                onClick={() => moveRulePriority(rule.id, 'down')}
                                disabled={rule.priority === rules.length}
                              >
                                <MoveDown className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move Down</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        rule.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-base">{rule.name}</h4>
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        <Badge variant="outline" className="text-xs font-mono">P{rule.priority}</Badge>
                        {rule.currentVersion && (
                          <Badge variant="outline" className="text-xs font-mono">v{rule.currentVersion}</Badge>
                        )}
                        {rule.isCustom && (
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                        )}
                        {rule.awardId && (
                          <Badge variant="outline" className="text-xs">{getAwardName(rule.awardId)}</Badge>
                        )}
                        {rule.testResult === 'pass' && (
                          <Tooltip>
                            <TooltipTrigger>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </TooltipTrigger>
                            <TooltipContent>Test Passed</TooltipContent>
                          </Tooltip>
                        )}
                        {rule.testResult === 'fail' && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </TooltipTrigger>
                            <TooltipContent>Test Failed</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      
                      {/* Condition Preview */}
                      <div className="flex flex-wrap items-center gap-1 text-xs mb-2">
                        <span className="font-semibold text-primary">IF:</span>
                        {renderConditionPreview(rule)}
                      </div>
                      
                      {/* Action Preview */}
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">THEN:</span>
                        {rule.actions.map((action, i) => {
                          const actionConfig = actionTypes.find(a => a.value === action.type);
                          return (
                            <Badge key={action.id} variant="secondary" className="text-xs gap-1">
                              {actionConfig?.icon && <actionConfig.icon className="h-3 w-3" />}
                              {action.type.replace(/_/g, ' ')}: {action.value}{action.unit || actionConfig?.unit}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Meta info */}
                      {(rule.usageCount !== undefined || rule.createdAt || rule.versions?.length) && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {rule.usageCount !== undefined && (
                            <span>Used {rule.usageCount} times</span>
                          )}
                          <span>Created {rule.createdAt}</span>
                          {rule.versions && rule.versions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <History className="h-3 w-3" />
                              {rule.versions.length} version{rule.versions.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Switch 
                        checked={rule.isActive} 
                        onCheckedChange={() => toggleRule(rule.id)} 
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => openHistoryPanel(rule)}
                            disabled={!rule.versions || rule.versions.length === 0}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Version History</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateRule(rule)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRulePanel(rule)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteRule(rule)}
                            disabled={!rule.isCustom}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{rule.isCustom ? 'Delete' : 'Cannot delete award rules'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRules.length === 0 && (
          <Card className="card-material">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {rules.length === 0 ? 'No Custom Rules' : 'No matching rules'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {rules.length === 0 
                  ? 'Create your first custom rule to get started'
                  : 'Try adjusting your filters'
                }
              </p>
              {rules.length === 0 && (
                <Button onClick={openNewRulePanel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Side Panel */}
        <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
          <SheetContent side="right" style={{ width: '800px', maxWidth: '95vw' }}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </SheetTitle>
              <SheetDescription>
                Build custom pay calculation rules with conditions and actions
              </SheetDescription>
            </SheetHeader>

            <Tabs value={panelTab} onValueChange={(v) => setPanelTab(v as any)} className="flex-1 flex flex-col mt-4">
              <TabsList className={`grid w-full ${editingRule ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="builder" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="test" className="gap-2">
                  <TestTube className="h-4 w-4" />
                  Test
                </TabsTrigger>
                {editingRule && (
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                )}
              </TabsList>

              <ScrollArea className="flex-1 mt-4 pr-4" style={{ height: 'calc(100vh - 280px)' }}>
                {/* Builder Tab */}
                <TabsContent value="builder" className="space-y-6 mt-0">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rule Name *</Label>
                          <Input
                            placeholder="e.g., Senior Staff Overtime Premium"
                            value={ruleForm.name}
                            onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rule Type *</Label>
                          <Select 
                            value={ruleForm.type} 
                            onValueChange={(v) => setRuleForm(prev => ({ ...prev, type: v as CustomRule['type'] }))}
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
                          value={ruleForm.description}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Apply to Award</Label>
                          <Select 
                            value={ruleForm.awardId} 
                            onValueChange={(v) => setRuleForm(prev => ({ ...prev, awardId: v, classificationId: '' }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Awards" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Awards</SelectItem>
                              {australianAwards.map(award => (
                                <SelectItem key={award.id} value={award.id}>
                                  {award.shortName || award.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Classification</Label>
                          <Select 
                            value={ruleForm.classificationId} 
                            onValueChange={(v) => setRuleForm(prev => ({ ...prev, classificationId: v }))}
                            disabled={!ruleForm.awardId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={ruleForm.awardId ? "All Classifications" : "Select Award First"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Classifications</SelectItem>
                              {selectedAwardClassifications.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.level} - {c.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Input
                            type="number"
                            min={1}
                            value={ruleForm.priority}
                            onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Effective From</Label>
                          <Input
                            type="date"
                            value={ruleForm.effectiveFrom}
                            onChange={(e) => setRuleForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Effective To</Label>
                          <Input
                            type="date"
                            value={ruleForm.effectiveTo}
                            onChange={(e) => setRuleForm(prev => ({ ...prev, effectiveTo: e.target.value }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Conditions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Conditions (IF)
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={addConditionGroup}>
                          <Brackets className="h-4 w-4 mr-1" />
                          Add Group
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Group Logic */}
                      {ruleForm.conditionGroups.length > 1 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <span className="text-sm font-medium">Groups connected by:</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={ruleForm.groupLogic === 'AND' ? 'default' : 'outline'}
                              onClick={() => setRuleForm(prev => ({ ...prev, groupLogic: 'AND' }))}
                              className="h-7 px-3"
                            >
                              AND
                            </Button>
                            <Button
                              size="sm"
                              variant={ruleForm.groupLogic === 'OR' ? 'default' : 'outline'}
                              onClick={() => setRuleForm(prev => ({ ...prev, groupLogic: 'OR' }))}
                              className="h-7 px-3"
                            >
                              OR
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">
                            {ruleForm.groupLogic === 'AND' ? 'All groups must match' : 'Any group can match'}
                          </span>
                        </div>
                      )}

                      {/* Condition Groups with Drag and Drop */}
                      {ruleForm.conditionGroups.map((group, groupIndex) => (
                        <Card 
                          key={group.id} 
                          className={`border-2 border-dashed transition-all ${
                            dragOverGroupIndex === groupIndex 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted'
                          } ${
                            draggedGroupIndex === groupIndex ? 'opacity-50' : ''
                          }`}
                          draggable={ruleForm.conditionGroups.length > 1}
                          onDragStart={() => handleGroupDragStart(groupIndex)}
                          onDragOver={(e) => handleGroupDragOver(e, groupIndex)}
                          onDrop={() => handleGroupDrop(groupIndex)}
                          onDragEnd={handleGroupDragEnd}
                        >
                          <CardHeader className="pb-2 pt-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {ruleForm.conditionGroups.length > 1 && (
                                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                )}
                                <Badge variant="secondary" className="font-mono">
                                  Group {groupIndex + 1}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Logic:</span>
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
                                {ruleForm.conditionGroups.length > 1 && (
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
                                  <Badge variant="outline" className="text-xs w-10 justify-center shrink-0">
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
                                        <SelectItem key={f.value} value={f.value}>
                                          <div className="flex items-center gap-2">
                                            <f.icon className="h-3 w-3" />
                                            {f.label}
                                          </div>
                                        </SelectItem>
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
                                        <SelectItem key={o.value} value={o.value}>
                                          <span className="font-mono mr-2">{o.symbol}</span>
                                          {o.label}
                                        </SelectItem>
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
                                        className="h-9 w-9 p-0 text-destructive hover:text-destructive shrink-0"
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
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Actions (THEN)
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={addAction}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Action
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {ruleForm.actions.map((action, index) => {
                        const actionConfig = actionTypes.find(a => a.value === action.type);
                        return (
                          <div key={action.id} className="flex gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                              <Select 
                                value={action.type}
                                onValueChange={(v) => updateAction(index, 'type', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Action type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {actionTypes.map(a => (
                                    <SelectItem key={a.value} value={a.value}>
                                      <div className="flex items-center gap-2">
                                        <a.icon className="h-4 w-4" />
                                        <div>
                                          <div>{a.label}</div>
                                          <div className="text-xs text-muted-foreground">{a.description}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="relative">
                                <Input
                                  placeholder={`Value ${actionConfig?.unit ? `(${actionConfig.unit})` : ''}`}
                                  value={action.value}
                                  onChange={(e) => updateAction(index, 'value', e.target.value)}
                                />
                                {actionConfig?.unit && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    {actionConfig.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ruleForm.actions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAction(index)}
                                className="text-destructive hover:text-destructive self-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-4 mt-0">
                  <div className="text-sm text-muted-foreground mb-4">
                    Start with a template to quickly create common rules
                  </div>
                  {ruleTemplates.map((template) => {
                    const typeConfig = ruleTypeConfig[template.type];
                    return (
                      <Card key={template.id} className="card-material hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleApplyTemplate(template)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Lightbulb className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{template.name}</h4>
                                  <Badge className={typeConfig.color} variant="outline">
                                    {typeConfig.label}
                                  </Badge>
                                  <Badge variant="secondary">{template.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* Test Tab */}
                <TabsContent value="test" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Test Scenario
                      </CardTitle>
                      <CardDescription>
                        Configure a scenario to test if your rule triggers correctly
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hours Worked</Label>
                          <Input
                            type="number"
                            value={testScenario.hoursWorked}
                            onChange={(e) => setTestScenario(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Day of Week</Label>
                          <Select 
                            value={testScenario.dayOfWeek} 
                            onValueChange={(v) => setTestScenario(prev => ({ ...prev, dayOfWeek: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Shift Type</Label>
                          <Select 
                            value={testScenario.shiftType} 
                            onValueChange={(v) => setTestScenario(prev => ({ ...prev, shiftType: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="overtime">Overtime</SelectItem>
                              <SelectItem value="night">Night Shift</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Base Hourly Rate ($)</Label>
                          <Input
                            type="number"
                            value={testScenario.baseRate}
                            onChange={(e) => setTestScenario(prev => ({ ...prev, baseRate: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          id="public-holiday"
                          checked={testScenario.isPublicHoliday}
                          onCheckedChange={(v) => setTestScenario(prev => ({ ...prev, isPublicHoliday: v }))}
                        />
                        <Label htmlFor="public-holiday">Is Public Holiday</Label>
                      </div>

                      <Separator />

                      <Button onClick={handleTestRule} className="w-full gap-2">
                        <Play className="h-4 w-4" />
                        Run Test
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Test Result Preview</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Run a test to see if your rule conditions match the scenario and what actions would be applied.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                {editingRule && (
                  <TabsContent value="history" className="space-y-4 mt-0">
                    <div className="text-sm text-muted-foreground mb-4">
                      View version history and restore previous versions
                    </div>
                    {editingRule.versions && editingRule.versions.length > 0 ? (
                      <div className="space-y-3">
                        {editingRule.versions.map((version) => (
                          <Card key={version.id} className="card-material">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                    version.changeType === 'created' ? 'bg-green-500/10' :
                                    version.changeType === 'restored' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                                  }`}>
                                    {version.changeType === 'created' ? <Plus className="h-5 w-5 text-green-600" /> :
                                     version.changeType === 'restored' ? <RotateCcw className="h-5 w-5 text-blue-600" /> :
                                     <Edit2 className="h-5 w-5 text-amber-600" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="font-mono">v{version.version}</Badge>
                                      <span className="font-medium text-sm">{version.changeSummary}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {version.changedBy}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock3 className="h-3 w-3" />
                                        {new Date(version.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {version.version !== editingRule.currentVersion && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => restoreVersion(editingRule, version)}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Restore
                                  </Button>
                                )}
                                {version.version === editingRule.currentVersion && (
                                  <Badge variant="secondary">Current</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-muted/50">
                        <CardContent className="p-8 text-center">
                          <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No version history available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>

            <SheetFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsPanelOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRule} className="gap-2">
                <Save className="h-4 w-4" />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Version History Panel */}
        <Sheet open={historyPanelOpen} onOpenChange={setHistoryPanelOpen}>
          <SheetContent side="right" style={{ width: '500px', maxWidth: '95vw' }}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Version History
              </SheetTitle>
              <SheetDescription>
                {selectedRuleForHistory?.name} - {selectedRuleForHistory?.versions?.length || 0} versions
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="mt-4 pr-4" style={{ height: 'calc(100vh - 150px)' }}>
              {selectedRuleForHistory?.versions && selectedRuleForHistory.versions.length > 0 ? (
                <div className="space-y-3">
                  {selectedRuleForHistory.versions.map((version) => (
                    <Card key={version.id} className="card-material">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              version.changeType === 'created' ? 'bg-green-500/10' :
                              version.changeType === 'restored' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                            }`}>
                              {version.changeType === 'created' ? <Plus className="h-5 w-5 text-green-600" /> :
                               version.changeType === 'restored' ? <RotateCcw className="h-5 w-5 text-blue-600" /> :
                               <Edit2 className="h-5 w-5 text-amber-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono">v{version.version}</Badge>
                                <span className="font-medium text-sm">{version.changeSummary}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {version.changedBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock3 className="h-3 w-3" />
                                  {new Date(version.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {version.version !== selectedRuleForHistory.currentVersion && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => restoreVersion(selectedRuleForHistory, version)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          )}
                          {version.version === selectedRuleForHistory.currentVersion && (
                            <Badge variant="secondary">Current</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-8 text-center">
                    <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No version history available</p>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
