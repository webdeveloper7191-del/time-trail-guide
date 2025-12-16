import { useState } from 'react';
import { StaffMember } from '@/types/staff';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Building2,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditBankDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSave?: (data: BankDetailsData) => void;
}

interface BankDetailsData {
  accountName: string;
  bsb: string;
  accountNumber: string;
  superFundName: string;
  superMemberNumber: string;
  superUSI: string;
}

export function EditBankDetailsSheet({ open, onOpenChange, staff, onSave }: EditBankDetailsSheetProps) {
  const [formData, setFormData] = useState<BankDetailsData>({
    accountName: staff.bankDetails?.accountName || '',
    bsb: staff.bankDetails?.bsb || '',
    accountNumber: staff.bankDetails?.accountNumber || '',
    superFundName: staff.bankDetails?.superFundName || '',
    superMemberNumber: staff.bankDetails?.superMemberNumber || '',
    superUSI: '',
  });

  const handleSave = () => {
    if (!formData.accountName || !formData.bsb || !formData.accountNumber) {
      toast.error('Please fill in all required bank details');
      return;
    }
    onSave?.(formData);
    toast.success('Bank details updated successfully');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Edit Bank Details
          </SheetTitle>
          <SheetDescription>
            Update bank and superannuation details for {staff.firstName} {staff.lastName}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Bank Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BSB *</Label>
                  <Input
                    value={formData.bsb}
                    onChange={(e) => setFormData({ ...formData, bsb: e.target.value })}
                    placeholder="e.g. 062-000"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g. 12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Super Fund */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-500" />
                Superannuation Fund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Super Fund Name</Label>
                <Select
                  value={formData.superFundName}
                  onValueChange={(v) => setFormData({ ...formData, superFundName: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select super fund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AustralianSuper">AustralianSuper</SelectItem>
                    <SelectItem value="Hostplus">Hostplus</SelectItem>
                    <SelectItem value="REST">REST Super</SelectItem>
                    <SelectItem value="Sunsuper">Sunsuper</SelectItem>
                    <SelectItem value="UniSuper">UniSuper</SelectItem>
                    <SelectItem value="HESTA">HESTA</SelectItem>
                    <SelectItem value="Cbus">Cbus</SelectItem>
                    <SelectItem value="other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Member Number</Label>
                  <Input
                    value={formData.superMemberNumber}
                    onChange={(e) => setFormData({ ...formData, superMemberNumber: e.target.value })}
                    placeholder="e.g. 123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>USI (Unique Super Identifier)</Label>
                  <Input
                    value={formData.superUSI}
                    onChange={(e) => setFormData({ ...formData, superUSI: e.target.value })}
                    placeholder="e.g. 60905115198001"
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
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
