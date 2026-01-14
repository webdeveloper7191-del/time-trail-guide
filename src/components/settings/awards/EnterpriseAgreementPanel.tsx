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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  Upload,
  XCircle,
  ArrowRight,
  History,
  Layers,
  Percent,
  Sun,
  Moon,
  UserPlus,
  FileCheck,
  ChevronDown,
  Save,
  Eye,
  MapPin,
  Hash,
  Info,
  X,
} from 'lucide-react';
import { format, differenceInDays, isPast, addYears } from 'date-fns';
import {
  EnterpriseAgreement,
  EBAClassification,
  EBAPayRate,
  EBAAllowance,
  EBALeaveEntitlement,
  EBARedundancyScale,
  EBACondition,
  MultiAwardEmployee,
  AgreementType,
  AgreementStatus,
  agreementTypeLabels,
  agreementStatusLabels,
} from '@/types/enterpriseAgreement';
import { AustralianState, stateLabels } from '@/types/leaveAccrual';

// Comprehensive mock EBA data
const mockEBAs: EnterpriseAgreement[] = [
  {
    id: 'eba-1',
    name: 'ABC Childcare Centres Enterprise Agreement 2023',
    code: 'ABC-EBA-2023',
    type: 'enterprise_agreement',
    status: 'active',
    coverageDescription: 'All employees at ABC Childcare Centres across NSW, VIC and QLD',
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
      { id: 'c1', code: 'CSW-1', name: 'Support Worker Level 1', description: 'Entry level support worker', level: 1 },
      { id: 'c2', code: 'CSW-2', name: 'Support Worker Level 2', description: 'Experienced support worker', level: 2 },
      { id: 'c3', code: 'EDU-3', name: 'Educator Level 3', description: 'Qualified early childhood educator', level: 3 },
      { id: 'c4', code: 'EDU-4', name: 'Lead Educator', description: 'Room leader / Lead educator', level: 4 },
      { id: 'c5', code: 'DIR-5', name: 'Centre Director', description: 'Centre management', level: 5 },
    ],
    payRates: [
      { id: 'pr1', classificationId: 'c1', rateType: 'hourly', baseRate: 26.50, effectiveFrom: '2023-07-01', effectiveTo: '2024-06-30', annualIncreasePercent: 3.5 },
      { id: 'pr2', classificationId: 'c2', rateType: 'hourly', baseRate: 28.75, effectiveFrom: '2023-07-01', effectiveTo: '2024-06-30', annualIncreasePercent: 3.5 },
      { id: 'pr3', classificationId: 'c3', rateType: 'hourly', baseRate: 32.50, effectiveFrom: '2023-07-01', effectiveTo: '2024-06-30', annualIncreasePercent: 3.5 },
      { id: 'pr4', classificationId: 'c4', rateType: 'hourly', baseRate: 36.25, effectiveFrom: '2023-07-01', effectiveTo: '2024-06-30', annualIncreasePercent: 3.5 },
      { id: 'pr5', classificationId: 'c5', rateType: 'annual', baseRate: 85000, effectiveFrom: '2023-07-01', effectiveTo: '2024-06-30', annualIncreasePercent: 3.5 },
    ],
    allowances: [
      { id: 'a1', name: 'First Aid Allowance', code: 'FA', description: 'For designated first aid officers', amount: 18.50, frequency: 'per_week', conditions: 'Must hold current first aid certificate and be designated', isTaxable: true, isSuperApplicable: true },
      { id: 'a2', name: 'Educational Leader Allowance', code: 'EL', description: 'For designated educational leaders', amount: 2.50, frequency: 'per_hour', conditions: 'Appointed as educational leader under NQF', isTaxable: true, isSuperApplicable: true },
      { id: 'a3', name: 'Vehicle Allowance', code: 'VA', description: 'For use of personal vehicle for work purposes', amount: 0.96, frequency: 'per_occurrence', conditions: 'Per kilometre travelled for work', isTaxable: false, isSuperApplicable: false },
      { id: 'a4', name: 'Uniform Allowance', code: 'UA', description: 'For purchase and maintenance of uniforms', amount: 12.50, frequency: 'per_week', conditions: 'Where uniforms are required and not supplied', isTaxable: false, isSuperApplicable: false },
      { id: 'a5', name: 'Meal Allowance', code: 'MA', description: 'When required to work overtime without notice', amount: 22.00, frequency: 'per_occurrence', conditions: 'More than 2 hours overtime without 24h notice', isTaxable: false, isSuperApplicable: false },
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
      { leaveType: 'Personal/Carers Leave', entitlementDays: 12, accrualMethod: 'progressive', exceedsNES: true, nesEntitlementDays: 10 },
      { leaveType: 'Compassionate Leave', entitlementDays: 3, accrualMethod: 'immediate', exceedsNES: true, nesEntitlementDays: 2 },
      { leaveType: 'Parental Leave', entitlementDays: 52, accrualMethod: 'immediate', exceedsNES: false, nesEntitlementDays: 52 },
      { leaveType: 'Community Service Leave', entitlementDays: 10, accrualMethod: 'immediate', exceedsNES: true, nesEntitlementDays: 0 },
    ],
    superannuationRate: 11.5,
    redundancyScale: [
      { yearsOfService: 1, weeksPayEntitlement: 4 },
      { yearsOfService: 2, weeksPayEntitlement: 6 },
      { yearsOfService: 3, weeksPayEntitlement: 7 },
      { yearsOfService: 4, weeksPayEntitlement: 8 },
      { yearsOfService: 5, weeksPayEntitlement: 10 },
      { yearsOfService: 6, weeksPayEntitlement: 11 },
      { yearsOfService: 7, weeksPayEntitlement: 13 },
      { yearsOfService: 8, weeksPayEntitlement: 14 },
      { yearsOfService: 9, weeksPayEntitlement: 16 },
      { yearsOfService: 10, weeksPayEntitlement: 12 },
    ],
    conditions: [
      { id: 'cond1', category: 'hours', title: 'Ordinary Hours', description: '38 hours per week, worked between 6am and 7pm Monday to Friday', clauseReference: 'Clause 12' },
      { id: 'cond2', category: 'breaks', title: 'Meal Breaks', description: '30 minute unpaid meal break after 5 hours of continuous work', clauseReference: 'Clause 15.1' },
      { id: 'cond3', category: 'breaks', title: 'Rest Breaks', description: 'One 10 minute paid rest break per 4 hours worked', clauseReference: 'Clause 15.2' },
      { id: 'cond4', category: 'rosters', title: 'Roster Notice', description: 'Minimum 7 days notice for roster changes, 14 days for part-time', clauseReference: 'Clause 14' },
      { id: 'cond5', category: 'other', title: 'Notice Period', description: 'Based on years of service: <1yr=1wk, 1-3yr=2wks, 3-5yr=3wks, >5yr=4wks', clauseReference: 'Clause 22' },
    ],
    version: '1.0',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'eba-2',
    name: 'XYZ Aged Care Enterprise Agreement 2022',
    code: 'XYZ-AC-2022',
    type: 'enterprise_agreement',
    status: 'active',
    coverageDescription: 'All care and support workers at XYZ Aged Care facilities',
    applicableStates: ['VIC', 'SA', 'TAS'],
    industryClassifications: ['Aged Care', 'Healthcare'],
    approvalDate: '2022-09-01',
    commencementDate: '2022-10-01',
    nominalExpiryDate: '2025-09-30',
    fwcReference: 'AG2022/5678',
    fwcApprovalNumber: 'AE507890',
    underlyingAwardId: 'aged-care-2020',
    underlyingAwardName: "Aged Care Award 2020",
    classifications: [
      { id: 'ac1', code: 'PCW-1', name: 'Personal Care Worker Level 1', description: 'Entry level care worker', level: 1 },
      { id: 'ac2', code: 'PCW-2', name: 'Personal Care Worker Level 2', description: 'Experienced care worker', level: 2 },
      { id: 'ac3', code: 'AIN-3', name: 'Assistant in Nursing', description: 'Qualified AIN', level: 3 },
      { id: 'ac4', code: 'EN-4', name: 'Enrolled Nurse', description: 'Enrolled Nurse', level: 4 },
    ],
    payRates: [
      { id: 'apr1', classificationId: 'ac1', rateType: 'hourly', baseRate: 28.00, effectiveFrom: '2022-10-01', annualIncreasePercent: 4.0 },
      { id: 'apr2', classificationId: 'ac2', rateType: 'hourly', baseRate: 30.50, effectiveFrom: '2022-10-01', annualIncreasePercent: 4.0 },
      { id: 'apr3', classificationId: 'ac3', rateType: 'hourly', baseRate: 33.25, effectiveFrom: '2022-10-01', annualIncreasePercent: 4.0 },
      { id: 'apr4', classificationId: 'ac4', rateType: 'hourly', baseRate: 38.00, effectiveFrom: '2022-10-01', annualIncreasePercent: 4.0 },
    ],
    allowances: [
      { id: 'aa1', name: 'Laundry Allowance', code: 'LA', description: 'For laundering uniforms', amount: 8.50, frequency: 'per_week', conditions: 'Where uniforms must be laundered by employee', isTaxable: false, isSuperApplicable: false },
      { id: 'aa2', name: 'On-Call Allowance', code: 'OC', description: 'For being on-call outside normal hours', amount: 35.00, frequency: 'per_shift', conditions: 'When required to be available for call-back', isTaxable: true, isSuperApplicable: true },
    ],
    penaltyRates: {
      saturdayMultiplier: 1.5,
      sundayMultiplier: 1.75,
      publicHolidayMultiplier: 2.5,
      eveningShift: { startTime: '18:00', endTime: '00:00', multiplier: 1.15 },
      nightShift: { startTime: '00:00', endTime: '06:00', multiplier: 1.30 },
      overtime: { first2Hours: 1.5, after2Hours: 2.0, sundayOvertime: 2.0, publicHolidayOvertime: 2.5 },
      casualLoading: 25,
    },
    leaveEntitlements: [
      { leaveType: 'Annual Leave', entitlementDays: 20, accrualMethod: 'progressive', exceedsNES: false, nesEntitlementDays: 20 },
      { leaveType: 'Personal/Carers Leave', entitlementDays: 15, accrualMethod: 'progressive', exceedsNES: true, nesEntitlementDays: 10 },
    ],
    superannuationRate: 11.5,
    redundancyScale: [
      { yearsOfService: 1, weeksPayEntitlement: 4 },
      { yearsOfService: 2, weeksPayEntitlement: 6 },
      { yearsOfService: 5, weeksPayEntitlement: 10 },
    ],
    conditions: [
      { id: 'acond1', category: 'hours', title: 'Ordinary Hours', description: '38 hours per week on rotating rosters', clauseReference: 'Clause 10' },
    ],
    version: '2.1',
    createdAt: '2022-09-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: 'admin',
  },
];

