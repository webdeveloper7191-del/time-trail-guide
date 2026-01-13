import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Calendar, Percent, Edit2, Trash2, CheckCircle2, Sun, Umbrella, X } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface LeaveLoadingRule {
  id: string;
  name: string;
  leaveType: 'annual' | 'personal' | 'long_service' | 'parental' | 'public_holiday';
  loadingPercentage: number;
  awardId?: string;
  applicableTo: 'all' | 'permanent' | 'casual';
  minServiceMonths?: number;
  isActive: boolean;
  isCustom: boolean;
}

const mockLeaveLoadingRules: LeaveLoadingRule[] = [
  {
    id: '1',
    name: 'Annual Leave Loading (Standard)',
    leaveType: 'annual',
    loadingPercentage: 17.5,
    applicableTo: 'permanent',
    isActive: true,
    isCustom: false,
  },
  {
    id: '2',
    name: 'Long Service Leave Loading',
    leaveType: 'long_service',
    loadingPercentage: 17.5,
    applicableTo: 'all',
    minServiceMonths: 84,
    isActive: true,
    isCustom: false,
  },
  {
    id: '3',
    name: 'Enhanced Annual Leave (5+ Years)',
    leaveType: 'annual',
    loadingPercentage: 20,
    applicableTo: 'permanent',
    minServiceMonths: 60,
    isActive: true,
    isCustom: true,
  },
  {
    id: '4',
    name: 'Casual Leave Loading Top-Up',
    leaveType: 'annual',
    loadingPercentage: 8,
    applicableTo: 'casual',
    isActive: true,
    isCustom: true,
  },
];

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave', icon: Sun },
  { value: 'personal', label: 'Personal/Sick Leave', icon: Umbrella },
  { value: 'long_service', label: 'Long Service Leave', icon: Calendar },
  { value: 'parental', label: 'Parental Leave', icon: Calendar },
  { value: 'public_holiday', label: 'Public Holiday', icon: Calendar },
];

export function CustomLeaveLoadingPanel() {
  const [rules, setRules] = useState<LeaveLoadingRule[]>(mockLeaveLoadingRules);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeaveLoadingRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    leaveType: 'annual' as LeaveLoadingRule['leaveType'],
    loadingPercentage: 17.5,
    applicableTo: 'all' as LeaveLoadingRule['applicableTo'],
    minServiceMonths: 0,
    awardId: 'all',
  });

  const resetForm = () => {
    setNewRule({
      name: '',
      leaveType: 'annual',
      loadingPercentage: 17.5,
      applicableTo: 'all',
      minServiceMonths: 0,
      awardId: 'all',
    });
    setEditingRule(null);
  };

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error('Please enter a rule name');
      return;
    }

    const rule: LeaveLoadingRule = {
      id: Date.now().toString(),
      name: newRule.name,
      leaveType: newRule.leaveType,
      loadingPercentage: newRule.loadingPercentage,
      applicableTo: newRule.applicableTo,
      minServiceMonths: newRule.minServiceMonths || undefined,
      awardId: newRule.awardId === 'all' ? undefined : newRule.awardId,
      isActive: true,
      isCustom: true,
    };

    setRules([...rules, rule]);
    toast.success('Leave loading rule created');
    setIsAddPanelOpen(false);
    resetForm();
  };

  const handleEditRule = (rule: LeaveLoadingRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      leaveType: rule.leaveType,
      loadingPercentage: rule.loadingPercentage,
      applicableTo: rule.applicableTo,
      minServiceMonths: rule.minServiceMonths || 0,
      awardId: rule.awardId || 'all',
    });
    setIsAddPanelOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    
    setRules(prev => prev.map(r => 
      r.id === editingRule.id 
        ? { 
            ...r, 
            name: newRule.name,
            leaveType: newRule.leaveType,
            loadingPercentage: newRule.loadingPercentage,
            applicableTo: newRule.applicableTo,
            minServiceMonths: newRule.minServiceMonths || undefined,
            awardId: newRule.awardId === 'all' ? undefined : newRule.awardId,
          }
        : r
    ));
    toast.success('Rule updated');
    setIsAddPanelOpen(false);
    resetForm();
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule && !rule.isCustom) {
      toast.error('Cannot delete statutory leave loading rules');
      return;
    }
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypes.find(t => t.value === type)?.label || type;
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      annual: 'bg-green-500/10 text-green-700 border-green-200',
      personal: 'bg-blue-500/10 text-blue-700 border-blue-200',
      long_service: 'bg-purple-500/10 text-purple-700 border-purple-200',
      parental: 'bg-pink-500/10 text-pink-700 border-pink-200',
      public_holiday: 'bg-amber-500/10 text-amber-700 border-amber-200',
    };
    return <Badge className={colors[type] || 'bg-gray-500/10'}>{getLeaveTypeLabel(type)}</Badge>;
  };

  const handlePanelClose = () => {
    setIsAddPanelOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Leave Loading</h3>
          <p className="text-sm text-muted-foreground">
            Configure leave loading percentages and rules
          </p>
        </div>
        <Button className="gap-2" onClick={() => { resetForm(); setIsAddPanelOpen(true); }}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Side Panel */}
      <Sheet open={isAddPanelOpen} onOpenChange={handlePanelClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingRule ? 'Edit Leave Loading Rule' : 'Create Leave Loading Rule'}</SheetTitle>
            <SheetDescription>
              {editingRule ? 'Update the leave loading rule configuration' : 'Configure a new leave loading rule'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g., Enhanced Annual Leave Loading"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select 
                  value={newRule.leaveType} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, leaveType: v as LeaveLoadingRule['leaveType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select 
                  value={newRule.applicableTo} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, applicableTo: v as LeaveLoadingRule['applicableTo'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="permanent">Permanent Only</SelectItem>
                    <SelectItem value="casual">Casual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Loading Percentage: {newRule.loadingPercentage}%</Label>
              <Slider
                value={[newRule.loadingPercentage]}
                onValueChange={([v]) => setNewRule(prev => ({ ...prev, loadingPercentage: v }))}
                min={0}
                max={50}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Standard leave loading is typically 17.5%
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Minimum Service (Months, Optional)</Label>
              <Input
                type="number"
                placeholder="e.g., 12"
                value={newRule.minServiceMonths || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, minServiceMonths: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if no minimum service is required
              </p>
            </div>

            <div className="space-y-2">
              <Label>Specific Award (Optional)</Label>
              <Select 
                value={newRule.awardId} 
                onValueChange={(v) => setNewRule(prev => ({ ...prev, awardId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Awards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Awards</SelectItem>
                  {australianAwards.map(award => (
                    <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={handlePanelClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={editingRule ? handleSaveEdit : handleAddRule} className="flex-1">
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
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
                <Sun className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.leaveType === 'annual').length}</p>
                <p className="text-sm text-muted-foreground">Annual Leave</p>
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
                <p className="text-2xl font-bold">
                  {Math.max(...rules.map(r => r.loadingPercentage))}%
                </p>
                <p className="text-sm text-muted-foreground">Max Loading</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.isCustom).length}</p>
                <p className="text-sm text-muted-foreground">Custom Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-material-elevated">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Rule Name</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead className="text-center">Loading</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Min Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{getLeaveTypeBadge(rule.leaveType)}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono font-bold text-primary">{rule.loadingPercentage}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{rule.applicableTo}</Badge>
                  </TableCell>
                  <TableCell>
                    {rule.minServiceMonths ? (
                      <span className="text-sm">{rule.minServiceMonths} months</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.isCustom ? (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Custom</Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Statutory</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRule(rule)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {rule.isCustom && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}