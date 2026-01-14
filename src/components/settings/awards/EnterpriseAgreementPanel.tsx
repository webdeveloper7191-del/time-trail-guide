import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  GitCompare,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Award,
  Briefcase,
  Scale,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import {
  EnterpriseAgreement,
  EBAClassification,
  EBAPayRate,
  MultiAwardEmployee,
  AgreementType,
  AgreementStatus,
  agreementTypeLabels,
  agreementStatusLabels,
} from '@/types/enterpriseAgreement';
import { AustralianState, stateLabels } from '@/types/leaveAccrual';

// Mock EBA data
const mockEBAs: EnterpriseAgreement[] = [
  {
    id: 'eba-1',
    name: 'ABC Childcare Centres Enterprise Agreement 2023',
    code: 'ABC-EBA-2023',
    type: 'enterprise_agreement',
    status: 'active',
    coverageDescription: 'All employees at ABC Childcare Centres',
    applicableStates: ['NSW', 'VIC', 'QLD'],
    industryClassifications: ['Childcare', 'Early Childhood Education'],
    approvalDate: '2023-06-15',
    commencementDate: '2023-07-01',
    nominalExpiryDate: '2026-06-30',
    fwcReference: 'AG2023/1234',
    fwcApprovalNumber: 'AE508123',
    underlyingAwardId: 'children-services-2020',
    underlyingAwardName: "Children's Services Award 2020",
    classifications: [
      { id: 'c1', code: 'CSW-1', name: 'Support Worker Level 1', description: 'Entry level support', level: 1 },
      { id: 'c2', code: 'CSW-2', name: 'Support Worker Level 2', description: 'Experienced support', level: 2 },
      { id: 'c3', code: 'EDU-3', name: 'Educator Level 3', description: 'Qualified educator', level: 3 },
      { id: 'c4', code: 'EDU-4', name: 'Lead Educator', description: 'Room leader', level: 4 },
      { id: 'c5', code: 'DIR-5', name: 'Centre Director', description: 'Centre management', level: 5 },
    ],
    payRates: [
      { id: 'pr1', classificationId: 'c1', rateType: 'hourly', baseRate: 26.50, effectiveFrom: '2023-07-01', annualIncreasePercent: 3.5 },
      { id: 'pr2', classificationId: 'c2', rateType: 'hourly', baseRate: 28.75, effectiveFrom: '2023-07-01', annualIncreasePercent: 3.5 },
      { id: 'pr3', classificationId: 'c3', rateType: 'hourly', baseRate: 32.50, effectiveFrom: '2023-07-01', annualIncreasePercent: 3.5 },
      { id: 'pr4', classificationId: 'c4', rateType: 'hourly', baseRate: 36.25, effectiveFrom: '2023-07-01', annualIncreasePercent: 3.5 },
      { id: 'pr5', classificationId: 'c5', rateType: 'annual', baseRate: 85000, effectiveFrom: '2023-07-01', annualIncreasePercent: 3.5 },
    ],
    allowances: [
      { id: 'a1', name: 'First Aid Allowance', code: 'FA', description: 'For designated first aid officers', amount: 18.50, frequency: 'per_week', conditions: 'Must hold current first aid certificate', isTaxable: true, isSuperApplicable: true },
      { id: 'a2', name: 'Educational Leader Allowance', code: 'EL', description: 'For designated educational leaders', amount: 2.50, frequency: 'per_hour', conditions: 'Appointed as educational leader', isTaxable: true, isSuperApplicable: true },
      { id: 'a3', name: 'Vehicle Allowance', code: 'VA', description: 'For use of personal vehicle', amount: 0.96, frequency: 'per_occurrence', conditions: 'Per kilometre travelled', isTaxable: false, isSuperApplicable: false },
    ],
    penaltyRates: {
      saturdayMultiplier: 1.5,
      sundayMultiplier: 2.0,
      publicHolidayMultiplier: 2.5,
      eveningShift: { startTime: '18:00', endTime: '23:00', multiplier: 1.15 },
      nightShift: { startTime: '23:00', endTime: '07:00', multiplier: 1.25 },
      overtime: { first2Hours: 1.5, after2Hours: 2.0, sundayOvertime: 2.0, publicHolidayOvertime: 2.5 },
      casualLoading: 25,
    },
    leaveEntitlements: [
      { leaveType: 'Annual Leave', entitlementDays: 20, accrualMethod: 'progressive', exceedsNES: false, nesEntitlementDays: 20 },
      { leaveType: 'Personal Leave', entitlementDays: 12, accrualMethod: 'progressive', exceedsNES: true, nesEntitlementDays: 10 },
      { leaveType: 'Compassionate Leave', entitlementDays: 3, accrualMethod: 'immediate', exceedsNES: true, nesEntitlementDays: 2 },
    ],
    superannuationRate: 11.5,
    redundancyScale: [
      { yearsOfService: 1, weeksPayEntitlement: 4 },
      { yearsOfService: 2, weeksPayEntitlement: 6 },
      { yearsOfService: 3, weeksPayEntitlement: 7 },
      { yearsOfService: 4, weeksPayEntitlement: 8 },
      { yearsOfService: 5, weeksPayEntitlement: 10 },
      { yearsOfService: 9, weeksPayEntitlement: 16 },
    ],
    conditions: [
      { id: 'cond1', category: 'hours', title: 'Ordinary Hours', description: '38 hours per week, worked between 6am and 7pm', clauseReference: 'Clause 12' },
      { id: 'cond2', category: 'breaks', title: 'Meal Breaks', description: '30 minute unpaid meal break after 5 hours', clauseReference: 'Clause 15' },
      { id: 'cond3', category: 'rosters', title: 'Roster Notice', description: '7 days notice for roster changes', clauseReference: 'Clause 14' },
    ],
    version: '1.0',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    createdBy: 'admin',
  },
];

