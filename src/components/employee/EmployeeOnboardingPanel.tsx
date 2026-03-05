import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Upload, CheckCircle2, Clock, FileText, ShieldCheck, AlertCircle,
  Shirt, UtensilsCrossed, Phone, Car, Languages, Heart, ArrowRight,
  PartyPopper, Loader2, User, MapPin, Calendar, CreditCard, Building2,
  Plus, Trash2, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
type QuestionType = 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'file_upload';

interface OnboardingQuestion {
  id: string;
  question: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

interface ContractDocument {
  id: string;
  name: string;
  type: 'contract' | 'policy' | 'handbook';
  acknowledged: boolean;
}

interface EmergencyContactEntry {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

// ─── Mock Data ───────────────────────────────────────────────────
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

const onboardingQuestions: OnboardingQuestion[] = [
  { id: 'q1', question: 'Uniform / Shirt Size', description: 'Select your preferred uniform size for ordering', type: 'dropdown', required: true, options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] },
  { id: 'q2', question: 'Dietary Requirements', description: 'Any allergies or dietary needs we should know about', type: 'checkbox', required: false, options: ['Vegetarian', 'Vegan', 'Gluten Free', 'Halal', 'Kosher', 'Nut Allergy', 'Lactose Intolerant', 'None'] },
  { id: 'q6', question: "Do you have a valid driver's licence?", description: 'Required for roles involving driving', type: 'dropdown', required: false, options: ['Yes – Full Licence', 'Yes – Provisional', 'No'] },
  { id: 'q7', question: 'Languages Spoken', description: 'Languages you are comfortable communicating in', type: 'checkbox', required: false, options: ['English', 'Mandarin', 'Cantonese', 'Vietnamese', 'Arabic', 'Hindi', 'Spanish', 'Italian', 'Greek', 'Other'] },
  { id: 'q10', question: 'RSA Certificate', description: 'Upload your Responsible Service of Alcohol certificate', type: 'file_upload', required: true },
];

const contractDocuments: ContractDocument[] = [
  { id: 'c1', name: 'Employment Contract', type: 'contract', acknowledged: false },
  { id: 'c2', name: 'Workplace Health & Safety Policy', type: 'policy', acknowledged: false },
  { id: 'c3', name: 'Employee Handbook', type: 'handbook', acknowledged: false },
  { id: 'c4', name: 'Fair Work Information Statement', type: 'policy', acknowledged: false },
];

const questionIcons: Record<string, React.ElementType> = {
  q1: Shirt, q2: UtensilsCrossed, q6: Car, q7: Languages, q10: FileText,
};

const relationshipOptions = ['Spouse/Partner', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

// ─── Steps ───────────────────────────────────────────────────────
type Step = 'details' | 'emergency_contacts' | 'bank_super' | 'tax_declaration' | 'questions' | 'documents' | 'contracts' | 'complete';
const steps: { key: Step; label: string }[] = [
  { key: 'details', label: 'Your Details' },
  { key: 'emergency_contacts', label: 'Emergency Contacts' },
  { key: 'bank_super', label: 'Bank & Super' },
  { key: 'tax_declaration', label: 'Tax Declaration' },
  { key: 'questions', label: 'Questions' },
  { key: 'documents', label: 'Documents' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'complete', label: 'Complete' },
];

const stepOrder: Step[] = steps.map(s => s.key);

// ─── Helpers ─────────────────────────────────────────────────────
function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 text-primary border-border focus:ring-primary"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────
export function EmployeeOnboardingPanel() {
  const [currentStep, setCurrentStep] = useState<Step>('details');

  // Step 1 — Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    firstName: '', middleName: '', lastName: '', preferredName: '',
    email: '', mobilePhone: '', workPhone: '', gender: '', dateOfBirth: '',
    address: '', suburb: '', state: '', postcode: '',
  });

  // Step 2 — Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactEntry[]>([]);

  // Step 3 — Bank & Super
  const [bankDetails, setBankDetails] = useState({
    accountName: '', bsb: '', accountNumber: '', bankName: '',
  });
  const [superDetails, setSuperDetails] = useState({
    hasExistingFund: 'yes',
    fundType: 'apra',
    fundName: '', memberNumber: '', fundABN: '',
  });

