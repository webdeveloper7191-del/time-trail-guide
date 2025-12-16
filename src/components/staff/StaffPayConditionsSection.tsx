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
  CalendarPlus,
  Scale,
} from 'lucide-react';
import { format } from 'date-fns';
import { StaffPayConfigurationSection } from './StaffPayConfigurationSection';
import { StaffAwardRuleSection } from './StaffAwardRuleSection';
import { EditPayConditionsSheet } from './EditPayConditionsSheet';
import { PayConditionsHistorySheet } from './PayConditionsHistorySheet';
import { SchedulePayChangeSheet } from './SchedulePayChangeSheet';
import { PayRateComparisonSheet } from './PayRateComparisonSheet';

interface StaffPayConditionsSectionProps {
  staff: StaffMember;
}

export function StaffPayConditionsSection({ staff }: StaffPayConditionsSectionProps) {
  const [activeTab, setActiveTab] = useState('pay-conditions');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [comparisonSheetOpen, setComparisonSheetOpen] = useState(false);
  const payCondition = staff.currentPayCondition;

  const payPeriodLabel = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 p-1 h-auto rounded-lg border border-border/50">
          <TabsTrigger value="pay-conditions" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Pay Conditions
          </TabsTrigger>
          <TabsTrigger value="pay-configuration" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Pay Configuration
          </TabsTrigger>
          <TabsTrigger value="award-rule" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Award Rule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pay-conditions" className="mt-6 space-y-5">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Current Pay Conditions & Hours</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => setComparisonSheetOpen(true)} className="shadow-sm">
                <Scale className="h-4 w-4 mr-2" />
                Compare Rates
              </Button>
              <Button variant="outline" size="sm" onClick={() => setHistorySheetOpen(true)} className="shadow-sm">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
              <Button variant="outline" size="sm" onClick={() => setScheduleSheetOpen(true)} className="shadow-sm">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Change
              </Button>
              <Button size="sm" onClick={() => setEditSheetOpen(true)} className="shadow-md">
                <Edit className="h-4 w-4 mr-2" />
                Edit Current
              </Button>
            </div>
          </div>

          {/* Main Pay Conditions Card */}
          <div className="card-material-elevated p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <h3 className="section-header">Pay Overview</h3>
            </div>
            {payCondition ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <div className="data-row">
                  <span className="data-label">Effective Period</span>
                  <span className="data-value">
                    {payCondition.effectiveFrom 
                      ? format(new Date(payCondition.effectiveFrom), 'dd MMM yyyy')
                      : 'Not Set'
                    }
                    {payCondition.effectiveTo && ` - ${format(new Date(payCondition.effectiveTo), 'dd MMM yyyy')}`}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Employment Type</span>
                  <span className="data-value">
                    {employmentTypeLabels[payCondition.employmentType] || 'None assigned'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Position</span>
                  <span className="data-value">{payCondition.position || 'None assigned'}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Classification</span>
                  <span className="data-value">{payCondition.classification || 'None assigned'}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Payrate Type</span>
                  <span className="data-value">
                    {payRateTypeLabels[payCondition.payRateType] || 'None assigned'}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Pay Period</span>
                  <span className="data-value">
                    {payPeriodLabel[payCondition.payPeriod]}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Industry Award</span>
                  <span className="data-value">{payCondition.industryAward || 'None assigned'}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Contracted Hours</span>
                  <span className="data-value">{payCondition.contractedHours || 0} hrs/week</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No pay conditions configured</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hourly Rate</p>
              <p className="text-3xl font-bold text-foreground">
                ${payCondition?.hourlyRate.toFixed(2) || '00.00'}
                <span className="text-sm font-normal text-muted-foreground ml-1">/hr</span>
              </p>
            </div>
            <div className="stat-card stat-card-success">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Allowances</p>
              {staff.customAllowances.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {staff.customAllowances.map((allowance) => (
                    <Badge key={allowance.id} variant="secondary" className="text-xs font-medium">
                      {allowance.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No allowances assigned</p>
              )}
            </div>
            <div className="stat-card stat-card-warning">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Classification</p>
              {payCondition?.classification ? (
                <Badge variant="outline" className="font-medium">{payCondition.classification}</Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No classification</p>
              )}
            </div>
          </div>

          {/* Pay History */}
          {staff.payConditionHistory.length > 0 && (
            <div className="card-material-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-muted">
                  <History className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="section-header">Pay Condition History</h3>
              </div>
              <div className="space-y-3">
                {staff.payConditionHistory.map((condition) => (
                  <div key={condition.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-semibold">{condition.position}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(condition.effectiveFrom), 'dd MMM yyyy')} - 
                        {condition.effectiveTo ? format(new Date(condition.effectiveTo), 'dd MMM yyyy') : 'Present'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${condition.hourlyRate.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
                      <p className="text-sm text-muted-foreground">{condition.classification}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
      <SchedulePayChangeSheet
        open={scheduleSheetOpen}
        onOpenChange={setScheduleSheetOpen}
        staff={staff}
      />
      <PayRateComparisonSheet
        open={comparisonSheetOpen}
        onOpenChange={setComparisonSheetOpen}
        staff={staff}
      />
    </div>
  );
}
