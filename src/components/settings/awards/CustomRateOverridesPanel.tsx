import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, DollarSign, History, AlertCircle, CheckCircle2, Search, Filter, Download, Upload, RotateCcw, Building2 } from 'lucide-react';
import { australianAwards, AustralianAward, AwardClassification } from '@/data/australianAwards';

export interface RateOverride {
  id: string;
  awardId: string;
  classificationId: string;
  overrideType: 'base_rate' | 'casual_loading' | 'penalty_rate' | 'allowance';
  originalValue: number;
  newValue: number;
  effectiveFrom: string;
  effectiveTo?: string;
  reason: string;
  approvedBy: string;
  createdAt: string;
  isActive: boolean;
}

const mockOverrides: RateOverride[] = [
  {
    id: '1',
    awardId: 'children-services-2020',
    classificationId: 'cs-4-1',
    overrideType: 'base_rate',
    originalValue: 30.28,
    newValue: 32.50,
    effectiveFrom: '2024-01-01',
    reason: 'Above award rate for experienced staff retention',
    approvedBy: 'HR Manager',
    createdAt: '2023-12-15',
    isActive: true,
  },
  {
    id: '2',
    awardId: 'children-services-2020',
    classificationId: 'cs-5-1',
    overrideType: 'base_rate',
    originalValue: 34.60,
    newValue: 36.00,
    effectiveFrom: '2024-03-01',
    reason: 'Market adjustment for ECT qualification',
    approvedBy: 'CEO',
    createdAt: '2024-02-20',
    isActive: true,
  },
  {
    id: '3',
    awardId: 'hospitality-2020',
    classificationId: 'hosp-4',
    overrideType: 'base_rate',
    originalValue: 24.44,
    newValue: 26.00,
    effectiveFrom: '2024-04-01',
    reason: 'Retention bonus for skilled cooks',
    approvedBy: 'Operations Manager',
    createdAt: '2024-03-15',
    isActive: true,
  },
];