// Mock multi-award employees
const mockMultiAwardEmployees: (MultiAwardEmployee & { name: string; role: string; email: string; location: string })[] = [
  {
    staffId: 'staff-1',
    name: 'Sarah Johnson',
    role: 'Lead Educator',
    email: 'sarah.johnson@abc.com',
    location: 'Sydney CBD',
    primaryAgreementId: 'eba-1',
    primaryAgreementType: 'enterprise_agreement',
    additionalAgreements: [
      { agreementId: 'children-services-2020', agreementType: 'modern_award', applicableConditions: ['BOOT reference rates'], priority: 2 },
    ],
    classifications: [
      { agreementId: 'eba-1', classificationId: 'c4', classificationName: 'Lead Educator', effectiveFrom: '2023-07-01' },
    ],
    updatedAt: '2024-01-15T00:00:00Z',
    updatedBy: 'admin',
  },
  {
    staffId: 'staff-2',
    name: 'Michael Chen',
    role: 'Senior Educator / Admin',
    email: 'michael.chen@abc.com',
    location: 'Melbourne',
    primaryAgreementId: 'eba-1',
    primaryAgreementType: 'enterprise_agreement',
    additionalAgreements: [
      { agreementId: 'clerks-private-2020', agreementType: 'modern_award', applicableConditions: ['Admin duties 20% of time'], priority: 2 },
    ],
    classifications: [
      { agreementId: 'eba-1', classificationId: 'c3', classificationName: 'Educator Level 3', effectiveFrom: '2023-07-01' },
    ],
    updatedAt: '2024-02-20T00:00:00Z',
    updatedBy: 'hr_manager',
  },
  {
    staffId: 'staff-3',
    name: 'Emma Williams',
    role: 'Care Worker / Kitchen Hand',
    email: 'emma.williams@xyz.com',
    location: 'Adelaide',
    primaryAgreementId: 'eba-2',
    primaryAgreementType: 'enterprise_agreement',
    additionalAgreements: [
      { agreementId: 'hospitality-2020', agreementType: 'modern_award', applicableConditions: ['Kitchen duties 30% of time'], priority: 2 },
    ],
    classifications: [
      { agreementId: 'eba-2', classificationId: 'ac2', classificationName: 'Personal Care Worker Level 2', effectiveFrom: '2022-10-01' },
    ],
    updatedAt: '2024-03-01T00:00:00Z',
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
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [showMultiAwardPanel, setShowMultiAwardPanel] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof mockMultiAwardEmployees)[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'all'>('all');
  const [selectedClassification, setSelectedClassification] = useState<EBAClassification | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state for new agreement
  const [newAgreement, setNewAgreement] = useState({
    name: '',
    code: '',
    type: 'enterprise_agreement' as AgreementType,
    underlyingAwardId: '',
    commencementDate: '',
    nominalExpiryDate: '',
    fwcApprovalNumber: '',
    coverageDescription: '',
    applicableStates: [] as AustralianState[],
    superannuationRate: 11.5,
  });

  // Comparison state
  const [compareAgreements, setCompareAgreements] = useState<string[]>([]);

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (isPast(new Date(expiryDate))) return { status: 'expired', message: 'Expired', color: 'text-red-600', badge: 'bg-red-500/10 text-red-700' };
    if (days <= 90) return { status: 'warning', message: `${days} days remaining`, color: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-700' };
    if (days <= 180) return { status: 'notice', message: `${days} days remaining`, color: 'text-blue-600', badge: 'bg-blue-500/10 text-blue-700' };
    return { status: 'ok', message: `${days} days remaining`, color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' };
  };

  const filteredEBAs = mockEBAs.filter(eba => {
    const matchesSearch = eba.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eba.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eba.fwcApprovalNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eba.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAgreement = () => {
    toast.success('Enterprise Agreement created successfully', {
      description: `${newAgreement.name} has been added to the system`,
    });
    setShowCreatePanel(false);
    setNewAgreement({
      name: '',
      code: '',
      type: 'enterprise_agreement',
      underlyingAwardId: '',
      commencementDate: '',
      nominalExpiryDate: '',
      fwcApprovalNumber: '',
      coverageDescription: '',
      applicableStates: [],
      superannuationRate: 11.5,
    });
  };

  const handleExportEBA = (eba: EnterpriseAgreement) => {
    toast.success('Agreement exported', {
      description: `${eba.name} exported to PDF`,
    });
  };

  const handleDuplicateEBA = (eba: EnterpriseAgreement) => {
    toast.success('Agreement duplicated', {
      description: `Copy of ${eba.name} created`,
    });
  };

  const toggleStateSelection = (state: AustralianState) => {
    setNewAgreement(prev => ({
      ...prev,
      applicableStates: prev.applicableStates.includes(state)
        ? prev.applicableStates.filter(s => s !== state)
        : [...prev.applicableStates, state],
    }));
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
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agreements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AgreementStatus | 'all')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowComparePanel(true)}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
              <Button variant="outline" onClick={() => setShowMultiAwardPanel(true)}>
                <Layers className="h-4 w-4 mr-2" />
                Multi-Award
              </Button>
              <Button onClick={() => setShowCreatePanel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Agreement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreements Grid */}
      <div className="space-y-4">
        {filteredEBAs.map(eba => {
          const expiryStatus = getExpiryStatus(eba.nominalExpiryDate);

          return (
            <Card 
              key={eba.id} 
              className="card-material-elevated hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => setSelectedEBA(eba)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{eba.name}</CardTitle>
                        <Badge className={statusColors[eba.status]}>
                          {agreementStatusLabels[eba.status]}
                        </Badge>
                        <Badge className={expiryStatus.badge}>
                          {expiryStatus.message}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{eba.code} • FWC: {eba.fwcApprovalNumber}</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Coverage</p>
                    <p className="font-medium">{eba.applicableStates.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Classifications</p>
                    <p className="font-medium">{eba.classifications.length} levels</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allowances</p>
                    <p className="font-medium">{eba.allowances.length} types</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commenced</p>
                    <p className="font-medium">{format(new Date(eba.commencementDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiry</p>
                    <p className={`font-medium ${expiryStatus.color}`}>{format(new Date(eba.nominalExpiryDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Super Rate</p>
                    <p className="font-medium">{eba.superannuationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EBA Detail Side Panel */}
      <Sheet open={!!selectedEBA} onOpenChange={() => { setSelectedEBA(null); setEditMode(false); }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedEBA && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{selectedEBA.name}</SheetTitle>
                    <SheetDescription>
                      {selectedEBA.code} • FWC: {selectedEBA.fwcApprovalNumber}
                    </SheetDescription>
                  </div>
                  <Badge className={statusColors[selectedEBA.status]}>
                    {agreementStatusLabels[selectedEBA.status]}
                  </Badge>
                </div>
              </SheetHeader>

              <Separator className="my-4" />

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="classifications">Pay</TabsTrigger>
                  <TabsTrigger value="allowances">Allowances</TabsTrigger>
                  <TabsTrigger value="penalties">Penalties</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Key Dates */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Key Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Approval</p>
                        <p className="font-medium">{format(new Date(selectedEBA.approvalDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Commencement</p>
                        <p className="font-medium">{format(new Date(selectedEBA.commencementDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Nominal Expiry</p>
                        <p className={`font-medium ${getExpiryStatus(selectedEBA.nominalExpiryDate).color}`}>
                          {format(new Date(selectedEBA.nominalExpiryDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coverage */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Coverage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Applicable States</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {selectedEBA.applicableStates.map(state => (
                            <Badge key={state} variant="secondary">{stateLabels[state]}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industries</p>
                        <p className="font-medium">{selectedEBA.industryClassifications.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{selectedEBA.coverageDescription}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* BOOT Reference */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        BOOT Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        This agreement is benchmarked against: 
                        <span className="font-medium ml-1">{selectedEBA.underlyingAwardName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Better Off Overall Test (BOOT) ensures employees are not disadvantaged
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conditions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Key Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {selectedEBA.conditions.map(cond => (
                          <AccordionItem key={cond.id} value={cond.id}>
                            <AccordionTrigger className="text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">{cond.category}</Badge>
                                {cond.title}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm text-muted-foreground">{cond.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">Reference: {cond.clauseReference}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Redundancy Scale */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Redundancy Scale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-2">
                        {selectedEBA.redundancyScale.slice(0, 5).map(scale => (
                          <div key={scale.yearsOfService} className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{scale.yearsOfService}yr{scale.yearsOfService > 1 ? 's' : ''}</p>
                            <p className="font-bold text-primary">{scale.weeksPayEntitlement}wks</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="classifications" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {selectedEBA.classifications.map(cls => {
                        const rate = selectedEBA.payRates.find(r => r.classificationId === cls.id);
                        return (
                          <Card key={cls.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">{cls.code}</Badge>
                                    <span className="font-medium">{cls.name}</span>
                                    <Badge variant="secondary">Level {cls.level}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">
                                    {rate?.rateType === 'annual' 
                                      ? `$${rate.baseRate.toLocaleString()}/yr`
                                      : `$${rate?.baseRate.toFixed(2)}/hr`
                                    }
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    +{rate?.annualIncreasePercent}% annual increase
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="allowances" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {selectedEBA.allowances.map(alw => (
                        <Card key={alw.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">{alw.code}</Badge>
                                  <span className="font-medium">{alw.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{alw.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">{alw.conditions}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">${alw.amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground capitalize">{alw.frequency.replace(/_/g, ' ')}</p>
                                <div className="flex gap-1 mt-2 justify-end">
                                  {alw.isTaxable && <Badge variant="secondary" className="text-xs">Taxable</Badge>}
                                  {alw.isSuperApplicable && <Badge variant="secondary" className="text-xs">Super</Badge>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="penalties" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Weekend & Public Holiday Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Saturday</p>
                          <p className="text-2xl font-bold text-primary">{selectedEBA.penaltyRates.saturdayMultiplier}x</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Sunday</p>
                          <p className="text-2xl font-bold text-primary">{selectedEBA.penaltyRates.sundayMultiplier}x</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Public Holiday</p>
                          <p className="text-2xl font-bold text-primary">{selectedEBA.penaltyRates.publicHolidayMultiplier}x</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Shift Penalties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Evening Shift</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedEBA.penaltyRates.eveningShift.startTime} - {selectedEBA.penaltyRates.eveningShift.endTime}
                          </p>
                          <p className="text-lg font-bold text-primary mt-1">{selectedEBA.penaltyRates.eveningShift.multiplier}x</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Moon className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">Night Shift</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedEBA.penaltyRates.nightShift.startTime} - {selectedEBA.penaltyRates.nightShift.endTime}
                          </p>
                          <p className="text-lg font-bold text-primary mt-1">{selectedEBA.penaltyRates.nightShift.multiplier}x</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Overtime Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                            <span className="text-sm">First 2 hours</span>
                            <Badge variant="secondary">{selectedEBA.penaltyRates.overtime.first2Hours}x</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                            <span className="text-sm">After 2 hours</span>
                            <Badge variant="secondary">{selectedEBA.penaltyRates.overtime.after2Hours}x</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                            <span className="text-sm">Sunday Overtime</span>
                            <Badge variant="secondary">{selectedEBA.penaltyRates.overtime.sundayOvertime}x</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                            <span className="text-sm">Casual Loading</span>
                            <Badge variant="secondary">{selectedEBA.penaltyRates.casualLoading}%</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="leave" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {selectedEBA.leaveEntitlements.map((leave, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{leave.leaveType}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  Accrual: {leave.accrualMethod}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{leave.entitlementDays}</p>
                                <p className="text-xs text-muted-foreground">days per year</p>
                              </div>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">NES Minimum: {leave.nesEntitlementDays} days</span>
                              {leave.exceedsNES ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700">
                                  +{leave.entitlementDays - (leave.nesEntitlementDays || 0)} above NES
                                </Badge>
                              ) : (
                                <Badge variant="secondary">NES Standard</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Superannuation */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Superannuation</p>
                              <p className="text-sm text-muted-foreground">
                                Employer contribution rate
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{selectedEBA.superannuationRate}%</p>
                              <p className="text-xs text-muted-foreground">of OTE</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <SheetFooter className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => handleDuplicateEBA(selectedEBA)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" onClick={() => handleExportEBA(selectedEBA)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Agreement
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Agreement Side Panel */}
      <Sheet open={showCreatePanel} onOpenChange={setShowCreatePanel}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Enterprise Agreement</SheetTitle>
            <SheetDescription>
              Add a new enterprise agreement or individual flexibility arrangement
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </h3>
              
              <div className="space-y-2">
                <Label>Agreement Name *</Label>
                <Input 
                  placeholder="e.g., ABC Childcare Enterprise Agreement 2024" 
                  value={newAgreement.name}
                  onChange={(e) => setNewAgreement(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agreement Code *</Label>
                  <Input 
                    placeholder="e.g., ABC-EBA-2024" 
                    value={newAgreement.code}
                    onChange={(e) => setNewAgreement(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agreement Type *</Label>
                  <Select 
                    value={newAgreement.type} 
                    onValueChange={(v) => setNewAgreement(prev => ({ ...prev, type: v as AgreementType }))}
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

            {/* Underlying Award & FWC */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                BOOT Reference & FWC Details
              </h3>
              
              <div className="space-y-2">
                <Label>Underlying Award (BOOT Reference) *</Label>
                <Select 
                  value={newAgreement.underlyingAwardId}
                  onValueChange={(v) => setNewAgreement(prev => ({ ...prev, underlyingAwardId: v }))}
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
                  value={newAgreement.fwcApprovalNumber}
                  onChange={(e) => setNewAgreement(prev => ({ ...prev, fwcApprovalNumber: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Dates */}
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
                    value={newAgreement.commencementDate}
                    onChange={(e) => setNewAgreement(prev => ({ ...prev, commencementDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nominal Expiry Date *</Label>
                  <Input 
                    type="date"
                    value={newAgreement.nominalExpiryDate}
                    onChange={(e) => setNewAgreement(prev => ({ ...prev, nominalExpiryDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Coverage */}
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
                        newAgreement.applicableStates.includes(state) 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => toggleStateSelection(state)}
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
                  value={newAgreement.coverageDescription}
                  onChange={(e) => setNewAgreement(prev => ({ ...prev, coverageDescription: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Superannuation */}
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
                  value={newAgreement.superannuationRate}
                  onChange={(e) => setNewAgreement(prev => ({ ...prev, superannuationRate: parseFloat(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Current SG minimum: 11.5%</p>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreatePanel(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAgreement}>
              <Save className="h-4 w-4 mr-2" />
              Create Agreement
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Compare Agreements Side Panel */}
      <Sheet open={showComparePanel} onOpenChange={setShowComparePanel}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Compare Agreements</SheetTitle>
            <SheetDescription>
              Select agreements to compare rates, allowances, and conditions
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Agreement</Label>
                <Select 
                  value={compareAgreements[0] || ''} 
                  onValueChange={(v) => setCompareAgreements(prev => [v, prev[1] || ''])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEBAs.map(eba => (
                      <SelectItem key={eba.id} value={eba.id}>{eba.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Second Agreement</Label>
                <Select 
                  value={compareAgreements[1] || ''} 
                  onValueChange={(v) => setCompareAgreements(prev => [prev[0] || '', v])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEBAs.map(eba => (
                      <SelectItem key={eba.id} value={eba.id}>{eba.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {compareAgreements[0] && compareAgreements[1] && (
              <div className="space-y-6 mt-6">
                {(() => {
                  const eba1 = mockEBAs.find(e => e.id === compareAgreements[0]);
                  const eba2 = mockEBAs.find(e => e.id === compareAgreements[1]);
                  if (!eba1 || !eba2) return null;

                  return (
                    <>
                      {/* Penalty Rates Comparison */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Penalty Rates Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Rate Type</TableHead>
                                <TableHead className="text-right">{eba1.code}</TableHead>
                                <TableHead className="text-right">{eba2.code}</TableHead>
                                <TableHead className="text-right">Difference</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Saturday</TableCell>
                                <TableCell className="text-right">{eba1.penaltyRates.saturdayMultiplier}x</TableCell>
                                <TableCell className="text-right">{eba2.penaltyRates.saturdayMultiplier}x</TableCell>
                                <TableCell className="text-right">
                                  {eba1.penaltyRates.saturdayMultiplier === eba2.penaltyRates.saturdayMultiplier ? (
                                    <Badge variant="secondary">Same</Badge>
                                  ) : (
                                    <Badge className={eba1.penaltyRates.saturdayMultiplier > eba2.penaltyRates.saturdayMultiplier ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}>
                                      {((eba1.penaltyRates.saturdayMultiplier - eba2.penaltyRates.saturdayMultiplier) * 100).toFixed(0)}%
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Sunday</TableCell>
                                <TableCell className="text-right">{eba1.penaltyRates.sundayMultiplier}x</TableCell>
                                <TableCell className="text-right">{eba2.penaltyRates.sundayMultiplier}x</TableCell>
                                <TableCell className="text-right">
                                  {eba1.penaltyRates.sundayMultiplier === eba2.penaltyRates.sundayMultiplier ? (
                                    <Badge variant="secondary">Same</Badge>
                                  ) : (
                                    <Badge className={eba1.penaltyRates.sundayMultiplier > eba2.penaltyRates.sundayMultiplier ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}>
                                      {((eba1.penaltyRates.sundayMultiplier - eba2.penaltyRates.sundayMultiplier) * 100).toFixed(0)}%
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Public Holiday</TableCell>
                                <TableCell className="text-right">{eba1.penaltyRates.publicHolidayMultiplier}x</TableCell>
                                <TableCell className="text-right">{eba2.penaltyRates.publicHolidayMultiplier}x</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">Same</Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Casual Loading</TableCell>
                                <TableCell className="text-right">{eba1.penaltyRates.casualLoading}%</TableCell>
                                <TableCell className="text-right">{eba2.penaltyRates.casualLoading}%</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">Same</Badge>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Leave Comparison */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Leave Entitlements Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Leave Type</TableHead>
                                <TableHead className="text-right">{eba1.code}</TableHead>
                                <TableHead className="text-right">{eba2.code}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {['Annual Leave', 'Personal/Carers Leave'].map(leaveType => {
                                const leave1 = eba1.leaveEntitlements.find(l => l.leaveType.includes(leaveType.split('/')[0]));
                                const leave2 = eba2.leaveEntitlements.find(l => l.leaveType.includes(leaveType.split('/')[0]));
                                return (
                                  <TableRow key={leaveType}>
                                    <TableCell>{leaveType}</TableCell>
                                    <TableCell className="text-right">{leave1?.entitlementDays || 'N/A'} days</TableCell>
                                    <TableCell className="text-right">{leave2?.entitlementDays || 'N/A'} days</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Super Comparison */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Superannuation Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <p className="text-sm text-muted-foreground">{eba1.code}</p>
                              <p className="text-2xl font-bold text-primary">{eba1.superannuationRate}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <p className="text-sm text-muted-foreground">{eba2.code}</p>
                              <p className="text-2xl font-bold text-primary">{eba2.superannuationRate}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowComparePanel(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Comparison
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Multi-Award Employee Management Side Panel */}
      <Sheet open={showMultiAwardPanel} onOpenChange={setShowMultiAwardPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Multi-Award Employee Configuration</SheetTitle>
            <SheetDescription>
              Manage employees covered by multiple awards or agreements
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Input 
                placeholder="Search employees..." 
                className="max-w-xs" 
              />
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {mockMultiAwardEmployees.map(emp => (
                  <Card 
                    key={emp.staffId} 
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.role}</p>
                            <p className="text-xs text-muted-foreground mt-1">{emp.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {agreementTypeLabels[emp.primaryAgreementType]}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            +{emp.additionalAgreements.length} additional
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Primary: {emp.classifications[0]?.classificationName}
                        </Badge>
                        {emp.additionalAgreements.map((aa, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-muted">
                            {aa.applicableConditions[0]}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowMultiAwardPanel(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Employee Detail Sub-Panel */}
      <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedEmployee && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle>{selectedEmployee.name}</SheetTitle>
                    <SheetDescription>{selectedEmployee.role}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Primary Agreement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Agreement Type</span>
                      <Badge>{agreementTypeLabels[selectedEmployee.primaryAgreementType]}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Classification</span>
                      <span className="font-medium">{selectedEmployee.classifications[0]?.classificationName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Effective From</span>
                      <span>{format(new Date(selectedEmployee.classifications[0]?.effectiveFrom || ''), 'dd MMM yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Additional Agreements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEmployee.additionalAgreements.map((aa, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/50 mb-2 last:mb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline">{agreementTypeLabels[aa.agreementType]}</Badge>
                            <p className="text-sm mt-2">Priority: {aa.priority}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Applicable Conditions:</p>
                          <p className="text-sm">{aa.applicableConditions.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contact & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="text-sm">{selectedEmployee.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm">{format(new Date(selectedEmployee.updatedAt), 'dd MMM yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Configuration
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
