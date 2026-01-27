import { useState } from 'react';
import { StaffMember, employmentTypeLabels, payRateTypeLabels } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DollarSign,
  Calendar,
  Clock,
  History,
  Award,
  Scale,
  Settings2,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StaffAwardRuleSection } from './StaffAwardRuleSection';
import { PayConditionsHistorySheet } from './PayConditionsHistorySheet';
import { PayRateComparisonSheet } from './PayRateComparisonSheet';
import { UnifiedPayChangeSheet } from './UnifiedPayChangeSheet';
import { locations } from '@/data/mockStaffData';

interface StaffPayConditionsSectionProps {
  staff: StaffMember;
}

type PayChangeMode = 'previous' | 'current' | 'future';

export function StaffPayConditionsSection({ staff }: StaffPayConditionsSectionProps) {
  const [payChangeSheetOpen, setPayChangeSheetOpen] = useState(false);
  const [payChangeMode, setPayChangeMode] = useState<PayChangeMode>('current');
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [comparisonSheetOpen, setComparisonSheetOpen] = useState(false);
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<string[]>(['pay-overview', 'availability']);
  
  // Availability state
  const [availabilityPattern, setAvailabilityPattern] = useState(staff.availabilityPattern);
  
  const payCondition = staff.currentPayCondition;

  const openPayChangeSheet = (mode: PayChangeMode) => {
    setPayChangeMode(mode);
    setPayChangeSheetOpen(true);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const payPeriodLabel = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Pay Conditions & Hours</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => setComparisonSheetOpen(true)} className="shadow-sm">
            <Scale className="h-4 w-4 mr-2" />
            Compare Rates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHistorySheetOpen(true)} className="shadow-sm">
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
          <Button size="sm" onClick={() => openPayChangeSheet('current')} className="shadow-md">
            <Settings2 className="h-4 w-4 mr-2" />
            Manage Pay
          </Button>
        </div>
      </div>

      {/* Section 1: Pay Overview */}
      <Collapsible 
        open={expandedSections.includes('pay-overview')} 
        onOpenChange={() => toggleSection('pay-overview')}
      >
        <div className="card-material-elevated">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Pay Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    Current rate: ${payCondition?.hourlyRate.toFixed(2) || '0.00'}/hr • {payCondition?.classification || 'No classification'}
                  </p>
                </div>
              </div>
              {expandedSections.includes('pay-overview') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-5">
              <Separator />
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

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 pt-2">
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
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 2: Award Rules */}
      <Collapsible 
        open={expandedSections.includes('award-rules')} 
        onOpenChange={() => toggleSection('award-rules')}
      >
        <div className="card-material-elevated">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Award Rules & Penalties</h3>
                  <p className="text-sm text-muted-foreground">
                    {staff.applicableAward?.awardName || 'No award assigned'} • Overtime & penalty rates
                  </p>
                </div>
              </div>
              {expandedSections.includes('award-rules') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6">
              <Separator className="mb-4" />
              <StaffAwardRuleSection staff={staff} />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 3: Weekly Availability */}
      <Collapsible 
        open={expandedSections.includes('availability')} 
        onOpenChange={() => toggleSection('availability')}
      >
        <div className="card-material-elevated">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Weekly Availability</h3>
                  <p className="text-sm text-muted-foreground">
                    {staff.weeklyAvailability.filter(a => a.isAvailable).length} days available • {availabilityPattern === 'same_every_week' ? 'Same every week' : 'Alternate weekly'}
                  </p>
                </div>
              </div>
              {expandedSections.includes('availability') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              <Separator />
              <RadioGroup 
                value={availabilityPattern} 
                onValueChange={(v) => setAvailabilityPattern(v as 'same_every_week' | 'alternate_weekly')} 
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="same_every_week" id="same" />
                  <Label htmlFor="same" className="font-medium cursor-pointer">Same Every Week</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="alternate_weekly" id="alternate" />
                  <Label htmlFor="alternate" className="font-medium cursor-pointer">Alternate Weekly (Week A / Week B)</Label>
                </div>
              </RadioGroup>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 gap-0 bg-muted/50 text-sm font-medium">
                  <div className="px-3 py-2">Day</div>
                  <div className="px-3 py-2 text-center">Start</div>
                  <div className="px-3 py-2 text-center">Finish</div>
                  <div className="px-3 py-2 text-center">Hours</div>
                  <div className="px-3 py-2 text-center">Break</div>
                  <div className="px-3 py-2 text-center">Area</div>
                  <div className="px-3 py-2"></div>
                </div>
                {daysOfWeek.map((day) => {
                  const availability = staff.weeklyAvailability.find(a => a.dayOfWeek === day.key);
                  
                  return (
                    <div key={day.key} className="grid grid-cols-7 gap-0 border-t items-center">
                      <div className="px-3 py-2">
                        <p className="font-medium text-sm">{day.label}</p>
                      </div>
                      {availability?.isAvailable ? (
                        <>
                          <div className="px-2 py-2">
                            <Input 
                              type="time" 
                              defaultValue={availability.startTime} 
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="px-2 py-2">
                            <Input 
                              type="time" 
                              defaultValue={availability.endTime}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="px-3 py-2 text-center text-sm">
                            8h
                          </div>
                          <div className="px-3 py-2 text-center text-sm">
                            {availability.breakMinutes || 30} min
                          </div>
                          <div className="px-2 py-2">
                            <Select defaultValue={availability.area || 'Main Centre'}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((loc) => (
                                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="px-2 py-2 text-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-5 px-3 py-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Hours
                            </Button>
                          </div>
                          <div className="px-2 py-2"></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 4: Pay Condition History */}
      {staff.payConditionHistory.length > 0 && (
        <Collapsible 
          open={expandedSections.includes('history')} 
          onOpenChange={() => toggleSection('history')}
        >
          <div className="card-material-elevated">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Pay Condition History</h3>
                    <p className="text-sm text-muted-foreground">
                      {staff.payConditionHistory.length} previous pay condition{staff.payConditionHistory.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedSections.includes('history') ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-3">
                <Separator />
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Section 5: Employment Documents */}
      <Collapsible 
        open={expandedSections.includes('documents')} 
        onOpenChange={() => toggleSection('documents')}
      >
        <div className="card-material-elevated">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Employment Contracts & Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Contracts, policies, and required documents
                  </p>
                </div>
              </div>
              {expandedSections.includes('documents') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Employment Contract</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Contract Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time Employment Contract</SelectItem>
                      <SelectItem value="part-time">Part Time Employment Contract</SelectItem>
                      <SelectItem value="casual">Casual Employment Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Required Documents</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Documents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handbook">Employee Handbook</SelectItem>
                      <SelectItem value="policy">Workplace Policy</SelectItem>
                      <SelectItem value="safety">Safety Guidelines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Upload additional documents</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or PDF, max 10MB</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Select File</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  Employment Contract.pdf
                  <button className="ml-1 text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  ID Verification.pdf
                  <button className="ml-1 text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Sheet Panels */}
      <UnifiedPayChangeSheet
        open={payChangeSheetOpen}
        onOpenChange={setPayChangeSheetOpen}
        staff={staff}
        initialMode={payChangeMode}
      />
      <PayConditionsHistorySheet
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
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
