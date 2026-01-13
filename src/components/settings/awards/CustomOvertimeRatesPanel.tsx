import { useState, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Clock, Percent, Edit2, Trash2, CheckCircle2, AlertCircle, Zap, Search, Building2, Filter, RotateCcw, Download } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface OvertimeRule {
  id: string;
  name: string;
  awardId?: string;
  classificationId?: string;
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
    awardId: 'children-services-2020',
    classificationId: 'cs-5-1',
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
  {
    id: '5',
    name: 'Hospitality Weekend Overtime',
    awardId: 'hospitality-2020',
    triggers: { dailyHours: 8, dayType: 'saturday' },
    rates: { first2Hours: 175, after2Hours: 225 },
    isActive: true,
    isCustom: true,
  },
];

export function CustomOvertimeRatesPanel() {
  const [rules, setRules] = useState<OvertimeRule[]>(mockOvertimeRules);
  
  // Filters
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    awardId: 'all',
    classificationId: '',
    dailyHours: 8,
    weeklyHours: 38,
    first2Hours: 150,
    after2Hours: 200,
    triggerType: 'daily' as 'daily' | 'weekly' | 'time',
    dayType: '' as string,
  });

  const getAwardName = (awardId?: string) => {
    if (!awardId) return 'All Awards';
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  const getClassificationName = (awardId?: string, classificationId?: string) => {
    if (!awardId || !classificationId) return '';
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classificationId)?.level || '';
  };

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesAward = selectedAwardFilter === 'all' || rule.awardId === selectedAwardFilter || !rule.awardId;
      const matchesSearch = !searchQuery || 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getAwardName(rule.awardId).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCustom = !showCustomOnly || rule.isCustom;
      const matchesActive = !showActiveOnly || rule.isActive;
      
      return matchesAward && matchesSearch && matchesCustom && matchesActive;
    });
  }, [rules, selectedAwardFilter, searchQuery, showCustomOnly, showActiveOnly]);

  const selectedAwardData = australianAwards.find(a => a.id === newRule.awardId);

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error('Please enter a rule name');
      return;
    }

    const rule: OvertimeRule = {
      id: Date.now().toString(),
      name: newRule.name,
      awardId: newRule.awardId === 'all' ? undefined : newRule.awardId,
      classificationId: newRule.classificationId || undefined,
      triggers: {
        ...(newRule.triggerType === 'daily' ? { dailyHours: newRule.dailyHours } : {}),
        ...(newRule.triggerType === 'weekly' ? { weeklyHours: newRule.weeklyHours } : {}),
        ...(newRule.dayType ? { dayType: newRule.dayType as OvertimeRule['triggers']['dayType'] } : {}),
      },
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
      classificationId: '',
      dailyHours: 8,
      weeklyHours: 38,
      first2Hours: 150,
      after2Hours: 200,
      triggerType: 'daily',
      dayType: '',
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

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredRules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overtime-rules.json';
    a.click();
    toast.success('Overtime rules exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Overtime Rates</h3>
          <p className="text-sm text-muted-foreground">
            Configure overtime thresholds and multipliers by award and classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Overtime Rule</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 py-4 pr-4">
                  <div className="space-y-2">
                    <Label>Rule Name *</Label>
                    <Input
                      placeholder="e.g., Senior Staff Overtime Premium"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Apply To Award</Label>
                      <Select 
                        value={newRule.awardId} 
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, awardId: v, classificationId: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Awards" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="all">All Awards</SelectItem>
                          {australianAwards.map(award => (
                            <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedAwardData && (
                      <div className="space-y-2">
                        <Label>Classification (Optional)</Label>
                        <Select 
                          value={newRule.classificationId} 
                          onValueChange={(v) => setNewRule(prev => ({ ...prev, classificationId: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Classifications" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                            <SelectItem value="">All Classifications</SelectItem>
                            {selectedAwardData.classifications.map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>{cls.level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select 
                        value={newRule.triggerType} 
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, triggerType: v as 'daily' | 'weekly' | 'time' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="daily">Daily Hours Exceeded</SelectItem>
                          <SelectItem value="weekly">Weekly Hours Exceeded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Day Type (Optional)</Label>
                      <Select 
                        value={newRule.dayType} 
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, dayType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any Day" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="">Any Day</SelectItem>
                          <SelectItem value="weekday">Weekday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="public_holiday">Public Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddRule}>Create Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
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
            <Button
              variant={showCustomOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCustomOnly(!showCustomOnly)}
            >
              Custom Only
            </Button>
            <Button
              variant={showActiveOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowActiveOnly(!showActiveOnly)}
            >
              Active Only
            </Button>
            {(searchQuery || selectedAwardFilter !== 'all' || showCustomOnly || showActiveOnly) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery('');
                setSelectedAwardFilter('all');
                setShowCustomOnly(false);
                setShowActiveOnly(false);
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
        Showing {filteredRules.length} of {rules.length} overtime rules
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <Card className="card-material">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium">No overtime rules found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getAwardName(rule.awardId)}
                        </Badge>
                        {rule.classificationId && (
                          <Badge variant="secondary" className="text-xs">
                            {getClassificationName(rule.awardId, rule.classificationId)}
                          </Badge>
                        )}
                      </div>
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
                        {rule.triggers.dayType && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {rule.triggers.dayType.replace('_', ' ')}
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
          ))
        )}
      </div>
    </div>
  );
}
