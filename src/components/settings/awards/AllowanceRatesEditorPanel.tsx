import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, DollarSign, Search, CheckCircle2, AlertCircle, Building2, Filter, RotateCcw, Download } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface CustomAllowance {
  id: string;
  name: string;
  type: 'per_hour' | 'per_shift' | 'per_week' | 'per_km' | 'one_off';
  baseAmount: number;
  customAmount?: number;
  isOverridden: boolean;
  applicableAwards: string[];
  conditions?: string;
  isActive: boolean;
}

const mockAllowances: CustomAllowance[] = [
  {
    id: '1',
    name: 'First Aid Allowance',
    type: 'per_week',
    baseAmount: 18.93,
    customAmount: 22.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020'],
    conditions: 'Holder of current first aid certificate',
    isActive: true,
  },
  {
    id: '2',
    name: 'Educational Leader Allowance',
    type: 'per_hour',
    baseAmount: 2.34,
    isOverridden: false,
    applicableAwards: ['children-services-2020'],
    conditions: 'Appointed educational program leader',
    isActive: true,
  },
  {
    id: '3',
    name: 'Vehicle Allowance',
    type: 'per_km',
    baseAmount: 0.96,
    customAmount: 1.00,
    isOverridden: true,
    applicableAwards: ['children-services-2020', 'social-2020'],
    conditions: 'Use of personal vehicle for work duties',
    isActive: true,
  },
  {
    id: '4',
    name: 'On-Call Allowance',
    type: 'per_shift',
    baseAmount: 0,
    customAmount: 35.00,
    isOverridden: true,
    applicableAwards: [],
    conditions: 'Staff required to be on-call',
    isActive: true,
  },
];

export function AllowanceRatesEditorPanel() {
  const [allowances, setAllowances] = useState<CustomAllowance[]>(mockAllowances);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAllowance, setNewAllowance] = useState({
    name: '',
    type: 'per_week' as CustomAllowance['type'],
    amount: '',
    conditions: '',
    applicableAwards: [] as string[],
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'per_hour': return '/hour';
      case 'per_shift': return '/shift';
      case 'per_week': return '/week';
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

  const handleAddAllowance = () => {
    if (!newAllowance.name || !newAllowance.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    const allowance: CustomAllowance = {
      id: Date.now().toString(),
      name: newAllowance.name,
      type: newAllowance.type,
      baseAmount: 0,
      customAmount: parseFloat(newAllowance.amount),
      isOverridden: true,
      applicableAwards: newAllowance.applicableAwards,
      conditions: newAllowance.conditions,
      isActive: true,
    };

    setAllowances([...allowances, allowance]);
    toast.success('Custom allowance added');
    setIsAddDialogOpen(false);
    setNewAllowance({ name: '', type: 'per_week', amount: '', conditions: '', applicableAwards: [] });
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Allowance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Allowance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Allowance Name</Label>
                <Input
                  placeholder="e.g., On-Call Allowance"
                  value={newAllowance.name}
                  onChange={(e) => setNewAllowance(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="per_week">Per Week</SelectItem>
                      <SelectItem value="per_km">Per Kilometer</SelectItem>
                      <SelectItem value="one_off">One-Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAllowance.amount}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Awards (Optional)</Label>
                <Select 
                  onValueChange={(v) => setNewAllowance(prev => ({ 
                    ...prev, 
                    applicableAwards: [...prev.applicableAwards, v] 
                  }))}
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
                      <Badge key={awardId} variant="secondary" className="text-xs">
                        {getAwardName(awardId)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Conditions (Optional)</Label>
                <Input
                  placeholder="e.g., When required to be on-call"
                  value={newAllowance.conditions}
                  onChange={(e) => setNewAllowance(prev => ({ ...prev, conditions: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAllowance}>Add Allowance</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

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
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700">
                            All Awards
                          </Badge>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