// Mock multi-award employees
const mockMultiAwardEmployees: (MultiAwardEmployee & { name: string; role: string })[] = [
  {
    staffId: 'staff-1',
    name: 'Sarah Johnson',
    role: 'Lead Educator',
    primaryAgreementId: 'eba-1',
    primaryAgreementType: 'enterprise_agreement',
    additionalAgreements: [
      { agreementId: 'children-services-2020', agreementType: 'modern_award', applicableConditions: ['BOOT reference'], priority: 2 },
    ],
    classifications: [
      { agreementId: 'eba-1', classificationId: 'c4', classificationName: 'Lead Educator', effectiveFrom: '2023-07-01' },
    ],
    updatedAt: '2024-01-15T00:00:00Z',
    updatedBy: 'admin',
  },
];

const statusColors: Record<AgreementStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  expired: 'bg-red-500/10 text-red-700 border-red-200',
  pending_approval: 'bg-amber-500/10 text-amber-700 border-amber-200',
  superseded: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export function EnterpriseAgreementPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEBA, setSelectedEBA] = useState<EnterpriseAgreement | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (isPast(new Date(expiryDate))) return { status: 'expired', message: 'Expired', color: 'text-red-600' };
    if (days <= 90) return { status: 'warning', message: `${days} days remaining`, color: 'text-amber-600' };
    if (days <= 180) return { status: 'notice', message: `${days} days remaining`, color: 'text-blue-600' };
    return { status: 'ok', message: `${days} days remaining`, color: 'text-muted-foreground' };
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEBAs.length}</p>
                <p className="text-sm text-muted-foreground">Enterprise Agreements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEBAs.filter(e => e.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active Agreements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMultiAwardEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Multi-Award Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEBAs.filter(e => differenceInDays(new Date(e.nominalExpiryDate), new Date()) <= 180).length}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agreements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCompareDialog(true)}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Agreement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="agreements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agreements">Enterprise Agreements</TabsTrigger>
          <TabsTrigger value="multi-award">Multi-Award Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements" className="space-y-4">
          {mockEBAs.map(eba => {
            const expiryStatus = getExpiryStatus(eba.nominalExpiryDate);

            return (
              <Card key={eba.id} className="card-material-elevated hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEBA(eba)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{eba.name}</CardTitle>
                          <Badge className={statusColors[eba.status]}>
                            {agreementStatusLabels[eba.status]}
                          </Badge>
                        </div>
                        <CardDescription>{eba.code} • {eba.fwcApprovalNumber}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Coverage</p>
                      <p className="font-medium">{eba.applicableStates.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Classifications</p>
                      <p className="font-medium">{eba.classifications.length} levels</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commenced</p>
                      <p className="font-medium">{format(new Date(eba.commencementDate), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiry</p>
                      <p className={`font-medium ${expiryStatus.color}`}>{expiryStatus.message}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Underlying Award</p>
                      <p className="font-medium truncate">{eba.underlyingAwardName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="multi-award" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Multi-Award Employee Configuration</CardTitle>
              <CardDescription>
                Employees covered by multiple awards or agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Primary Agreement</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Additional Agreements</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMultiAwardEmployees.map(emp => (
                    <TableRow key={emp.staffId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.role}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {agreementTypeLabels[emp.primaryAgreementType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {emp.classifications[0]?.classificationName}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {emp.additionalAgreements.map((aa, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {agreementTypeLabels[aa.agreementType]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(emp.updatedAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EBA Detail Dialog */}
      <Dialog open={!!selectedEBA} onOpenChange={() => setSelectedEBA(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEBA && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>{selectedEBA.name}</DialogTitle>
                    <DialogDescription>
                      {selectedEBA.code} • FWC: {selectedEBA.fwcApprovalNumber}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="classifications">Classifications</TabsTrigger>
                  <TabsTrigger value="allowances">Allowances</TabsTrigger>
                  <TabsTrigger value="penalties">Penalties</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Key Dates</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approval</span>
                            <span>{format(new Date(selectedEBA.approvalDate), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commencement</span>
                            <span>{format(new Date(selectedEBA.commencementDate), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Nominal Expiry</span>
                            <span>{format(new Date(selectedEBA.nominalExpiryDate), 'dd MMM yyyy')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Coverage</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">States</span>
                            <span>{selectedEBA.applicableStates.join(', ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Industry</span>
                            <span>{selectedEBA.industryClassifications.join(', ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Super Rate</span>
                            <span>{selectedEBA.superannuationRate}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">BOOT Reference</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This agreement is benchmarked against: <span className="font-medium text-foreground">{selectedEBA.underlyingAwardName}</span>
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="classifications" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Hourly Rate</TableHead>
                        <TableHead className="text-right">Annual Increase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEBA.classifications.map(cls => {
                        const rate = selectedEBA.payRates.find(r => r.classificationId === cls.id);
                        return (
                          <TableRow key={cls.id}>
                            <TableCell className="font-mono">{cls.code}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cls.name}</p>
                                <p className="text-xs text-muted-foreground">{cls.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>{cls.level}</TableCell>
                            <TableCell className="text-right font-medium">
                              {rate?.rateType === 'annual' 
                                ? `$${rate.baseRate.toLocaleString()}/yr`
                                : `$${rate?.baseRate.toFixed(2)}/hr`
                              }
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {rate?.annualIncreasePercent}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="allowances" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Allowance</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Taxable</TableHead>
                        <TableHead>Super</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEBA.allowances.map(alw => (
                        <TableRow key={alw.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{alw.name}</p>
                              <p className="text-xs text-muted-foreground">{alw.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${alw.amount.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{alw.frequency.replace('_', ' ')}</TableCell>
                          <TableCell>
                            {alw.isTaxable ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {alw.isSuperApplicable ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="penalties" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Weekend & Public Holiday</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Saturday</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.saturdayMultiplier}x</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Sunday</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.sundayMultiplier}x</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Public Holiday</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.publicHolidayMultiplier}x</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Overtime</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>First 2 hours</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.overtime.first2Hours}x</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>After 2 hours</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.overtime.after2Hours}x</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Casual Loading</span>
                          <Badge variant="secondary">{selectedEBA.penaltyRates.casualLoading}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="leave" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead className="text-right">Entitlement</TableHead>
                        <TableHead className="text-right">NES Minimum</TableHead>
                        <TableHead>Above NES</TableHead>
                        <TableHead>Accrual Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEBA.leaveEntitlements.map((leave, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{leave.leaveType}</TableCell>
                          <TableCell className="text-right">{leave.entitlementDays} days</TableCell>
                          <TableCell className="text-right text-muted-foreground">{leave.nesEntitlementDays} days</TableCell>
                          <TableCell>
                            {leave.exceedsNES ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700">+{leave.entitlementDays - (leave.nesEntitlementDays || 0)} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">NES Standard</span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{leave.accrualMethod}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedEBA(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Agreement
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Agreement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Enterprise Agreement</DialogTitle>
            <DialogDescription>
              Add a new enterprise agreement or individual flexibility arrangement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agreement Name</Label>
                <Input placeholder="e.g., ABC Childcare EBA 2024" />
              </div>
              <div className="space-y-2">
                <Label>Agreement Code</Label>
                <Input placeholder="e.g., ABC-EBA-2024" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agreement Type</Label>
                <Select defaultValue="enterprise_agreement">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                    <SelectItem value="individual_flexibility">Individual Flexibility Arrangement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Underlying Award</Label>
                <Select defaultValue="children-services-2020">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="children-services-2020">Children's Services Award 2020</SelectItem>
                    <SelectItem value="educational-services">Educational Services Award 2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Commencement Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Nominal Expiry</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>FWC Approval Number</Label>
                <Input placeholder="e.g., AE508123" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Coverage Description</Label>
              <Textarea placeholder="Describe which employees are covered by this agreement..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Enterprise Agreement created');
              setShowCreateDialog(false);
            }}>
              Create Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
