import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AppliedAllowance, 
  AllowanceType, 
  AwardType,
  AWARD_NAMES,
  ALL_ALLOWANCES,
  getAllowancesByAward,
  formatAllowanceRate,
  calculateAllowanceTotal
} from '@/types/allowances';
import { ClockEntry } from '@/types/timesheet';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  DollarSign, 
  Info,
  Clock,
  Car,
  GraduationCap,
  UtensilsCrossed,
  Heart,
  Shirt
} from 'lucide-react';
import { format } from 'date-fns';

interface AllowanceEditorProps {
  allowances: AppliedAllowance[];
  entries: ClockEntry[];
  awardType: AwardType;
  onAwardTypeChange: (award: AwardType) => void;
  onAllowancesChange: (allowances: AppliedAllowance[]) => void;
}

const getCategoryIcon = (category: AllowanceType['category']) => {
  switch (category) {
    case 'shift':
      return Clock;
    case 'clothing':
      return Shirt;
    case 'travel':
      return Car;
    case 'qualification':
      return GraduationCap;
    case 'meal':
      return UtensilsCrossed;
    case 'first_aid':
      return Heart;
    default:
      return DollarSign;
  }
};

const getCategoryColor = (category: AllowanceType['category']) => {
  switch (category) {
    case 'shift':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'clothing':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'travel':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'qualification':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'meal':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'first_aid':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function AllowanceEditor({ 
  allowances, 
  entries, 
  awardType, 
  onAwardTypeChange, 
  onAllowancesChange 
}: AllowanceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAllowanceId, setSelectedAllowanceId] = useState<string>('');

  const availableAllowances = getAllowancesByAward(awardType);
  const total = calculateAllowanceTotal(allowances);

  const handleAddAllowance = () => {
    if (!selectedAllowanceId) return;

    const allowanceType = ALL_ALLOWANCES.find(a => a.id === selectedAllowanceId);
    if (!allowanceType) return;

    const newAllowance: AppliedAllowance = {
      id: `allowance-${Date.now()}`,
      allowanceTypeId: allowanceType.id,
      allowanceType,
      quantity: 1,
      rate: allowanceType.defaultRate,
      total: allowanceType.defaultRate,
      appliedAt: new Date().toISOString(),
    };

    onAllowancesChange([...allowances, newAllowance]);
    setSelectedAllowanceId('');
  };

  const handleRemoveAllowance = (id: string) => {
    onAllowancesChange(allowances.filter(a => a.id !== id));
  };

  const handleUpdateAllowance = (id: string, field: keyof AppliedAllowance, value: unknown) => {
    onAllowancesChange(
      allowances.map(a => {
        if (a.id !== id) return a;
        
        const updated = { ...a, [field]: value };
        
        // Recalculate total when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updated.total = (updated.quantity || 0) * (updated.rate || 0);
        }
        
        return updated;
      })
    );
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold">Allowances & Entitlements</h4>
                <p className="text-xs text-muted-foreground">
                  {allowances.length} allowance{allowances.length !== 1 ? 's' : ''} applied • 
                  Total: ${total.toFixed(2)}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t">
            {/* Award Selection */}
            <div>
              <Label className="text-sm font-medium">Applicable Award</Label>
              <Select value={awardType} onValueChange={(v) => onAwardTypeChange(v as AwardType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AWARD_NAMES) as AwardType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {AWARD_NAMES[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Add Allowance */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Add Allowance</Label>
              <div className="flex gap-2">
                <Select value={selectedAllowanceId} onValueChange={setSelectedAllowanceId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select allowance to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAllowances.map((allowance) => {
                      const Icon = getCategoryIcon(allowance.category);
                      return (
                        <SelectItem key={allowance.id} value={allowance.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{allowance.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatAllowanceRate(allowance)}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAllowance} disabled={!selectedAllowanceId} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Applied Allowances */}
            {allowances.length > 0 && (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {allowances.map((allowance) => {
                    const Icon = getCategoryIcon(allowance.allowanceType.category);
                    const colorClass = getCategoryColor(allowance.allowanceType.category);
                    
                    return (
                      <Card key={allowance.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg border ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{allowance.allowanceType.name}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{allowance.allowanceType.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Badge variant="outline" className="text-xs">
                                  {allowance.allowanceType.code}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={allowance.quantity}
                                    onChange={(e) => 
                                      handleUpdateAllowance(allowance.id, 'quantity', parseFloat(e.target.value) || 0)
                                    }
                                    className="mt-1 h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Rate ($)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={allowance.rate}
                                    onChange={(e) => 
                                      handleUpdateAllowance(allowance.id, 'rate', parseFloat(e.target.value) || 0)
                                    }
                                    className="mt-1 h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Applies To</Label>
                                  <Select 
                                    value={allowance.entryDate || 'all'}
                                    onValueChange={(v) => 
                                      handleUpdateAllowance(allowance.id, 'entryDate', v === 'all' ? undefined : v)
                                    }
                                  >
                                    <SelectTrigger className="mt-1 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Days</SelectItem>
                                      {entries.map((entry) => (
                                        <SelectItem key={entry.id} value={entry.date}>
                                          {format(new Date(entry.date), 'EEE, MMM d')}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground">Notes</Label>
                                <Textarea
                                  value={allowance.notes || ''}
                                  onChange={(e) => 
                                    handleUpdateAllowance(allowance.id, 'notes', e.target.value)
                                  }
                                  placeholder="Optional notes..."
                                  className="mt-1 min-h-[60px]"
                                />
                              </div>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {allowance.allowanceType.taxable && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Taxable
                                  </span>
                                )}
                                {allowance.allowanceType.superIncluded && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Super Included
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAllowance(allowance.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-lg font-semibold">${allowance.total.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {allowances.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No allowances added yet</p>
                <p className="text-xs">Select an allowance from the dropdown above</p>
              </div>
            )}

            {/* Total Summary */}
            {allowances.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="font-medium">Total Allowances</span>
                  <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
