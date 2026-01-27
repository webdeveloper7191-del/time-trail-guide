/**
 * Enterprise Agreement Creation Wizard
 * Multi-step wizard for creating new EBAs with all required configuration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  FileText,
  Scale,
  Calendar,
  MapPin,
  Percent,
  Users,
  DollarSign,
  Gift,
  Clock,
  Sun,
  Moon,
  Umbrella,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AgreementType,
  EBAClassification,
  EBAPayRate,
  EBAAllowance,
  EBALeaveEntitlement,
  EBACondition,
  EnterpriseAgreement,
} from '@/types/enterpriseAgreement';
import { AustralianState, stateLabels } from '@/types/leaveAccrual';

interface EBAWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (eba: Partial<EnterpriseAgreement>) => void;
  existingEBA?: EnterpriseAgreement; // For edit mode
}

type WizardStep = 'basic' | 'classifications' | 'allowances' | 'penalties' | 'leave' | 'conditions' | 'review';

const WIZARD_STEPS: { id: WizardStep; title: string; icon: any }[] = [
  { id: 'basic', title: 'Basic Info', icon: FileText },
  { id: 'classifications', title: 'Classifications', icon: Users },
  { id: 'allowances', title: 'Allowances', icon: Gift },
  { id: 'penalties', title: 'Penalty Rates', icon: Percent },
  { id: 'leave', title: 'Leave', icon: Umbrella },
  { id: 'conditions', title: 'Conditions', icon: Clock },
  { id: 'review', title: 'Review', icon: Check },
];

export function EBAWizard({ open, onOpenChange, onComplete, existingEBA }: EBAWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const isEditMode = !!existingEBA;

  // Form state
  const [basicInfo, setBasicInfo] = useState({
    name: existingEBA?.name || '',
    code: existingEBA?.code || '',
    type: (existingEBA?.type || 'enterprise_agreement') as AgreementType,
    underlyingAwardId: existingEBA?.underlyingAwardId || '',
    underlyingAwardName: existingEBA?.underlyingAwardName || '',
    commencementDate: existingEBA?.commencementDate || '',
    nominalExpiryDate: existingEBA?.nominalExpiryDate || '',
    fwcApprovalNumber: existingEBA?.fwcApprovalNumber || '',
    coverageDescription: existingEBA?.coverageDescription || '',
    applicableStates: existingEBA?.applicableStates || [] as AustralianState[],
    superannuationRate: existingEBA?.superannuationRate || 11.5,
  });

  const [classifications, setClassifications] = useState<EBAClassification[]>(
    existingEBA?.classifications || []
  );

  const [payRates, setPayRates] = useState<EBAPayRate[]>(
    existingEBA?.payRates || []
  );

  const [allowances, setAllowances] = useState<EBAAllowance[]>(
    existingEBA?.allowances || []
  );

  const [penaltyRates, setPenaltyRates] = useState({
    saturdayMultiplier: existingEBA?.penaltyRates?.saturdayMultiplier || 1.5,
    sundayMultiplier: existingEBA?.penaltyRates?.sundayMultiplier || 2.0,
    publicHolidayMultiplier: existingEBA?.penaltyRates?.publicHolidayMultiplier || 2.5,
    eveningShift: existingEBA?.penaltyRates?.eveningShift || { startTime: '18:00', endTime: '23:00', multiplier: 1.15 },
    nightShift: existingEBA?.penaltyRates?.nightShift || { startTime: '23:00', endTime: '07:00', multiplier: 1.25 },
    overtime: existingEBA?.penaltyRates?.overtime || { first2Hours: 1.5, after2Hours: 2.0, sundayOvertime: 2.0, publicHolidayOvertime: 2.5 },
    casualLoading: existingEBA?.penaltyRates?.casualLoading || 25,
  });

  const [leaveEntitlements, setLeaveEntitlements] = useState<EBALeaveEntitlement[]>(
    existingEBA?.leaveEntitlements || [
      { leaveType: 'Annual Leave', entitlementDays: 20, accrualMethod: 'progressive', exceedsNES: false, nesEntitlementDays: 20 },
      { leaveType: 'Personal/Carers Leave', entitlementDays: 10, accrualMethod: 'progressive', exceedsNES: false, nesEntitlementDays: 10 },
    ]
  );

  const [conditions, setConditions] = useState<EBACondition[]>(
    existingEBA?.conditions || []
  );

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  const toggleState = (state: AustralianState) => {
    setBasicInfo(prev => ({
      ...prev,
      applicableStates: prev.applicableStates.includes(state)
        ? prev.applicableStates.filter(s => s !== state)
        : [...prev.applicableStates, state],
    }));
  };

  const addClassification = () => {
    const newId = `cls-${Date.now()}`;
    setClassifications(prev => [...prev, {
      id: newId,
      code: '',
      name: '',
      description: '',
      level: prev.length + 1,
    }]);
    // Add corresponding pay rate
    setPayRates(prev => [...prev, {
      id: `pr-${Date.now()}`,
      classificationId: newId,
      rateType: 'hourly',
      baseRate: 0,
      effectiveFrom: basicInfo.commencementDate,
      annualIncreasePercent: 3.5,
    }]);
  };

  const updateClassification = (id: string, updates: Partial<EBAClassification>) => {
    setClassifications(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updatePayRate = (classificationId: string, updates: Partial<EBAPayRate>) => {
    setPayRates(prev => prev.map(pr => pr.classificationId === classificationId ? { ...pr, ...updates } : pr));
  };

  const removeClassification = (id: string) => {
    setClassifications(prev => prev.filter(c => c.id !== id));
    setPayRates(prev => prev.filter(pr => pr.classificationId !== id));
  };

  const addAllowance = () => {
    setAllowances(prev => [...prev, {
      id: `alw-${Date.now()}`,
      name: '',
      code: '',
      description: '',
      amount: 0,
      frequency: 'per_week',
      conditions: '',
      isTaxable: true,
      isSuperApplicable: false,
    }]);
  };

  const updateAllowance = (id: string, updates: Partial<EBAAllowance>) => {
    setAllowances(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAllowance = (id: string) => {
    setAllowances(prev => prev.filter(a => a.id !== id));
  };

  const updateLeaveEntitlement = (leaveType: string, updates: Partial<EBALeaveEntitlement>) => {
    setLeaveEntitlements(prev => prev.map(le => le.leaveType === leaveType ? { ...le, ...updates } : le));
  };

  const addCondition = () => {
    setConditions(prev => [...prev, {
      id: `cond-${Date.now()}`,
      category: 'hours',
      title: '',
      description: '',
      clauseReference: '',
    }]);
  };

  const updateCondition = (id: string, updates: Partial<EBACondition>) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  };

  const handleComplete = () => {
    const eba: Partial<EnterpriseAgreement> = {
      id: existingEBA?.id || `eba-${Date.now()}`,
      ...basicInfo,
      classifications,
      payRates,
      allowances,
      penaltyRates,
      leaveEntitlements,
      conditions,
      redundancyScale: existingEBA?.redundancyScale || [],
      industryClassifications: [],
      version: existingEBA?.version || '1.0',
      createdAt: existingEBA?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'active',
      approvalDate: basicInfo.commencementDate,
      fwcReference: '',
    };
    
    onComplete(eba);
    toast.success(isEditMode ? 'Agreement updated successfully' : 'Agreement created successfully');
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </h3>
              
              <div className="space-y-2">
                <Label>Agreement Name *</Label>
                <Input 
                  placeholder="e.g., ABC Childcare Enterprise Agreement 2024" 
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agreement Code *</Label>
                  <Input 
                    placeholder="e.g., ABC-EBA-2024" 
                    value={basicInfo.code}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agreement Type *</Label>
                  <Select 
                    value={basicInfo.type} 
                    onValueChange={(v) => setBasicInfo(prev => ({ ...prev, type: v as AgreementType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                      <SelectItem value="individual_flexibility">Individual Flexibility Arrangement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                BOOT Reference & FWC Details
              </h3>
              
              <div className="space-y-2">
                <Label>Underlying Award (BOOT Reference) *</Label>
                <Select 
                  value={basicInfo.underlyingAwardId}
                  onValueChange={(v) => setBasicInfo(prev => ({ ...prev, underlyingAwardId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select underlying award" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="children-services-2020">Children's Services Award 2020</SelectItem>
                    <SelectItem value="educational-services-2020">Educational Services Award 2020</SelectItem>
                    <SelectItem value="aged-care-2020">Aged Care Award 2020</SelectItem>
                    <SelectItem value="nursing-2020">Nurses Award 2020</SelectItem>
                    <SelectItem value="social-services-2020">Social, Community, Home Care & Disability Services Award 2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>FWC Approval Number</Label>
                <Input 
                  placeholder="e.g., AE508123"
                  value={basicInfo.fwcApprovalNumber}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, fwcApprovalNumber: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Key Dates
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commencement Date *</Label>
                  <Input 
                    type="date"
                    value={basicInfo.commencementDate}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, commencementDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nominal Expiry Date *</Label>
                  <Input 
                    type="date"
                    value={basicInfo.nominalExpiryDate}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, nominalExpiryDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Coverage
              </h3>
              
              <div className="space-y-2">
                <Label>Applicable States *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(stateLabels) as AustralianState[]).map(state => (
                    <div 
                      key={state}
                      className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                        basicInfo.applicableStates.includes(state) 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => toggleState(state)}
                    >
                      <span className="text-sm font-medium">{state}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coverage Description *</Label>
                <Textarea 
                  placeholder="Describe which employees are covered by this agreement..."
                  value={basicInfo.coverageDescription}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, coverageDescription: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Superannuation
              </h3>
              
              <div className="space-y-2">
                <Label>Employer Contribution Rate (%)</Label>
                <Input 
                  type="number"
                  step="0.5"
                  value={basicInfo.superannuationRate}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, superannuationRate: parseFloat(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Current SG minimum: 11.5%</p>
              </div>
            </div>
          </div>
        );

      case 'classifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Classifications & Pay Rates
                </h3>
                <p className="text-sm text-muted-foreground">Define job levels and their corresponding pay rates</p>
              </div>
              <Button onClick={addClassification} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Classification
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {classifications.map((cls, index) => {
                  const rate = payRates.find(pr => pr.classificationId === cls.id);
                  return (
                    <Card key={cls.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Classification Level {index + 1}</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeClassification(cls.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Code</Label>
                            <Input 
                              placeholder="e.g., CSW-1"
                              value={cls.code}
                              onChange={(e) => updateClassification(cls.id, { code: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input 
                              placeholder="e.g., Support Worker Level 1"
                              value={cls.name}
                              onChange={(e) => updateClassification(cls.id, { name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input 
                            placeholder="Brief description of this classification"
                            value={cls.description}
                            onChange={(e) => updateClassification(cls.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Rate Type</Label>
                            <Select 
                              value={rate?.rateType || 'hourly'}
                              onValueChange={(v) => updatePayRate(cls.id, { rateType: v as 'hourly' | 'annual' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Base Rate ($)</Label>
                            <Input 
                              type="number"
                              step={rate?.rateType === 'hourly' ? '0.01' : '1000'}
                              value={rate?.baseRate || 0}
                              onChange={(e) => updatePayRate(cls.id, { baseRate: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Annual Increase %</Label>
                            <Input 
                              type="number"
                              step="0.1"
                              value={rate?.annualIncreasePercent || 3.5}
                              onChange={(e) => updatePayRate(cls.id, { annualIncreasePercent: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {classifications.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No classifications defined yet</p>
                      <Button onClick={addClassification} variant="outline" size="sm" className="mt-4 gap-1">
                        <Plus className="h-4 w-4" />
                        Add First Classification
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'allowances':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Allowances
                </h3>
                <p className="text-sm text-muted-foreground">Configure allowances for specific duties or conditions</p>
              </div>
              <Button onClick={addAllowance} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Allowance
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {allowances.map((alw) => (
                  <Card key={alw.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input 
                              placeholder="e.g., First Aid Allowance"
                              value={alw.name}
                              onChange={(e) => updateAllowance(alw.id, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Code</Label>
                            <Input 
                              placeholder="e.g., FA"
                              value={alw.code}
                              onChange={(e) => updateAllowance(alw.id, { code: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-2" onClick={() => removeAllowance(alw.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          placeholder="Description of the allowance"
                          value={alw.description}
                          onChange={(e) => updateAllowance(alw.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Amount ($)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={alw.amount}
                            onChange={(e) => updateAllowance(alw.id, { amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select 
                            value={alw.frequency}
                            onValueChange={(v) => updateAllowance(alw.id, { frequency: v as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_hour">Per Hour</SelectItem>
                              <SelectItem value="per_shift">Per Shift</SelectItem>
                              <SelectItem value="per_day">Per Day</SelectItem>
                              <SelectItem value="per_week">Per Week</SelectItem>
                              <SelectItem value="per_occurrence">Per Occurrence</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="flex gap-4 pt-2">
                            <label className="flex items-center gap-2 text-sm">
                              <Switch 
                                checked={alw.isTaxable}
                                onCheckedChange={(c) => updateAllowance(alw.id, { isTaxable: c })}
                              />
                              Taxable
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Switch 
                                checked={alw.isSuperApplicable}
                                onCheckedChange={(c) => updateAllowance(alw.id, { isSuperApplicable: c })}
                              />
                              Super
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Conditions</Label>
                        <Input 
                          placeholder="When is this allowance applicable?"
                          value={alw.conditions}
                          onChange={(e) => updateAllowance(alw.id, { conditions: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {allowances.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No allowances defined yet</p>
                      <Button onClick={addAllowance} variant="outline" size="sm" className="mt-4 gap-1">
                        <Plus className="h-4 w-4" />
                        Add First Allowance
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'penalties':
        return (
          <div className="space-y-6">
            <h3 className="font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Penalty Rates Configuration
            </h3>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Weekend & Public Holiday Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Saturday Multiplier</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.saturdayMultiplier}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, saturdayMultiplier: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sunday Multiplier</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.sundayMultiplier}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, sundayMultiplier: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Public Holiday Multiplier</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.publicHolidayMultiplier}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, publicHolidayMultiplier: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Evening Shift Penalty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="time"
                      value={penaltyRates.eveningShift.startTime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, eveningShift: { ...prev.eveningShift, startTime: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="time"
                      value={penaltyRates.eveningShift.endTime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, eveningShift: { ...prev.eveningShift, endTime: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Multiplier</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.eveningShift.multiplier}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, eveningShift: { ...prev.eveningShift, multiplier: parseFloat(e.target.value) } }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Night Shift Penalty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="time"
                      value={penaltyRates.nightShift.startTime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, nightShift: { ...prev.nightShift, startTime: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="time"
                      value={penaltyRates.nightShift.endTime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, nightShift: { ...prev.nightShift, endTime: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Multiplier</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.nightShift.multiplier}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, nightShift: { ...prev.nightShift, multiplier: parseFloat(e.target.value) } }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Overtime Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First 2 Hours</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.overtime.first2Hours}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, overtime: { ...prev.overtime, first2Hours: parseFloat(e.target.value) } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>After 2 Hours</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.overtime.after2Hours}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, overtime: { ...prev.overtime, after2Hours: parseFloat(e.target.value) } }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sunday Overtime</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.overtime.sundayOvertime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, overtime: { ...prev.overtime, sundayOvertime: parseFloat(e.target.value) } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Public Holiday Overtime</Label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={penaltyRates.overtime.publicHolidayOvertime}
                      onChange={(e) => setPenaltyRates(prev => ({ ...prev, overtime: { ...prev.overtime, publicHolidayOvertime: parseFloat(e.target.value) } }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Casual Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Casual Loading (%)</Label>
                  <Input 
                    type="number"
                    step="1"
                    value={penaltyRates.casualLoading}
                    onChange={(e) => setPenaltyRates(prev => ({ ...prev, casualLoading: parseFloat(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'leave':
        return (
          <div className="space-y-6">
            <h3 className="font-medium flex items-center gap-2">
              <Umbrella className="h-4 w-4" />
              Leave Entitlements
            </h3>

            <div className="space-y-4">
              {leaveEntitlements.map((le) => (
                <Card key={le.leaveType}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{le.leaveType}</h4>
                      {le.exceedsNES && (
                        <Badge className="bg-emerald-500/10 text-emerald-700">Exceeds NES</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Entitlement (days/year)</Label>
                        <Input 
                          type="number"
                          value={le.entitlementDays}
                          onChange={(e) => updateLeaveEntitlement(le.leaveType, { 
                            entitlementDays: parseInt(e.target.value) || 0,
                            exceedsNES: (parseInt(e.target.value) || 0) > le.nesEntitlementDays,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>NES Minimum</Label>
                        <Input 
                          type="number"
                          value={le.nesEntitlementDays}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Accrual Method</Label>
                        <Select 
                          value={le.accrualMethod}
                          onValueChange={(v) => updateLeaveEntitlement(le.leaveType, { accrualMethod: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="progressive">Progressive</SelectItem>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="anniversary">Anniversary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'conditions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Conditions
                </h3>
                <p className="text-sm text-muted-foreground">Define hours, breaks, rosters, and other conditions</p>
              </div>
              <Button onClick={addCondition} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {conditions.map((cond) => (
                  <Card key={cond.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select 
                              value={cond.category}
                              onValueChange={(v) => updateCondition(cond.id, { category: v as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="breaks">Breaks</SelectItem>
                                <SelectItem value="rosters">Rosters</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input 
                              placeholder="e.g., Ordinary Hours"
                              value={cond.title}
                              onChange={(e) => updateCondition(cond.id, { title: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-2" onClick={() => removeCondition(cond.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Full description of the condition..."
                          value={cond.description}
                          onChange={(e) => updateCondition(cond.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Clause Reference</Label>
                        <Input 
                          placeholder="e.g., Clause 12"
                          value={cond.clauseReference}
                          onChange={(e) => updateCondition(cond.id, { clauseReference: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {conditions.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">No conditions defined yet</p>
                      <Button onClick={addCondition} variant="outline" size="sm" className="mt-4 gap-1">
                        <Plus className="h-4 w-4" />
                        Add First Condition
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="font-medium flex items-center gap-2">
              <Check className="h-4 w-4" />
              Review Agreement
            </h3>

            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{basicInfo.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-medium">{basicInfo.code || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">
                      {basicInfo.commencementDate && basicInfo.nominalExpiryDate 
                        ? `${format(new Date(basicInfo.commencementDate), 'dd MMM yyyy')} - ${format(new Date(basicInfo.nominalExpiryDate), 'dd MMM yyyy')}`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coverage:</span>
                    <span className="font-medium">{basicInfo.applicableStates.join(', ') || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{classifications.length}</p>
                    <p className="text-sm text-muted-foreground">Classifications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{allowances.length}</p>
                    <p className="text-sm text-muted-foreground">Allowances</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{leaveEntitlements.length}</p>
                    <p className="text-sm text-muted-foreground">Leave Types</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{conditions.length}</p>
                    <p className="text-sm text-muted-foreground">Conditions</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Penalty Rates Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Saturday</p>
                      <p className="font-bold">{penaltyRates.saturdayMultiplier}x</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Sunday</p>
                      <p className="font-bold">{penaltyRates.sundayMultiplier}x</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Pub Holiday</p>
                      <p className="font-bold">{penaltyRates.publicHolidayMultiplier}x</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Casual</p>
                      <p className="font-bold">{penaltyRates.casualLoading}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>{isEditMode ? 'Edit Enterprise Agreement' : 'Create Enterprise Agreement'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Update the agreement configuration' : 'Complete all steps to create a new agreement'}
          </SheetDescription>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = index < currentStepIndex;
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast 
                        ? 'bg-emerald-500/20 text-emerald-700'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {renderStepContent()}
        </ScrollArea>

        <SheetFooter className="p-6 pt-4 border-t flex justify-between">
          <Button 
            variant="outline" 
            onClick={currentStepIndex === 0 ? () => onOpenChange(false) : goBack}
            className="gap-1"
          >
            {currentStepIndex === 0 ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>
          
          {currentStep === 'review' ? (
            <Button onClick={handleComplete} className="gap-1">
              <Save className="h-4 w-4" />
              {isEditMode ? 'Save Changes' : 'Create Agreement'}
            </Button>
          ) : (
            <Button onClick={goNext} className="gap-1">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
