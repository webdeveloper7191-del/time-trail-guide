import { useState } from 'react';
import { StaffMember } from '@/types/staff';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Save,
  X,
  AlertCircle,
  FileText,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaxDeclarationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSave?: (data: TaxDeclarationData) => void;
}

interface TaxDeclarationData {
  tfnProvided: boolean;
  tfnExemption: 'none' | 'pending' | 'under18' | 'pensioner';
  residencyStatus: 'resident' | 'foreign_resident' | 'working_holiday';
  claimTaxFreeThreshold: boolean;
  hasHelpDebt: boolean;
  hasSfssDebt: boolean;
  hasTslDebt: boolean;
  seniorOffset: boolean;
  zoneOffset: 'none' | 'zone_a' | 'zone_b' | 'special_zone';
  dependantOffset: boolean;
  medicareLevyExemption: 'none' | 'full' | 'half';
  withholdingVariation: boolean;
  variationRate?: number;
  declarationDate?: string;
  declarationSignedBy?: string;
}

export function TaxDeclarationSheet({ open, onOpenChange, staff, onSave }: TaxDeclarationSheetProps) {
  const [formData, setFormData] = useState<TaxDeclarationData>({
    tfnProvided: !!staff.taxFileNumber,
    tfnExemption: 'none',
    residencyStatus: 'resident',
    claimTaxFreeThreshold: true,
    hasHelpDebt: false,
    hasSfssDebt: false,
    hasTslDebt: false,
    seniorOffset: false,
    zoneOffset: 'none',
    dependantOffset: false,
    medicareLevyExemption: 'none',
    withholdingVariation: false,
    declarationDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSave = () => {
    onSave?.(formData);
    toast.success('Tax declaration updated successfully');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Tax Declaration (TFN Declaration)
          </SheetTitle>
          <SheetDescription>
            Complete tax declaration for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* TFN Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Tax File Number Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.tfnProvided ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {formData.tfnProvided ? 'TFN Provided' : 'TFN Not Provided'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.tfnProvided 
                        ? 'Tax file number is on record'
                        : 'Higher withholding rate may apply'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={formData.tfnProvided ? 'default' : 'secondary'}>
                  {formData.tfnProvided ? 'Complete' : 'Pending'}
                </Badge>
              </div>

              {!formData.tfnProvided && (
                <div className="space-y-2">
                  <Label>TFN Exemption Reason</Label>
                  <Select
                    value={formData.tfnExemption}
                    onValueChange={(v) => setFormData({ ...formData, tfnExemption: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No exemption</SelectItem>
                      <SelectItem value="pending">TFN application pending</SelectItem>
                      <SelectItem value="under18">Under 18 earning less than $350/week</SelectItem>
                      <SelectItem value="pensioner">Pensioner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Residency Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Residency Status for Tax Purposes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.residencyStatus}
                onValueChange={(v) => setFormData({ ...formData, residencyStatus: v as any })}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="resident" id="resident" className="mt-1" />
                  <div>
                    <Label htmlFor="resident" className="font-medium cursor-pointer">Australian Resident</Label>
                    <p className="text-sm text-muted-foreground">
                      You are an Australian resident for tax purposes
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="foreign_resident" id="foreign_resident" className="mt-1" />
                  <div>
                    <Label htmlFor="foreign_resident" className="font-medium cursor-pointer">Foreign Resident</Label>
                    <p className="text-sm text-muted-foreground">
                      You are a foreign resident for tax purposes
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="working_holiday" id="working_holiday" className="mt-1" />
                  <div>
                    <Label htmlFor="working_holiday" className="font-medium cursor-pointer">Working Holiday Maker</Label>
                    <p className="text-sm text-muted-foreground">
                      You hold a 417 or 462 visa
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Tax Free Threshold */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Tax-Free Threshold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Claim tax-free threshold</p>
                  <p className="text-sm text-muted-foreground">
                    You can only claim this from one payer at a time
                  </p>
                </div>
                <Switch
                  checked={formData.claimTaxFreeThreshold}
                  onCheckedChange={(checked) => setFormData({ ...formData, claimTaxFreeThreshold: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Study & Training Loans */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Study & Training Loan Debts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">HELP / HECS debt</p>
                  <p className="text-xs text-muted-foreground">Higher Education Loan Program</p>
                </div>
                <Switch
                  checked={formData.hasHelpDebt}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasHelpDebt: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">VSL / VET Student Loan</p>
                  <p className="text-xs text-muted-foreground">Vocational Education and Training</p>
                </div>
                <Switch
                  checked={formData.hasSfssDebt}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasSfssDebt: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">TSL / SSL debt</p>
                  <p className="text-xs text-muted-foreground">Trade Support Loan / Student Start-up Loan</p>
                </div>
                <Switch
                  checked={formData.hasTslDebt}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasTslDebt: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Offsets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tax Offsets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Senior Australians tax offset</p>
                  <p className="text-xs text-muted-foreground">For eligible seniors and pensioners</p>
                </div>
                <Switch
                  checked={formData.seniorOffset}
                  onCheckedChange={(checked) => setFormData({ ...formData, seniorOffset: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Zone Tax Offset</Label>
                <Select
                  value={formData.zoneOffset}
                  onValueChange={(v) => setFormData({ ...formData, zoneOffset: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not applicable</SelectItem>
                    <SelectItem value="zone_a">Zone A</SelectItem>
                    <SelectItem value="zone_b">Zone B</SelectItem>
                    <SelectItem value="special_zone">Special Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Dependant (invalid and carer) tax offset</p>
                </div>
                <Switch
                  checked={formData.dependantOffset}
                  onCheckedChange={(checked) => setFormData({ ...formData, dependantOffset: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medicare Levy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Medicare Levy Exemption</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.medicareLevyExemption}
                onValueChange={(v) => setFormData({ ...formData, medicareLevyExemption: v as any })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="none" id="ml_none" />
                  <Label htmlFor="ml_none" className="cursor-pointer">No exemption</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="full" id="ml_full" />
                  <Label htmlFor="ml_full" className="cursor-pointer">Full Medicare levy exemption</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="half" id="ml_half" />
                  <Label htmlFor="ml_half" className="cursor-pointer">Half Medicare levy exemption</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Withholding Variation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Withholding Variation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Apply withholding variation</p>
                  <p className="text-xs text-muted-foreground">
                    ATO approved variation to standard withholding
                  </p>
                </div>
                <Switch
                  checked={formData.withholdingVariation}
                  onCheckedChange={(checked) => setFormData({ ...formData, withholdingVariation: checked })}
                />
              </div>
              
              {formData.withholdingVariation && (
                <div className="space-y-2">
                  <Label>Variation Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.variationRate || ''}
                    onChange={(e) => setFormData({ ...formData, variationRate: parseFloat(e.target.value) })}
                    placeholder="e.g. 15.5"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Declaration */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Declaration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                I declare that the information I have provided in this declaration is true and correct.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Declaration Date</Label>
                  <Input
                    type="date"
                    value={formData.declarationDate}
                    onChange={(e) => setFormData({ ...formData, declarationDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Signed By</Label>
                  <Input
                    value={formData.declarationSignedBy || ''}
                    onChange={(e) => setFormData({ ...formData, declarationSignedBy: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Declaration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