  // Step 4 — Tax Declaration
  const [taxDeclaration, setTaxDeclaration] = useState({
    tfn: '', noTFN: false,
    payBasis: 'full_time',
    residencyStatus: 'resident',
    incomeType: 'salary_wages',
    employmentType: 'employee',
    claimTaxFreeThreshold: true,
    claimZoneOffset: false,
    hasHELPDebt: false,
    hasFinancialSupplement: false,
    hasPreviousFamilyName: false,
    employerClaimZone: 'no',
    employerClaimTaxFree: 'yes',
    employerHELPDebt: 'no',
  });

  // Step 5 — Onboarding Questions
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Step 6 — Uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  // Step 7 — Contracts
  const [contracts, setContracts] = useState<ContractDocument[]>(contractDocuments);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = steps.findIndex(s => s.key === currentStep);

  // ─── Progress Calculation ──────────────────────────────────────
  const detailsRequiredFields = ['firstName', 'lastName', 'email', 'mobilePhone'] as const;
  const detailsFilled = detailsRequiredFields.filter(f => personalDetails[f].trim() !== '').length;

  const emergencyFilled = emergencyContacts.length > 0 ? 1 : 0;

  const bankRequiredFields = ['accountName', 'bsb', 'accountNumber'] as const;
  const bankFilled = bankRequiredFields.filter(f => bankDetails[f].trim() !== '').length;

  const taxFilled = (taxDeclaration.tfn.trim() !== '' || taxDeclaration.noTFN) ? 1 : 0;

  const requiredQuestions = onboardingQuestions.filter(q => q.required && q.type !== 'file_upload');
  const answeredQuestions = requiredQuestions.filter(q => {
    const a = answers[q.id];
    return a && (Array.isArray(a) ? a.length > 0 : a.trim() !== '');
  }).length;

  const fileQuestions = onboardingQuestions.filter(q => q.type === 'file_upload' && q.required);
  const uploadedCount = fileQuestions.filter(q => !!uploadedFiles[q.id]).length;

  const acknowledgedContracts = contracts.filter(c => c.acknowledged).length;

  const totalItems = detailsRequiredFields.length + 1 + bankRequiredFields.length + 1 + requiredQuestions.length + fileQuestions.length + contracts.length;
  const completedItems = detailsFilled + emergencyFilled + bankFilled + taxFilled + answeredQuestions + uploadedCount + acknowledgedContracts;
  const progressPct = Math.round((completedItems / totalItems) * 100);

  // ─── Handlers ──────────────────────────────────────────────────
  const updateDetail = (field: string, value: string) =>
    setPersonalDetails(prev => ({ ...prev, [field]: value }));

  const updateAnswer = (id: string, value: string | string[]) =>
    setAnswers(prev => ({ ...prev, [id]: value }));

