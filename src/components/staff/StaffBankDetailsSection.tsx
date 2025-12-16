import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  CreditCard,
  Edit,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface StaffBankDetailsSectionProps {
  staff: StaffMember;
}

export function StaffBankDetailsSection({ staff }: StaffBankDetailsSectionProps) {
  const maskAccountNumber = (num: string) => {
    if (!num) return '';
    return '••••' + num.slice(-4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bank Details & Super Fund</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage payment and superannuation details
          </p>
        </div>
        <Button size="sm" className="bg-primary">
          <Edit className="h-4 w-4 mr-2" />
          Edit Bank Details
        </Button>
      </div>

      {/* Bank Account */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-medium">Bank Account Details</CardTitle>
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
              <Button variant="outline" size="sm" className="mt-2">
                Add Bank Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Super Fund */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base font-medium">Superannuation Fund</CardTitle>
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
              <Button variant="outline" size="sm" className="mt-2">
                Add Super Fund
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax File Number */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base font-medium">Tax Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Tax File Number (TFN)</Label>
              <div className="relative">
                <Input 
                  value={staff.taxFileNumber ? '•••-•••-•••' : 'Not provided'} 
                  readOnly 
                  className="bg-muted/30 pr-10" 
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                TFN is securely stored and encrypted
              </p>
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
    </div>
  );
}
