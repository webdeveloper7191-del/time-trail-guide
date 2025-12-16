import { useState, useEffect } from 'react';
import { StaffMember, Allowance } from '@/types/staff';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Award,
  DollarSign,
  Clock,
  Plus,
  Trash2,
  Info,
  Calculator,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  australianAwards,
  AustralianAward,
  AwardClassification,
  calculateRates,
} from '@/data/australianAwards';

interface EditAwardConfigurationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

export function EditAwardConfigurationSheet({
  open,
  onOpenChange,
  staff,
}: EditAwardConfigurationSheetProps) {
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>('');
  const [selectedAward, setSelectedAward] = useState<AustralianAward | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<AwardClassification | null>(null);
  const [customAllowances, setCustomAllowances] = useState<Allowance[]>(staff.customAllowances || []);
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [newAllowance, setNewAllowance] = useState<Partial<Allowance>>({
    name: '',
    type: 'per_hour',
    amount: 0,
    taxable: true,
    superGuarantee: false,
  });

  // Initialize with current award configuration
  useEffect(() => {
    if (staff.applicableAward) {
      const matchingAward = australianAwards.find(
        (a) => a.name === staff.applicableAward?.awardName
      );
      if (matchingAward) {
        setSelectedAwardId(matchingAward.id);
        setSelectedAward(matchingAward);
        const matchingClass = matchingAward.classifications.find(
          (c) => c.level === staff.applicableAward?.level
        );
        if (matchingClass) {
          setSelectedClassificationId(matchingClass.id);
          setSelectedClassification(matchingClass);
        }
      }
    }
  }, [staff]);

  const handleAwardChange = (awardId: string) => {
    setSelectedAwardId(awardId);
    const award = australianAwards.find((a) => a.id === awardId);
    setSelectedAward(award || null);
    setSelectedClassificationId('');
    setSelectedClassification(null);
  };

  const handleClassificationChange = (classificationId: string) => {
    setSelectedClassificationId(classificationId);
    const classification = selectedAward?.classifications.find(
      (c) => c.id === classificationId
    );
    setSelectedClassification(classification || null);
  };

  const rates = selectedAward && selectedClassification
    ? calculateRates(
        selectedAward,
        selectedClassification,
        staff.currentPayCondition?.employmentType || 'full_time'
      )
    : null;

  const handleAddAllowance = () => {
    if (!newAllowance.name || !newAllowance.amount) {
      toast.error('Please fill in allowance name and amount');
      return;
    }
    const allowance: Allowance = {
      id: `custom-${Date.now()}`,
      name: newAllowance.name!,
      type: newAllowance.type as Allowance['type'],
      amount: Number(newAllowance.amount),
      taxable: newAllowance.taxable!,
      superGuarantee: newAllowance.superGuarantee!,
    };
    setCustomAllowances([...customAllowances, allowance]);
    setNewAllowance({
      name: '',
      type: 'per_hour',
      amount: 0,
      taxable: true,
      superGuarantee: false,
    });
    setShowAddAllowance(false);
  };

  const handleRemoveAllowance = (id: string) => {
    setCustomAllowances(customAllowances.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    if (!selectedAward || !selectedClassification) {
      toast.error('Please select an award and classification');
      return;
    }
    toast.success('Award configuration updated successfully');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-1 pb-6">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Edit Award Configuration
          </SheetTitle>
          <SheetDescription>
            Configure the applicable industry award and classification for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Award Selection */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Industry Award
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Award</Label>
                <Select value={selectedAwardId} onValueChange={handleAwardChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose an industry award" />
                  </SelectTrigger>
                  <SelectContent>
                    {australianAwards.map((award) => (
                      <SelectItem key={award.id} value={award.id}>
                        <div className="flex flex-col">
                          <span>{award.shortName}</span>
                          <span className="text-xs text-muted-foreground">{award.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAward && (
                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{selectedAward.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Industry: {selectedAward.industry} | Code: {selectedAward.code}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Effective: {new Date(selectedAward.effectiveDate).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">
                      Casual Loading: {selectedAward.casualLoading}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Saturday: {selectedAward.saturdayPenalty}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Sunday: {selectedAward.sundayPenalty}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Public Holiday: {selectedAward.publicHolidayPenalty}%
                    </Badge>
                  </div>
                </div>
              )}

              {selectedAward && (
                <div className="space-y-2">
                  <Label>Classification Level</Label>
                  <Select
                    value={selectedClassificationId}
                    onValueChange={handleClassificationChange}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedAward.classifications.map((classification) => (
                        <SelectItem key={classification.id} value={classification.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <div>
                              <span className="font-medium">{classification.level}</span>
                              <span className="text-muted-foreground ml-2">
                                - {classification.description}
                              </span>
                            </div>
                            <span className="text-primary font-medium">
                              ${classification.baseHourlyRate.toFixed(2)}/hr
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calculated Rates */}
          {rates && selectedClassification && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-green-500" />
                  Calculated Rates
                  <Badge variant="secondary" className="ml-auto">
                    {staff.currentPayCondition?.employmentType === 'casual' ? 'Casual' : 'Permanent'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Rate Type</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead className="text-right">Hourly Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Base Rate</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        ${rates.baseRate.toFixed(2)}/hr
                      </TableCell>
                    </TableRow>
                    {rates.casualLoadedRate && (
                      <TableRow>
                        <TableCell className="font-medium">With Casual Loading</TableCell>
                        <TableCell className="text-right">{selectedAward!.casualLoading + 100}%</TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          ${rates.casualLoadedRate.toFixed(2)}/hr
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">Saturday Rate</TableCell>
                      <TableCell className="text-right">{selectedAward!.saturdayPenalty}%</TableCell>
                      <TableCell className="text-right font-medium">
                        ${rates.saturdayRate.toFixed(2)}/hr
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sunday Rate</TableCell>
                      <TableCell className="text-right">{selectedAward!.sundayPenalty}%</TableCell>
                      <TableCell className="text-right font-medium">
                        ${rates.sundayRate.toFixed(2)}/hr
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Public Holiday</TableCell>
                      <TableCell className="text-right">{selectedAward!.publicHolidayPenalty}%</TableCell>
                      <TableCell className="text-right font-medium">
                        ${rates.publicHolidayRate.toFixed(2)}/hr
                      </TableCell>
                    </TableRow>
                    {rates.eveningRate && (
                      <TableRow>
                        <TableCell className="font-medium">Evening Penalty</TableCell>
                        <TableCell className="text-right">{selectedAward!.eveningPenalty}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${rates.eveningRate.toFixed(2)}/hr
                        </TableCell>
                      </TableRow>
                    )}
                    {rates.nightRate && (
                      <TableRow>
                        <TableCell className="font-medium">Night Penalty</TableCell>
                        <TableCell className="text-right">{selectedAward!.nightPenalty}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${rates.nightRate.toFixed(2)}/hr
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* Overtime Rates */}
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Overtime Rates
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">First 2 Hours</p>
                    <p className="font-semibold">${rates.overtime.first2Hours.toFixed(2)}/hr</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {selectedAward!.overtimeRates.first2Hours}%
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">After 2 Hours</p>
                    <p className="font-semibold">${rates.overtime.after2Hours.toFixed(2)}/hr</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {selectedAward!.overtimeRates.after2Hours}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Award Allowances */}
          {selectedAward && selectedAward.allowances.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  Award Allowances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedAward.allowances.map((allowance) => (
                    <div
                      key={allowance.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{allowance.name}</p>
                        <p className="text-xs text-muted-foreground">{allowance.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${allowance.amount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-xs">
                          {allowance.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Allowances */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4 text-purple-500" />
                  Custom Staff Allowances
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAllowance(!showAddAllowance)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddAllowance && (
                <div className="p-4 border border-dashed rounded-lg space-y-4 bg-muted/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Allowance Name</Label>
                      <Input
                        value={newAllowance.name}
                        onChange={(e) =>
                          setNewAllowance({ ...newAllowance, name: e.target.value })
                        }
                        placeholder="e.g., Tool Allowance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input
                        type="number"
                        value={newAllowance.amount || ''}
                        onChange={(e) =>
                          setNewAllowance({
                            ...newAllowance,
                            amount: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newAllowance.type}
                      onValueChange={(value) =>
                        setNewAllowance({ ...newAllowance, type: value as Allowance['type'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_shift">Per Shift</SelectItem>
                        <SelectItem value="per_km">Per Kilometre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newAllowance.taxable}
                        onCheckedChange={(checked) =>
                          setNewAllowance({ ...newAllowance, taxable: checked })
                        }
                      />
                      <Label className="text-sm">Taxable</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newAllowance.superGuarantee}
                        onCheckedChange={(checked) =>
                          setNewAllowance({ ...newAllowance, superGuarantee: checked })
                        }
                      />
                      <Label className="text-sm">Super Guarantee</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddAllowance(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddAllowance}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Add Allowance
                    </Button>
                  </div>
                </div>
              )}

              {customAllowances.length > 0 ? (
                <div className="space-y-2">
                  {customAllowances.map((allowance) => (
                    <div
                      key={allowance.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{allowance.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {allowance.type.replace('_', ' ')}
                            </Badge>
                            {allowance.taxable && (
                              <Badge variant="secondary" className="text-xs">Taxable</Badge>
                            )}
                            {allowance.superGuarantee && (
                              <Badge variant="secondary" className="text-xs">Super</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">${allowance.amount.toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => handleRemoveAllowance(allowance.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !showAddAllowance && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No custom allowances configured</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {!selectedAward && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Please select an industry award to continue</p>
            </div>
          )}

          {selectedAward && !selectedClassification && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Please select a classification level</p>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6 pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedAward || !selectedClassification}
            className="bg-primary"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
