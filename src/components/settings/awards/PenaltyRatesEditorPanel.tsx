import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Plus, Percent, Calendar, Clock, Sun, Moon, 
  Sparkles, Edit2, Trash2, CheckCircle2, AlertCircle, Search, Building2, Filter, RotateCcw, Download
} from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface PenaltyRate {
  id: string;
  awardId: string;
  awardName: string;
  classificationId?: string;
  type: 'saturday' | 'sunday' | 'public_holiday' | 'evening' | 'night' | 'early_morning';
  basePercentage: number;
  customPercentage: number | null;
  isCustom: boolean;
  effectiveFrom: string;
  notes: string;
}

const penaltyTypeConfig = {
  saturday: { label: 'Saturday', icon: Calendar, color: 'bg-blue-500/10 text-blue-700' },
  sunday: { label: 'Sunday', icon: Sun, color: 'bg-orange-500/10 text-orange-700' },
  public_holiday: { label: 'Public Holiday', icon: Sparkles, color: 'bg-red-500/10 text-red-700' },
  evening: { label: 'Evening (6pm-10pm)', icon: Moon, color: 'bg-purple-500/10 text-purple-700' },
  night: { label: 'Night (10pm-6am)', icon: Moon, color: 'bg-indigo-500/10 text-indigo-700' },
  early_morning: { label: 'Early Morning (4am-6am)', icon: Sun, color: 'bg-amber-500/10 text-amber-700' },
};

const mockPenaltyRates: PenaltyRate[] = [
  {
    id: '1',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    type: 'saturday',
    basePercentage: 150,
    customPercentage: null,
    isCustom: false,
    effectiveFrom: '2024-07-01',
    notes: '',
  },
  {
    id: '2',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    type: 'sunday',
    basePercentage: 200,
    customPercentage: null,
    isCustom: false,
    effectiveFrom: '2024-07-01',
    notes: '',
  },
  {
    id: '3',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    type: 'public_holiday',
    basePercentage: 250,
    customPercentage: 275,
    isCustom: true,
    effectiveFrom: '2024-07-01',
    notes: 'Enhanced rate for Christmas Day and Good Friday',
  },
  {
    id: '4',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    type: 'evening',
    basePercentage: 110,
    customPercentage: null,
    isCustom: false,
    effectiveFrom: '2024-07-01',
    notes: '',
  },
  {
    id: '5',
    awardId: 'hospitality-2020',
    awardName: "Hospitality Industry Award 2020",
    type: 'saturday',
    basePercentage: 125,
    customPercentage: 150,
    isCustom: true,
    effectiveFrom: '2024-07-01',
    notes: 'Premium Saturday rate for senior staff',
  },
];

