import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  AllowanceType, 
  AllowanceCategory, 
  ALL_ALLOWANCES,
  formatAllowanceRate
} from '@/types/allowances';
import { toast } from 'sonner';

interface AllowanceDropdownWithCreateProps {
  selectedAllowances: string[];
  onAllowancesChange: (allowanceIds: string[]) => void;
  customAllowances?: AllowanceType[];
  onCreateAllowance?: (allowance: AllowanceType) => void;
  awardType?: string;
}

const CATEGORY_LABELS: Record<AllowanceCategory, string> = {
  shift: 'Shift',
  clothing: 'Clothing',
  travel: 'Travel',
  meal: 'Meal',
  qualification: 'Qualification',
  first_aid: 'First Aid',
  on_call: 'On-Call',
  sleepover: 'Sleepover',
  broken_shift: 'Broken Shift',
  higher_duties: 'Higher Duties',
  other: 'Other',
};

const RATE_TYPE_LABELS: Record<AllowanceType['rateType'], string> = {
  fixed: 'Flat Amount',
  hourly: 'Per Hour',
  daily: 'Per Day',
  per_occurrence: 'Per Occurrence',
  per_km: 'Per Kilometre',
};

interface NewAllowanceForm {
  code?: string;
  name?: string;
  description?: string;
  category?: AllowanceCategory;
  rateType?: AllowanceType['rateType'];
  defaultRate?: number;
  taxable?: boolean;
  superIncluded?: boolean;
}

export function AllowanceDropdownWithCreate({
  selectedAllowances,
  onAllowancesChange,
  customAllowances = [],
  onCreateAllowance,
  awardType,
}: AllowanceDropdownWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAllowance, setNewAllowance] = useState<NewAllowanceForm>({
    category: 'other',
    rateType: 'fixed',
    defaultRate: 0,
    taxable: true,
    superIncluded: false,
  });

  // Combine system and custom allowances
  const allAllowances = [...ALL_ALLOWANCES, ...customAllowances];
  
  // Filter by award type if specified
  const filteredByAward = awardType 
    ? allAllowances.filter(a => a.applicableAwards.includes(awardType as any) || a.applicableAwards.includes('general'))
    : allAllowances;

  // Filter by search query
  const filteredAllowances = filteredByAward.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedAllowances = filteredAllowances.reduce((acc, allowance) => {
    const category = allowance.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(allowance);
    return acc;
  }, {} as Record<AllowanceCategory, AllowanceType[]>);

  const handleToggleAllowance = (allowanceId: string) => {
    if (selectedAllowances.includes(allowanceId)) {
      onAllowancesChange(selectedAllowances.filter(id => id !== allowanceId));
    } else {
      onAllowancesChange([...selectedAllowances, allowanceId]);
    }
  };

  const handleCreateAllowance = () => {
    if (!newAllowance.name || !newAllowance.code || newAllowance.defaultRate === undefined) {
      toast.error('Please fill in all required fields');
      return;
    }

    const allowance: AllowanceType = {
      id: `custom_${Date.now()}`,
      code: newAllowance.code!,
      name: newAllowance.name!,
      description: newAllowance.description || '',
      category: newAllowance.category as AllowanceCategory,
      rateType: newAllowance.rateType as AllowanceType['rateType'],
      defaultRate: newAllowance.defaultRate!,
      applicableAwards: ['general'],
      taxable: newAllowance.taxable ?? true,
      superIncluded: newAllowance.superIncluded ?? false,
    };

    if (onCreateAllowance) {
      onCreateAllowance(allowance);
    }

    // Auto-select the new allowance
    onAllowancesChange([...selectedAllowances, allowance.id]);
    
    setCreateDialogOpen(false);
    setNewAllowance({
      category: 'other',
      rateType: 'fixed',
      defaultRate: 0,
      taxable: true,
      superIncluded: false,
    });
    toast.success('Allowance created and added to template');
  };

  const selectedAllowanceDetails = allAllowances.filter(a => selectedAllowances.includes(a.id));

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedAllowanceDetails.length === 0 ? (
                <span className="text-muted-foreground">Select allowances...</span>
              ) : (
                selectedAllowanceDetails.slice(0, 3).map(allowance => (
                  <Badge key={allowance.id} variant="secondary" className="text-xs">
                    {allowance.code}
                  </Badge>
                ))
              )}
              {selectedAllowanceDetails.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedAllowanceDetails.length - 3} more
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Search allowances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {Object.entries(groupedAllowances).map(([category, allowances]) => (
                <div key={category} className="mb-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
                    {CATEGORY_LABELS[category as AllowanceCategory] || category}
                  </div>
                  {allowances.map(allowance => {
                    const isSelected = selectedAllowances.includes(allowance.id);
                    return (
                      <div
                        key={allowance.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleToggleAllowance(allowance.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 border rounded flex items-center justify-center",
                          isSelected ? "bg-primary border-primary" : "border-input"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{allowance.name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {allowance.code}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatAllowanceRate(allowance)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {filteredAllowances.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No allowances found
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-primary"
              onClick={() => {
                setOpen(false);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Allowance
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Allowance</DialogTitle>
            <DialogDescription>
              Add a custom allowance that will be available for selection in shift templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowance-code">Code *</Label>
                <Input
                  id="allowance-code"
                  placeholder="e.g., CUST01"
                  value={newAllowance.code || ''}
                  onChange={(e) => setNewAllowance({ ...newAllowance, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowance-category">Category</Label>
                <Select
                  value={newAllowance.category}
                  onValueChange={(value) => setNewAllowance({ ...newAllowance, category: value as AllowanceCategory })}
                >
                  <SelectTrigger id="allowance-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowance-name">Name *</Label>
              <Input
                id="allowance-name"
                placeholder="e.g., Special Location Allowance"
                value={newAllowance.name || ''}
                onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowance-description">Description</Label>
              <Input
                id="allowance-description"
                placeholder="Brief description of the allowance"
                value={newAllowance.description || ''}
                onChange={(e) => setNewAllowance({ ...newAllowance, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowance-rate-type">Rate Type</Label>
                <Select
                  value={newAllowance.rateType}
                  onValueChange={(value) => setNewAllowance({ ...newAllowance, rateType: value as AllowanceType['rateType'] })}
                >
                  <SelectTrigger id="allowance-rate-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RATE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowance-rate">
                  Rate ($)
                </Label>
                <Input
                  id="allowance-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAllowance.defaultRate || ''}
                  onChange={(e) => setNewAllowance({ ...newAllowance, defaultRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newAllowance.taxable}
                  onChange={(e) => setNewAllowance({ ...newAllowance, taxable: e.target.checked })}
                  className="rounded border-input"
                />
                Taxable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newAllowance.superIncluded}
                  onChange={(e) => setNewAllowance({ ...newAllowance, superIncluded: e.target.checked })}
                  className="rounded border-input"
                />
                Super Included
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAllowance}>
              Create & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