  const toggleCheckboxOption = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      return {
        ...prev,
        [questionId]: current.includes(option)
          ? current.filter(o => o !== option)
          : [...current, option],
      };
    });
  };

  const handleFileUpload = (questionId: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [questionId]: file.name }));
    toast.success(`${file.name} uploaded`);
  };

  const toggleContract = (id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, acknowledged: !c.acknowledged } : c));
  };

  // Emergency Contacts
  const addEmergencyContact = () => {
    setEmergencyContacts(prev => [...prev, { id: `ec-${Date.now()}`, name: '', phone: '', relationship: '' }]);
  };

  const updateEmergencyContact = (id: string, field: keyof EmergencyContactEntry, value: string) => {
    setEmergencyContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  const canProceed = () => {
    if (currentStep === 'details') {
      return detailsRequiredFields.every(f => personalDetails[f].trim() !== '');
    }
    if (currentStep === 'emergency_contacts') return true; // optional
    if (currentStep === 'bank_super') return true; // can skip
    if (currentStep === 'tax_declaration') return true; // can skip
    if (currentStep === 'questions') {
      return requiredQuestions.every(q => {
        const a = answers[q.id];
        return a && (Array.isArray(a) ? a.length > 0 : a.trim() !== '');
      });
    }
    if (currentStep === 'documents') {
      return fileQuestions.every(q => !!uploadedFiles[q.id]);
    }
    if (currentStep === 'contracts') {
      return contracts.every(c => c.acknowledged);
    }
    return true;
  };

  const handleNext = () => {
    const idx = stepOrder.indexOf(currentStep);
    if (currentStep === 'contracts') {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setCurrentStep('complete');
        toast.success('Onboarding completed successfully!');
      }, 1500);
    } else if (idx < stepOrder.length - 1) {
      setCurrentStep(stepOrder[idx + 1]);
    }
  };

  const handleBack = () => {
    const idx = stepOrder.indexOf(currentStep);
    if (idx > 0) setCurrentStep(stepOrder[idx - 1]);
  };

  // ─── Complete ──────────────────────────────────────────────────
  if (currentStep === 'complete') {
    return (
      <Card className="max-w-2xl mx-auto border-border/50">
        <CardContent className="py-16 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">You're all set!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your onboarding is complete. All your details have been submitted and your documents are being processed. Welcome to the team!
          </p>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Onboarding Complete
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Onboarding Progress</p>
            <span className="text-sm font-bold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2 mb-4" />
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-1.5 shrink-0">
                  <div className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isDone ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-xs hidden lg:inline',
                    isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}>{step.label}</span>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'hidden lg:block w-6 h-px mx-0.5',
                      isDone ? 'bg-emerald-500' : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ STEP 1: Your Details ═══════ */}
      {currentStep === 'details' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Your Details
            </CardTitle>
            <CardDescription>Please provide your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldGroup label="First Name" required>
                  <Input value={personalDetails.firstName} onChange={e => updateDetail('firstName', e.target.value)} placeholder="Enter your first name" />
                </FieldGroup>
                <FieldGroup label="Middle Name/s">
                  <Input value={personalDetails.middleName} onChange={e => updateDetail('middleName', e.target.value)} placeholder="Enter your middle name" />
                </FieldGroup>
                <FieldGroup label="Last Name" required>
                  <Input value={personalDetails.lastName} onChange={e => updateDetail('lastName', e.target.value)} placeholder="Enter your last name" />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FieldGroup label="Preferred Name">
                  <Input value={personalDetails.preferredName} onChange={e => updateDetail('preferredName', e.target.value)} placeholder="Enter your preferred name" />
                </FieldGroup>
                <FieldGroup label="Email Address" required>
                  <Input type="email" value={personalDetails.email} onChange={e => updateDetail('email', e.target.value)} placeholder="Enter your email address" />
                </FieldGroup>
              </div>
            </section>

            <hr className="border-border/50" />

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Mobile Number" required>
                  <Input type="tel" value={personalDetails.mobilePhone} onChange={e => updateDetail('mobilePhone', e.target.value)} placeholder="+61" />
                </FieldGroup>
                <FieldGroup label="Work Number">
                  <Input type="tel" value={personalDetails.workPhone} onChange={e => updateDetail('workPhone', e.target.value)} placeholder="+61" />
                </FieldGroup>
              </div>
            </section>

            <hr className="border-border/50" />

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Gender">
                  <Select value={personalDetails.gender} onValueChange={v => updateDetail('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Date of Birth">
                  <Input type="date" value={personalDetails.dateOfBirth} onChange={e => updateDetail('dateOfBirth', e.target.value)} />
                </FieldGroup>
              </div>
            </section>

            <hr className="border-border/50" />

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Address
              </h3>
              <div className="space-y-4">
                <FieldGroup label="Street Address">
                  <Input value={personalDetails.address} onChange={e => updateDetail('address', e.target.value)} placeholder="Enter your street address" />
                </FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldGroup label="Suburb / City">
                    <Input value={personalDetails.suburb} onChange={e => updateDetail('suburb', e.target.value)} placeholder="Suburb" />
                  </FieldGroup>
                  <FieldGroup label="State">
                    <Select value={personalDetails.state} onValueChange={v => updateDetail('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Postcode">
                    <Input value={personalDetails.postcode} onChange={e => updateDetail('postcode', e.target.value)} placeholder="0000" />
                  </FieldGroup>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      )}

      {/* ═══════ STEP 2: Emergency Contacts ═══════ */}
      {currentStep === 'emergency_contacts' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Emergency Contacts
            </CardTitle>
            <CardDescription>Add your emergency contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">No emergency contacts added</p>
                <p className="text-sm text-muted-foreground mt-1">Add at least one emergency contact</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={addEmergencyContact}>
                  <Plus className="h-4 w-4 mr-2" /> New Emergency Contact
                </Button>
              </div>
            ) : (
              <>
                {emergencyContacts.map((contact, idx) => (
                  <div key={contact.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Contact {idx + 1}</h4>
                      <Button variant="ghost" size="sm" onClick={() => removeEmergencyContact(contact.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FieldGroup label="Contact Name" required>
                        <Input
                          value={contact.name}
                          onChange={e => updateEmergencyContact(contact.id, 'name', e.target.value)}
                          placeholder="Enter contact name"
                        />
                      </FieldGroup>
                      <FieldGroup label="Mobile Number" required>
                        <Input
                          type="tel"
                          value={contact.phone}
                          onChange={e => updateEmergencyContact(contact.id, 'phone', e.target.value)}
                          placeholder="+61"
                        />
                      </FieldGroup>
                      <FieldGroup label="Relationship to Employee" required>
                        <Select value={contact.relationship} onValueChange={v => updateEmergencyContact(contact.id, 'relationship', v)}>
                          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                          <SelectContent>
                            {relationshipOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addEmergencyContact}>
                  <Plus className="h-4 w-4 mr-2" /> Add Another Contact
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════ STEP 3: Bank & Super Details ═══════ */}
      {currentStep === 'bank_super' && (
        <div className="space-y-6">
          {/* Bank Details */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Bank Details
              </CardTitle>
              <CardDescription>Enter your bank account details for payroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Account Name" required>
                  <Input
                    value={bankDetails.accountName}
                    onChange={e => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g. John Citizen"
                  />
                </FieldGroup>
                <FieldGroup label="Bank Name" required>
                  <Input
                    value={bankDetails.bankName}
                    onChange={e => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. National Australia Bank (NAB)"
                  />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="BSB Number" required>
                  <Input
                    value={bankDetails.bsb}
                    onChange={e => setBankDetails(prev => ({ ...prev, bsb: e.target.value }))}
                    placeholder="e.g. 123-456"
                  />
                </FieldGroup>
                <FieldGroup label="Account Number" required>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="e.g. 12345678"
                  />
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Super Fund */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" /> Super Fund
              </CardTitle>
              <CardDescription>Set up your superannuation fund details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Do you have an existing Super Fund account?</Label>
                <RadioGroup
                  value={superDetails.hasExistingFund}
                  onChange={v => setSuperDetails(prev => ({ ...prev, hasExistingFund: v }))}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No (Create my account with your chosen fund partner.)', value: 'no' },
                  ]}
                />
              </div>

              {superDetails.hasExistingFund === 'yes' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Please select type of Super Fund?</Label>
                    <RadioGroup
                      value={superDetails.fundType}
                      onChange={v => setSuperDetails(prev => ({ ...prev, fundType: v }))}
                      options={[
                        { label: 'APRA-regulated fund', value: 'apra' },
                        { label: 'SMSF', value: 'smsf' },
                      ]}
                    />
                  </div>

                  <FieldGroup label="Super Fund Legal Name" required>
                    <Input
                      value={superDetails.fundName}
                      onChange={e => setSuperDetails(prev => ({ ...prev, fundName: e.target.value }))}
                      placeholder="Select or enter Super Fund name"
                    />
                  </FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Membership Number" required>
                      <Input
                        value={superDetails.memberNumber}
                        onChange={e => setSuperDetails(prev => ({ ...prev, memberNumber: e.target.value }))}
                        placeholder="e.g. ABC12345"
                      />
                    </FieldGroup>
                    <FieldGroup label="Fund ABN" required>
                      <Input
                        value={superDetails.fundABN}
                        onChange={e => setSuperDetails(prev => ({ ...prev, fundABN: e.target.value }))}
                        placeholder="e.g. 12345678901"
                      />
                    </FieldGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Upload Letter of Compliance (optional)</Label>
                    <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <input type="file" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) toast.success(`${file.name} uploaded`);
                      }} />
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Select a file or drag and drop here</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG or PDF, file size no more than 10MB</p>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════ STEP 4: Tax Declaration ═══════ */}
      {currentStep === 'tax_declaration' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Tax Declaration
            </CardTitle>
            <CardDescription>Complete your TFN declaration for tax purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TFN */}
            <section className="space-y-3">
              <FieldGroup label="Enter your Tax File Number (TFN)">
                <Input
                  value={taxDeclaration.tfn}
                  onChange={e => setTaxDeclaration(prev => ({ ...prev, tfn: e.target.value }))}
                  placeholder="Enter TFN Number"
                  disabled={taxDeclaration.noTFN}
                />
              </FieldGroup>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={taxDeclaration.noTFN}
                  onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, noTFN: !!checked, tfn: checked ? '' : prev.tfn }))}
                />
                I do not have a Tax File Number
              </label>
            </section>

            <hr className="border-border/50" />

            {/* Pay Basis */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Pay basis</h3>
              <RadioGroup
                value={taxDeclaration.payBasis}
                onChange={v => setTaxDeclaration(prev => ({ ...prev, payBasis: v }))}
                options={[
                  { label: 'Full Time', value: 'full_time' },
                  { label: 'Part Time', value: 'part_time' },
                  { label: 'Casual', value: 'casual' },
                ]}
              />
            </section>

            <hr className="border-border/50" />

            {/* Residency */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Residency status</h3>
              <RadioGroup
                value={taxDeclaration.residencyStatus}
                onChange={v => setTaxDeclaration(prev => ({ ...prev, residencyStatus: v }))}
                options={[
                  { label: 'Australian resident for tax purposes', value: 'resident' },
                  { label: 'Foreign resident for tax purposes', value: 'foreign' },
                ]}
              />
            </section>

            <hr className="border-border/50" />

            {/* Income Type */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Income type</h3>
              <RadioGroup
                value={taxDeclaration.incomeType}
                onChange={v => setTaxDeclaration(prev => ({ ...prev, incomeType: v }))}
                options={[
                  { label: 'Salary and wages', value: 'salary_wages' },
                  { label: 'Working holiday maker', value: 'working_holiday' },
                  { label: 'Closely held payee', value: 'closely_held' },
                ]}
              />
            </section>

            <hr className="border-border/50" />

            {/* Employment Type */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Employment Type</h3>
              <RadioGroup
                value={taxDeclaration.employmentType}
                onChange={v => setTaxDeclaration(prev => ({ ...prev, employmentType: v }))}
                options={[
                  { label: 'Employee', value: 'employee' },
                ]}
              />
            </section>

            <hr className="border-border/50" />

            {/* Tax Additional Information */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Tax Additional Information</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={taxDeclaration.claimTaxFreeThreshold}
                    onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, claimTaxFreeThreshold: !!checked }))}
                    className="mt-0.5"
                  />
                  I want to claim the tax-free threshold
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={taxDeclaration.claimZoneOffset}
                    onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, claimZoneOffset: !!checked }))}
                    className="mt-0.5"
                  />
                  I want to claim a zone, overseas forces or invalid and invalid carer tax offset
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={taxDeclaration.hasHELPDebt}
                    onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, hasHELPDebt: !!checked }))}
                    className="mt-0.5"
                  />
                  I have a Higher Education Loan Program (HELP), Student Startup Loan (SSL) or Trade Support Loan (TSL) debt
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={taxDeclaration.hasFinancialSupplement}
                    onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, hasFinancialSupplement: !!checked }))}
                    className="mt-0.5"
                  />
                  I have a Financial Supplement debt
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={taxDeclaration.hasPreviousFamilyName}
                    onCheckedChange={checked => setTaxDeclaration(prev => ({ ...prev, hasPreviousFamilyName: !!checked }))}
                    className="mt-0.5"
                  />
                  I have a previous family name
                </label>
              </div>
            </section>

            <hr className="border-border/50" />

            {/* Additional Information */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Does this employee claim a zone, overseas forces or invalid carer tax offset from this employer?</p>
                <RadioGroup
                  value={taxDeclaration.employerClaimZone}
                  onChange={v => setTaxDeclaration(prev => ({ ...prev, employerClaimZone: v }))}
                  options={[
                    { label: 'Yes, claim it', value: 'yes' },
                    { label: "No, don't claim it", value: 'no' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Does this employee claim the tax free threshold from this employer?</p>
                <RadioGroup
                  value={taxDeclaration.employerClaimTaxFree}
                  onChange={v => setTaxDeclaration(prev => ({ ...prev, employerClaimTaxFree: v }))}
                  options={[
                    { label: 'Yes, claim it', value: 'yes' },
                    { label: "No, don't claim it", value: 'no' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Does this employee have a Higher Education Loan Program (HELP), Student Startup Loan (SSL), Trade Support Loan (TSL) debt?</p>
                <RadioGroup
                  value={taxDeclaration.employerHELPDebt}
                  onChange={v => setTaxDeclaration(prev => ({ ...prev, employerHELPDebt: v }))}
                  options={[
                    { label: 'Yes, they have this debt', value: 'yes' },
                    { label: "No, they don't have this debt", value: 'no' },
                  ]}
                />
              </div>
            </section>
          </CardContent>
        </Card>
      )}

      {/* ═══════ STEP 5: Onboarding Questions ═══════ */}
      {currentStep === 'questions' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Questions</CardTitle>
            <CardDescription>Please fill in the additional information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {onboardingQuestions.filter(q => q.type !== 'file_upload').map(q => {
              const Icon = questionIcons[q.id] || FileText;
              return (
                <div key={q.id} className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-primary" />
                    {q.question}
                    {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}

                  {q.type === 'text' && (
                    <Input
                      value={(answers[q.id] as string) || ''}
                      onChange={e => updateAnswer(q.id, e.target.value)}
                      placeholder="Enter your answer..."
                    />
                  )}
                  {q.type === 'textarea' && (
                    <Textarea
                      value={(answers[q.id] as string) || ''}
                      onChange={e => updateAnswer(q.id, e.target.value)}
                      placeholder="Enter your answer..."
                    />
                  )}
                  {q.type === 'dropdown' && (
                    <Select value={(answers[q.id] as string) || ''} onValueChange={v => updateAnswer(q.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                      <SelectContent>
                        {q.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {q.type === 'checkbox' && q.options && (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map(opt => {
                        const checked = ((answers[q.id] as string[]) || []).includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox checked={checked} onCheckedChange={() => toggleCheckboxOption(q.id, opt)} />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ═══════ STEP 6: Documents ═══════ */}
      {currentStep === 'documents' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Document Uploads</CardTitle>
            <CardDescription>Upload required compliance documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingQuestions.filter(q => q.type === 'file_upload').map(q => {
              const uploaded = uploadedFiles[q.id];
              return (
                <div key={q.id} className={cn(
                  'p-4 rounded-lg border-2 border-dashed transition-colors',
                  uploaded ? 'border-emerald-300 bg-emerald-50/50' : 'border-border hover:border-primary/50'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        uploaded ? 'bg-emerald-100' : 'bg-muted'
                      )}>
                        {uploaded ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {q.question} {q.required && <span className="text-destructive">*</span>}
                        </p>
                        {q.description && <p className="text-xs text-muted-foreground">{q.description}</p>}
                        {uploaded && <p className="text-xs text-emerald-600 mt-0.5">{uploaded}</p>}
                      </div>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(q.id, file);
                        }}
                      />
                      <Button variant={uploaded ? 'outline' : 'default'} size="sm" asChild>
                        <span>{uploaded ? 'Replace' : 'Upload'}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              );
            })}

            {onboardingQuestions.filter(q => q.type === 'file_upload').length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">No documents required</p>
                <p className="text-sm">You can proceed to the next step</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════ STEP 7: Contracts ═══════ */}
      {currentStep === 'contracts' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Contracts & Policies</CardTitle>
            <CardDescription>Review and acknowledge each document to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contracts.map(doc => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer',
                  doc.acknowledged
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-border hover:bg-muted/30'
                )}
                onClick={() => toggleContract(doc.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={doc.acknowledged} onCheckedChange={() => toggleContract(doc.id)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toast.info(`Viewing ${doc.name}`); }}>
                  <FileText className="h-4 w-4 mr-1" /> View
                </Button>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                By acknowledging these documents, you confirm you have read and agree to their terms.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 'details'}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {currentStep === 'contracts' ? 'Submit Onboarding' : 'Continue'}
          {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