export function PenaltyRatesEditorPanel() {
  const [penaltyRates, setPenaltyRates] = useState<PenaltyRate[]>(mockPenaltyRates);
  
  // Filters
  const [selectedAwardFilter, setSelectedAwardFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<PenaltyRate | null>(null);
  const [newRate, setNewRate] = useState({
    awardId: '',
    classificationId: '',
    type: 'saturday' as PenaltyRate['type'],
    customPercentage: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Get classifications for selected award
  const getClassifications = (awardId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications || [];
  };

  // Filtered rates
  const filteredRates = useMemo(() => {
    return penaltyRates.filter(rate => {
      const matchesAward = selectedAwardFilter === 'all' || rate.awardId === selectedAwardFilter;
      const matchesType = selectedTypeFilter === 'all' || rate.type === selectedTypeFilter;
      const matchesSearch = !searchQuery || 
        rate.awardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCustom = !showCustomOnly || rate.isCustom;
      
      return matchesAward && matchesType && matchesSearch && matchesCustom;
    });
  }, [penaltyRates, selectedAwardFilter, selectedTypeFilter, searchQuery, showCustomOnly]);

  const resetForm = () => {
    setNewRate({
      awardId: '',
      classificationId: '',
      type: 'saturday',
      customPercentage: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingRate(null);
  };

  const handleOpenPanel = (rate?: PenaltyRate) => {
    if (rate) {
      setEditingRate(rate);
      setNewRate({
        awardId: rate.awardId,
        classificationId: rate.classificationId || '',
        type: rate.type,
        customPercentage: (rate.customPercentage || rate.basePercentage).toString(),
        effectiveFrom: rate.effectiveFrom,
        notes: rate.notes,
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

  const handleAddRate = () => {
    if (!newRate.awardId || !newRate.customPercentage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const award = australianAwards.find(a => a.id === newRate.awardId);
    const rate: PenaltyRate = {
      id: Date.now().toString(),
      awardId: newRate.awardId,
      awardName: award?.name || '',
      classificationId: newRate.classificationId || undefined,
      type: newRate.type,
      basePercentage: getBasePercentage(newRate.awardId, newRate.type),
      customPercentage: parseFloat(newRate.customPercentage),
      isCustom: true,
      effectiveFrom: newRate.effectiveFrom,
      notes: newRate.notes,
    };

    setPenaltyRates([...penaltyRates, rate]);
    toast.success('Custom penalty rate added');
    handleClosePanel();
  };

  const handleSaveEdit = () => {
    if (!editingRate) return;
    
    setPenaltyRates(prev => prev.map(r =>
      r.id === editingRate.id
        ? {
            ...r,
            customPercentage: parseFloat(newRate.customPercentage),
            isCustom: true,
            effectiveFrom: newRate.effectiveFrom,
            notes: newRate.notes,
          }
        : r
    ));
    toast.success('Penalty rate updated');
    handleClosePanel();
  };

  const getBasePercentage = (awardId: string, type: PenaltyRate['type']): number => {
    const award = australianAwards.find(a => a.id === awardId);
    if (!award) return 100;
    switch (type) {
      case 'saturday': return award.saturdayPenalty;
      case 'sunday': return award.sundayPenalty;
      case 'public_holiday': return award.publicHolidayPenalty;
      case 'evening': return award.eveningPenalty || 100;
      case 'night': return award.nightPenalty || 100;
      default: return 100;
    }
  };

  const toggleCustomRate = (id: string) => {
    setPenaltyRates(prev => prev.map(r => {
      if (r.id === id) {
        if (r.isCustom) {
          return { ...r, isCustom: false, customPercentage: null };
        }
        return { ...r, isCustom: true, customPercentage: r.basePercentage };
      }
      return r;
    }));
  };

  const updateCustomPercentage = (id: string, value: number) => {
    setPenaltyRates(prev => prev.map(r => 
      r.id === id ? { ...r, customPercentage: value, isCustom: true } : r
    ));
  };

  const deleteRate = (id: string) => {
    setPenaltyRates(prev => prev.filter(r => r.id !== id));
    toast.success('Penalty rate removed');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredRates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'penalty-rates.json';
    a.click();
    toast.success('Penalty rates exported');
  };

  const customRatesCount = penaltyRates.filter(r => r.isCustom).length;
  const averageIncrease = penaltyRates
    .filter(r => r.isCustom && r.customPercentage)
    .reduce((acc, r) => acc + ((r.customPercentage! - r.basePercentage) / r.basePercentage * 100), 0) / (customRatesCount || 1);

  const selectedAwardData = australianAwards.find(a => a.id === newRate.awardId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Penalty Rates Editor</h3>
          <p className="text-sm text-muted-foreground">
            Customize Saturday, Sunday, public holiday, and shift penalties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => handleOpenPanel()}>
            <Plus className="h-4 w-4" />
            Add Custom Rate
          </Button>
        </div>
      </div>

      {/* Side Panel */}
      <Sheet open={isPanelOpen} onOpenChange={handleClosePanel}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingRate ? 'Edit Penalty Rate' : 'Add Custom Penalty Rate'}</SheetTitle>
            <SheetDescription>
              {editingRate ? 'Update the penalty rate configuration' : 'Create a new custom penalty rate'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Award *</Label>
              <Select 
                value={newRate.awardId} 
                onValueChange={(v) => setNewRate(prev => ({ ...prev, awardId: v, classificationId: '' }))}
                disabled={!!editingRate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select award" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {australianAwards.map(award => (
                    <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAwardData && (
              <div className="space-y-2">
                <Label>Classification (Optional - leave empty for all)</Label>
                <Select 
                  value={newRate.classificationId} 
                  onValueChange={(v) => setNewRate(prev => ({ ...prev, classificationId: v }))}
                  disabled={!!editingRate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All classifications" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                    <SelectItem value="">All Classifications</SelectItem>
                    {selectedAwardData.classifications.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.level} - {cls.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Penalty Type *</Label>
              <Select 
                value={newRate.type} 
                onValueChange={(v) => setNewRate(prev => ({ ...prev, type: v as PenaltyRate['type'] }))}
                disabled={!!editingRate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {Object.entries(penaltyTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRate.awardId && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Award Default:</span>
                  <span className="font-mono font-semibold">
                    {getBasePercentage(newRate.awardId, newRate.type)}%
                  </span>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custom Percentage (%) *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 175"
                  value={newRate.customPercentage}
                  onChange={(e) => setNewRate(prev => ({ ...prev, customPercentage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={newRate.effectiveFrom}
                  onChange={(e) => setNewRate(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes about this rate override"
                value={newRate.notes}
                onChange={(e) => setNewRate(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClosePanel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={editingRate ? handleSaveEdit : handleAddRate} className="flex-1">
              {editingRate ? 'Update Rate' : 'Add Rate'}
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
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{penaltyRates.length}</p>
                <p className="text-sm text-muted-foreground">Total Rates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customRatesCount}</p>
                <p className="text-sm text-muted-foreground">Custom Overrides</p>
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
                <p className="text-2xl font-bold">{penaltyRates.filter(r => !r.isCustom).length}</p>
                <p className="text-sm text-muted-foreground">Using Award Default</p>
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
                <p className="text-2xl font-bold">{averageIncrease > 0 ? '+' : ''}{averageIncrease.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Avg. Custom Increase</p>
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
                placeholder="Search by award or notes..."
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
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Penalty Type" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(penaltyTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
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
        Showing {filteredRates.length} of {penaltyRates.length} penalty rates
      </div>

      <Card className="card-material-elevated">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Award</TableHead>
                  <TableHead>Penalty Type</TableHead>
                  <TableHead className="text-right">Award Rate</TableHead>
                  <TableHead className="text-right">Custom Rate</TableHead>
                  <TableHead className="text-center">Custom</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRates.map((rate) => {
                  const config = penaltyTypeConfig[rate.type];
                  return (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rate.awardName}</p>
                          {rate.notes && (
                            <p className="text-xs text-muted-foreground">{rate.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rate.basePercentage}%
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.isCustom ? (
                          <span className="font-mono font-semibold text-primary">
                            {rate.customPercentage}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={rate.isCustom} 
                          onCheckedChange={() => toggleCustomRate(rate.id)} 
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rate.effectiveFrom}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenPanel(rate)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteRate(rate.id)}
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

      {/* Info Card */}
      <Card className="card-material bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Penalty Rates Guide</p>
              <p className="text-xs text-muted-foreground">
                Penalty rates are expressed as a percentage of the base hourly rate. For example, 150% means 
                time-and-a-half, while 200% means double time. Custom overrides apply on top of award minimums 
                and must meet or exceed the award rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}