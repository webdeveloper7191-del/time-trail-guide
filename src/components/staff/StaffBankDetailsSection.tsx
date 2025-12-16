import { useState } from 'react';
import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CreditCard,
  Edit,
  Lock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { EditBankDetailsSheet } from './EditBankDetailsSheet';
import { TaxDeclarationSheet } from './TaxDeclarationSheet';

interface StaffBankDetailsSectionProps {
  staff: StaffMember;
}

export function StaffBankDetailsSection({ staff }: StaffBankDetailsSectionProps) {
  const [bankDetailsSheetOpen, setBankDetailsSheetOpen] = useState(false);
  const [taxDeclarationSheetOpen, setTaxDeclarationSheetOpen] = useState(false);

  const maskAccountNumber = (num: string) => {
    if (!num) return '';
    return '••••' + num.slice(-4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bank Details & Tax</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage payment, superannuation, and tax information
          </p>
        </div>
      </div>

      {/* Bank Account */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Bank Account Details</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBankDetailsSheetOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {staff.bankDetails ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Account Name</Label>
                  <Input value={staff.bankDetails.accountName} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">BSB</Label>
                  <Input value={staff.bankDetails.bsb} readOnly className="bg-muted/30" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Account Number</Label>
                  <div className="relative">
                    <Input 
                      value={maskAccountNumber(staff.bankDetails.accountNumber)} 
                      readOnly 
                      className="bg-muted/30 pr-10" 
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No bank details configured</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setBankDetailsSheetOpen(true)}>
                Add Bank Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Super Fund */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              <CardTitle className="text-base font-medium">Superannuation Fund</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBankDetailsSheetOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {staff.bankDetails?.superFundName ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Super Fund Name</Label>
                <Input value={staff.bankDetails.superFundName} readOnly className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Member Number</Label>
                <div className="relative">
                  <Input 
                    value={staff.bankDetails.superMemberNumber || 'Not provided'} 
                    readOnly 
                    className="bg-muted/30 pr-10" 
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No superannuation fund configured</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setBankDetailsSheetOpen(true)}>
                Add Super Fund
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Declaration Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-medium">Tax Declaration (TFN Declaration)</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTaxDeclarationSheetOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Declaration
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TFN Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {staff.taxFileNumber ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">Tax File Number (TFN)</p>
                <p className="text-sm text-muted-foreground">
                  {staff.taxFileNumber ? 'Provided and on record' : 'Not yet provided'}
                </p>
              </div>
            </div>
            <Badge variant={staff.taxFileNumber ? 'default' : 'secondary'}>
              {staff.taxFileNumber ? 'Complete' : 'Pending'}
            </Badge>
          </div>

          {/* Declaration Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Residency Status</p>
              <p className="font-medium">Australian Resident</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tax-Free Threshold</p>
              <p className="font-medium">Claimed</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">HELP/HECS Debt</p>
              <p className="font-medium">No</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Medicare Levy</p>
              <p className="font-medium">No Exemption</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Bank account numbers, TFN, and super member numbers are partially masked for security. 
                Only authorized personnel can view or edit the full details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Panels */}
      <EditBankDetailsSheet
        open={bankDetailsSheetOpen}
        onOpenChange={setBankDetailsSheetOpen}
        staff={staff}
      />
      <TaxDeclarationSheet
        open={taxDeclarationSheetOpen}
        onOpenChange={setTaxDeclarationSheetOpen}
        staff={staff}
      />
    </div>
  );
}
