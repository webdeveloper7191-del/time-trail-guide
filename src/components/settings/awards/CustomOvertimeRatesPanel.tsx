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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Clock, Percent, Edit2, Trash2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface OvertimeRule {
  id: string;
  name: string;
  awardId?: string;
  triggers: {
    dailyHours?: number;
    weeklyHours?: number;
    consecutiveDays?: number;
    timeOfDay?: { start: string; end: string };
    dayType?: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
  };
  rates: {
    first2Hours: number;
    after2Hours: number;
    doubleTime?: number;
  };
  isActive: boolean;
  isCustom: boolean;
}

const mockOvertimeRules: OvertimeRule[] = [
  {
    id: '1',
    name: 'Standard Overtime (Children\'s Services)',
    awardId: 'children-services-2020',
    triggers: { dailyHours: 8 },
    rates: { first2Hours: 150, after2Hours: 200 },
    isActive: true,
    isCustom: false,
  },
  {
    id: '2',
    name: 'Weekly Overtime Cap',
    triggers: { weeklyHours: 38 },
    rates: { first2Hours: 150, after2Hours: 200 },
    isActive: true,
    isCustom: false,
  },
  {
    id: '3',
    name: 'Senior Staff Overtime Premium',
    triggers: { dailyHours: 8 },
    rates: { first2Hours: 165, after2Hours: 220 },
    isActive: true,
    isCustom: true,
  },
  {
    id: '4',
    name: 'Night Shift Overtime',
    triggers: { timeOfDay: { start: '22:00', end: '06:00' }, dailyHours: 7.6 },
    rates: { first2Hours: 175, after2Hours: 250 },
    isActive: true,
    isCustom: true,
  },
];

export function CustomOvertimeRatesPanel() {
  const [rules, setRules] = useState<OvertimeRule[]>(mockOvertimeRules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    awardId: 'all',
    dailyHours: 8,
    weeklyHours: 38,
    first2Hours: 150,
    after2Hours: 200,
    triggerType: 'daily' as 'daily' | 'weekly' | 'time',
  });

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error('Please enter a rule name');
      return;
    }

    const rule: OvertimeRule = {
      id: Date.now().toString(),
      name: newRule.name,
      awardId: newRule.awardId === 'all' ? undefined : newRule.awardId,
      triggers: newRule.triggerType === 'daily' 
        ? { dailyHours: newRule.dailyHours }
        : { weeklyHours: newRule.weeklyHours },
      rates: {
        first2Hours: newRule.first2Hours,
        after2Hours: newRule.after2Hours,
      },
      isActive: true,
      isCustom: true,
    };

    setRules([...rules, rule]);
    toast.success('Overtime rule created');
    setIsAddDialogOpen(false);
    setNewRule({
      name: '',
      awardId: 'all',
      dailyHours: 8,
      weeklyHours: 38,
      first2Hours: 150,
      after2Hours: 200,
      triggerType: 'daily',
    });
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule && !rule.isCustom) {
      toast.error('Cannot delete award-mandated overtime rules');
      return;
    }
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const getAwardName = (awardId?: string) => {
    if (!awardId) return 'All Awards';
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Overtime Rates</h3>
          <p className="text-sm text-muted-foreground">
            Configure overtime thresholds and multipliers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Overtime Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  placeholder="e.g., Senior Staff Overtime Premium"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Apply To Award (Optional)</Label>
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

              <Separator />

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select 
                  value={newRule.triggerType} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, triggerType: v as 'daily' | 'weekly' | 'time' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Hours Exceeded</SelectItem>
                    <SelectItem value="weekly">Weekly Hours Exceeded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRule.triggerType === 'daily' && (
                <div className="space-y-3">
                  <Label>Daily Hours Threshold: {newRule.dailyHours} hours</Label>
                  <Slider
                    value={[newRule.dailyHours]}
                    onValueChange={([v]) => setNewRule(prev => ({ ...prev, dailyHours: v }))}
                    min={6}
                    max={12}
                    step={0.5}
                  />
                </div>
              )}

              {newRule.triggerType === 'weekly' && (
                <div className="space-y-3">
                  <Label>Weekly Hours Threshold: {newRule.weeklyHours} hours</Label>
                  <Slider
                    value={[newRule.weeklyHours]}
                    onValueChange={([v]) => setNewRule(prev => ({ ...prev, weeklyHours: v }))}
                    min={30}
                    max={50}
                    step={1}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>First 2 Hours Rate: {newRule.first2Hours}%</Label>
                <Slider
                  value={[newRule.first2Hours]}
                  onValueChange={([v]) => setNewRule(prev => ({ ...prev, first2Hours: v }))}
                  min={100}
                  max={250}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <Label>After 2 Hours Rate: {newRule.after2Hours}%</Label>
                <Slider
                  value={[newRule.after2Hours]}
                  onValueChange={([v]) => setNewRule(prev => ({ ...prev, after2Hours: v }))}
                  min={100}
                  max={300}
                  step={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
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
                <Clock className="h-5 w-5 text-primary" />
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
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.isCustom).length}</p>
                <p className="text-sm text-muted-foreground">Custom Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.max(...rules.map(r => r.rates.after2Hours))}%
                </p>
                <p className="text-sm text-muted-foreground">Max Rate</p>
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
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${rule.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{rule.name}</h4>
                      {rule.isCustom ? (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Custom</Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Award</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Applies to: {getAwardName(rule.awardId)}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      {rule.triggers.dailyHours && (
                        <Badge variant="outline" className="text-xs">
                          Daily &gt; {rule.triggers.dailyHours}h
                        </Badge>
                      )}
                      {rule.triggers.weeklyHours && (
                        <Badge variant="outline" className="text-xs">
                          Weekly &gt; {rule.triggers.weeklyHours}h
                        </Badge>
                      )}
                      {rule.triggers.timeOfDay && (
                        <Badge variant="outline" className="text-xs">
                          {rule.triggers.timeOfDay.start} - {rule.triggers.timeOfDay.end}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-primary">{rule.rates.first2Hours}%</p>
                      <p className="text-xs text-muted-foreground">First 2h</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-primary">{rule.rates.after2Hours}%</p>
                      <p className="text-xs text-muted-foreground">After 2h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
