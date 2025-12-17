import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, DollarSign, History, AlertCircle, CheckCircle2 } from 'lucide-react';
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
];

export function CustomRateOverridesPanel() {
  const [overrides, setOverrides] = useState<RateOverride[]>(mockOverrides);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const getAwardName = (awardId: string) => {
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  const getClassificationName = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.level || classId;
  };

  const getOriginalRate = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.baseHourlyRate || 0;
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
      overrideType: 'base_rate',
      originalValue: originalRate,
      newValue: parseFloat(newValue),
      effectiveFrom,
      reason,
      approvedBy: 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    setOverrides([...overrides, newOverride]);
    toast.success('Rate override added successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedAward('');
    setSelectedClassification('');
    setNewValue('');
    setEffectiveFrom('');
    setReason('');
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

  const selectedAwardData = australianAwards.find(a => a.id === selectedAward);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Rate Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Set above-award rates for specific classifications
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Override
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Rate Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Award</Label>
                <Select value={selectedAward} onValueChange={setSelectedAward}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an award" />
                  </SelectTrigger>
                  <SelectContent>
                    {australianAwards.map(award => (
                      <SelectItem key={award.id} value={award.id}>
                        {award.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAwardData && (
                <div className="space-y-2">
                  <Label>Select Classification</Label>
                  <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedAwardData.classifications.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.level} - ${cls.baseHourlyRate}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedClassification && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Award Rate:</span>
                    <span className="font-mono font-semibold">
                      ${getOriginalRate(selectedAward, selectedClassification).toFixed(2)}/hr
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>New Hourly Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason for Override</Label>
                <Input
                  placeholder="e.g., Market adjustment, retention bonus"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOverride}>Add Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold">{overrides.filter(o => o.isActive).length}</p>
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
                <p className="text-2xl font-bold">
                  {overrides.filter(o => new Date(o.effectiveFrom) > new Date()).length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Activation</p>
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
                <TableHead>Award / Classification</TableHead>
                <TableHead className="text-right">Original Rate</TableHead>
                <TableHead className="text-right">Override Rate</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override) => {
                const diff = override.newValue - override.originalValue;
                const diffPercent = ((diff / override.originalValue) * 100).toFixed(1);
                return (
                  <TableRow key={override.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getAwardName(override.awardId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getClassificationName(override.awardId, override.classificationId)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${override.originalValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">
                      ${override.newValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                        +${diff.toFixed(2)} ({diffPercent}%)
                      </Badge>
                    </TableCell>
                    <TableCell>{override.effectiveFrom}</TableCell>
                    <TableCell>
                      <Switch
                        checked={override.isActive}
                        onCheckedChange={() => toggleOverride(override.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
