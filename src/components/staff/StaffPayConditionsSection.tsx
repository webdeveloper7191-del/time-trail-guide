import { useState } from 'react';
import { StaffMember, employmentTypeLabels, payRateTypeLabels } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  Edit,
  History,
  Award,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { StaffPayConfigurationSection } from './StaffPayConfigurationSection';
import { StaffAwardRuleSection } from './StaffAwardRuleSection';
import { EditPayConditionsSheet } from './EditPayConditionsSheet';
import { PayConditionsHistorySheet } from './PayConditionsHistorySheet';

interface StaffPayConditionsSectionProps {
  staff: StaffMember;
}

export function StaffPayConditionsSection({ staff }: StaffPayConditionsSectionProps) {
  const [activeTab, setActiveTab] = useState('pay-conditions');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const payCondition = staff.currentPayCondition;

  const payPeriodLabel = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="pay-conditions" className="data-[state=active]:bg-background">
            Pay Conditions
          </TabsTrigger>
          <TabsTrigger value="pay-configuration" className="data-[state=active]:bg-background">
            Pay Configuration
          </TabsTrigger>
          <TabsTrigger value="award-rule" className="data-[state=active]:bg-background">
            Award Rule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pay-conditions" className="mt-6 space-y-6">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Pay Conditions & Hours</h2>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setHistorySheetOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                View Upcoming & Past Conditions
              </Button>
              <Button size="sm" className="bg-primary" onClick={() => setEditSheetOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Current Pay Conditions
              </Button>
            </div>
          </div>

          {/* Main Pay Conditions Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Overriding Hourly Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payCondition ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Effective Period:</span>
                        <span className="text-sm font-medium">
                          {payCondition.effectiveFrom 
                            ? format(new Date(payCondition.effectiveFrom), 'dd MMM yyyy')
                            : 'Not Set'
                          }
                          {payCondition.effectiveTo && ` - ${format(new Date(payCondition.effectiveTo), 'dd MMM yyyy')}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Position:</span>
                        <span className="text-sm font-medium">{payCondition.position || 'None assigned'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Payrate Type:</span>
                        <span className="text-sm font-medium">
                          {payRateTypeLabels[payCondition.payRateType] || 'None assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Industry Award:</span>
                        <span className="text-sm font-medium">{payCondition.industryAward || 'None assigned'}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Employment Type:</span>
                        <span className="text-sm font-medium">
                          {employmentTypeLabels[payCondition.employmentType] || 'None assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Classification:</span>
                        <span className="text-sm font-medium">{payCondition.classification || 'None assigned'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Pay Period:</span>
                        <span className="text-sm font-medium">
                          {payPeriodLabel[payCondition.payPeriod]} – ({format(new Date(), 'dd MMMM yyyy')} - {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy')})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm text-muted-foreground">Contracted Hours:</span>
                        <span className="text-sm font-medium">{payCondition.contractedHours || 0} hrs/week</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No pay conditions configured</p>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Overriding Hourly Rate</p>
                <p className="text-3xl font-bold text-foreground">
                  ${payCondition?.hourlyRate.toFixed(2) || '00.00'}
                  <span className="text-base font-normal text-muted-foreground">/hr</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Total Allowances</p>
                {staff.customAllowances.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {staff.customAllowances.map((allowance) => (
                      <Badge key={allowance.id} variant="secondary" className="text-xs">
                        {allowance.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No allowances assigned</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Classification Tags</p>
                {payCondition?.classification ? (
                  <Badge variant="outline">{payCondition.classification}</Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No additional tags assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pay History */}
          {staff.payConditionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Pay Condition History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.payConditionHistory.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{condition.position}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(condition.effectiveFrom), 'dd MMM yyyy')} - 
                          {condition.effectiveTo ? format(new Date(condition.effectiveTo), 'dd MMM yyyy') : 'Present'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${condition.hourlyRate.toFixed(2)}/hr</p>
                        <p className="text-sm text-muted-foreground">{condition.classification}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pay-configuration" className="mt-6">
          <StaffPayConfigurationSection staff={staff} />
        </TabsContent>

        <TabsContent value="award-rule" className="mt-6">
          <StaffAwardRuleSection staff={staff} />
        </TabsContent>
      </Tabs>

      {/* Sheet Panels */}
      <EditPayConditionsSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        staff={staff}
      />
      <PayConditionsHistorySheet
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        staff={staff}
      />
    </div>
  );
}