export function CustomRateOverridesPanel() {
  const [overrides, setOverrides] = useState<RateOverride[]>(mockOverrides);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<RateOverride | null>(null);
  
  // Filters
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<string>('all');
  const [selectedClassificationFilter, setSelectedClassificationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Form state
  const [selectedAward, setSelectedAward] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [overrideType, setOverrideType] = useState<RateOverride['overrideType']>('base_rate');
  const [newValue, setNewValue] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [effectiveTo, setEffectiveTo] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const getAwardName = (awardId: string) => {
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  const getClassificationName = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.level || classId;
  };

  const getClassificationDescription = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.description || '';
  };

  const getOriginalRate = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.baseHourlyRate || 0;
  };

  // Get classifications for filter dropdown
  const getFilterClassifications = () => {
    if (selectedAwardFilter === 'all') {
      return australianAwards.flatMap(a => a.classifications.map(c => ({ ...c, awardId: a.id, awardName: a.shortName })));
    }
    const award = australianAwards.find(a => a.id === selectedAwardFilter);
    return award?.classifications.map(c => ({ ...c, awardId: award.id, awardName: award.shortName })) || [];
  };

  // Filtered overrides
  const filteredOverrides = useMemo(() => {
    return overrides.filter(override => {
      const matchesAward = selectedAwardFilter === 'all' || override.awardId === selectedAwardFilter;
      const matchesClassification = selectedClassificationFilter === 'all' || override.classificationId === selectedClassificationFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? override.isActive : !override.isActive);
      const matchesSearch = !searchQuery || 
        getAwardName(override.awardId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getClassificationName(override.awardId, override.classificationId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesAward && matchesClassification && matchesStatus && matchesSearch;
    });
  }, [overrides, selectedAwardFilter, selectedClassificationFilter, statusFilter, searchQuery]);

  const resetForm = () => {
    setSelectedAward('');
    setSelectedClassification('');
    setOverrideType('base_rate');
    setNewValue('');
    setEffectiveFrom('');
    setEffectiveTo('');
    setReason('');
    setEditingOverride(null);
  };

  const handleOpenPanel = (override?: RateOverride) => {
    if (override) {
      setEditingOverride(override);
      setSelectedAward(override.awardId);
      setSelectedClassification(override.classificationId);
      setOverrideType(override.overrideType);
      setNewValue(override.newValue.toString());
      setEffectiveFrom(override.effectiveFrom);
      setEffectiveTo(override.effectiveTo || '');
      setReason(override.reason);
    } else {
      resetForm();
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    resetForm();
  };

  const handleAddOverride = () => {
    if (!selectedAward || !selectedClassification || !newValue || !effectiveFrom || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    const originalRate = getOriginalRate(selectedAward, selectedClassification);
    const newOverride: RateOverride = {
      id: Date.now().toString(),
      awardId: selectedAward,
      classificationId: selectedClassification,
      overrideType,
      originalValue: originalRate,
      newValue: parseFloat(newValue),
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      reason,
      approvedBy: 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    setOverrides([...overrides, newOverride]);
    toast.success('Rate override added successfully');
    handleClosePanel();
  };

  const handleSaveEdit = () => {
    if (!editingOverride) return;
    
    setOverrides(prev => prev.map(o => 
      o.id === editingOverride.id 
        ? { ...o, newValue: parseFloat(newValue), reason, effectiveTo: effectiveTo || undefined }
        : o
    ));
    toast.success('Override updated');
    handleClosePanel();
  };

  const toggleOverride = (id: string) => {
    setOverrides(prev => prev.map(o => 
      o.id === id ? { ...o, isActive: !o.isActive } : o
    ));
  };

  const deleteOverride = (id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id));
    toast.success('Override deleted');
  };

  const handleBulkExport = () => {
    const dataStr = JSON.stringify(filteredOverrides, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rate-overrides.json';
    a.click();
    toast.success('Overrides exported');
  };

  const selectedAwardData = australianAwards.find(a => a.id === selectedAward);
  const filterClassifications = getFilterClassifications();

  // Stats
  const activeCount = overrides.filter(o => o.isActive).length;
  const pendingCount = overrides.filter(o => new Date(o.effectiveFrom) > new Date()).length;
  const totalIncrease = overrides.reduce((sum, o) => sum + (o.newValue - o.originalValue), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Rate Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Set above-award rates for specific classifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => handleOpenPanel()}>
            <Plus className="h-4 w-4" />
            Add Override
          </Button>
        </div>
      </div>

      {/* Side Panel */}
      <Sheet open={isPanelOpen} onOpenChange={handleClosePanel}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingOverride ? 'Edit Rate Override' : 'Add Rate Override'}</SheetTitle>
            <SheetDescription>
              {editingOverride ? 'Update the rate override configuration' : 'Create a new custom rate override'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Award *</Label>
                <Select 
                  value={selectedAward} 
                  onValueChange={(v) => { setSelectedAward(v); setSelectedClassification(''); }}
                  disabled={!!editingOverride}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an award" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {australianAwards.map(award => (
                      <SelectItem key={award.id} value={award.id}>
                        {award.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Override Type</Label>
                <Select 
                  value={overrideType} 
                  onValueChange={(v) => setOverrideType(v as RateOverride['overrideType'])}
                  disabled={!!editingOverride}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="base_rate">Base Rate</SelectItem>
                    <SelectItem value="casual_loading">Casual Loading</SelectItem>
                    <SelectItem value="penalty_rate">Penalty Rate</SelectItem>
                    <SelectItem value="allowance">Allowance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedAwardData && (
              <div className="space-y-2">
                <Label>Select Classification *</Label>
                <Select 
                  value={selectedClassification} 
                  onValueChange={setSelectedClassification}
                  disabled={!!editingOverride}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                    {selectedAwardData.classifications.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        <div className="flex flex-col">
                          <span>{cls.level} - ${cls.baseHourlyRate}/hr</span>
                          <span className="text-xs text-muted-foreground">{cls.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedClassification && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Award Rate:</span>
                  <span className="font-mono font-semibold">
                    ${getOriginalRate(selectedAward, selectedClassification).toFixed(2)}/hr
                  </span>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Hourly Rate ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective From *</Label>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Effective To (Optional)</Label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for ongoing override
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason for Override *</Label>
              <Textarea
                placeholder="e.g., Market adjustment, retention bonus, skill premium..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClosePanel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={editingOverride ? handleSaveEdit : handleAddOverride} className="flex-1">
              {editingOverride ? 'Update Override' : 'Add Override'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overrides.length}</p>
                <p className="text-sm text-muted-foreground">Total Overrides</p>
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
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Overrides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Activation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(overrides.map(o => o.awardId)).size}</p>
                <p className="text-sm text-muted-foreground">Awards Affected</p>
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
                placeholder="Search overrides..."
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedAwardFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchQuery('');
                setSelectedAwardFilter('all');
                setStatusFilter('all');
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
        Showing {filteredOverrides.length} of {overrides.length} overrides
      </div>

      <Card className="card-material-elevated">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Award / Classification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Override</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOverrides.map((override) => {
                  const difference = override.newValue - override.originalValue;
                  const percentChange = ((difference / override.originalValue) * 100).toFixed(1);
                  
                  return (
                    <TableRow key={override.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getAwardName(override.awardId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getClassificationName(override.awardId, override.classificationId)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {override.overrideType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${override.originalValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        ${override.newValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={difference > 0 ? 'text-green-600' : 'text-red-600'}>
                          {difference > 0 ? '+' : ''}{percentChange}%
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {override.effectiveFrom}
                        {override.effectiveTo && ` - ${override.effectiveTo}`}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={override.isActive} 
                          onCheckedChange={() => toggleOverride(override.id)} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenPanel(override)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteOverride(override.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}